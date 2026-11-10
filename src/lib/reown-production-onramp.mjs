import { FUNDING_UUID, validFundingAmount } from './wallet-funding-contract.mjs';

/** Reown supplies its production checkout key; Mindbliss only records the requested funding. */
export function buildReownProductionOnrampUrl({ providerUrl, address, projectId, checkoutReference, countryCode, amount, paymentMethodType, allowedProviders }) {
  const url = new URL(providerUrl || '');
  if (url.origin !== 'https://meldcrypto.com' || url.pathname !== '/' || url.username || url.password || url.hash
    || !url.searchParams.get('publicKey')) throw new Error('reown_provider_invalid');
  if (!/^0x[0-9a-f]{40}$/i.test(address || '') || !/^[a-f0-9]{32}$/i.test(projectId || '')
    || !FUNDING_UUID.test(checkoutReference || '') || !/^[A-Z]{2}$/.test(countryCode || '')
    || !validFundingAmount(amount) || !/^[A-Z0-9_]{2,40}$/.test(paymentMethodType || '')
    || !Array.isArray(allowedProviders) || allowedProviders.length < 1 || allowedProviders.length > 2
    || allowedProviders.some(provider => !['TOPPER', 'SWAPPED'].includes(provider))
    || new Set(allowedProviders).size !== allowedProviders.length) throw new Error('reown_context_invalid');
  if (url.searchParams.get('externalCustomerId') !== projectId) throw new Error('reown_provider_invalid');
  url.searchParams.set('walletAddress', address);
  url.searchParams.set('externalSessionId', checkoutReference);
  url.searchParams.set('sourceCurrencyCode', 'USD');
  url.searchParams.set('destinationCurrencyCode', 'USDT_POLYGON');
  url.searchParams.set('sourceAmount', String(amount));
  url.searchParams.set('countryCode', countryCode);
  url.searchParams.set('paymentMethodType', paymentMethodType);
  // Checkout's documented locks use the actual values, not boolean flags.
  for (const [key, value] of Object.entries({ walletAddress: address, countryCode,
    sourceCurrencyCode: 'USD', destinationCurrencyCode: 'USDT_POLYGON', sourceAmount: String(amount), paymentMethodType })) {
    url.searchParams.set(`${key}Locked`, value);
  }
  // Compatibility hint. Enforcement of available routes/methods lives in the
  // authenticated backend; the vendor controls its final checkout provider UI.
  url.searchParams.set('serviceProviders', allowedProviders.join(','));
  return url.toString();
}
