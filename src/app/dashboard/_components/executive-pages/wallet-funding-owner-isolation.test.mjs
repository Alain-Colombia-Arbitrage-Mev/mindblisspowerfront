import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { walletFundingOwnerKey } from '../../../../lib/wallet-funding-owner.mjs';
import { fundingStatus, fundingConfirmation, FUNDING_UUID } from '../../../../lib/wallet-funding-contract.mjs';
import { personalFundingFailure } from '../../../../lib/personal-funding-errors.mjs';
import { translateMessage } from '../../../../i18n/translate.mjs';
import { startAdministrativeMeldOnramp } from '../../../../lib/administrative-onramp-client.mjs';
import { administrativeCheckoutReturn } from '../../../../lib/administrative-checkout-return.mjs';
import * as meldCheckoutContract from '../../../../lib/administrative-meld-checkout-contract.mjs';
import * as administrativeSigningContract from '../../../../lib/administrative-signing-contract.mjs';
import * as administrativeInjected from '../../../../lib/administrative-injected-provider.mjs';

const require = createRequire(import.meta.url);
const ownerA = { subject: 'owner-A', email: 'a@example.test' }, ownerB = { subject: 'owner-B', email: 'b@example.test' };
const referenceA = '11111111-1111-4111-8111-111111111111', referenceB = '22222222-2222-4222-8222-222222222222';
const walletA = `0x${'a'.repeat(40)}`;
const deferred = () => { let resolve, reject; const promise = new Promise((done, fail) => { resolve = done; reject = fail; }); return { promise, resolve, reject }; };
const record = (reference, amount = 100) => ({ checkoutReference: reference, requestedAmount: amount, sourceCurrencyCode: 'USD', status: 'initiated', createdAt: '2026-11-12T00:00:00.000Z' });
const status = (reference = referenceA, wallet = walletA) => ({ walletKind: 'administrative', environment: 'sandbox', provider: 'meld',
  checkoutReference: reference, requestedAmount: 100, sourceCurrencyCode: 'USD', country: 'US', requestStatus: 'session_created',
  destination: { address: wallet, asset: 'USDT', network: 'polygon', chainId: 137 }, confirmation: { state: 'unconfirmed', source: 'none', testMode: true } });
function WalletFundingScreen({ children }) { return React.createElement('section', null, children); }
function WalletFundingHistory() { return null; }
function WalletFundingStatus() { return null; }
function WalletFundingStatusView() { return null; }
function AdministrativeMeldCheckoutActivity() { return null; }
function AdministrativeWalletOperations() { return null; }
function AdministrativeTransferDraft() { return null; }
function AdministrativeOfframpMethods() { return null; }
function PersonalFundingForm() { return null; }
function AdministrativeSandboxFundingForm() { return null; }

function harness(filename, { api = {}, reown = {}, administrative = {}, checkout = {}, generic = {}, signing = {}, injected = {}, exportName = 'default' } = {}) {
  const cells = [], effects = [];
  let cursor = 0, dirty = true, tree, member = ownerA, attributes = {}, disposed = false;
  const changed = (left, right) => !left || !right || left.length !== right.length || left.some((value, i) => !Object.is(value, right[i]));
  const hooks = {
    useId: () => 'administrative-operations-test',
    useRef(initial) { const at = cursor++; return cells[at] ??= { current: initial }; },
    useState(initial) { const at = cursor++, cell = cells[at] ??= { value: typeof initial === 'function' ? initial() : initial };
      cell.set ??= update => { const next = typeof update === 'function' ? update(cell.value) : update; if (!Object.is(next, cell.value)) { cell.value = next; dirty = true; } };
      return [cell.value, cell.set]; },
    useCallback(callback, deps) { const at = cursor++, cell = cells[at] ??= {};
      if (changed(cell.deps, deps)) { cell.value = callback; cell.deps = deps; } return cell.value; },
    useEffect(callback, deps) { const at = cursor++, cell = cells[at] ??= {};
      if (changed(cell.deps, deps)) { cell.deps = deps; effects.push(() => { cell.cleanup?.(); cell.cleanup = callback(); }); } },
  };
  const mocks = { react: hooks, 'react/jsx-runtime': require('react/jsx-runtime'),
    'lucide-react': new Proxy({}, { get: () => () => null }),
    'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children) },
    '@/i18n/LanguageProvider': { useI18n: () => ({ locale: 'es', t: (key, values) => translateMessage('es', key, values) }) },
    '@/lib/member-session-context': { useMemberSession: () => member },
    '@/lib/administrative-wallet.mjs': administrative, '@/lib/administrative-onramp-client.mjs': checkout,
    '@/lib/administrative-checkout-return.mjs': { administrativeCheckoutReturn },
    '@/lib/administrative-meld-checkout-contract.mjs': meldCheckoutContract,
    '@/lib/administrative-meld-checkout-client.mjs': { readAdministrativeMeldCheckoutCapabilities: async () => ({ configured: false }), ...generic },
    './AdministrativeMeldCheckoutActivity': { default: AdministrativeMeldCheckoutActivity }, './AdministrativeOfframpMethods': { default: AdministrativeOfframpMethods },
    './AdministrativeWalletOperations': { default: AdministrativeWalletOperations }, './AdministrativeTransferDraft': { default: AdministrativeTransferDraft },
    '@/lib/administrative-signing-contract.mjs': administrativeSigningContract,
    '@/lib/administrative-signing-client.mjs': { readAdministrativeSignerCapabilities: async () => ({ configured: false }), ...signing },
    '@/lib/administrative-injected-provider.mjs': { ...administrativeInjected, discoverAdministrativeProviders: () => () => {}, ...injected },
    '@/lib/wallet-funding-owner.mjs': { walletFundingOwnerKey },
    '@/lib/wallet-funding-client.mjs': api, '@/lib/wallet-funding-contract.mjs': { fundingStatus, fundingConfirmation, FUNDING_UUID },
    '@/lib/personal-funding-errors.mjs': { personalFundingFailure }, '@/components/reown/ReownContext': { useReownWallet: () => reown },
    '@/components/wallet/PersonalWalletBalances': { default: () => null }, './WalletFundingForm': { PersonalFundingForm, AdministrativeSandboxFundingForm },
    './ResidenceImportantCard': { default: function ResidenceImportantCard() { return null; } },
    './WalletFundingTutorial': { default: () => null },
    './WalletFundingHistory': { default: WalletFundingHistory }, './WalletFundingStatus': { default: WalletFundingStatus, WalletFundingStatusView },
    './WalletFundingUI': { WalletFundingScreen, WalletActionError: () => null, WalletAddress: () => null, ProviderNote: () => null,
      administrativeFundingError: () => 'sandbox error', walletFailureDiagnostic: () => '' },
  };
  const module = { exports: {} }, code = ts.transpileModule(readFileSync(new URL(filename, import.meta.url), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  new Function('require', 'module', 'exports', code)(id => {
    if (id.endsWith('.module.css')) return { default: new Proxy({}, { get: (_target, key) => key }) };
    assert.ok(Object.hasOwn(mocks, id), `Unexpected owner-isolation dependency: ${id}`); return mocks[id];
  }, module, module.exports);
  const render = (props = attributes) => { attributes = props; cursor = 0; dirty = false; tree = module.exports[exportName](props); return tree; };
  return { render, get tree() { return tree; }, get member() { return member; },
    owner(next) { member = next; return render(); },
    async flush() { for (let turn = 0, quiet = 0; turn < 50; turn++) {
      if (dirty) render(); while (effects.length) effects.shift()(); await new Promise(resolve => setImmediate(resolve));
      if (dirty || effects.length) quiet = 0; else if (++quiet === 2) return tree;
    } assert.fail('Owner isolation component did not settle'); },
    unmount() { if (disposed) return; disposed = true; for (const cell of cells) cell?.cleanup?.(); },
  };
}
const all = (node, predicate) => [...(predicate(node) ? [node] : []), ...React.Children.toArray(node?.props?.children).flatMap(child => all(child, predicate))];
const find = (node, name) => all(node, child => child?.type?.name === name)[0];
const html = tree => renderToStaticMarkup(tree);

test('funding history immediately hides the previous owner and independently reloads A → B → A and logout', async t => {
  const calls = [], selected = [];
  const h = harness('WalletFundingHistory.jsx', { api: { readWalletFundingHistory(kind, { signal }) {
    const pending = deferred(); calls.push({ kind, signal, ...pending }); return pending.promise;
  } } }); t.after(() => h.unmount());
  h.render({ walletKind: 'administrative', refreshKey: 0, onSelectRequest: value => selected.push(value) }); await h.flush();
  assert.equal(calls.length, 1); calls[0].resolve({ records: [record(referenceA)] }); await h.flush();
  assert.ok(html(h.tree).includes(referenceA.slice(-8)));
  const staleAction = all(h.tree, node => node?.type === 'button' && node.props.className === 'historyAction')[0];
  h.owner(ownerB); assert.ok(!html(h.tree).includes(referenceA.slice(-8)), 'No prior-owner rows may render before effects run');
  staleAction.props.onClick(); assert.deepEqual(selected, []);
  await h.flush(); assert.equal(calls.length, 2); calls[1].resolve({ records: [record(referenceB, 200)] }); await h.flush();
  assert.ok(html(h.tree).includes(referenceB.slice(-8))); assert.ok(!html(h.tree).includes(referenceA.slice(-8)));
  h.owner(ownerA); assert.ok(!html(h.tree).includes(referenceA.slice(-8))); assert.ok(!html(h.tree).includes(referenceB.slice(-8)));
  await h.flush(); assert.equal(calls.length, 3); calls[2].resolve({ records: [record(referenceA, 300)] }); await h.flush();
  assert.ok(html(h.tree).includes(referenceA.slice(-8)));
  h.owner(null); assert.equal(h.tree, null); await h.flush(); assert.equal(calls.length, 3);
});

test('a status reference cannot retain another owner destination or reuse its cached proof after A → B → A', async t => {
  const calls = [];
  const h = harness('WalletFundingStatus.jsx', { api: { readWalletFundingStatus(kind, reference, { signal }) {
    const pending = deferred(); calls.push({ kind, reference, signal, ...pending }); return pending.promise;
  } } }); t.after(() => h.unmount());
  h.render({ walletKind: 'administrative', checkoutReference: referenceA }); await h.flush(); calls[0].resolve(status()); await h.flush();
  assert.equal(find(h.tree, 'WalletFundingStatusView')?.props.view.destination.address, walletA);
  h.owner(ownerB); assert.equal(find(h.tree, 'WalletFundingStatusView'), undefined); await h.flush(); assert.equal(calls.length, 2);
  calls[1].reject(new Error('wallet_funding_not_found')); await h.flush();
  assert.ok(html(h.tree).includes(translateMessage('es', 'funding.statusNotFound'))); assert.equal(find(h.tree, 'WalletFundingStatusView'), undefined);
  h.owner(ownerA); assert.equal(find(h.tree, 'WalletFundingStatusView'), undefined); await h.flush(); assert.equal(calls.length, 3);
  calls[2].resolve(status()); await h.flush(); assert.equal(find(h.tree, 'WalletFundingStatusView')?.props.view.destination.address, walletA);
  h.owner(null); assert.equal(h.tree, null); await h.flush(); assert.equal(calls.length, 3);
});

test('late funding reads from A or B cannot populate the returned A session, logout or an unmounted view', async t => {
  for (const surface of ['history', 'status']) {
    const calls = [], read = (...args) => { const pending = deferred(); calls.push({ signal: args.at(-1).signal, ...pending }); return pending.promise; };
    const h = harness(surface === 'history' ? 'WalletFundingHistory.jsx' : 'WalletFundingStatus.jsx', {
      api: surface === 'history' ? { readWalletFundingHistory: read } : { readWalletFundingStatus: read },
    }); t.after(() => h.unmount());
    const props = surface === 'history' ? { walletKind: 'administrative', refreshKey: 0, onSelectRequest() {} } : { walletKind: 'administrative', checkoutReference: referenceA };
    h.render(props); await h.flush(); h.owner(ownerB); await h.flush(); h.owner(ownerA); await h.flush();
    assert.equal(calls.length, 3); assert.equal(calls[0].signal.aborted, true); assert.equal(calls[1].signal.aborted, true);
    calls[0].resolve(surface === 'history' ? { records: [record(referenceA)] } : status());
    calls[1].reject(new Error('Synthetic previous-owner failure')); await h.flush();
    assert.equal(find(h.tree, 'WalletFundingStatusView'), undefined); assert.ok(!html(h.tree).includes(walletA));
    assert.ok(!html(h.tree).includes(referenceA.slice(-8))); assert.ok(!html(h.tree).includes(referenceB.slice(-8)));
    h.owner(null); assert.equal(h.tree, null); await h.flush(); assert.equal(calls[2].signal.aborted, true);
    calls[2].resolve(surface === 'history' ? { records: [record(referenceA)] } : status()); await h.flush(); assert.equal(h.tree, null);
    h.owner(ownerA); await h.flush(); assert.equal(calls.length, 4);
    h.unmount(); assert.equal(calls[3].signal.aborted, true);
    calls[3].resolve(surface === 'history' ? { records: [record(referenceA)] } : status());
    await new Promise(resolve => setImmediate(resolve)); assert.equal(calls.length, 4);
  }
});

test('a changed subject is a new owner even with the same email, and a missing owner never starts a funding read', async t => {
  let reads = 0;
  const h = harness('WalletFundingHistory.jsx', { api: { async readWalletFundingHistory() { reads++; return { records: [record(referenceA)] }; } } });
  t.after(() => h.unmount()); h.owner(null); h.render({ walletKind: 'administrative', onSelectRequest() {} }); await h.flush(); assert.equal(reads, 0); assert.equal(h.tree, null);
  h.owner(ownerA); await h.flush(); assert.equal(reads, 1); assert.ok(html(h.tree).includes(referenceA.slice(-8)));
  h.owner({ subject: ownerB.subject, email: ownerA.email }); assert.ok(!html(h.tree).includes(referenceA.slice(-8)));
  await h.flush(); assert.equal(reads, 2);
});

test('the complete administrative form remounts for each native owner and never mounts without a session', async t => {
  const h = harness('AdministrativeWalletFundingPage.jsx'); t.after(() => h.unmount());
  const first = h.render({ environment: 'sandbox' });
  assert.equal(first.key, walletFundingOwnerKey(ownerA));
  const second = h.owner(ownerB); assert.notEqual(second.key, first.key);
  assert.equal(h.owner(null), null);
});

test('a checkout return selects a native owner-scoped status read without trusting claimed payment values', async t => {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', { value: { dispatchEvent() {}, location: { search: `?checkoutReference=${referenceA}&status=paid&amount=999999&walletAddress=other` } }, configurable: true });
  t.after(() => { if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow); else delete globalThis.window; });
  let checkouts = 0;
  const h = harness('AdministrativeWalletFundingPage.jsx', { exportName: 'AdministrativeWalletFundingView',
    administrative: { async readAdministrativeWallet() { return { status: 'assigned', address: walletA }; } },
    checkout: { async startAdministrativeMeldOnramp() { checkouts++; assert.fail('A return must not start another checkout'); } } });
  t.after(() => h.unmount()); h.render({ environment: 'sandbox' }); await h.flush();
  assert.deepEqual(find(h.tree, 'WalletFundingStatus').props, { walletKind: 'administrative', checkoutReference: referenceA, focusKey: 1 });
  assert.equal(checkouts, 0);
});

test('leaving the administrative form cancels its pending quote/session and cannot open a late checkout', async t => {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', { value: { dispatchEvent() {} }, configurable: true });
  t.after(() => { if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow); else delete globalThis.window; });
  const pending = deferred(), requests = [], opened = [];
  const h = harness('AdministrativeWalletFundingPage.jsx', { exportName: 'AdministrativeWalletFundingView',
    administrative: { async readAdministrativeWallet() { return { status: 'assigned', address: walletA }; } },
    checkout: { startAdministrativeMeldOnramp: (input, { signal }) => { assert.equal(input.address, walletA); return startAdministrativeMeldOnramp(input, {
      signal, createSession: async (_body, options) => { requests.push(options.signal); return pending.promise; }, openCheckout: url => opened.push(url),
    }); } } }); t.after(() => h.unmount());
  h.render({ environment: 'sandbox' }); await h.flush();
  const submit = find(h.tree, 'AdministrativeSandboxFundingForm').props.onContinue;
  const operation = submit({ requestId: referenceA, address: `0x${'b'.repeat(40)}`, amount: 150, sourceCurrencyCode: 'MXN', countryCode: 'MX', serviceProvider: 'TRANSAK', paymentMethodType: 'CREDIT_DEBIT_CARD' });
  assert.equal(requests.length, 1);
  await submit({}); assert.equal(requests.length, 1, 'duplicate click cannot register another checkout');
  h.unmount(); assert.equal(requests[0].aborted, true);
  pending.resolve({ checkoutReference: referenceA, walletKind: 'administrative', environment: 'sandbox', provider: 'meld', status: 'session_created', requestedAmount: 150,
    sourceCurrencyCode: 'MXN', createdAt: '2026-11-12T00:00:00Z', checkoutUrl: 'https://sb.meldcrypto.com/widget?token=synthetic' });
  await assert.rejects(operation, { name: 'AbortError' }); assert.deepEqual(opened, []);
  await submit({}); assert.equal(requests.length, 1, 'obsolete owner cannot initiate another operation');
});

function testWindow(t, search = '') {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', { value: { dispatchEvent() {}, location: { search } }, configurable: true });
  t.after(() => { if (previous) Object.defineProperty(globalThis, 'window', previous); else delete globalThis.window; });
}
const generalStatus = (reference = referenceA) => ({ ...status(reference), checkoutType: 'meld_checkout', requestStatus: 'minted', createdAt: '2026-11-12T12:00:00Z' });

test('disabled generic capability performs no mint or generic status/history reads, even on a return or a captured CTA', async t => {
  testWindow(t, `?meldCheckoutReference=${referenceA}&success=true`); let creates = 0, reads = 0;
  const h = harness('AdministrativeWalletFundingPage.jsx', { exportName: 'AdministrativeWalletFundingView',
    administrative: { async readAdministrativeWallet() { return { status: 'assigned', address: walletA }; } },
    generic: { readAdministrativeMeldCheckoutCapabilities: async () => ({ configured: false }),
      startAdministrativeMeldCheckout: async () => { creates++; }, readAdministrativeMeldCheckoutHistory: async () => { reads++; }, readAdministrativeMeldCheckoutStatus: async () => { reads++; } } });
  t.after(() => h.unmount()); h.render({ environment: 'sandbox' }); await h.flush();
  const form = find(h.tree, 'AdministrativeSandboxFundingForm'); assert.equal(form.props.checkoutCapability.configured, false);
  await form.props.onOpenCheckout({ requestId: referenceA, country: 'US', sourceCurrencyCode: 'USD', amount: 100 });
  form.props.onShowCheckoutHistory(); await h.flush();
  assert.equal(find(h.tree, 'AdministrativeMeldCheckoutActivity'), undefined); assert.equal(find(h.tree, 'WalletFundingStatus'), undefined);
  assert.equal(creates, 0); assert.equal(reads, 0);
});

test('general return selects only its namespace after capability discovery; manual mint overrides injected wallet/provider and coalesces clicks', async t => {
  testWindow(t, `?meldCheckoutReference=${referenceA}&status=paid&amount=999999`);
  const pending = deferred(), minted = [];
  const h = harness('AdministrativeWalletFundingPage.jsx', { exportName: 'AdministrativeWalletFundingView',
    administrative: { async readAdministrativeWallet() { return { status: 'assigned', address: walletA }; } },
    generic: { readAdministrativeMeldCheckoutCapabilities: async () => ({ configured: true }), startAdministrativeMeldCheckout: async (body, options) => { minted.push({ body, options }); return pending.promise; } } });
  t.after(() => h.unmount()); h.render({ environment: 'sandbox' }); await h.flush();
  assert.equal(find(h.tree, 'WalletFundingStatus'), undefined);
  assert.equal(find(h.tree, 'AdministrativeMeldCheckoutActivity').props.checkoutReference, referenceA);
  const submit = find(h.tree, 'AdministrativeSandboxFundingForm').props.onOpenCheckout;
  const operation = submit({ requestId: referenceB, country: 'MX', sourceCurrencyCode: 'MXN', amount: 500, address: 'malicious', serviceProvider: 'unknown' });
  await submit({}); assert.equal(minted.length, 1);
  assert.deepEqual(minted[0].body, { requestId: referenceB, country: 'MX', sourceCurrencyCode: 'MXN', amount: 500 }); assert.equal(minted[0].options.expectedAddress, walletA);
  h.unmount(); assert.equal(minted[0].options.signal.aborted, true); pending.resolve({ checkoutReference: referenceB }); await operation;
  await submit({}); assert.equal(minted.length, 1);
});

test('a captured page mint callback cannot issue another POST after the backend reports configuration missing', async t => {
  testWindow(t); let calls = 0;
  const h = harness('AdministrativeWalletFundingPage.jsx', { exportName: 'AdministrativeWalletFundingView',
    administrative: { async readAdministrativeWallet() { return { status: 'assigned', address: walletA }; } },
    generic: { readAdministrativeMeldCheckoutCapabilities: async () => ({ configured: true }), startAdministrativeMeldCheckout: async () => { calls++; throw Error('wallet_funding_unconfigured'); } } });
  t.after(() => h.unmount()); h.render({ environment: 'sandbox' }); await h.flush();
  const submit = find(h.tree, 'AdministrativeSandboxFundingForm').props.onOpenCheckout;
  const body = { requestId: referenceA, country: 'US', sourceCurrencyCode: 'USD', amount: 100 };
  await assert.rejects(submit(body), /wallet_funding_unconfigured/);
  await submit(body); assert.equal(calls, 1, 'live capability retires the captured callback even before rerender');
  await h.flush(); assert.equal(find(h.tree, 'AdministrativeSandboxFundingForm').props.checkoutCapability.configured, false);
});

test('generic cached history and API status are owner-scoped and ignore late results across A → B → A and logout', async t => {
  const reads = [], selected = [];
  const h = harness('AdministrativeMeldCheckoutActivity.jsx', { generic: {
    readAdministrativeMeldCheckoutHistory: options => { const pending = deferred(); reads.push({ ...options, ...pending }); return pending.promise; },
  } }); t.after(() => h.unmount());
  h.render({ enabled: false, expectedAddress: walletA, onSelectRequest: value => selected.push(value) }); await h.flush(); assert.equal(reads.length, 0);
  h.render({ enabled: true, expectedAddress: walletA, onSelectRequest: value => selected.push(value) }); await h.flush(); assert.equal(reads.length, 1);
  reads[0].resolve({ records: [generalStatus()] }); await h.flush(); assert.ok(html(h.tree).includes(referenceA.slice(-8)));
  const action = all(h.tree, node => node?.type === 'button' && node.props.className === 'historyAction')[0];
  h.owner(ownerB); assert.ok(!html(h.tree).includes(referenceA.slice(-8))); action.props.onClick(); assert.deepEqual(selected, []); await h.flush();
  h.owner(ownerA); await h.flush(); assert.equal(reads.length, 3); assert.ok(reads.slice(0, 2).every(read => read.signal.aborted));
  reads[1].resolve({ records: [generalStatus(referenceB)] }); await h.flush(); assert.ok(!html(h.tree).includes(referenceB.slice(-8)));
  h.owner(null); assert.equal(h.tree, null); await h.flush(); assert.equal(reads[2].signal.aborted, true); assert.equal(reads.length, 3);
});

test('a generic minted link remains unconfirmed; verified API test proof appears only after a manual owned status refresh', async t => {
  let statusReads = 0;
  const completed = { ...generalStatus(), confirmation: { state: 'confirmed', source: 'meld_sandbox_api', testMode: true, providerStatus: 'SETTLED',
    transactionId: 'sandbox-test-transaction', receivedAmount: '99.123456', confirmedAt: '2026-11-12T12:10:00Z', serviceProvider: 'TRANSAK', paymentMethodType: 'CREDIT_DEBIT_CARD' } };
  const h = harness('AdministrativeMeldCheckoutActivity.jsx', { generic: { readAdministrativeMeldCheckoutHistory: async () => ({ records: [] }),
    readAdministrativeMeldCheckoutStatus: async () => ++statusReads === 1 ? generalStatus() : completed } }); t.after(() => h.unmount());
  h.render({ enabled: true, expectedAddress: walletA, checkoutReference: referenceA }); await h.flush();
  assert.equal(statusReads, 1); assert.equal(find(h.tree, 'WalletFundingStatusView'), undefined); assert.ok(html(h.tree).includes(translateMessage('es', 'funding.meldCheckoutPreparedCopy')));
  assert.ok(!html(h.tree).includes('Transak'));
  const refresh = all(h.tree, node => node?.type === 'button' && React.Children.toArray(node.props.children).includes(translateMessage('es', 'funding.statusRefresh')))[0];
  refresh.props.onClick(); await h.flush(); assert.equal(statusReads, 2); assert.equal(find(h.tree, 'WalletFundingStatusView').props.view.receivedAmount, '99.123456');
  assert.ok(html(h.tree).includes('Transak'));
  await h.flush(); assert.equal(statusReads, 2, 'no automatic polling or payment retry');
});

const signingCapability = { flow: 'administrative_signing', configured: true, mode: 'external', environment: 'sandbox', chainId: 137, broadcastEnabled: false, canBroadcast: false, canPrepareOfframp: false };
const signingStatus = verified => ({ ...signingCapability, assignedAddress: walletA, verified, ...(verified ? { expiresAt: '2099-11-12T12:00:00.000Z' } : {}) });
function injectedWallet(account = walletA) {
  const calls = [], listeners = new Map();
  const provider = { async request(input) { calls.push(input); return input.method === 'eth_chainId' ? '0x89' : input.method === 'personal_sign' ? `0x${'ab'.repeat(65)}` : [account]; },
    on: (event, callback) => listeners.set(event, callback), removeListener: event => listeners.delete(event) };
  return { provider, calls, listeners, discovery: callback => { callback([{ id: 'test-wallet', name: 'Test wallet', provider }]); return () => {}; } };
}
const action = (tree, key) => all(tree, node => node?.type === 'button' && node.props.children === translateMessage('es', `administrativeSigning.${key}`))[0];

test('external signer wrapper remounts by native owner and the disabled feature never invokes wallet permissions or signing', async t => {
  const wrapper = harness('AdministrativeWalletOperations.jsx'); t.after(() => wrapper.unmount());
  const first = wrapper.render({ assignedAddress: walletA }), second = wrapper.owner(ownerB); assert.notEqual(first.key, second.key); assert.equal(wrapper.owner(null), null);
  const wallet = injectedWallet(); let statusReads = 0;
  const h = harness('AdministrativeWalletOperations.jsx', { exportName: 'OperationsView', signing: { readAdministrativeSignerCapabilities: async () => ({ ...signingCapability, configured: false }),
    readAdministrativeSignerStatus: async () => { statusReads++; return signingStatus(false); } }, injected: { discoverAdministrativeProviders: wallet.discovery } });
  t.after(() => h.unmount()); h.render({ assignedAddress: walletA, disabled: false }); await h.flush();
  assert.equal(statusReads, 0); assert.equal(wallet.calls.length, 0); assert.equal(find(h.tree, 'AdministrativeTransferDraft').props.signerReady, false);
});

test('reload restores an already-verified external signer using readonly wallet RPC only; account changes retire local readiness without another signature', async t => {
  const wallet = injectedWallet(); let challenges = 0;
  const h = harness('AdministrativeWalletOperations.jsx', { exportName: 'OperationsView', signing: { readAdministrativeSignerCapabilities: async () => signingCapability,
    readAdministrativeSignerStatus: async () => signingStatus(true), createAdministrativeSignerChallenge: async () => { challenges++; } }, injected: { discoverAdministrativeProviders: wallet.discovery } });
  t.after(() => h.unmount()); h.render({ assignedAddress: walletA, disabled: false }); await h.flush();
  assert.equal(find(h.tree, 'AdministrativeTransferDraft').props.signerReady, true); assert.equal(find(h.tree, 'AdministrativeOfframpMethods').props.signerReady, true);
  assert.equal(find(h.tree, 'AdministrativeOfframpMethods').props.offrampEnabled, false, 'native capability controls optional off-ramp reads separately from local signer readiness');
  const sellGuard = find(h.tree, 'AdministrativeOfframpMethods').props.canPrepare;
  assert.equal(sellGuard(), true);
  assert.deepEqual(wallet.calls.map(call => call.method), ['eth_accounts', 'eth_chainId']); assert.equal(challenges, 0);
  wallet.listeners.get('accountsChanged')([`0x${'2'.repeat(40)}`]); await h.flush();
  assert.equal(find(h.tree, 'AdministrativeTransferDraft').props.signerReady, false); assert.equal(wallet.calls.length, 2);
  assert.ok(html(h.tree).includes(translateMessage('es', 'administrativeSigning.verifiedInactive')));
  assert.equal(sellGuard(), false);
  h.unmount(); assert.equal(sellGuard(), false);
});

test('new signer permissions and ownership requests require separate explicit actions and a wrong account never obtains a challenge', async t => {
  const wallet = injectedWallet(`0x${'2'.repeat(40)}`); let challenges = 0, verifications = 0;
  const h = harness('AdministrativeWalletOperations.jsx', { exportName: 'OperationsView', signing: { readAdministrativeSignerCapabilities: async () => signingCapability,
    readAdministrativeSignerStatus: async () => signingStatus(false), createAdministrativeSignerChallenge: async () => { challenges++; }, verifyAdministrativeSigner: async () => { verifications++; } },
    injected: { discoverAdministrativeProviders: wallet.discovery } }); t.after(() => h.unmount());
  h.render({ assignedAddress: walletA, disabled: false }); await h.flush(); assert.equal(wallet.calls.length, 0);
  all(h.tree, node => node?.type === 'select')[0].props.onChange({ target: { value: 'test-wallet' } }); await h.flush();
  action(h.tree, 'connect').props.onClick(); await h.flush();
  assert.deepEqual(wallet.calls.map(call => call.method), ['eth_requestAccounts', 'eth_chainId']);
  assert.ok(html(h.tree).includes(translateMessage('es', 'administrativeSigning.mismatch'))); assert.equal(action(h.tree, 'verify'), undefined);
  assert.equal(challenges, 0); assert.equal(verifications, 0);
});

test('an explicit connect handles its own accountsChanged event with a fresh readonly check and does not auto-sign', async t => {
  const wallet = injectedWallet(); let challenges = 0;
  wallet.provider.request = async input => {
    wallet.calls.push(input);
    if (input.method === 'eth_requestAccounts') wallet.listeners.get('accountsChanged')?.([walletA]);
    return input.method === 'eth_chainId' ? '0x89' : [walletA];
  };
  const h = harness('AdministrativeWalletOperations.jsx', { exportName: 'OperationsView', signing: { readAdministrativeSignerCapabilities: async () => signingCapability,
    readAdministrativeSignerStatus: async () => signingStatus(false), createAdministrativeSignerChallenge: async () => { challenges++; } }, injected: { discoverAdministrativeProviders: wallet.discovery } });
  t.after(() => h.unmount()); h.render({ assignedAddress: walletA, disabled: false }); await h.flush();
  all(h.tree, node => node?.type === 'select')[0].props.onChange({ target: { value: 'test-wallet' } }); await h.flush();
  action(h.tree, 'connect').props.onClick(); await h.flush();
  assert.ok(action(h.tree, 'verify')); assert.equal(challenges, 0);
  assert.equal(wallet.calls.filter(call => call.method === 'eth_requestAccounts').length, 1);
  assert.ok(wallet.calls.some(call => call.method === 'eth_accounts')); assert.ok(!wallet.calls.some(call => call.method === 'personal_sign'));
});

test('explicit ownership signs one message and cannot complete verification after leaving the native owner view', async t => {
  const wallet = injectedWallet(), signed = deferred(); let challenges = 0, verifications = 0;
  wallet.provider.request = async input => { wallet.calls.push(input); return input.method === 'eth_chainId' ? '0x89' : input.method === 'personal_sign' ? signed.promise : [walletA]; };
  const h = harness('AdministrativeWalletOperations.jsx', { exportName: 'OperationsView', signing: { readAdministrativeSignerCapabilities: async () => signingCapability,
    readAdministrativeSignerStatus: async () => signingStatus(false), createAdministrativeSignerChallenge: async () => { challenges++; return { challengeId: referenceA, message: 'Administrative ownership message only. '.repeat(4) }; },
    verifyAdministrativeSigner: async () => { verifications++; return signingStatus(true); } }, injected: { discoverAdministrativeProviders: wallet.discovery } });
  t.after(() => h.unmount()); h.render({ assignedAddress: walletA, disabled: false }); await h.flush();
  all(h.tree, node => node?.type === 'select')[0].props.onChange({ target: { value: 'test-wallet' } }); await h.flush(); action(h.tree, 'connect').props.onClick(); await h.flush();
  assert.equal(challenges, 0); action(h.tree, 'verify').props.onClick(); await h.flush(); assert.equal(challenges, 1); assert.equal(wallet.calls.filter(call => call.method === 'personal_sign').length, 1);
  h.unmount(); signed.resolve(`0x${'ab'.repeat(65)}`); await new Promise(resolve => setImmediate(resolve)); assert.equal(verifications, 0);
  assert.ok(wallet.calls.every(call => !['eth_sendTransaction', 'eth_sendRawTransaction', 'wallet_sendCalls'].includes(call.method)));
});

test('transfer preview is manual, coalesces duplicate prepares, clears on edits and cannot run from a retired signer', async t => {
  const calls = [], pending = deferred();
  const h = harness('AdministrativeTransferDraft.jsx', { api: { fundingRequestId: () => referenceA }, signing: { prepareAdministrativeTransfer: async (...args) => { calls.push(args); return pending.promise; } } });
  t.after(() => h.unmount()); const props = { assignedAddress: walletA, signerReady: true, disabled: false, ensureActive: async () => {} };
  h.render(props); await h.flush(); assert.equal(calls.length, 0);
  all(h.tree, node => node?.type === 'input' && node.props.id.endsWith('-recipient'))[0].props.onChange({ target: { value: `0x${'2'.repeat(40)}` } }); await h.flush();
  all(h.tree, node => node?.type === 'input' && node.props.id.endsWith('-amount'))[0].props.onChange({ target: { value: '1.123456' } }); await h.flush();
  const submit = all(h.tree, node => node?.type === 'form')[0].props.onSubmit; submit({ preventDefault() {} }); submit({ preventDefault() {} }); await h.flush(); assert.equal(calls.length, 1);
  assert.deepEqual(calls[0][0], { requestId: referenceA, recipient: `0x${'2'.repeat(40)}`, amount: '1.123456' }); assert.equal(calls[0][1], walletA);
  h.render({ ...props, signerReady: false }); await h.flush(); assert.equal(calls[0][2].signal.aborted, true);
  pending.resolve({ recipient: `0x${'2'.repeat(40)}`, amount: '1.123456', draftReference: referenceA }); await h.flush(); assert.ok(!html(h.tree).includes(referenceA));
  submit({ preventDefault() {} }); await h.flush(); assert.equal(calls.length, 1);
});

test('an expired native transfer binding requests manual reactivation and does not retry the draft', async t => {
  let calls = 0, retired = 0;
  const h = harness('AdministrativeTransferDraft.jsx', { api: { fundingRequestId: () => referenceA }, signing: { prepareAdministrativeTransfer: async () => { calls++; throw Error('administrative_transfer_binding_required'); } } });
  t.after(() => h.unmount()); h.render({ assignedAddress: walletA, signerReady: true, disabled: false, ensureActive: async () => {}, onSignerInvalid: () => retired++ }); await h.flush();
  all(h.tree, node => node?.type === 'input' && node.props.id.endsWith('-recipient'))[0].props.onChange({ target: { value: `0x${'2'.repeat(40)}` } }); await h.flush();
  all(h.tree, node => node?.type === 'input' && node.props.id.endsWith('-amount'))[0].props.onChange({ target: { value: '1' } }); await h.flush();
  all(h.tree, node => node?.type === 'form')[0].props.onSubmit({ preventDefault() {} }); await h.flush();
  assert.equal(calls, 1); assert.equal(retired, 1); assert.ok(html(h.tree).includes(translateMessage('es', 'administrativeSigning.activateFirst')));
  await h.flush(); assert.equal(calls, 1);
});
