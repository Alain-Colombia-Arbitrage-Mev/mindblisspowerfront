import { createHash, createHmac } from 'node:crypto';
import { betterAuthConfig, betterAuthCookies, trustedAuthClientIp } from './better-auth-bridge.mjs';
import { coreFetch, runtimeEnvironment } from './cloudflare-runtime.mjs';
import { memberMutationError } from './member-mutation-policy.mjs';
import { boundedServiceRequest } from './private-service-request.mjs';
import { browserRequestDeadline } from './browser-request-deadline.mjs';
import { SOLANA_UUID, solanaWalletLinkInput, solanaWalletLinkView, solanaPaymentInput, solanaPaymentView, solanaPaymentHistory, solanaBalanceView, solanaCapabilitiesView } from './solana-wallet-contract.mjs';

const reply = (value, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } });
const linkErrors = ['wallet_link_rate_limited', 'wallet_already_linked', 'wallet_address_in_use', 'invalid_wallet_address',
  'wallet_challenge_invalid', 'wallet_signature_invalid', 'wallet_identity_unavailable', 'wallet_link_unavailable'];
export const SOLANA_SAFE_ERRORS = new Set(['unauthenticated', 'invalid_origin', 'invalid_request', 'solana_wallet_unavailable',
  ...linkErrors, 'solana_payment_unavailable', 'solana_payment_unconfigured', 'solana_payment_wallet_not_linked',
  'solana_payment_insufficient_balance', 'solana_payment_pending', 'solana_payment_pending_exists', 'solana_payment_not_found',
  'solana_payment_request_already_used', 'solana_payment_invalid_transition', 'solana_payment_transaction_mismatch',
  'solana_payment_rate_limited', 'solana_payment_rpc_unavailable', 'solana_payment_expired', 'solana_payment_sponsorship_unavailable',
  'solana_payment_broadcast_disabled', 'solana_payment_ambiguous', 'solana_payment_signature_invalid']);
for (const code of ['provider_unconfigured', 'provider_unavailable', 'fee_unavailable', 'broadcast_ambiguous', 'transaction_pending',
  'confirmation_conflict', 'invalid_transaction', 'forbidden', 'budget_exceeded']) SOLANA_SAFE_ERRORS.add(`solana_payment_${code}`);

async function boundedBody(request) {
  const declared = request.headers.get('content-length');
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > 4096)) throw new RangeError('request_too_large');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('invalid_request');
  const deadline = browserRequestDeadline(request.signal, 8000);
  const cancel = () => { try { void reader.cancel().catch(() => {}); } catch { /* bounded disposal */ } };
  deadline.signal.addEventListener('abort', cancel, { once: true });
  let raw = '', bytes = 0;
  const decoder = new TextDecoder('utf-8', { fatal: true });
  try {
    for (;;) {
      if (deadline.signal.aborted) throw new Error('invalid_request');
      const next = await reader.read();
      if (deadline.signal.aborted) throw new Error('invalid_request');
      if (next.done) break;
      bytes += next.value.byteLength;
      if (bytes > 4096) { cancel(); throw new RangeError('request_too_large'); }
      raw += decoder.decode(next.value, { stream: true });
    }
    return JSON.parse(raw + decoder.decode());
  } finally { deadline.dispose(); deadline.signal.removeEventListener('abort', cancel); reader.releaseLock(); }
}
/** Owner-authenticated Solana namespace. It never receives the Pimlico key. */
export async function handlePersonalSolana(request, group, action, { env = runtimeEnvironment(), fetchImpl = coreFetch, serviceRequest = boundedServiceRequest } = {}) {
  const link = group === 'link';
  if (!['link', 'payments'].includes(group) || !(link ? ['status', 'challenge', 'confirm'] : ['capabilities', 'balance', 'prepare', 'submit', 'verify', 'status', 'history']).includes(action)) return reply({ error: 'invalid_request' }, 400);
  if (env.NODE_ENV === 'production' && !['https://app.mindblisspower.com', 'https://mindbliss-portal-rewon.devfidubit.workers.dev'].includes(env.AUTH_PUBLIC_ORIGIN)) return reply({ error: 'not_found' }, 404);
  const method = (link ? action === 'status' : ['capabilities', 'balance', 'status', 'history'].includes(action)) ? 'GET' : 'POST';
  if (request.method !== method) return reply({ error: 'method_not_allowed' }, 405);
  const cookie = betterAuthCookies(request.headers.get('cookie') || '');
  if (!cookie.split(';').some(part => /^(?:__Secure-)?better-auth\.session_token=[^;\s,]+$/.test(part.trim()))) return reply({ error: 'unauthenticated' }, 401);
  if (env.PERSONAL_SOLANA_ENABLED !== 'true') return reply({ error: 'solana_wallet_unavailable' }, 503);
  const url = new URL(request.url);
  let body, paymentId;
  if (method === 'POST') {
    const denied = memberMutationError(request, env);
    if (denied) return reply({ error: denied.error }, denied.status);
    if (url.search) return reply({ error: 'invalid_request' }, 400);
    try { const raw = await boundedBody(request); body = link ? solanaWalletLinkInput(action, raw) : solanaPaymentInput(action, raw); }
    catch (error) { return reply({ error: error instanceof RangeError ? 'request_too_large' : 'invalid_request' }, error instanceof RangeError ? 413 : 400); }
    if (!body) return reply({ error: 'invalid_request' }, 400);
  } else if (!link && action === 'status') {
    paymentId = url.searchParams.get('paymentId');
    if (!SOLANA_UUID.test(paymentId || '') || url.search !== `?paymentId=${paymentId}`) return reply({ error: 'invalid_request' }, 400);
  } else if (url.search) return reply({ error: 'invalid_request' }, 400);
  const path = link ? `/api/member/solana-wallet-link${action === 'status' ? '' : `/${action}`}`
    : `/api/member/solana-payments/${action}${paymentId ? `?paymentId=${paymentId}` : ''}`;
  try {
    const base = betterAuthConfig(env), serialized = body ? JSON.stringify(body) : '';
    const ip = trustedAuthClientIp(request.headers, env), timestamp = String(Math.floor(Date.now() / 1000));
    const hash = value => createHash('sha256').update(value).digest('hex');
    const signature = createHmac('sha256', env.AUTH_BFF_SHARED_SECRET).update([method, path.split('?')[0], timestamp, ip, hash(cookie), hash(serialized)].join('\n')).digest('hex');
    const result = await serviceRequest(`${base}${path}`, { method, signal: request.signal, body: serialized || undefined,
      headers: { cookie, origin: method === 'GET' ? env.AUTH_PUBLIC_ORIGIN : request.headers.get('origin') || '',
        ...(body ? { 'content-type': 'application/json' } : {}), 'x-vp-auth-client-ip': ip,
        'x-vp-auth-timestamp': timestamp, 'x-vp-auth-signature': signature } }, fetchImpl);
    if (!result.ok) return reply({ error: SOLANA_SAFE_ERRORS.has(result.data?.error) ? result.data.error : 'solana_payment_unavailable' },
      [400, 401, 403, 404, 409, 413, 429, 503].includes(result.status) ? result.status : 502);
    const safe = link ? solanaWalletLinkView(action, result.data) : action === 'balance' ? solanaBalanceView(result.data) : action === 'capabilities' ? solanaCapabilitiesView(result.data)
      : action === 'history' ? solanaPaymentHistory(result.data) : solanaPaymentView(result.data);
    if (!safe || (link && action === 'challenge' && safe.address !== body.address)
      || (!link && (paymentId || body) && (!('paymentId' in safe) || safe.paymentId !== (paymentId || body.paymentId || body.requestId)))
      || (!link && action === 'prepare' && (!('amountAtomic' in safe) || safe.amountAtomic !== body.amountAtomic || !('transactionBase64' in safe) || (safe.status === 'prepared' && !safe.transactionBase64)))) return reply({ error: 'solana_payment_unavailable' }, 502);
    return reply(safe);
  } catch { return reply({ error: link ? 'wallet_link_unavailable' : 'solana_payment_unavailable' }, 503); }
}
