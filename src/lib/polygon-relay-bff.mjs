import { createHash, createHmac } from 'node:crypto';
import { betterAuthConfig, betterAuthCookies, trustedAuthClientIp } from './better-auth-bridge.mjs';
import { coreFetch, runtimeEnvironment } from './cloudflare-runtime.mjs';
import { memberMutationError } from './member-mutation-policy.mjs';
import { boundedServiceRequest } from './private-service-request.mjs';
import { readBoundedRequestJson } from './bounded-request-json.mjs';
import { FUNDING_UUID } from './wallet-funding-contract.mjs';
import { polygonRelayInput, polygonRelayView, polygonRelayHistory, polygonRelayCapabilities } from './polygon-relay-contract.mjs';
import { isPersonalPortalOrigin } from './personal-portal-origin.mjs';
const reply = (value, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } });
const safeErrors = new Set(['unauthenticated', 'invalid_origin', 'invalid_request', 'polygon_relay_unavailable', 'polygon_relay_unconfigured',
  'polygon_relay_wallet_not_linked', 'polygon_relay_forbidden', 'polygon_relay_rate_limited', 'polygon_relay_budget_exceeded', 'polygon_relay_pending_exists',
  'polygon_relay_not_found', 'polygon_relay_request_already_used', 'polygon_relay_expired', 'polygon_relay_invalid_transition',
  'polygon_relay_invalid_authorization', 'polygon_relay_nonce_changed', 'polygon_relay_insufficient_balance', 'polygon_relay_broadcast_disabled',
  'polygon_relay_sponsorship_unavailable', 'polygon_relay_rpc_unavailable', 'polygon_relay_transaction_pending', 'polygon_relay_transaction_mismatch',
  'polygon_relay_ambiguous', 'polygon_relay_authorization_reused']);
for (const code of ['signature_invalid', 'contract_changed', 'authorization_unavailable', 'fee_unavailable', 'provider_unavailable',
  'sponsorship_rejected', 'broadcast_ambiguous', 'confirmation_conflict', 'budget_unavailable', 'invalid_request', 'authorization_conflict',
  'authorization_nonce_changed', 'nonce_reserved', 'attempt_conflict', 'account_busy', 'operation_locked', 'lease_expired',
  'operation_conflict', 'queue_busy', 'lease_active', 'lease_lost', 'requires_fresh_review', 'receipt_conflict', 'authorization_required', 'proof_unavailable']) safeErrors.add(`polygon_relay_${code}`);
const legacyErrors = Object.freeze({ company_payment_pending_exists: 'polygon_relay_pending_exists',
  company_payment_insufficient_balance: 'polygon_relay_insufficient_balance', company_payment_request_already_used: 'polygon_relay_request_already_used',
  company_payment_rpc_unavailable: 'polygon_relay_rpc_unavailable' });
/** This is a fixed transfer service, never a public Pimlico JSON-RPC proxy. */
export async function handlePolygonRelay(request, action, { env = runtimeEnvironment(), fetchImpl = coreFetch, serviceRequest = boundedServiceRequest } = {}) {
  if (!['capabilities', 'prepare', 'authorize', 'submit', 'verify', 'abandon', 'status', 'history'].includes(action)) return reply({ error: 'invalid_request' }, 400);
  if (env.NODE_ENV === 'production' && !isPersonalPortalOrigin(env.AUTH_PUBLIC_ORIGIN)) return reply({ error: 'not_found' }, 404);
  const method = ['capabilities', 'status', 'history'].includes(action) ? 'GET' : 'POST';
  if (request.method !== method) return reply({ error: 'method_not_allowed' }, 405);
  const cookie = betterAuthCookies(request.headers.get('cookie') || '');
  if (!cookie.split(';').some(part => /^(?:__Secure-)?better-auth\.session_token=[^;\s,]+$/.test(part.trim()))) return reply({ error: 'unauthenticated' }, 401);
  if (env.PERSONAL_POLYGON_RELAY_ENABLED !== 'true') return reply({ error: 'polygon_relay_unconfigured' }, 503);
  const url = new URL(request.url); let input, paymentId;
  if (method === 'POST') {
    const denied = memberMutationError(request, env); if (denied) return reply({ error: denied.error }, denied.status);
    if (url.search) return reply({ error: 'invalid_request' }, 400);
    try { input = polygonRelayInput(action, await readBoundedRequestJson(request, { maxBytes: 4096, timeoutMs: 8000 })); }
    catch (error) {
      if (error?.message === 'request_body_unavailable') return reply({ error: 'polygon_relay_unavailable' }, 503);
      return reply({ error: error?.message === 'request_too_large' ? 'request_too_large' : 'invalid_request' }, error?.message === 'request_too_large' ? 413 : 400);
    }
    if (!input) return reply({ error: 'invalid_request' }, 400);
  } else if (action === 'status') {
    paymentId = url.searchParams.get('paymentId');
    if (!FUNDING_UUID.test(paymentId || '') || paymentId !== paymentId.toLowerCase() || url.search !== `?paymentId=${paymentId}`) return reply({ error: 'invalid_request' }, 400);
  } else if (url.search) return reply({ error: 'invalid_request' }, 400);
  const path = `/api/member/polygon-relay/${action}${paymentId ? `?paymentId=${paymentId}` : ''}`;
  try {
    const base = betterAuthConfig(env), serialized = input ? JSON.stringify(input) : '';
    const ip = trustedAuthClientIp(request.headers, env), timestamp = String(Math.floor(Date.now() / 1000));
    const hash = value => createHash('sha256').update(value).digest('hex');
    const signature = createHmac('sha256', env.AUTH_BFF_SHARED_SECRET).update([method, path.split('?')[0], timestamp, ip, hash(cookie), hash(serialized)].join('\n')).digest('hex');
    const result = await serviceRequest(`${base}${path}`, { method, signal: request.signal, body: serialized || undefined,
      headers: { cookie, origin: method === 'GET' ? env.AUTH_PUBLIC_ORIGIN : request.headers.get('origin') || '',
        ...(input ? { 'content-type': 'application/json' } : {}), 'x-vp-auth-client-ip': ip, 'x-vp-auth-timestamp': timestamp, 'x-vp-auth-signature': signature } }, fetchImpl);
    if (!result.ok) {
      const code = result.data?.error;
      return reply({ error: typeof code === 'string' && Object.hasOwn(legacyErrors, code) ? legacyErrors[code]
        : safeErrors.has(code) ? code : 'polygon_relay_unavailable' },
      [400, 401, 403, 404, 409, 413, 429, 503].includes(result.status) ? result.status : 502);
    }
    const safe = action === 'capabilities' ? polygonRelayCapabilities(result.data) : action === 'history' ? polygonRelayHistory(result.data) : polygonRelayView(result.data);
    if (!safe || (!['capabilities', 'history'].includes(action) && (!('paymentId' in safe) || safe.paymentId !== (paymentId || input.paymentId || input.requestId)))
      || (action === 'prepare' && (!('amountAtomic' in safe) || safe.amountAtomic !== input.amountAtomic || !('typedData' in safe) || (safe.status === 'prepared' && !safe.typedData)))) return reply({ error: 'polygon_relay_unavailable' }, 502);
    if (action === 'abandon' && (!('status' in safe) || safe.status !== 'expired' || safe.failureReason !== 'preparation_abandoned')) return reply({ error: 'polygon_relay_unavailable' }, 502);
    return reply(safe);
  } catch { return reply({ error: 'polygon_relay_unavailable' }, 503); }
}
