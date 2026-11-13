import { PERSONAL_WALLET_MINIMUM_USD, PERSONAL_WALLET_MAXIMUM_USD } from './personal-wallet.mjs';

export const FUNDING_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ADDRESS = /^0x[0-9a-f]{40}$/i;
const COUNTRY = /^[A-Z]{2}$/;
const CURRENCY = /^[A-Z]{3}$/;
const METHOD = /^[A-Z0-9_]{2,40}$/;
const PROVIDERS = new Set(['TRANSAK', 'BANXA']);
export const PERSONAL_FUNDING_PROVIDERS = Object.freeze(['SWAPPED', 'MERCURYO', 'ONRAMPMONEY', 'TOPPER']);
export const PERSONAL_FUNDING_DESTINATION = Object.freeze({ destinationCurrencyCode: 'USDT_POLYGON', network: 'polygon', chainId: 137 });
const PERSONAL_PROVIDERS = new Set(PERSONAL_FUNDING_PROVIDERS);
export const PERSONAL_FUNDING_MINIMUM_USD = PERSONAL_WALLET_MINIMUM_USD;
export const PERSONAL_FUNDING_MAXIMUM_USD = PERSONAL_WALLET_MAXIMUM_USD;
// A fixed Mindbliss amount in pesos, not a live USD conversion.
export const PERSONAL_FUNDING_MINIMUM_MXN = 931;
export const PERSONAL_FUNDING_MINIMUM_COP = 170_000;
export const PERSONAL_FUNDING_MAXIMUM_COP = 4_000_000;
export const ADMINISTRATIVE_FUNDING_MINIMUM_USD = 50;
export const PERSONAL_FUNDING_COUNTRIES = Object.freeze(['US', 'MX', 'CO']);
export const PERSONAL_FUNDING_BLOCKED_METHODS = Object.freeze(['NETELLER', 'PAYSAFECARD', 'PAYSAFE_CARD', 'SKRILL', 'SKIRLL']);
// Temporary integration gate: AstroPay can quote while hosted checkout has no usable payment method.
export const PERSONAL_FUNDING_UNAVAILABLE_METHODS = Object.freeze(['ASTROPAY']);
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
  return typeof value === 'string' && METHOD.test(value) && !PERSONAL_FUNDING_BLOCKED_METHODS.includes(value)
    && !PERSONAL_FUNDING_UNAVAILABLE_METHODS.includes(value);
}

/** Provider eligibility belongs to the exact country/currency route. */
export function personalFundingProviders(country, sourceCurrencyCode = 'USD', paymentMethodType = '') {
  if (['VENMO', 'PAYPAL'].includes(paymentMethodType)) return country === 'US' && sourceCurrencyCode === 'USD' ? ['TOPPER'] : [];
  if (country === 'CO' && sourceCurrencyCode === 'USD') return !paymentMethodType || ['CREDIT_DEBIT_CARD', 'APPLE_PAY', 'GOOGLE_PAY'].includes(paymentMethodType) ? ['SWAPPED'] : [];
  if (country === 'US' && sourceCurrencyCode === 'USD') return !paymentMethodType || ['CREDIT_DEBIT_CARD', 'APPLE_PAY', 'GOOGLE_PAY'].includes(paymentMethodType)
    ? ['SWAPPED', 'MERCURYO', 'TOPPER'] : ['SWAPPED', 'MERCURYO'];
  return (sourceCurrencyCode === 'USD' && country === 'MX') || (country === 'MX' && sourceCurrencyCode === 'MXN')
    ? ['SWAPPED', 'MERCURYO'] : [];
}

function validFiatAmount(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= 1_000_000_000
    && Math.abs(value * 100 - Math.round(value * 100)) < 0.000001;
}

/** Local fiat stays in its actual currency; sandbox MXN uses the provider's limits. */
export function validFundingSourceAmount(value, kind = 'personal', sourceCurrencyCode = 'USD') {
  if (sourceCurrencyCode === 'USD') return validFundingAmount(value, kind);
  if (kind === 'administrative') return sourceCurrencyCode === 'MXN' && validFiatAmount(value);
  return kind === 'personal' && validFiatAmount(value) && sourceCurrencyCode === 'MXN' && value >= PERSONAL_FUNDING_MINIMUM_MXN;
}

export function fundingSourceSupported(value, kind) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || !['personal', 'administrative'].includes(kind)) return false;
  const currency = fundingCurrencyCode(value?.sourceCurrencyCode);
  if (kind === 'administrative') return currency === 'USD' || (currency === 'MXN'
    && (value.country || value.countryCode) === 'MX'
    && ['CREDIT_DEBIT_CARD', 'APPLE_PAY', 'GOOGLE_PAY'].includes(value.paymentMethodType)
    && (value.serviceProvider !== 'BANXA' || value.paymentMethodType === 'CREDIT_DEBIT_CARD'));
  if (currency === 'USD') return kind !== 'personal' || ((value.country || value.countryCode) === 'CO'
    ? ['CREDIT_DEBIT_CARD', 'APPLE_PAY', 'GOOGLE_PAY'].includes(value.paymentMethodType)
    : !['SPEI', 'PSE', 'LOCAL_BANK_TRANSFER'].includes(value.paymentMethodType)
      && (!['VENMO', 'PAYPAL'].includes(value.paymentMethodType) || (value.country || value.countryCode) === 'US'));
  return kind === 'personal' && ((currency === 'MXN' && (value.country || value.countryCode) === 'MX'
    && ['SPEI', 'CREDIT_DEBIT_CARD', 'APPLE_PAY', 'GOOGLE_PAY'].includes(value.paymentMethodType)));
}

function requestedSource(value, kind, countryRequired = false) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const currency = fundingCurrencyCode(value?.sourceCurrencyCode);
  // Historical requests retain their actual original amount after policy changes.
  const historicalPersonal = countryRequired && kind === 'personal' && ['USD', 'MXN', 'COP'].includes(currency);
  const historicalAmount = validFiatAmount(value.requestedAmount)
    && (currency !== 'USD' || (value.requestedAmount >= 20 && value.requestedAmount <= 25_000));
  if (!currency || !(historicalPersonal ? historicalAmount : validFundingSourceAmount(value.requestedAmount, kind, currency))) return null;
  if (currency !== 'USD' && kind === 'administrative' && (currency !== 'MXN'
    || (countryRequired && (value.country !== 'MX' || !['CREDIT_DEBIT_CARD', 'APPLE_PAY', 'GOOGLE_PAY'].includes(value.paymentMethodType))))) return null;
  if (currency !== 'USD' && kind === 'personal' && !(currency === 'MXN' ? ['SPEI', 'CREDIT_DEBIT_CARD', 'APPLE_PAY', 'GOOGLE_PAY'].includes(value.paymentMethodType)
    && (!countryRequired || value.country === 'MX') : currency === 'COP' && ['PSE', 'LOCAL_BANK_TRANSFER'].includes(value.paymentMethodType)
      && (!countryRequired || value.country === 'CO'))) return null;
  if ((value.paymentMethodType === 'VENMO' || (kind === 'personal' && value.paymentMethodType === 'PAYPAL'))
    && (kind !== 'personal' || currency !== 'USD' || (countryRequired && value.country !== 'US'))) return null;
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
    || !((currency === 'USD' || (kind === 'personal' && ['MXN', 'COP'].includes(currency)))
      ? validFundingSourceAmount(value.amount, kind, currency) : validFiatAmount(value.amount))
    || typeof value.paymentMethodType !== 'string' || !METHOD.test(value.paymentMethodType)) return null;
  if (kind === 'administrative' && !PROVIDERS.has(value.serviceProvider)) return null;
  if (kind === 'personal' && (!personalFundingCountry(value.country) || !personalFundingMethod(value.paymentMethodType))) return null;
  return Object.fromEntries(keys.filter(key => value[key] !== undefined).map(key => [key, value[key]]));
}

export function sandboxCheckoutUrl(value, serviceProvider = '') {
  // eslint-disable-next-line no-control-regex -- Reject literal URL controls before the URL parser can normalize them.
  if (typeof value !== 'string' || value.length > 8192 || /[\u0000-\u0020\u007f\\#]/.test(value)
    || (serviceProvider !== '' && !PROVIDERS.has(serviceProvider))) return null;
  try {
    const url = new URL(value);
    if (url.username || url.password || url.hash || !url.search) return null;
    if (url.origin === 'https://sb.meldcrypto.com' && /^https:\/\/sb\.meldcrypto\.com(?:\/|\?)/.test(value)) return value;
    // The provider URL is minted by the backend. Never rebuild payment fields
    // or accept a production/partner host from a browser-supplied URL.
    if (serviceProvider !== 'TRANSAK' || url.origin !== 'https://global-stg.transak.com' || url.pathname !== '/'
      || !/^https:\/\/global-stg\.transak\.com\/?\?/.test(value)) return null;
    const keys = [...url.searchParams.keys()];
    if (keys.length !== 2 || new Set(keys).size !== 2 || !keys.includes('apiKey') || !keys.includes('sessionId')
      || !url.search.slice(1).split('&').every(part => /^(?:apiKey|sessionId)=/.test(part))
      || !/^[A-Za-z0-9_-]{1,256}$/.test(url.searchParams.get('apiKey') || '')
      || !/^[A-Za-z0-9._~-]{1,4096}$/.test(url.searchParams.get('sessionId') || '')) return null;
    return value;
  } catch { return null; }
}

export function fundingAcknowledgement(value, kind, requestCountry = '', requestProvider = '') {
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
    if ((requestProvider !== '' && !PROVIDERS.has(requestProvider))
      || (value.serviceProvider !== undefined && (!PROVIDERS.has(value.serviceProvider)
        || (requestProvider !== '' && value.serviceProvider !== requestProvider)))) return null;
    // Legacy administrative acknowledgements expose only a Meld sandbox URL.
    // A direct launch also requires the requested and acknowledged provider.
    const boundProvider = requestProvider && value.serviceProvider === requestProvider ? requestProvider : '';
    const checkoutUrl = sandboxCheckoutUrl(value.checkoutUrl, boundProvider);
    if (!checkoutUrl) return null;
    return { ...safe, ...(value.serviceProvider !== undefined ? { serviceProvider: value.serviceProvider } : {}), checkoutUrl };
  }
  if (!personalFundingMethod(value.paymentMethodType) || !Array.isArray(value.allowedProviders)
    || value.allowedProviders.length < 1 || value.allowedProviders.length > 3
    || value.allowedProviders.some(provider => !PERSONAL_PROVIDERS.has(provider))
    || new Set(value.allowedProviders).size !== value.allowedProviders.length) return null;
  const currency = fundingCurrencyCode(value.sourceCurrencyCode);
  const contextualProviders = requestCountry ? personalFundingProviders(requestCountry, currency, value.paymentMethodType)
    : currency === 'COP' ? [] : ['VENMO', 'PAYPAL'].includes(value.paymentMethodType) ? [] : ['SWAPPED', 'MERCURYO'];
  if (value.allowedProviders.some(provider => !contextualProviders.includes(provider))) return null;
  if (value.allowedProviders.some(provider => currency === 'COP' ? provider !== 'ONRAMPMONEY' : provider === 'ONRAMPMONEY')
    || (currency === 'USD' && ['SPEI', 'PSE', 'LOCAL_BANK_TRANSFER'].includes(value.paymentMethodType))) return null;
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

const SANDBOX_PENDING_STATUSES = new Set(['PENDING_CREATED', 'PENDING', 'PROCESSING', 'AUTHORIZED', 'ACCEPTED', 'PARTIALLY_SETTLED',
  'SETTLING', 'TWO_FA_REQUIRED', 'TWO_FA_PROVIDED', 'ERROR']);
const SANDBOX_FAILED_STATUSES = new Set(['FAILED', 'DECLINED', 'CANCELLED', 'REFUNDED', 'VOIDED', 'AUTHORIZATION_EXPIRED']);
const SANDBOX_IDENTIFIER = /^[A-Za-z0-9_.:-]{1,128}$/;
const SANDBOX_RECEIVED_AMOUNT = /^(?:0|[1-9]\d{0,11})(?:\.\d{1,6})?$/;
function fundingInstant(value) {
  if (typeof value !== 'string' || value.length > 64 || !/^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
    || !Number.isFinite(Date.parse(value))) return false;
  const day = Number(value.slice(8, 10)), year = Number(value.slice(0, 4)), month = Number(value.slice(5, 7));
  return day <= new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** A server-owned sandbox API result is distinct from real financial settlement. */
export function fundingConfirmation(value, kind) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.testMode !== (kind === 'administrative')
    || !['personal', 'administrative'].includes(kind)) return null;
  if (value.state === 'unconfirmed' && value.source === 'none') return { state: 'unconfirmed', source: 'none', testMode: kind === 'administrative' };
  if (kind !== 'administrative' || value.source !== 'meld_sandbox_api' || typeof value.transactionId !== 'string'
    || !SANDBOX_IDENTIFIER.test(value.transactionId)) return null;
  const expectedState = value.providerStatus === 'SETTLED' ? 'confirmed' : SANDBOX_PENDING_STATUSES.has(value.providerStatus) ? 'pending'
    : SANDBOX_FAILED_STATUSES.has(value.providerStatus) ? 'failed' : null;
  if (!expectedState || value.state !== expectedState) return null;
  const safe = { state: expectedState, source: 'meld_sandbox_api', testMode: true, transactionId: value.transactionId, providerStatus: value.providerStatus };
  if (expectedState === 'confirmed') {
    if (typeof value.receivedAmount !== 'string' || !SANDBOX_RECEIVED_AMOUNT.test(value.receivedAmount)
      || /^0(?:\.0+)?$/.test(value.receivedAmount) || !fundingInstant(value.confirmedAt)) return null;
    return { ...safe, receivedAmount: value.receivedAmount, confirmedAt: value.confirmedAt };
  }
  if (value.receivedAmount !== undefined || value.confirmedAt !== undefined) return null;
  return safe;
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
    const confirmation = kind === 'administrative' && record?.confirmation !== undefined ? fundingConfirmation(record.confirmation, kind) : undefined;
    if (!record || !FUNDING_UUID.test(record.checkoutReference || '') || !source
      || !COUNTRY.test(record.country || '') || !STATUSES.has(record.status) || record.provider !== provider
      || (kind === 'personal' && record.status !== 'initiated')
      || (source?.sourceCurrencyCode === 'COP' && (!destination || destination.network !== 'polygon' || destination.chainId !== 137))
      || (source?.sourceCurrencyCode === 'MXN' && source.paymentMethodType !== 'SPEI' && (!destination || destination.network !== 'polygon' || destination.chainId !== 137))
      || (kind === 'personal' && ['VENMO', 'PAYPAL'].includes(source?.paymentMethodType) && (!destination || destination.network !== 'polygon' || destination.chainId !== 137))
      || destination === null || confirmation === null || (confirmation?.source === 'meld_sandbox_api' && !destination)
      || typeof record.createdAt !== 'string' || record.createdAt.length > 64 || !Number.isFinite(Date.parse(record.createdAt))) return null;
    return { checkoutReference: record.checkoutReference, requestedAmount: record.requestedAmount, country: record.country,
      status: record.status, createdAt: record.createdAt, provider, ...source, ...(destination ? { destination } : {}), ...(confirmation ? { confirmation } : {}) };
  });
  if (records.some(record => !record) || new Set(records.map(record => record.checkoutReference)).size !== records.length) return null;
  return { walletKind: kind, environment, settlement: 'unconfirmed', records };
}

/** Reads an owned persisted request, never a checkout callback's claimed result.
 * Personal settlement remains unconfirmed. Administrative test results require
 * correlated Meld sandbox API evidence and never credit real funds or fees.
 */
export function fundingStatus(value, kind) {
  if (!['personal', 'administrative'].includes(kind)) return null;
  const environment = kind === 'personal' ? 'production' : 'sandbox';
  const provider = kind === 'personal' ? 'reown' : 'meld';
  const destination = fundingDestination(value?.destination, kind);
  const confirmation = fundingConfirmation(value?.confirmation, kind);
  const source = requestedSource(value, kind, true);
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.walletKind !== kind
    || value.environment !== environment || value.provider !== provider
    || typeof value.checkoutReference !== 'string' || value.checkoutReference.length !== 36
    || !FUNDING_UUID.test(value.checkoutReference) || !source
    || typeof value.country !== 'string' || value.country.length !== 2 || !COUNTRY.test(value.country) || !STATUSES.has(value.requestStatus)
    || (kind === 'personal' && value.requestStatus !== 'initiated')
    || !destination
    || (source?.sourceCurrencyCode === 'COP' && (destination.network !== 'polygon' || destination.chainId !== 137))
    || (source?.sourceCurrencyCode === 'MXN' && source.paymentMethodType !== 'SPEI' && (destination.network !== 'polygon' || destination.chainId !== 137))
    || (kind === 'personal' && ['VENMO', 'PAYPAL'].includes(source?.paymentMethodType) && (destination.network !== 'polygon' || destination.chainId !== 137))
    || !confirmation) return null;
  return { checkoutReference: value.checkoutReference.toLowerCase(), walletKind: kind, environment, provider,
    requestedAmount: value.requestedAmount, country: value.country, requestStatus: value.requestStatus, ...source,
    destination,
    confirmation };
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
    || (!administrative && personalFundingProviders(value.country, sourceCurrencyCode).length === 0)
    || !Array.isArray(value.paymentMethods) || value.paymentMethods.length > 40
    || value.paymentMethods.some(method => typeof method !== 'string' || !METHOD.test(method))
    || new Set(value.paymentMethods).size !== value.paymentMethods.length
    || !Array.isArray(value.routes) || value.routes.length > (administrative ? 2 : personalFundingProviders(value.country, sourceCurrencyCode).length)) return null;
  const routes = value.routes.map(route => {
    if (!route || !providers.has(route.serviceProvider)
      || (!administrative && !personalFundingProviders(value.country, sourceCurrencyCode).includes(route.serviceProvider)) || !Array.isArray(route.paymentMethods)
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
      && (administrative || personalFundingProviders(value.country, sourceCurrencyCode, method.method).includes(route.serviceProvider))
      && fundingSourceSupported({ sourceCurrencyCode, country: value.country, paymentMethodType: method.method }, 'personal'))
      .map(method => {
        const minimumAmount = Math.max(sourceCurrencyCode === 'MXN' ? PERSONAL_FUNDING_MINIMUM_MXN : sourceCurrencyCode === 'COP' ? PERSONAL_FUNDING_MINIMUM_COP : PERSONAL_FUNDING_MINIMUM_USD, method.minimumAmount);
        const maximumAmount = Math.min(sourceCurrencyCode === 'USD' ? PERSONAL_FUNDING_MAXIMUM_USD : sourceCurrencyCode === 'COP' ? PERSONAL_FUNDING_MAXIMUM_COP : 1_000_000_000, method.maximumAmount);
        return { ...method, minimumAmount, maximumAmount,
          ...(sourceCurrencyCode === 'USD' ? { minimumUsd: minimumAmount, maximumUsd: maximumAmount } : {}) };
      })
      .filter(method => method.maximumAmount >= method.minimumAmount),
  })).filter(route => route.paymentMethods.length > 0);
  const safeMethods = new Set(safeRoutes.flatMap(route => route.paymentMethods.map(method => method.method)));
  return { walletKind: kind, environment, provider, country: value.country, sourceCurrencyCode,
    paymentMethods: administrative ? [...value.paymentMethods] : value.paymentMethods.filter(method => safeMethods.has(method)), routes: safeRoutes };
}
