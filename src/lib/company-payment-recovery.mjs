import { companyAtomic } from './company-payment-contract.mjs';
import { FUNDING_UUID } from './wallet-funding-contract.mjs';

const address = value => typeof value === 'string' && /^0x[0-9a-f]{40}$/.test(value);
export function companyRecoveryKey(walletAddress, paymentId) {
  if (!address(walletAddress) || typeof paymentId !== 'string' || !FUNDING_UUID.test(paymentId)) throw new Error('personal_company_invalid_intent');
  return `mindbliss:company-payment:v1:${walletAddress}:${paymentId}`;
}
function valid(value, walletAddress, paymentId) {
  return value && value.version === 1 && value.walletAddress === walletAddress && value.paymentId === paymentId && companyAtomic(value.amountAtomic)
    && ['signing', 'broadcast', 'submitted'].includes(value.phase)
    && (value.transactionHash === null || (typeof value.transactionHash === 'string' && /^0x[0-9a-f]{64}$/.test(value.transactionHash)));
}
/** Recovery metadata never authenticates a user or confirms a payment. */
export function readCompanyRecovery(storage, walletAddress, paymentId) {
  try {
    const raw = storage.getItem(companyRecoveryKey(walletAddress, paymentId));
    if (!raw || raw.length > 2048) return null;
    const value = JSON.parse(raw);
    return valid(value, walletAddress, paymentId) ? value : null;
  } catch { return null; }
}
export function saveCompanyRecovery(storage, value) {
  if (!valid(value, value?.walletAddress, value?.paymentId)) throw new Error('personal_company_invalid_intent');
  try {
    const key = companyRecoveryKey(value.walletAddress, value.paymentId), raw = JSON.stringify(value);
    storage.setItem(key, raw);
    if (storage.getItem(key) !== raw) throw new Error();
  } catch { throw new Error('personal_company_recovery_unavailable'); }
}
export function clearCompanyRecovery(storage, walletAddress, paymentId) {
  try { storage.removeItem(companyRecoveryKey(walletAddress, paymentId)); } catch { /* server history remains authoritative */ }
}
