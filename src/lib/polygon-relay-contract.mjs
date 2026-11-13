import { LEGACY_POLYGON_COMPANY_PAYMENT as policy, personalCompanyPaymentAtomic } from './personal-company-payment-values.mjs';
import { FUNDING_UUID } from './wallet-funding-contract.mjs';
const ADDRESS = /^0x[0-9a-f]{40}$/;
const HASH = /^0x[0-9a-f]{64}$/;
export const POLYGON_RELAY_ENTRY_POINT = '0x0000000071727de22e5e9d8baf0edac6f37da032';
export const POLYGON_RELAY_DOMAIN = Object.freeze({ name: 'USDT0', version: '1', verifyingContract: policy.tokenAddress,
  salt: `0x${'0'.repeat(62)}89` });
export const POLYGON_RELAY_META_FIELDS = Object.freeze([{ name: 'nonce', type: 'uint256' }, { name: 'from', type: 'address' }, { name: 'functionSignature', type: 'bytes' }]);
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const exact = (value, keys) => object(value) && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
const uuid = value => typeof value === 'string' && value === value.toLowerCase() && FUNDING_UUID.test(value);
const date = value => typeof value === 'string' && value.length <= 64 && Number.isFinite(Date.parse(value));
const address = value => typeof value === 'string' && ADDRESS.test(value);
const hash = value => typeof value === 'string' && HASH.test(value);
const hashOrNull = value => value === null || hash(value);
export const polygonRelayTransferCall = amount => `0xa9059cbb${policy.recipientAddress.slice(2).padStart(64, '0')}${BigInt(amount).toString(16).padStart(64, '0')}`;
export function polygonRelayInput(action, value) {
  if (action === 'prepare' && exact(value, ['requestId', 'amountAtomic']) && uuid(value.requestId) && personalCompanyPaymentAtomic(value.amountAtomic)) return { requestId: value.requestId, amountAtomic: value.amountAtomic };
  if (action === 'authorize' && exact(value, ['paymentId', 'signature']) && uuid(value.paymentId) && typeof value.signature === 'string' && /^0x[0-9a-f]{130}$/.test(value.signature)) return { paymentId: value.paymentId, signature: value.signature };
  if (['submit', 'verify', 'abandon'].includes(action) && exact(value, ['paymentId']) && uuid(value.paymentId)) return { paymentId: value.paymentId };
  return null;
}
export function polygonRelayCapabilities(value) {
  if (!object(value) || value.walletKind !== 'personal' || value.executionMode !== 'polygon_native_meta_aa' || value.chainId !== 137
    || typeof value.transferEnabled !== 'boolean' || value.authorizationHasOnchainExpiry !== false
    || !['mindbliss', 'unavailable'].includes(value.sponsorship) || (value.transferEnabled && value.sponsorship !== 'mindbliss')) return null;
  return { walletKind: 'personal', executionMode: 'polygon_native_meta_aa', chainId: 137, transferEnabled: value.transferEnabled,
    sponsorship: value.sponsorship, authorizationHasOnchainExpiry: false };
}
export function polygonRelayView(value) {
  if (!object(value) || !uuid(value.paymentId) || value.walletKind !== 'personal' || value.executionMode !== 'polygon_native_meta_aa'
    || value.chainId !== 137 || value.tokenAddress !== policy.tokenAddress || value.tokenDecimals !== 6 || value.recipientAddress !== policy.recipientAddress
    || !address(value.walletAddress) || value.walletAddress === policy.recipientAddress || !personalCompanyPaymentAtomic(value.amountAtomic)
    || !['prepared', 'authorized', 'broadcasting', 'ambiguous', 'submitted', 'confirmed', 'failed', 'expired', 'reconciliation_required'].includes(value.status)
    || personalCompanyPaymentAtomic(value.authorizationNonce, true) === null || !hash(value.authorizationDigest)
    || value.authorizationHasOnchainExpiry !== false || !address(value.relayerAddress) || value.relayerAddress === value.walletAddress
    || value.entryPointAddress !== POLYGON_RELAY_ENTRY_POINT || !date(value.createdAt) || !date(value.expiresAt)
    || Date.parse(value.expiresAt) <= Date.parse(value.createdAt)
    || !hashOrNull(value.userOperationHash) || !hashOrNull(value.transactionHash) || !hashOrNull(value.blockHash)
    || !(value.blockNumber === null || personalCompanyPaymentAtomic(value.blockNumber, true) !== null)
    || !Number.isSafeInteger(value.confirmations) || value.confirmations < 0 || value.requiredConfirmations !== 12
    || !(value.confirmedAt === null || date(value.confirmedAt)) || value.membershipAssignment !== 'pending'
    || !(value.failureReason === null || ['transaction_reverted', 'user_operation_reverted', 'authorization_nonce_changed', 'sponsorship_rejected', 'operation_expired', 'preparation_expired', 'preparation_abandoned', 'transaction_mismatch'].includes(value.failureReason))) return null;
  if (value.status === 'confirmed' && (!value.userOperationHash || !value.transactionHash || !value.blockHash || value.blockNumber === null || value.confirmations < 12 || value.confirmedAt === null || value.failureReason !== null)) return null;
  if (value.status !== 'confirmed' && value.confirmedAt !== null) return null;
  if (['prepared', 'authorized'].includes(value.status) && (value.userOperationHash !== null || value.transactionHash !== null
    || value.blockHash !== null || value.blockNumber !== null || value.confirmations !== 0 || value.failureReason !== null)) return null;
  if (['broadcasting', 'ambiguous', 'submitted'].includes(value.status) && (value.blockHash !== null || value.blockNumber !== null
    || value.confirmations >= 12 || value.failureReason !== null)) return null;
  if (['ambiguous', 'submitted'].includes(value.status) && value.userOperationHash === null) return null;
  let typedData = null;
  if (value.typedData !== null) {
    const typed = value.typedData;
    if (value.status !== 'prepared' || !exact(typed, ['domain', 'primaryType', 'types', 'message']) || !exact(typed.domain, Object.keys(POLYGON_RELAY_DOMAIN))
      || Object.entries(POLYGON_RELAY_DOMAIN).some(([key, item]) => typed.domain[key] !== item) || typed.primaryType !== 'MetaTransaction'
      || !exact(typed.types, ['MetaTransaction']) || JSON.stringify(typed.types.MetaTransaction) !== JSON.stringify(POLYGON_RELAY_META_FIELDS)
      || !exact(typed.message, ['nonce', 'from', 'functionSignature']) || typed.message.nonce !== value.authorizationNonce
      || typed.message.from !== value.walletAddress || typed.message.functionSignature !== polygonRelayTransferCall(value.amountAtomic)) return null;
    typedData = { domain: { ...POLYGON_RELAY_DOMAIN }, primaryType: 'MetaTransaction', types: { MetaTransaction: POLYGON_RELAY_META_FIELDS.map(item => ({ ...item })) },
      message: { nonce: value.authorizationNonce, from: value.walletAddress, functionSignature: typed.message.functionSignature } };
  }
  return { paymentId: value.paymentId, walletKind: 'personal', executionMode: 'polygon_native_meta_aa', ...policy,
    walletAddress: value.walletAddress, amountAtomic: value.amountAtomic, status: value.status,
    authorizationNonce: value.authorizationNonce, authorizationDigest: value.authorizationDigest, authorizationHasOnchainExpiry: false,
    relayerAddress: value.relayerAddress, entryPointAddress: POLYGON_RELAY_ENTRY_POINT, createdAt: value.createdAt, expiresAt: value.expiresAt,
    userOperationHash: value.userOperationHash, transactionHash: value.transactionHash, blockNumber: value.blockNumber, blockHash: value.blockHash,
    confirmations: value.confirmations, requiredConfirmations: 12, confirmedAt: value.confirmedAt, failureReason: value.failureReason,
    membershipAssignment: 'pending', typedData };
}
export function polygonRelayHistory(value) {
  if (!object(value) || value.walletKind !== 'personal' || !Array.isArray(value.payments) || value.payments.length > 20) return null;
  const payments = value.payments.map(polygonRelayView);
  return payments.some(item => !item) || new Set(payments.map(item => item.paymentId)).size !== payments.length || new Set(payments.map(item => item.walletAddress)).size > 1
    ? null : { walletKind: 'personal', payments };
}
