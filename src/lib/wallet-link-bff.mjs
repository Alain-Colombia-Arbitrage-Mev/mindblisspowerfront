import { betterAuthConfig, betterAuthCookies } from './better-auth-bridge.mjs';
import { coreFetch, runtimeEnvironment } from './cloudflare-runtime.mjs';
import { memberMutationError } from './member-mutation-policy.mjs';
import { boundedServiceRequest } from './private-service-request.mjs';

const MAX_REQUEST_BYTES = 4096;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ADDRESS = /^0x[0-9a-f]{40}$/i;
const SIGNATURE = /^0x[0-9a-f]{130}$/i;
const paths = Object.freeze({
  status: { method: 'GET', path: '/api/member/wallet-link' },
  challenge: { method: 'POST', path: '/api/member/wallet-link/challenge' },
  confirm: { method: 'POST', path: '/api/member/wallet-link/confirm' },
});
const safeErrors = new Set(['unauthenticated', 'invalid_origin', 'invalid_request', 'wallet_link_rate_limited',
  'wallet_already_linked', 'wallet_address_in_use', 'invalid_wallet_address', 'wallet_challenge_invalid',
  'wallet_signature_invalid', 'wallet_identity_unavailable', 'wallet_link_unavailable']);
const headers = { 'Cache-Control': 'private, no-store' };
const reply = (body, status = 200) => Response.json(body, { status, headers });

async function boundedInput(request) {
  const declared = request.headers.get('content-length');
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > MAX_REQUEST_BYTES)) throw new RangeError('request_too_large');
  const reader = request.body?.getReader();
  if (!reader) throw new SyntaxError('invalid_json');
  const chunks = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_REQUEST_BYTES) throw new RangeError('request_too_large');
      chunks.push(value);
    }
  } finally { try { reader.releaseLock(); } catch { /* no-op */ } }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
}

function validInput(action, value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  if (action === 'challenge') return keys.length === 1 && keys[0] === 'address' && ADDRESS.test(value.address);
  return action === 'confirm' && keys.length === 2 && keys.includes('challengeId') && keys.includes('signature')
    && UUID.test(value.challengeId) && SIGNATURE.test(value.signature);
}

function validSuccess(action, value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  if (action === 'status') return value.linked === false || (value.linked === true && ADDRESS.test(value.address));
  if (action === 'challenge') return value.linked === true ? ADDRESS.test(value.address)
    : value.linked === false && UUID.test(value.challengeId) && ADDRESS.test(value.address)
      && typeof value.message === 'string' && value.message.length > 0 && value.message.length <= 4096;
  return value.linked === true && ADDRESS.test(value.address);
}

export async function handleWalletLink(request, action, {
  env = runtimeEnvironment(), fetchImpl = coreFetch, serviceRequest = boundedServiceRequest,
} = {}) {
  const route = paths[action];
  if (!route || request.method !== route.method) return reply({ error: 'method_not_allowed' }, 405);
  const denied = memberMutationError(request, env);
  if (denied) return reply({ error: denied.error }, denied.status);
  const cookie = betterAuthCookies(request.headers.get('cookie') || '');
  if (!cookie.split(';').some(part => /^(?:__Secure-)?better-auth\.session_token=[^;\s,]+$/.test(part.trim()))) {
    return reply({ error: 'unauthenticated' }, 401);
  }

  let body;
  if (route.method === 'POST') {
    try { body = await boundedInput(request); }
    catch (error) { return reply({ error: error instanceof RangeError ? 'request_too_large' : 'invalid_request' }, error instanceof RangeError ? 413 : 400); }
    if (!validInput(action, body)) return reply({ error: 'invalid_request' }, 400);
  }

  try {
    const base = betterAuthConfig(env);
    const result = await serviceRequest(`${base}${route.path}`, {
      method: route.method,
      headers: { cookie, ...(body ? { 'content-type': 'application/json', origin: request.headers.get('origin') || '' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: request.signal,
    }, fetchImpl);
    if (!result.ok) {
      const status = [400, 401, 403, 409, 413, 429, 503].includes(result.status) ? result.status : 502;
      console.warn('[wallet-link]', JSON.stringify({ action, phase: 'upstream_response', status: result.status,
        code: safeErrors.has(result.data?.error) ? result.data.error : 'unclassified' }));
      return reply({ error: safeErrors.has(result.data?.error) ? result.data.error : 'wallet_link_unavailable' }, status);
    }
    if (validSuccess(action, result.data)) return reply(result.data);
    console.warn('[wallet-link]', JSON.stringify({ action, phase: 'response_contract', status: result.status || 200, code: 'unclassified' }));
    return reply({ error: 'wallet_link_unavailable' }, 502);
  } catch (error) {
    const code = ['service_request_cancelled', 'private_api_unavailable', 'worker_request_scope_required'].includes(error?.message)
      ? error.message : 'unclassified';
    console.warn('[wallet-link]', JSON.stringify({ action, phase: 'transport', status: 0, code }));
    return reply({ error: 'wallet_link_unavailable' }, 503);
  }
}
