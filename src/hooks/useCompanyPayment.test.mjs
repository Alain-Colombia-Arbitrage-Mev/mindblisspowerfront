import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import ts from 'typescript';
import * as contracts from '../lib/company-payment-contract.mjs';
import * as recovery from '../lib/company-payment-recovery.mjs';
import * as values from '../lib/personal-company-payment-values.mjs';

const require = createRequire(import.meta.url);
const wallet = `0x${'1'.repeat(40)}`, otherWallet = `0x${'2'.repeat(40)}`, transactionHash = `0x${'3'.repeat(64)}`;
const paymentId = '11111111-1111-4111-8111-111111111111', otherId = '22222222-2222-4222-8222-222222222222';
const balanceAtomic = '25123456';
const createdAt = new Date(Date.now() - 1000).toISOString(), expiresAt = new Date(Date.now() + 600_000).toISOString();
const deferred = () => { let resolve, reject; const promise = new Promise((done, fail) => { resolve = done; reject = fail; }); return { promise, resolve, reject }; };
function clock() {
  let now = 0, next = 0;
  const timers = new Map();
  return {
    setTimeout(callback, milliseconds) { const id = ++next; timers.set(id, { callback, at: now + milliseconds }); return id; },
    clearTimeout(id) { timers.delete(id); },
    tick(milliseconds) {
      now += milliseconds;
      for (const [id, timer] of [...timers]) if (timer.at <= now && timers.delete(id)) timer.callback();
    },
    get pending() { return timers.size; },
  };
}
function lockManager() {
  const held = new Set(), calls = [];
  return { calls, async request(name, options, callback) {
    calls.push({ name, options });
    if (held.has(name)) return callback(null);
    held.add(name);
    try { return await callback({ name, mode: 'exclusive' }); } finally { held.delete(name); }
  } };
}
function payment(patch = {}) {
  return { paymentId, walletKind: 'personal', walletAddress: wallet, ...values.PERSONAL_COMPANY_PAYMENT, amountAtomic: balanceAtomic,
    status: 'prepared', createdAt, expiresAt,
    transactionHash: null, blockNumber: null, blockHash: null, confirmations: 0, requiredConfirmations: 12, failureReason: null,
    abandonedAt: null, membershipAssignment: 'pending', ...patch };
}
const confirmed = patch => payment({ status: 'confirmed', transactionHash, blockNumber: '100', blockHash: `0x${'4'.repeat(64)}`, confirmations: 12, ...patch });

/** Run the actual hook with persistent React state/effects; every transport and wallet dependency is synthetic. */
function harness(overrides = {}) {
  const slots = [], effects = [], calls = [], storage = overrides.storage || new Map();
  let cursor = 0, dirty = true, current, sourceWallet = wallet, nextId = 0;
  const localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
  const browser = Object.assign(new EventTarget(), { localStorage });
  const documentRef = Object.assign(new EventTarget(), { visibilityState: 'visible' });
  const dependenciesChanged = (before, after) => !before || !after || before.length !== after.length || before.some((value, index) => !Object.is(value, after[index]));
  const hooks = {
    useRef(initial) { const index = cursor++; return slots[index] ??= { current: initial }; },
    useState(initial) {
      const index = cursor++;
      const cell = slots[index] ??= { value: typeof initial === 'function' ? initial() : initial };
      cell.set ??= update => { const next = typeof update === 'function' ? update(cell.value) : update;
        if (!Object.is(next, cell.value)) { cell.value = next; dirty = true; } };
      return [cell.value, cell.set];
    },
    useCallback(callback, deps) { const index = cursor++, cell = slots[index] ??= {};
      if (dependenciesChanged(cell.deps, deps)) { cell.value = callback; cell.deps = deps; } return cell.value; },
    useEffect(callback, deps) { const index = cursor++, cell = slots[index] ??= {};
      if (dependenciesChanged(cell.deps, deps)) { cell.deps = deps; effects.push(() => { cell.cleanup?.(); cell.cleanup = callback(); }); } },
  };
  const sdk = { creations: [], broadcasts: [], sends: [], networkSwitches: [], balanceReads: [] };
  const provider = { request() { assert.fail('a real wallet RPC was attempted'); } };
  const getProvider = () => provider;
  const switchProviderNetwork = async () => { sdk.networkSwitches.push('ethereum'); return overrides.switchNetwork?.(); };
  const reown = () => ({ linkedAddress: sourceWallet, linkStatus: 'linked', isConnected: true, isLinked: true, getCompanyPaymentProvider: getProvider,
    switchCompanyPaymentNetwork: switchProviderNetwork,
    openConnect: () => assert.fail('unexpected wallet connection'), linkWallet: () => assert.fail('unexpected signature'), ...overrides.reown });
  const client = {
    async readCompanyPaymentHistory(options) { calls.push({ action: 'history' }); return overrides.history ? overrides.history(options) : { records: [] }; },
    async writeCompanyPayment(action, input, options) {
      calls.push({ action, input, options });
      if (overrides.write) return overrides.write(action, input, options);
      if (action === 'prepare') return payment({ paymentId: input.requestId, amountAtomic: input.amountAtomic, walletAddress: sourceWallet });
      if (action === 'abandon') return payment({ paymentId: input.paymentId, abandonedAt: new Date().toISOString() });
      if (action === 'submit') return payment({ paymentId: input.paymentId, status: 'submitted', transactionHash: input.transactionHash });
      return confirmed({ paymentId: input.paymentId });
    },
  };
  const transfer = {
    async readPersonalCompanyPaymentBalance(options) { sdk.balanceReads.push(options); return overrides.balance ? overrides.balance(options) : { balanceAtomic }; },
    createPersonalCompanyPaymentTransfer(options) {
      sdk.creations.push(options);
      const sender = { markSubmitted: (...args) => sdk.broadcasts.push(args), async sendPrepared(prepared, config) {
        sdk.sends.push({ prepared, config });
        if (overrides.send) return overrides.send(options, prepared, config, sender);
        options.onDispatchStart();
        options.onStateChange({ paymentId: prepared.paymentId, phase: 'rejected', transactionMayExist: false });
        return { phase: 'rejected' };
      } };
      return sender;
    },
  };
  const source = readFileSync(new URL('./useCompanyPayment.jsx', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  const browserNavigator = overrides.navigator || { locks: lockManager() };
  const imports = { react: hooks, '@/lib/company-payment-contract.mjs': contracts, '@/lib/company-payment-client.mjs': client,
    '@/lib/company-payment-recovery.mjs': recovery, '@/lib/personal-company-payment.mjs': transfer, '@/lib/personal-company-payment-values.mjs': values };
  new Function('require', 'module', 'exports', 'window', 'document', 'crypto', 'navigator', 'globalThis', 'setTimeout', 'clearTimeout', code)(id => {
    assert.ok(Object.hasOwn(imports, id), `Unexpected hook dependency ${id}`); return imports[id];
  }, module, module.exports, browser, documentRef, { randomUUID: () => (++nextId === 1 ? paymentId : otherId) },
  browserNavigator, { navigator: browserNavigator }, overrides.setTimeout || setTimeout, overrides.clearTimeout || clearTimeout);
  function render() { cursor = 0; dirty = false; current = module.exports.useCompanyPayment(reown()); }
  return {
    get flow() { return current; }, calls, sdk, localStorage, browser, documentRef,
    async flush() {
      let quiet = 0;
      for (let turn = 0; turn < 40; turn++) {
        if (dirty) render();
        while (effects.length) effects.shift()();
        await new Promise(resolve => setImmediate(resolve));
        if (dirty || effects.length) quiet = 0; else if (++quiet === 2) return current;
      }
      assert.fail('Hook state did not settle');
    },
    async wallet(address) { sourceWallet = address; dirty = true; return this.flush(); },
    unmount() { for (const cell of slots) cell?.cleanup?.(); },
  };
}
async function preview(h, amount = '25.123456') { h.flow.setAmount(amount); await h.flush(); h.flow.review(); await h.flush(); }
const writes = h => h.calls.filter(call => call.action !== 'history').map(call => call.action);

function page(h) {
  const source = readFileSync(new URL('../app/dashboard/_components/executive-pages/CompanyPaymentPage.jsx', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(id => {
    if (id === 'react/jsx-runtime') return require(id);
    if (id === 'next/dynamic') return { default: () => ({ children }) => children };
    if (id === 'next/link') return { default: 'a' };
    if (id === 'lucide-react') return new Proxy({}, { get: () => () => null });
    if (id === '@/components/reown/ReownContext') return { useReownWallet: () => ({ linkStatus: 'linked' }) };
    if (id === '@/i18n/LanguageProvider') return { useI18n: () => ({ locale: 'en', t: key => key }) };
    if (id === '@/hooks/useCompanyPayment') return { useCompanyPayment: () => h.flow };
    if (id === '@/lib/personal-company-payment-values.mjs') return values;
    if (id === '@/lib/company-payment-contract.mjs') return contracts;
    if (id === './CompanyPaymentForm') return { CompanyPaymentForm: 'CompanyPaymentForm', CompanyPaymentReview: 'CompanyPaymentReview' };
    if (id.endsWith('.module.css')) return { default: new Proxy({}, { get: (_target, name) => name }) };
    assert.fail(`Unexpected payment page dependency ${id}`);
  }, module, module.exports);
  return module.exports.PersonalCompanyPayment();
}
const find = (node, predicate) => predicate(node) ? node : React.Children.toArray(node?.props?.children).map(child => find(child, predicate)).find(Boolean);

test('the first verified balance prefills the exact maximum without preparing a payment and later refreshes preserve explicit edits', async () => {
  let available = balanceAtomic;
  const h = harness({ balance: async () => ({ balanceAtomic: available }) }); await h.flush();
  assert.equal(h.flow.amount, '25.123456'); assert.deepEqual(writes(h), []); assert.equal(h.sdk.sends.length, 0);
  h.flow.setAmount('5'); await h.flush(); available = '30000000'; h.flow.refresh(); await h.flush();
  assert.equal(h.flow.amount, '5'); assert.equal(h.flow.balanceAtomic, available);
  h.flow.setAmount(''); await h.flush(); h.flow.refresh(); await h.flush(); assert.equal(h.flow.amount, '');
  h.flow.selectHistory(confirmed()); await h.flush(); h.flow.newPayment(); await h.flush();
  assert.equal(h.flow.amount, '30'); assert.deepEqual(writes(h), []); assert.equal(h.sdk.sends.length, 0);
});

test('returning from funding coalesces visible browser events into read-only balance and history refreshes', async t => {
  const timers = clock(); let available = '0';
  const h = harness({ ...timers, balance: async () => ({ balanceAtomic: available }) }); t.after(() => h.unmount());
  await h.flush(); assert.equal(h.flow.amount, ''); assert.equal(h.flow.balanceAtomic, '0');
  available = balanceAtomic;
  h.browser.dispatchEvent(new Event('focus'));
  h.documentRef.dispatchEvent(new Event('visibilitychange'));
  h.browser.dispatchEvent(new Event('pageshow'));
  assert.equal(timers.pending, 1);
  timers.tick(249); await h.flush(); assert.equal(h.sdk.balanceReads.length, 1);
  timers.tick(1); await h.flush();
  assert.equal(h.sdk.balanceReads.length, 2); assert.equal(h.calls.filter(call => call.action === 'history').length, 2);
  assert.equal(h.flow.balanceAtomic, balanceAtomic); assert.equal(h.flow.amount, '25.123456');
  h.flow.setAmount('5'); await h.flush(); available = '30000000';
  h.browser.dispatchEvent(new Event('focus')); timers.tick(250); await h.flush();
  assert.equal(h.flow.balanceAtomic, '30000000'); assert.equal(h.flow.amount, '5', 'return refresh overwrote the edited amount');
  find(page(h), node => node?.type === 'CompanyPaymentForm').props.onMax(); await h.flush();
  assert.equal(h.flow.amount, '30', 'MAX did not use the refreshed real balance');
  assert.deepEqual(writes(h), []); assert.equal(h.sdk.creations.length, 0); assert.equal(h.sdk.sends.length, 0);
});

test('hidden tabs and unlinked wallets do not refresh, and hiding cancels a queued return refresh', async t => {
  const timers = clock(), h = harness({ ...timers }); t.after(() => h.unmount()); await h.flush();
  h.browser.dispatchEvent(new Event('focus')); assert.equal(timers.pending, 1);
  h.documentRef.visibilityState = 'hidden'; h.documentRef.dispatchEvent(new Event('visibilitychange'));
  h.browser.dispatchEvent(new Event('focus')); h.browser.dispatchEvent(new Event('pageshow'));
  assert.equal(timers.pending, 0); timers.tick(250); await h.flush(); assert.equal(h.sdk.balanceReads.length, 1);
  const unlinked = harness({ ...timers, reown: { linkStatus: 'unlinked', isLinked: false } }); t.after(() => unlinked.unmount()); await unlinked.flush();
  unlinked.browser.dispatchEvent(new Event('focus')); unlinked.documentRef.dispatchEvent(new Event('visibilitychange'));
  unlinked.browser.dispatchEvent(new Event('pageshow')); timers.tick(250); await unlinked.flush();
  assert.equal(unlinked.sdk.balanceReads.length, 0); assert.deepEqual(unlinked.calls, []);
  assert.deepEqual(writes(h), []); assert.equal(h.sdk.sends.length + unlinked.sdk.sends.length, 0);
});

test('busy wallet operations drop return events and cancel pending refreshes without queuing work after completion', async t => {
  const timers = clock(), gate = deferred(), h = harness({ ...timers, switchNetwork: () => gate.promise });
  t.after(() => h.unmount()); await h.flush();
  h.browser.dispatchEvent(new Event('focus')); assert.equal(timers.pending, 1);
  const switching = h.flow.switchNetwork(); await h.flush(); assert.equal(h.flow.busy, true);
  // Only the explicit SDK switch deadline remains; the 250 ms return timer was removed.
  assert.equal(timers.pending, 1);
  h.browser.dispatchEvent(new Event('focus')); h.documentRef.dispatchEvent(new Event('visibilitychange')); h.browser.dispatchEvent(new Event('pageshow'));
  timers.tick(250); await h.flush(); assert.equal(h.sdk.balanceReads.length, 1);
  gate.resolve(); await switching; await h.flush();
  const reads = h.sdk.balanceReads.length;
  timers.tick(250); await h.flush(); assert.equal(h.sdk.balanceReads.length, reads, 'a busy return event was deferred until after the wallet operation');
  assert.equal(timers.pending, 0); assert.deepEqual(writes(h), []); assert.equal(h.sdk.sends.length, 0);
});

test('wallet changes and unmount cancel queued refreshes and cannot publish a late balance from the previous wallet', async t => {
  const timers = clock(), pending = deferred(); let reads = 0;
  const h = harness({ ...timers, balance: async () => ++reads === 2 ? pending.promise : { balanceAtomic: reads === 1 ? balanceAtomic : '10000000' } });
  t.after(() => h.unmount()); await h.flush();
  h.browser.dispatchEvent(new Event('focus')); timers.tick(250); await h.flush();
  const oldRead = h.sdk.balanceReads[1]; assert.equal(oldRead.signal.aborted, false);
  await h.wallet(otherWallet); assert.equal(oldRead.signal.aborted, true); assert.equal(h.flow.balanceAtomic, '10000000');
  pending.resolve({ balanceAtomic: '99000000' }); await h.flush();
  assert.equal(h.flow.balanceAtomic, '10000000'); assert.equal(h.flow.amount, '10');
  h.browser.dispatchEvent(new Event('focus')); assert.equal(timers.pending, 1);
  await h.wallet(wallet); assert.equal(timers.pending, 0);
  const currentReads = h.sdk.balanceReads.length; timers.tick(250); await h.flush(); assert.equal(h.sdk.balanceReads.length, currentReads);
  h.browser.dispatchEvent(new Event('pageshow')); assert.equal(timers.pending, 1);
  h.unmount(); assert.equal(timers.pending, 0);
  h.browser.dispatchEvent(new Event('focus')); timers.tick(250); assert.equal(h.sdk.balanceReads.length, currentReads);
  assert.deepEqual(writes(h), []); assert.equal(h.sdk.sends.length, 0);
});

test('a verified terminal receipt refreshes the on-chain balance and history without another transfer', async t => {
  let available = balanceAtomic;
  const h = harness({ balance: async () => ({ balanceAtomic: available }), write: async action => {
    assert.equal(action, 'verify'); available = '0'; return confirmed();
  } }); t.after(() => h.unmount()); await h.flush();
  h.flow.selectHistory(payment({ status: 'submitted', transactionHash })); await h.flush();
  await h.flow.verifyPayment(); await h.flush();
  assert.equal(h.flow.payment.status, 'confirmed'); assert.equal(h.flow.balanceAtomic, '0');
  assert.equal(h.sdk.balanceReads.length, 2); assert.equal(h.calls.filter(call => call.action === 'history').length, 2);
  assert.deepEqual(writes(h), ['verify']); assert.equal(h.sdk.sends.length, 0);
});

test('actual page MAX, preview and editing never prepare or send; explicit confirmation prepares the exact amount before SDK dispatch', async () => {
  const gate = deferred(); let requested;
  const h = harness({ write: (action, input) => { assert.equal(action, 'prepare'); requested = input; return gate.promise; } }); await h.flush();
  const form = find(page(h), node => node?.type === 'CompanyPaymentForm');
  form.props.onMax(); await h.flush(); assert.equal(h.flow.amount, '25.123456');
  h.flow.review(); await h.flush(); assert.equal(h.flow.stage, 'review'); assert.deepEqual(writes(h), []);
  find(page(h), node => node?.type === 'CompanyPaymentReview').props.onBack(); await h.flush();
  await preview(h, '20.000001'); assert.deepEqual(writes(h), []); assert.equal(h.sdk.sends.length, 0);
  const confirming = h.flow.confirm(); await h.flush();
  assert.deepEqual(writes(h), ['prepare']); assert.equal(h.sdk.sends.length, 0);
  gate.resolve(payment({ paymentId: requested.requestId, amountAtomic: requested.amountAtomic }));
  await confirming; await h.flush();
  assert.deepEqual(writes(h), ['prepare']); assert.equal(h.sdk.sends.length, 1);
  assert.equal(h.sdk.sends[0].prepared.amountAtomic, '20000001');
  assert.equal(h.calls.find(call => call.action === 'prepare').input.amountAtomic, '20000001');
  for (const stored of [payment({ status: 'submitted', transactionHash }), confirmed(), payment({ abandonedAt: new Date().toISOString() })]) {
    const replay = harness({ write: async (_action, input) => ({ ...stored, paymentId: input.requestId }) });
    await replay.flush(); await preview(replay); await replay.flow.confirm(); await replay.flush();
    assert.equal(replay.flow.payment.status, stored.status); assert.equal(replay.flow.stage, 'status');
    assert.equal(replay.flow.errorKey, ''); assert.equal(replay.sdk.creations.length, 0, 'stored terminal/abandoned state caused a new wallet prompt');
  }
});

test('a stale prepare after wallet changes cannot prompt a transfer, leave busy set or overwrite the new wallet preview', async () => {
  const pending = deferred();
  const h = harness({ write: (action, input) => action === 'prepare' ? pending.promise : assert.fail(`Unexpected ${action}`) });
  await h.flush(); await preview(h); const old = h.flow.confirm(); await h.flush(); assert.equal(h.flow.busy, true);
  await h.wallet(otherWallet); assert.equal(h.flow.busy, false); await preview(h, '10');
  const next = h.flow.payment;
  pending.resolve(payment()); await old; await h.flush();
  assert.equal(h.sdk.sends.length, 0); assert.equal(h.flow.busy, false); assert.equal(h.flow.payment.paymentId, next.paymentId);
  assert.equal(h.flow.payment.walletAddress, otherWallet);
});

test('switching away and back cannot revive old prepare, verify or abandon acknowledgements over a new preview', async () => {
  for (const action of ['prepare', 'verify', 'abandon']) {
    const pending = deferred(), h = harness({ write: () => pending.promise }); await h.flush();
    if (action === 'prepare') await preview(h);
    else { h.flow.selectHistory(payment({ paymentId: otherId, ...(action === 'verify' ? { status: 'submitted', transactionHash } : {}) })); await h.flush(); }
    const old = action === 'prepare' ? h.flow.confirm() : action === 'verify' ? h.flow.verifyPayment() : h.flow.abandon();
    await h.flush(); assert.equal(h.flow.busy, true);
    await h.wallet(otherWallet); await h.wallet(wallet); await preview(h, '10');
    const nextId = h.flow.payment.paymentId;
    pending.resolve(action === 'verify' ? confirmed({ paymentId: otherId }) : payment({ paymentId: action === 'prepare' ? paymentId : otherId,
      ...(action === 'abandon' ? { abandonedAt: new Date().toISOString() } : {}) }));
    await old; await h.flush();
    assert.equal(h.sdk.sends.length, 0, action); assert.equal(h.flow.busy, false, action);
    assert.equal(h.flow.payment.paymentId, nextId, action); assert.equal(h.flow.stage, 'review', action);
    assert.equal(h.flow.payment.amountAtomic, '10000000', action);
  }
});

test('a broadcast hash survives registration failure and recovery retries only registration and verification', async () => {
  let submits = 0, broadcast;
  const h = harness({
    async write(action, input) {
      if (action === 'prepare') return payment({ paymentId: input.requestId });
      if (action === 'submit') { if (++submits === 1) throw Error('company_payment_rpc_unavailable'); return payment({ status: 'submitted', transactionHash }); }
      assert.equal(action, 'verify'); return confirmed();
    },
    async send(options, prepared) { options.onDispatchStart(); broadcast = options.onBroadcast({ transactionHash }); return { phase: 'broadcast', paymentId: prepared.paymentId, transactionHash }; },
  });
  await h.flush(); await preview(h); await h.flow.confirm(); await broadcast; await h.flush();
  assert.equal(h.flow.recovery.transactionHash, transactionHash); assert.equal(h.flow.payment.status, 'prepared');
  await h.flow.confirm(); await h.flush(); assert.equal(h.sdk.sends.length, 1);
  await h.flow.verifyPayment(); await h.flush();
  assert.deepEqual(writes(h), ['prepare', 'submit', 'submit', 'verify']); assert.equal(h.sdk.sends.length, 1);
  assert.equal(h.flow.payment.status, 'confirmed'); assert.equal(h.flow.recovery, null);
});

test('a delayed registration acknowledgement cannot regress an already confirmed receipt or recreate recovery metadata', async () => {
  const pending = deferred(); let broadcast;
  const h = harness({ write: (action, input) => action === 'prepare' ? payment({ paymentId: input.requestId }) : pending.promise,
    async send(options) { options.onDispatchStart(); broadcast = options.onBroadcast({ transactionHash }); return { phase: 'broadcast', transactionHash }; } });
  await h.flush(); await preview(h); await h.flow.confirm(); await h.flush();
  h.flow.selectHistory(confirmed()); await h.flush();
  pending.resolve(payment({ status: 'submitted', transactionHash })); await broadcast; await h.flush();
  assert.equal(h.flow.payment.status, 'confirmed'); assert.equal(h.flow.recovery, null);
  assert.equal(recovery.readCompanyRecovery(h.localStorage, wallet, paymentId), null); assert.equal(h.sdk.sends.length, 1);
});

test('a pending-intent conflict adopts the actual server history without opening a wallet prompt', async () => {
  let reads = 0;
  const actual = payment({ paymentId: otherId, amountAtomic: '10000000', status: 'submitted', transactionHash });
  const h = harness({ history: async () => ({ records: ++reads === 1 ? [] : [actual] }),
    write: async () => { throw Error('company_payment_pending_exists'); } });
  await h.flush(); await preview(h); await h.flow.confirm(); await h.flush();
  assert.equal(h.flow.payment.paymentId, otherId); assert.equal(h.flow.payment.status, 'submitted'); assert.equal(h.flow.stage, 'status');
  assert.equal(h.flow.busy, false); assert.equal(h.sdk.creations.length, 0); assert.deepEqual(writes(h), ['prepare']);
});

test('abandoned drafts never prompt again but a known late hash remains registerable and verifiable', async () => {
  const abandonedAt = new Date().toISOString(), abandoned = payment({ abandonedAt });
  const h = harness({ write: async (action) => action === 'submit' ? payment({ status: 'submitted', transactionHash, abandonedAt }) : confirmed({ abandonedAt }) });
  await h.flush(); h.flow.selectHistory(abandoned); await h.flush(); await h.flow.confirm(); await h.flush();
  assert.deepEqual(writes(h), []); assert.equal(h.sdk.creations.length, 0);
  h.flow.setManualHash(transactionHash); await h.flush(); await h.flow.verifyPayment(); await h.flush();
  assert.deepEqual(writes(h), ['submit', 'verify']); assert.equal(h.sdk.sends.length, 0); assert.equal(h.flow.payment.status, 'confirmed');
  assert.equal(h.flow.payment.abandonedAt, abandonedAt);
});

test('wallet rejection stays an unreceived draft and may be explicitly abandoned without a submit or verify call', async () => {
  const h = harness(); await h.flush(); await preview(h); await h.flow.confirm(); await h.flush();
  assert.equal(h.flow.payment.status, 'prepared'); assert.equal(h.flow.payment.transactionHash, null); assert.equal(h.flow.errorKey, 'companyPayment.rejected');
  assert.equal(h.flow.recovery, null); assert.deepEqual(writes(h), ['prepare']);
  await h.flow.abandon(); await h.flush();
  assert.deepEqual(writes(h), ['prepare', 'abandon']); assert.equal(h.flow.payment, null); assert.equal(h.flow.stage, 'form');
});

test('one origin-wide wallet lock excludes a second tab before either preflight dispatches, and missing lock support fails closed', async () => {
  const locks = lockManager(), storage = new Map(), gate = deferred();
  const send = async options => { await gate.promise; options.onDispatchStart(); options.onStateChange({ paymentId, phase: 'rejected', transactionMayExist: false }); return { phase: 'rejected' }; };
  const first = harness({ navigator: { locks }, storage, send }), second = harness({ navigator: { locks }, storage, send });
  await first.flush(); await second.flush();
  first.flow.selectHistory(payment()); second.flow.selectHistory(payment()); await first.flush(); await second.flush();
  const a = first.flow.confirm(); await first.flush();
  const b = second.flow.confirm(); await second.flush();
  try {
    assert.equal(first.sdk.sends.length + second.sdk.sends.length, 1, 'a second tab entered transfer preflight before any durable dispatch marker existed');
    assert.equal(locks.calls.length, 2); assert.equal(new Set(locks.calls.map(call => call.name)).size, 1);
    assert.ok(locks.calls.every(call => call.options.mode === 'exclusive' && call.options.ifAvailable === true));
  } finally { gate.resolve(); await Promise.allSettled([a, b]); await first.flush(); await second.flush(); }
  const unsupported = harness({ navigator: {} }); await unsupported.flush(); await preview(unsupported); await unsupported.flow.confirm(); await unsupported.flush();
  assert.equal(unsupported.sdk.sends.length, 0); assert.equal(unsupported.flow.errorKey, 'companyPayment.recoveryUnavailable');
});

test('switching network is explicit SDK-only work, deduplicates clicks and cannot prepare or dispatch a payment', async () => {
  const pending = deferred(), h = harness({ switchNetwork: () => pending.promise }); await h.flush(); await preview(h);
  assert.equal(h.sdk.networkSwitches.length, 0);
  const selected = h.flow.payment.paymentId, first = h.flow.switchNetwork(), duplicate = h.flow.switchNetwork();
  await h.flush(); assert.equal(h.flow.busy, true); assert.equal(h.sdk.networkSwitches.length, 1);
  assert.deepEqual(writes(h), []); assert.equal(h.sdk.sends.length, 0);
  pending.resolve(); await Promise.all([first, duplicate]); await h.flush();
  assert.equal(h.flow.busy, false); assert.equal(h.flow.payment.paymentId, selected); assert.equal(h.flow.stage, 'review');
  assert.deepEqual(writes(h), []); assert.equal(h.sdk.sends.length, 0);
});

test('network switching has a twelve-second deadline and ignores an acknowledgement from an old wallet generation', async () => {
  const pending = deferred(), h = harness({ switchNetwork: () => pending.promise }); await h.flush();
  const old = h.flow.switchNetwork(); await h.flush(); await h.wallet(otherWallet); await h.wallet(wallet); await preview(h, '10');
  const selected = h.flow.payment.paymentId, historyReads = h.calls.filter(call => call.action === 'history').length;
  pending.resolve(); await old; await h.flush();
  assert.equal(h.flow.busy, false); assert.equal(h.flow.payment.paymentId, selected); assert.equal(h.flow.stage, 'review');
  assert.equal(h.calls.filter(call => call.action === 'history').length, historyReads); assert.deepEqual(writes(h), []);
  const timed = harness({ switchNetwork: () => new Promise(() => {}), setTimeout(callback, milliseconds) {
    assert.equal(milliseconds, 12_000); return setTimeout(callback, 5);
  } });
  await timed.flush(); await timed.flow.switchNetwork(); await timed.flush();
  assert.equal(timed.flow.busy, false); assert.equal(timed.flow.errorKey, 'companyPayment.networkUnavailable');
  assert.deepEqual(writes(timed), []); assert.equal(timed.sdk.sends.length, 0);
});
