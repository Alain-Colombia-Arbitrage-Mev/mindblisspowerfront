import { PERSONAL_COMPANY_PAYMENT } from './personal-company-payment-values.mjs';
import { FUNDING_UUID } from './wallet-funding-contract.mjs';

const HASH = /^0x[0-9a-f]{64}$/;
const ADDRESS = /^0x[0-9a-f]{40}$/;
const MAX_UINT256 = (1n << 256n) - 1n;
const statuses = new Set(['prepared', 'submitted', 'confirmed', 'failed']);
const validUuid = value => typeof value === 'string' && value.length === 36 && FUNDING_UUID.test(value) && value === value.toLowerCase();
const validHash = value => typeof value === 'string' && value.length === 66 && HASH.test(value);
export function companyAtomic(value) {
  return typeof value === 'string' && /^[1-9][0-9]{0,77}$/.test(value) && BigInt(value) <= MAX_UINT256;
}
export function companyPaymentInput(value, action) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const keys = action === 'prepare' ? ['requestId', 'amountAtomic'] : action === 'submit' ? ['paymentId', 'transactionHash'] : ['verify', 'abandon'].includes(action) ? ['paymentId'] : [];
  if (!keys.length || Object.keys(value).length !== keys.length || Object.keys(value).some(key => !keys.includes(key))) return null;
  if (action === 'prepare') return validUuid(value.requestId) && companyAtomic(value.amountAtomic) ? { requestId: value.requestId, amountAtomic: value.amountAtomic } : null;
  if (!validUuid(value.paymentId) || (action === 'submit' && !validHash(value.transactionHash))) return null;
  return { paymentId: value.paymentId, ...(action === 'submit' ? { transactionHash: value.transactionHash } : {}) };
}

/** Canonical payment evidence is independent of membership activation or credit. */
export function companyPaymentView(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || !validUuid(value.paymentId)
    || value.walletKind !== 'personal' || typeof value.walletAddress !== 'string' || !ADDRESS.test(value.walletAddress) || value.walletAddress === PERSONAL_COMPANY_PAYMENT.recipientAddress
    || Object.entries(PERSONAL_COMPANY_PAYMENT).some(([key, expected]) => value[key] !== expected)
    || !companyAtomic(value.amountAtomic) || !statuses.has(value.status) || value.membershipAssignment !== 'pending'
    || typeof value.createdAt !== 'string' || value.createdAt.length > 64 || !Number.isFinite(Date.parse(value.createdAt))
    || typeof value.expiresAt !== 'string' || value.expiresAt.length > 64 || !Number.isFinite(Date.parse(value.expiresAt))
    || Date.parse(value.expiresAt) <= Date.parse(value.createdAt)
    || !(value.abandonedAt === null || (typeof value.abandonedAt === 'string' && value.abandonedAt.length <= 64 && Number.isFinite(Date.parse(value.abandonedAt)) && Date.parse(value.abandonedAt) >= Date.parse(value.createdAt)))
    || !(value.transactionHash === null || validHash(value.transactionHash))
    || !(value.blockHash === null || validHash(value.blockHash))
    || !(value.blockNumber === null || (typeof value.blockNumber === 'string' && /^[1-9][0-9]{0,18}$/.test(value.blockNumber)))
    || !Number.isInteger(value.confirmations) || value.confirmations < 0 || value.confirmations > 2_147_483_647 || value.requiredConfirmations !== 12
    || ![null, 'transaction_reverted', 'transaction_mismatch'].includes(value.failureReason)) return null;
  if (value.status === 'prepared' && (value.transactionHash !== null || value.blockHash !== null || value.blockNumber !== null || value.confirmations !== 0 || value.failureReason !== null)) return null;
  if (value.status !== 'prepared' && !value.transactionHash) return null;
  if (value.status === 'confirmed' && (!value.blockHash || !value.blockNumber || value.confirmations < 12 || value.failureReason !== null)) return null;
  if (value.status !== 'confirmed' && (value.blockHash !== null || value.blockNumber !== null || value.confirmations >= 12)) return null;
  if (value.status === 'failed' ? value.failureReason === null : value.failureReason !== null) return null;
  return { paymentId: value.paymentId, walletKind: 'personal', walletAddress: value.walletAddress, ...PERSONAL_COMPANY_PAYMENT,
    amountAtomic: value.amountAtomic, status: value.status, createdAt: value.createdAt, expiresAt: value.expiresAt,
    transactionHash: value.transactionHash, blockHash: value.blockHash, blockNumber: value.blockNumber, confirmations: value.confirmations,
    requiredConfirmations: 12, failureReason: value.failureReason, abandonedAt: value.abandonedAt, membershipAssignment: 'pending' };
}

export function companyPaymentHistory(value) {
  if (!value || value.walletKind !== 'personal' || value.membershipAssignment !== 'pending' || !Array.isArray(value.records) || value.records.length > 20) return null;
  const records = value.records.map(companyPaymentView);
  if (records.some(record => !record) || new Set(records.map(record => record.paymentId)).size !== records.length) return null;
  const hashes = records.map(record => record.transactionHash).filter(Boolean);
  if (new Set(hashes).size !== hashes.length) return null;
  return { walletKind: 'personal', records, membershipAssignment: 'pending' };
}
