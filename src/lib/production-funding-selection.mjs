import { walletProductionAsset, walletProductionExplicitDestinationAllowed, walletProductionInput, walletProductionSubject } from './wallet-production-funding-contract.mjs';
import { sandboxWalletAddress } from './sandbox-wallet-contract.mjs';

export const PRODUCTION_QUOTE_DEBOUNCE_MS = 500;
export const PRODUCTION_QUOTE_TTL_MS = 120000;

export const MEXICO_FUNDING_CURRENCIES = ['MXN', 'USD'];

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
export function mexicoFundingOption(options, currency, decimalPlaces) {
  if (options.destinationCurrencyCode !== 'USDC_POLYGON' || !MEXICO_FUNDING_CURRENCIES.includes(currency)) return null;
  const routes = options.routes.flatMap(route => {
    const paymentMethods = route.paymentMethods.filter(item => item.currencyCode === currency && (
      (route.serviceProvider === 'MERCURYO' && item.method === 'CREDIT_DEBIT_CARD')
      || (currency === 'MXN' && route.serviceProvider === 'ONRAMPMONEY' && item.method === 'SPEI')
    ) && productionFundingLimits([{ paymentMethods: [item] }], currency, item.method, decimalPlaces));
    return paymentMethods.length ? [{ ...route, paymentMethods }] : [];
  });
  return routes.length ? { destinationCurrencyCode: options.destinationCurrencyCode, routes } : null;
}
export function mexicoFundingMethod(routes, selected = '') {
  const methods = [...new Set(routes.flatMap(route => route.paymentMethods.map(item => item.method)))];
  if (methods.includes(selected)) return selected;
  if (methods.includes('SPEI')) return 'SPEI';
  return methods.length === 1 ? methods[0] : '';
}
export function productionFundingDestinationChoices(routes, country, currency, method, defaultDestination) {
  const choices = routes.flatMap(route => route.paymentMethods.filter(item => item.currencyCode === currency && item.method === method)
    .flatMap(item => item.destinationCurrencyCodes || []));
  if (!choices.length) return [];
  const selection = { country, sourceCurrencyCode: currency, paymentMethodType: method, destinationCurrencyCode: defaultDestination };
  const isDefaultAvailable = productionFundingRoutesForDestination(routes, selection).length > 0;
  return [...new Set(isDefaultAvailable ? [defaultDestination, ...choices] : choices)];
}
export function productionFundingRoutesForDestination(routes, input) {
  const { country, sourceCurrencyCode, paymentMethodType, destinationCurrencyCode } = input;
  const available = Array.isArray(routes) ? routes : [];
  if (!destinationCurrencyCode) return available;
  return available.filter(({ serviceProvider, paymentMethods }) =>
    walletProductionExplicitDestinationAllowed(country, sourceCurrencyCode, paymentMethodType, destinationCurrencyCode, serviceProvider)
    && paymentMethods.some(item => item.currencyCode === sourceCurrencyCode && item.method === paymentMethodType
      && (!item.destinationCurrencyCodes || item.destinationCurrencyCodes.includes(destinationCurrencyCode))));
}
export function productionFundingProviderSupported(routes, serviceProvider, input, decimalPlaces = 2) {
  if (!input || !walletProductionInput(input)) return false;
  return productionFundingRoutesForDestination(routes, input).some(route => route.serviceProvider === serviceProvider
    && productionFundingValue(String(input.amount), productionFundingLimits([route], input.sourceCurrencyCode, input.paymentMethodType, decimalPlaces), decimalPlaces) !== null);
}
export function productionFundingSelectionKey(ownerSubject, address, input, destinationCurrencyCode = 'USDT_POLYGON') {
  const safe = walletProductionInput(input);
  return walletProductionSubject(ownerSubject) && sandboxWalletAddress(address) && safe && walletProductionAsset(destinationCurrencyCode)
    && (!safe.destinationCurrencyCode || safe.destinationCurrencyCode === destinationCurrencyCode)
    ? JSON.stringify([ownerSubject, address.toLowerCase(), safe.country, safe.sourceCurrencyCode, safe.paymentMethodType, safe.amount, destinationCurrencyCode]) : '';
}
