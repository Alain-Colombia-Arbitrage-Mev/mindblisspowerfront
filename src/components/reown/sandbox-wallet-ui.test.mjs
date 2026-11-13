import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import ts from 'typescript';
import { translateMessage } from '../../i18n/translate.mjs';
import { sandboxWalletMessages } from '../../i18n/sandbox-wallet-messages.js';
import * as connection from '../../lib/wallet-reown-connection.mjs';
import * as callback from '../../lib/wallet-reown-checkout-return.mjs';
const require = createRequire(import.meta.url), address = `0x${'1'.repeat(40)}`, other = `0x${'2'.repeat(40)}`;
const subject = 'synthetic-owner', owner = connection.walletReownOwnerKey({ subject, email: 'owner@example.test' });
const expiry = () => new Date(Date.now() + 300000).toISOString();
const status = (changes = {}) => ({ configured: true, status: 'unlinked', verified: false, ...changes });
const proof = () => status({ status: 'linked', address, verified: true, expiresAt: expiry() });
const deferred = () => { let resolve; return { promise: new Promise(done => { resolve = done; }), resolve }; };
const settle = () => new Promise(resolve => setImmediate(resolve));
const find = (node, match) => match(node) ? node : React.Children.toArray(node?.props?.children).map(child => find(child, match)).find(Boolean);
const all = node => [node, ...React.Children.toArray(node?.props?.children).flatMap(all)];

function harness(path, exportName, mocks) {
  const state = [], refs = [], effects = [], callbacks = [], memos = [], queue = [];
  let si = 0, ri = 0, ei = 0, ci = 0, mi = 0;
  const same = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const hooks = { ...React, useState(initial) { const i = si++; if (!(i in state)) state[i] = typeof initial === 'function' ? initial() : initial;
    return [state[i], next => { state[i] = typeof next === 'function' ? next(state[i]) : next; }]; },
    useRef(initial) { return refs[ri++] ||= { current: initial }; },
    useCallback(fn, deps) { const i = ci++; if (!same(callbacks[i]?.deps, deps)) callbacks[i] = { deps, fn }; return callbacks[i].fn; },
    useMemo(fn, deps) { const i = mi++; if (!same(memos[i]?.deps, deps)) memos[i] = { deps, value: fn() }; return memos[i].value; },
    useEffect(effect, deps) { const i = ei++, old = effects[i]; if (!same(old?.deps, deps)) queue.push(() => { old?.cleanup?.(); effects[i] = { deps, effect, cleanup: effect() }; }); } };
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, module = { exports: {} };
  new Function('require', 'module', 'exports', code)(id => { if (id === 'react') return hooks; if (id === 'react/jsx-runtime') return require(id); assert.ok(Object.hasOwn(mocks, id), id); return mocks[id]; }, module, module.exports);
  let tree, props = {};
  return { render(next = props) { props = next; si = ri = ei = ci = mi = 0; tree = module.exports[exportName](props); while (queue.length) queue.shift()(); return tree; },
    async settle() { await settle(); this.render(); await settle(); return this.render(); }, unmount() { for (const effect of effects) effect?.cleanup?.(); },
    get value() { return tree.props.value; }, get tree() { return tree; } };
}

function bindingFixture(t, { initial = status(), walletAddress = address, challengePromise = null } = {}) {
  const calls = { status: 0, challenge: 0, signature: 0, verify: 0, reads: 0 }, wallet = { isConnected: true, address: walletAddress, chainId: 137, provider: { request: async () => [] } };
  const h = harness('./SandboxWalletBindingProvider.jsx', 'OwnedSandboxWalletBinding', {
    '@/lib/member-session-context': { useMemberSession: () => ({ subject, email: 'owner@example.test' }) }, '@/lib/wallet-reown-connection.mjs': connection,
    './WalletReownContext': { useWalletReown: () => wallet }, '@/lib/member-logout-sync.mjs': { subscribeMemberLogout: () => () => {} }, '@/lib/member-session-sync.mjs': { subscribeMemberSessionReplacement: () => () => {} },
    '@/lib/sandbox-wallet-client.mjs': { readSandboxWalletStatus: async options => { calls.status++; assert.equal(options.ownerSubject, subject); return initial; },
      requestSandboxWalletChallenge: async (value, options) => { calls.challenge++; assert.equal(value, walletAddress); assert.equal(options.ownerSubject, subject); return challengePromise || { challengeId: 'fixture', message: 'validated ownership fixture' }; },
      verifySandboxWallet: async (input, value, options) => { calls.verify++; assert.deepEqual(Object.keys(input), ['challengeId', 'signature']); assert.equal(value, walletAddress); assert.equal(options.ownerSubject, subject); return proof(); } },
    '@/lib/administrative-injected-provider.mjs': { readAdministrativeProvider: async () => { calls.reads++; return { address: walletAddress, chainId: '0x89' }; }, switchAdministrativeProviderNetwork: async () => assert.fail('no automatic network switch'),
      administrativeProviderMatches: (value, expected) => value.address === expected && value.chainId === '0x89', signAdministrativeOwnership: async () => { calls.signature++; return 'synthetic-proof'; } },
  });
  h.render({ owner, ownerSubject: subject }); t.after(() => h.unmount()); return { h, calls, wallet };
}

test('one shared owned status read never activates automatically; explicit activation is duplicate locked', async t => {
  const { h, calls } = bindingFixture(t); await h.settle(); h.render();
  assert.deepEqual(calls, { status: 1, challenge: 0, signature: 0, verify: 0, reads: 0 }); assert.equal(h.value.canFund(), false);
  const first = h.value.activate(); await h.value.activate(); await first; await h.settle();
  assert.equal(calls.challenge, 1); assert.equal(calls.signature, 1); assert.equal(calls.verify, 1); assert.equal(h.value.canFund(), true);
});
test('immutable linked-address mismatch blocks challenge and signatures', async t => {
  const { h, calls } = bindingFixture(t, { initial: proof(), walletAddress: other }); await h.settle(); assert.equal(h.value.mismatch, true);
  await h.value.activate(); assert.equal(calls.challenge, 0); assert.equal(calls.signature, 0); assert.equal(h.value.canFund(), false);
});
test('expiry is checked live by captured canFund without another render', async t => {
  const initial = proof(), { h } = bindingFixture(t, { initial }); await h.settle(); const allowed = h.value.canFund; assert.equal(allowed(), true);
  t.mock.method(Date, 'now', () => Date.parse(initial.expiresAt) + 1); assert.equal(allowed(), false);
});
test('a late challenge after unmount cannot start a signature or verification', async t => {
  const wait = deferred(), { h, calls } = bindingFixture(t, { challengePromise: wait.promise }); await h.settle();
  const pending = h.value.activate(); await settle(); h.unmount(); wait.resolve({ challengeId: 'fixture', message: 'validated ownership fixture' }); await pending;
  assert.equal(calls.signature, 0); assert.equal(calls.verify, 0);
});

function pageFixture(t, search = '') {
  const savedWindow = Object.getOwnPropertyDescriptor(globalThis, 'window'), savedDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const events = new EventTarget(), popups = [], opened = [], calls = [];
  const browser = { location: { search, hash: '' }, addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events),
    open: () => { const popup = { closed: false, opener: 'fixture', close() { this.closed = true; }, location: { replace: url => opened.push(url) } }; popups.push(popup); return popup; } };
  Object.defineProperty(globalThis, 'window', { configurable: true, value: browser }); Object.defineProperty(globalThis, 'document', { configurable: true, value: { getElementById: () => null } });
  t.after(() => { h.unmount(); if (savedWindow) Object.defineProperty(globalThis, 'window', savedWindow); else delete globalThis.window;
    if (savedDocument) Object.defineProperty(globalThis, 'document', savedDocument); else delete globalThis.document; });
  let fundable = true;
  const wallet = { isConnected: true, address, chainId: 137, provider: {} }, binding = { loading: false, configured: true, status: 'linked', linkedAddress: address, address,
    canFund: () => fundable, retire() { fundable = false; }, invalidateActivation() { fundable = false; } };
  const Form = () => null, History = () => null, Status = () => null, wait = deferred();
  const h = harness('../../app/dashboard/_components/executive-pages/SandboxWalletFundingPage.jsx', 'SandboxWalletFundingView', {
    'lucide-react': new Proxy({}, { get: () => () => null }), '@/lib/member-session-context': { useMemberSession: () => ({ subject, email: 'owner@example.test' }) },
    '@/components/reown/WalletReownContext': { useWalletReown: () => wallet }, '@/components/reown/SandboxWalletBindingProvider': { useSandboxWalletBinding: () => binding },
    '@/lib/wallet-reown-connection.mjs': connection,
    '@/lib/sandbox-wallet-client.mjs': { createSandboxWalletCheckout: async (input, target, options) => { calls.push({ input, target, options }); return wait.promise; },
      readSandboxWalletOptions: async (...args) => { calls.push(args); return {}; }, readSandboxWalletFundingHistory: async () => ({ records: [] }), readSandboxWalletFundingStatus: async () => ({}) },
    '@/lib/sandbox-wallet-contract.mjs': { SANDBOX_WALLET_COUNTRIES: ['US', 'MX', 'CO'] }, '@/lib/wallet-reown-checkout-return.mjs': callback,
    '@/i18n/LanguageProvider': { useI18n: () => ({ t: (key, values) => translateMessage('es', key, values) }) },
    './WalletFundingForm': { AdministrativeSandboxFundingForm: Form }, './WalletFundingHistory': { default: History }, './WalletFundingStatus': { default: Status },
    './WalletFundingUI': { administrativeFundingError: () => 'safe failure', WalletActionError: () => null, WalletAddress: () => null },
    './wallet-funding.module.css': { default: {} }, './sandbox-wallet.module.css': { default: {} },
  });
  h.render({ ownerSubject: subject });
  return { h, Form, History, Status, calls, popups, opened, wait, wallet, setFundable: value => { fundable = value; } };
}

test('new form uses only Transak and native countries; an expired captured submit starts no popup or checkout', async t => {
  const f = pageFixture(t), form = find(f.h.tree, node => node?.type === f.Form);
  assert.deepEqual(form.props.providersAllowed, ['TRANSAK']); assert.deepEqual(form.props.countriesAllowed, ['US', 'MX', 'CO']);
  assert.equal(all(f.h.tree).filter(node => node?.type === f.History).length, 1, 'previous activity remains unmounted while collapsed');
  f.setFundable(false); await form.props.onContinue({ serviceProvider: 'TRANSAK' }); assert.equal(f.calls.length, 0); assert.equal(f.popups.length, 0);
});
test('checkout sends one manual native request without a destination body and cancels navigation after a connection change', async t => {
  const f = pageFixture(t), form = find(f.h.tree, node => node?.type === f.Form), input = { requestId: 'synthetic', countryCode: 'MX', sourceCurrencyCode: 'MXN', amount: 1000, paymentMethodType: 'CREDIT_DEBIT_CARD', serviceProvider: 'TRANSAK' };
  const pending = form.props.onContinue(input); await form.props.onContinue(input);
  assert.equal(f.calls.length, 1); assert.equal(f.popups.length, 1); assert.equal(f.popups[0].opener, null); assert.equal(f.calls[0].options.ownerSubject, subject);
  assert.deepEqual(Object.keys(f.calls[0].input), ['requestId', 'country', 'sourceCurrencyCode', 'amount', 'paymentMethodType']); assert.equal(f.calls[0].target, address);
  f.wallet.address = other; f.h.render(); assert.equal(f.calls[0].options.signal.aborted, true); assert.equal(f.popups[0].closed, true);
  f.wait.resolve({ checkoutReference: 'synthetic', checkoutUrl: 'https://sb.meldcrypto.com/?token=fixture' }); await pending; assert.deepEqual(f.opened, []);
});
test('new wallet messages are complete in four locales and keep Sandbox disclosures', () => {
  const keys = Object.keys(sandboxWalletMessages.es.sandboxWallet).sort();
  for (const locale of ['es', 'en', 'ar', 'zh']) { const catalog = sandboxWalletMessages[locale].sandboxWallet;
    assert.deepEqual(Object.keys(catalog).sort(), keys); for (const key of keys) assert.ok(catalog[key].trim());
    assert.match(catalog.sandbox, /Sandbox/); assert.equal(translateMessage(locale, 'sandboxWallet.title'), catalog.title);
  }
});
test('a return URL selects only a new-ledger owned status read and cannot assert completion or open checkout', t => {
  const reference = 'd8a4c010-cc33-44da-a297-8b3c6440f491', f = pageFixture(t, `?sandboxCheckoutReference=${reference}`);
  f.h.render(); const status = find(f.h.tree, node => node?.type === f.Status);
  assert.equal(status.props.checkoutReference, reference); assert.equal(status.props.expectedAddress, address);
  assert.equal(typeof status.props.readStatus, 'function'); assert.equal(f.calls.length, 0); assert.equal(f.popups.length, 0);
});
test('a late SDK restoration preserves callback selection for the same immutable linked address', t => {
  const reference = 'd8a4c010-cc33-44da-a297-8b3c6440f491', f = pageFixture(t, `?sandboxCheckoutReference=${reference}`);
  f.h.render(); assert.equal(find(f.h.tree, node => node?.type === f.Status).props.checkoutReference, reference);
  f.wallet.provider = {}; f.h.render(); f.h.render();
  assert.equal(find(f.h.tree, node => node?.type === f.Status).props.checkoutReference, reference);
  assert.equal(f.calls.length, 0); assert.equal(f.popups.length, 0);
});
