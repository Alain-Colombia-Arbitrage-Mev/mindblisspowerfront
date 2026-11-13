import { createHash, createHmac } from 'node:crypto';
import { betterAuthConfig, betterAuthCookies, trustedAuthClientIp } from './better-auth-bridge.mjs';
import { coreFetch, runtimeEnvironment } from './cloudflare-runtime.mjs';
import { memberMutationError } from './member-mutation-policy.mjs';
import { boundedServiceRequest } from './private-service-request.mjs';
import { readBoundedRequestJson } from './bounded-request-json.mjs';
import { ADMINISTRATIVE_SIGNING_PATH as signing, ADMINISTRATIVE_TRANSFERS_PATH as transfers, administrativeSignerCapabilities, administrativeSignerStatus,
  administrativeSignerChallenge, administrativeSignerVerification, administrativeTransferInput, administrativeTransferDraft, administrativeTransferHistory, administrativeTransferSnapshot } from './administrative-signing-contract.mjs';

const origin = 'https://wallet.mindblisspower.com';
const actions = { capabilities: ['GET', `${signing}/capabilities`], status: ['GET', `${signing}/status`], challenge: ['POST', `${signing}/challenge`],
  verify: ['POST', `${signing}/verify`], prepare: ['POST', `${transfers}/prepare`], history: ['GET', `${transfers}/history`] };
const reply = (value, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } });
const errors = new Set(['invalid_request', 'unauthenticated', 'invalid_origin', 'invalid_auth_proxy', 'administrative_signing_unconfigured', 'administrative_signing_unavailable',
  'administrative_wallet_unavailable', 'administrative_wallet_forbidden', 'administrative_signer_required', 'administrative_signer_mismatch', 'administrative_signature_invalid',
  'administrative_signing_forbidden', 'administrative_signing_signature_invalid', 'administrative_signing_invalid_challenge', 'administrative_signing_rate_limited',
  'administrative_transfer_binding_required', 'administrative_transfer_request_already_used', 'administrative_transfer_rate_limited',
  'administrative_transfer_invalid_recipient', 'administrative_transfer_invalid_amount', 'administrative_transfer_unavailable',
  'administrative_challenge_expired', 'administrative_challenge_used', 'administrative_rate_limited', 'request_already_used', 'request_pending', 'rate_limited', 'not_found']);
const hash = value => createHash('sha256').update(value).digest('hex');
const validHash = draft => hash(administrativeTransferSnapshot(draft)) === draft.preparationHash;

export async function handleAdministrativeSigning(request, action, { env = runtimeEnvironment(), fetchImpl = coreFetch, serviceRequest = boundedServiceRequest } = {}) {
  const route = actions[action], url = new URL(request.url);
  if (!route || request.method !== route[0]) return reply({ error: 'method_not_allowed' }, 405);
  if (url.origin !== origin || env.AUTH_PUBLIC_ORIGIN !== origin || url.pathname !== route[1]) return reply({ error: 'not_found' }, 404);
  if (url.search || url.hash) return reply({ error: 'invalid_request' }, 400);
  if (request.headers.has('x-vp-act-as')) return reply({ error: 'administrative_wallet_forbidden' }, 403);
  const cookie = betterAuthCookies(request.headers.get('cookie') || '');
  if (!/(?:^|;\s*)(?:__Secure-)?better-auth\.session_token=[^;\s,]+(?:;|$)/.test(cookie)) return reply({ error: 'unauthenticated' }, 401);
  let body;
  if (route[0] === 'POST') {
    const denied = memberMutationError(request, env);
    if (denied) return reply({ error: denied.error }, denied.status);
    try {
      const value = await readBoundedRequestJson(request, { maxBytes: 2048 });
      body = action === 'challenge' ? value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0 ? {} : null
        : action === 'verify' ? administrativeSignerVerification(value) : administrativeTransferInput(value);
    } catch { return reply({ error: 'invalid_request' }, 400); }
    if (!body) return reply({ error: 'invalid_request' }, 400);
  }
  try {
    const headers = { cookie, origin }, serialized = body === undefined ? '' : JSON.stringify(body);
    if (body !== undefined) {
      const timestamp = String(Math.floor(Date.now() / 1000)), ip = trustedAuthClientIp(request.headers, env);
      headers['content-type'] = 'application/json'; headers['x-vp-auth-client-ip'] = ip; headers['x-vp-auth-timestamp'] = timestamp;
      headers['x-vp-auth-signature'] = createHmac('sha256', env.AUTH_BFF_SHARED_SECRET).update(['POST', route[1], timestamp, ip, hash(cookie), hash(serialized)].join('\n')).digest('hex');
    }
    const response = await serviceRequest(`${betterAuthConfig(env)}${route[1]}`, { method: route[0], headers, ...(body === undefined ? {} : { body: serialized }), signal: request.signal }, fetchImpl);
    if (!response.ok) return reply({ error: errors.has(response.data?.error) ? response.data.error : 'administrative_signing_unavailable' }, [400, 401, 403, 404, 409, 429, 503].includes(response.status) ? response.status : 502);
    const safe = action === 'capabilities' ? administrativeSignerCapabilities(response.data) : action === 'challenge' ? administrativeSignerChallenge(response.data)
      : action === 'prepare' ? administrativeTransferDraft(response.data) : action === 'history' ? administrativeTransferHistory(response.data) : administrativeSignerStatus(response.data);
    const transferBody = action === 'prepare' ? administrativeTransferInput(body) : null;
    if (!safe || (action === 'prepare' && (!transferBody || safe.draftReference !== transferBody.requestId || safe.recipient !== transferBody.recipient || safe.amount !== transferBody.amount || !validHash(safe)))
      || (action === 'history' && !safe.records.every(validHash))) return reply({ error: 'administrative_signing_unavailable' }, 502);
    return reply(safe);
  } catch { return reply({ error: 'administrative_signing_unavailable' }, 503); }
}
