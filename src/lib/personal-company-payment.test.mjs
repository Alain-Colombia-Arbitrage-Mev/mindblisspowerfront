import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { setImmediate } from 'node:timers/promises';
import test from 'node:test';
import { Interface } from 'ethers';
import { PERSONAL_COMPANY_PAYMENT, personalCompanyPaymentAmountAtomic, formatPersonalCompanyPaymentAmount,
  personalCompanyPaymentIntent, readPersonalCompanyPaymentBalance, createPersonalCompanyPaymentTransfer } from './personal-company-payment.mjs';

const sender = `0x${'1'.repeat(40)}`;
const other = `0x${'2'.repeat(40)}`;
const paymentId = 'd8a4c010-cc33-44da-a297-8b3c6440f491';
const hash = `0x${'a'.repeat(64)}`;
const now = Date.parse('2026-11-11T10:00:00Z');
const balance = '9007199254740993123456';
const abi = new Interface(['function balanceOf(address) view returns(uint256)', 'function decimals() view returns(uint8)',
  'function transfer(address,uint256) returns(bool)']);
const uint = value => `0x${BigInt(value).toString(16).padStart(64, '0')}`;
const deferred = () => { let resolve; let reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const intent = (patch = {}) => ({ paymentId, walletAddress: sender, ...PERSONAL_COMPANY_PAYMENT,
  amountAtomic: balance, status: 'prepared', abandonedAt: null, expiresAt: new Date(now + 60000).toISOString(), ...patch });

function fixture({ balanceAtomic = balance, native = '0x5b8d80', chain = '0x89', accounts = [sender], hooks = {} } = {}) {
  const provider = new EventEmitter();
  const calls = [], markers = [], broadcasts = [], states = [];
  provider.request = async request => {
    calls.push(request);
    if (hooks[request.method]) return hooks[request.method](request, provider);
    if (request.method === 'eth_chainId') return chain;
    if (request.method === 'eth_accounts') return accounts;
    if (request.method === 'eth_call') {
      const parsed = abi.parseTransaction({ data: request.params[0].data });
      assert.equal(request.params[0].to, PERSONAL_COMPANY_PAYMENT.tokenAddress);
      return uint(parsed.name === 'decimals' ? 6 : balanceAtomic);
    }
    if (request.method === 'eth_estimateGas') return '0xc350'; // 50,000 gas.
    if (request.method === 'eth_gasPrice') return '0x64'; // 100 wei per gas.
    if (request.method === 'eth_getBalance') return native; // Exactly 60,000 * 100.
    if (request.method === 'eth_sendTransaction') return hash;
    assert.fail(`Unexpected wallet RPC ${request.method}`);
  };
  const create = patch => createPersonalCompanyPaymentTransfer({ walletProvider: provider, walletAddress: sender,
    onDispatchStart: value => markers.push(value), onBroadcast: value => broadcasts.push(value),
    onStateChange: value => states.push(value), now: () => now, readTimeoutMs: 1000, broadcastTimeoutMs: 1000, ...patch });
  return { provider, calls, markers, broadcasts, states, create, sends: () => calls.filter(call => call.method === 'eth_sendTransaction') };
}

test('official Polygon token identity is exactly twenty bytes and amount conversion preserves all six decimals', () => {
  assert.equal(PERSONAL_COMPANY_PAYMENT.tokenAddress, '0xc2132d05d31c914a87c6611c10748aeb04b58e8f');
  assert.equal(PERSONAL_COMPANY_PAYMENT.tokenAddress.length, 42);
  assert.equal(PERSONAL_COMPANY_PAYMENT.tokenDecimals, 6);
  assert.equal(personalCompanyPaymentAmountAtomic('9007199254740993.123456'), balance);
  assert.equal(formatPersonalCompanyPaymentAmount(balance), '9007199254740993.123456');
  assert.equal(personalCompanyPaymentAmountAtomic('0.000001'), '1');
  assert.equal(formatPersonalCompanyPaymentAmount('0'), '0');
  assert.equal(formatPersonalCompanyPaymentAmount('20000000'), '20');
  for (const input of [20, 1n, null, {}, [], '', ' 20', '20 ', '0', '0.000000', '01', '1e6', '1.0000001', '-1', '+1', '1.', '.1', '9'.repeat(100)]) {
    assert.equal(personalCompanyPaymentAmountAtomic(input), null);
  }
  const maximum = ((1n << 256n) - 1n).toString();
  assert.equal(personalCompanyPaymentAmountAtomic(formatPersonalCompanyPaymentAmount(maximum)), maximum);
  assert.throws(() => formatPersonalCompanyPaymentAmount((1n << 256n).toString()));
});

test('MAX reads the complete token balance without requesting signatures, account access, approvals or native transfers', async () => {
  const mock = fixture();
  const result = await readPersonalCompanyPaymentBalance({ walletProvider: mock.provider, walletAddress: sender });
  assert.equal(result.balanceAtomic, balance);
  assert.equal(result.amount, '9007199254740993.123456');
  assert.equal(result.chainId, 137);
  assert.deepEqual([...new Set(mock.calls.map(call => call.method))].sort(), ['eth_accounts', 'eth_call', 'eth_chainId']);
  assert.equal(mock.provider.listenerCount('accountsChanged'), 0);
  assert.equal(mock.provider.listenerCount('chainChanged'), 0);
});

test('a prepared backend intent cannot change the sender, company, token, chain, precision or expiry', () => {
  for (const patch of [{ walletAddress: other }, { recipientAddress: other }, { tokenAddress: other }, { chainId: 1 },
    { tokenDecimals: 18 }, { amountAtomic: 20 }, { amountAtomic: '01' }, { amountAtomic: '0' }, { status: 'confirmed' },
    { paymentId: 'bad' }, { expiresAt: 'not-a-date' }]) assert.throws(() => personalCompanyPaymentIntent(intent(patch), sender, now));
  assert.throws(() => personalCompanyPaymentIntent(intent({ expiresAt: new Date(now).toISOString() }), sender, now), { message: 'personal_company_intent_expired' });
  assert.throws(() => personalCompanyPaymentIntent(intent({ walletAddress: PERSONAL_COMPANY_PAYMENT.recipientAddress }), PERSONAL_COMPANY_PAYMENT.recipientAddress, now));
});

test('an abandoned preparation cannot prompt, while legacy missing abandonment metadata normalizes to null', () => {
  assert.equal(personalCompanyPaymentIntent(intent({ abandonedAt: undefined }), sender, now).abandonedAt, null);
  const mock = fixture();
  const controller = mock.create();
  for (const abandonedAt of [new Date(now - 1).toISOString(), '', false, true, [], {}]) {
    assert.throws(() => personalCompanyPaymentIntent(intent({ abandonedAt }), sender, now), { message: 'personal_company_intent_abandoned' });
    assert.throws(() => controller.sendPrepared(intent({ abandonedAt }), { reviewedBalanceAtomic: balance }), { message: 'personal_company_intent_abandoned' });
  }
  assert.equal(mock.calls.length, 0);
});

test('one user action sends only the exact ERC20 transfer and retains its hash before registration', async () => {
  const mock = fixture();
  const controller = mock.create({ onDispatchStart: value => {
    assert.equal(mock.sends().length, 0);
    mock.markers.push(value);
  } });
  const result = await controller.sendPrepared(intent(), { reviewedBalanceAtomic: balance });
  assert.equal(result.phase, 'broadcast');
  assert.equal(result.transactionHash, hash);
  assert.equal(result.transactionMayExist, true);
  assert.equal(result.retryable, false);
  assert.equal(mock.markers.length, 1);
  assert.equal(mock.broadcasts.length, 1);
  assert.equal(mock.sends().length, 1);
  const transaction = mock.sends()[0].params[0];
  assert.equal(transaction.from, sender);
  assert.equal(transaction.to, PERSONAL_COMPANY_PAYMENT.tokenAddress);
  assert.equal(transaction.value, '0x0');
  assert.equal(transaction.chainId, '0x89');
  assert.equal(transaction.gas, '0xea60');
  assert.equal(transaction.gasPrice, '0x64');
  const decoded = abi.parseTransaction({ data: transaction.data });
  assert.equal(decoded.name, 'transfer');
  assert.equal(decoded.args[0].toLowerCase(), PERSONAL_COMPANY_PAYMENT.recipientAddress);
  assert.equal(decoded.args[1], BigInt(balance));
  assert.equal(mock.calls.some(call => /signTypedData|signMessage|approve|permit|sendRawTransaction/.test(call.method)), false);
  assert.throws(() => controller.markSubmitted(paymentId, `0x${'b'.repeat(64)}`));
  assert.equal(controller.markSubmitted(paymentId, hash).phase, 'submitted');
  assert.equal(controller.snapshot().transactionHash, hash);
});

test('insufficient USDT or POL and unavailable gas estimates never open a transaction prompt', async () => {
  for (const [mock, prepared, expected] of [
    [fixture(), intent({ amountAtomic: (BigInt(balance) + 1n).toString() }), 'personal_company_insufficient_usdt'],
    [fixture({ native: '0x5b8d7f' }), intent(), 'personal_company_insufficient_pol'],
    [fixture({ hooks: { eth_estimateGas: () => '0x0' } }), intent(), 'personal_company_gas_unavailable'],
    [fixture({ hooks: { eth_gasPrice: () => '0x0' } }), intent(), 'personal_company_gas_unavailable'],
  ]) {
    await assert.rejects(mock.create().sendPrepared(prepared, { reviewedBalanceAtomic: balance }), { message: expected });
    assert.equal(mock.sends().length, 0);
    assert.equal(mock.markers.length, 0);
  }
});

test('a zero POL balance reports the specific gas requirement before estimating or sending a transaction', async () => {
  const mock = fixture({ native: '0x0', hooks: { eth_estimateGas: () => assert.fail('zero-gas wallet reached estimation') } });
  await assert.rejects(mock.create().sendPrepared(intent(), { reviewedBalanceAtomic: balance }), { message: 'personal_company_insufficient_pol' });
  assert.equal(mock.calls.some(call => call.method === 'eth_estimateGas'), false);
  assert.equal(mock.sends().length, 0);
  assert.equal(mock.markers.length, 0);
});

test('wrong chain, wrong selected account and a different token precision fail closed', async () => {
  for (const [mock, message] of [
    [fixture({ chain: '0x1' }), 'personal_company_chain_changed'],
    [fixture({ accounts: [other, sender] }), 'personal_company_wallet_changed'],
    [fixture({ hooks: { eth_call: request => uint(request.params[0].data === abi.encodeFunctionData('decimals') ? 18 : balance) } }), 'personal_company_token_mismatch'],
  ]) {
    await assert.rejects(mock.create().sendPrepared(intent(), { reviewedBalanceAtomic: balance }), { message });
    assert.equal(mock.sends().length, 0);
  }
});

test('account or network changes during RPC invalidate the entire review even if the provider later switches back', async () => {
  for (const [event, changed, message] of [['accountsChanged', [other], 'personal_company_wallet_changed'],
    ['chainChanged', '0x1', 'personal_company_chain_changed']]) {
    const mock = fixture({ hooks: { eth_estimateGas: (_request, provider) => {
      provider.emit(event, changed); provider.emit(event, event === 'chainChanged' ? '0x89' : [sender]); return '0xc350';
    } } });
    await assert.rejects(mock.create().sendPrepared(intent(), { reviewedBalanceAtomic: balance }), { message });
    assert.equal(mock.sends().length, 0);
  }
});

test('a stale MAX snapshot or a balance change before prompting requires a new review rather than silently changing the amount', async () => {
  const stale = fixture();
  await assert.rejects(stale.create().sendPrepared(intent(), { reviewedBalanceAtomic: (BigInt(balance) - 1n).toString() }), { message: 'personal_company_balance_changed' });
  let balances = 0;
  const changed = fixture({ hooks: { eth_call: request => {
    if (request.params[0].data === abi.encodeFunctionData('decimals')) return uint(6);
    return uint(++balances === 1 ? balance : BigInt(balance) + 1n);
  } } });
  await assert.rejects(changed.create().sendPrepared(intent(), { reviewedBalanceAtomic: balance }), { message: 'personal_company_balance_changed' });
  assert.equal(stale.sends().length + changed.sends().length, 0);
});

test('the reviewed balance is mandatory and missing or malformed options fail before every RPC', async () => {
  const mock = fixture();
  const controller = mock.create();
  for (const options of [undefined, null, {}, [], { reviewedBalanceAtomic: 20 }, { reviewedBalanceAtomic: '01' }, { reviewedBalanceAtomic: '' }]) {
    await assert.rejects(Reflect.apply(controller.sendPrepared, controller, [intent(), options]), { message: 'personal_company_balance_changed' });
  }
  assert.equal(mock.calls.length, 0);
});

test('expired intents and a failed dispatch guard cannot trigger the wallet RPC', async () => {
  const expired = fixture();
  assert.throws(() => expired.create({ now: () => now + 60000 }).sendPrepared(intent(), { reviewedBalanceAtomic: balance }), { message: 'personal_company_intent_expired' });
  assert.equal(expired.calls.length, 0);
  const guard = fixture();
  await assert.rejects(guard.create({ onDispatchStart: () => { throw Error('guard-storage-failed'); } })
    .sendPrepared(intent(), { reviewedBalanceAtomic: balance }), { message: 'guard-storage-failed' });
  assert.equal(guard.sends().length, 0);
  let clock = now;
  const late = fixture();
  await assert.rejects(late.create({ now: () => clock, onDispatchStart: () => { clock = now + 60000; } })
    .sendPrepared(intent(), { reviewedBalanceAtomic: balance }), { message: 'personal_company_intent_expired' });
  assert.equal(late.sends().length, 0);
});

test('cancellation before broadcast, including a synchronous signing-state callback, cannot prompt or send later', async () => {
  const before = new AbortController(); before.abort();
  const mock = fixture();
  await assert.rejects(mock.create().sendPrepared(intent(), { signal: before.signal, reviewedBalanceAtomic: balance }), { name: 'AbortError' });
  assert.equal(mock.calls.length, 0);
  const signal = new AbortController();
  const during = fixture();
  const controller = during.create({ onStateChange: state => { if (state.phase === 'signing') signal.abort(); } });
  await assert.rejects(controller.sendPrepared(intent(), { signal: signal.signal, reviewedBalanceAtomic: balance }), { name: 'AbortError' });
  assert.equal(during.sends().length, 0);
  assert.equal(controller.snapshot().transactionMayExist, false);
});

test('an aborted non-cooperative read has no late continuation into a signature', async () => {
  const signal = new AbortController();
  const pending = deferred();
  const mock = fixture({ hooks: { eth_estimateGas: () => pending.promise } });
  const operation = mock.create().sendPrepared(intent(), { signal: signal.signal, reviewedBalanceAtomic: balance });
  while (!mock.calls.some(call => call.method === 'eth_estimateGas')) await setImmediate();
  signal.abort();
  await assert.rejects(operation, { name: 'AbortError' });
  pending.resolve('0xc350'); await setImmediate();
  assert.equal(mock.sends().length, 0);
});

test('double clicks and repeated calls after broadcasting never send the same prepared intent twice', async () => {
  const pending = deferred();
  const mock = fixture({ hooks: { eth_sendTransaction: () => pending.promise } });
  const controller = mock.create();
  const first = controller.sendPrepared(intent(), { reviewedBalanceAtomic: balance });
  const second = controller.sendPrepared(intent(), { reviewedBalanceAtomic: balance });
  assert.equal(first, second);
  while (!mock.sends().length) await setImmediate();
  assert.equal(mock.sends().length, 1);
  pending.resolve(hash);
  await first;
  assert.equal((await controller.sendPrepared(intent(), { reviewedBalanceAtomic: balance })).transactionHash, hash);
  assert.equal(mock.sends().length, 1);
});

test('only canonical user rejection allows an explicit retry, never an automatic retry', async () => {
  let attempts = 0;
  const mock = fixture({ hooks: { eth_sendTransaction: () => {
    if (++attempts === 1) throw Object.assign(Error('user rejected'), { code: 4001 });
    return hash;
  } } });
  const controller = mock.create();
  const rejected = await controller.sendPrepared(intent(), { reviewedBalanceAtomic: balance });
  assert.equal(rejected.phase, 'rejected');
  assert.equal(rejected.retryable, true);
  assert.equal(rejected.transactionMayExist, false);
  assert.equal(attempts, 1);
  assert.equal((await controller.sendPrepared(intent(), { reviewedBalanceAtomic: balance })).phase, 'broadcast');
  assert.equal(attempts, 2);
  assert.equal(mock.markers.length, 2);
});

test('unknown errors and malformed hashes are ambiguous and cannot be automatically or manually resubmitted through the controller', async () => {
  for (const send of [() => { throw Object.assign(Error('network lost'), { code: -32000 }); }, () => 'not-a-hash',
    () => { throw Object.assign(Error('not canonical rejection'), { code: 'ACTION_REJECTED' }); }]) {
    const mock = fixture({ hooks: { eth_sendTransaction: send } });
    const controller = mock.create();
    const result = await controller.sendPrepared(intent(), { reviewedBalanceAtomic: balance });
    assert.equal(result.phase, 'ambiguous');
    assert.equal(result.transactionMayExist, true);
    assert.equal(result.retryable, false);
    await controller.sendPrepared(intent(), { reviewedBalanceAtomic: balance });
    assert.equal(mock.sends().length, 1);
  }
});

test('cancelling after wallet dispatch keeps a late hash and invokes registration notification without another transfer', async () => {
  const signal = new AbortController();
  const pending = deferred();
  const mock = fixture({ hooks: { eth_sendTransaction: () => pending.promise } });
  const controller = mock.create();
  const sending = controller.sendPrepared(intent(), { signal: signal.signal, reviewedBalanceAtomic: balance });
  while (!mock.sends().length) await setImmediate();
  signal.abort();
  const cancelled = await sending;
  assert.equal(cancelled.phase, 'ambiguous');
  assert.equal(cancelled.transactionMayExist, true);
  await controller.sendPrepared(intent(), { reviewedBalanceAtomic: balance });
  assert.equal(mock.sends().length, 1);
  pending.resolve(hash); await setImmediate();
  assert.equal(controller.snapshot().phase, 'broadcast');
  assert.equal(controller.snapshot().transactionHash, hash);
  assert.equal(mock.broadcasts[0].transactionHash, hash);
  assert.equal(mock.sends().length, 1);
});

test('a broadcast timeout remains ambiguous but still retains a later result for registry-only retry', async () => {
  const pending = deferred();
  const mock = fixture({ hooks: { eth_sendTransaction: () => pending.promise } });
  const controller = mock.create({ broadcastTimeoutMs: 5, onBroadcast: value => { mock.broadcasts.push(value); throw Error('registry-offline'); } });
  assert.equal((await controller.sendPrepared(intent(), { reviewedBalanceAtomic: balance })).phase, 'ambiguous');
  pending.resolve(hash); await setImmediate();
  assert.equal(controller.snapshot().transactionHash, hash);
  assert.equal(mock.broadcasts.length, 1);
  assert.equal(mock.sends().length, 1);
});

test('a wallet error that already contains a transaction hash must retain it instead of allowing a repeat send', async () => {
  const mock = fixture({ hooks: { eth_sendTransaction: () => { throw Object.assign(Error('late wallet error'), { code: 4001, transactionHash: hash }); } } });
  const controller = mock.create();
  const result = await controller.sendPrepared(intent(), { reviewedBalanceAtomic: balance });
  assert.equal(result.phase, 'broadcast');
  assert.equal(result.transactionHash, hash);
  assert.equal(result.retryable, false);
  await controller.sendPrepared(intent(), { reviewedBalanceAtomic: balance });
  assert.equal(mock.sends().length, 1);
});
