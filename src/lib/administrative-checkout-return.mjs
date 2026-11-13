import { FUNDING_UUID } from './wallet-funding-contract.mjs';

/** A return reference selects an owner-scoped read; no callback field proves payment. */
export function administrativeCheckoutReturn(search) {
  if (typeof search !== 'string' || search.length > 2048) return null;
  const values = new URLSearchParams(search).getAll('checkoutReference');
  if (values.length !== 1 || values[0].length !== 36 || !FUNDING_UUID.test(values[0])) return null;
  return values[0].toLowerCase();
}
