import { FUNDING_UUID, validFundingAmount } from './wallet-funding-contract.mjs';

/** Reown supplies its production checkout key; Mindbliss only records the requested funding. */
export function buildReownProductionOnrampUrl({ providerUrl, address, projectId, checkoutReference, countryCode, amount }) {
  const url = new URL(providerUrl || '');
  if (url.origin !== 'https://meldcrypto.com' || url.pathname !== '/' || url.username || url.password || url.hash
    || !url.searchParams.get('publicKey')) throw new Error('reown_provider_invalid');
  if (!/^0x[0-9a-f]{40}$/i.test(address || '') || !/^[a-f0-9]{32}$/i.test(projectId || '')
    || !FUNDING_UUID.test(checkoutReference || '') || !/^[A-Z]{2}$/.test(countryCode || '')
    || !validFundingAmount(amount)) throw new Error('reown_context_invalid');
  if (url.searchParams.get('externalCustomerId') !== projectId) throw new Error('reown_provider_invalid');
  url.searchParams.set('walletAddress', address);
  url.searchParams.set('externalSessionId', checkoutReference);
  url.searchParams.set('sourceCurrencyCode', 'USD');
  url.searchParams.set('destinationCurrencyCode', 'USDT_POLYGON');
  url.searchParams.set('sourceAmount', String(amount));
  url.searchParams.set('countryCode', countryCode);
  url.searchParams.set('serviceProviders', 'TOPPER,SWAPPED');
  return url.toString();
}
