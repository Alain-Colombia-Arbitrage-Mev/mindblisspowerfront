import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import ts from 'typescript';
import { FUNDING_UUID } from '../../../../lib/wallet-funding-contract.mjs';
import { personalFundingFailure } from '../../../../lib/personal-funding-errors.mjs';
import { personalWalletBalanceSessionKey } from '../../../../lib/personal-wallet-balance-store.mjs';
import { translateMessage } from '../../../../i18n/translate.mjs';

const require = createRequire(import.meta.url);
const ownerA = { subject: 'action-owner-A', email: 'a@example.test' };
const ownerB = { subject: 'action-owner-B', email: 'b@example.test' };
const address = `0x${'1'.repeat(40)}`;
const referenceA = '11111111-1111-4111-8111-111111111111';
const referenceB = '22222222-2222-4222-8222-222222222222';
const input = { countryCode: 'US', sourceCurrencyCode: 'USD', amount: 100, paymentMethodType: 'CREDIT_DEBIT_CARD' };
const deferred = () => { let resolve, reject; const promise = new Promise((done, fail) => { resolve = done; reject = fail; }); return { promise, resolve, reject }; };
function PersonalFundingForm() { return null; }
function WalletFundingStatus() { return null; }

function harness() {
  const cells = [], effects = [], requests = [];
  let cursor = 0, dirty = true, tree, member = ownerA, cancellations = 0;
  const changed = (a, b) => !a || a.length !== b.length || a.some((value, i) => !Object.is(value, b[i]));
  const hooks = {
    useRef(initial) { const at = cursor++; return cells[at] ??= { current: initial }; },
    useState(initial) { const at = cursor++, cell = cells[at] ??= { value: initial };
      cell.set ??= update => { const next = typeof update === 'function' ? update(cell.value) : update; if (!Object.is(cell.value, next)) { cell.value = next; dirty = true; } }; return [cell.value, cell.set]; },
    useEffect(callback, deps) { const cell = cells[cursor++] ??= {}; if (changed(cell.deps, deps)) { cell.deps = deps; effects.push(() => { cell.cleanup?.(); cell.cleanup = callback(); }); } },
    useCallback(callback, deps) { const cell = cells[cursor++] ??= {}; if (changed(cell.deps, deps)) { cell.deps = deps; cell.value = callback; } return cell.value; },
  };
  const reown = { configured: true, linkStatus: 'linked', linkedAddress: address, isConnected: true, address, onrampStatus: 'idle',
    startOnramp(selection) { const pending = deferred(); requests.push({ selection, ...pending }); return pending.promise; },
    cancelOnramp() { cancellations++; }, clearOnrampError() {},
  };
  const mocks = {
    react: hooks, 'react/jsx-runtime': require('react/jsx-runtime'), 'lucide-react': new Proxy({}, { get: () => () => null }),
    'next/link': { default: () => null }, '@/components/reown/ReownContext': { useReownWallet: () => reown },
    '@/components/wallet/PersonalWalletBalances': { default: () => null },
    '@/i18n/LanguageProvider': { useI18n: () => ({ t: (key, values) => translateMessage('es', key, values) }) },
    '@/lib/member-session-context': { useMemberSession: () => member },
    '@/lib/personal-wallet-balance-store.mjs': { personalWalletBalanceSessionKey },
    '@/lib/personal-funding-errors.mjs': { personalFundingFailure }, '@/lib/wallet-funding-contract.mjs': { FUNDING_UUID },
    './WalletFundingForm': { PersonalFundingForm }, './WalletFundingStatus': { default: WalletFundingStatus },
    './ResidenceImportantCard': { default: () => null },
    './WalletFundingTutorial': { default: () => null },
    './WalletFundingUI': { WalletFundingScreen: ({ children }) => children, WalletActionError: () => null, WalletAddress: () => null, walletFailureDiagnostic: () => '' },
  };
  const module = { exports: {} };
  const code = ts.transpileModule(readFileSync(new URL('PersonalWalletFundingPage.jsx', import.meta.url), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  new Function('require', 'module', 'exports', code)(id => {
    if (id.endsWith('.module.css')) return { default: new Proxy({}, { get: (_target, key) => key }) };
    assert.ok(Object.hasOwn(mocks, id), `Unexpected action-state dependency: ${id}`); return mocks[id];
  }, module, module.exports);
  function render() { cursor = 0; dirty = false; tree = module.exports.PersonalWalletFunding(); return tree; }
  return { render, requests, reown, get tree() { return tree; }, get cancellations() { return cancellations; },
    owner(next) { member = next; return render(); },
    async flush() { for (let turn = 0, quiet = 0; turn < 50; turn++) {
      if (dirty) render(); while (effects.length) effects.shift()(); await new Promise(resolve => setImmediate(resolve));
      if (dirty || effects.length) quiet = 0; else if (++quiet === 2) return tree;
    } assert.fail('Action state did not settle'); },
    unmount() { for (const cell of cells) cell?.cleanup?.(); },
  };
}
const all = (node, predicate) => [...(predicate(node) ? [node] : []), ...React.Children.toArray(node?.props?.children).flatMap(child => all(child, predicate))];
const form = h => all(h.tree, node => node?.type === PersonalFundingForm)[0].props;
const selected = h => all(h.tree, node => node?.type === WalletFundingStatus)[0]?.props.checkoutReference;
const cancel = h => all(h.tree, node => node?.type === 'button' && node.props.children === translateMessage('es', 'funding.cancelConnection'))[0].props.onClick;

test('checkout becomes busy immediately and coalesces repeated handlers before an SDK state update', async t => {
  const h = harness(); t.after(() => h.unmount()); h.render(); await h.flush();
  const callback = form(h).onContinue, pending = callback({ ...input, walletAddress: `0x${'9'.repeat(40)}` });
  const duplicate = await callback(input); await h.flush();
  assert.equal(h.requests.length, 1); assert.equal(duplicate.pending, true);
  assert.equal(h.requests[0].selection.walletAddress, address, 'Only the backend-linked destination is passed to the provider');
  assert.equal(form(h).busy, true, 'Form must not depend on an SDK rerender to lock its controls');
  h.requests[0].resolve({ opened: true, checkoutReference: referenceA }); await pending; await h.flush();
  assert.equal(form(h).busy, false); assert.equal(selected(h), referenceA);
});

test('a canceled checkout cannot restore its confirmation or unlock a newer pending request', async t => {
  const h = harness(); t.after(() => h.unmount()); h.render(); await h.flush();
  const old = form(h).onContinue(input); await h.flush(); cancel(h)(); await h.flush();
  assert.equal(h.cancellations, 1); assert.equal(form(h).busy, false); assert.equal(form(h).disabled, false);
  const next = form(h).onContinue(input); await h.flush(); assert.equal(h.requests.length, 2);
  h.requests[0].resolve({ opened: true, checkoutReference: referenceA }); await old; await h.flush();
  assert.equal(selected(h), undefined); assert.equal(form(h).busy, true, 'Late cleanup cannot release another request lock');
  h.requests[1].resolve({ opened: true, checkoutReference: referenceB }); await next; await h.flush();
  assert.equal(selected(h), referenceB); assert.equal(form(h).busy, false);
});

test('a late wallet-not-linked error after cancellation cannot hide an already verified destination', async t => {
  const h = harness(); t.after(() => h.unmount()); h.render(); await h.flush();
  const pending = form(h).onContinue(input), rejected = assert.rejects(pending, { message: 'wallet_not_linked' });
  await h.flush(); cancel(h)(); await h.flush(); h.requests[0].reject(new Error('wallet_not_linked')); await rejected; await h.flush();
  assert.equal(form(h).disabled, false); assert.equal(form(h).destinationAddress, address); assert.equal(selected(h), undefined);
});

test('cancellation and selection handlers from a previous A session cannot modify the returned A session', async t => {
  const h = harness(); t.after(() => h.unmount()); h.render(); await h.flush();
  const oldForm = form(h), oldRequest = oldForm.onContinue(input); await h.flush(); const oldCancel = cancel(h);
  h.owner(ownerB); await h.flush(); h.owner(ownerA); await h.flush();
  const fresh = form(h).onContinue(input); await h.flush();
  oldCancel(); oldForm.onSelectionChange(); await h.flush(); assert.equal(h.cancellations, 0); assert.equal(form(h).busy, true);
  h.requests[0].resolve({ opened: true, checkoutReference: referenceA }); await oldRequest; await h.flush(); assert.equal(selected(h), undefined);
  h.requests[1].resolve({ opened: true, checkoutReference: referenceB }); await fresh; await h.flush(); assert.equal(selected(h), referenceB);
  oldForm.onSelectionChange(); await h.flush(); assert.equal(selected(h), referenceB);
  form(h).onSelectionChange(); await h.flush(); assert.equal(selected(h), undefined);
});

test('an unmounted checkout ignores a late acknowledgement and releases no new operations', async t => {
  const h = harness(); t.after(() => h.unmount()); h.render(); await h.flush();
  const callback = form(h).onContinue, pending = callback(input); await h.flush(); h.unmount();
  h.requests[0].resolve({ opened: true, checkoutReference: referenceA }); await pending;
  await callback(input); assert.equal(h.requests.length, 1); assert.equal(selected(h), undefined);
});
