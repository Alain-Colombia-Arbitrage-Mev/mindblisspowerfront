import { FUNDING_UUID, fundingConfirmation } from './wallet-funding-contract.mjs';

export const ADMINISTRATIVE_MELD_CHECKOUT_PATH = '/api/member/wallet-funding/administrative/checkout';
export const ADMINISTRATIVE_MELD_CHECKOUT_ORIGIN = 'https://wallet.mindblisspower.com';
export const MELD_CHECKOUT_REFERENCE = FUNDING_UUID;
const countries = new Set(['US', 'MX', 'CO']);
const address = /^0x[0-9a-f]{40}$/i;
const method = /^[A-Z0-9_]{2,40}$/;
const plain = value => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const instant = value => typeof value === 'string' && value.length <= 64
  && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value));

export function validMeldCheckoutAmount(amount, country, currency) {
  return countries.has(country) && typeof amount === 'number' && Number.isFinite(amount)
    && Math.abs(amount * 100 - Math.round(amount * 100)) < 0.000001
    && (currency === 'USD' ? amount >= 50 && amount <= 25_000 : country === 'MX' && currency === 'MXN' && amount >= 1 && amount <= 10_000_000);
}

export function meldCheckoutInput(value) {
  const keys = ['requestId', 'country', 'sourceCurrencyCode', 'amount'];
  if (!plain(value) || Object.keys(value).length !== keys.length || Object.keys(value).some(key => !keys.includes(key))
    || typeof value.requestId !== 'string' || value.requestId.length !== 36 || !FUNDING_UUID.test(value.requestId)
    || !validMeldCheckoutAmount(value.amount, value.country, value.sourceCurrencyCode)) return null;
  return { requestId: value.requestId.toLowerCase(), country: value.country, sourceCurrencyCode: value.sourceCurrencyCode, amount: value.amount };
}

export function meldCheckoutDestination(value) {
  if (!plain(value) || typeof value.address !== 'string' || !address.test(value.address) || value.asset !== 'USDT'
    || value.network !== 'polygon' || value.chainId !== 137) return null;
  return { address: value.address, asset: 'USDT', network: 'polygon', chainId: 137 };
}

export function mintedMeldCheckoutUrl(value) {
  return typeof value === 'string' && /^https:\/\/sb\.meldcrypto\.com\/\?wt=[A-Za-z0-9_-]{1,4096}$/.test(value) ? value : null;
}

export function meldCheckoutCapabilities(value) {
  if (!plain(value) || value.flow !== 'meld_checkout' || typeof value.configured !== 'boolean' || value.environment !== 'sandbox'
    || value.asset !== 'USDT' || value.network !== 'polygon' || value.chainId !== 137) return null;
  return { flow: 'meld_checkout', configured: value.configured, environment: 'sandbox', asset: 'USDT', network: 'polygon', chainId: 137 };
}

export function meldCheckoutAcknowledgement(value) {
  const destination = meldCheckoutDestination(value?.destination), checkoutUrl = mintedMeldCheckoutUrl(value?.checkoutUrl);
  if (!plain(value) || value.flow !== 'meld_checkout' || value.status !== 'checkout_minted'
    || typeof value.checkoutReference !== 'string' || value.checkoutReference.length !== 36 || !FUNDING_UUID.test(value.checkoutReference)
    || !validMeldCheckoutAmount(value.requestedAmount, value.country, value.sourceCurrencyCode) || !instant(value.createdAt)
    || !destination || !checkoutUrl) return null;
  return { flow: 'meld_checkout', status: 'checkout_minted', checkoutReference: value.checkoutReference.toLowerCase(), country: value.country,
    requestedAmount: value.requestedAmount, sourceCurrencyCode: value.sourceCurrencyCode, destination, checkoutUrl, createdAt: value.createdAt };
}

function checkoutConfirmation(value) {
  const safe = fundingConfirmation(value, 'administrative');
  if (!safe) return null;
  if (safe.source === 'none') return safe;
  if (!['TRANSAK', 'BANXA'].includes(value.serviceProvider) || typeof value.paymentMethodType !== 'string' || !method.test(value.paymentMethodType)) return null;
  return { ...safe, serviceProvider: value.serviceProvider, paymentMethodType: value.paymentMethodType };
}

export function meldCheckoutStatus(value) {
  const destination = meldCheckoutDestination(value?.destination), confirmation = checkoutConfirmation(value?.confirmation);
  if (!plain(value) || value.walletKind !== 'administrative' || value.environment !== 'sandbox' || value.provider !== 'meld' || value.checkoutType !== 'meld_checkout'
    || typeof value.checkoutReference !== 'string' || value.checkoutReference.length !== 36 || !FUNDING_UUID.test(value.checkoutReference)
    || !['initiated', 'minted', 'unavailable'].includes(value.requestStatus) || !validMeldCheckoutAmount(value.requestedAmount, value.country, value.sourceCurrencyCode)
    || !destination || !confirmation || !instant(value.createdAt)) return null;
  return { checkoutReference: value.checkoutReference.toLowerCase(), walletKind: 'administrative', environment: 'sandbox', provider: 'meld', checkoutType: 'meld_checkout',
    requestStatus: value.requestStatus, requestedAmount: value.requestedAmount, sourceCurrencyCode: value.sourceCurrencyCode, country: value.country,
    destination, createdAt: value.createdAt, confirmation };
}

export function meldCheckoutHistory(value) {
  if (!plain(value) || value.walletKind !== 'administrative' || value.environment !== 'sandbox' || value.provider !== 'meld' || value.checkoutType !== 'meld_checkout'
    || value.settlement !== 'unconfirmed' || !Array.isArray(value.records) || value.records.length > 50) return null;
  const records = value.records.map(record => meldCheckoutStatus({ walletKind: value.walletKind, environment: value.environment, provider: value.provider, checkoutType: value.checkoutType, ...record }));
  if (records.some(record => !record) || new Set(records.map(record => record.checkoutReference)).size !== records.length) return null;
  return { walletKind: 'administrative', environment: 'sandbox', provider: 'meld', checkoutType: 'meld_checkout', settlement: 'unconfirmed', records };
}

export function meldCheckoutReturn(search) {
  if (typeof search !== 'string' || search.length > 2048) return null;
  const params = new URLSearchParams(search), values = params.getAll('meldCheckoutReference');
  if (params.has('checkoutReference') || values.length !== 1 || values[0].length !== 36 || !FUNDING_UUID.test(values[0])) return null;
  return values[0].toLowerCase();
}
