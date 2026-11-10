import { betterAuthConfig, betterAuthCookies } from './better-auth-bridge.mjs';
import { coreFetch, runtimeEnvironment } from './cloudflare-runtime.mjs';
import { memberMutationError } from './member-mutation-policy.mjs';
import { boundedServiceRequest } from './private-service-request.mjs';
import { buildAdministrativeMeldOnrampUrl } from './meld-onramp.mjs';

const COUNTRY = /^[A-Z]{2}$/;
const METHOD = /^[A-Z0-9_]{2,40}$/;
const PROVIDER = /^[A-Z0-9_]{2,40}$/;
const ADDRESS = /^0x[0-9a-f]{40}$/i;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CRYPTO = 'USDT_POLYGON';
const ALLOWED_PROVIDERS = new Set(['TOPPER', 'SWAPPED']);
const headers = { 'Cache-Control': 'private, no-store' };
const reply = (body, status = 200) => Response.json(body, { status, headers });

function sessionCookie(request) {
  const cookie = betterAuthCookies(request.headers.get('cookie') || '');
  return cookie.split(';').some(part => /^(?:__Secure-)?better-auth\.session_token=[^;\s,]+$/.test(part.trim())) ? cookie : '';
}

function availability(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || typeof value.available !== 'boolean'
    || !COUNTRY.test(value.country || '') || value.fiat !== 'USD' || value.crypto !== CRYPTO
    || value.asset !== 'USDT' || value.network !== 'POLYGON'
    || !Array.isArray(value.paymentMethods) || value.paymentMethods.length > 20) return null;
  const methods = value.paymentMethods.flatMap(item => {
    if (!item || typeof item !== 'object' || Array.isArray(item) || !METHOD.test(item.code || '') || !METHOD.test(item.type || '')) return [];
    const bounded = number => number === null || (typeof number === 'number' && Number.isFinite(number) && number >= 0 && number <= 1_000_000);
    if (!bounded(item.minimum) || !bounded(item.maximum)) return [];
    return [{ code: item.code, type: item.type, minimum: item.minimum, maximum: item.maximum }];
  });
  if (methods.length !== value.paymentMethods.length) return null;
  return { available: value.available && methods.length > 0, country: value.country, fiat: 'USD', crypto: CRYPTO,
    asset: 'USDT', network: 'POLYGON', paymentMethods: methods };
}

function safeQuote(item) {
  const numeric = ['sourceAmount', 'destinationAmount', 'totalFee', 'transactionFee', 'networkFee', 'partnerFee'];
  if (!item || typeof item !== 'object' || Array.isArray(item) || !PROVIDER.test(item.serviceProvider || '')
    || !ALLOWED_PROVIDERS.has(item.serviceProvider)
    || !METHOD.test(item.paymentMethodType || '') || numeric.some(key => typeof item[key] !== 'number' || !Number.isFinite(item[key]))) return null;
  return Object.fromEntries(['serviceProvider', 'paymentMethodType', ...numeric].map(key => [key, item[key]]));
}

function quote(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || typeof value.available !== 'boolean') return null;
  if (!value.available) return value.reason === 'no_valid_quotes' ? { available: false, reason: 'no_valid_quotes' } : null;
  if (!Array.isArray(value.quotes) || value.quotes.length < 1 || value.quotes.length > 20) return null;
  const quotes = value.quotes.map(safeQuote);
  const best = safeQuote(value.quote);
  if (!best || quotes.some(item => !item)) return null;
  return { available: true, quote: best, quotes };
}

function intent(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || !UUID.test(value.checkoutReference || '')
    || !['personal', 'administrative'].includes(value.walletKind)) return null;
  const verifiedQuote = safeQuote(value.quote);
  const commission = value.commission;
  if (!verifiedQuote || !commission || typeof commission !== 'object' || Array.isArray(commission)
    || commission.ratePercent !== 1 || commission.status !== 'estimated'
    || typeof commission.estimatedUsd !== 'number' || !Number.isFinite(commission.estimatedUsd)
    || commission.estimatedUsd < 0 || commission.estimatedUsd > 250) return null;
  return { checkoutReference: value.checkoutReference, walletKind: value.walletKind, quote: verifiedQuote,
    commission: { ratePercent: 1, estimatedUsd: commission.estimatedUsd, status: 'estimated' } };
}

export async function handleMeldOnramp(request, action, {
  env = runtimeEnvironment(), fetchImpl = coreFetch, serviceRequest = boundedServiceRequest,
} = {}) {
  if (!['availability', 'quote', 'intent'].includes(action)) return reply({ error: 'method_not_allowed' }, 405);
  const expectedMethod = action === 'availability' ? 'GET' : 'POST';
  if (request.method !== expectedMethod) return reply({ error: 'method_not_allowed' }, 405);
  const cookie = sessionCookie(request);
  if (!cookie) return reply({ error: 'unauthenticated' }, 401);

  let path;
  let body;
  if (action === 'availability') {
    const url = new URL(request.url);
    const country = (url.searchParams.get('country') || '').toUpperCase();
    if (!COUNTRY.test(country) || url.searchParams.get('fiat') !== 'USD' || url.searchParams.get('crypto') !== CRYPTO) {
      return reply({ error: 'invalid_request' }, 400);
    }
    path = `/api/member/onramp/availability?country=${country}&fiat=USD&crypto=${CRYPTO}`;
  } else {
    const denied = memberMutationError(request, env);
    if (denied) return reply({ error: denied.error }, denied.status);
    const declared = request.headers.get('content-length');
    if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > 2048)) return reply({ error: 'request_too_large' }, 413);
    try { body = await request.json(); } catch { return reply({ error: 'invalid_request' }, 400); }
    if (!body || typeof body !== 'object' || Array.isArray(body) || !COUNTRY.test(body.country || '')
      || body.fiat !== 'USD' || body.crypto !== CRYPTO || typeof body.amount !== 'number' || !Number.isFinite(body.amount)
      || body.amount < 50 || body.amount > 25_000
      || (body.paymentMethodType !== undefined && !METHOD.test(body.paymentMethodType))
      || (body.walletAddress !== undefined && !ADDRESS.test(body.walletAddress))) return reply({ error: 'invalid_request' }, 400);
    if (action === 'intent' && (!['personal', 'administrative'].includes(body.walletKind)
      || !ADDRESS.test(body.walletAddress || '') || !METHOD.test(body.paymentMethodType || '')
      || !PROVIDER.test(body.serviceProvider || '') || !ALLOWED_PROVIDERS.has(body.serviceProvider))) {
      return reply({ error: 'invalid_request' }, 400);
    }
    const keys = Object.keys(body);
    const allowedKeys = action === 'intent'
      ? ['walletKind', 'walletAddress', 'country', 'fiat', 'crypto', 'amount', 'paymentMethodType', 'serviceProvider']
      : ['country', 'fiat', 'crypto', 'amount', 'paymentMethodType', 'walletAddress'];
    if (keys.some(key => !allowedKeys.includes(key))) return reply({ error: 'invalid_request' }, 400);
    path = action === 'intent' ? '/api/member/onramp/intent' : '/api/member/onramp/quote';
  }

  const administrative = action === 'intent' && body.walletKind === 'administrative';
  let administrativeProviderUrl;
  if (administrative) {
    try {
      administrativeProviderUrl = env.MELD_CHECKOUT_URL;
      if (typeof administrativeProviderUrl !== 'string' || administrativeProviderUrl.length > 8192) throw new Error();
      // Validate the commercial checkout before the backend creates an intent.
      // This configuration is independent of the personal Reown connection.
      buildAdministrativeMeldOnrampUrl({
        providerUrl: administrativeProviderUrl, address: body.walletAddress,
        checkoutReference: 'configuration-preflight', countryCode: body.country,
        amount: body.amount, paymentMethodType: body.paymentMethodType, serviceProvider: body.serviceProvider,
      });
    } catch {
      return reply({ error: 'onramp_unconfigured' }, 503);
    }
  }

  try {
    const result = await serviceRequest(`${betterAuthConfig(env)}${path}`, {
      method: expectedMethod,
      headers: { cookie, ...(action !== 'availability'
        ? { 'content-type': 'application/json', origin: request.headers.get('origin') || '' } : {}) },
      body: action !== 'availability' ? JSON.stringify(body) : undefined,
      signal: request.signal,
    }, fetchImpl);
    if (!result.ok) {
      const status = [400, 401, 403, 409, 413, 503].includes(result.status) ? result.status : 502;
      const safe = ['invalid_request', 'unauthenticated', 'invalid_origin', 'onramp_quote_unavailable', 'onramp_unconfigured', 'onramp_unavailable'];
      return reply({ error: safe.includes(result.data?.error) ? result.data.error : 'onramp_unavailable' }, status);
    }
    const value = action === 'availability' ? availability(result.data) : action === 'quote' ? quote(result.data) : intent(result.data);
    if (!value || (action === 'intent' && value.walletKind !== body.walletKind)) {
      return reply({ error: 'onramp_unavailable' }, 502);
    }
    if (administrative) {
      try {
        const checkoutUrl = buildAdministrativeMeldOnrampUrl({
          providerUrl: administrativeProviderUrl, address: body.walletAddress,
          checkoutReference: value.checkoutReference, countryCode: body.country,
          amount: value.quote.sourceAmount, paymentMethodType: value.quote.paymentMethodType,
          serviceProvider: value.quote.serviceProvider,
        });
        return reply({ ...value, checkoutUrl });
      } catch {
        return reply({ error: 'onramp_unavailable' }, 502);
      }
    }
    return reply(value);
  } catch {
    return reply({ error: 'onramp_unavailable' }, 503);
  }
}
