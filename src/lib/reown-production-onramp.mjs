import { FUNDING_UUID, PERSONAL_FUNDING_PROVIDERS, validFundingSourceAmount, fundingCurrencyCode, fundingSourceSupported, personalFundingCountry, personalFundingMethod } from './wallet-funding-contract.mjs';
import { PERSONAL_WALLET_MELD_ASSET } from './personal-wallet.mjs';

/** Validate before linking, selecting a provider or creating a personal intent. */
export function reownFundingCurrency(sourceCurrencyCode = 'USD', context = {}) {
  if (!fundingCurrencyCode(sourceCurrencyCode)) throw new Error('invalid_request');
  if (!fundingSourceSupported({ ...context, sourceCurrencyCode }, 'personal')) throw new Error('wallet_funding_valuation_unavailable');
  return sourceCurrencyCode;
}

export function reownFundingSelection(selection = {}, detectCountry = () => '') {
  const sourceCurrencyCode = fundingCurrencyCode(selection.sourceCurrencyCode);
  if (!sourceCurrencyCode) throw new Error('invalid_request');
  if (selection.country && selection.countryCode && selection.country !== selection.countryCode) throw new Error('invalid_request');
  const countryCode = selection.country || selection.countryCode || detectCountry();
  if (!personalFundingCountry(countryCode)) throw new Error('wallet_funding_invalid_country');
  if (!personalFundingMethod(selection.paymentMethodType)) throw new Error('wallet_funding_method_unavailable');
  reownFundingCurrency(sourceCurrencyCode, { countryCode, paymentMethodType: selection.paymentMethodType });
  return { sourceCurrencyCode, countryCode };
}

/** Reown supplies its production checkout key; Mindbliss only records the requested funding. */
export function buildReownProductionOnrampUrl({ providerUrl, address, projectId, checkoutReference, countryCode, sourceCurrencyCode = 'USD', amount, paymentMethodType, allowedProviders }) {
  reownFundingSelection({ sourceCurrencyCode, countryCode, paymentMethodType });
  const url = new URL(providerUrl || '');
  if (url.origin !== 'https://meldcrypto.com' || url.pathname !== '/' || url.username || url.password || url.hash
    || !url.searchParams.get('publicKey')) throw new Error('reown_provider_invalid');
  if (!/^0x[0-9a-f]{40}$/i.test(address || '') || !/^[a-f0-9]{32}$/i.test(projectId || '')
    || !FUNDING_UUID.test(checkoutReference || '') || !/^[A-Z]{2}$/.test(countryCode || '')
    || !validFundingSourceAmount(amount, 'personal', sourceCurrencyCode) || !/^[A-Z0-9_]{2,40}$/.test(paymentMethodType || '')
    || !Array.isArray(allowedProviders) || allowedProviders.length < 1 || allowedProviders.length > 2
    || allowedProviders.some(provider => !PERSONAL_FUNDING_PROVIDERS.includes(provider))
    || new Set(allowedProviders).size !== allowedProviders.length) throw new Error('reown_context_invalid');
  if (url.searchParams.get('externalCustomerId') !== projectId) throw new Error('reown_provider_invalid');
  url.searchParams.set('walletAddress', address);
  url.searchParams.set('externalSessionId', checkoutReference);
  url.searchParams.set('sourceCurrencyCode', sourceCurrencyCode);
  url.searchParams.set('destinationCurrencyCode', PERSONAL_WALLET_MELD_ASSET);
  url.searchParams.set('sourceAmount', String(amount));
  url.searchParams.set('countryCode', countryCode);
  url.searchParams.set('paymentMethodType', paymentMethodType);
  // Checkout's documented locks use the actual values, not boolean flags.
  for (const [key, value] of Object.entries({ walletAddress: address, countryCode,
    sourceCurrencyCode, destinationCurrencyCode: PERSONAL_WALLET_MELD_ASSET, sourceAmount: String(amount), paymentMethodType })) {
    url.searchParams.set(`${key}Locked`, value);
  }
  // Internal provider restrictions are merchant configuration. The public
  // widget ignores serviceProvider/serviceProviders URL parameters; do not
  // present an undocumented parameter as enforcement of an allowlist.
  url.searchParams.delete('serviceProvider');
  url.searchParams.delete('serviceProviders');
  return url.toString();
}
