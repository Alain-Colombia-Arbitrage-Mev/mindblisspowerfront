const ADDRESS = /^0x[0-9a-f]{40}$/i;

/** A provider may expose several permitted accounts. Only its selected first
 * account may match this payment's already-bound signer. This read does not
 * prove ownership: the native EIP-712 signature is still verified separately.
 */
export function hasSelectedPolygonRelayAccount(accounts, expectedWallet) {
  if (typeof expectedWallet !== 'string' || !ADDRESS.test(expectedWallet) || !Array.isArray(accounts)
    || accounts.length === 0 || accounts.length > 128 || typeof accounts[0] !== 'string'
    || accounts[0].toLowerCase() !== expectedWallet.toLowerCase()) return false;
  const seen = new Set();
  for (const account of accounts) {
    if (typeof account !== 'string' || !ADDRESS.test(account)) return false;
    const normalized = account.toLowerCase();
    if (seen.has(normalized)) return false;
    seen.add(normalized);
  }
  return true;
}
