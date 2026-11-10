import { createAdministrativeSandboxSession } from './wallet-funding-client.mjs';
import { fundingAcknowledgement } from './wallet-funding-contract.mjs';

/**
 * Administrative funding has its own checkout and never imports a personal wallet SDK.
 * @param {{requestId: string, address: string, amount: number, countryCode: string, paymentMethodType?: string, serviceProvider: string}} input
 * @param {{signal?: AbortSignal, createSession?: typeof createAdministrativeSandboxSession, openCheckout?: (url: string) => void}} [options]
 */
export async function startAdministrativeMeldOnramp({ requestId, address, amount, countryCode, paymentMethodType, serviceProvider }, {
  signal, createSession = createAdministrativeSandboxSession, openCheckout = openMeldCheckout,
} = {}) {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  const response = await createSession({ requestId, walletAddress: address, country: countryCode, amount, paymentMethodType, serviceProvider }, { signal });
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  const session = fundingAcknowledgement(response, 'administrative');
  if (!session || session.requestedAmount !== amount || session.checkoutReference !== requestId
    || !('checkoutUrl' in session) || typeof session.checkoutUrl !== 'string') throw new Error('sandbox_unavailable');
  openCheckout(session.checkoutUrl);
  return session;
}

function openMeldCheckout(url) {
  const checkout = window.open(url, '_blank');
  if (checkout) checkout.opener = null;
  else window.location.assign(url);
}
