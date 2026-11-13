import { createHash, createHmac } from 'node:crypto';
import { betterAuthConfig, betterAuthCookies, trustedAuthClientIp } from './better-auth-bridge.mjs';
import { coreFetch, runtimeEnvironment } from './cloudflare-runtime.mjs';
import { boundedServiceRequest } from './private-service-request.mjs';
import { readBoundedRequestJson } from './bounded-request-json.mjs';
import { memberMutationError } from './member-mutation-policy.mjs';
import { ADMINISTRATIVE_OFFRAMP_PATH as path, ADMINISTRATIVE_OFFRAMP_ORIGIN as origin,
  administrativeOfframpPrepareInput, administrativeOfframpAcknowledgement, administrativeOfframpStatus, administrativeOfframpHistory, administrativeOfframpReference } from './administrative-offramp-session-contract.mjs';

const actions = { prepare: { method: 'POST', path: `${path}/prepare` }, status: { method: 'GET', path: `${path}/status` }, history: { method: 'GET', path: `${path}/history` } };
const reply = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } });
export async function handleAdministrativeOfframpSession(request, action, { env = runtimeEnvironment(), fetchImpl = coreFetch, serviceRequest = boundedServiceRequest } = {}) {
  const route = actions[action]; if (!route || request.method !== route.method) return reply({ error: 'method_not_allowed' }, 405);
  const url = new URL(request.url);
  if (url.origin !== origin || env.AUTH_PUBLIC_ORIGIN !== origin || url.pathname !== route.path || url.hash) return reply({ error: 'not_found' }, 404);
  if (request.headers.has('x-vp-act-as')) return reply({ error: 'invalid_request' }, 403);
  const cookie = betterAuthCookies(request.headers.get('cookie') || '');
  if (!/(?:^|;\s*)(?:__Secure-)?better-auth\.session_token=[^;\s,]+(?:;|$)/.test(cookie)) return reply({ error: 'unauthenticated' }, 401);
  let body, reference, target = route.path;
  if (action === 'status') {
    const query = url.searchParams;
    if (query.getAll('reference').length !== 1 || [...query.keys()].some(key => key !== 'reference')) return reply({ error: 'invalid_request' }, 400);
    const rawReference = query.get('reference');
    if (!administrativeOfframpReference(rawReference)) return reply({ error: 'invalid_request' }, 400);
    reference = rawReference.toLowerCase(); target += `?reference=${reference}`;
  } else if (url.search) return reply({ error: 'invalid_request' }, 400);
  if (action === 'prepare') {
    const denied = memberMutationError(request, env); if (denied) return reply({ error: denied.error }, denied.status);
    try { body = administrativeOfframpPrepareInput(await readBoundedRequestJson(request, { maxBytes: 2048 })); }
    catch (error) { return reply({ error: error?.message === 'request_too_large' ? 'request_too_large' : 'invalid_request' }, error?.message === 'request_too_large' ? 413 : 400); }
    if (!body) return reply({ error: 'invalid_request' }, 400);
  }
  try {
    const serialized = body ? JSON.stringify(body) : '', headers = { cookie, origin, ...(body ? { 'content-type': 'application/json' } : {}) };
    if (body) { const ip = trustedAuthClientIp(request.headers, env), timestamp = String(Math.floor(Date.now() / 1000));
      const hash = value => createHash('sha256').update(value).digest('hex');
      headers['x-vp-auth-client-ip'] = ip; headers['x-vp-auth-timestamp'] = timestamp;
      headers['x-vp-auth-signature'] = createHmac('sha256', env.AUTH_BFF_SHARED_SECRET)
        .update([route.method, target, timestamp, ip, hash(cookie), hash(serialized)].join('\n')).digest('hex'); }
    const response = await serviceRequest(`${betterAuthConfig(env)}${target}`, { method: route.method, headers, signal: request.signal,
      ...(body ? { body: serialized } : {}) }, fetchImpl);
    if (!response.ok) { const errors = new Set(['invalid_request', 'unauthenticated', 'administrative_operation_forbidden', 'administrative_operation_already_used',
      'administrative_operation_not_found', 'administrative_operation_rate_limited', 'administrative_offramp_method_unavailable', 'administrative_offramp_unconfigured']);
      return reply({ error: errors.has(response.data?.error) ? response.data.error : 'administrative_offramp_unavailable' }, [400, 401, 403, 404, 409, 413, 429, 503].includes(response.status) ? response.status : 503); }
    const safe = action === 'prepare' ? administrativeOfframpAcknowledgement(response.data) : action === 'status' ? administrativeOfframpStatus(response.data) : administrativeOfframpHistory(response.data);
    if (!safe) return reply({ error: 'administrative_offramp_unavailable' }, 502);
    if (action !== 'history' && !('reference' in safe)) return reply({ error: 'administrative_offramp_unavailable' }, 502);
    if (reference && (!('reference' in safe) || safe.reference !== reference)) return reply({ error: 'administrative_offramp_unavailable' }, 502);
    if (body && (!('sourceAmount' in safe) || safe.reference !== body.requestId || safe.country !== body.country
      || safe.destinationCurrencyCode !== body.destinationCurrencyCode || safe.serviceProvider !== body.serviceProvider || safe.paymentMethodType !== body.paymentMethodType
      || safe.sourceAmount !== body.amount)) return reply({ error: 'administrative_offramp_unavailable' }, 502);
    return reply(safe);
  } catch { return reply({ error: 'administrative_offramp_unavailable' }, 503); }
}
