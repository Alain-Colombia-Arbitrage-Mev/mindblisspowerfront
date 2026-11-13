import { createHash, createHmac } from 'node:crypto';
import { betterAuthConfig, betterAuthCookies, trustedAuthClientIp } from './better-auth-bridge.mjs';
import { coreFetch, runtimeEnvironment } from './cloudflare-runtime.mjs';
import { memberMutationError } from './member-mutation-policy.mjs';
import { boundedServiceRequest } from './private-service-request.mjs';
import { readBoundedRequestJson } from './bounded-request-json.mjs';
import { ADMINISTRATIVE_MELD_CHECKOUT_PATH as path, ADMINISTRATIVE_MELD_CHECKOUT_ORIGIN, MELD_CHECKOUT_REFERENCE,
  meldCheckoutInput, meldCheckoutCapabilities, meldCheckoutAcknowledgement, meldCheckoutStatus, meldCheckoutHistory } from './administrative-meld-checkout-contract.mjs';

const routes = { create: { method: 'POST', path }, capabilities: { method: 'GET', path: `${path}/capabilities` }, status: { method: 'GET', path: `${path}/status` }, history: { method: 'GET', path: `${path}/history` } };
const reply = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } });
const safeErrors = new Set(['invalid_request', 'unauthenticated', 'invalid_origin', 'invalid_auth_proxy', 'wallet_funding_unconfigured', 'wallet_funding_forbidden', 'wallet_not_assigned',
  'wallet_funding_request_already_used', 'wallet_funding_request_pending', 'wallet_funding_rate_limited', 'wallet_funding_not_found', 'wallet_funding_provider_unavailable', 'wallet_funding_unavailable',
  'request_already_used', 'request_pending', 'rate_limited', 'not_found', 'provider_unavailable', 'unavailable']);

export async function handleAdministrativeMeldCheckout(request, action, { env = runtimeEnvironment(), fetchImpl = coreFetch, serviceRequest = boundedServiceRequest } = {}) {
  const route = routes[action];
  if (!route || request.method !== route.method) return reply({ error: 'method_not_allowed' }, 405);
  const url = new URL(request.url);
  if (url.origin !== ADMINISTRATIVE_MELD_CHECKOUT_ORIGIN || env.AUTH_PUBLIC_ORIGIN !== ADMINISTRATIVE_MELD_CHECKOUT_ORIGIN) return reply({ error: 'invalid_host' }, 421);
  if (request.headers.has('x-vp-act-as')) return reply({ error: 'wallet_funding_forbidden' }, 403);
  if (url.pathname !== route.path) return reply({ error: 'not_found' }, 404);
  const cookie = betterAuthCookies(request.headers.get('cookie') || '');
  if (!cookie.split(';').some(part => /^(?:__Secure-)?better-auth\.session_token=[^;\s,]+$/.test(part.trim()))) return reply({ error: 'unauthenticated' }, 401);
  let target = route.path, body, reference;
  if (action === 'status') {
    const values = url.searchParams.getAll('checkoutReference');
    if (values.length !== 1 || values[0].length !== 36 || !MELD_CHECKOUT_REFERENCE.test(values[0]) || [...url.searchParams.keys()].some(key => key !== 'checkoutReference')) return reply({ error: 'invalid_request' }, 400);
    reference = values[0].toLowerCase(); target += `?checkoutReference=${reference}`;
  } else if (url.search) return reply({ error: 'invalid_request' }, 400);
  if (action === 'create') {
    const denied = memberMutationError(request, env);
    if (denied) return reply({ error: denied.error }, denied.status);
    try { body = meldCheckoutInput(await readBoundedRequestJson(request, { maxBytes: 1024 })); }
    catch (error) { return reply({ error: error?.message === 'request_too_large' ? 'request_too_large' : 'invalid_request' }, error?.message === 'request_too_large' ? 413 : 400); }
    if (!body) return reply({ error: 'invalid_request' }, 400);
  }
  try {
    const serialized = body ? JSON.stringify(body) : '';
    const headers = { cookie, origin: ADMINISTRATIVE_MELD_CHECKOUT_ORIGIN, ...(body ? { 'content-type': 'application/json' } : {}) };
    if (body) {
      const ip = trustedAuthClientIp(request.headers, env), timestamp = String(Math.floor(Date.now() / 1000));
      const hash = value => createHash('sha256').update(value).digest('hex');
      headers['x-vp-auth-client-ip'] = ip; headers['x-vp-auth-timestamp'] = timestamp;
      headers['x-vp-auth-signature'] = createHmac('sha256', env.AUTH_BFF_SHARED_SECRET).update(['POST', route.path, timestamp, ip, hash(cookie), hash(serialized)].join('\n')).digest('hex');
    }
    const response = await serviceRequest(`${betterAuthConfig(env)}${target}`, { method: route.method, headers, ...(body ? { body: serialized } : {}), signal: request.signal }, fetchImpl);
    if (!response.ok) return reply({ error: safeErrors.has(response.data?.error) ? response.data.error : 'meld_checkout_unavailable' }, [400, 401, 403, 404, 409, 413, 429, 503].includes(response.status) ? response.status : 502);
    const safe = action === 'create' ? meldCheckoutAcknowledgement(response.data) : action === 'capabilities' ? meldCheckoutCapabilities(response.data) : action === 'status' ? meldCheckoutStatus(response.data) : meldCheckoutHistory(response.data);
    if (!safe || (reference && safe.checkoutReference !== reference) || (body && (safe.checkoutReference !== body.requestId || safe.country !== body.country || safe.sourceCurrencyCode !== body.sourceCurrencyCode || safe.requestedAmount !== body.amount))) return reply({ error: 'meld_checkout_unavailable' }, 502);
    return reply(safe);
  } catch { return reply({ error: 'meld_checkout_unavailable' }, 503); }
}
