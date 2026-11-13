import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import ts from 'typescript';
import * as clipboard from '../../lib/wallet-address-clipboard.mjs';
import { memberSessionOwnerKey } from '../../lib/member-session-boundary.mjs';
import { translateMessage } from '../../i18n/translate.mjs';

const require = createRequire(import.meta.url), address = `0x${'1'.repeat(40)}`, nextAddress = `0x${'2'.repeat(40)}`;
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const find = (node, predicate) => predicate(node) ? node : React.Children.toArray(node?.props?.children).map(child => find(child, predicate)).find(Boolean);
function fixture(t, writeText = async () => {}, locale = 'es') {
  let owner = { subject: 'owner-A', email: 'same@example.test' }, si = 0, ri = 0, ei = 0;
  const state = [], refs = [], effects = [], queue = [], signals = new Set();
  const same = (a, b) => a && a.length === b.length && a.every((value, index) => value === b[index]);
  const hooks = { ...React, useId: () => 'copy-feedback', useState(initial) { const i = si++; if (!(i in state)) state[i] = initial; return [state[i], value => { state[i] = typeof value === 'function' ? value(state[i]) : value; }]; },
    useRef(initial) { return refs[ri++] ||= { current: initial }; }, useEffect(run, deps) { const i = ei++, old = effects[i]; if (!same(old?.deps, deps)) queue.push(() => { old?.cleanup?.(); effects[i] = { run, deps, cleanup: run() }; }); } };
  const savedNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator'), savedDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { clipboard: { writeText } } }); Object.defineProperty(globalThis, 'document', { configurable: true, value: {} });
  const subscribe = callback => { signals.add(callback); return () => signals.delete(callback); };
  const mocks = { react: hooks, 'react/jsx-runtime': require('react/jsx-runtime'), 'lucide-react': new Proxy({}, { get: () => () => null }),
    '@/lib/member-session-context': { useMemberSession: () => owner }, '@/lib/member-session-boundary.mjs': { memberSessionOwnerKey },
    '@/lib/member-logout-sync.mjs': { subscribeMemberLogout: subscribe }, '@/lib/member-session-sync.mjs': { subscribeMemberSessionReplacement: subscribe },
    '@/lib/wallet-address-clipboard.mjs': clipboard, '@/i18n/LanguageProvider': { useI18n: () => ({ t: key => translateMessage(locale, key) }) } };
  const module = { exports: {} }, code = ts.transpileModule(readFileSync(new URL('./WalletAddressCopyButton.jsx', import.meta.url), 'utf8'), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('require', 'module', 'exports', code)(id => { assert.ok(Object.hasOwn(mocks, id), id); return mocks[id]; }, module, module.exports);
  let props = { address }, tree;
  const h = { render(next = props) { props = next; si = ri = ei = 0; tree = module.exports.default(props); while (queue.length) queue.shift()(); return tree; },
    get button() { return find(tree, value => value?.type === 'button'); }, get message() { return find(tree, value => value?.props?.role === 'status'); },
    setOwner: value => { owner = value; }, retire: () => { for (const signal of [...signals]) signal(); },
    strictReplay() { for (const effect of effects) { effect.cleanup?.(); effect.cleanup = effect.run(); } }, unmount() { for (const effect of effects) effect.cleanup?.(); } };
  h.render(); t.after(() => { h.unmount(); for (const [name, previous] of [['navigator', savedNavigator], ['document', savedDocument]]) { if (previous) Object.defineProperty(globalThis, name, previous); else delete globalThis[name]; } }); return h;
}

test('all locales expose one accessible address-only control and accurate completion feedback', async t => {
  for (const locale of ['es', 'en', 'ar', 'zh']) {
    const copied = [], h = fixture(t, async value => copied.push(value), locale);
    assert.equal(h.button.props['aria-label'], translateMessage(locale, 'walletPage.copyAddress'));
    await h.button.props.onClick(); h.render(); assert.deepEqual(copied, [address]);
    assert.equal(h.message.props.children, translateMessage(locale, 'walletPage.addressCopied')); assert.equal(h.message.props['aria-live'], 'polite');
    for (const key of ['addressCopying', 'addressCopied', 'addressCopyFailed']) assert.notEqual(translateMessage(locale, `walletPage.${key}`), `walletPage.${key}`);
    assert.equal(h.button.props['aria-describedby'], h.message.props.id); h.unmount();
  }
});

test('browser denial reports an actionable failure, never a success or a private exception', async t => {
  const h = fixture(t, async () => { throw new Error('private-permission-reason'); }); await h.button.props.onClick(); h.render();
  assert.equal(h.message.props.children, translateMessage('es', 'walletPage.addressCopyFailed'));
  assert.doesNotMatch(h.message.props.children, /private-permission-reason/); assert.equal(h.button.props.disabled, false);
  const recovery = find(h.render(), value => value?.type === 'input');
  assert.equal(recovery.props.readOnly, true); assert.equal(recovery.props.value, address);
  let selected = 0; recovery.props.onFocus({ currentTarget: { select: () => { selected++; } } });
  recovery.props.onClick({ currentTarget: { select: () => { selected++; } } }); assert.equal(selected, 2);
  h.render({ address: nextAddress }); assert.equal(find(h.render(), value => value?.type === 'input'), undefined, 'new address retires the previous recovery field');
});

test('changing the visible address clears feedback and retires captured old handlers and delayed completions', async t => {
  const wait = deferred(), copied = [], h = fixture(t, value => { copied.push(value); return value === address ? wait.promise : Promise.resolve(); });
  const oldClick = h.button.props.onClick, action = oldClick(); h.render(); assert.equal(h.button.props.disabled, true);
  h.render({ address: nextAddress }); await oldClick(); wait.resolve(); await action; h.render();
  assert.equal(h.message.props.children, ''); assert.deepEqual(copied, [address]);
  await h.button.props.onClick(); h.render(); assert.deepEqual(copied, [address, nextAddress]);
  assert.equal(h.message.props.children, translateMessage('es', 'walletPage.addressCopied'));
});

test('different subjects with the same email and logout/replacement signals retire old copy feedback', async t => {
  const wait = deferred(), copied = [], h = fixture(t, value => { copied.push(value); return wait.promise; });
  const action = h.button.props.onClick(); h.setOwner({ subject: 'owner-B', email: 'same@example.test' }); h.render({ address: nextAddress });
  wait.reject(new Error('denied')); await action; h.render(); assert.equal(h.message.props.children, '');
  h.retire(); h.render(); assert.equal(h.button.props.disabled, true); await h.button.props.onClick(); assert.deepEqual(copied, [address]);
});

test('ownerless, invalid and unmounted controls cannot write; StrictMode replay stays usable', async t => {
  const copied = [], h = fixture(t, async value => copied.push(value));
  h.strictReplay(); await h.button.props.onClick(); assert.deepEqual(copied, [address]);
  h.render({ address: 'truncated…wallet' }); assert.equal(h.button.props.disabled, true); await h.button.props.onClick();
  h.setOwner(null); h.render({ address }); assert.equal(h.button.props.disabled, true); await h.button.props.onClick();
  const captured = h.button.props.onClick; h.unmount(); await captured(); assert.deepEqual(copied, [address]);
});
