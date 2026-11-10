import { buildAdministrativeMeldOnrampUrl } from './meld-onramp.mjs';
import { createOnrampIntent, ONRAMP_CRYPTO } from './meld-onramp-client.mjs';

/**
 * Administrative funding has its own checkout and never imports a personal wallet SDK.
 * @param {{address: string, amount: number, countryCode: string, paymentMethodType: string, serviceProvider: string}} input
 * @param {{signal?: AbortSignal, createIntent?: typeof createOnrampIntent, openCheckout?: (url: string) => void}} [options]
 */
export async function startAdministrativeMeldOnramp({ address, amount, countryCode, paymentMethodType, serviceProvider }, {
  signal, createIntent = createOnrampIntent, openCheckout = openMeldCheckout,
} = {}) {
  const intent = await createIntent({ walletKind: 'administrative', walletAddress: address,
    country: countryCode, fiat: 'USD', crypto: ONRAMP_CRYPTO, amount, paymentMethodType, serviceProvider }, { signal });
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  if (intent?.walletKind !== 'administrative' || !intent.checkoutUrl || !intent.quote) throw new Error('onramp_unavailable');
  const checkoutUrl = buildAdministrativeMeldOnrampUrl({ providerUrl: intent.checkoutUrl, address,
    checkoutReference: intent.checkoutReference, countryCode,
    amount: intent.quote.sourceAmount, paymentMethodType: intent.quote.paymentMethodType,
    serviceProvider: intent.quote.serviceProvider });
  openCheckout(checkoutUrl);
  return { opened: true, provider: 'meld' };
}

function openMeldCheckout(url) {
  const checkout = window.open(url, '_blank');
  if (checkout) checkout.opener = null;
  else window.location.assign(url);
}
