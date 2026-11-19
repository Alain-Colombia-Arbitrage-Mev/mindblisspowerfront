import { createHash, createHmac } from 'node:crypto';
import { betterAuthCookies, trustedAuthClientIp } from './better-auth-bridge.mjs';
import { getCloudflareScope, runtimeEnvironment } from './cloudflare-runtime.mjs';
import { memberMutationError } from './member-mutation-policy.mjs';
import { readBoundedRequestJson } from './bounded-request-json.mjs';
import { boundedServiceRequest } from './private-service-request.mjs';
import { FUNDING_UUID } from './wallet-funding-contract.mjs';
import { WALLET_PRODUCTION_PATH as base, WALLET_PRODUCTION_ORIGIN as origin, walletProductionSubject, walletProductionInput, walletProductionCapabilities,
  walletProductionDiscovery, walletProductionOptions, walletProductionQuote, walletProductionAcknowledgement, walletProductionStatus, walletProductionHistory } from './wallet-production-funding-contract.mjs';

const routes = { capabilities: ['GET', walletProductionCapabilities], discovery: ['GET', walletProductionDiscovery], options: ['GET', walletProductionOptions],
  quote: ['POST', walletProductionQuote], session: ['POST', walletProductionAcknowledgement], status: ['GET', walletProductionStatus], history: ['GET', walletProductionHistory] };
const reply = (value, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } });
const hash = value => createHash('sha256').update(value).digest('hex');
const safeErrors = new Set(['unauthenticated', 'invalid_request', 'invalid_origin', 'invalid_auth_proxy', 'wallet_production_unconfigured', 'wallet_production_unavailable',
  'wallet_production_forbidden', 'wallet_production_binding_required', 'wallet_production_provider_unavailable', 'wallet_production_quote_unavailable', 'wallet_production_not_found',
  'wallet_production_verification_required', 'wallet_production_rate_limited', 'wallet_production_method_unavailable', 'wallet_production_amount_unavailable',
  'wallet_production_request_pending', 'wallet_production_request_already_used',
  'wallet_funding_request_pending', 'wallet_funding_request_already_used', 'wallet_funding_rate_limited', 'wallet_funding_method_unavailable', 'wallet_funding_amount_unavailable']);
export async function productionWalletCoreFetch(input, init) {
  const scope = getCloudflareScope(), url = new URL(input instanceof Request ? input.url : input);
  if (!scope || url.origin !== 'https://wallet.core.internal' || !url.pathname.startsWith(`${base}/`) || url.hash || url.username || url.password
    || typeof scope.env.WALLET_CORE?.fetch !== 'function') throw Error('wallet_production_unavailable');
  return scope.env.WALLET_CORE.fetch(input, { ...init, cache: 'no-store', redirect: 'manual' });
}
export async function handleWalletProductionFunding(request, action, { env = runtimeEnvironment(), fetchImpl = productionWalletCoreFetch, serviceRequest = boundedServiceRequest } = {}) {
  const route = Object.hasOwn(routes, action) ? routes[action] : null, url = new URL(request.url);
  if (!route || url.origin !== origin || env.AUTH_PUBLIC_ORIGIN !== origin || url.pathname !== `${base}/${action}`) return reply({ error: 'not_found' }, 404);
  if (request.method !== route[0]) return reply({ error: 'method_not_allowed' }, 405);
  if (url.hash || request.headers.has('x-vp-act-as')) return reply({ error: 'wallet_production_forbidden' }, 403);
  const subjectHeader = request.headers.get('x-mindbliss-wallet-subject');
  try { if (!subjectHeader || walletProductionSubject(decodeURIComponent(subjectHeader)) !== subjectHeader) return reply({ error: 'wallet_production_forbidden' }, 403); }
  catch { return reply({ error: 'wallet_production_forbidden' }, 403); }
  const cookie = betterAuthCookies(request.headers.get('cookie') || '');
  if (!/(?:^|;\s*)(?:__Secure-)?better-auth\.session_token=[^;\s,]+(?:;|$)/.test(cookie)) return reply({ error: 'unauthenticated' }, 401);
  let body;
  if (route[0] === 'POST') {
    const denied = memberMutationError(request, env); if (denied) return reply({ error: denied.error }, denied.status);
    if (request.headers.has('content-encoding') || !/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || '')) return reply({ error: 'invalid_request' }, 415);
    if (url.search) return reply({ error: 'invalid_request' }, 400);
    try { body = walletProductionInput(await readBoundedRequestJson(request, { maxBytes: 2048 }), action === 'session'); } catch { return reply({ error: 'invalid_request' }, 400); }
    if (!body) return reply({ error: 'invalid_request' }, 400);
  } else {
    const query = url.searchParams;
    if (action === 'options') {
      if (query.size !== 2 || query.getAll('country').length !== 1 || !/^[A-Z]{2}$/.test(query.get('country') || '')
        || query.getAll('sourceCurrencyCode').length !== 1 || !/^[A-Z]{3}$/.test(query.get('sourceCurrencyCode') || '')) return reply({ error: 'invalid_request' }, 400);
    } else if (action === 'discovery') {
      if (query.size && (query.size !== 1 || query.getAll('country').length !== 1 || !/^[A-Z]{2}$/.test(query.get('country') || ''))) return reply({ error: 'invalid_request' }, 400);
    } else if (action === 'status') {
      if (query.size !== 1 || query.getAll('checkoutReference').length !== 1 || !FUNDING_UUID.test(query.get('checkoutReference') || '')) return reply({ error: 'invalid_request' }, 400);
    } else if (url.search) return reply({ error: 'invalid_request' }, 400);
  }
  try {
    const headers = { cookie, origin, 'x-mindbliss-wallet-subject': subjectHeader }, serialized = body === undefined ? '' : JSON.stringify(body);
    if (body !== undefined) {
      if (typeof env.AUTH_BFF_SHARED_SECRET !== 'string' || env.AUTH_BFF_SHARED_SECRET.length < 32) throw Error('wallet_production_unconfigured');
      const timestamp = String(Math.floor(Date.now() / 1000)), ip = trustedAuthClientIp(request.headers, env);
      Object.assign(headers, { 'content-type': 'application/json', 'x-vp-auth-client-ip': ip, 'x-vp-auth-timestamp': timestamp,
        'x-vp-auth-signature': createHmac('sha256', env.AUTH_BFF_SHARED_SECRET).update(['POST', url.pathname, timestamp, ip, hash(cookie), hash(serialized)].join('\n')).digest('hex') });
    }
    const result = await serviceRequest(`https://wallet.core.internal${url.pathname}${url.search}`, { method: route[0], headers,
      ...(body === undefined ? {} : { body: serialized }), signal: request.signal }, fetchImpl);
    if (!result.ok) return reply({ error: safeErrors.has(result.data?.error) ? result.data.error : 'wallet_production_unavailable' }, [400, 401, 403, 404, 409, 413, 429, 503].includes(result.status) ? result.status : 502);
    const safe = action === 'discovery' ? walletProductionDiscovery(result.data, url.searchParams.get('country') || '')
      : action === 'session' ? walletProductionAcknowledgement(result.data, body) : action === 'quote' ? walletProductionQuote(result.data, body) : route[1](result.data);
    if (action === 'options' && safe && (safe.country !== url.searchParams.get('country') || safe.sourceCurrencyCode !== url.searchParams.get('sourceCurrencyCode'))) return reply({ error: 'wallet_production_unavailable' }, 502);
    return safe ? reply(safe, result.status) : reply({ error: 'wallet_production_unavailable' }, 502);
  } catch { return reply({ error: 'wallet_production_unavailable' }, 503); }
}
