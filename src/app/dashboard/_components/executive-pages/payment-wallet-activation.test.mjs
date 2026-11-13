import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { translateMessage } from '../../../../i18n/translate.mjs';
import { paymentWalletMessages } from '../../../../i18n/payment-wallet-messages.js';

const require = createRequire(import.meta.url);
const source = readFileSync(new URL('PaymentWalletActivation.jsx', import.meta.url), 'utf8');
const all = (node, predicate) => [...(predicate(node) ? [node] : []), ...React.Children.toArray(node?.props?.children).flatMap(child => all(child, predicate))];
const find = (node, predicate) => all(node, predicate)[0];
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const flush = () => new Promise(resolve => setImmediate(resolve));

function harness(locale = 'es') {
  const cells = [], effects = [];
  let cursor = 0, setters = 0;
  const hooks = {
    useId: () => 'wallet-activation',
    useRef(initial) { return cells[cursor++] ??= { current: initial }; },
    useState(initial) { const at = cursor++, cell = cells[at] ??= { value: typeof initial === 'function' ? initial() : initial };
      return [cell.value, update => { setters++; cell.value = typeof update === 'function' ? update(cell.value) : update; }]; },
    useEffect(callback, dependencies) { const cell = cells[cursor++] ??= {};
      if (!cell.dependencies || dependencies.some((value, index) => !Object.is(value, cell.dependencies[index]))) {
        cell.dependencies = dependencies; effects.push(() => { cell.cleanup?.(); cell.cleanup = callback(); });
      }
    },
  };
  const module = { exports: {} };
  const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  new Function('require', 'module', 'exports', code)(id => {
    if (id === 'react') return hooks;
    if (id === 'react/jsx-runtime') return require(id);
    if (id === 'lucide-react') return new Proxy({}, { get: () => () => null });
    if (id === '@/i18n/LanguageProvider') return { useI18n: () => ({ locale, t: (key, values) => translateMessage(locale, key, values) }) };
    if (id.endsWith('.module.css')) return { default: new Proxy({}, { get: (_target, key) => key }) };
    assert.fail(`Unexpected activation dependency ${id}`);
  }, module, module.exports);
  return { render(connection, disabled = false, onStart = undefined) { cursor = 0; const tree = module.exports.default({ connection, disabled, onStart }); while (effects.length) effects.shift()(); return tree; },
    get setters() { return setters; }, unmount() { for (const cell of cells) cell?.cleanup?.(); } };
}
const base = patch => ({ available: true, phase: 'choosing', error: '', email: 'owner@example.test', canEmail: true,
  socials: ['google', 'apple'], wallets: [], canResend: true, resendAt: 0, requestEmail() {}, verifyEmail() {}, connectSocial() {}, cancel() {}, ...patch });
const button = (tree, key, locale = 'es') => find(tree, node => node?.type === 'button' && renderToStaticMarkup(node).includes(translateMessage(locale, `paymentWallet.${key}`)));

test('activation is translated, has no nested form, and mounting or typing never requests authentication', () => {
  for (const locale of ['es', 'en', 'ar', 'zh']) {
    const h = harness(locale), calls = [];
    const connection = base({ requestEmail: value => calls.push(value), connectSocial: value => calls.push(value) });
    try {
      let tree = h.render(connection);
      assert.equal(all(tree, node => node?.type === 'form').length, 0);
      assert.ok(all(tree, node => node?.type === 'button').every(node => node.props.type === 'button'));
      assert.ok(renderToStaticMarkup(tree).includes(translateMessage(locale, 'paymentWallet.noPayment')));
      const email = find(tree, node => node?.type === 'input' && node.props.type === 'email');
      assert.equal(email.props.value, 'owner@example.test');
      email.props.onChange({ target: { value: 'other@example.test' } }); tree = h.render(connection);
      assert.equal(find(tree, node => node?.type === 'input' && node.props.type === 'email').props.value, 'other@example.test');
      assert.deepEqual(calls, []);
      assert.equal(h.render({ ...connection, phase: 'idle' }), null);
    } finally { h.unmount(); }
  }
});

test('manual email requests validate the address, stop parent submission and coalesce duplicate clicks', async () => {
  const h = harness(), calls = [], pending = deferred();
  const connection = base({ requestEmail: value => { calls.push(value); return pending.promise; } });
  try {
    let tree = h.render(connection), email = find(tree, node => node?.type === 'input' && node.props.type === 'email');
    email.props.onChange({ target: { value: 'invalid' } }); tree = h.render(connection);
    assert.equal(button(tree, 'sendCode').props.disabled, true); button(tree, 'sendCode').props.onClick(); assert.deepEqual(calls, []);
    find(tree, node => node?.type === 'input' && node.props.type === 'email').props.onChange({ target: { value: ' owner@example.test ' } }); tree = h.render(connection);
    let prevented = 0, stopped = 0;
    email = find(tree, node => node?.type === 'input' && node.props.type === 'email');
    email.props.onKeyDown({ key: 'Enter', preventDefault() { prevented++; }, stopPropagation() { stopped++; } });
    button(tree, 'sendCode').props.onClick();
    assert.deepEqual(calls, ['owner@example.test']); assert.deepEqual([prevented, stopped], [1, 1]);
    assert.equal(button(h.render(connection), 'sendCode').props.disabled, true);
    pending.resolve(); await flush(); assert.equal(button(h.render(connection), 'sendCode').props.disabled, false);
  } finally { h.unmount(); }
});

test('OTP entry never auto-verifies, normalizes local digits and requires a manual complete-code action', async () => {
  const h = harness(), codes = [], connection = base({ phase: 'code', verifyEmail: value => codes.push(value) });
  try {
    let tree = h.render(connection), code = find(tree, node => node?.type === 'input');
    assert.equal(code.props.autoComplete, 'one-time-code'); assert.equal(code.props.inputMode, 'numeric');
    code.props.onChange({ target: { value: '١٢٣٤٥' } }); tree = h.render(connection);
    assert.equal(button(tree, 'verifyCode').props.disabled, true); button(tree, 'verifyCode').props.onClick(); assert.deepEqual(codes, []);
    find(tree, node => node?.type === 'input').props.onChange({ target: { value: '۱۲۳۴۵۶' } }); tree = h.render(connection);
    assert.equal(find(tree, node => node?.type === 'input').props.value, '123456'); assert.deepEqual(codes, []);
    button(tree, 'verifyCode').props.onClick(); await flush(); assert.deepEqual(codes, ['123456']);
    const changed = h.render({ ...connection, email: 'next@example.test' }); assert.equal(find(changed, node => node?.type === 'input').props.value, '');
  } finally { h.unmount(); }
});

test('resend cooldown blocks forced clicks and only an explicit later click sends another code', async () => {
  const h = harness(), calls = [], connection = base({ phase: 'code', resendAt: Date.now() + 60_000, requestEmail: value => calls.push(value) });
  try {
    const tree = h.render(connection), resend = find(tree, node => node?.type === 'button' && String(node.props.children).includes('Reenviar en'));
    assert.equal(resend.props.disabled, true); resend.props.onClick(); assert.deepEqual(calls, []);
    await flush(); assert.deepEqual(calls, []);
    const available = h.render({ ...connection, resendAt: 0 }); button(available, 'resend').props.onClick(); await flush(); assert.deepEqual(calls, ['owner@example.test']);
  } finally { h.unmount(); }
});

test('cancellation remains available during authentication and late completion does not update an unmounted UI', async () => {
  const h = harness(), calls = [], pending = deferred(), connection = base({ connectSocial: provider => { calls.push(provider); return pending.promise; }, cancel: () => calls.push('cancel') });
  let tree = h.render(connection); button(tree, 'google').props.onClick(); tree = h.render({ ...connection, phase: 'connecting' });
  const cancel = find(tree, node => node?.type === 'button' && node.props['aria-label'] === translateMessage('es', 'paymentWallet.cancel'));
  assert.equal(cancel.props.disabled, false); cancel.props.onClick(); assert.deepEqual(calls, ['google', 'cancel']);
  h.unmount(); const setters = h.setters; pending.resolve(); await flush(); assert.equal(h.setters, setters);
});

test('provider errors are mapped safely and native/device/injected actions stay explicit', async () => {
  const h = harness(), calls = [];
  try {
    const connection = base({ phase: 'choosing', error: '<secret-provider-payload>', available: false, openNative: () => calls.push('native') });
    let tree = h.render(connection), html = renderToStaticMarkup(tree);
    assert.doesNotMatch(html, /secret-provider-payload/); assert.ok(html.includes(translateMessage('es', 'paymentWallet.unavailable'))); assert.deepEqual(calls, []);
    button(tree, 'secureConnection').props.onClick(); await flush(); assert.deepEqual(calls, ['native']);
    tree = h.render(base({ phase: 'device', confirmDevice: () => calls.push('device') })); button(tree, 'deviceContinue').props.onClick(); await flush(); assert.deepEqual(calls, ['native', 'device']);
    tree = h.render(base({ socials: ['google', 'apple', 'unsupported'], wallets: [{ id: 'injected', name: 'Wallet', imageUrl: 'https://unknown.invalid/tracker' }], connectExternal: id => calls.push(id) }));
    html = renderToStaticMarkup(tree); assert.doesNotMatch(html, /unsupported|unknown\.invalid|<img/);
    find(tree, node => node?.type === 'button' && node.props.children?.some?.(child => child?.props?.children === 'Wallet')).props.onClick(); await flush(); assert.deepEqual(calls, ['native', 'device', 'injected']);
  } finally { h.unmount(); }
});

test('a terminal activation error restarts only through the parent flow and does not leave its new choices locked', async () => {
  const h = harness(), calls = [], pending = deferred();
  try {
    const connection = base({ phase: 'error', error: 'timeout', openNative: () => calls.push('native'), requestEmail: () => calls.push('email') });
    const tree = h.render(connection, false, () => { calls.push('restart'); return pending.promise; });
    assert.equal(all(tree, node => node?.type === 'input').length, 0);
    assert.equal(button(tree, 'google'), undefined); assert.equal(button(tree, 'moreOptions'), undefined);
    button(tree, 'retry').props.onClick(); await flush(); assert.deepEqual(calls, ['restart']);
    const choosing = h.render({ ...connection, phase: 'choosing', error: '' });
    assert.equal(button(choosing, 'sendCode').props.disabled, false, 'The parent connection promise stays pending while the user makes a choice');
    pending.resolve(); await flush(); assert.deepEqual(calls, ['restart']);
  } finally { h.unmount(); }
});

test('new activation steps focus their heading without opening a keyboard or stealing focus on an invalid-code retry', () => {
  const h = harness(), focus = [], calls = [], connection = base({ verifyEmail: value => calls.push(value) });
  try {
    const tree = h.render(connection), heading = find(tree, node => node?.type === 'h2');
    assert.equal(heading.props.tabIndex, -1);
    heading.ref.current = { focus: options => focus.push(['focus', options]), scrollIntoView: options => focus.push(['scroll', options]) };
    let code = h.render({ ...connection, phase: 'code' });
    assert.deepEqual(focus, [['focus', { preventScroll: true }], ['scroll', { block: 'nearest', inline: 'nearest', behavior: 'auto' }]]);
    assert.equal(find(code, node => node?.type === 'input').ref, null);
    h.render({ ...connection, phase: 'code', error: 'invalid_otp' }); assert.equal(focus.length, 2);
    h.render({ ...connection, phase: 'device' }); h.render({ ...connection, phase: 'error' }); assert.equal(focus.length, 6);
    assert.deepEqual(calls, []);
  } finally { h.unmount(); }
});

test('payment wallet dictionaries expose the same nonempty keys and interpolation in every locale', () => {
  const keys = Object.keys(paymentWalletMessages.es.paymentWallet).sort();
  const variables = value => [...value.matchAll(/\{([^}]+)\}/g)].map(match => match[1]).sort();
  for (const locale of ['es', 'en', 'ar', 'zh']) {
    const dictionary = paymentWalletMessages[locale].paymentWallet;
    assert.deepEqual(Object.keys(dictionary).sort(), keys);
    for (const key of keys) { assert.ok(dictionary[key].trim()); assert.deepEqual(variables(dictionary[key]), variables(paymentWalletMessages.es.paymentWallet[key])); assert.equal(translateMessage(locale, `paymentWallet.${key}`), dictionary[key]); }
  }
});
