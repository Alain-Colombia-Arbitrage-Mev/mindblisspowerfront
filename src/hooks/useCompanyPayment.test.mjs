import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { webcrypto } from 'node:crypto';
import React from 'react';
import ts from 'typescript';
import * as contracts from '../lib/company-payment-contract.mjs';
import * as recovery from '../lib/company-payment-recovery.mjs';
import * as values from '../lib/personal-company-payment-values.mjs';
import { personalWalletBalanceSessionKey } from '../lib/personal-wallet-balance-store.mjs';

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
    get now() { return now; },
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
  const slots = [], effects = [], calls = [], auditEvents = [], storage = overrides.storage || new Map();
  let cursor = 0, dirty = true, current, sourceWallet = wallet, nextId = 0;
  let sourceSession = { subject: 'owner-A', email: 'member@example.test' };
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
  const sdk = { creations: [], broadcasts: [], sends: [], networkSwitches: [], balanceReads: [], preflightBalanceReads: [], balances: new Map() };
  const provider = { request() { assert.fail('a real wallet RPC was attempted'); } };
  const getProvider = () => provider;
  const switchProviderNetwork = async chainId => { sdk.networkSwitches.push(chainId === 137 ? 'polygon' : 'ethereum'); return overrides.switchNetwork?.(chainId); };
  const reown = () => ({ linkedAddress: sourceWallet, linkStatus: 'linked', isConnected: true, isLinked: true, getCompanyPaymentProvider: getProvider,
    switchCompanyPaymentNetwork: switchProviderNetwork,
    openConnect: () => assert.fail('unexpected wallet connection'), linkWallet: () => assert.fail('unexpected signature'), ...overrides.reown });
  const client = {
    async recordCompanyPaymentEvent(input, options) { auditEvents.push({ input, options }); return overrides.audit?.(input, options); },
    async readCompanyPaymentHistory(options) { calls.push({ action: 'history' }); return overrides.history ? overrides.history(options) : { records: [] }; },
    async writeCompanyPayment(action, input, options) {
      calls.push({ action, input, options });
      if (overrides.write) return overrides.write(action, input, options);
      if (action === 'prepare') return payment({ paymentId: input.requestId, amountAtomic: input.amountAtomic, walletAddress: sourceWallet, ...values.personalCompanyPaymentPolicy(input.chainId) });
      if (action === 'abandon') return payment({ paymentId: input.paymentId, abandonedAt: new Date().toISOString() });
      if (action === 'submit') return payment({ paymentId: input.paymentId, status: 'submitted', transactionHash: input.transactionHash });
      return confirmed({ paymentId: input.paymentId });
    },
  };
  const transfer = {
    async readPersonalCompanyPaymentBalance(options) { sdk.preflightBalanceReads.push(options); return overrides.preflightBalance ? overrides.preflightBalance(options) : { balanceAtomic: sdk.balances.get(`${options.walletAddress}:${options.chainId}`) ?? (options.chainId === 137 ? '7000000' : balanceAtomic) }; },
    createPersonalCompanyPaymentTransfer(options) {
      sdk.creations.push(options);
      const sender = { markSubmitted: (...args) => sdk.broadcasts.push(args), async sendPrepared(prepared, config) {
        sdk.sends.push({ prepared, config });
        if (overrides.send) return overrides.send(options, prepared, config, sender);
        options.onDispatchStart();
        options.onStateChange({ paymentId: prepared.paymentId, phase: 'signing', transactionMayExist: true });
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
    '@/lib/company-payment-recovery.mjs': recovery, '@/lib/personal-company-payment.mjs': transfer, '@/lib/personal-company-payment-values.mjs': values,
    '@/lib/member-session-context': { useMemberSession: () => sourceSession },
    '@/lib/personal-wallet-balance-store.mjs': { personalWalletBalanceSessionKey },
    '@/lib/personal-wallet-balance.mjs': { async readPersonalWalletBalances(options) {
      sdk.balanceReads.push(options); const requestedWallet = sourceWallet;
      if (overrides.balances) return overrides.balances(options);
      const result = overrides.balance ? await overrides.balance(options) : { balanceAtomic };
      const response = { walletAddress: requestedWallet, ...result, balances: [
        { walletAddress: requestedWallet, chainId: 1, ...result },
        { walletAddress: requestedWallet, chainId: 137, balanceAtomic: '7000000' },
      ] };
      for (const record of response.balances) sdk.balances.set(`${requestedWallet}:${record.chainId}`, record.balanceAtomic);
      return response;
    } } };
  new Function('require', 'module', 'exports', 'window', 'document', 'crypto', 'navigator', 'globalThis', 'setTimeout', 'clearTimeout', 'Date', code)(id => {
    assert.ok(Object.hasOwn(imports, id), `Unexpected hook dependency ${id}`); return imports[id];
  }, module, module.exports, browser, documentRef, { randomUUID: () => (++nextId === 1 ? paymentId : otherId), subtle: webcrypto.subtle },
  browserNavigator, { navigator: browserNavigator }, overrides.setTimeout || setTimeout, overrides.clearTimeout || clearTimeout, overrides.Date || Date);
  function render() { cursor = 0; dirty = false; current = module.exports.useCompanyPayment(reown()); }
  return {
    get flow() { return current; }, calls, auditEvents, sdk, localStorage, browser, documentRef,
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
    async session(next, flush = true) { sourceSession = next; dirty = true; if (!flush) { render(); return current; } return this.flush(); },
    unmount() { for (const cell of slots) cell?.cleanup?.(); },
  };
}
async function preview(h, amount = '25.123456') { h.flow.setAmount(amount); await h.flush(); h.flow.review(); await h.flush(); }
const writes = h => h.calls.filter(call => call.action !== 'history').map(call => call.action);
async function waitForAudits(h, count) {
  for (let turn = 0; turn < 40; turn++) {
    await h.flush();
    if (h.auditEvents.length >= count) return;
    await new Promise(resolve => setTimeout(resolve, 5));
  }
  assert.fail(`Expected ${count} audit observations, received ${h.auditEvents.length}`);
}

test('the bound owner sees Ethereum funds without an SDK connection and refresh never initiates a transfer', async t => {
  const h = harness({ reown: { isConnected: false, isLinked: false } }); t.after(() => h.unmount());
  await h.flush(); assert.equal(h.flow.balanceAtomic, balanceAtomic); assert.equal(h.flow.connected, false);
  assert.equal(h.sdk.preflightBalanceReads.length, 0);
  h.flow.refresh(); await h.flush(); assert.equal(h.sdk.balanceReads.length, 2);
  h.flow.review(); await h.flow.confirm(); await h.flush();
  assert.deepEqual(writes(h), []); assert.equal(h.sdk.creations.length, 0); assert.equal(h.sdk.sends.length, 0);
});

test('a new session hides the old amount, balance, history and selected payment immediately while Reown still has the old address', async t => {
  const nextBalance = deferred(), nextHistory = deferred(); let balanceReads = 0, historyReads = 0;
  const h = harness({ balance: async () => ++balanceReads === 1 ? { balanceAtomic } : nextBalance.promise,
    history: async () => ++historyReads === 1 ? { records: [confirmed()] } : nextHistory.promise });
  t.after(() => h.unmount()); await h.flush();
  assert.equal(h.flow.history.length, 1);
  await preview(h, '5'); h.flow.setManualHash(transactionHash); await h.flush();
  const oldFlow = h.flow;
  const changed = await h.session({ subject: 'owner-B', email: 'member@example.test' }, false);
  assert.equal(changed.amount, ''); assert.equal(changed.balanceAtomic, null); assert.deepEqual(changed.history, []);
  assert.equal(changed.payment, null); assert.equal(changed.manualHash, ''); assert.equal(changed.recovery, null);
  assert.equal(changed.connected, false);
  oldFlow.review(); await oldFlow.confirm(); oldFlow.selectHistory(confirmed());
  await h.flush(); assert.deepEqual(writes(h), []); assert.equal(h.sdk.preflightBalanceReads.length, 1);
  assert.equal(h.flow.amount, ''); assert.deepEqual(h.flow.history, []); assert.equal(h.flow.payment, null);
  nextBalance.resolve({ balanceAtomic: '7000000' }); nextHistory.resolve({ records: [confirmed({ paymentId: otherId, amountAtomic: '7000000' })] });
  await h.flush(); assert.equal(h.flow.balanceAtomic, '7000000'); assert.equal(h.flow.amount, '7');
  assert.equal(h.flow.history[0].paymentId, otherId); assert.equal(h.flow.payment, null);
});

test('a session change aborts an SDK preflight before it can prepare or send under the next session', async t => {
  const preflight = deferred(), h = harness({ preflightBalance: () => preflight.promise });
  t.after(() => h.unmount()); await h.flush(); await preview(h);
  const confirming = h.flow.confirm(); await h.flush();
  assert.equal(h.flow.busy, true); const oldSignal = h.sdk.preflightBalanceReads[0].signal;
  await h.session({ subject: 'owner-B', email: 'member@example.test' });
  assert.equal(oldSignal.aborted, true); assert.equal(h.flow.payment, null); assert.equal(h.flow.busy, false);
  preflight.resolve({ balanceAtomic }); await confirming; await h.flush();
  assert.deepEqual(writes(h), []); assert.equal(h.sdk.creations.length, 0); assert.equal(h.sdk.sends.length, 0);
});

test('late owner reads cannot reappear after switching sessions away and back with the same linked address', async t => {
  const previousBalance = deferred(), previousHistory = deferred(); let balanceReads = 0, historyReads = 0;
  const h = harness({ balance: async () => ++balanceReads === 2 ? previousBalance.promise : { balanceAtomic: String(balanceReads * 1000000) },
    history: async () => ++historyReads === 2 ? previousHistory.promise : { records: [] } });
  t.after(() => h.unmount()); await h.flush(); h.flow.refresh(); await h.flush();
  const oldBalanceSignal = h.sdk.balanceReads[1].signal;
  await h.session({ subject: 'owner-B', email: 'member@example.test' });
  assert.equal(oldBalanceSignal.aborted, true);
  await h.session({ subject: 'owner-A', email: 'member@example.test' });
  assert.equal(h.flow.balanceAtomic, '4000000');
  previousBalance.resolve({ balanceAtomic: '99000000' }); previousHistory.resolve({ records: [confirmed()] });
  await h.flush(); assert.equal(h.flow.balanceAtomic, '4000000'); assert.deepEqual(h.flow.history, []);
  await h.session(null); assert.equal(h.flow.balanceAtomic, null); assert.equal(h.flow.amount, '');
  assert.deepEqual(h.flow.history, []); assert.equal(h.flow.payment, null);
  assert.deepEqual(writes(h), []); assert.equal(h.sdk.sends.length, 0);
});

test('an SDK on another chain cannot hide the read-only funds or create a payment before switching to Ethereum', async t => {
  const h = harness({ preflightBalance: async () => { throw Error('personal_company_chain_changed'); } }); t.after(() => h.unmount());
  await h.flush(); assert.equal(h.flow.balanceAtomic, balanceAtomic); assert.equal(h.sdk.preflightBalanceReads.length, 0);
  await preview(h); await h.flow.confirm(); await h.flush();
  assert.equal(h.flow.errorKey, 'companyPayment.switchNetwork'); assert.equal(h.flow.balanceAtomic, balanceAtomic);
  assert.deepEqual(writes(h), []); assert.equal(h.sdk.creations.length, 0);
});

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
    if (id === './CompanyPaymentActivity') return { default: () => null };
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

const polygonPayment = (patch = {}) => payment({ ...values.personalCompanyPaymentPolicy(137), amountAtomic: '7000000', ...patch });

test('selecting Ethereum or Polygon only changes the local amount and unsigned preview, never moving funds or summing balances', async t => {
  const h = harness(); t.after(() => h.unmount()); await h.flush();
  assert.equal(h.flow.chainId, 1); assert.equal(h.flow.amount, '25.123456');
  await preview(h, '5'); const oldFlow = h.flow, oldId = h.flow.payment.paymentId;
  h.flow.changeNetwork(137); await h.flush();
  assert.equal(h.flow.chainId, 137); assert.equal(h.flow.amount, '7'); assert.equal(h.flow.balanceAtomic, '7000000');
  assert.equal(h.flow.payment, null); assert.equal(h.flow.stage, 'form');
  oldFlow.review(); await oldFlow.confirm(); await h.flush();
  assert.equal(h.flow.payment, null); assert.deepEqual(writes(h), []);
  assert.equal(h.sdk.preflightBalanceReads.length, 1); assert.equal(h.sdk.creations.length, 0); assert.equal(h.sdk.networkSwitches.length, 0);
  h.flow.changeNetwork(42161); h.flow.changeNetwork('137'); h.flow.changeNetwork(); await h.flush(); assert.equal(h.flow.chainId, 137);
  await preview(h, '7'); assert.notEqual(h.flow.payment.paymentId, oldId);
  assert.equal(h.flow.payment.chainId, 137); assert.equal(h.flow.payment.tokenAddress, values.personalCompanyPaymentPolicy(137).tokenAddress);
  h.flow.changeNetwork(1); await h.flush(); assert.equal(h.flow.amount, '25.123456');
  assert.equal(h.flow.payment, null); assert.deepEqual(writes(h), []); assert.equal(h.sdk.sends.length, 0);
});

test('Polygon MAX prepares and signs only its own seven USDT using chain137, while SDK switching is a separate explicit action', async t => {
  const h = harness(); t.after(() => h.unmount()); await h.flush(); h.flow.changeNetwork(137); await h.flush();
  const form = find(page(h), node => node?.type === 'CompanyPaymentForm');
  assert.equal(form.props.chainId, 137); assert.equal(form.props.chainBalances.find(item => item.chainId === 1).balanceAtomic, balanceAtomic);
  form.props.onMax(); await h.flush(); assert.equal(h.flow.amount, '7');
  h.flow.review(); await h.flush(); await h.flow.confirm(); await h.flush();
  assert.equal(h.sdk.preflightBalanceReads[0].chainId, 137);
  assert.deepEqual(h.calls.find(call => call.action === 'prepare').input, { requestId: h.sdk.sends[0].prepared.paymentId, amountAtomic: '7000000', chainId: 137 });
  assert.equal(h.sdk.creations[0].chainId, 137); assert.equal(h.sdk.sends[0].prepared.tokenAddress, values.personalCompanyPaymentPolicy(137).tokenAddress);
  assert.equal(h.sdk.sends[0].config.reviewedBalanceAtomic, '7000000'); assert.equal(h.sdk.networkSwitches.length, 0);
  await h.flow.switchNetwork(); await h.flush(); assert.deepEqual(h.sdk.networkSwitches, ['polygon']);
});

test('a failed Ethereum read leaves Polygon spendable and pending records keep their immutable selected chain', async t => {
  const h = harness({ balances: async () => ({ walletAddress: wallet, balances: [
    { chainId: 1, balanceAtomic: null, error: 'company_payment_rpc_unavailable' }, { chainId: 137, balanceAtomic: '7000000' },
  ] }) }); t.after(() => h.unmount()); await h.flush(); assert.equal(h.flow.balanceAtomic, null);
  h.flow.changeNetwork(137); await h.flush(); assert.equal(h.flow.balanceAtomic, '7000000'); assert.equal(h.flow.amount, '7'); assert.equal(h.flow.errorKey, '');
  h.flow.selectHistory(polygonPayment()); await h.flush(); h.flow.changeNetwork(1); await h.flush();
  assert.equal(h.flow.chainId, 137); assert.equal(h.flow.payment.paymentId, paymentId); assert.equal(h.flow.errorKey, 'companyPayment.pendingExists');
  h.flow.resume(); await h.flush(); assert.equal(h.flow.stage, 'review'); assert.equal(h.flow.payment.chainId, 137);
  assert.deepEqual(writes(h), []); assert.equal(h.sdk.sends.length, 0);
});

test('Polygon history restores chain137 and a prepare acknowledgement cannot reuse that UUID for Ethereum', async t => {
  const h = harness({ history: async () => ({ records: [polygonPayment()] }),
    write: async (action,input) => { assert.equal(action,'prepare'); return payment({ paymentId: input.requestId, amountAtomic: input.amountAtomic }); } });
  t.after(() => h.unmount()); await h.flush(); assert.equal(h.flow.chainId,137); assert.equal(h.flow.payment.chainId,137);
  h.flow.resume(); await h.flush(); await h.flow.confirm(); await h.flush();
  assert.equal(h.calls.find(call=>call.action==='prepare').input.chainId,137);
  assert.equal(h.flow.payment.chainId,137); assert.equal(h.sdk.creations.length,0); assert.equal(h.sdk.sends.length,0);
  assert.equal(h.flow.errorKey,'companyPayment.walletMismatch');
  h.flow.selectHistory(payment({ amountAtomic:'7000000' })); await h.flush();
  assert.equal(h.flow.payment.chainId,137); assert.equal(h.flow.chainId,137);
});

test('signing recovery and a submitted transaction cannot be dropped by selecting the other network', async t => {
  for (const mode of ['recovery','submitted']) {
    const storage = new Map();
    if(mode==='recovery') recovery.saveCompanyRecovery({getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},
      {version:1,paymentId,walletAddress:wallet,amountAtomic:balanceAtomic,phase:'signing',transactionHash:null});
    const h = harness({ storage, history:async()=>({records:[mode==='submitted'?payment({status:'submitted',transactionHash}):payment()]}) });
    t.after(()=>h.unmount()); await h.flush(); h.flow.changeNetwork(137); await h.flush();
    assert.equal(h.flow.chainId,1); assert.equal(h.flow.payment.paymentId,paymentId);
    assert.equal(h.flow.stage,'status'); if(mode==='recovery')assert.ok(h.flow.recovery);
    assert.deepEqual(writes(h),[]); assert.equal(h.sdk.sends.length,0);
  }
});

test('restoring a linked wallet is one deduplicated auth operation and never prepares, signs or changes its recorded address', async t => {
  const pending = deferred(); let connections = 0;
  const h = harness({ reown: { isConnected: false, isLinked: false, connectWallet: () => { connections++; return pending.promise; },
    openConnect: () => assert.fail('the transfer bypassed the dedicated connection recovery'), linkWallet: () => assert.fail('a linked wallet was relinked') } });
  t.after(() => h.unmount()); await h.flush();
  const first = h.flow.connect(), second = h.flow.connect(); await h.flush();
  assert.equal(connections, 1); assert.equal(h.flow.busy, true); assert.equal(h.flow.wallet, wallet);
  assert.deepEqual(writes(h), []); assert.equal(h.sdk.preflightBalanceReads.length, 0); assert.equal(h.sdk.sends.length, 0);
  pending.resolve({ connected: true }); await Promise.all([first, second]); await h.flush();
  assert.equal(h.flow.busy, false); assert.equal(h.flow.wallet, wallet); assert.deepEqual(writes(h), []);
});

test('automatic restoration and an old session cannot open another connection or publish a late auth failure', async t => {
  const restoring = harness({ reown: { isConnected: false, isLinked: false, isRestoring: true, connectWallet: () => assert.fail('restoration triggered another auth modal') } });
  t.after(() => restoring.unmount()); await restoring.flush(); await restoring.flow.connect();
  assert.equal(restoring.flow.restoring, true); assert.deepEqual(writes(restoring), []);
  const pending = deferred(); const h = harness({ reown: { isConnected: false, isLinked: false, connectWallet: () => pending.promise } });
  t.after(() => h.unmount()); await h.flush(); const operation = h.flow.connect(); await h.flush();
  await h.session({ subject: 'owner-B', email: 'member@example.test' });
  pending.reject(new Error('wallet_connection_timeout')); await operation; await h.flush();
  assert.equal(h.flow.busy, false); assert.equal(h.flow.errorKey, ''); assert.deepEqual(writes(h), []);
});

test('an SDK-connected unlinked wallet offers explicit verification and never links or transfers from an effect', async t => {
  let links = 0;
  const reownState = { linkedAddress: '', linkStatus: 'unlinked', isConnected: true, isLinked: false,
    connectWallet: () => assert.fail('a connected wallet was asked to authenticate again'),
    linkWallet: async () => { links++; Object.assign(reownState,{linkedAddress:wallet,linkStatus:'linked',isLinked:true}); return {linked:true,address:wallet}; } };
  const h = harness({reown:reownState}); t.after(()=>h.unmount()); await h.flush();
  assert.equal(h.flow.needsVerification,true); assert.equal(h.flow.connected,false); assert.equal(links,0);
  assert.deepEqual(writes(h),[]); assert.equal(h.sdk.sends.length,0);
  const form = find(page(h), node => node?.type==='CompanyPaymentForm'); assert.equal(form.props.needsVerification,true);
  await h.flow.connect(); await h.flush();
  assert.equal(links,1); assert.equal(h.flow.wallet,wallet); assert.equal(h.flow.verified,true); assert.equal(h.flow.connected,true); assert.equal(h.flow.needsVerification,false);
  assert.deepEqual(writes(h),[]); assert.equal(h.sdk.preflightBalanceReads.length,0); assert.equal(h.sdk.sends.length,0);
});

test('Review performs one bounded read-only live wallet preflight and cannot prepare, sign or send a payment', async t => {
  const pending=deferred(); const h=harness({preflightBalance:()=>pending.promise});t.after(()=>h.unmount());await h.flush();
  h.flow.changeNetwork(137); await h.flush(); h.flow.setAmount('7'); await h.flush();
  const first=h.flow.review(), duplicate=h.flow.review();await h.flush();
  assert.equal(h.flow.busy,true);assert.equal(h.flow.payment,null);assert.equal(h.sdk.preflightBalanceReads.length,1);
  const options=h.sdk.preflightBalanceReads[0];assert.equal(options.chainId,137);assert.equal(options.walletAddress,wallet);assert.equal(options.readTimeoutMs,10000);assert.ok(options.signal instanceof AbortSignal);
  assert.deepEqual(writes(h),[]);assert.equal(h.sdk.creations.length,0);assert.equal(h.sdk.sends.length,0);
  pending.resolve({balanceAtomic:'7000000'});await Promise.all([first,duplicate]);await h.flush();
  assert.equal(h.flow.stage,'review');assert.equal(h.flow.payment.chainId,137);assert.equal(h.flow.busy,false);
  assert.deepEqual(writes(h),[]);assert.equal(h.sdk.creations.length,0);assert.equal(h.sdk.sends.length,0);
});

test('Review exposes wrong-chain and RPC failures, and a changed live balance requires another explicit review', async t => {
  for(const [message,key] of [['personal_company_chain_changed','companyPayment.switchNetwork'],['personal_company_rpc_unavailable','companyPayment.networkUnavailable']]) {
    const h=harness({preflightBalance:async()=>{throw Error(message);}});t.after(()=>h.unmount());await h.flush();
    await h.flow.review();await h.flush();assert.equal(h.flow.payment,null);assert.equal(h.flow.stage,'form');assert.equal(h.flow.errorKey,key);
    assert.deepEqual(writes(h),[]);assert.equal(h.sdk.sends.length,0);
  }
  const h=harness({preflightBalance:async()=>({balanceAtomic:'30000000'})});t.after(()=>h.unmount());await h.flush();
  await h.flow.review();await h.flush();assert.equal(h.flow.balanceAtomic,'30000000');assert.equal(h.flow.payment,null);assert.equal(h.flow.errorKey,'companyPayment.balanceChanged');
  await h.flow.review();await h.flush();assert.equal(h.flow.stage,'review');assert.deepEqual(writes(h),[]);assert.equal(h.sdk.sends.length,0);
});

test('only a prepared transfer reports bounded client observations and rejecting a wallet never confirms payment', async t => {
  const h = harness(); t.after(() => h.unmount()); await h.flush(); await preview(h);
  assert.deepEqual(h.auditEvents, []);
  await h.flow.confirm(); await waitForAudits(h, 2);
  const events = h.auditEvents.map(({ input }) => input);
  assert.deepEqual(events.map(value => value.event).sort(), ['wallet_prompt_opened', 'wallet_rejected']);
  assert.ok(events.every(value => value.paymentId === paymentId && value.attemptId === otherId));
  assert.ok(events.every(value => /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value.eventId)));
  assert.ok(events.every(value => Object.keys(value).every(key => ['eventId', 'paymentId', 'attemptId', 'event', 'code'].includes(key))));
  assert.equal(events.find(value => value.event === 'wallet_rejected').code, 'user_rejected');
  assert.equal(h.flow.payment.status, 'prepared'); assert.equal(h.flow.payment.transactionHash, null);
  assert.deepEqual(writes(h), ['prepare']); assert.equal(h.sdk.sends.length, 1);
});

test('an audit outage cannot block the canonical prepare, wallet result or mandatory hash recovery', async t => {
  const h = harness({ audit: async () => { throw Error('offline'); },
    async send(options) {
      options.onDispatchStart(); options.onStateChange({ phase: 'signing', transactionMayExist: true });
      options.onStateChange({ phase: 'reviewing', transactionMayExist: false, errorCode: 'private raw provider details' });
      throw Error('private raw provider details');
    } });
  t.after(() => h.unmount()); await h.flush(); await preview(h); await h.flow.confirm(); await waitForAudits(h, 2);
  assert.deepEqual(writes(h), ['prepare']); assert.equal(h.sdk.sends.length, 1);
  assert.ok(h.auditEvents.every(({ input }) => !JSON.stringify(input).includes('private raw provider details')));
  assert.equal(h.auditEvents.find(({ input }) => input.event === 'wallet_failed').input.code, 'unknown');
  assert.equal(h.flow.busy, false); assert.equal(h.flow.recovery, null);
});

test('an ambiguous send retains and registers a late hash after unmount while reporting observations without a client confirmation', async () => {
  let callback;
  const h = harness({ async send(options) {
    options.onDispatchStart(); options.onStateChange({ phase: 'signing', transactionMayExist: true });
    options.onStateChange({ phase: 'ambiguous', transactionMayExist: true, errorCode: 'personal_company_broadcast_ambiguous' });
    callback = options.onBroadcast; return { phase: 'ambiguous' };
  } });
  await h.flush(); await preview(h); await h.flow.confirm(); await waitForAudits(h, 2);
  assert.equal(h.flow.recovery.phase, 'signing'); h.unmount();
  await callback({ transactionHash }); await waitForAudits(h, 3);
  assert.deepEqual(writes(h), ['prepare', 'submit']); assert.equal(h.sdk.sends.length, 1);
  assert.equal(recovery.readCompanyRecovery(h.localStorage, wallet, paymentId).transactionHash, transactionHash);
  assert.equal(recovery.readCompanyRecovery(h.localStorage, wallet, paymentId).attemptId, otherId);
  assert.deepEqual(h.auditEvents.map(({ input }) => input.event).sort(), ['broadcast_observed', 'broadcast_uncertain', 'wallet_prompt_opened']);
  assert.equal(h.auditEvents.find(({ input }) => input.event === 'broadcast_observed').input.transactionHash, transactionHash);
});

test('legacy recovery observations are idempotent across reloads, omit unknown attempts and never dispatch another transfer', async () => {
  const storage = new Map(), marker = { version: 1, paymentId, walletAddress: wallet, chainId: 1,
    amountAtomic: balanceAtomic, phase: 'broadcast', transactionHash };
  const a = harness({ storage, history: async () => ({ records: [payment()] }) });
  recovery.saveCompanyRecovery(a.localStorage, marker);
  await waitForAudits(a, 1); const event = a.auditEvents[0].input;
  assert.equal(event.event, 'recovery_detected'); assert.equal('attemptId' in event, false);
  a.flow.refresh(); await a.flush(); assert.equal(a.auditEvents.length, 1);
  a.unmount();
  const b = harness({ storage, history: async () => ({ records: [payment()] }) });
  try {
    await waitForAudits(b, 1); assert.deepEqual(b.auditEvents[0].input, event);
    await b.flow.verifyPayment(); await waitForAudits(b, 2);
    assert.ok(b.auditEvents.some(({ input }) => input.event === 'verification_requested' && input.transactionHash === transactionHash));
    assert.equal(b.flow.payment.status, 'confirmed');
    assert.ok(b.auditEvents.every(({ input }) => !['confirmed', 'submitted', 'failed'].includes(input.event)));
    assert.equal(b.sdk.sends.length, 0); assert.deepEqual(writes(b), ['submit', 'verify']);
  } finally { b.unmount(); }
});

test('an old owner audit scope becomes inactive and late hash observations cannot publish under a new session', async t => {
  let callback;
  const h = harness({ async send(options) {
    options.onDispatchStart(); options.onStateChange({ phase: 'signing', transactionMayExist: true });
    callback = options.onBroadcast; return { phase: 'ambiguous' };
  } }); t.after(() => h.unmount());
  await h.flush(); await preview(h); await h.flow.confirm(); await waitForAudits(h, 1);
  const scope = h.auditEvents[0].options.isActive; assert.equal(scope(), true);
  await h.session({ subject: 'owner-B', email: 'member@example.test' }); assert.equal(scope(), false);
  await callback({ transactionHash }); await h.flush();
  assert.equal(h.auditEvents.length, 1); assert.equal(h.flow.payment, null); assert.equal(h.flow.recovery, null);
  assert.equal(h.sdk.sends.length, 1);
});

test('registration and verification failures remain distinct observations while recovery reuses the known hash without another send', async t => {
  let submits = 0;
  const h = harness({
    async write(action, input) {
      if (action === 'prepare') return payment({ paymentId: input.requestId });
      if (action === 'submit') {
        if (++submits === 1) throw Error('company_payment_rpc_unavailable');
        return payment({ status: 'submitted', transactionHash });
      }
      assert.equal(action, 'verify'); throw Error('provider details that must stay private');
    },
    async send(options) {
      options.onDispatchStart(); options.onStateChange({ phase: 'signing', transactionMayExist: true });
      await options.onBroadcast({ transactionHash }); return { phase: 'broadcast', transactionHash };
    },
  }); t.after(() => h.unmount());
  await h.flush(); await preview(h); await h.flow.confirm(); await waitForAudits(h, 3);
  assert.equal(h.auditEvents.find(({ input }) => input.event === 'registration_failed').input.code, 'registration_unavailable');
  assert.equal(h.flow.recovery.transactionHash, transactionHash);
  await h.flow.verifyPayment(); await waitForAudits(h, 6);
  const failed = h.auditEvents.find(({ input }) => input.event === 'verification_failed').input;
  assert.equal(failed.code, 'verification_unavailable'); assert.equal(failed.transactionHash, transactionHash); assert.equal(failed.attemptId, otherId);
  assert.ok(h.auditEvents.some(({ input }) => input.event === 'recovery_detected'));
  assert.ok(h.auditEvents.some(({ input }) => input.event === 'verification_requested'));
  assert.ok(h.auditEvents.every(({ input }) => !JSON.stringify(input).includes('provider details')));
  assert.equal(h.sdk.sends.length, 1); assert.deepEqual(writes(h), ['prepare', 'submit', 'submit', 'verify']);
  assert.equal(h.flow.payment.status, 'submitted'); assert.equal(h.flow.recovery.attemptId, otherId);
});

test('refresh adopts the exact canonical confirmation, clears only its recovery and refreshes the balance before enabling another payment', async t => {
  let settled = false, notifications = 0;
  const h = harness({ history: async () => ({ records: [settled ? confirmed() : payment({ status: 'submitted', transactionHash })] }),
    balance: async () => ({ balanceAtomic: settled ? '0' : balanceAtomic }) }); t.after(() => h.unmount());
  h.browser.addEventListener('vp:personal-wallet-balance-changed', () => notifications++);
  recovery.saveCompanyRecovery(h.localStorage, { version: 1, paymentId, walletAddress: wallet, chainId: 1,
    amountAtomic: balanceAtomic, phase: 'submitted', transactionHash });
  await h.flush(); assert.equal(h.flow.payment.status, 'submitted'); assert.ok(h.flow.recovery);
  h.flow.setManualHash(transactionHash); await h.flush(); settled = true; h.flow.refresh(); await h.flush();
  assert.equal(h.flow.payment.status, 'confirmed'); assert.equal(h.flow.recovery, null); assert.equal(h.flow.transfer, null);
  assert.equal(h.flow.manualHash, ''); assert.equal(h.flow.balanceAtomic, '0'); assert.equal(h.flow.errorKey, '');
  assert.equal(notifications, 1);
  h.flow.refresh(); await h.flush(); h.flow.selectHistory(confirmed()); await h.flush();
  assert.equal(notifications, 1, 're-reading an already confirmed payment must not loop shared balance refreshes');
  assert.equal(recovery.readCompanyRecovery(h.localStorage, wallet, paymentId), null);
  await h.flow.confirm(); await h.flush(); assert.equal(h.sdk.sends.length, 0); assert.deepEqual(writes(h), []);
  h.flow.newPayment(); await h.flush(); assert.equal(h.flow.stage, 'form'); assert.equal(h.flow.payment, null);
});

test('a late ambiguous state and matching broadcast cannot recreate a guard over a canonical payment already received', async t => {
  let settled = false, callbacks;
  const h = harness({ history: async () => ({ records: settled ? [confirmed()] : [] }),
    async send(options) {
      callbacks = options; options.onDispatchStart();
      options.onStateChange({ paymentId, phase: 'ambiguous', transactionMayExist: true }); return { phase: 'ambiguous' };
    } }); t.after(() => h.unmount());
  await h.flush(); await preview(h); await h.flow.confirm(); await h.flush(); assert.ok(h.flow.recovery);
  settled = true; h.flow.refresh(); await h.flush(); assert.equal(h.flow.payment.status, 'confirmed');
  callbacks.onStateChange({ paymentId, phase: 'ambiguous', transactionMayExist: true });
  await callbacks.onBroadcast({ transactionHash }); await h.flush();
  assert.equal(h.flow.recovery, null); assert.equal(h.flow.transfer, null); assert.equal(h.flow.errorKey, '');
  assert.equal(recovery.readCompanyRecovery(h.localStorage, wallet, paymentId), null);
  assert.deepEqual(writes(h), ['prepare']); assert.equal(h.sdk.sends.length, 1);
  h.flow.newPayment(); await h.flush(); assert.equal(h.flow.stage, 'form'); assert.equal(h.flow.payment, null);
});

test('a different recovery hash or changed immutable payment is never silently cleared by a canonical receipt', async () => {
  const otherHash = `0x${'9'.repeat(64)}`;
  for (const mismatch of ['hash', 'amount']) {
    let settled = false;
    const h = harness({ history: async () => ({ records: settled ? [confirmed(mismatch === 'amount' ? { amountAtomic: '1000000' } : {})] : [payment()] }) });
    try {
      recovery.saveCompanyRecovery(h.localStorage, { version: 1, paymentId, walletAddress: wallet, chainId: 1,
        amountAtomic: balanceAtomic, phase: 'broadcast', transactionHash: mismatch === 'hash' ? otherHash : transactionHash });
      await h.flush(); settled = true; h.flow.refresh(); await h.flush();
      assert.ok(h.flow.recovery); assert.ok(recovery.readCompanyRecovery(h.localStorage, wallet, paymentId));
      assert.equal(h.flow.errorKey, 'companyPayment.paymentFailed');
      const previous = h.flow.payment; h.flow.newPayment(); await h.flush(); assert.equal(h.flow.payment, previous);
      assert.deepEqual(writes(h), []); assert.equal(h.sdk.sends.length, 0);
    } finally { h.unmount(); }
  }
});

test('foreground polling verifies only a submitted canonical hash and stops at confirmation without resending', async t => {
  const timers = clock(); let verifications = 0, settled = false;
  class PollDate extends Date { static now() { return timers.now; } }
  const h = harness({ Date: PollDate, setTimeout: timers.setTimeout, clearTimeout: timers.clearTimeout,
    history: async () => ({ records: [settled ? confirmed() : payment({ status: 'submitted', transactionHash })] }),
    balance: async () => ({ balanceAtomic: settled ? '0' : balanceAtomic }),
    write: async action => { assert.equal(action, 'verify'); verifications++; settled = true; return confirmed(); } });
  t.after(() => h.unmount()); await h.flush(); timers.tick(11_999); await h.flush(); assert.equal(verifications, 0);
  timers.tick(1); await h.flush(); assert.equal(verifications, 1); assert.equal(h.flow.payment.status, 'confirmed');
  assert.equal(h.flow.balanceAtomic, '0'); assert.equal(h.flow.recovery, null); assert.equal(h.flow.stage, 'status');
  timers.tick(60_000); await h.flush(); assert.equal(verifications, 1); assert.equal(h.sdk.sends.length, 0);
  assert.deepEqual(writes(h), ['verify']); h.flow.newPayment(); await h.flush(); assert.equal(h.flow.stage, 'form');
});

test('polling pauses hidden tabs, aborts an active verification on logout and expires after a fixed fifteen-minute window', async () => {
  const timers = clock(), pending = deferred(); let verifications = 0;
  class PollDate extends Date { static now() { return timers.now; } }
  const h = harness({ Date: PollDate, setTimeout: timers.setTimeout, clearTimeout: timers.clearTimeout,
    history: async () => ({ records: [payment({ status: 'submitted', transactionHash })] }),
    write: async (action, _input, options) => { assert.equal(action, 'verify'); verifications++;
      assert.ok(options.signal); return pending.promise; } });
  try {
    await h.flush(); h.documentRef.visibilityState = 'hidden'; h.documentRef.dispatchEvent(new Event('visibilitychange'));
    timers.tick(24_000); await h.flush(); assert.equal(verifications, 0);
    h.documentRef.visibilityState = 'visible'; h.documentRef.dispatchEvent(new Event('visibilitychange')); timers.tick(12_000); await h.flush();
    assert.equal(verifications, 1); const signal = h.calls.find(value => value.action === 'verify').options.signal;
    timers.tick(60_000); await h.flush(); assert.equal(verifications, 1, 'a second verification overlapped the first');
    await h.session(null); assert.equal(signal.aborted, true);
    pending.resolve(confirmed()); await h.flush(); assert.equal(h.flow.payment, null); assert.equal(h.flow.balanceAtomic, null);
  } finally { h.unmount(); }
  const boundedClock = clock(); let checks = 0;
  class BoundedDate extends Date { static now() { return boundedClock.now; } }
  const bounded = harness({ Date: BoundedDate, setTimeout: boundedClock.setTimeout, clearTimeout: boundedClock.clearTimeout,
    history: async () => ({ records: [payment({ status: 'submitted', transactionHash })] }),
    write: async () => { checks++; return payment({ status: 'submitted', transactionHash }); } });
  try {
    await bounded.flush(); boundedClock.tick(12_000); await bounded.flush(); assert.equal(checks, 1);
    boundedClock.tick(15 * 60_000); await bounded.flush(); assert.equal(checks, 1);
    boundedClock.tick(60_000); await bounded.flush(); assert.equal(checks, 1);
  } finally { bounded.unmount(); }
});

test('unregistered ambiguous drafts are never automatically verified or signed by the polling timer', async t => {
  const timers = clock(), h = harness({ setTimeout: timers.setTimeout, clearTimeout: timers.clearTimeout,
    history: async () => ({ records: [payment()] }) }); t.after(() => h.unmount());
  recovery.saveCompanyRecovery(h.localStorage, { version: 1, paymentId, walletAddress: wallet, chainId: 1,
    amountAtomic: balanceAtomic, phase: 'signing', transactionHash: null });
  await h.flush(); timers.tick(15 * 60_000); await h.flush();
  assert.deepEqual(writes(h), []); assert.equal(h.sdk.sends.length, 0); assert.ok(h.flow.recovery);
});
