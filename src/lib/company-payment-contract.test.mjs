import assert from 'node:assert/strict';
import test from 'node:test';
import { companyAtomic, companyPaymentInput, companyPaymentView, companyPaymentHistory } from './company-payment-contract.mjs';
import { PERSONAL_COMPANY_PAYMENT, LEGACY_POLYGON_COMPANY_PAYMENT } from './personal-company-payment-values.mjs';

const paymentId = 'd8a4c010-cc33-44da-a297-8b3c6440f491';
const otherId = 'd8a4c010-cc33-44da-a297-8b3c6440f492';
const sender = `0x${'1'.repeat(40)}`;
const hash = `0x${'a'.repeat(64)}`;
const blockHash = `0x${'b'.repeat(64)}`;
const ack = (patch = {}) => ({ paymentId, walletKind: 'personal', walletAddress: sender, ...PERSONAL_COMPANY_PAYMENT,
  amountAtomic: '9007199254740993123456', status: 'prepared', createdAt: '2026-11-11T10:00:00.000Z', expiresAt: '2026-11-11T10:15:00.000Z',
  transactionHash: null, blockHash: null, blockNumber: null, confirmations: 0, requiredConfirmations: 12, failureReason: null,
  abandonedAt: null, membershipAssignment: 'pending', ...patch });

test('Ethereum and historical Polygon evidence retain the exact chain and token pair', () => {
  const legacy = ack({ ...LEGACY_POLYGON_COMPANY_PAYMENT, status: 'confirmed', transactionHash: hash, blockHash, blockNumber: '80000000', confirmations: 12 });
  assert.deepEqual(companyPaymentView(legacy), legacy);
  assert.equal(companyPaymentView(ack({ chainId: 137 })), null);
  assert.equal(companyPaymentView({ ...legacy, chainId: 1 }), null);
  assert.equal(companyPaymentView(ack()).chainId, 1);
});

test('company amounts remain positive canonical uint256 strings beyond JavaScript precision', () => {
  for (const amount of ['1', '9007199254740993123456', ((1n << 256n) - 1n).toString()]) assert.equal(companyAtomic(amount), true);
  for (const amount of [null, undefined, 1, 1n, [], ['1'], {}, '', '0', '-1', '+1', '01', '1.0', '1e6', ' 1', '1 ', 'NaN',
    (1n << 256n).toString(), '9'.repeat(79)]) assert.equal(companyAtomic(amount), false);
});

test('payment inputs accept only action-specific identifiers and forbid client-controlled financial policy or identity', () => {
  assert.deepEqual(companyPaymentInput({ requestId: paymentId, amountAtomic: '1' }, 'prepare'), { requestId: paymentId, amountAtomic: '1' });
  for (const chainId of [1, 137]) assert.deepEqual(companyPaymentInput({ requestId: paymentId, amountAtomic: '1', chainId }, 'prepare'), { requestId: paymentId, amountAtomic: '1', chainId });
  for (const chainId of [10, '137', '1', null, [], true]) assert.equal(companyPaymentInput({ requestId: paymentId, amountAtomic: '1', chainId }, 'prepare'), null);
  assert.deepEqual(companyPaymentInput({ paymentId, transactionHash: hash }, 'submit'), { paymentId, transactionHash: hash });
  assert.deepEqual(companyPaymentInput({ paymentId }, 'verify'), { paymentId });
  assert.deepEqual(companyPaymentInput({ paymentId }, 'abandon'), { paymentId });
  assert.equal(companyPaymentInput({ paymentId, transactionHash: hash }, 'abandon'), null);
  assert.equal(companyPaymentInput({ paymentId, subject: 'another-owner' }, 'abandon'), null);
  for (const field of ['subject', 'userId', 'walletKind', 'walletAddress', 'recipientAddress', 'tokenAddress', 'chainId', 'packageId', 'confirmed']) {
    assert.equal(companyPaymentInput({ requestId: paymentId, amountAtomic: '1', [field]: 'untrusted' }, 'prepare'), null);
  }
  for (const [action, input] of [['unknown', {}], ['prepare', { paymentId, amountAtomic: '1' }],
    ['prepare', { requestId: [paymentId], amountAtomic: '1' }], ['verify', { paymentId: [paymentId] }],
    ['submit', { paymentId, transactionHash: [hash] }], ['submit', { paymentId, transactionHash: hash.toUpperCase() }]]) {
    assert.equal(companyPaymentInput(input, action), null, `${action} must reject a noncanonical identifier`);
  }
});

test('canonical receipts strip private fields and never convert confirmation into membership activation or balance credit', () => {
  assert.deepEqual(companyPaymentView({ ...ack(), subject: 'private-subject', secret: 'synthetic-private', creditedBalance: 999 }), ack());
  const confirmed = ack({ status: 'confirmed', transactionHash: hash, blockNumber: '80000000', blockHash, confirmations: 12 });
  assert.deepEqual(companyPaymentView({ ...confirmed, membershipActivated: true, creditedBalance: 100 }), confirmed);
  assert.equal(companyPaymentView({ ...confirmed, membershipAssignment: 'activated' }), null);
  assert.equal(companyPaymentView({ ...confirmed, confirmations: 11 }), null);
});

test('receipt policy rejects changed token, receiver, chain, precision, sender and personal-wallet context', () => {
  for (const patch of [{ recipientAddress: sender }, { tokenAddress: sender }, { chainId: 137 }, { tokenDecimals: 18 },
    { walletKind: 'administrative' }, { walletAddress: PERSONAL_COMPANY_PAYMENT.recipientAddress }, { walletAddress: 'invalid' },
    { amountAtomic: 100 }, { amountAtomic: '01' }, { paymentId: 'invalid' }, { status: 'complete' }, { requiredConfirmations: 1 },
    { expiresAt: 'not-a-date' }, { expiresAt: ack().createdAt }]) assert.equal(companyPaymentView(ack(patch)), null);
});

test('receipt identifiers are actual strings so JSON arrays cannot bypass history identity and deduplication', () => {
  for (const patch of [{ paymentId: [paymentId] }, { walletAddress: [sender] }]) assert.equal(companyPaymentView(ack(patch)), null);
  const submitted = ack({ status: 'submitted', transactionHash: hash });
  assert.equal(companyPaymentView({ ...submitted, transactionHash: [hash] }), null);
  const confirmed = { ...submitted, status: 'confirmed', blockHash, blockNumber: '80000000', confirmations: 12 };
  assert.equal(companyPaymentView({ ...confirmed, blockHash: [blockHash] }), null);
  assert.equal(companyPaymentHistory({ walletKind: 'personal', membershipAssignment: 'pending', records: [ack({ paymentId: [paymentId] }), ack({ paymentId: [paymentId] })] }), null);
});

test('submitted and failed receipts cannot masquerade as canonical block confirmation', () => {
  assert.ok(companyPaymentView(ack({ status: 'submitted', transactionHash: hash, confirmations: 11 })));
  assert.ok(companyPaymentView(ack({ status: 'failed', transactionHash: hash, failureReason: 'transaction_reverted' })));
  for (const patch of [{ status: 'submitted', transactionHash: hash, blockHash, blockNumber: '80000000', confirmations: 12 },
    { status: 'failed', transactionHash: hash, failureReason: 'transaction_mismatch', blockHash, blockNumber: '80000000', confirmations: 12 },
    { status: 'prepared', transactionHash: hash }, { status: 'failed', transactionHash: hash },
    { status: 'submitted', transactionHash: hash, failureReason: 'transaction_mismatch' }]) assert.equal(companyPaymentView(ack(patch)), null);
});

test('history stays personal, bounded and unique while projecting safe evidence only', () => {
  const history = { walletKind: 'personal', records: [ack(), ack({ paymentId: otherId })], membershipAssignment: 'pending' };
  assert.deepEqual(companyPaymentHistory({ ...history, secret: 'private', records: history.records.map(row => ({ ...row, subject: 'private' })) }), history);
  for (const value of [{ ...history, walletKind: 'administrative' }, { ...history, membershipAssignment: 'activated' },
    { ...history, records: [ack(), ack()] }, { ...history, records: Array(21).fill(ack()) },
    { ...history, records: [ack({ status: 'submitted', transactionHash: hash }), ack({ paymentId: otherId, status: 'submitted', transactionHash: hash })] },
    { ...history, records: [ack({ walletKind: 'administrative' })] }, { ...history, records: 'invalid' }]) assert.equal(companyPaymentHistory(value), null);
  assert.deepEqual(companyPaymentHistory({ ...history, records: [] }).records, []);
});

test('abandonment preserves the immutable receipt and remains visible after a late real transaction', () => {
  const abandonedAt = '2026-11-11T10:01:00.000Z';
  const prepared = ack({ abandonedAt });
  assert.deepEqual(companyPaymentView(prepared), prepared);
  const confirmed = ack({ abandonedAt, status: 'confirmed', transactionHash: hash, blockHash, blockNumber: '80000000', confirmations: 12 });
  assert.deepEqual(companyPaymentView(confirmed), confirmed);
  for (const value of [undefined, true, ['2026-11-11T10:01:00Z'], 'not-a-date', '2026-11-11T09:59:59Z']) {
    assert.equal(companyPaymentView(ack({ abandonedAt: value })), null);
  }
});
