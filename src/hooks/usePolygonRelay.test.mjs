import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import ts from 'typescript';
import * as contract from '../lib/polygon-relay-contract.mjs';
import * as amounts from '../lib/personal-company-payment-values.mjs';
import { personalWalletBalanceSessionKey } from '../lib/personal-wallet-balance-store.mjs';
import { createReownFundingOperation } from '../lib/reown-funding-operation.mjs';
import { FUNDING_UUID } from '../lib/wallet-funding-contract.mjs';
import { isPolygonRelayChain } from '../lib/polygon-relay-chain.mjs';

const wallet = `0x${'1'.repeat(40)}`, otherWallet = `0x${'2'.repeat(40)}`, relayer = `0x${'3'.repeat(40)}`;
const id = '11111111-1111-4111-8111-111111111111', hash = `0x${'4'.repeat(64)}`, blockHash = `0x${'5'.repeat(64)}`;
const signature = `0x${'6'.repeat(130)}`, balanceAtomic = '28433366';
const deferred = () => { let resolve, reject; const promise = new Promise((done, fail) => { resolve = done; reject = fail; }); return { promise, resolve, reject }; };
function payment(patch = {}) {
  const base = { paymentId: id, walletKind: 'personal', executionMode: 'polygon_native_meta_aa', ...amounts.POLYGON_COMPANY_PAYMENT,
    walletAddress: wallet, amountAtomic: balanceAtomic, status: 'prepared', authorizationNonce: '0', authorizationDigest: hash,
    authorizationHasOnchainExpiry: false, relayerAddress: relayer, entryPointAddress: contract.POLYGON_RELAY_ENTRY_POINT,
    createdAt: new Date(Date.now() - 1000).toISOString(), expiresAt: new Date(Date.now() + 600_000).toISOString(),
    userOperationHash: null, transactionHash: null, blockNumber: null, blockHash: null, confirmations: 0, requiredConfirmations: 12,
    confirmedAt: null, failureReason: null, membershipAssignment: 'pending', typedData: null, ...patch };
  if (base.status === 'prepared' && patch.typedData !== null) base.typedData = { domain: contract.POLYGON_RELAY_DOMAIN, primaryType: 'MetaTransaction',
    types: { MetaTransaction: contract.POLYGON_RELAY_META_FIELDS }, message: { nonce: base.authorizationNonce, from: base.walletAddress,
      functionSignature: contract.polygonRelayTransferCall(base.amountAtomic) } };
  assert.ok(contract.polygonRelayView(base), 'test fixture violates relay contract'); return base;
}
const submitted = patch => payment({ status: 'submitted', userOperationHash: hash, transactionHash: hash, ...patch });
const confirmed = patch => payment({ status: 'confirmed', userOperationHash: hash, transactionHash: hash, blockHash,
  blockNumber: '70000000', confirmations: 12, confirmedAt: new Date().toISOString(), ...patch });
function locks() {
  const held = new Set(); return { async request(key, _options, callback) {
    if (held.has(key)) return callback(null); held.add(key);
    try { return await callback({ name: key }); } finally { held.delete(key); }
  } };
}
function clock() {
  let now = 0, id = 0; const timers = new Map();
  return { setTimeout(callback, delay) { const key = ++id; timers.set(key, { callback, at: now + delay }); return key; },
    clearTimeout(key) { timers.delete(key); }, get now() { return now; },
    tick(duration) { now += duration; for (const [key, timer] of [...timers]) if (timer.at <= now && timers.delete(key)) timer.callback(); } };
}

function harness(overrides = {}) {
  const slots = [], effects = [], calls = [], signatures = [], providerCalls = [], storage = overrides.storage || new Map();
  let cursor = 0, dirty = true, current, sourceWallet = wallet, connected = overrides.connected !== false;
  let session = { subject: 'owner-A', email: 'member@example.test' };
  let selectedChain = Object.hasOwn(overrides, 'chainId') ? overrides.chainId : '0x89';
  const localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => { if (overrides.storageFailure) throw Error('quota'); storage.set(key, value); }, removeItem: key => storage.delete(key) };
  const browser = Object.assign(new EventTarget(), { localStorage }), documentRef = Object.assign(new EventTarget(), { visibilityState: 'visible' });
  const provider = { request(input) { providerCalls.push(input); return Promise.resolve(input.method === 'eth_chainId' ? selectedChain
    : input.method === 'eth_accounts' ? [sourceWallet] : signature); } };
  const getProvider = () => provider;
  const reown = () => ({ linkedAddress: sourceWallet, address: sourceWallet, linkStatus: 'linked', isConnected: connected, isLinked: connected,
    getCompanyPaymentProvider: getProvider, connectWallet: async () => calls.push({ action: 'connect' }),
    linkWallet: async () => calls.push({ action: 'link' }), switchCompanyPaymentNetwork: async chainId => calls.push({ action: 'switch', chainId }), ...overrides.reown });
  const changed = (a, b) => !a || !b || a.length !== b.length || a.some((value, index) => !Object.is(value, b[index]));
  const hooks = {
    useRef(value) { const index = cursor++; return slots[index] ??= { current: value }; },
    useState(value) { const index = cursor++, cell = slots[index] ??= { value: typeof value === 'function' ? value() : value };
      cell.set ??= update => { const next = typeof update === 'function' ? update(cell.value) : update; if (!Object.is(next, cell.value)) { cell.value = next; dirty = true; } }; return [cell.value, cell.set]; },
    useCallback(callback, deps) { const index = cursor++, cell = slots[index] ??= {};
      if (changed(cell.deps, deps)) { cell.value = callback; cell.deps = deps; } return cell.value; },
    useMemo(callback, deps) { const index = cursor++, cell = slots[index] ??= {};
      if (changed(cell.deps, deps)) { cell.value = callback(); cell.deps = deps; } return cell.value; },
    useEffect(callback, deps) { const index = cursor++, cell = slots[index] ??= {};
      if (changed(cell.deps, deps)) { cell.deps = deps; effects.push(() => { cell.cleanup?.(); cell.cleanup = callback(); }); } },
  };
  const client = {
    async readPolygonRelayCapabilities(options) { calls.push({ action: 'capabilities' }); return overrides.capabilities ? overrides.capabilities(options) : {
      walletKind: 'personal', executionMode: 'polygon_native_meta_aa', chainId: 137, transferEnabled: true, sponsorship: 'mindbliss', authorizationHasOnchainExpiry: false }; },
    async readPolygonRelayHistory(options) { calls.push({ action: 'history' }); return overrides.history ? overrides.history(options) : { walletKind: 'personal', payments: [] }; },
    async readPolygonRelayStatus(paymentId, options) { calls.push({ action: 'status', paymentId, options }); return overrides.status ? overrides.status(paymentId, options) : payment(); },
    async writePolygonRelay(action, input, options) { calls.push({ action, input, options });
      if (overrides.write) return overrides.write(action, input, options);
      if (action === 'prepare') return payment({ paymentId: input.requestId, amountAtomic: input.amountAtomic, walletAddress: sourceWallet });
      if (action === 'authorize') return payment({ status: 'authorized' });
      if (action === 'abandon') return payment({ status: 'expired', failureReason: 'preparation_abandoned' });
      if (action === 'submit') return submitted(); return confirmed();
    },
  };
  const mocks = { react: hooks, '@/lib/member-session-context': { useMemberSession: () => session },
    '@/lib/wallet-funding-contract.mjs': { FUNDING_UUID },
    '@/lib/personal-wallet-balance-store.mjs': { personalWalletBalanceSessionKey }, '@/lib/personal-company-payment-values.mjs': amounts,
    '@/lib/polygon-relay-contract.mjs': contract, '@/lib/polygon-relay-client.mjs': client,
    '@/lib/polygon-relay-chain.mjs': { isPolygonRelayChain },
    '@/lib/reown-funding-operation.mjs': { createReownFundingOperation: options => createReownFundingOperation({ ...options, ...(overrides.timeoutMs ? { timeoutMs: overrides.timeoutMs } : {}) }) },
    '@/lib/personal-wallet-balance.mjs': { async readPersonalWalletBalances(options) { calls.push({ action: 'balance' });
      return overrides.balance ? overrides.balance(options) : { walletAddress: sourceWallet, balances: [
        { chainId: 1, balanceAtomic: '10000000', nativeBalanceAtomic: '0' }, { chainId: 137, balanceAtomic, nativeBalanceAtomic: '0' }] }; } },
    '@/lib/polygon-relay-signing.mjs': { async signPolygonRelay(dto, sdk, expectedWallet, assertActive) {
      signatures.push(dto); assertActive(); assert.equal(expectedWallet, dto.walletAddress);
      await sdk.request({ method: 'eth_signTypedData_v4', params: [expectedWallet, '{}'] });
      if (overrides.sign) return overrides.sign(dto, sdk, expectedWallet, assertActive);
      assertActive(); return { paymentId: dto.paymentId, signature };
    } },
  };
  const code = ts.transpileModule(readFileSync(new URL('./usePolygonRelay.jsx', import.meta.url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} }, browserNavigator = { locks: overrides.locks || locks() };
  new Function('require', 'module', 'exports', 'window', 'document', 'crypto', 'globalThis', 'Date', 'setTimeout', 'clearTimeout', code)(name => {
    assert.ok(Object.hasOwn(mocks, name), `Unexpected relay dependency: ${name}`); return mocks[name];
  }, module, module.exports, browser, documentRef, { subtle: webcrypto.subtle, randomUUID: () => id }, { navigator: browserNavigator }, overrides.Date || Date,
  overrides.setTimeout || setTimeout, overrides.clearTimeout || clearTimeout);
  function render() { cursor = 0; dirty = false; current = module.exports.usePolygonRelay(reown()); }
  return { get flow() { return current; }, calls, signatures, providerCalls, storage, browser, documentRef,
    chain(value) { selectedChain = value; },
    async flush() { for (let turn = 0, quiet = 0; turn < 80; turn++) {
      if (dirty) render(); while (effects.length) effects.shift()(); await new Promise(resolve => setImmediate(resolve));
      if (dirty || effects.length) quiet = 0; else if (++quiet === 3) return current;
    } assert.fail('Relay hook did not settle'); },
    async session(next, flush = true) { session = next; dirty = true; if (!flush) { render(); return current; } return this.flush(); },
    async wallet(next) { sourceWallet = next; dirty = true; return this.flush(); },
    async connection(next) { connected = next; dirty = true; return this.flush(); },
    unmount() { for (const cell of slots) cell?.cleanup?.(); },
  };
}
const writes = h => h.calls.filter(call => ['prepare', 'authorize', 'submit', 'verify', 'abandon'].includes(call.action));
async function review(h) { await h.flush(); h.flow.setAmount('28.433366'); await h.flush(); await h.flow.review(); await h.flush(); }

test('verification can fence an expired broadcasting lease before an operation hash exists without resubmitting', async t => {
  const broadcasting = payment({ status: 'broadcasting', userOperationHash: null });
  const h = harness({ history: async () => ({ walletKind: 'personal', payments: [broadcasting] }),
    status: async () => broadcasting,
    write: async action => { assert.equal(action, 'verify'); return payment({ status: 'authorized' }); } });
  t.after(() => h.unmount()); await h.flush(); await h.flow.selectHistory(broadcasting); await h.flush();
  await h.flow.verifyPayment(); await h.flush();
  assert.equal(h.flow.payment.status, 'authorized');
  assert.deepEqual(writes(h).map(call => call.action), ['verify']);
  assert.equal(h.signatures.length, 0);
});

test('Polygon MAX is independent from Ethereum, a local review never prepares or signs, and cancelling it remains editable', async t => {
  const h = harness(); t.after(() => h.unmount()); await h.flush();
  assert.equal(h.flow.balanceAtomic, balanceAtomic); assert.equal(h.flow.amount, '28.433366'); assert.deepEqual(writes(h), []);
  await review(h); assert.equal(h.flow.preview.amountAtomic, balanceAtomic); assert.equal(h.flow.preview.chainId, 137);
  assert.equal(h.flow.payment, null); assert.equal(h.flow.stage, 'review'); assert.equal(h.signatures.length, 0);
  h.flow.cancelReview(); await h.flush(); assert.equal(h.flow.stage, 'form'); assert.equal(h.flow.preview, null);
});

test('cancelling a rejected unsigned preparation waits for the exact abandon acknowledgement before unlocking editing', async t => {
  const ack = deferred(); let latest = payment(), notifications = 0;
  const h = harness({ status: async () => latest, history: async () => ({ payments: [latest] }),
    sign: async () => { throw Object.assign(Error('rejected'), { code: 4001 }); },
    write: async (action, input) => {
      if (action === 'prepare') return payment({ paymentId: input.requestId });
      assert.equal(action, 'abandon'); return ack.promise;
    } }); t.after(() => h.unmount());
  // The canonical draft is created only by explicit confirmation, not the local preview.
  await h.flush(); await h.flow.resume(); await h.flush(); await h.flow.confirm(); await h.flush();
  assert.equal(h.flow.stage, 'review'); assert.equal(h.flow.recovery, null);
  h.browser.addEventListener('vp:personal-wallet-balance-changed', () => notifications++);
  const cancelling = h.flow.cancelReview(); await h.flush();
  assert.equal(h.flow.busy, true); assert.equal(h.flow.payment.status, 'prepared');
  assert.deepEqual(writes(h).map(call => call.action), ['prepare', 'abandon']);
  latest = payment({ status: 'expired', failureReason: 'preparation_abandoned' }); ack.resolve(latest); await cancelling; await h.flush();
  assert.equal(h.flow.payment, null); assert.equal(h.flow.preview, null); assert.equal(h.flow.stage, 'form'); assert.equal(h.flow.busy, false);
  assert.equal(h.flow.errorKey, ''); assert.equal(notifications, 1); assert.equal(h.signatures.length, 1);
  h.flow.setAmount('1'); await h.flush(); assert.equal(h.flow.amount, '1');
});

test('cancellation cannot discard accepted or uncertain authorization, and a mismatched abandon ACK cannot unlock a draft', async () => {
  const pending = harness({ write: async (action, input) => {
    if (action === 'prepare') return payment({ paymentId: input.requestId }); throw TypeError('authorization response lost');
  } });
  try {
    await review(pending); await pending.flow.confirm(); await pending.flush();
    assert.equal(pending.flow.recovery.phase, 'ambiguous');
    await pending.flow.cancelReview(); await pending.flow.abandon(); await pending.flush();
    assert.equal(writes(pending).some(call => call.action === 'abandon'), false); assert.ok(pending.flow.payment);
  } finally { pending.unmount(); }
  const invalid = harness({ history: async () => ({ payments: [payment()] }), write: async action => {
    assert.equal(action, 'abandon'); return payment({ status: 'expired', failureReason: 'preparation_abandoned', amountAtomic: '1' });
  } });
  try {
    await invalid.flush(); await invalid.flow.abandon(); await invalid.flush();
    assert.equal(invalid.flow.payment.status, 'prepared'); assert.equal(invalid.flow.stage, 'status');
    assert.equal(invalid.flow.errorKey, 'walletTransfer.invalidAuthorization'); assert.equal(invalid.signatures.length, 0);
  } finally { invalid.unmount(); }
});

test('terminal relay adoption refreshes shared balances once while reconciliation remains read-only and blocks another payment', async t => {
  let latest = payment({ status: 'reconciliation_required', failureReason: 'authorization_nonce_changed' }), notifications = 0;
  const h = harness({ history: async () => ({ payments: [latest] }), status: async () => latest,
    write: async action => { assert.equal(action, 'verify'); return latest; } }); t.after(() => h.unmount());
  h.browser.addEventListener('vp:personal-wallet-balance-changed', () => notifications++);
  await h.flush(); await h.flow.verifyPayment(); await h.flush(); h.flow.newPayment(); await h.flow.confirm(); await h.flush();
  assert.equal(h.flow.payment.status, 'reconciliation_required'); assert.equal(notifications, 0);
  assert.deepEqual(writes(h).map(call => call.action), ['verify']); assert.equal(h.signatures.length, 0);
  latest = confirmed(); await h.flow.verifyPayment(); await h.flush();
  assert.equal(h.flow.payment.status, 'confirmed'); assert.equal(notifications, 1);
  h.flow.refresh(); await h.flush(); await h.flow.selectHistory(latest); await h.flush(); await h.flow.verifyPayment(); await h.flush();
  assert.equal(notifications, 1); assert.equal(h.flow.recovery, null);
});

test('explicit confirmation durably prepares before one typed authorization and one backend submit, without storing any signature', async t => {
  const h = harness(); t.after(() => h.unmount()); await review(h); await h.flow.confirm(); await h.flush();
  assert.deepEqual(writes(h).map(value => value.action), ['prepare', 'authorize', 'submit']);
  assert.deepEqual(writes(h)[0].input, { requestId: id, amountAtomic: balanceAtomic }); assert.equal(h.signatures.length, 1);
  assert.equal(h.flow.payment.status, 'submitted'); assert.equal(h.flow.recovery.phase, 'submitting');
  assert.equal(h.providerCalls.filter(call => call.method === 'eth_signTypedData_v4').length, 1);
  assert.ok(h.providerCalls.every(call => ['eth_chainId', 'eth_accounts', 'eth_signTypedData_v4'].includes(call.method)));
  for (const [key, value] of h.storage) {
    assert.ok(!key.includes('member@example.test')); assert.ok(!value.includes(signature));
    assert.deepEqual(Object.keys(JSON.parse(value)).sort(), ['paymentId', 'phase', 'version', 'walletAddress']);
  }
  await h.flow.confirm(); await h.flush(); assert.equal(h.signatures.length, 1); assert.equal(writes(h).length, 3);
});

test('disabled sponsorship, unavailable recovery storage and immutable status mismatches never reach a wallet prompt', async () => {
  for (const kind of ['disabled', 'storage', 'mismatch']) {
    let allowed = true;
    const h = harness({ storageFailure: kind === 'storage', capabilities: async () => ({ transferEnabled: allowed }),
      status: async () => payment(kind === 'mismatch' ? { amountAtomic: '1000000' } : {}) });
    try {
      await review(h); if (kind === 'disabled') allowed = false;
      await h.flow.confirm(); await h.flush(); assert.equal(h.providerCalls.filter(call => call.method === 'eth_signTypedData_v4').length, 0); assert.equal(writes(h).some(value => value.action === 'authorize'), false);
      assert.ok(h.flow.errorKey);
    } finally { h.unmount(); }
  }
});

test('a rejected typed signature may be explicitly reconfirmed while an unknown authorization cannot be resigned', async () => {
  for (const kind of ['rejected', 'unknown']) {
    const h = harness({ sign: async () => { if (kind === 'rejected') throw Object.assign(Error('private rejection'), { code: 4001 }); return { paymentId: id, signature }; },
      write: async (action, input) => {
        if (action === 'prepare') return payment({ paymentId: input.requestId });
        assert.equal(action, 'authorize'); throw new TypeError('uncertain private transport');
      } });
    try {
      await review(h); await h.flow.confirm(); await h.flush(); const count = h.signatures.length;
      if (kind === 'rejected') { assert.equal(h.flow.recovery, null); assert.equal(h.flow.stage, 'review'); await h.flow.confirm(); await h.flush(); assert.equal(h.signatures.length, count + 1); }
      else { assert.equal(h.flow.recovery.phase, 'ambiguous'); assert.equal(h.flow.errorKey, 'walletTransfer.ambiguous'); await h.flow.confirm(); await h.flush(); assert.equal(h.signatures.length, count); }
      assert.equal(writes(h).some(value => value.action === 'submit'), false);
    } finally { h.unmount(); }
  }
});

test('uncertain submit recovers by canonical status and verification, never by replaying signature or submit', async t => {
  let broadcast = false;
  const h = harness({ status: async () => broadcast ? submitted() : payment(), write: async (action, input) => {
    if (action === 'prepare') return payment({ paymentId: input.requestId });
    if (action === 'authorize') return payment({ status: 'authorized' });
    if (action === 'submit') { broadcast = true; throw new TypeError('lost response'); }
    assert.equal(action, 'verify'); return confirmed();
  } }); t.after(() => h.unmount());
  await review(h); await h.flow.confirm(); await h.flush(); assert.equal(h.flow.recovery.phase, 'ambiguous');
  await h.flow.confirm(); await h.flush(); assert.equal(h.signatures.length, 1);
  await h.flow.verifyPayment(); await h.flush(); assert.equal(h.flow.payment.status, 'confirmed'); assert.equal(h.flow.recovery, null);
  assert.deepEqual(writes(h).map(value => value.action), ['prepare', 'authorize', 'submit', 'verify']); assert.equal(h.signatures.length, 1);
  h.flow.newPayment(); await h.flush(); assert.equal(h.flow.stage, 'form'); assert.equal(h.flow.payment, null);
});

test('a persisted uncertain authorization restores only owner-scoped IDs and can submit an authorized record without another wallet login', async () => {
  const storage = new Map(), a = harness({ storage, write: async (action, input) => {
    if (action === 'prepare') return payment({ paymentId: input.requestId }); throw new TypeError('unknown authorize');
  } });
  await review(a); await a.flow.confirm(); await a.flush(); a.unmount();
  const b = harness({ storage, connected: false, history: async () => ({ payments: [payment({ status: 'authorized' })] }),
    status: async () => payment({ status: 'authorized' }) });
  try {
    await b.flush(); assert.equal(b.flow.payment.status, 'authorized'); assert.equal(b.flow.connected, false);
    assert.equal(b.signatures.length, 0); assert.deepEqual(writes(b), []);
    await b.flow.submitAuthorized(); await b.flush(); assert.deepEqual(writes(b).map(value => value.action), ['submit']); assert.equal(b.signatures.length, 0);
  } finally { b.unmount(); }
});

test('changing owner or SDK account while a signature is pending discards it before authorization', async () => {
  for (const kind of ['owner', 'wallet']) {
    const pending = deferred(), h = harness({ sign: async () => pending.promise });
    try {
      await review(h); const confirmation = h.flow.confirm(); await h.flush(); assert.equal(h.signatures.length, 1);
      if (kind === 'owner') await h.session({ subject: 'owner-B', email: 'member@example.test' }); else await h.wallet(otherWallet);
      pending.resolve({ paymentId: id, signature }); await confirmation; await h.flush();
      assert.equal(writes(h).some(value => value.action === 'authorize'), false); assert.equal(h.flow.payment, null); assert.equal(h.flow.preview, null);
      assert.equal(h.flow.busy, false);
    } finally { h.unmount(); }
  }
});

test('foreground polling verifies one operation at a time, clears terminal guards and pauses hidden pages', async t => {
  const timers = clock(); let settled = false, checks = 0;
  class PollDate extends Date { static now() { return timers.now; } }
  const h = harness({ Date: PollDate, setTimeout: timers.setTimeout, clearTimeout: timers.clearTimeout,
    history: async () => ({ payments: [settled ? confirmed() : submitted()] }), status: async () => submitted(),
    write: async action => { assert.equal(action, 'verify'); checks++; settled = true; return confirmed(); } }); t.after(() => h.unmount());
  await h.flush(); h.documentRef.visibilityState = 'hidden'; h.documentRef.dispatchEvent(new Event('visibilitychange')); timers.tick(24_000); await h.flush(); assert.equal(checks, 0);
  h.documentRef.visibilityState = 'visible'; h.documentRef.dispatchEvent(new Event('visibilitychange')); timers.tick(12_000); await h.flush();
  assert.equal(checks, 1); assert.equal(h.flow.payment.status, 'confirmed'); assert.equal(h.flow.stage, 'status'); assert.equal(h.flow.recovery, null);
  timers.tick(60_000); await h.flush(); assert.equal(checks, 1); assert.equal(h.signatures.length, 0);
});

test('foreign history and late previous-owner replies cannot reveal a payment or revive a signature', async t => {
  const gate = deferred(), h = harness({ history: async () => gate.promise }); t.after(() => h.unmount()); await h.flush();
  await h.session({ subject: 'owner-B', email: 'member@example.test' }); gate.resolve({ payments: [submitted({ walletAddress: otherWallet })] }); await h.flush();
  assert.equal(h.flow.payment, null); assert.deepEqual(h.flow.history, []); assert.equal(h.signatures.length, 0);
  assert.equal(h.flow.errorKey, 'walletTransfer.walletMismatch');
});

test('a read-only Polygon preflight exposes the network switch before creating any draft or signature', async t => {
  const h = harness({ chainId: '0x1' }); t.after(() => h.unmount()); await review(h);
  assert.equal(h.flow.preview, null); assert.equal(h.flow.errorKey, 'walletTransfer.networkMismatch');
  assert.deepEqual(writes(h), []); assert.equal(h.signatures.length, 0);
  assert.ok(h.providerCalls.every(call => ['eth_chainId', 'eth_accounts'].includes(call.method)));
  await h.flow.switchNetwork(); await h.flush(); assert.deepEqual(h.calls.find(call => call.action === 'switch'), { action: 'switch', chainId: 137 });
  assert.equal(h.flow.errorKey, 'walletTransfer.networkMismatch', 'a swallowed SDK failure cannot report a successful switch');
  assert.deepEqual(writes(h), []); assert.equal(h.signatures.length, 0);
});

test('embedded numeric and canonical Polygon identities can review without preparing or signing', async () => {
  for (const chainId of [137, '137', '0x89', 'eip155:137']) {
    const h = harness({ chainId });
    try {
      await review(h); assert.equal(h.flow.stage, 'review'); assert.equal(h.flow.errorKey, '');
      assert.equal(h.flow.preview.chainId, 137); assert.deepEqual(writes(h), []); assert.equal(h.signatures.length, 0);
      assert.ok(h.providerCalls.every(call => ['eth_chainId', 'eth_accounts'].includes(call.method)));
    } finally { h.unmount(); }
  }
});

test('network switching requires the current provider to acknowledge Polygon before Review can proceed', async t => {
  const h = harness({ chainId: '0x1', reown: { switchCompanyPaymentNetwork: async chainId => {
    assert.equal(chainId, 137); h.chain(137);
  } } }); t.after(() => h.unmount());
  await review(h); assert.equal(h.flow.errorKey, 'walletTransfer.networkMismatch');
  await h.flow.switchNetwork(); await h.flush(); assert.equal(h.flow.errorKey, '');
  assert.equal(h.flow.preview, null); assert.deepEqual(writes(h), []); assert.equal(h.signatures.length, 0);
  await h.flow.review(); await h.flush(); assert.equal(h.flow.stage, 'review');
  assert.deepEqual(writes(h), []); assert.equal(h.signatures.length, 0);
});

test('invalid or coercible provider chain identities stop Review without preparing or signing', async () => {
  for (const chainId of [1, '0x1', NaN, Infinity, true, 137n, '0137', '0x089', '137 ', 'eip155:1', ['137'],
    { valueOf() { throw new Error('chain IDs must not be coerced'); } }]) {
    const h = harness({ chainId });
    try {
      await review(h); assert.equal(h.flow.preview, null); assert.equal(h.flow.errorKey, 'walletTransfer.networkMismatch');
      assert.deepEqual(writes(h), []); assert.equal(h.signatures.length, 0);
    } finally { h.unmount(); }
  }
});

test('a wallet-wide lock excludes another tab before the first signature marker exists', async () => {
  const storage = new Map(), sharedLocks = locks(), prepared = deferred();
  const a = harness({ storage, locks: sharedLocks, write: async (action, input) => action === 'prepare' ? prepared.promise
    : action === 'authorize' ? payment({ status: 'authorized' }) : submitted() });
  const b = harness({ storage, locks: sharedLocks });
  try {
    await review(a); await review(b); const sending = a.flow.confirm(); await a.flush();
    assert.equal(writes(a).length, 1); assert.equal(a.signatures.length, 0);
    await b.flow.confirm(); await b.flush(); assert.deepEqual(writes(b), []); assert.equal(b.signatures.length, 0);
    assert.equal(b.flow.errorKey, 'walletTransfer.pending');
    prepared.resolve(payment()); await sending; await a.flush(); assert.equal(a.signatures.length, 1);
    await b.flow.confirm(); await b.flush(); assert.equal(b.signatures.length, 0);
  } finally { a.unmount(); b.unmount(); }
});

test('polling is single-flight, aborts when hidden or logged out, and cannot extend its fifteen-minute window', async () => {
  const timers = clock(), pending = deferred(); let checks = 0;
  class PollDate extends Date { static now() { return timers.now; } }
  const h = harness({ Date: PollDate, setTimeout: timers.setTimeout, clearTimeout: timers.clearTimeout,
    history: async () => ({ payments: [submitted()] }), status: async () => submitted(),
    write: async action => { assert.equal(action, 'verify'); checks++; return pending.promise; } });
  try {
    await h.flush(); timers.tick(12_000); await h.flush(); assert.equal(checks, 1);
    const request = writes(h)[0]; timers.tick(24_000); await h.flush(); assert.equal(checks, 1);
    h.documentRef.visibilityState = 'hidden'; h.documentRef.dispatchEvent(new Event('visibilitychange')); await h.flush();
    assert.equal(request.options.signal.aborted, true); assert.equal(h.flow.busy, false);
    await h.session(null); pending.resolve(confirmed()); await h.flush();
    assert.equal(h.flow.payment, null); assert.equal(h.flow.balanceAtomic, null); assert.equal(h.signatures.length, 0);
  } finally { h.unmount(); }
  const boundedClock = clock(); let queries = 0;
  class BoundedDate extends Date { static now() { return boundedClock.now; } }
  const bounded = harness({ Date: BoundedDate, setTimeout: boundedClock.setTimeout, clearTimeout: boundedClock.clearTimeout,
    history: async () => ({ payments: [submitted()] }), status: async () => submitted(),
    write: async () => { queries++; return submitted(); } });
  try {
    await bounded.flush(); boundedClock.tick(12_000); await bounded.flush(); assert.equal(queries, 1);
    boundedClock.tick(15 * 60_000); await bounded.flush(); assert.equal(queries, 1);
    boundedClock.tick(12_000); await bounded.flush(); assert.equal(queries, 1);
  } finally { bounded.unmount(); }
});
