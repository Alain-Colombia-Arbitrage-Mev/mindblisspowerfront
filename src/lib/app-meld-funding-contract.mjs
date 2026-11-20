import { FUNDING_UUID, PERSONAL_FUNDING_DESTINATION, PERSONAL_FUNDING_MINIMUM_MXN, PERSONAL_FUNDING_MAXIMUM_USD,
  PERSONAL_FUNDING_MINIMUM_COP, PERSONAL_FUNDING_MAXIMUM_COP, fundingCurrencyCode, fundingHistory, fundingInput, fundingStatus } from './wallet-funding-contract.mjs';

const usdt = PERSONAL_FUNDING_DESTINATION.destinationCurrencyCode;
export const APP_MELD_MINIMUM_USD = 50;
const additionalBankMarkets = Object.freeze({
  PE: { currency: 'PEN', method: 'LOCAL_BANK_TRANSFER', min: 19, max: 4_500_000 },
  AR: { currency: 'ARS', method: 'LOCAL_BANK_TRANSFER', min: 25_000, max: 6_600_000 },
  DE: { currency: 'EUR', method: 'SEPA', min: 10, max: 100_000 },
  KE: { currency: 'KES', method: 'MPESA', min: 1_850, max: 700_000 },
  VN: { currency: 'VND', method: 'VIETQR', min: 55_000, max: 450_000_000 },
});
export const APP_MELD_LOCAL_CURRENCIES = Object.freeze({ MX: 'MXN', CO: 'COP', BR: 'BRL',
  ...Object.fromEntries(Object.entries(additionalBankMarkets).map(([country, market]) => [country, market.currency])) });
const additionalBounds = Object.fromEntries(Object.values(additionalBankMarkets).map(market => [market.currency, [market.min, market.max]]));
export const APP_MELD_COUNTRIES = Object.freeze(['US', ...Object.keys(APP_MELD_LOCAL_CURRENCIES)]);
const destinations = Object.freeze({
  USDT_POLYGON: Object.freeze({ ...PERSONAL_FUNDING_DESTINATION, asset: 'USDT' }),
  USDC_POLYGON: Object.freeze({ destinationCurrencyCode: 'USDC_POLYGON', asset: 'USDC', network: 'polygon', chainId: 137 }),
  USDC_ARBITRUM: Object.freeze({ destinationCurrencyCode: 'USDC_ARBITRUM', asset: 'USDC', network: 'arbitrum', chainId: 42161 }),
});
export const appMeldDestinationFor = code => typeof code === 'string' && Object.hasOwn(destinations, code) ? destinations[code] : null;
const address = /^0x[0-9a-f]{40}$/i;
const states = new Set(['initiated', 'session_created', 'unavailable', 'failed']);
const plain = value => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const instant = value => typeof value === 'string' && value.length <= 64 && Number.isFinite(Date.parse(value));
const fiatAmount = value => Number.isFinite(value) && value > 0 && value <= 1_000_000_000
  && Math.abs(value * 100 - Math.round(value * 100)) < 0.000001;
export const appMeldFundingContext = (country, fiat) => (country === 'US' && fiat === 'USD')
  || (country === 'MX' && fiat === 'USD') || (typeof country === 'string' && Object.hasOwn(APP_MELD_LOCAL_CURRENCIES, country) && APP_MELD_LOCAL_CURRENCIES[country] === fiat);

export function appMeldFundingAsset(country, fiat) {
  if (country === 'BR' && fiat === 'BRL') return 'USDC_ARBITRUM';
  return (country === 'US' && fiat === 'USD') || (country === 'CO' && fiat === 'COP') ? 'USDC_POLYGON' : usdt;
}

const bank = new Set(['ACH', 'LOCAL_BANK_TRANSFER']);
const rampNow = new Set(['CREDIT_DEBIT_CARD', 'APPLE_PAY', 'GOOGLE_PAY', ...bank]);
const activeProviders = ['MERCURYO', 'ONRAMPMONEY', 'RAMPNOW', 'ALCHEMYPAY'];

export function appMeldRouteSupported(country, fiat, method, provider) {
  if (country === 'MX' && (fiat === 'USD' || fiat === 'MXN')) return (provider === 'MERCURYO' && method === 'CREDIT_DEBIT_CARD')
    || (provider === 'ONRAMPMONEY' && fiat === 'MXN' && method === 'SPEI');
  if (country === 'US' && fiat === 'USD') return (provider === 'RAMPNOW' && rampNow.has(method)) || (provider === 'ONRAMPMONEY' && bank.has(method));
  if (country === 'BR' && fiat === 'BRL') return (provider === 'ALCHEMYPAY' && method === 'PIX')
    || (provider === 'MERCURYO' && method === 'CREDIT_DEBIT_CARD');
  if (country === 'CO' && fiat === 'COP') return provider === 'ONRAMPMONEY' && ['PSE', 'LOCAL_BANK_TRANSFER'].includes(method);
  const market = typeof country === 'string' && Object.hasOwn(additionalBankMarkets, country) ? additionalBankMarkets[country] : null;
  return Boolean(market && fiat === market.currency && provider === 'ONRAMPMONEY' && method === market.method);
}

export function appMeldLimits(fiat) {
  if (fiat === 'BRL') return [50, 1_000_000_000];
  if (typeof fiat === 'string' && Object.hasOwn(additionalBounds, fiat)) return additionalBounds[fiat];
  if (fiat === 'COP') return [PERSONAL_FUNDING_MINIMUM_COP, PERSONAL_FUNDING_MAXIMUM_COP];
  return fiat === 'MXN' ? [PERSONAL_FUNDING_MINIMUM_MXN, 1_000_000_000] : [APP_MELD_MINIMUM_USD, PERSONAL_FUNDING_MAXIMUM_USD];
}

export function appMeldSourceAmount(amount, fiat) {
  const [minimum, maximum] = appMeldLimits(fiat);
  return typeof amount === 'number' && fiatAmount(amount) && amount >= minimum && amount <= maximum
    && (!['COP', 'VND'].includes(fiat) || Number.isInteger(amount));
}

/** @param {Record<string, unknown>} input */
export function appMeldFundingInputError(input) {
  const { country, sourceCurrencyCode = 'USD', amount, paymentMethodType, serviceProvider, destinationCurrencyCode } = input;
  if (!appMeldFundingContext(country, sourceCurrencyCode) || !appMeldSourceAmount(amount, sourceCurrencyCode)
    || (destinationCurrencyCode !== undefined && destinationCurrencyCode !== appMeldFundingAsset(country, sourceCurrencyCode))) return 'invalid_request';
  return (serviceProvider !== undefined ? appMeldRouteSupported(country, sourceCurrencyCode, paymentMethodType, serviceProvider)
    : activeProviders.some(provider => appMeldRouteSupported(country, sourceCurrencyCode, paymentMethodType, provider)))
    ? null : 'wallet_funding_method_unavailable';
}

/** @param {Record<string, unknown>} selection */
export function appMeldFundingSelection(selection) {
  const { country, countryCode = country, amount = APP_MELD_MINIMUM_USD, paymentMethodType, serviceProvider, destinationCurrencyCode } = selection;
  const rawCurrency = selection.sourceCurrencyCode;
  const sourceCurrencyCode = rawCurrency === undefined ? 'USD' : typeof rawCurrency === 'string' ? fundingCurrencyCode(rawCurrency) : null;
  if (!sourceCurrencyCode || (country !== undefined && country !== countryCode)) throw new Error('invalid_request');
  if (typeof countryCode !== 'string' || !APP_MELD_COUNTRIES.includes(countryCode)) throw new Error('wallet_funding_invalid_country');
  const error = appMeldFundingInputError({ country: countryCode, sourceCurrencyCode, amount, paymentMethodType, serviceProvider, destinationCurrencyCode });
  if (error) throw new Error(error);
  return { countryCode, sourceCurrencyCode, amount, destinationCurrencyCode: appMeldFundingAsset(countryCode, sourceCurrencyCode) };
}

/** @param {Record<string, unknown>} value @returns {ReturnType<typeof fundingInput>} */
export function appMeldFundingRequest(value) {
  if (!plain(value)) return null;
  const { serviceProvider, destinationCurrencyCode, ...fields } = value;
  const body = fundingInput(fields, 'personal', { personalCountry: country => APP_MELD_COUNTRIES.includes(country) });
  return body ? { ...body, ...(serviceProvider !== undefined ? { serviceProvider } : {}),
    ...(destinationCurrencyCode !== undefined ? { destinationCurrencyCode } : {}) } : null;
}

export function appMeldFundingOptions(value) {
  if (!plain(value) || !appMeldFundingContext(value.country, value.sourceCurrencyCode)) return null;
  const destination = appMeldDestinationFor(appMeldFundingAsset(value.country, value.sourceCurrencyCode));
  if (!destination || value.destinationCurrencyCode !== destination.destinationCurrencyCode
    || (value.environment !== undefined && value.environment !== 'production')
    || (value.provider !== undefined && value.provider !== 'meld')
    || (value.walletKind !== undefined && value.walletKind !== 'personal')
    || (value.network !== undefined && value.network !== destination.network) || (value.chainId !== undefined && value.chainId !== destination.chainId)
    || (destination.network !== 'polygon' && (value.network !== destination.network || value.chainId !== destination.chainId))
    || !Array.isArray(value.routes) || value.routes.length > activeProviders.length || !Array.isArray(value.paymentMethods) || value.paymentMethods.length > rampNow.size) return null;
  const { country, sourceCurrencyCode: fiat } = value;
  const [floor, ceiling] = appMeldLimits(fiat);
  const methods = new Set(), providers = new Set(), routes = [];
  const wholeUnits = ['COP', 'VND'].includes(fiat);
  for (const route of value.routes) {
    if (!plain(route) || providers.has(route.serviceProvider) || !Array.isArray(route.paymentMethods)
      || !route.paymentMethods.length || route.paymentMethods.length > rampNow.size) return null;
    const routeMethods = new Set(), eligible = [];
    for (const item of route.paymentMethods) {
      if (!plain(item) || !appMeldRouteSupported(country, fiat, item.method, route.serviceProvider) || item.currencyCode !== fiat || routeMethods.has(item.method)
        || !Number.isFinite(item.minimumAmount) || item.minimumAmount < 0 || !fiatAmount(item.maximumAmount) || item.maximumAmount < item.minimumAmount) return null;
      routeMethods.add(item.method); methods.add(item.method);
      const minimumAmount = Math.max(floor, wholeUnits ? Math.ceil(item.minimumAmount) : item.minimumAmount);
      const maximumAmount = Math.min(ceiling, wholeUnits ? Math.floor(item.maximumAmount) : item.maximumAmount);
      if (minimumAmount <= maximumAmount) eligible.push({ method: item.method, currencyCode: fiat, minimumAmount, maximumAmount });
    }
    providers.add(route.serviceProvider);
    if (eligible.length) routes.push({ serviceProvider: route.serviceProvider, paymentMethods: eligible });
  }
  if (new Set(value.paymentMethods).size !== methods.size || value.paymentMethods.length !== methods.size
    || value.paymentMethods.some(method => !methods.has(method))) return null;
  return { walletKind: 'personal', provider: 'meld', environment: 'production', country, sourceCurrencyCode: fiat, network: destination.network, chainId: destination.chainId,
    destinationCurrencyCode: destination.destinationCurrencyCode, paymentMethods: [...new Set(routes.flatMap(route => route.paymentMethods.map(item => item.method)))], routes };
}

function fundingSnapshot(value) {
  if (!plain(value) || value.provider !== 'meld' || !FUNDING_UUID.test(value.checkoutReference || '') || !fiatAmount(value.requestedAmount)
    || !appMeldRouteSupported(value.country, value.sourceCurrencyCode, value.paymentMethodType, value.serviceProvider)) return null;
  const expectedCode = appMeldFundingAsset(value.country, value.sourceCurrencyCode);
  if (value.destinationCurrencyCode !== undefined && value.destinationCurrencyCode !== expectedCode) return null;
  const { asset, network, chainId } = appMeldDestinationFor(expectedCode), destination = value.destination;
  if (!plain(destination) || !address.test(destination.address || '') || destination.address === `0x${'0'.repeat(40)}`
    || destination.asset !== asset || destination.network !== network || destination.chainId !== chainId) return null;
  return { checkoutReference: value.checkoutReference.toLowerCase(), provider: 'meld', serviceProvider: value.serviceProvider,
    country: value.country, sourceCurrencyCode: value.sourceCurrencyCode, requestedAmount: value.requestedAmount,
    paymentMethodType: value.paymentMethodType, destination: { address: destination.address.toLowerCase(), asset, network, chainId } };
}

export function appMeldFundingSession(value, input) {
  const safe = fundingSnapshot(value);
  if (!safe || !plain(input) || !FUNDING_UUID.test(input.requestId || '') || !address.test(input.walletAddress || '')
    || value.walletKind !== 'personal' || value.environment !== 'production' || value.status !== 'session_created'
    || value.destinationCurrencyCode !== appMeldFundingAsset(input.country, input.sourceCurrencyCode ?? 'USD')
    || (input.destinationCurrencyCode !== undefined && value.destinationCurrencyCode !== input.destinationCurrencyCode)
    || (input.serviceProvider !== undefined && safe.serviceProvider !== input.serviceProvider) || !instant(value.createdAt)
    || typeof value.checkoutUrl !== 'string' || !/^https:\/\/meldcrypto\.com\/?\?token=[A-Za-z0-9_.~-]{1,7000}$/.test(value.checkoutUrl)
    || safe.checkoutReference !== input.requestId.toLowerCase() || safe.country !== input.country || safe.requestedAmount !== input.amount
    || safe.sourceCurrencyCode !== (input.sourceCurrencyCode ?? 'USD') || safe.paymentMethodType !== input.paymentMethodType
    || safe.destination.address !== input.walletAddress.toLowerCase()) return null;
  return { ...safe, walletKind: 'personal', environment: 'production', status: 'session_created',
    destinationCurrencyCode: value.destinationCurrencyCode, checkoutUrl: new URL(value.checkoutUrl).href, createdAt: value.createdAt };
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
