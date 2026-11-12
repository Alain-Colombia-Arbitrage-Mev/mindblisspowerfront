import { createHash, createHmac } from 'node:crypto';
import { betterAuthConfig, betterAuthCookies, trustedAuthClientIp } from './better-auth-bridge.mjs';
import { coreFetch, runtimeEnvironment } from './cloudflare-runtime.mjs';
import { memberMutationError } from './member-mutation-policy.mjs';
import { boundedServiceRequest } from './private-service-request.mjs';
import { administrativeSandboxOptions, personalProductionOptions, fundingAcknowledgement, fundingHistory, fundingInput, fundingStatus, fundingCurrencyCode, fundingSourceSupported, FUNDING_UUID, PERSONAL_FUNDING_DESTINATION } from './wallet-funding-contract.mjs';
import { readBoundedRequestJson } from './bounded-request-json.mjs';

const reply = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } });
const diagnostic = (action, phase, status, code = 'unclassified') => {
  console.warn('[wallet-funding]', JSON.stringify({ action, phase, status, code }));
};

export async function handleWalletFunding(request, action, {
  env = runtimeEnvironment(), fetchImpl = coreFetch, serviceRequest = boundedServiceRequest,
} = {}) {
  const statusRead = ['personal-status', 'administrative-status'].includes(action);
  if (!['personal', 'administrative', 'history', 'options', 'personal-options'].includes(action) && !statusRead) return reply({ error: 'invalid_request' }, 400);
  const method = statusRead || ['history', 'options', 'personal-options'].includes(action) ? 'GET' : 'POST';
  if (request.method !== method) return reply({ error: 'method_not_allowed' }, 405);
  const cookie = betterAuthCookies(request.headers.get('cookie') || '');
  if (!cookie.split(';').some(part => /^(?:__Secure-)?better-auth\.session_token=[^;\s,]+$/.test(part.trim()))) return reply({ error: 'unauthenticated' }, 401);
  let kind = action;
  let body;
  let path;
  let optionsContext;
  let requestedReference;
  if (statusRead) {
    kind = action === 'personal-status' ? 'personal' : 'administrative';
    const url = new URL(request.url);
    requestedReference = url.searchParams.get('checkoutReference');
    if (typeof requestedReference !== 'string' || requestedReference.length !== 36 || !FUNDING_UUID.test(requestedReference) || [...url.searchParams.keys()].some(key => key !== 'checkoutReference')
      || url.searchParams.getAll('checkoutReference').length !== 1) return reply({ error: 'invalid_request' }, 400);
    requestedReference = requestedReference.toLowerCase();
    path = `/api/member/wallet-funding/${kind}/status?checkoutReference=${requestedReference}`;
  } else if (action === 'personal-options') {
    const url = new URL(request.url);
    const country = url.searchParams.get('country');
    const sourceCurrencyCode = url.searchParams.has('sourceCurrencyCode') ? url.searchParams.get('sourceCurrencyCode') : 'USD';
    optionsContext = personalProductionOptions({ walletKind: 'personal', environment: 'production', provider: 'reown', country, sourceCurrencyCode, paymentMethods: [], routes: [], ...PERSONAL_FUNDING_DESTINATION });
    if (!optionsContext || [...url.searchParams.keys()].some(key => !['country', 'sourceCurrencyCode'].includes(key))
      || url.searchParams.getAll('country').length !== 1 || url.searchParams.getAll('sourceCurrencyCode').length > 1) return reply({ error: 'invalid_request' }, 400);
    path = `/api/member/wallet-funding/personal/options?country=${country}${sourceCurrencyCode === 'USD' ? '' : `&sourceCurrencyCode=${sourceCurrencyCode}`}`;
  } else if (action === 'options') {
    const url = new URL(request.url);
    const country = url.searchParams.get('country');
    const sourceCurrencyCode = url.searchParams.has('sourceCurrencyCode') ? url.searchParams.get('sourceCurrencyCode') : 'USD';
    const serviceProvider = url.searchParams.get('serviceProvider');
    optionsContext = administrativeSandboxOptions({ walletKind: 'administrative', environment: 'sandbox', provider: 'meld',
      country, sourceCurrencyCode, serviceProvider, paymentMethods: [], routes: [] });
    if (!optionsContext || [...url.searchParams.keys()].some(key => !['country', 'sourceCurrencyCode', 'serviceProvider'].includes(key))
      || url.searchParams.getAll('country').length !== 1 || url.searchParams.getAll('sourceCurrencyCode').length > 1
      || url.searchParams.getAll('serviceProvider').length !== 1) return reply({ error: 'invalid_request' }, 400);
    path = `/api/member/wallet-funding/administrative/options?country=${country}${sourceCurrencyCode === 'USD' ? '' : `&sourceCurrencyCode=${sourceCurrencyCode}`}&serviceProvider=${serviceProvider}`;
  } else if (action === 'history') {
    const url = new URL(request.url);
    kind = url.searchParams.get('walletKind');
    if (!['personal', 'administrative'].includes(kind) || [...url.searchParams.keys()].some(key => key !== 'walletKind')
      || url.searchParams.getAll('walletKind').length !== 1) return reply({ error: 'invalid_request' }, 400);
    path = `/api/member/wallet-funding/history?walletKind=${kind}`;
  } else {
    const denied = memberMutationError(request, env);
    if (denied) return reply({ error: denied.error }, denied.status);
    // An already-open tab may still construct Ethereum checkout URLs. Never
    // persist a Polygon intent unless the current personal client opts in.
    if (kind === 'personal' && request.headers.get('x-mindbliss-wallet-network') !== 'polygon') {
      return reply({ error: 'wallet_funding_network_changed' }, 409);
    }
    const length = request.headers.get('content-length');
    if (length !== null && (!/^\d+$/.test(length) || Number(length) > 2048)) return reply({ error: 'request_too_large' }, 413);
    try {
      body = fundingInput(await readBoundedRequestJson(request, { maxBytes: 2048 }), kind);
    } catch (error) {
      if (error?.message === 'request_body_unavailable') return reply({ error: 'wallet_funding_provider_unavailable' }, 503);
      return reply({ error: error?.message === 'request_too_large' ? 'request_too_large' : 'invalid_request' }, error?.message === 'request_too_large' ? 413 : 400);
    }
    if (!body) return reply({ error: 'invalid_request' }, 400);
    if (!fundingSourceSupported(body, kind)) return reply({ error: 'wallet_funding_valuation_unavailable' }, 503);
    path = kind === 'personal' ? '/api/member/wallet-funding/personal/intent' : '/api/member/wallet-funding/administrative/session';
  }
  try {
    const base = betterAuthConfig(env);
    const serialized = body ? JSON.stringify(body) : '';
    const headers = { cookie, ...(body ? { 'content-type': 'application/json', origin: request.headers.get('origin') || '' } : {}) };
    if (action === 'administrative') {
      const ip = trustedAuthClientIp(request.headers, env);
      const timestamp = String(Math.floor(Date.now() / 1000));
      const hash = value => createHash('sha256').update(value).digest('hex');
      const signature = createHmac('sha256', env.AUTH_BFF_SHARED_SECRET)
        .update([method, path, timestamp, ip, hash(cookie), hash(serialized)].join('\n')).digest('hex');
      headers['x-vp-auth-client-ip'] = ip;
      headers['x-vp-auth-timestamp'] = timestamp;
      headers['x-vp-auth-signature'] = signature;
    }
    const result = await serviceRequest(`${base}${path}`, {
      method, headers, body: serialized || undefined, signal: request.signal,
    }, fetchImpl);
    if (!result.ok) {
      if (statusRead && result.status === 404 && result.data?.error === 'wallet_funding_not_found') return reply({ error: 'wallet_funding_not_found' }, 404);
      const safeErrors = new Set(['invalid_request', 'unauthenticated', 'invalid_origin', 'wallet_not_linked', 'wallet_not_assigned',
        'wallet_funding_forbidden', 'wallet_funding_rate_limited', 'wallet_funding_request_already_used',
        'wallet_funding_unconfigured', 'wallet_funding_provider_unavailable', 'wallet_funding_unavailable',
        'wallet_funding_provider_authentication_unavailable', 'wallet_funding_valuation_unavailable', 'wallet_funding_network_changed',
        'wallet_funding_method_unavailable', 'wallet_funding_amount_out_of_range', 'wallet_funding_amount_unavailable']);
      diagnostic(action, 'upstream_response', result.status, safeErrors.has(result.data?.error) ? result.data.error : 'unclassified');
      return reply({ error: safeErrors.has(result.data?.error) ? result.data.error : 'funding_unavailable',
        reason: result.status === 404 ? 'gateway_route_missing' : result.status >= 500 ? 'gateway_service_unavailable' : 'gateway_rejected' },
        [400, 401, 403, 409, 413, 429, 503].includes(result.status) ? result.status : 502);
    }
    const safe = statusRead ? fundingStatus(result.data, kind)
      : action === 'personal-options' ? personalProductionOptions(result.data)
      : action === 'options' ? administrativeSandboxOptions(result.data)
      : action === 'history' ? fundingHistory(result.data, kind) : fundingAcknowledgement(result.data, kind);
    if (!safe) { diagnostic(action, 'response_contract', result.status || 200); return reply({ error: 'funding_unavailable', reason: 'invalid_gateway_response' }, 502); }
    if (requestedReference && (!('checkoutReference' in safe) || safe.checkoutReference !== requestedReference)) return reply({ error: 'funding_unavailable' }, 502);
    if (body && (!('requestedAmount' in safe) || !('checkoutReference' in safe) || safe.requestedAmount !== body.amount
      || fundingCurrencyCode(safe.sourceCurrencyCode) !== fundingCurrencyCode(body.sourceCurrencyCode)
      || safe.checkoutReference !== body.requestId || (kind === 'personal' && (!('paymentMethodType' in safe)
        || safe.paymentMethodType !== body.paymentMethodType || !('destination' in safe)
        || safe.destination.address.toLowerCase() !== body.walletAddress.toLowerCase())))) return reply({ error: 'funding_unavailable' }, 502);
    if (optionsContext && (!('country' in safe) || safe.country !== optionsContext.country
      || !('sourceCurrencyCode' in safe) || safe.sourceCurrencyCode !== optionsContext.sourceCurrencyCode
      || (action === 'options' && (!('serviceProvider' in safe) || !('serviceProvider' in optionsContext)
        || safe.serviceProvider !== optionsContext.serviceProvider)))) return reply({ error: 'funding_unavailable' }, 502);
    return reply(safe);
  } catch (error) {
    const code = ['service_request_cancelled', 'private_api_unavailable', 'worker_request_scope_required'].includes(error?.message)
      ? error.message : 'unclassified';
    diagnostic(action, 'transport', 0, code);
    return reply({ error: 'funding_unavailable', reason: 'gateway_transport_unavailable' }, 503);
  }
}
