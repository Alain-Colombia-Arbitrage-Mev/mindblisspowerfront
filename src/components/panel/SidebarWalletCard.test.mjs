import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { setImmediate } from 'node:timers/promises';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { translateMessage } from '../../i18n/translate.mjs';

const require = createRequire(import.meta.url);
const source = readFileSync(new URL('./SidebarWalletCard.jsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
const address = `0x${'1'.repeat(40)}`, newerAddress = `0x${'2'.repeat(40)}`;
const Link = ({ children, ...props }) => React.createElement('a', props, children);
const Balance = () => React.createElement('span', null, '— USDT');
const text = node => typeof node === 'string' ? node : React.Children.toArray(node?.props?.children).map(text).join('');
function findAll(node, predicate) {
  if (!React.isValidElement(node)) return [];
  return [...(predicate(node) ? [node] : []), ...React.Children.toArray(node.props.children).flatMap(child => findAll(child, predicate))];
}
function card({ locale = 'es', boundAddress = address, status = 'linked', readBinding = async () => ({ linked: true, address }) } = {}) {
  const state = [boundAddress, status], effects = [], reads = [];
  let cursor = 0, effectRegistered = false;
  const react = {
    useState(initial) { const index = cursor++; if (state[index] === undefined) state[index] = initial;
      return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }]; },
    useEffect(run) { if (!effectRegistered) { effectRegistered = true; effects.push(run); } },
  };
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(id => {
    if (id === 'react') return react;
    if (id === 'react/jsx-runtime') return require(id);
    if (id === 'lucide-react') return new Proxy({}, { get: (_target, name) => props => React.createElement('svg', { ...props, 'data-icon': name }) });
    if (id === './IntentLink') return { default: Link };
    if (id === '@/i18n/LanguageProvider') return { useI18n: () => ({ locale, t: key => translateMessage(locale, key) }) };
    if (id === '@/components/wallet/PersonalWalletBalances') return { default: Balance };
    if (id === '@/lib/wallet-binding.mjs') return { readWalletBinding: options => { reads.push(options); return readBinding(options); } };
    assert.fail(`Sidebar unexpectedly imports a wallet action or provider: ${id}`);
  }, module, module.exports);
  return {
    reads, state,
    render(props = {}) { cursor = 0; return module.exports.default(props); },
    mount() { const cleanups = effects.splice(0).map(run => run()); return () => cleanups.forEach(cleanup => cleanup?.()); },
  };
}
function browser(t) {
  const copied = [];
  for (const [name, value] of Object.entries({ window: new EventTarget(), navigator: { clipboard: { writeText: async value => { copied.push(value); } } } })) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { configurable: true, value });
    t.after(() => { if (previous) Object.defineProperty(globalThis, name, previous); else delete globalThis[name]; });
  }
  return copied;
}

test('all four locales show distinct top-up and pay links beside one bound personal-wallet address', () => {
  const expected = { es: 'Pagar', en: 'Pay', ar: 'دفع', zh: '付款' };
  for (const locale of Object.keys(expected)) {
    const view = card({ locale });
    const tree = view.render();
    const balance = findAll(tree, node => node.type === Balance)[0];
    assert.equal(balance.props.expectedAddress, address);
    assert.equal(balance.props.compact, true);
    const actions = findAll(tree, node => node.type === Link);
    assert.deepEqual(actions.map(node => node.props.href), ['/dashboard/wallet-personal', '/dashboard/wallet-personal/pay']);
    assert.equal(text(actions[0]), translateMessage(locale, 'nav.addFunds'));
    assert.equal(text(actions[1]), expected[locale]);
    assert.equal(actions[0].props.className, 'vp-sidebar-wallet-action primary');
    assert.equal(actions[1].props.className, 'vp-sidebar-wallet-action');
    const codes = findAll(tree, node => node.type === 'code');
    assert.equal(codes.length, 1); assert.equal(codes[0].props.title, address);
    assert.equal(text(codes[0]), `${address.slice(0, 7)}…${address.slice(-5)}`);
    for (const action of actions) {
      const icon = React.Children.toArray(action.props.children)[0];
      assert.equal(icon.props.size, 14); assert.equal(icon.props['aria-hidden'], 'true');
      assert.equal(React.Children.toArray(action.props.children)[1].type, 'span');
    }
    const html = renderToStaticMarkup(tree);
    assert.ok(html.includes(expected[locale])); assert.match(html, /USDT/);
    assert.doesNotMatch(html, /companyPayment\.|wallet-administrative|MELD|Binance|recipientAddress|amountAtomic/);
    assert.equal(view.reads.length, 0, 'rendering navigation cannot execute a wallet action');
  }
});

test('both actions close the navigation drawer without signing, transferring or starting a second binding lookup', async t => {
  const copied = browser(t);
  let navigated = 0;
  const onNavigate = () => { navigated++; };
  const view = card({ boundAddress: '', status: 'loading' });
  view.render({ onNavigate });
  const cleanup = view.mount();
  await setImmediate();
  const tree = view.render({ onNavigate });
  assert.equal(view.reads.length, 1);
  for (const action of findAll(tree, node => node.type === Link)) {
    assert.equal(action.props.onClick, onNavigate);
    action.props.onClick();
  }
  assert.equal(navigated, 2); assert.equal(view.reads.length, 1); assert.deepEqual(copied, []);
  const copy = findAll(tree, node => node.type === 'button')[0];
  assert.equal(copy.props['aria-label'], translateMessage('es', 'walletPage.copyAddress'));
  await copy.props.onClick();
  assert.deepEqual(copied, [address]);
  cleanup(); assert.equal(view.reads[0].signal.aborted, true);
});

test('a refreshed binding replaces the common address and an aborted old read cannot restore the previous wallet', async t => {
  browser(t);
  const pending = [];
  const view = card({ boundAddress: '', status: 'loading', readBinding: () => new Promise(resolve => pending.push(resolve)) });
  view.render(); const cleanup = view.mount();
  window.dispatchEvent(new Event('vp:personal-wallet-linked'));
  assert.equal(view.reads.length, 2); assert.equal(view.reads[0].signal.aborted, true);
  pending[1]({ linked: true, address: newerAddress }); await setImmediate();
  pending[0]({ linked: true, address }); await setImmediate();
  const tree = view.render();
  assert.equal(findAll(tree, node => node.type === 'code')[0].props.title, newerAddress);
  assert.equal(findAll(tree, node => node.type === Balance)[0].props.expectedAddress, newerAddress);
  assert.equal(findAll(tree, node => node.type === Link).length, 2);
  cleanup(); window.dispatchEvent(new Event('vp:personal-wallet-linked'));
  assert.equal(view.reads.length, 2, 'unmounted sidebar cannot start another lookup');
});

test('unlinked or unavailable wallets keep the two existing-wallet destinations without inventing an address or creating one', () => {
  for (const status of ['loading', 'unlinked', 'error']) {
    const tree = card({ boundAddress: '', status }).render();
    assert.equal(findAll(tree, node => node.type === Link).length, 2);
    assert.equal(findAll(tree, node => node.type === 'button').length, 0);
    const code = findAll(tree, node => node.type === 'code')[0];
    assert.equal(code.props.title, undefined);
    assert.equal(text(code), translateMessage('es', status === 'loading' ? 'walletPage.checking' : status === 'error' ? 'walletPage.checkFailed' : 'funding.noPersonalAddress'));
  }
});

test('the two-column action rail can shrink and wrap localized labels while icons remain centered and touch targets stay usable', () => {
  const css = readFileSync(new URL('./panel-shell.css', import.meta.url), 'utf8');
  assert.match(css, /\.vp-sidebar-wallet-actions\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s);
  assert.match(css, /\.vp-sidebar-wallet-action\s*\{[^}]*align-items:\s*center;[^}]*justify-content:\s*center;[^}]*min-width:\s*0;[^}]*min-height:\s*44px;/s);
  assert.match(css, /\.vp-sidebar-wallet-action\s*>\s*svg\s*\{\s*flex:\s*0 0 auto;/);
  assert.match(css, /\.vp-sidebar-wallet-action\s*>\s*span\s*\{[^}]*min-width:\s*0;[^}]*overflow-wrap:\s*anywhere;/s);
});
