import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { walletFundingOwnerKey } from '../../../../lib/wallet-funding-owner.mjs';
import { fundingStatus, FUNDING_UUID } from '../../../../lib/wallet-funding-contract.mjs';
import { personalFundingFailure } from '../../../../lib/personal-funding-errors.mjs';
import { translateMessage } from '../../../../i18n/translate.mjs';
import { startAdministrativeMeldOnramp } from '../../../../lib/administrative-onramp-client.mjs';

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
function PersonalFundingForm() { return null; }
function AdministrativeSandboxFundingForm() { return null; }

function harness(filename, { api = {}, reown = {}, administrative = {}, checkout = {}, exportName = 'default' } = {}) {
  const cells = [], effects = [];
  let cursor = 0, dirty = true, tree, member = ownerA, attributes = {}, disposed = false;
  const changed = (left, right) => !left || !right || left.length !== right.length || left.some((value, i) => !Object.is(value, right[i]));
  const hooks = {
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
    '@/lib/wallet-funding-owner.mjs': { walletFundingOwnerKey },
    '@/lib/wallet-funding-client.mjs': api, '@/lib/wallet-funding-contract.mjs': { fundingStatus, FUNDING_UUID },
    '@/lib/personal-funding-errors.mjs': { personalFundingFailure }, '@/components/reown/ReownContext': { useReownWallet: () => reown },
    '@/components/wallet/PersonalWalletBalances': { default: () => null }, './WalletFundingForm': { PersonalFundingForm, AdministrativeSandboxFundingForm },
    './ResidenceImportantCard': { default: function ResidenceImportantCard() { return null; } },
    './WalletFundingTutorial': { default: () => null },
    './WalletFundingHistory': { default: WalletFundingHistory }, './WalletFundingStatus': { default: WalletFundingStatus },
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

test('leaving the administrative form cancels its pending quote/session and cannot open a late checkout', async t => {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', { value: { dispatchEvent() {} }, configurable: true });
  t.after(() => { if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow); else delete globalThis.window; });
  const pending = deferred(), requests = [], opened = [];
  const h = harness('AdministrativeWalletFundingPage.jsx', { exportName: 'AdministrativeWalletFundingView',
    administrative: { async readAdministrativeWallet() { return { status: 'assigned', address: walletA }; } },
    checkout: { startAdministrativeMeldOnramp: (input, { signal }) => startAdministrativeMeldOnramp(input, {
      signal, createSession: async (_body, options) => { requests.push(options.signal); return pending.promise; }, openCheckout: url => opened.push(url),
    }) } }); t.after(() => h.unmount());
  h.render({ environment: 'sandbox' }); await h.flush();
  const submit = find(h.tree, 'AdministrativeSandboxFundingForm').props.onContinue;
  const operation = submit({ requestId: referenceA, amount: 150, sourceCurrencyCode: 'MXN', countryCode: 'MX', serviceProvider: 'TRANSAK', paymentMethodType: 'CREDIT_DEBIT_CARD' });
  assert.equal(requests.length, 1);
  await submit({}); assert.equal(requests.length, 1, 'duplicate click cannot register another checkout');
  h.unmount(); assert.equal(requests[0].aborted, true);
  pending.resolve({ checkoutReference: referenceA, walletKind: 'administrative', environment: 'sandbox', provider: 'meld', status: 'session_created', requestedAmount: 150,
    sourceCurrencyCode: 'MXN', createdAt: '2026-11-12T00:00:00Z', checkoutUrl: 'https://sb.meldcrypto.com/widget?token=synthetic' });
  await assert.rejects(operation, { name: 'AbortError' }); assert.deepEqual(opened, []);
  await submit({}); assert.equal(requests.length, 1, 'obsolete owner cannot initiate another operation');
});
