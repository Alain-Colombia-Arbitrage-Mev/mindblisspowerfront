import { betterAuthConfig, betterAuthCookies } from './better-auth-bridge.mjs';
import { coreFetch, runtimeEnvironment } from './cloudflare-runtime.mjs';
import { memberMutationError } from './member-mutation-policy.mjs';
import { boundedServiceRequest } from './private-service-request.mjs';

const ADDRESS = /^0x[0-9a-f]{40}$/i;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const routes = Object.freeze({
  status: { method: 'GET', path: '/api/member/administrative-wallet' },
  ensure: { method: 'POST', path: '/api/member/administrative-wallet/ensure' },
});
const safeErrors = new Set(['unauthenticated', 'invalid_origin', 'administrative_wallet_identity_unavailable',
  'administrative_wallet_unavailable']);
const headers = { 'Cache-Control': 'private, no-store' };
const reply = (body, status = 200) => Response.json(body, { status, headers });

function safeState(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || !['assigned', 'pending', 'exhausted'].includes(value.status)
    || value.addressFamily !== 'EVM' || value.asset !== 'USDT') return null;
  if (value.status !== 'assigned') {
    return value.address === undefined && value.checkoutReference === undefined
      ? { status: value.status, addressFamily: 'EVM', asset: 'USDT' } : null;
  }
  if (!ADDRESS.test(value.address || '') || !UUID.test(value.checkoutReference || '')
    || typeof value.assignedAt !== 'string' || !Number.isFinite(Date.parse(value.assignedAt))) return null;
  return { status: 'assigned', address: value.address, addressFamily: 'EVM', asset: 'USDT',
    checkoutReference: value.checkoutReference, assignedAt: value.assignedAt };
}

export async function handleAdministrativeWallet(request, action, {
  env = runtimeEnvironment(), fetchImpl = coreFetch, serviceRequest = boundedServiceRequest,
} = {}) {
  const route = routes[action];
  if (!route || request.method !== route.method) return reply({ error: 'method_not_allowed' }, 405);
  if (route.method === 'POST') {
    const denied = memberMutationError(request, env);
    if (denied) return reply({ error: denied.error }, denied.status);
    const declared = request.headers.get('content-length');
    if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > 64)) return reply({ error: 'request_too_large' }, 413);
    let body;
    try { body = await request.json(); } catch { return reply({ error: 'invalid_request' }, 400); }
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length) return reply({ error: 'invalid_request' }, 400);
  }
  const cookie = betterAuthCookies(request.headers.get('cookie') || '');
  if (!cookie.split(';').some(part => /^(?:__Secure-)?better-auth\.session_token=[^;\s,]+$/.test(part.trim()))) {
    return reply({ error: 'unauthenticated' }, 401);
  }
  try {
    const result = await serviceRequest(`${betterAuthConfig(env)}${route.path}`, {
      method: route.method,
      headers: { cookie, ...(route.method === 'POST' ? { 'content-type': 'application/json', origin: request.headers.get('origin') || '' } : {}) },
      body: route.method === 'POST' ? '{}' : undefined,
      signal: request.signal,
    }, fetchImpl);
    if (!result.ok) {
      const status = [400, 401, 403, 413, 503].includes(result.status) ? result.status : 502;
      return reply({ error: safeErrors.has(result.data?.error) ? result.data.error : 'administrative_wallet_unavailable' }, status);
    }
    const state = safeState(result.data);
    return state ? reply(state) : reply({ error: 'administrative_wallet_unavailable' }, 502);
  } catch {
    return reply({ error: 'administrative_wallet_unavailable' }, 503);
  }
}
