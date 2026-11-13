import { FUNDING_UUID } from './wallet-funding-contract.mjs';

// A callback selects an owned status read only; it never proves a payment.
// This ledger has a separate parameter from both legacy MELD checkouts.
export function walletReownCheckoutReturn(search) {
  const prefix = '?sandboxCheckoutReference=';
  if (typeof search !== 'string' || search.length !== prefix.length + 36 || !search.startsWith(prefix)) return '';
  const reference = search.slice(prefix.length);
  return FUNDING_UUID.test(reference) ? reference.toLowerCase() : '';
}
