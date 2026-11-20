import { walletProductionAsset, walletProductionInput, walletProductionSubject } from './wallet-production-funding-contract.mjs';
import { sandboxWalletAddress } from './sandbox-wallet-contract.mjs';

export const PRODUCTION_QUOTE_DEBOUNCE_MS = 500;
export const PRODUCTION_QUOTE_TTL_MS = 120000;

export const MEXICO_FUNDING_METHODS = [
  { currency: 'EUR', method: 'CREDIT_DEBIT_CARD', serviceProvider: 'ALCHEMYPAY', destinationCurrencyCode: 'USDC_ARBITRUM' },
  { currency: 'MXN', method: 'SPEI', serviceProvider: 'ONRAMPMONEY', destinationCurrencyCode: 'USDC_POLYGON' },
];

/** Discovery returns quote-verified fiat. Keep every offer and prefer the local default. */
export function productionFundingCurrencies(discovery) {
  const offered = Array.isArray(discovery?.currencies) ? discovery.currencies : [];
  const local = offered.find(item => item.code === discovery.defaultCurrencyCode);
  const usd = offered.find(item => item.code === 'USD');
  const preferred = local ? [local, usd, ...offered] : offered;
  const currencies = preferred.filter((item, index) => item && preferred.findIndex(other => other?.code === item.code) === index);
  return { currencies, defaultCurrencyCode: local?.code || '' };
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
export function mexicoFundingOption(choice, options, decimalPlaces) {
  if (options.destinationCurrencyCode !== choice.destinationCurrencyCode) return null;
  const route = options.routes.find(item => item.serviceProvider === choice.serviceProvider);
  if (!route) return null;
  const routes = [{ ...route, paymentMethods: route.paymentMethods.filter(item => item.method === choice.method && item.currencyCode === choice.currency) }];
  return productionFundingLimits(routes, choice.currency, choice.method, decimalPlaces) ? { ...choice, routes } : null;
}
export function productionFundingDestinationChoices(routes, currency, method) {
  return routes.find(route => route.serviceProvider === 'RAMPNOW')?.paymentMethods
    .find(item => item.currencyCode === currency && item.method === method)?.destinationCurrencyCodes ?? [];
}
export function productionFundingProviderSupported(routes, serviceProvider, input, decimalPlaces = 2) {
  if (!input || !walletProductionInput(input)) return false;
  return (Array.isArray(routes) ? routes : []).some(route => route.serviceProvider === serviceProvider
    && (!input.destinationCurrencyCode || (serviceProvider === 'RAMPNOW'
      && productionFundingDestinationChoices([route], input.sourceCurrencyCode, input.paymentMethodType).includes(input.destinationCurrencyCode)))
    && productionFundingValue(String(input.amount), productionFundingLimits([route], input.sourceCurrencyCode, input.paymentMethodType, decimalPlaces), decimalPlaces) !== null);
}
export function productionFundingSelectionKey(ownerSubject, address, input, destinationCurrencyCode = 'USDT_POLYGON') {
  const safe = walletProductionInput(input);
  return walletProductionSubject(ownerSubject) && sandboxWalletAddress(address) && safe && walletProductionAsset(destinationCurrencyCode)
    && (!safe.destinationCurrencyCode || safe.destinationCurrencyCode === destinationCurrencyCode)
    ? JSON.stringify([ownerSubject, address.toLowerCase(), safe.country, safe.sourceCurrencyCode, safe.paymentMethodType, safe.amount, destinationCurrencyCode]) : '';
}
