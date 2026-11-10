export const FUNDING_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ADDRESS = /^0x[0-9a-f]{40}$/i;
const COUNTRY = /^[A-Z]{2}$/;
const METHOD = /^[A-Z0-9_]{2,40}$/;
const PROVIDERS = new Set(['TRANSAK', 'BANXA']);
const STATUSES = new Set(['initiated', 'session_created', 'unavailable', 'failed']);

export function validFundingAmount(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 50 && value <= 25_000
    && Math.abs(value * 100 - Math.round(value * 100)) < 0.000001;
}

export function fundingInput(value, kind) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || !['personal', 'administrative'].includes(kind)) return null;
  const keys = ['requestId', 'walletAddress', 'country', 'amount', ...(kind === 'administrative' ? ['serviceProvider', 'paymentMethodType'] : [])];
  if (Object.keys(value).some(key => !keys.includes(key)) || !FUNDING_UUID.test(value.requestId || '')
    || !ADDRESS.test(value.walletAddress || '') || !COUNTRY.test(value.country || '') || !validFundingAmount(value.amount)) return null;
  if (kind === 'administrative' && (!PROVIDERS.has(value.serviceProvider)
    || (value.paymentMethodType !== undefined && !METHOD.test(value.paymentMethodType)))) return null;
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
  return safe;
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

export function administrativeSandboxOptions(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.walletKind !== 'administrative'
    || value.environment !== 'sandbox' || value.provider !== 'meld' || !COUNTRY.test(value.country || '')
    || !PROVIDERS.has(value.serviceProvider) || !Array.isArray(value.paymentMethods) || value.paymentMethods.length > 20
    || value.paymentMethods.some(method => typeof method !== 'string' || !METHOD.test(method))
    || new Set(value.paymentMethods).size !== value.paymentMethods.length) return null;
  return { walletKind: 'administrative', environment: 'sandbox', provider: 'meld', country: value.country,
    serviceProvider: value.serviceProvider, paymentMethods: [...value.paymentMethods] };
}
