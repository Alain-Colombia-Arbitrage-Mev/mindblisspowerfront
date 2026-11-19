import { walletProductionInput, walletProductionSubject } from './wallet-production-funding-contract.mjs';
import { sandboxWalletAddress } from './sandbox-wallet-contract.mjs';

export const PRODUCTION_QUOTE_DEBOUNCE_MS = 500;
export const PRODUCTION_QUOTE_TTL_MS = 120000;

/** Expose the actual local default and USD; an unknown default requires an explicit choice. */
export function productionFundingCurrencies(discovery) {
  const offered = Array.isArray(discovery?.currencies) ? discovery.currencies : [];
  const local = offered.find(item => item.code === discovery.defaultCurrencyCode);
  const usd = offered.find(item => item.code === 'USD');
  if (!local) return { currencies: offered.filter((item, index, items) => items.findIndex(other => other?.code === item.code) === index), defaultCurrencyCode: '' };
  const currencies = [local, usd].filter((item, index, items) => item && items.findIndex(other => other?.code === item.code) === index);
  return { currencies, defaultCurrencyCode: currencies[0]?.code || '' };
}

/** Limits always retain their own fiat units. They never imply an FX rate. */
export function productionFundingLimits(routes, currency, method, decimalPlaces = 2) {
  const precision = 10 ** Math.max(0, Math.min(2, decimalPlaces));
  const ranges = (Array.isArray(routes) ? routes : []).flatMap(route => route.paymentMethods || [])
    .filter(item => item.method === method && item.currencyCode === currency && Number.isFinite(item.minimumAmount) && Number.isFinite(item.maximumAmount))
    .map(item => ({ minimum: Math.ceil((Math.max(item.minimumAmount, currency === 'USD' ? 50 : 0.01) - 1e-9) * precision) / precision,
      maximum: Math.floor((Math.min(item.maximumAmount, currency === 'USD' ? 25000 : 1e9) + 1e-9) * precision) / precision }))
    .filter(item => item.minimum > 0 && item.minimum <= item.maximum);
  return ranges.length ? { minimum: Math.min(...ranges.map(item => item.minimum)), maximum: Math.max(...ranges.map(item => item.maximum)), ranges } : null;
}
export function productionFundingValue(raw, limits, decimalPlaces = 2) {
  if (!limits || typeof raw !== 'string' || !raw.trim()) return null;
  const value = Number(raw), precision = 10 ** Math.max(0, Math.min(2, decimalPlaces));
  return Number.isFinite(value) && value > 0 && Math.abs(value * precision - Math.round(value * precision)) < 0.000001
    && limits.ranges.some(item => value >= item.minimum && value <= item.maximum) ? value : null;
}
export function productionFundingSelectionKey(ownerSubject, address, input) {
  const safe = walletProductionInput(input);
  return walletProductionSubject(ownerSubject) && sandboxWalletAddress(address) && safe
    ? JSON.stringify([ownerSubject, address.toLowerCase(), safe.country, safe.sourceCurrencyCode, safe.paymentMethodType, safe.amount]) : '';
}
