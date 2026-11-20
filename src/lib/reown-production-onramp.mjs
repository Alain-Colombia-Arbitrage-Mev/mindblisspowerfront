import { FUNDING_UUID, personalFundingProviders, validFundingSourceAmount, fundingCurrencyCode, fundingSourceSupported, personalFundingCountry, personalFundingMethod } from './wallet-funding-contract.mjs';
import { browserRequestDeadline } from './browser-request-deadline.mjs';
import { PERSONAL_WALLET_MELD_ASSET } from './personal-wallet.mjs';

const hostedCheckoutAddress = /^0x(?!0{40}$)[0-9a-f]{40}$/i;

/** Reown's opaque widget session is independent of the legacy public-key flow. */
export async function prepareReownUsCheckout(operation, { linkedAddress, assertCurrent, readBinding, projectId, fetchImpl = fetch }) {
  if (!/^[0-9a-f]{32}$/i.test(projectId || '')) throw new Error('reown_unavailable');
  if (!hostedCheckoutAddress.test(linkedAddress || '')) throw new Error('wallet_funding_wallet_not_linked');
  const binding = await operation.wait(() => {
    assertCurrent();
    return readBinding({ signal: operation.signal });
  });
  if (binding?.linked !== true) throw new Error('wallet_funding_wallet_not_linked');
  if (!hostedCheckoutAddress.test(binding.address || '') || binding.address.toLowerCase() !== linkedAddress.toLowerCase()) {
    throw new Error('wallet_address_mismatch');
  }
  const checkout = await operation.wait(async () => {
    assertCurrent();
    const endpoint = new URL('https://rpc.walletconnect.org/v1/onramp/widget-url');
    endpoint.searchParams.set('projectId', projectId);
    endpoint.searchParams.set('new_meld_api', 'true');
    const deadline = browserRequestDeadline(operation.signal, 15_000);
    try {
      // Use AppKit's checkout mint. Its helper omits the selected market,
      // which leaves the hosted widget to infer country and currency.
      const response = await fetchImpl(endpoint, {
        method: 'POST',
        credentials: 'omit',
        redirect: 'error',
        cache: 'no-store',
        signal: deadline.signal,
        body: JSON.stringify({
          projectId,
          externalCustomerId: projectId,
          walletAddress: binding.address,
          destinationCurrencyCode: 'USDC_POLYGON',
          countryCode: 'US',
          sourceCurrencyCode: 'USD',
          paymentMethodType: 'CREDIT_DEBIT_CARD',
        }),
      });
      if (!response.ok) throw new Error('reown_provider_unavailable');
      const result = await response.json();
      if (deadline.signal.aborted) throw deadline.signal.reason ?? new DOMException('Aborted', 'AbortError');
      return result?.url;
    } finally { deadline.dispose(); }
  });
  assertCurrent();
  if (typeof checkout !== 'string' || checkout.length > 8192 || /[\s\\\u0000-\u001f\u007f]/.test(checkout)) {
    throw new Error('reown_provider_invalid');
  }
  const url = new URL(checkout);
  if (url.origin !== 'https://meldcrypto.com' || url.pathname !== '/' || url.username || url.password || url.hash
    || url.searchParams.size !== 1 || !/^[A-Za-z0-9_.~+/-]{1,7800}={0,2}$/.test(url.searchParams.get('wt') || '')) {
    throw new Error('reown_provider_invalid');
  }
  return url.href;
}

/** Validate before linking, selecting a provider or creating a personal intent. */
export function reownFundingCurrency(sourceCurrencyCode = 'USD', context = {}) {
  if (!fundingCurrencyCode(sourceCurrencyCode)) throw new Error('invalid_request');
  if (!fundingSourceSupported({ ...context, sourceCurrencyCode }, 'personal')) throw new Error('wallet_funding_valuation_unavailable');
  return sourceCurrencyCode;
}

export function reownFundingSelection(selection = {}) {
  const sourceCurrencyCode = fundingCurrencyCode(selection.sourceCurrencyCode);
  if (!sourceCurrencyCode) throw new Error('invalid_request');
  if (selection.country && selection.countryCode && selection.country !== selection.countryCode) throw new Error('invalid_request');
  // Residence must come from the user's explicit selection. Browser locale,
  // timezone and saved wallet state cannot supply a checkout country.
  const countryCode = selection.country || selection.countryCode;
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
    || !Array.isArray(allowedProviders) || allowedProviders.length < 1 || allowedProviders.length > personalFundingProviders(countryCode, sourceCurrencyCode, paymentMethodType).length
    || allowedProviders.some(provider => !personalFundingProviders(countryCode, sourceCurrencyCode, paymentMethodType).includes(provider))
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
