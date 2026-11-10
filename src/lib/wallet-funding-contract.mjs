export const FUNDING_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ADDRESS = /^0x[0-9a-f]{40}$/i;
const COUNTRY = /^[A-Z]{2}$/;
const METHOD = /^[A-Z0-9_]{2,40}$/;
const PROVIDERS = new Set(['TRANSAK', 'BANXA']);
const PERSONAL_PROVIDERS = new Set(['TOPPER', 'SWAPPED']);
const STATUSES = new Set(['initiated', 'session_created', 'unavailable', 'failed']);
export const WALLET_GATEWAY_FAILURE_REASONS = Object.freeze(['gateway_route_missing', 'gateway_service_unavailable',
  'gateway_rejected', 'invalid_gateway_response', 'gateway_transport_unavailable']);

export function validFundingAmount(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 50 && value <= 25_000
    && Math.abs(value * 100 - Math.round(value * 100)) < 0.000001;
}

export function fundingInput(value, kind) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || !['personal', 'administrative'].includes(kind)) return null;
  const keys = ['requestId', 'walletAddress', 'country', 'amount', 'paymentMethodType', ...(kind === 'administrative' ? ['serviceProvider'] : [])];
  if (Object.keys(value).some(key => !keys.includes(key)) || !FUNDING_UUID.test(value.requestId || '')
    || !ADDRESS.test(value.walletAddress || '') || !COUNTRY.test(value.country || '') || !validFundingAmount(value.amount)
    || !METHOD.test(value.paymentMethodType || '')) return null;
  if (kind === 'administrative' && !PROVIDERS.has(value.serviceProvider)) return null;
  return Object.fromEntries(keys.filter(key => value[key] !== undefined).map(key => [key, value[key]]));
}

export function sandboxCheckoutUrl(value) {
  if (typeof value !== 'string' || value.length > 8192) return null;
  try {
    const url = new URL(value);
    if (url.origin !== 'https://sb.meldcrypto.com' || url.username || url.password || url.hash
      || !url.search || /[\r\n]/.test(value)) return null;
    return value;
  } catch { return null; }
}

export function fundingAcknowledgement(value, kind) {
  const environment = kind === 'personal' ? 'production' : 'sandbox';
  const provider = kind === 'personal' ? 'reown' : 'meld';
  const status = kind === 'personal' ? 'initiated' : 'session_created';
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.walletKind !== kind
    || value.environment !== environment || value.provider !== provider || value.status !== status
    || !FUNDING_UUID.test(value.checkoutReference || '') || !validFundingAmount(value.requestedAmount)
    || typeof value.createdAt !== 'string' || value.createdAt.length > 64 || !Number.isFinite(Date.parse(value.createdAt))) return null;
  const safe = { checkoutReference: value.checkoutReference, walletKind: kind, environment, provider, status,
    requestedAmount: value.requestedAmount, createdAt: value.createdAt };
  if (kind === 'administrative') {
    const checkoutUrl = sandboxCheckoutUrl(value.checkoutUrl);
    if (!checkoutUrl) return null;
    return { ...safe, checkoutUrl };
  }
  if (!METHOD.test(value.paymentMethodType || '') || !Array.isArray(value.allowedProviders)
    || value.allowedProviders.length < 1 || value.allowedProviders.length > 2
    || value.allowedProviders.some(provider => !PERSONAL_PROVIDERS.has(provider))
    || new Set(value.allowedProviders).size !== value.allowedProviders.length) return null;
  return { ...safe, paymentMethodType: value.paymentMethodType, allowedProviders: [...value.allowedProviders] };
}

export function fundingHistory(value, kind) {
  const environment = kind === 'personal' ? 'production' : 'sandbox';
  const provider = kind === 'personal' ? 'reown' : 'meld';
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.walletKind !== kind
    || value.environment !== environment || value.settlement !== 'unconfirmed'
    || !Array.isArray(value.records) || value.records.length > 50) return null;
  const records = value.records.map(record => {
    if (!record || !FUNDING_UUID.test(record.checkoutReference || '') || !validFundingAmount(record.requestedAmount)
      || !COUNTRY.test(record.country || '') || !STATUSES.has(record.status) || record.provider !== provider
      || (kind === 'personal' && record.status !== 'initiated')
      || typeof record.createdAt !== 'string' || record.createdAt.length > 64 || !Number.isFinite(Date.parse(record.createdAt))) return null;
    return { checkoutReference: record.checkoutReference, requestedAmount: record.requestedAmount, country: record.country,
      status: record.status, createdAt: record.createdAt, provider };
  });
  if (records.some(record => !record) || new Set(records.map(record => record.checkoutReference)).size !== records.length) return null;
  return { walletKind: kind, environment, settlement: 'unconfirmed', records };
}

/** Reads a persisted request, never a checkout callback's claimed payment result.
 * Settlement remains unconfirmed until an authenticated provider event is
 * implemented and stored by the backend. Opening a checkout cannot change it.
 */
export function fundingStatus(value, kind) {
  if (!['personal', 'administrative'].includes(kind)) return null;
  const environment = kind === 'personal' ? 'production' : 'sandbox';
  const provider = kind === 'personal' ? 'reown' : 'meld';
  const destination = value?.destination;
  const confirmation = value?.confirmation;
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.walletKind !== kind
    || value.environment !== environment || value.provider !== provider
    || typeof value.checkoutReference !== 'string' || value.checkoutReference.length !== 36
    || !FUNDING_UUID.test(value.checkoutReference) || !validFundingAmount(value.requestedAmount)
    || typeof value.country !== 'string' || value.country.length !== 2 || !COUNTRY.test(value.country) || !STATUSES.has(value.requestStatus)
    || (kind === 'personal' && value.requestStatus !== 'initiated')
    || !destination || typeof destination !== 'object' || Array.isArray(destination)
    || typeof destination.address !== 'string' || destination.address.length !== 42 || !ADDRESS.test(destination.address) || destination.asset !== 'USDT'
    || destination.network !== 'polygon' || destination.chainId !== 137
    || !confirmation || typeof confirmation !== 'object' || Array.isArray(confirmation)
    || confirmation.state !== 'unconfirmed' || confirmation.source !== 'none'
    || confirmation.testMode !== (kind === 'administrative')) return null;
  return { checkoutReference: value.checkoutReference.toLowerCase(), walletKind: kind, environment, provider,
    requestedAmount: value.requestedAmount, country: value.country, requestStatus: value.requestStatus,
    destination: { address: destination.address, asset: 'USDT', network: 'polygon', chainId: 137 },
    confirmation: { state: 'unconfirmed', source: 'none', testMode: kind === 'administrative' } };
}

export function administrativeSandboxOptions(value) {
  const safe = fundingOptions(value, 'administrative');
  if (!safe || !PROVIDERS.has(value.serviceProvider) || safe.routes.some(route => route.serviceProvider !== value.serviceProvider)) return null;
  return { ...safe, serviceProvider: value.serviceProvider };
}

export function personalProductionOptions(value) { return fundingOptions(value, 'personal'); }

function fundingOptions(value, kind) {
  const administrative = kind === 'administrative';
  const environment = administrative ? 'sandbox' : 'production';
  const provider = administrative ? 'meld' : 'reown';
  const providers = administrative ? PROVIDERS : PERSONAL_PROVIDERS;
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.walletKind !== kind
    || value.environment !== environment || value.provider !== provider || !COUNTRY.test(value.country || '')
    || !Array.isArray(value.paymentMethods) || value.paymentMethods.length > 40
    || value.paymentMethods.some(method => typeof method !== 'string' || !METHOD.test(method))
    || new Set(value.paymentMethods).size !== value.paymentMethods.length
    || !Array.isArray(value.routes) || value.routes.length > 2) return null;
  const routes = value.routes.map(route => {
    if (!route || !providers.has(route.serviceProvider) || !Array.isArray(route.paymentMethods)
      || route.paymentMethods.length < 1 || route.paymentMethods.length > 40) return null;
    const paymentMethods = route.paymentMethods.map(method => {
      if (!method || !METHOD.test(method.method || '') || !Number.isFinite(method.minimumUsd) || method.minimumUsd < 0
        || !Number.isFinite(method.maximumUsd) || method.maximumUsd < method.minimumUsd) return null;
      return { method: method.method, minimumUsd: method.minimumUsd, maximumUsd: method.maximumUsd };
    });
    if (paymentMethods.some(method => !method) || new Set(paymentMethods.map(method => method.method)).size !== paymentMethods.length) return null;
    return { serviceProvider: route.serviceProvider, paymentMethods };
  });
  if (routes.some(route => !route) || new Set(routes.map(route => route.serviceProvider)).size !== routes.length) return null;
  const methods = new Set(routes.flatMap(route => route.paymentMethods.map(method => method.method)));
  if (methods.size !== value.paymentMethods.length || value.paymentMethods.some(method => !methods.has(method))) return null;
  return { walletKind: kind, environment, provider, country: value.country, paymentMethods: [...value.paymentMethods], routes };
}
