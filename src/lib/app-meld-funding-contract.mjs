import { FUNDING_UUID, fundingCurrencyCode, fundingHistory, fundingInput, fundingStatus } from './wallet-funding-contract.mjs';
import { APP_MELD_COUNTRIES, appMeldCurrencyChoices, appMeldDefaultCurrency, appMeldDestinationCode, appMeldDestinationFor,
  appMeldMarketRows, appMeldRail, appMeldRailBounds } from './app-meld-wallet-catalogue.mjs';

export { APP_MELD_COUNTRIES, appMeldCurrencyChoices, appMeldDefaultCurrency, appMeldDestinationFor };
export const APP_MELD_MINIMUM_USD = 50;
export const APP_MELD_MAXIMUM_USD = 25_000;
const address = /^0x[0-9a-f]{40}$/i;
const states = new Set(['initiated', 'session_created', 'unavailable', 'failed']);
const plain = value => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const instant = value => typeof value === 'string' && value.length <= 64 && Number.isFinite(Date.parse(value));
const numericAmount = value => typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= 1_000_000_000;
const validPrecision = (value, scale) => numericAmount(value)
  && Math.abs(value * scale - Math.round(value * scale)) <= Number.EPSILON * Math.max(1, value * scale) * 2;

export const appMeldFundingContext = (country, fiat) => appMeldMarketRows(country, fiat).length > 0;

export function appMeldFundingAsset(country, fiat, provider = '', method = '') {
  const rows = appMeldMarketRows(country, fiat);
  if (provider || method) {
    const row = rows.find(row => (!provider || row.serviceProvider === provider) && (!method || row.paymentMethodType === method)
      && row.destinationCurrencyCode === 'USDC_POLYGON') ?? rows.find(row =>
        (!provider || row.serviceProvider === provider) && (!method || row.paymentMethodType === method));
    return row?.destinationCurrencyCode ?? 'USDT_POLYGON';
  }
  return rows[0]?.destinationCurrencyCode ?? 'USDT_POLYGON';
}

export function appMeldRouteSupported(country, fiat, method, provider, asset = '') {
  return Boolean(appMeldRail(country, fiat, method, provider, asset));
}

export function appMeldLimits(fiat, country = '') {
  const rows = appMeldMarketRows(country, fiat), bounds = rows.map(appMeldRailBounds);
  if (bounds.length) return [Math.min(...bounds.map(item => item[0])), Math.max(...bounds.map(item => item[1]))];
  return fiat === 'USD' ? [APP_MELD_MINIMUM_USD, APP_MELD_MAXIMUM_USD] : [0.01, 1_000_000_000];
}

export function appMeldMinorUnits(country, fiat) {
  return appMeldMarketRows(country, fiat)[0]?.minorUnits ?? 2;
}

export function appMeldSourceAmount(amount, fiat, country = '') {
  const [minimum, maximum] = appMeldLimits(fiat, country);
  return validPrecision(amount, 10 ** appMeldMinorUnits(country, fiat)) && amount >= minimum && amount <= maximum;
}

/** @param {Record<string, unknown>} input */
export function appMeldFundingInputError(input) {
  const { country, sourceCurrencyCode = 'USD', amount, paymentMethodType, serviceProvider, destinationCurrencyCode } = input;
  if (typeof amount !== 'number' || typeof country !== 'string' || typeof sourceCurrencyCode !== 'string'
    || !appMeldFundingContext(country, sourceCurrencyCode) || !appMeldSourceAmount(amount, sourceCurrencyCode, country)
    || (destinationCurrencyCode !== undefined && !appMeldDestinationFor(destinationCurrencyCode))) return 'invalid_request';
  const rows = appMeldMarketRows(country, sourceCurrencyCode).filter(row => row.paymentMethodType === paymentMethodType
    && (serviceProvider === undefined || row.serviceProvider === serviceProvider)
    && (destinationCurrencyCode === undefined || row.destinationCurrencyCode === destinationCurrencyCode));
  if (!rows.length) return 'wallet_funding_method_unavailable';
  return rows.some(row => {
    const [minimum, maximum] = appMeldRailBounds(row);
    return amount >= minimum && amount <= maximum;
  }) ? null : 'wallet_funding_amount_out_of_range';
}

/** @param {Record<string, unknown>} selection */
export function appMeldFundingSelection(selection) {
  const { country, countryCode = country, amount = APP_MELD_MINIMUM_USD, paymentMethodType, serviceProvider, destinationCurrencyCode } = selection;
  const rawCurrency = selection.sourceCurrencyCode;
  const sourceCurrencyCode = rawCurrency === undefined ? 'USD' : typeof rawCurrency === 'string' ? fundingCurrencyCode(rawCurrency) : null;
  if (!sourceCurrencyCode || (country !== undefined && country !== countryCode)) throw new Error('invalid_request');
  if (typeof countryCode !== 'string' || !APP_MELD_COUNTRIES.includes(countryCode)) throw new Error('wallet_funding_invalid_country');
  if (destinationCurrencyCode !== undefined && !appMeldDestinationFor(destinationCurrencyCode)) throw new Error('invalid_request');
  const requestedAsset = typeof destinationCurrencyCode === 'string' ? destinationCurrencyCode : appMeldFundingAsset(countryCode, sourceCurrencyCode,
    typeof serviceProvider === 'string' ? serviceProvider : '', typeof paymentMethodType === 'string' ? paymentMethodType : '');
  const error = appMeldFundingInputError({ country: countryCode, sourceCurrencyCode, amount, paymentMethodType, serviceProvider, destinationCurrencyCode: requestedAsset });
  if (error) throw new Error(error);
  return { countryCode, sourceCurrencyCode, amount, destinationCurrencyCode: requestedAsset };
}

/** @param {Record<string, unknown>} value @returns {ReturnType<typeof fundingInput>} */
export function appMeldFundingRequest(value) {
  if (!plain(value)) return null;
  const { serviceProvider, destinationCurrencyCode, ...fields } = value;
  const body = fundingInput(fields, 'personal', {
    personalCountry: country => APP_MELD_COUNTRIES.includes(country),
    personalAmount: (amount, fiat, country) => appMeldSourceAmount(amount, fiat, country),
  });
  return body ? { ...body, ...(serviceProvider !== undefined ? { serviceProvider } : {}),
    ...(destinationCurrencyCode !== undefined ? { destinationCurrencyCode } : {}) } : null;
}

const boundedLimit = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1_000_000_000;
export function appMeldFundingOptions(value) {
  if (!plain(value) || !appMeldFundingContext(value.country, value.sourceCurrencyCode)
    || (value.environment !== undefined && value.environment !== 'production')
    || (value.provider !== undefined && value.provider !== 'meld')
    || (value.walletKind !== undefined && value.walletKind !== 'personal')
    || !Array.isArray(value.routes) || !Array.isArray(value.paymentMethods)) return null;
  const { country, sourceCurrencyCode: fiat } = value;
  const known = appMeldMarketRows(country, fiat);
  const preferred = appMeldDestinationFor(appMeldFundingAsset(country, fiat));
  if (value.destinationCurrencyCode !== preferred.destinationCurrencyCode || (value.network !== undefined && value.network !== preferred.network)
    || (value.chainId !== undefined && value.chainId !== preferred.chainId) || value.routes.length > known.length || value.paymentMethods.length > known.length) return null;
  const seen = new Set(), methods = new Set(), routes = [];
  for (const route of value.routes) {
    if (!plain(route) || typeof route.serviceProvider !== 'string' || !route.serviceProvider
      || !Array.isArray(route.paymentMethods) || !route.paymentMethods.length || route.paymentMethods.length > known.length) return null;
    const target = route.destinationCurrencyCode === undefined ? preferred : appMeldDestinationFor(route.destinationCurrencyCode);
    if (!target || (route.network !== undefined && route.network !== target.network) || (route.chainId !== undefined && route.chainId !== target.chainId)) return null;
    const key = route.serviceProvider + ':' + target.destinationCurrencyCode;
    if (seen.has(key)) return null;
    seen.add(key);
    const eligibles = [], routeMethods = new Set();
    for (const item of route.paymentMethods) {
      if (!plain(item) || item.currencyCode !== fiat || routeMethods.has(item.method)
        || !boundedLimit(item.minimumAmount) || !boundedLimit(item.maximumAmount) || item.maximumAmount < item.minimumAmount) return null;
      const row = appMeldRail(country, fiat, item.method, route.serviceProvider, target.destinationCurrencyCode);
      const retired = legacyRampNowRoute(country, fiat, item.method, route.serviceProvider, target.destinationCurrencyCode);
      if (!row && !retired) return null;
      routeMethods.add(item.method); methods.add(item.method);
      // Validate the old route shape during rollout without offering the retired checkout.
      if (!row) continue;
      const [floor, ceiling] = appMeldRailBounds(row), scale = 10 ** row.minorUnits;
      const minimumAmount = Math.max(floor, Math.ceil(item.minimumAmount * scale - 0.00001) / scale);
      const maximumAmount = Math.min(ceiling, Math.floor(item.maximumAmount * scale + 0.00001) / scale);
      if (minimumAmount <= maximumAmount) eligibles.push({ method: item.method, currencyCode: fiat, minimumAmount, maximumAmount });
    }
    if (eligibles.length) routes.push({ serviceProvider: route.serviceProvider, destinationCurrencyCode: target.destinationCurrencyCode,
      network: target.network, chainId: target.chainId, paymentMethods: eligibles });
  }
  if (new Set(value.paymentMethods).size !== methods.size || value.paymentMethods.length !== methods.size
    || value.paymentMethods.some(method => !methods.has(method))) return null;
  return { walletKind: 'personal', provider: 'meld', environment: 'production', country, sourceCurrencyCode: fiat, network: preferred.network,
    chainId: preferred.chainId, destinationCurrencyCode: preferred.destinationCurrencyCode,
    paymentMethods: [...new Set(routes.flatMap(route => route.paymentMethods.map(item => item.method)))], routes };
}

function legacyRampNowRoute(country, fiat, method, provider, asset) {
  return country === 'US' && fiat === 'USD' && provider === 'RAMPNOW'
    && ['CREDIT_DEBIT_CARD', 'APPLE_PAY', 'GOOGLE_PAY', 'ACH', 'LOCAL_BANK_TRANSFER'].includes(method)
    && ['USDC_POLYGON', 'USDC_ARBITRUM', 'USDC'].includes(asset);
}

function legacyRoute(country, fiat, method, provider, asset) {
  if (legacyRampNowRoute(country, fiat, method, provider, asset)) return true;
  if (country === 'MX' && asset === 'USDT_POLYGON') return (['USD', 'MXN'].includes(fiat) && provider === 'MERCURYO' && method === 'CREDIT_DEBIT_CARD')
    || (fiat === 'MXN' && provider === 'ONRAMPMONEY' && method === 'SPEI');
  return false;
}

function fundingSnapshot(value) {
  if (!plain(value) || value.provider !== 'meld' || typeof value.serviceProvider !== 'string' || !value.serviceProvider
    || !FUNDING_UUID.test(value.checkoutReference || '') || !numericAmount(value.requestedAmount)) return null;
  const code = appMeldDestinationCode(value.destination);
  const destination = appMeldDestinationFor(code);
  if (!destination || (value.destinationCurrencyCode !== undefined && value.destinationCurrencyCode !== code)
    || (!appMeldRail(value.country, value.sourceCurrencyCode, value.paymentMethodType, value.serviceProvider, code)
      && !legacyRoute(value.country, value.sourceCurrencyCode, value.paymentMethodType, value.serviceProvider, code))
    || !address.test(value.destination.address || '') || /^0x0{40}$/i.test(value.destination.address)) return null;
  const { asset, network, chainId } = destination;
  return { checkoutReference: value.checkoutReference.toLowerCase(), provider: 'meld', serviceProvider: value.serviceProvider,
    country: value.country, sourceCurrencyCode: value.sourceCurrencyCode, requestedAmount: value.requestedAmount,
    paymentMethodType: value.paymentMethodType, destination: { address: value.destination.address.toLowerCase(), asset, network, chainId } };
}

function approvedCheckoutUrl(value, provider) {
  if (typeof value !== 'string' || value.length > 8192 || /[\s\\\u0000-\u001f\u007f]/.test(value)) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.port || url.username || url.password || url.hash || url.searchParams.size !== 1) return null;
    const opaque = value => typeof value === 'string' && /^[A-Za-z0-9_.~+/-]{1,7800}={0,2}$/.test(value);
    if (url.hostname === 'meldcrypto.com' && url.pathname === '/'
      && opaque(url.searchParams.get('token') ?? url.searchParams.get('wt'))) return url.href;
    if (provider === 'BANXA' && url.hostname === 'meldshared.banxa.com' && url.pathname === '/papi/transit/'
      && opaque(url.searchParams.get('initId'))) return url.href;
  } catch { /* An unrecognized destination cannot be opened. */ }
  return null;
}

export function appMeldFundingSession(value, input) {
  const safe = fundingSnapshot(value);
  if (!safe || !plain(input) || !FUNDING_UUID.test(input.requestId || '') || !address.test(input.walletAddress || '')) return null;
  const fiat = input.sourceCurrencyCode ?? 'USD';
  const asset = input.destinationCurrencyCode ?? appMeldFundingAsset(input.country, fiat, input.serviceProvider, input.paymentMethodType);
  const checkoutUrl = approvedCheckoutUrl(value.checkoutUrl, safe.serviceProvider);
  if (value.walletKind !== 'personal' || value.environment !== 'production' || value.status !== 'session_created' || value.destinationCurrencyCode !== asset
    || !appMeldRail(input.country, fiat, input.paymentMethodType, safe.serviceProvider, asset) || !checkoutUrl
    || (input.serviceProvider !== undefined && safe.serviceProvider !== input.serviceProvider) || !instant(value.createdAt)
    || safe.checkoutReference !== input.requestId.toLowerCase() || safe.country !== input.country || safe.requestedAmount !== input.amount
    || safe.sourceCurrencyCode !== fiat || safe.paymentMethodType !== input.paymentMethodType || safe.destination.address !== input.walletAddress.toLowerCase()) return null;
  return { ...safe, walletKind: 'personal', environment: 'production', status: 'session_created', destinationCurrencyCode: asset, checkoutUrl, createdAt: value.createdAt };
}

function confirmation(value) {
  if (!plain(value) || value.testMode !== false) return null;
  if (value.state === 'unconfirmed') return value.source === 'none' ? { state: 'unconfirmed', source: 'none', testMode: false } : null;
  if (value.source !== 'meld_production_api' || !['pending', 'confirmed', 'failed'].includes(value.state)) return null;
  const safe = { state: value.state, source: value.source, testMode: false };
  if (value.state !== 'confirmed') return safe;
  if (value.providerStatus !== 'SETTLED' || !instant(value.confirmedAt)
    || typeof value.transactionId !== 'string' || !/^[A-Za-z0-9_.:-]{1,128}$/.test(value.transactionId)
    || value.transactionId === '.' || value.transactionId === '..'
    || typeof value.receivedAmount !== 'string' || !/^\d{1,12}(?:\.\d{1,6})?$/.test(value.receivedAmount) || Number(value.receivedAmount) <= 0) return null;
  return { ...safe, transactionId: value.transactionId, providerStatus: 'SETTLED', receivedAmount: value.receivedAmount, confirmedAt: value.confirmedAt };
}

export function appPersonalFundingStatus(value) {
  if (value?.provider !== 'meld') return fundingStatus(value, 'personal');
  const safe = fundingSnapshot(value), proof = confirmation(value.confirmation);
  return safe && proof && value.walletKind === 'personal' && value.environment === 'production' && states.has(value.requestStatus)
    && (value.requestStatus === 'session_created' || proof.state === 'unconfirmed')
    ? { ...safe, walletKind: 'personal', environment: 'production', requestStatus: value.requestStatus, confirmation: proof } : null;
}

export function appPersonalFundingHistory(value) {
  if (!plain(value) || value.walletKind !== 'personal' || value.environment !== 'production' || value.settlement !== 'unconfirmed'
    || !Array.isArray(value.records) || value.records.length > 50) return null;
  const records = value.records.map(record => {
    if (record?.provider !== 'meld') return fundingHistory({ ...value, records: [record] }, 'personal')?.records[0];
    const safe = fundingSnapshot(record);
    return safe && states.has(record.status) && instant(record.createdAt)
      ? { ...safe, status: record.status, createdAt: record.createdAt } : null;
  });
  return records.every(Boolean) && new Set(records.map(record => record.checkoutReference.toLowerCase())).size === records.length
    ? { walletKind: 'personal', environment: 'production', settlement: 'unconfirmed', records } : null;
}
