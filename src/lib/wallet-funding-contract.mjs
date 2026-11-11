import { PERSONAL_WALLET_MINIMUM_USD, PERSONAL_WALLET_MAXIMUM_USD } from './personal-wallet.mjs';

export const FUNDING_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ADDRESS = /^0x[0-9a-f]{40}$/i;
const COUNTRY = /^[A-Z]{2}$/;
const CURRENCY = /^[A-Z]{3}$/;
const METHOD = /^[A-Z0-9_]{2,40}$/;
const PROVIDERS = new Set(['TRANSAK', 'BANXA']);
export const PERSONAL_FUNDING_PROVIDERS = Object.freeze(['SWAPPED', 'MERCURYO']);
export const PERSONAL_FUNDING_DESTINATION = Object.freeze({ destinationCurrencyCode: 'USDT_POLYGON', network: 'polygon', chainId: 137 });
const PERSONAL_PROVIDERS = new Set(PERSONAL_FUNDING_PROVIDERS);
export const PERSONAL_FUNDING_MINIMUM_USD = PERSONAL_WALLET_MINIMUM_USD;
export const PERSONAL_FUNDING_MAXIMUM_USD = PERSONAL_WALLET_MAXIMUM_USD;
// A fixed Mindbliss amount in pesos, not a live USD conversion.
export const PERSONAL_FUNDING_MINIMUM_MXN = 931;
export const ADMINISTRATIVE_FUNDING_MINIMUM_USD = 50;
export const PERSONAL_FUNDING_COUNTRIES = Object.freeze(['US', 'MX', 'CO']);
export const PERSONAL_FUNDING_BLOCKED_METHODS = Object.freeze(['NETELLER', 'SKRILL']);
const STATUSES = new Set(['initiated', 'session_created', 'unavailable', 'failed']);
export const WALLET_GATEWAY_FAILURE_REASONS = Object.freeze(['gateway_route_missing', 'gateway_service_unavailable',
  'gateway_rejected', 'invalid_gateway_response', 'gateway_transport_unavailable']);

export function validFundingAmount(value, kind = 'personal') {
  const minimum = kind === 'personal' ? PERSONAL_FUNDING_MINIMUM_USD : kind === 'administrative' ? ADMINISTRATIVE_FUNDING_MINIMUM_USD : null;
  const maximum = kind === 'personal' ? PERSONAL_FUNDING_MAXIMUM_USD : 25_000;
  return minimum !== null && typeof value === 'number' && Number.isFinite(value) && value >= minimum && value <= maximum
    && Math.abs(value * 100 - Math.round(value * 100)) < 0.000001;
}

/** Currency syntax is not eligibility: the selected provider must return a route. */
export function fundingCurrencyCode(value = 'USD') {
  return typeof value === 'string' && CURRENCY.test(value) ? value : null;
}

export function personalFundingCountry(value) {
  return typeof value === 'string' && PERSONAL_FUNDING_COUNTRIES.includes(value);
}

export function personalFundingMethod(value) {
  return typeof value === 'string' && METHOD.test(value) && !PERSONAL_FUNDING_BLOCKED_METHODS.includes(value);
}

function validFiatAmount(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= 1_000_000_000
    && Math.abs(value * 100 - Math.round(value * 100)) < 0.000001;
}

/** New SPEI requests use the fixed MXN floor plus provider limits, never a USD valuation. */
export function validFundingSourceAmount(value, kind = 'personal', sourceCurrencyCode = 'USD') {
  if (sourceCurrencyCode === 'USD') return validFundingAmount(value, kind);
  return kind === 'personal' && sourceCurrencyCode === 'MXN' && validFiatAmount(value) && value >= PERSONAL_FUNDING_MINIMUM_MXN;
}

export function fundingSourceSupported(value, kind) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || !['personal', 'administrative'].includes(kind)) return false;
  const currency = fundingCurrencyCode(value?.sourceCurrencyCode);
  return currency === 'USD' || (kind === 'personal' && currency === 'MXN'
    && (value.country || value.countryCode) === 'MX' && value.paymentMethodType === 'SPEI');
}

function requestedSource(value, kind, countryRequired = false) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const currency = fundingCurrencyCode(value?.sourceCurrencyCode);
  // Historical requests retain their actual original amount after policy changes.
  const historicalPersonal = countryRequired && kind === 'personal' && ['USD', 'MXN'].includes(currency);
  const historicalAmount = validFiatAmount(value.requestedAmount)
    && (currency !== 'USD' || (value.requestedAmount >= 20 && value.requestedAmount <= 25_000));
  if (!currency || !(historicalPersonal ? historicalAmount : validFundingSourceAmount(value.requestedAmount, kind, currency))) return null;
  if (currency !== 'USD' && (value.paymentMethodType !== 'SPEI'
    || (countryRequired && value.country !== 'MX'))) return null;
  if (value.paymentMethodType !== undefined
    && (typeof value.paymentMethodType !== 'string' || !METHOD.test(value.paymentMethodType))) return null;
  return { ...(value.sourceCurrencyCode !== undefined ? { sourceCurrencyCode: currency } : {}),
    ...(value.paymentMethodType !== undefined ? { paymentMethodType: value.paymentMethodType } : {}) };
}

export function fundingInput(value, kind) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || !['personal', 'administrative'].includes(kind)) return null;
  const currency = fundingCurrencyCode(value.sourceCurrencyCode);
  const keys = ['requestId', 'walletAddress', 'country', 'amount', 'paymentMethodType', 'sourceCurrencyCode', ...(kind === 'administrative' ? ['serviceProvider'] : [])];
  if (Object.keys(value).some(key => !keys.includes(key)) || !FUNDING_UUID.test(value.requestId || '')
    || !ADDRESS.test(value.walletAddress || '') || !COUNTRY.test(value.country || '') || !currency
    || !((currency === 'USD' || (kind === 'personal' && currency === 'MXN'))
      ? validFundingSourceAmount(value.amount, kind, currency) : validFiatAmount(value.amount))
    || typeof value.paymentMethodType !== 'string' || !METHOD.test(value.paymentMethodType)) return null;
  if (kind === 'administrative' && !PROVIDERS.has(value.serviceProvider)) return null;
  if (kind === 'personal' && (!personalFundingCountry(value.country) || !personalFundingMethod(value.paymentMethodType))) return null;
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
  if (!['personal', 'administrative'].includes(kind)) return null;
  const environment = kind === 'personal' ? 'production' : 'sandbox';
  const provider = kind === 'personal' ? 'reown' : 'meld';
  const status = kind === 'personal' ? 'initiated' : 'session_created';
  const source = requestedSource(value, kind);
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.walletKind !== kind
    || value.environment !== environment || value.provider !== provider || value.status !== status
    || !FUNDING_UUID.test(value.checkoutReference || '') || !source
    || typeof value.createdAt !== 'string' || value.createdAt.length > 64 || !Number.isFinite(Date.parse(value.createdAt))) return null;
  const safe = { checkoutReference: value.checkoutReference, walletKind: kind, environment, provider, status,
    requestedAmount: value.requestedAmount, createdAt: value.createdAt, ...source };
  if (kind === 'administrative') {
    const checkoutUrl = sandboxCheckoutUrl(value.checkoutUrl);
    if (!checkoutUrl) return null;
    return { ...safe, checkoutUrl };
  }
  if (!personalFundingMethod(value.paymentMethodType) || !Array.isArray(value.allowedProviders)
    || value.allowedProviders.length < 1 || value.allowedProviders.length > 2
    || value.allowedProviders.some(provider => !PERSONAL_PROVIDERS.has(provider))
    || new Set(value.allowedProviders).size !== value.allowedProviders.length) return null;
  const destination = fundingDestination(value.destination, kind);
  if (!destination || destination.network !== 'polygon' || destination.chainId !== 137
    || value.destinationCurrencyCode !== PERSONAL_FUNDING_DESTINATION.destinationCurrencyCode) return null;
  return { ...safe, destinationCurrencyCode: PERSONAL_FUNDING_DESTINATION.destinationCurrencyCode, destination,
    paymentMethodType: value.paymentMethodType, allowedProviders: [...value.allowedProviders] };
}

function fundingDestination(value, kind) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || typeof value.address !== 'string' || value.address.length !== 42 || !ADDRESS.test(value.address) || value.asset !== 'USDT'
    || !((value.network === 'polygon' && value.chainId === 137)
      || (kind === 'personal' && value.network === 'ethereum' && value.chainId === 1))) return null;
  return { address: value.address, asset: 'USDT', network: value.network, chainId: value.chainId };
}

export function fundingHistory(value, kind) {
  if (!['personal', 'administrative'].includes(kind)) return null;
  const environment = kind === 'personal' ? 'production' : 'sandbox';
  const provider = kind === 'personal' ? 'reown' : 'meld';
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.walletKind !== kind
    || value.environment !== environment || value.settlement !== 'unconfirmed'
    || !Array.isArray(value.records) || value.records.length > 50) return null;
  const records = value.records.map(record => {
    const source = requestedSource(record, kind, true);
    const destination = record?.destination === undefined ? undefined : fundingDestination(record.destination, kind);
    if (!record || !FUNDING_UUID.test(record.checkoutReference || '') || !source
      || !COUNTRY.test(record.country || '') || !STATUSES.has(record.status) || record.provider !== provider
      || (kind === 'personal' && record.status !== 'initiated')
      || destination === null || typeof record.createdAt !== 'string' || record.createdAt.length > 64 || !Number.isFinite(Date.parse(record.createdAt))) return null;
    return { checkoutReference: record.checkoutReference, requestedAmount: record.requestedAmount, country: record.country,
      status: record.status, createdAt: record.createdAt, provider, ...source, ...(destination ? { destination } : {}) };
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
  const destination = fundingDestination(value?.destination, kind);
  const confirmation = value?.confirmation;
  const source = requestedSource(value, kind, true);
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.walletKind !== kind
    || value.environment !== environment || value.provider !== provider
    || typeof value.checkoutReference !== 'string' || value.checkoutReference.length !== 36
    || !FUNDING_UUID.test(value.checkoutReference) || !source
    || typeof value.country !== 'string' || value.country.length !== 2 || !COUNTRY.test(value.country) || !STATUSES.has(value.requestStatus)
    || (kind === 'personal' && value.requestStatus !== 'initiated')
    || !destination
    || !confirmation || typeof confirmation !== 'object' || Array.isArray(confirmation)
    || confirmation.state !== 'unconfirmed' || confirmation.source !== 'none'
    || confirmation.testMode !== (kind === 'administrative')) return null;
  return { checkoutReference: value.checkoutReference.toLowerCase(), walletKind: kind, environment, provider,
    requestedAmount: value.requestedAmount, country: value.country, requestStatus: value.requestStatus, ...source,
    destination,
    confirmation: { state: 'unconfirmed', source: 'none', testMode: kind === 'administrative' } };
}

export function administrativeSandboxOptions(value) {
  const safe = fundingOptions(value, 'administrative');
  if (!safe || !PROVIDERS.has(value.serviceProvider) || safe.routes.some(route => route.serviceProvider !== value.serviceProvider)) return null;
  return { ...safe, serviceProvider: value.serviceProvider };
}

export function personalProductionOptions(value) {
  if (!value || Object.entries(PERSONAL_FUNDING_DESTINATION).some(([key, expected]) => value[key] !== expected)) return null;
  const safe = fundingOptions(value, 'personal');
  return safe ? { ...safe, ...PERSONAL_FUNDING_DESTINATION } : null;
}

function fundingOptions(value, kind) {
  const administrative = kind === 'administrative';
  const environment = administrative ? 'sandbox' : 'production';
  const provider = administrative ? 'meld' : 'reown';
  const providers = administrative ? PROVIDERS : PERSONAL_PROVIDERS;
  const sourceCurrencyCode = fundingCurrencyCode(value?.sourceCurrencyCode);
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.walletKind !== kind
    || value.environment !== environment || value.provider !== provider || !COUNTRY.test(value.country || '') || !sourceCurrencyCode
    || (!administrative && !personalFundingCountry(value.country))
    || !Array.isArray(value.paymentMethods) || value.paymentMethods.length > 40
    || value.paymentMethods.some(method => typeof method !== 'string' || !METHOD.test(method))
    || new Set(value.paymentMethods).size !== value.paymentMethods.length
    || !Array.isArray(value.routes) || value.routes.length > 2) return null;
  const routes = value.routes.map(route => {
    if (!route || !providers.has(route.serviceProvider) || !Array.isArray(route.paymentMethods)
      || route.paymentMethods.length < 1 || route.paymentMethods.length > 40) return null;
    const paymentMethods = route.paymentMethods.map(method => {
      if (!method || typeof method !== 'object' || Array.isArray(method)
        || typeof method.method !== 'string' || !METHOD.test(method.method)) return null;
      const canonical = method.currencyCode !== undefined || method.minimumAmount !== undefined || method.maximumAmount !== undefined;
      const legacy = method.minimumUsd !== undefined || method.maximumUsd !== undefined;
      // Legacy USD limits are accepted only for USD. A local-fiat limit must
      // identify its currency and cannot borrow values labelled as dollars.
      if (!canonical && sourceCurrencyCode !== 'USD') return null;
      const currencyCode = canonical ? method.currencyCode : 'USD';
      const minimumAmount = canonical ? method.minimumAmount : method.minimumUsd;
      const maximumAmount = canonical ? method.maximumAmount : method.maximumUsd;
      if (currencyCode !== sourceCurrencyCode || !Number.isFinite(minimumAmount) || minimumAmount < 0
        || !Number.isFinite(maximumAmount) || maximumAmount < minimumAmount || maximumAmount > 1_000_000_000
        || (legacy && (currencyCode !== 'USD' || (canonical
          && (method.minimumUsd !== minimumAmount || method.maximumUsd !== maximumAmount))))) return null;
      return { method: method.method, currencyCode, minimumAmount, maximumAmount,
        ...(currencyCode === 'USD' ? { minimumUsd: minimumAmount, maximumUsd: maximumAmount } : {}) };
    });
    if (paymentMethods.some(method => !method) || new Set(paymentMethods.map(method => method.method)).size !== paymentMethods.length) return null;
    return { serviceProvider: route.serviceProvider, paymentMethods };
  });
  if (routes.some(route => !route) || new Set(routes.map(route => route.serviceProvider)).size !== routes.length) return null;
  const methods = new Set(routes.flatMap(route => route.paymentMethods.map(method => method.method)));
  if (methods.size !== value.paymentMethods.length || value.paymentMethods.some(method => !methods.has(method))) return null;
  const safeRoutes = administrative ? routes : routes.map(route => ({ ...route,
    paymentMethods: route.paymentMethods.filter(method => personalFundingMethod(method.method)
      && fundingSourceSupported({ sourceCurrencyCode, country: value.country, paymentMethodType: method.method }, 'personal'))
      .map(method => {
        const minimumAmount = Math.max(sourceCurrencyCode === 'MXN' ? PERSONAL_FUNDING_MINIMUM_MXN : PERSONAL_FUNDING_MINIMUM_USD, method.minimumAmount);
        const maximumAmount = Math.min(sourceCurrencyCode === 'USD' ? PERSONAL_FUNDING_MAXIMUM_USD : 1_000_000_000, method.maximumAmount);
        return { ...method, minimumAmount, maximumAmount,
          ...(sourceCurrencyCode === 'USD' ? { minimumUsd: minimumAmount, maximumUsd: maximumAmount } : {}) };
      })
      .filter(method => method.maximumAmount >= method.minimumAmount),
  })).filter(route => route.paymentMethods.length > 0);
  const safeMethods = new Set(safeRoutes.flatMap(route => route.paymentMethods.map(method => method.method)));
  return { walletKind: kind, environment, provider, country: value.country, sourceCurrencyCode,
    paymentMethods: administrative ? [...value.paymentMethods] : value.paymentMethods.filter(method => safeMethods.has(method)), routes: safeRoutes };
}
