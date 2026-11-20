import coverage from './app-meld-wallet-catalogue.json' with { type: 'json' };

const details = Object.freeze({
  USDT_POLYGON: Object.freeze({ destinationCurrencyCode: 'USDT_POLYGON', asset: 'USDT', network: 'polygon', chainId: 137, name: 'Polygon' }),
  USDC_POLYGON: Object.freeze({ destinationCurrencyCode: 'USDC_POLYGON', asset: 'USDC', network: 'polygon', chainId: 137, name: 'Polygon' }),
  USDC_ARBITRUM: Object.freeze({ destinationCurrencyCode: 'USDC_ARBITRUM', asset: 'USDC', network: 'arbitrum', chainId: 42161, name: 'Arbitrum' }),
  USDC: Object.freeze({ destinationCurrencyCode: 'USDC', asset: 'USDC', network: 'ethereum', chainId: 1, name: 'Ethereum' }),
});
export const appMeldDestinationFor = code => typeof code === 'string' && Object.hasOwn(details, code) ? details[code] : null;
export function appMeldDestinationCode(value) {
  return Object.values(details).find(item => item.asset === value?.asset && item.network === value?.network
    && item.chainId === value?.chainId)?.destinationCurrencyCode ?? '';
}

const markets = new Map();
for (const row of coverage.rows) {
  if (!markets.has(row.country)) markets.set(row.country, new Map());
  const currencies = markets.get(row.country);
  if (!currencies.has(row.sourceCurrencyCode)) currencies.set(row.sourceCurrencyCode, []);
  currencies.get(row.sourceCurrencyCode).push(Object.freeze(row));
}
export const APP_MELD_COUNTRIES = Object.freeze([...markets.keys()]);
export const APP_MELD_PROVIDERS = Object.freeze([...new Set(coverage.rows.map(row => row.serviceProvider))]);

export function appMeldCurrencyChoices(country) {
  return [...(markets.get(country)?.keys() ?? [])];
}

export function appMeldDefaultCurrency(country) {
  if (country === 'MX') return 'MXN';
  if (country === 'SE') return 'SEK';
  return appMeldCurrencyChoices(country)[0] ?? 'USD';
}

export function appMeldMarketRows(country, fiat) {
  return markets.get(country)?.get(fiat) ?? [];
}

export function appMeldRail(country, fiat, method, provider, asset) {
  return appMeldMarketRows(country, fiat).find(row => row.paymentMethodType === method
    && (!provider || row.serviceProvider === provider) && (!asset || row.destinationCurrencyCode === asset));
}

export function appMeldRailBounds(row) {
  const scale = 10 ** row.minorUnits;
  const minimum = Math.max(row.minimumAmount, row.sourceCurrencyCode === 'USD' ? 50 : 1 / scale);
  const maximum = Math.min(row.maximumAmount, row.sourceCurrencyCode === 'USD' ? 25_000 : 1_000_000_000);
  const normalize = value => Math.abs(value - Math.round(value)) <= Number.EPSILON * Math.max(1, Math.abs(value)) * 2 ? Math.round(value) : value;
  return [Math.ceil(normalize(minimum * scale)) / scale, Math.floor(normalize(maximum * scale)) / scale];
}
