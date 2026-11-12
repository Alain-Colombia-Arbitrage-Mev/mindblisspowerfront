import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import ts from 'typescript';
import * as contract from '../lib/polygon-relay-contract.mjs';
import * as amounts from '../lib/personal-company-payment-values.mjs';
import { createPersonalWalletBalanceStore, EMPTY_PERSONAL_BALANCE, personalWalletBalanceSessionKey } from '../lib/personal-wallet-balance-store.mjs';
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
  const slots = [], effects = [], calls = [], signatures = [], providerCalls = [], storage = overrides.storage || new Map(), digests = new Set();
  let cursor = 0, dirty = true, current, sourceWallet = wallet, connected = overrides.connected !== false;
  let sdkAddress = sourceWallet, balanceTime = 0;
  let session = { subject: 'owner-A', email: 'member@example.test' };
  let selectedChain = Object.hasOwn(overrides, 'chainId') ? overrides.chainId : '0x89';
  const localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => { if (overrides.storageFailure) throw Error('quota'); storage.set(key, value); }, removeItem: key => storage.delete(key) };
  const browser = Object.assign(new EventTarget(), { localStorage }), documentRef = Object.assign(new EventTarget(), { visibilityState: 'visible' });
  const provider = { request(input) { providerCalls.push(input); return Promise.resolve(input.method === 'eth_chainId' ? selectedChain
    : input.method === 'eth_accounts' ? [sdkAddress] : signature); } };
  const getProvider = () => provider;
  const reown = () => ({ linkedAddress: sourceWallet, address: sdkAddress, linkStatus: 'linked', isConnected: connected, isLinked: connected && sdkAddress === sourceWallet,
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
    useSyncExternalStore(subscribe, getSnapshot) {
      hooks.useEffect(() => subscribe(() => { dirty = true; }), [subscribe]);
      return getSnapshot();
    },
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
  const readBalance = async options => {
    calls.push({ action: 'balance' });
    return overrides.balance ? overrides.balance(options) : { walletAddress: sourceWallet, balances: [
      { chainId: 1, balanceAtomic: '10000000', nativeBalanceAtomic: '0' }, { chainId: 137, balanceAtomic, nativeBalanceAtomic: '0' }] };
  };
  const sharedBalances = overrides.balanceStore || createPersonalWalletBalanceStore({
    read: async options => {
      const value = await readBalance(options);
      return { ...value, balances: value.balances.map(item => ({ ...item, network: item.chainId === 137 ? 'polygon' : 'ethereum',
        observedAt: item.observedAt ?? '2026-11-11T12:00:00Z' })) };
    }, now: () => balanceTime, windowTarget: browser, documentTarget: documentRef, retryDelays: [],
  });
  const balanceHooks = { exports: {} };
  const balanceCode = ts.transpileModule(readFileSync(new URL('./usePersonalWalletBalance.jsx', import.meta.url), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  new Function('require', 'module', 'exports', balanceCode)(name => {
    if (name === 'react') return hooks;
    if (name === '@/lib/member-session-context') return { useMemberSession: () => session };
    if (name === '@/lib/personal-wallet-balance-store.mjs') return { EMPTY_PERSONAL_BALANCE, personalWalletBalanceSessionKey, personalWalletBalanceStore: sharedBalances };
    assert.fail(`Unexpected shared balance dependency: ${name}`);
  }, balanceHooks, balanceHooks.exports);
  const mocks = { react: hooks, '@/lib/member-session-context': { useMemberSession: () => session },
    '@/hooks/usePersonalWalletBalance': balanceHooks.exports,
    '@/lib/wallet-funding-contract.mjs': { FUNDING_UUID },
    '@/lib/personal-wallet-balance-store.mjs': { personalWalletBalanceSessionKey }, '@/lib/personal-company-payment-values.mjs': amounts,
    '@/lib/polygon-relay-contract.mjs': contract, '@/lib/polygon-relay-client.mjs': client,
    '@/lib/polygon-relay-chain.mjs': { isPolygonRelayChain },
    '@/lib/reown-funding-operation.mjs': { createReownFundingOperation: options => createReownFundingOperation({ ...options, ...(overrides.timeoutMs ? { timeoutMs: overrides.timeoutMs } : {}) }) },
    '@/lib/personal-wallet-balance.mjs': { readPersonalWalletBalances: readBalance },
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
  }, module, module.exports, browser, documentRef, { subtle: { digest(algorithm, input) {
    const pending = webcrypto.subtle.digest(algorithm, input); digests.add(pending); void pending.finally(() => digests.delete(pending)); return pending;
  } }, randomUUID: () => id }, { navigator: browserNavigator }, overrides.Date || Date,
  overrides.setTimeout || setTimeout, overrides.clearTimeout || clearTimeout);
  function render() { cursor = 0; dirty = false; current = module.exports.usePolygonRelay(reown()); }
  return { get flow() { return current; }, calls, signatures, providerCalls, storage, browser, documentRef, sharedBalances,
    get ownerKey() { return personalWalletBalanceSessionKey(session); },
    advanceBalanceTime(duration) { balanceTime += duration; },
    async balanceEvents() { await new Promise(resolve => setTimeout(resolve, 275)); return this.flush(); },
    chain(value) { selectedChain = value; },
    async flush() { for (let turn = 0, quiet = 0; turn < 80; turn++) {
      if (dirty) render(); while (effects.length) effects.shift()(); await new Promise(resolve => setImmediate(resolve));
      if (digests.size) { await Promise.all([...digests]); quiet = 0; continue; }
      if (dirty || effects.length) quiet = 0; else if (++quiet === 3) return current;
    } assert.fail('Relay hook did not settle'); },
    async session(next, flush = true) { session = next; dirty = true; if (!flush) { render(); return current; } return this.flush(); },
    async wallet(next) { sourceWallet = next; sdkAddress = next; dirty = true; return this.flush(); },
    async sdkAccount(next) { sdkAddress = next; dirty = true; return this.flush(); },
    async connection(next) { connected = next; dirty = true; return this.flush(); },
    unmount() { for (const cell of slots) cell?.cleanup?.(); },
  };
}
const writes = h => h.calls.filter(call => ['prepare', 'authorize', 'submit', 'verify', 'abandon'].includes(call.action));
async function review(h) { await h.flush(); h.flow.setAmount('28.433366'); await h.flush(); await h.flow.review(); await h.flush(); }

test('an interrupted binding lookup settles the balance spinner without accepting a late read from that lookup', async () => {
  for (const linkStatus of ['loading', 'error']) {
    const pending = deferred(), reown = {}, signals = []; let reads = 0;
    const snapshot = () => ({ walletAddress: wallet, balances: [{ chainId: 137, balanceAtomic, nativeBalanceAtomic: '0' }] });
    const h = harness({ reown, balance: async options => {
      signals.push(options.signal); return ++reads === 1 ? pending.promise : snapshot();
    } });
    try {
      await h.flush(); assert.equal(h.flow.loadingBalance, true); assert.equal(reads, 1);
      reown.linkStatus = linkStatus;
      await h.connection(false);
      assert.equal(signals[0].aborted, true);
      assert.equal(h.flow.verified, false); assert.equal(h.flow.loadingBalance, false);
      pending.resolve(snapshot()); await h.flush();
      assert.equal(h.flow.balanceAtomic, null); assert.equal(h.flow.loadingBalance, false);
      reown.linkStatus = 'linked';
      await h.connection(true);
      assert.equal(h.flow.balanceAtomic, balanceAtomic); assert.equal(h.flow.loadingBalance, false);
      assert.deepEqual(writes(h), []); assert.equal(h.signatures.length, 0);
    } finally { h.unmount(); }
  }
});

test('focus and visibility bursts share the in-flight balance read without queuing a duplicate or signing', async t => {
  const pending = deferred(), signals = []; let reads = 0;
  const snapshot = amount => ({ walletAddress: wallet, balances: [{ chainId: 137, balanceAtomic: amount, nativeBalanceAtomic: '0' }] });
  const h = harness({ balance: async options => {
    signals.push(options.signal); reads++;
    return reads === 2 ? pending.promise : snapshot(reads === 1 ? balanceAtomic : '26000000');
  } }); t.after(() => h.unmount());
  await h.flush(); assert.equal(h.flow.balanceAtomic, balanceAtomic);
  h.advanceBalanceTime(6000); h.browser.dispatchEvent(new Event('focus')); await h.balanceEvents();
  assert.equal(reads, 2); assert.equal(h.flow.loadingBalance, true); assert.equal(h.flow.refreshingBalance, true);
  for (let event = 0; event < 4; event++) {
    h.browser.dispatchEvent(new Event('focus')); h.browser.dispatchEvent(new Event('pageshow'));
    h.documentRef.dispatchEvent(new Event('visibilitychange')); await h.flush();
  }
  await h.balanceEvents(); assert.equal(reads, 2); assert.equal(signals[1].aborted, false);
  assert.equal(h.flow.balanceAtomic, balanceAtomic);
  pending.resolve(snapshot('27000000')); await h.flush();
  assert.equal(reads, 2); assert.equal(h.flow.balanceAtomic, '27000000');
  assert.equal(h.flow.loadingBalance, false); assert.equal(h.flow.refreshingBalance, false);
  assert.equal(h.flow.amount, '27'); assert.deepEqual(writes(h), []); assert.equal(h.signatures.length, 0);
});

test('sidebar, payment consumers and route remounts share one owner-bound passive balance read', async () => {
  const first = harness(); let second, remounted; await first.flush();
  const stopSidebar = first.sharedBalances.subscribe(first.ownerKey, () => {});
  try {
    second = harness({ balanceStore: first.sharedBalances }); await second.flush();
    assert.equal(first.calls.filter(call => call.action === 'balance').length, 1);
    assert.equal(second.calls.filter(call => call.action === 'balance').length, 0);
    assert.equal(first.flow.balanceAtomic, balanceAtomic); assert.equal(second.flow.balanceAtomic, balanceAtomic);
    first.unmount(); second.unmount();
    remounted = harness({ balanceStore: first.sharedBalances }); await remounted.flush();
    assert.equal(remounted.flow.balanceAtomic, balanceAtomic);
    assert.equal(first.calls.filter(call => call.action === 'balance').length, 1, 'Sidebar keeps the same fresh owner snapshot across route remounts');
    assert.equal(remounted.calls.filter(call => call.action === 'balance').length, 0);
    for (const view of [first, second, remounted]) {
      assert.deepEqual(writes(view), []); assert.equal(view.signatures.length, 0); assert.equal(view.providerCalls.length, 0);
    }
  } finally { first.unmount(); second?.unmount(); remounted?.unmount(); stopSidebar(); }
});

test('a different owner cannot inherit the shared balance snapshot even when a former subscriber remains', async t => {
  let latest = balanceAtomic;
  const h = harness({ balance: async () => ({ walletAddress: wallet, balances: [{ chainId: 137, balanceAtomic: latest, nativeBalanceAtomic: '0' }] }) });
  await h.flush(); const former = h.ownerKey, stopFormer = h.sharedBalances.subscribe(former, () => {});
  t.after(() => { h.unmount(); stopFormer(); }); latest = '5000000';
  await h.session({ subject: 'owner-B', email: 'second@example.test' }, false);
  assert.equal(h.flow.balanceAtomic, null, 'The new owner never sees the previous snapshot while its read is pending');
  await h.flush(); assert.equal(h.flow.balanceAtomic, latest);
  assert.equal(h.sharedBalances.get(former, 'polygon').balanceAtomic, balanceAtomic);
  assert.equal(h.calls.filter(call => call.action === 'balance').length, 2);
  assert.deepEqual(writes(h), []); assert.equal(h.signatures.length, 0);
});

test('an unlinked member does not subscribe or request a passive balance from the payment form', async t => {
  const h = harness({ reown: { linkedAddress: '', linkStatus: 'unlinked', isConnected: false, isLinked: false } });
  t.after(() => h.unmount()); await h.flush();
  for (let event = 0; event < 10; event++) {
    h.browser.dispatchEvent(new Event('focus')); h.documentRef.dispatchEvent(new Event('visibilitychange'));
    await h.session({ subject: 'owner-A', email: 'member@example.test' });
  }
  await h.balanceEvents();
  assert.deepEqual(h.calls, []); assert.equal(h.flow.balanceAtomic, null);
  assert.equal(h.signatures.length, 0); assert.equal(h.providerCalls.length, 0);
});

test('explicit refresh recovers a failed binding read without connecting, linking or signing a wallet', async t => {
  let lookups = 0;
  const reown = { linkStatus: 'error', async refreshLink() { lookups++; reown.linkStatus = 'linked'; } };
  const h = harness({ reown }); t.after(() => h.unmount());
  await h.flush(); assert.equal(h.flow.verified, false); assert.equal(h.flow.loadingBalance, false);
  assert.equal(h.calls.filter(call => call.action === 'balance').length, 0);
  await h.flow.refresh(); await h.flush();
  assert.equal(lookups, 1); assert.equal(h.flow.verified, true); assert.equal(h.flow.balanceAtomic, balanceAtomic);
  assert.equal(h.flow.loadingBalance, false); assert.equal(h.flow.busy, false);
  assert.equal(h.calls.filter(call => ['connect', 'link'].includes(call.action)).length, 0);
  assert.deepEqual(writes(h), []); assert.equal(h.signatures.length, 0);
});

test('wallet connection deadlines report reconnection trouble without claiming an uncertain payment or ending the app session', async () => {
  for (const source of ['scope', 'sdk', 'native']) {
    const late = deferred(); let connections = 0;
    const h = harness({ connected: false, timeoutMs: 100, reown: { connectWallet() {
      connections++;
      if (source === 'scope') return late.promise;
      throw source === 'sdk' ? Object.assign(new Error('wallet_connection_timeout'), { name: 'TimeoutError' })
        : new DOMException('Synthetic connection deadline', 'TimeoutError');
    } } });
    try {
      await h.flush(); await h.flow.connect(); await h.flush();
      assert.equal(connections, 1); assert.equal(h.flow.errorKey, 'recharge.providerConnection');
      assert.equal(h.flow.verified, true, 'The canonical wallet binding and app session are still valid');
      assert.equal(h.flow.busy, false); assert.equal(h.flow.stage, 'form');
      assert.equal(h.flow.payment, null); assert.equal(h.flow.preview, null); assert.equal(h.flow.recovery, null);
      assert.deepEqual(writes(h), []); assert.equal(h.signatures.length, 0); assert.equal(h.providerCalls.length, 0);
      assert.equal(h.storage.size, 0);
      late.resolve({ connected: true }); await h.flush();
      assert.equal(h.flow.errorKey, 'recharge.providerConnection'); assert.equal(h.flow.payment, null);
    } finally { h.unmount(); }
  }
});

test('a submit deadline after a signed authorization remains ambiguous and cannot turn into a reconnect-only message', async t => {
  const late = deferred();
  const h = harness({ timeoutMs: 100, write: async (action, input) => {
    if (action === 'prepare') return payment({ paymentId: input.requestId });
    if (action === 'authorize') return payment({ status: 'authorized' });
    assert.equal(action, 'submit'); return late.promise;
  } }); t.after(() => h.unmount());
  await review(h); await h.flow.confirm(); await h.flush();
  assert.equal(h.flow.errorKey, 'walletTransfer.ambiguous'); assert.equal(h.flow.busy, false);
  assert.equal(h.flow.recovery.phase, 'ambiguous'); assert.equal(h.flow.payment.paymentId, id);
  assert.equal(h.signatures.length, 1);
  assert.deepEqual(writes(h).map(call => call.action), ['prepare', 'authorize', 'submit']);
  await h.flow.confirm(); await h.flush();
  assert.equal(h.signatures.length, 1); assert.equal(writes(h).filter(call => call.action === 'submit').length, 1);
  late.resolve(submitted()); await h.flush();
  assert.equal(h.flow.errorKey, 'walletTransfer.ambiguous'); assert.equal(h.flow.recovery.phase, 'ambiguous');
});

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

test('returning to the tab refreshes the Polygon balance and unedited maximum without touching Ethereum or opening a payment', async t => {
  let latest = balanceAtomic;
  const h = harness({ balance: async () => ({ walletAddress: wallet, balances: [
    { chainId: 1, balanceAtomic: '999000000', nativeBalanceAtomic: '0' }, { chainId: 137, balanceAtomic: latest, nativeBalanceAtomic: '0' },
  ] }) }); t.after(() => h.unmount()); await h.flush();
  assert.equal(h.flow.amount, '28.433366');
  latest = '27433366'; h.documentRef.visibilityState = 'hidden';
  h.browser.dispatchEvent(new Event('vp:personal-wallet-balance-changed')); await h.flush();
  assert.equal(h.flow.balanceAtomic, balanceAtomic);
  h.documentRef.visibilityState = 'visible'; h.documentRef.dispatchEvent(new Event('visibilitychange')); await h.balanceEvents();
  assert.equal(h.flow.balanceAtomic, '27433366'); assert.equal(h.flow.amount, '27.433366');
  assert.equal(h.flow.stage, 'form'); assert.deepEqual(writes(h), []); assert.equal(h.signatures.length, 0);
});

test('focus and balance events preserve edited amounts and the exact review while exposing a fresh maximum', async t => {
  let latest = balanceAtomic;
  const h = harness({ balance: async () => ({ walletAddress: wallet, balances: [{ chainId: 137, balanceAtomic: latest, nativeBalanceAtomic: '0' }] }) });
  t.after(() => h.unmount()); await h.flush(); h.flow.setAmount('1'); await h.flush();
  await h.flow.review(); await h.flush(); const preview = h.flow.preview;
  latest = '27433366'; h.advanceBalanceTime(6000); h.browser.dispatchEvent(new Event('focus')); await h.balanceEvents();
  assert.equal(h.flow.balanceAtomic, latest); assert.equal(h.flow.amount, '1'); assert.equal(h.flow.preview, preview); assert.equal(h.flow.stage, 'review');
  await h.flow.cancelReview(); await h.flush(); h.flow.setAmount('28.433366'); await h.flush();
  latest = '26433366'; h.browser.dispatchEvent(new Event('vp:personal-wallet-balance-changed')); await h.balanceEvents();
  assert.equal(h.flow.balanceAtomic, latest); assert.equal(h.flow.amount, '28.433366', 'an edited amount must not silently shrink');
  // The same explicit Max action as the form uses the current Polygon snapshot.
  h.flow.setAmount(amounts.formatPersonalCompanyPaymentAmount(h.flow.balanceAtomic)); await h.flush();
  assert.equal(h.flow.amount, '26.433366'); assert.deepEqual(writes(h), []); assert.equal(h.signatures.length, 0);
});

test('a fresh balance discovered during Review updates the displayed maximum and requires explicit review again', async t => {
  let latest = balanceAtomic;
  const h = harness({ balance: async () => ({ walletAddress: wallet, balances: [{ chainId: 137, balanceAtomic: latest, nativeBalanceAtomic: '0' }] }) });
  t.after(() => h.unmount()); await h.flush(); latest = '27433366';
  await h.flow.review(); await h.flush();
  assert.equal(h.flow.balanceAtomic, latest); assert.equal(h.flow.amount, '27.433366'); assert.equal(h.flow.preview, null);
  await h.flow.review(); await h.flush(); assert.equal(h.flow.preview.amountAtomic, latest);
  assert.deepEqual(writes(h), []); assert.equal(h.signatures.length, 0);
});

test('one partial Polygon RPC failure during review recovers with exactly one read-only retry', async () => {
  for (const partial of [[], [{ chainId: 1, balanceAtomic: '10000000', nativeBalanceAtomic: '0' }],
    [{ chainId: 137, balanceAtomic: null, nativeBalanceAtomic: null, error: 'company_payment_rpc_unavailable' }],
    [{ chainId: 137, balanceAtomic: null, nativeBalanceAtomic: '0' }]]) {
    let reads = 0;
    const good = [{ chainId: 137, balanceAtomic, nativeBalanceAtomic: '0' }];
    const h = harness({ balance: async () => ({ walletAddress: wallet, balances: ++reads === 2 ? partial : good }) });
    try {
      await h.flush(); h.flow.setAmount('1'); await h.flush();
      await h.flow.review(); await h.flush();
      assert.equal(reads, 3); assert.equal(h.flow.errorKey, '');
      assert.equal(h.flow.stage, 'review'); assert.equal(h.flow.preview.amountAtomic, '1000000'); assert.equal(h.flow.payment, null);
      assert.equal(h.flow.balanceAtomic, balanceAtomic); assert.equal(h.flow.amount, '1'); assert.equal(h.flow.busy, false);
      assert.deepEqual(writes(h), []); assert.equal(h.signatures.length, 0);
    } finally { h.unmount(); }
  }
});

test('two partial failures report unavailable without inventing insufficient funds and a later explicit review can recover', async t => {
  let reads = 0;
  const snapshot = () => ({ walletAddress: wallet, balances: [{ chainId: 137, balanceAtomic, nativeBalanceAtomic: '0' }] });
  const h = harness({ balance: async () => ++reads === 2 || reads === 3 ? { walletAddress: wallet,
    balances: [{ chainId: 137, balanceAtomic: null, nativeBalanceAtomic: null, error: 'company_payment_rpc_unavailable' }] } : snapshot() }); t.after(() => h.unmount());
  await h.flush(); h.flow.setAmount('1'); await h.flush(); await h.flow.review(); await h.flush();
  assert.equal(reads, 3); assert.equal(h.flow.errorKey, 'walletTransfer.unavailable'); assert.equal(h.flow.stage, 'form');
  assert.equal(h.flow.preview, null); assert.equal(h.flow.payment, null); assert.equal(h.flow.balanceAtomic, balanceAtomic); assert.equal(h.flow.amount, '1');
  assert.deepEqual(writes(h), []); assert.equal(h.signatures.length, 0);
  await h.flow.review(); await h.flush();
  assert.equal(reads, 4); assert.equal(h.flow.stage, 'review'); assert.equal(h.flow.preview.amountAtomic, '1000000');
  assert.deepEqual(writes(h), []); assert.equal(h.signatures.length, 0);
});

test('only an exact chain RPC error retries; auth, rate limits and malformed response failures never do', async () => {
  for (const error of ['company_payment_rpc_unavailable', 'unauthenticated', 'polygon_relay_rate_limited', 'company_payment_unavailable']) {
    let reads = 0;
    const h = harness({ balance: async () => {
      if (++reads === 2) throw new Error(error);
      return { walletAddress: wallet, balances: [{ chainId: 137, balanceAtomic, nativeBalanceAtomic: '0' }] };
    } });
    try {
      await h.flush(); h.flow.setAmount('1'); await h.flush(); await h.flow.review(); await h.flush();
      assert.equal(reads, error === 'company_payment_rpc_unavailable' ? 3 : 2);
      assert.equal(h.flow.stage, error === 'company_payment_rpc_unavailable' ? 'review' : 'form');
      assert.equal(Boolean(h.flow.preview), error === 'company_payment_rpc_unavailable');
      assert.deepEqual(writes(h), []); assert.equal(h.signatures.length, 0);
    } finally { h.unmount(); }
  }
});

test('losing the live signer during a pending failed read prevents its retry and any preview', async t => {
  const pending = deferred(); let reads = 0;
  const h = harness({ balance: async () => ++reads === 2 ? pending.promise : { walletAddress: wallet,
    balances: [{ chainId: 137, balanceAtomic, nativeBalanceAtomic: '0' }] } }); t.after(() => h.unmount());
  await h.flush(); h.flow.setAmount('1'); await h.flush();
  const reviewing = h.flow.review(); await h.flush(); assert.equal(reads, 2);
  await h.connection(false);
  pending.resolve({ walletAddress: wallet, balances: [{ chainId: 137, balanceAtomic: null, nativeBalanceAtomic: null,
    error: 'company_payment_rpc_unavailable' }] });
  await reviewing; await h.flush();
  assert.equal(reads, 2); assert.equal(h.flow.stage, 'form'); assert.equal(h.flow.preview, null); assert.equal(h.flow.busy, false);
  assert.deepEqual(writes(h), []); assert.equal(h.signatures.length, 0);
});

test('a changed Polygon balance requires another review and only a genuinely excessive edited amount reports insufficient funds', async () => {
  for (const latest of ['30000000', '20000000', '500000']) {
    let reads = 0;
    const h = harness({ balance: async () => ({ walletAddress: wallet, balances: [{ chainId: 137,
      balanceAtomic: ++reads === 1 ? balanceAtomic : latest, nativeBalanceAtomic: '0' }] }) });
    try {
      await h.flush(); h.flow.setAmount('1'); await h.flush();
      await h.flow.review(); await h.flush();
      assert.equal(h.flow.balanceAtomic, latest); assert.equal(h.flow.amount, '1'); assert.equal(h.flow.preview, null);
      assert.equal(h.flow.stage, 'form');
      assert.equal(h.flow.errorKey, latest === '500000' ? 'walletTransfer.insufficientBalance' : 'companyPayment.balanceChanged');
      assert.deepEqual(writes(h), []); assert.equal(h.signatures.length, 0);
      if (latest === '500000') { h.flow.setAmount('0.5'); await h.flush(); }
      await h.flow.review(); await h.flush();
      assert.equal(h.flow.stage, 'review'); assert.equal(h.flow.preview.amountAtomic, latest === '500000' ? latest : '1000000');
      assert.deepEqual(writes(h), []); assert.equal(h.signatures.length, 0);
    } finally { h.unmount(); }
  }
});

test('a fresh balance response from another wallet cannot be classified as funds or enter review', async t => {
  let reads = 0;
  const h = harness({ balance: async () => ({ walletAddress: ++reads === 1 ? wallet : otherWallet,
    balances: [{ chainId: 137, balanceAtomic, nativeBalanceAtomic: '0' }] }) }); t.after(() => h.unmount());
  await h.flush(); h.flow.setAmount('1'); await h.flush(); await h.flow.review(); await h.flush();
  assert.equal(h.flow.errorKey, 'walletTransfer.walletMismatch'); assert.equal(h.flow.preview, null); assert.equal(h.flow.stage, 'form');
  assert.equal(h.flow.balanceAtomic, balanceAtomic); assert.deepEqual(writes(h), []); assert.equal(h.signatures.length, 0);
});

test('a confirmed payment refreshes its balance before another maximum can be prepared', async t => {
  let latest = balanceAtomic;
  const h = harness({ history: async () => ({ payments: [submitted()] }), status: async () => submitted(),
    balance: async () => ({ walletAddress: wallet, balances: [{ chainId: 137, balanceAtomic: latest, nativeBalanceAtomic: '0' }] }),
    write: async action => { assert.equal(action, 'verify'); latest = '27433366'; return confirmed(); } });
  t.after(() => h.unmount()); await h.flush(); await h.flow.verifyPayment(); await h.balanceEvents();
  assert.equal(h.flow.payment.status, 'confirmed'); assert.equal(h.flow.balanceAtomic, '27433366');
  h.flow.newPayment(); await h.flush(); assert.equal(h.flow.amount, '27.433366');
  assert.deepEqual(writes(h).map(value => value.action), ['verify']); assert.equal(h.signatures.length, 0);
});

test('a late focus balance reply cannot overwrite the next owner snapshot', async t => {
  const pending = deferred(); let reads = 0;
  const h = harness({ balance: async () => {
    reads++; if (reads === 2) return pending.promise;
    return { walletAddress: wallet, balances: [{ chainId: 137, balanceAtomic: reads === 1 ? balanceAtomic : '5000000', nativeBalanceAtomic: '0' }] };
  } }); t.after(() => h.unmount()); await h.flush(); h.advanceBalanceTime(6000); h.browser.dispatchEvent(new Event('focus')); await h.balanceEvents();
  await h.session({ subject: 'owner-B', email: 'second@example.test' });
  assert.equal(h.flow.balanceAtomic, '5000000'); assert.equal(h.flow.amount, '5');
  pending.resolve({ walletAddress: wallet, balances: [{ chainId: 137, balanceAtomic: '999000000', nativeBalanceAtomic: '0' }] }); await h.flush();
  assert.equal(h.flow.balanceAtomic, '5000000'); assert.equal(h.flow.amount, '5');
  assert.deepEqual(writes(h), []); assert.equal(h.signatures.length, 0);
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

test('pending receipt checks back off from twelve to thirty to sixty seconds without rearming on renders or authorizing payments', async t => {
  const timers = clock(); let checks = 0;
  class PollDate extends Date { static now() { return timers.now; } }
  const h = harness({ Date: PollDate, setTimeout: timers.setTimeout, clearTimeout: timers.clearTimeout,
    history: async () => ({ payments: [submitted()] }), status: async () => submitted(),
    write: async action => { assert.equal(action, 'verify'); checks++; return submitted(); } }); t.after(() => h.unmount());
  await h.flush(); timers.tick(11999); await h.flush(); assert.equal(checks, 0);
  timers.tick(1); await h.flush(); assert.equal(checks, 1);
  for (let index = 0; index < 100; index++) await h.session({ subject: 'owner-A', email: 'member@example.test' });
  timers.tick(29999); await h.flush(); assert.equal(checks, 1);
  timers.tick(1); await h.flush(); assert.equal(checks, 2);
  timers.tick(59999); await h.flush(); assert.equal(checks, 2);
  timers.tick(1); await h.flush(); assert.equal(checks, 3);
  h.documentRef.visibilityState = 'hidden'; h.documentRef.dispatchEvent(new Event('visibilitychange'));
  timers.tick(60000); await h.flush(); assert.equal(checks, 3);
  h.documentRef.visibilityState = 'visible'; h.documentRef.dispatchEvent(new Event('visibilitychange'));
  timers.tick(60000); await h.flush(); assert.equal(checks, 4, 'Returning does not reset the polling delay to twelve seconds');
  timers.tick(15 * 60000); await h.flush(); assert.equal(checks, 4, 'The original per-payment fifteen-minute deadline remains binding');
  assert.deepEqual(writes(h).map(call => call.action), Array(4).fill('verify'));
  assert.equal(h.signatures.length, 0); assert.equal(h.providerCalls.length, 0);
});

test('reconciliation-required operations remain manual and never start automatic provider checks', async t => {
  const timers = clock(), current = payment({ status: 'reconciliation_required', userOperationHash: hash }); let checks = 0;
  class PollDate extends Date { static now() { return timers.now; } }
  const h = harness({ Date: PollDate, setTimeout: timers.setTimeout, clearTimeout: timers.clearTimeout,
    history: async () => ({ payments: [current] }), status: async () => current,
    write: async action => { assert.equal(action, 'verify'); checks++; return current; } }); t.after(() => h.unmount());
  await h.flush(); timers.tick(15 * 60000); await h.flush();
  assert.equal(h.flow.payment.status, 'reconciliation_required'); assert.equal(checks, 0);
  assert.deepEqual(writes(h), []); assert.equal(h.calls.some(call => call.action === 'status'), false);
  await h.flow.verifyPayment(); await h.flush(); assert.equal(checks, 1);
  timers.tick(60000); await h.flush(); assert.equal(checks, 1);
  assert.equal(h.signatures.length, 0); assert.equal(h.providerCalls.length, 0);
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
  const a = harness({ storage, locks: sharedLocks, write: async action => action === 'prepare' ? prepared.promise
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

test('a disconnected or changed SDK account cancels a late read-only review without creating a payment', async () => {
  for (const change of ['disconnect', 'account', 'session']) {
    const response = deferred(); let reads = 0;
    const h = harness({ balance: async () => {
      reads++; return reads === 1 ? { walletAddress: wallet, balances: [{ chainId: 137, balanceAtomic, nativeBalanceAtomic: '0' }] } : response.promise;
    } });
    try {
      await h.flush(); const reviewing = h.flow.review(); await h.flush(); assert.equal(reads, 2);
      if (change === 'disconnect') await h.connection(false);
      else if (change === 'account') await h.sdkAccount(otherWallet);
      else await h.session({ subject: 'owner-B', email: 'second@example.test' });
      response.resolve({ walletAddress: wallet, balances: [{ chainId: 137, balanceAtomic, nativeBalanceAtomic: '0' }] });
      await reviewing; await h.flush();
      assert.equal(h.flow.preview, null); assert.equal(h.flow.payment, null); assert.equal(h.flow.busy, false);
      assert.deepEqual(writes(h), []); assert.equal(h.signatures.length, 0);
    } finally { h.unmount(); }
  }
});

test('the frozen reviewed amount is the only amount prepared even if editable state later changes', async t => {
  const h = harness(); t.after(() => h.unmount()); await review(h);
  assert.equal(Object.isFrozen(h.flow.preview), true);
  assert.throws(() => { h.flow.preview.amountAtomic = '1000000'; }, TypeError);
  h.flow.setAmount('1'); await h.flush(); await h.flow.confirm(); await h.flush();
  assert.equal(writes(h).find(call => call.action === 'prepare').input.amountAtomic, balanceAtomic);
  assert.equal(h.signatures[0].amountAtomic, balanceAtomic);
});

test('crossed prepare UUID, amount or wallet acknowledgements cannot open any wallet prompt', async () => {
  for (const patch of [{ paymentId: '22222222-2222-4222-8222-222222222222' }, { amountAtomic: '1000000' }, { walletAddress: otherWallet }]) {
    const h = harness({ write: async action => { assert.equal(action, 'prepare'); return payment(patch); } });
    try {
      await review(h); await h.flow.confirm(); await h.flush();
      assert.deepEqual(writes(h).map(call => call.action), ['prepare']); assert.equal(h.signatures.length, 0);
      assert.equal(h.flow.errorKey, 'walletTransfer.invalidAuthorization'); assert.equal(h.flow.payment, null);
    } finally { h.unmount(); }
  }
});

test('a confirmed canonical payment arriving during a wallet prompt discards the late signature without reauthorization', async t => {
  const history = deferred(), signatureResult = deferred();
  const h = harness({ history: async () => history.promise, sign: async () => signatureResult.promise }); t.after(() => h.unmount());
  await review(h); const pending = h.flow.confirm(); await h.flush(); assert.equal(h.signatures.length, 1);
  history.resolve({ payments: [confirmed()] }); await h.flush(); assert.equal(h.flow.payment.status, 'confirmed');
  signatureResult.resolve({ paymentId: id, signature }); await pending; await h.flush();
  assert.equal(h.flow.payment.status, 'confirmed'); assert.equal(h.flow.recovery, null); assert.equal(h.flow.errorKey, '');
  assert.deepEqual(writes(h).map(call => call.action), ['prepare']); assert.equal(h.signatures.length, 1);
});

test('a late prepared reply cannot reopen a signature after a terminal history update', async t => {
  const history = deferred(), status = deferred();
  const h = harness({ history: async () => history.promise, status: async () => status.promise }); t.after(() => h.unmount());
  await review(h); const pending = h.flow.confirm(); await h.flush(); assert.equal(h.signatures.length, 0);
  history.resolve({ payments: [confirmed()] }); await h.flush(); status.resolve(payment()); await pending; await h.flush();
  assert.equal(h.flow.payment.status, 'confirmed'); assert.equal(h.flow.recovery, null);
  assert.deepEqual(writes(h).map(call => call.action), ['prepare']); assert.equal(h.signatures.length, 0);
});

test('a changed SDK account discards an unresolved signature before any authorization is uploaded', async t => {
  const signed = deferred(), h = harness({ sign: async () => signed.promise }); t.after(() => h.unmount());
  await review(h); const pending = h.flow.confirm(); await h.flush(); assert.equal(h.signatures.length, 1);
  await h.sdkAccount(otherWallet); signed.resolve({ paymentId: id, signature }); await pending; await h.flush();
  assert.equal(h.flow.wallet, wallet); assert.equal(h.flow.connected, false);
  assert.deepEqual(writes(h).map(call => call.action), ['prepare']); assert.equal(h.flow.payment.walletAddress, wallet);
});

test('crossed authorization amounts or wallets never replace the reviewed payment or reach submit', async () => {
  for (const patch of [{ amountAtomic: '1000000' }, { walletAddress: otherWallet }]) {
    const h = harness({ write: async action => {
      if (action === 'prepare') return payment();
      assert.equal(action, 'authorize'); return payment({ status: 'authorized', ...patch });
    } });
    try {
      await review(h); await h.flow.confirm(); await h.flush();
      assert.deepEqual(writes(h).map(call => call.action), ['prepare', 'authorize']);
      assert.equal(h.flow.payment.amountAtomic, balanceAtomic); assert.equal(h.flow.payment.walletAddress, wallet);
      assert.equal(h.flow.recovery.phase, 'ambiguous'); assert.equal(h.signatures.length, 1);
      await h.flow.confirm(); await h.flush(); assert.equal(h.signatures.length, 1);
      assert.equal(writes(h).some(call => call.action === 'submit'), false);
    } finally { h.unmount(); }
  }
});

test('an obsolete authorized status reply cannot submit after history already confirms the payment', async t => {
  const history = deferred(), status = deferred(); let histories = 0;
  const authorized = payment({ status: 'authorized' });
  const h = harness({ history: async () => ++histories === 1 ? { payments: [authorized] } : history.promise,
    status: async () => status.promise }); t.after(() => h.unmount());
  await h.flush(); assert.equal(h.flow.payment.status, 'authorized');
  h.flow.refresh(); await h.flush();
  const continuation = h.flow.submitAuthorized(); await h.flush();
  history.resolve({ payments: [confirmed()] }); await h.flush(); assert.equal(h.flow.payment.status, 'confirmed');
  status.resolve(authorized); await continuation; await h.flush();
  assert.equal(h.flow.payment.status, 'confirmed'); assert.equal(h.flow.recovery, null); assert.equal(h.flow.errorKey, '');
  assert.deepEqual(writes(h), []); assert.equal(h.signatures.length, 0); assert.equal(h.storage.size, 0);
});

test('reconnecting an unsigned preparation preserves the linked wallet and requires a separate read-only resume', async t => {
  const prepared = payment();
  const h = harness({ connected: false, history: async () => ({ payments: [prepared] }) }); t.after(() => h.unmount());
  await h.flush(); assert.equal(h.flow.stage, 'status'); assert.equal(h.flow.connected, false);
  await h.flow.connect(); await h.flush();
  assert.equal(h.calls.filter(call => call.action === 'connect').length, 1);
  assert.equal(h.calls.filter(call => call.action === 'link').length, 0);
  assert.equal(h.flow.wallet, wallet); assert.equal(h.flow.preview, null);
  await h.connection(true); await h.sdkAccount(otherWallet); await h.flow.resume(); await h.flush();
  assert.equal(h.flow.preview, null, 'a different SDK account cannot resume the bound payment');
  await h.sdkAccount(wallet); await h.flow.resume(); await h.flush();
  assert.equal(h.flow.stage, 'review'); assert.equal(h.flow.preview.walletAddress, wallet); assert.equal(h.flow.preview.amountAtomic, prepared.amountAtomic);
  assert.deepEqual(writes(h), []); assert.equal(h.signatures.length, 0);
});

test('an ambiguous unsigned preparation expires only through server verification after its deadline, never by resigning', async () => {
  for (const elapsed of [false, true]) {
    const prepared = payment(); let now = Date.now();
    class VerificationDate extends Date { static now() { return now; } }
    const expired = payment({ status: 'expired', failureReason: 'preparation_expired', typedData: null,
      createdAt: prepared.createdAt, expiresAt: prepared.expiresAt });
    const h = harness({ Date: VerificationDate, status: async () => prepared,
      sign: async () => { throw new TypeError('the synthetic wallet response was lost'); },
      write: async action => {
        if (action === 'prepare') return prepared;
        assert.equal(action, 'verify'); assert.equal(elapsed, true); return expired;
      } });
    try {
      await review(h); await h.flow.confirm(); await h.flush();
      assert.equal(h.flow.payment.status, 'prepared'); assert.equal(h.flow.recovery.phase, 'ambiguous');
      if (elapsed) now = Date.parse(prepared.expiresAt) + 1;
      await h.flow.verifyPayment(); await h.flush();
      assert.deepEqual(writes(h).map(call => call.action), elapsed ? ['prepare', 'verify'] : ['prepare']);
      assert.equal(h.signatures.length, 1);
      if (elapsed) {
        assert.equal(h.flow.payment.status, 'expired'); assert.equal(h.flow.recovery, null); assert.equal(h.storage.size, 0);
        h.flow.newPayment(); await h.flush(); assert.equal(h.flow.stage, 'form');
      } else {
        assert.equal(h.flow.payment.status, 'prepared'); assert.equal(h.flow.recovery.phase, 'ambiguous');
        await h.flow.confirm(); await h.flush(); assert.equal(h.signatures.length, 1);
      }
      assert.equal(writes(h).some(call => ['authorize', 'submit'].includes(call.action)), false);
    } finally { h.unmount(); }
  }
});
