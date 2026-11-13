import { createHash, createHmac } from 'node:crypto';
import { betterAuthCookies, trustedAuthClientIp } from './better-auth-bridge.mjs';
import { getCloudflareScope, runtimeEnvironment } from './cloudflare-runtime.mjs';
import { memberMutationError } from './member-mutation-policy.mjs';
import { readBoundedRequestJson } from './bounded-request-json.mjs';
import { boundedServiceRequest } from './private-service-request.mjs';
import { FUNDING_UUID } from './wallet-funding-contract.mjs';
import { SANDBOX_WALLET_ORIGIN as origin, SANDBOX_WALLET_PATH as base, SANDBOX_WALLET_COUNTRIES, sandboxWalletSubjectHeader, sandboxWalletCapabilities, sandboxWalletStatus,
  sandboxWalletChallengeInput, sandboxWalletVerifyInput, sandboxWalletChallenge, sandboxWalletFundingInput, sandboxWalletOptions,
  sandboxWalletAcknowledgement, sandboxWalletHistory, sandboxWalletFundingStatus } from './sandbox-wallet-contract.mjs';

const routes = { capabilities: ['GET', sandboxWalletCapabilities], status: ['GET', sandboxWalletStatus], challenge: ['POST', sandboxWalletChallenge],
  verify: ['POST', sandboxWalletStatus], 'funding/options': ['GET', sandboxWalletOptions], 'funding/session': ['POST', sandboxWalletAcknowledgement],
  'funding/status': ['GET', sandboxWalletFundingStatus], 'funding/history': ['GET', sandboxWalletHistory] };
const reply = (value, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } });
const hash = value => createHash('sha256').update(value).digest('hex');
const safeErrors = new Set(['unauthenticated', 'invalid_request', 'invalid_origin', 'invalid_auth_proxy', 'sandbox_wallet_unconfigured', 'sandbox_wallet_unavailable',
  'sandbox_wallet_forbidden', 'sandbox_wallet_address_in_use', 'sandbox_wallet_already_linked', 'sandbox_wallet_invalid_challenge', 'sandbox_wallet_signature_invalid',
  'sandbox_wallet_rate_limited', 'sandbox_wallet_verification_required', 'sandbox_wallet_request_already_used', 'sandbox_wallet_not_found', 'sandbox_wallet_provider_unavailable',
  'wallet_funding_rate_limited', 'wallet_funding_request_pending', 'wallet_funding_request_already_used', 'wallet_funding_method_unavailable', 'wallet_funding_amount_unavailable']);

/** No public-DNS or production-core fallback for the new sandbox ledger. */
export async function walletCoreFetch(input, init) {
  const scope = getCloudflareScope(), url = new URL(input instanceof Request ? input.url : input);
  if (!scope || url.origin !== 'https://wallet.core.internal' || !url.pathname.startsWith(`${base}/`) || url.hash || url.username || url.password
    || typeof scope.env.WALLET_CORE?.fetch !== 'function') throw Error('sandbox_wallet_unavailable');
  return scope.env.WALLET_CORE.fetch(input, { ...init, cache: 'no-store', redirect: 'manual' });
}

export async function handleSandboxWallet(request, action, { env = runtimeEnvironment(), fetchImpl = walletCoreFetch, serviceRequest = boundedServiceRequest } = {}) {
  const route = Object.hasOwn(routes, action) ? routes[action] : null, url = new URL(request.url);
  if (!route || url.origin !== origin || env.AUTH_PUBLIC_ORIGIN !== origin || url.pathname !== `${base}/${action}`) return reply({ error: 'not_found' }, 404);
  if (request.method !== route[0]) return reply({ error: 'method_not_allowed' }, 405);
  if (url.hash || request.headers.has('x-vp-act-as')) return reply({ error: 'sandbox_wallet_forbidden' }, 403);
  const subjectHeader = request.headers.get('x-mindbliss-sandbox-subject');
  try {
    const decoded = decodeURIComponent(subjectHeader || '');
    if (!sandboxWalletSubjectHeader(decoded) || sandboxWalletSubjectHeader(decoded) !== subjectHeader) return reply({ error: 'sandbox_wallet_forbidden' }, 403);
  } catch { return reply({ error: 'sandbox_wallet_forbidden' }, 403); }
  const cookie = betterAuthCookies(request.headers.get('cookie') || '');
  if (!/(?:^|;\s*)(?:__Secure-)?better-auth\.session_token=[^;\s,]+(?:;|$)/.test(cookie)) return reply({ error: 'unauthenticated' }, 401);
  let body;
  if (route[0] === 'POST') {
    const denied = memberMutationError(request, env); if (denied) return reply({ error: denied.error }, denied.status);
    if (request.headers.has('content-encoding') || !/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || '')) return reply({ error: 'invalid_request' }, 415);
    if (url.search) return reply({ error: 'invalid_request' }, 400);
    try { const raw = await readBoundedRequestJson(request, { maxBytes: 2048 });
      body = action === 'challenge' ? sandboxWalletChallengeInput(raw) : action === 'verify' ? sandboxWalletVerifyInput(raw) : sandboxWalletFundingInput(raw);
    } catch { return reply({ error: 'invalid_request' }, 400); }
    if (!body) return reply({ error: 'invalid_request' }, 400);
  } else if (action === 'funding/options') {
    const country = url.searchParams.get('country'), currency = url.searchParams.get('sourceCurrencyCode');
    if (url.searchParams.size !== 2 || url.searchParams.getAll('country').length !== 1 || !SANDBOX_WALLET_COUNTRIES.includes(country)
      || url.searchParams.getAll('sourceCurrencyCode').length !== 1 || !(currency === 'USD' || (country === 'MX' && currency === 'MXN'))) return reply({ error: 'invalid_request' }, 400);
  } else if (action === 'funding/status') {
    if (url.searchParams.size !== 1 || url.searchParams.getAll('checkoutReference').length !== 1 || !FUNDING_UUID.test(url.searchParams.get('checkoutReference') || '')) return reply({ error: 'invalid_request' }, 400);
  } else if (url.search) return reply({ error: 'invalid_request' }, 400);
  try {
    const headers = { cookie, origin, 'x-mindbliss-sandbox-subject': subjectHeader }, serialized = body === undefined ? '' : JSON.stringify(body);
    if (body !== undefined) {
      if (typeof env.AUTH_BFF_SHARED_SECRET !== 'string' || env.AUTH_BFF_SHARED_SECRET.length < 32) throw Error('sandbox_wallet_unconfigured');
      const timestamp = String(Math.floor(Date.now() / 1000)), ip = trustedAuthClientIp(request.headers, env);
      Object.assign(headers, { 'content-type': 'application/json', 'x-vp-auth-client-ip': ip, 'x-vp-auth-timestamp': timestamp,
        'x-vp-auth-signature': createHmac('sha256', env.AUTH_BFF_SHARED_SECRET).update(['POST', url.pathname, timestamp, ip, hash(cookie), hash(serialized)].join('\n')).digest('hex') });
    }
    const result = await serviceRequest(`https://wallet.core.internal${url.pathname}${url.search}`, { method: route[0], headers,
      ...(body === undefined ? {} : { body: serialized }), signal: request.signal }, fetchImpl);
    if (!result.ok) return reply({ error: safeErrors.has(result.data?.error) ? result.data.error : 'sandbox_wallet_unavailable' },
      [400, 401, 403, 404, 409, 413, 429, 503].includes(result.status) ? result.status : 502);
    const safe = action === 'challenge' ? sandboxWalletChallenge(result.data, body.address) : action === 'funding/session' ? sandboxWalletAcknowledgement(result.data, body) : route[1](result.data);
    if (action === 'funding/options' && safe && (safe.country !== url.searchParams.get('country') || safe.sourceCurrencyCode !== url.searchParams.get('sourceCurrencyCode'))) return reply({ error: 'sandbox_wallet_unavailable' }, 502);
    return safe ? reply(safe, result.status) : reply({ error: 'sandbox_wallet_unavailable' }, 502);
  } catch { return reply({ error: 'sandbox_wallet_unavailable' }, 503); }
}
