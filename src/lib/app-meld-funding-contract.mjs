import { FUNDING_UUID, PERSONAL_FUNDING_DESTINATION, PERSONAL_FUNDING_MINIMUM_MXN, PERSONAL_FUNDING_MAXIMUM_USD,
  fundingHistory, fundingStatus, personalFundingCountry } from './wallet-funding-contract.mjs';

const asset = PERSONAL_FUNDING_DESTINATION.destinationCurrencyCode;
const address = /^0x[0-9a-f]{40}$/i;
const states = new Set(['initiated', 'session_created', 'unavailable', 'failed']);
const plain = value => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const instant = value => typeof value === 'string' && value.length <= 64 && Number.isFinite(Date.parse(value));
const fiatAmount = value => Number.isFinite(value) && value > 0 && value <= 1_000_000_000
  && Math.abs(value * 100 - Math.round(value * 100)) < 0.000001;
export const appMeldFundingContext = (country, fiat) => personalFundingCountry(country) && (fiat === 'USD' || (country === 'MX' && fiat === 'MXN'));

function supportsRoute(country, fiat, method, provider) {
  return country === 'MX' && ((provider === 'MERCURYO' && (fiat === 'USD' || fiat === 'MXN') && method === 'CREDIT_DEBIT_CARD')
    || (provider === 'ONRAMPMONEY' && fiat === 'MXN' && method === 'SPEI'));
}

export function appMeldFundingInputError({ country, sourceCurrencyCode = 'USD', amount, paymentMethodType }) {
  const minimum = sourceCurrencyCode === 'MXN' ? PERSONAL_FUNDING_MINIMUM_MXN : 50;
  const maximum = sourceCurrencyCode === 'MXN' ? 1_000_000_000 : PERSONAL_FUNDING_MAXIMUM_USD;
  if (!appMeldFundingContext(country, sourceCurrencyCode) || !fiatAmount(amount) || amount < minimum || amount > maximum) return 'invalid_request';
  return ['MERCURYO', 'ONRAMPMONEY'].some(provider => supportsRoute(country, sourceCurrencyCode, paymentMethodType, provider))
    ? null : 'wallet_funding_method_unavailable';
}

export function appMeldFundingOptions(value) {
  if (!plain(value) || !appMeldFundingContext(value.country, value.sourceCurrencyCode) || value.destinationCurrencyCode !== asset
    || (value.environment !== undefined && value.environment !== 'production')
    || (value.provider !== undefined && value.provider !== 'meld')
    || (value.walletKind !== undefined && value.walletKind !== 'personal')
    || !Array.isArray(value.routes) || value.routes.length > 2 || !Array.isArray(value.paymentMethods) || value.paymentMethods.length > 2) return null;
  const { country, sourceCurrencyCode: fiat } = value;
  const methods = new Set(), providers = new Set(), routes = [];
  for (const route of value.routes) {
    if (!plain(route) || providers.has(route.serviceProvider) || !Array.isArray(route.paymentMethods) || route.paymentMethods.length !== 1) return null;
    const [item] = route.paymentMethods;
    if (!plain(item) || !supportsRoute(country, fiat, item.method, route.serviceProvider) || item.currencyCode !== fiat || methods.has(item.method)
      || !Number.isFinite(item.minimumAmount) || item.minimumAmount < 0 || !fiatAmount(item.maximumAmount) || item.maximumAmount < item.minimumAmount) return null;
    providers.add(route.serviceProvider); methods.add(item.method);
    const minimumAmount = Math.max(fiat === 'MXN' ? PERSONAL_FUNDING_MINIMUM_MXN : 50, item.minimumAmount);
    const maximumAmount = Math.min(fiat === 'USD' ? PERSONAL_FUNDING_MAXIMUM_USD : 1_000_000_000, item.maximumAmount);
    if (minimumAmount <= maximumAmount) {
      routes.push({ serviceProvider: route.serviceProvider,
        paymentMethods: [{ method: item.method, currencyCode: fiat, minimumAmount, maximumAmount }] });
    }
  }
  if (new Set(value.paymentMethods).size !== methods.size || value.paymentMethods.length !== methods.size
    || value.paymentMethods.some(method => !methods.has(method))) return null;
  return { walletKind: 'personal', provider: 'meld', environment: 'production', country, sourceCurrencyCode: fiat, ...PERSONAL_FUNDING_DESTINATION,
    paymentMethods: routes.map(route => route.paymentMethods[0].method), routes };
}

function fundingSnapshot(value) {
  if (!plain(value) || value.provider !== 'meld' || !FUNDING_UUID.test(value.checkoutReference || '') || !fiatAmount(value.requestedAmount)
    || !supportsRoute(value.country, value.sourceCurrencyCode, value.paymentMethodType, value.serviceProvider)
    || (value.destinationCurrencyCode !== undefined && value.destinationCurrencyCode !== asset)) return null;
  const destination = value.destination;
  if (!plain(destination) || !address.test(destination.address || '') || destination.address === `0x${'0'.repeat(40)}`
    || destination.asset !== 'USDT' || destination.network !== 'polygon' || destination.chainId !== 137) return null;
  return { checkoutReference: value.checkoutReference.toLowerCase(), provider: 'meld', serviceProvider: value.serviceProvider,
    country: value.country, sourceCurrencyCode: value.sourceCurrencyCode, requestedAmount: value.requestedAmount,
    paymentMethodType: value.paymentMethodType, destination: { address: destination.address.toLowerCase(), asset: 'USDT', network: 'polygon', chainId: 137 } };
}

export function appMeldFundingSession(value, input) {
  const safe = fundingSnapshot(value);
  if (!safe || !plain(input) || !FUNDING_UUID.test(input.requestId || '') || !address.test(input.walletAddress || '')
    || value.walletKind !== 'personal' || value.environment !== 'production' || value.status !== 'session_created'
    || value.destinationCurrencyCode !== asset || !instant(value.createdAt)
    || typeof value.checkoutUrl !== 'string' || !/^https:\/\/meldcrypto\.com\/?\?token=[A-Za-z0-9_.~-]{1,7000}$/.test(value.checkoutUrl)
    || safe.checkoutReference !== input.requestId.toLowerCase() || safe.country !== input.country || safe.requestedAmount !== input.amount
    || safe.sourceCurrencyCode !== (input.sourceCurrencyCode ?? 'USD') || safe.paymentMethodType !== input.paymentMethodType
    || safe.destination.address !== input.walletAddress.toLowerCase()) return null;
  return { ...safe, walletKind: 'personal', environment: 'production', status: 'session_created',
    destinationCurrencyCode: asset, checkoutUrl: new URL(value.checkoutUrl).href, createdAt: value.createdAt };
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
