import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import ts from 'typescript';
import { translateMessage } from '../../../../i18n/translate.mjs';
import * as selection from '../../../../lib/production-funding-selection.mjs';
import * as connection from '../../../../lib/wallet-reown-connection.mjs';
import { FUNDING_UUID } from '../../../../lib/wallet-funding-contract.mjs';

const require = createRequire(import.meta.url), address = `0x${'1'.repeat(40)}`;
const all = node => [node, ...React.Children.toArray(node?.props?.children).flatMap(all)];
const field = (tree, id) => all(tree).find(node => node?.props?.id === id);
const submit = tree => all(tree).find(node => node?.type === 'button' && node.props.type === 'submit');
const form = tree => all(tree).find(node => node?.type === 'form');
const deferred = () => { let resolve, reject; return { promise: new Promise((done, fail) => { resolve = done; reject = fail; }), resolve, reject }; };
function fixture(t) {
  const cells = [], queue = [], cache = new Map(), calls = { session: [], opened: [], popups: [], retries: 0, quoteInputs: [], binding: 0, connect: 0, history: 0 };
  let history = [];
  let cursor = 0, dirty = true, tree, mounted = true, props = { ownerSubject: 'fixture-owner' };
  const changed = (a, b) => !a || a.length !== b.length || a.some((item, index) => !Object.is(item, b[index]));
  const hooks = { useRef: value => cells[cursor++] ??= { current: value },
    useState(value) { const cell = cells[cursor++] ??= { value: typeof value === 'function' ? value() : value };
      return [cell.value, update => { const next = typeof update === 'function' ? update(cell.value) : update; if (!Object.is(next, cell.value)) { cell.value = next; dirty = true; } }]; },
    useCallback(fn, deps) { const cell = cells[cursor++] ??= {}; if (changed(cell.deps, deps)) { cell.deps = deps; cell.fn = fn; } return cell.fn; },
    useEffect(fn, deps) { const cell = cells[cursor++] ??= {}; if (changed(cell.deps, deps)) { cell.deps = deps; queue.push(() => { cell.cleanup?.(); cell.cleanup = fn(); }); } } };
  const binding = { loading: false, busy: false, configured: true, status: 'linked', address, linkedAddress: address, mismatch: false, error: '',
    canReceive: () => mounted, activate: async () => { calls.binding++; }, refresh: async () => {}, retire() { mounted = false; } };
  const savedWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { location: { search: '' }, open: () => {
    const popup = { opener: 'fixture', closed: false, close() { this.closed = true; }, location: { replace: value => calls.opened.push(value) } }; calls.popups.push(popup); return popup;
  } } });
  const waiting = deferred();
  const mocks = { react: hooks, 'react/jsx-runtime': require('react/jsx-runtime'), 'lucide-react': new Proxy({}, { get: () => () => null }),
    '@/lib/member-session-context': { useMemberSession: () => ({ subject: props.ownerSubject, email: 'fixture@example.test' }) },
    '@/components/reown/WalletReownContext': { useWalletReown: () => ({ configured: true, isConnected: false, isRestoring: false, connectWallet: async () => { calls.connect++; } }) },
    '@/components/reown/SandboxWalletBindingProvider': { useSandboxWalletBinding: () => binding }, '@/lib/wallet-reown-connection.mjs': connection,
    '@/lib/production-funding-selection.mjs': selection, '@/lib/wallet-funding-contract.mjs': { FUNDING_UUID },
    '@/components/wallet/useProductionFundingQuote': { default: options => {
      calls.quoteInputs.push(options);
      const key = options.valid && options.ready ? JSON.stringify([options.ownerSubject, options.address, options.input]) : '';
      if (key && !cache.has(key)) cache.set(key, { ...options.input, requestedAmount: options.input.amount, destination: { address }, receivedAt: Date.now(),
        quotes: [{ serviceProvider: 'TRANSAK', destinationAmount: 48, totalFee: 2 }, { serviceProvider: 'BANXA', destinationAmount: 47, totalFee: 3 }] });
      return { quote: key ? cache.get(key) : null, loading: false, error: '', invalidate() { cache.clear(); }, retry() { calls.retries++; }, expire() { cache.clear(); } };
    } },
    '@/lib/wallet-production-funding-client.mjs': { readProductionDiscovery: async country => country ? { country, defaultCurrencyCode: { US: 'USD', MX: 'MXN', CO: 'COP' }[country],
      currencies: ['USD', 'MXN', 'COP', 'EUR', 'GBP'].map(code => ({ code, name: code, decimalPlaces: 2 })) } : { countries: [{ code: 'US', name: 'United States' }, { code: 'MX', name: 'Mexico' }, { code: 'CO', name: 'Colombia' }] },
      readProductionOptions: async (_country, currency) => ({ routes: [{ serviceProvider: 'TRANSAK', paymentMethods: [
        { method: 'CREDIT_DEBIT_CARD', currencyCode: currency, minimumAmount: currency === 'USD' ? 20 : 931, maximumAmount: currency === 'USD' ? 50000 : 500000 },
        { method: currency === 'COP' ? 'PSE' : 'SPEI', currencyCode: currency, minimumAmount: currency === 'COP' ? 42300 : 200, maximumAmount: 500000 }] }] }),
      createProductionFunding: async (...args) => { calls.session.push(args); return waiting.promise; }, readProductionHistory: async () => { calls.history++; return { records: history }; }, readProductionStatus: async () => assert.fail('no callback or user status request') },
    '@/lib/sandbox-wallet-client.mjs': { readSandboxWalletFundingHistory: async () => assert.fail('Legacy remains collapsed') },
    '@/i18n/LanguageProvider': { useI18n: () => ({ locale: 'es', t: (key, values) => translateMessage('es', key, values) }) },
    '@/components/ui/popover': { Popover: ({ children }) => children, PopoverTrigger: ({ children }) => children, PopoverContent: ({ children }) => children },
    './WalletFundingUI': { WalletAddress: () => null }, './WalletFundingHistory': { default: () => null }, './wallet-funding.module.css': { default: {} }, './production-wallet.module.css': { default: {} } };
  const module = { exports: {} }, code = ts.transpileModule(readFileSync(new URL('./ProductionWalletFundingPage.jsx', import.meta.url), 'utf8'),
    { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  new Function('require', 'module', 'exports', code)(name => { assert.ok(Object.hasOwn(mocks, name), name); return mocks[name]; }, module, module.exports);
  const render = () => { cursor = 0; dirty = false; tree = module.exports.ProductionWalletView(props); while (queue.length) queue.shift()(); return tree; };
  const flush = async () => { for (let i = 0, quiet = 0; i < 50; i++) { if (dirty) render(); await new Promise(resolve => setImmediate(resolve));
    if (!dirty && !queue.length) { if (++quiet === 2) return tree; } else quiet = 0; } assert.fail('view did not settle'); };
  const stop = () => { mounted = false; cells.forEach(cell => cell?.cleanup?.()); };
  t.after(() => { stop(); if (savedWindow) Object.defineProperty(globalThis, 'window', savedWindow); else delete globalThis.window; });
  render();
  return { calls, binding, waiting, render, flush, stop, setHistory(records) { history = records; }, get tree() { return tree; },
    async change(id, value) { field(tree, id).props.onChange({ target: { value } }); await flush(); return tree; } };
}

test('form retains the current design with country/currency/method/amount order and only local plus USD offered', async t => {
  const h = fixture(t); await h.flush(); await h.change('production-country', 'MX');
  const inputs = all(h.tree).filter(node => node?.props?.id?.startsWith('production-') && ['input', 'select'].includes(node.type));
  assert.deepEqual(inputs.map(node => node.props.id), ['production-country', 'production-currency', 'production-method', 'production-amount']);
  assert.deepEqual(all(field(h.tree, 'production-currency')).filter(node => node?.type === 'option').map(node => node.props.value), ['', 'MXN', 'USD']);
  assert.equal(field(h.tree, 'production-amount').props.value, ''); assert.equal(submit(h.tree).props.children.at(-1), 'Recargar fondos');
  assert.ok(!all(h.tree).some(node => node?.type === 'button' && node.props.children === 'Consultar opciones'));
  assert.equal(h.calls.connect, 0); assert.equal(h.calls.binding, 0); assert.equal(h.calls.session.length, 0);
});

test('new fiat initializes its own provider minimum and never carries USD 50 into MXN or COP', async t => {
  const h = fixture(t); await h.flush(); await h.change('production-country', 'US'); await h.change('production-method', 'CREDIT_DEBIT_CARD');
  assert.equal(field(h.tree, 'production-amount').props.value, '50'); assert.equal(field(h.tree, 'production-amount').props.min, 50); assert.equal(field(h.tree, 'production-amount').props.max, 25000);
  await h.change('production-country', 'MX'); assert.equal(field(h.tree, 'production-amount').props.value, ''); await h.change('production-method', 'SPEI');
  assert.equal(field(h.tree, 'production-amount').props.value, '200'); assert.equal(h.calls.quoteInputs.at(-1).input.sourceCurrencyCode, 'MXN');
  await h.change('production-country', 'CO'); await h.change('production-method', 'PSE'); assert.equal(field(h.tree, 'production-amount').props.value, '42300');
  await h.change('production-currency', 'USD'); assert.equal(field(h.tree, 'production-amount').props.value, ''); assert.equal(field(h.tree, 'production-method').props.value, '');
});

test('changing methods preserves a typed amount, explains an invalid range and offers its real minimum without a quote', async t => {
  const h = fixture(t); await h.flush(); await h.change('production-country', 'MX'); await h.change('production-method', 'SPEI'); await h.change('production-amount', '250');
  await h.change('production-method', 'CREDIT_DEBIT_CARD'); assert.equal(field(h.tree, 'production-amount').props.value, '250');
  assert.equal(field(h.tree, 'production-amount').props['aria-invalid'], true); assert.equal(h.calls.quoteInputs.at(-1).valid, false);
  const minimum = all(h.tree).find(node => node?.type === 'button' && String(node.props.children).includes('Usar mínimo:'));
  assert.ok(minimum); minimum.props.onClick(); await h.flush(); assert.equal(field(h.tree, 'production-amount').props.value, '931');
  await h.change('production-method', 'SPEI'); assert.equal(field(h.tree, 'production-amount').props.value, '931');
});

test('provider choice and an explicit Recargar fondos gesture are required; activation and automatic prices cannot create checkout', async t => {
  const h = fixture(t); await h.flush(); await h.change('production-country', 'US'); await h.change('production-method', 'CREDIT_DEBIT_CARD');
  assert.equal(submit(h.tree).props.disabled, true); assert.equal(h.calls.popups.length, 0); assert.equal(h.calls.session.length, 0);
  all(h.tree).find(node => node?.props?.name === 'production-provider' && node.props.value === 'TRANSAK').props.onChange(); await h.flush();
  const target = form(h.tree); assert.equal(submit(h.tree).props.disabled, false); target.props.onSubmit({ preventDefault() {} }); target.props.onSubmit({ preventDefault() {} });
  assert.equal(h.calls.session.length, 1); assert.equal(h.calls.popups.length, 1); assert.equal(h.calls.popups[0].opener, null);
  assert.equal(h.calls.session[0][1], address); assert.equal(h.calls.session[0][0].amount, 50); assert.equal(h.calls.session[0][0].serviceProvider, 'TRANSAK');
  assert.equal(Object.hasOwn(h.calls.session[0][0], 'address'), false);
  h.waiting.resolve({ checkoutUrl: 'https://global.transak.com/?apiKey=fixture&sessionId=fixture' }); await h.flush();
  assert.equal(h.calls.opened.length, 1);
});

test('a captured old quote submit cannot open checkout after editing its amount, retiring the owner or unmounting', async t => {
  const h = fixture(t); await h.flush(); await h.change('production-country', 'US'); await h.change('production-method', 'CREDIT_DEBIT_CARD');
  all(h.tree).find(node => node?.props?.name === 'production-provider').props.onChange(); await h.flush(); const old = form(h.tree).props.onSubmit;
  await h.change('production-amount', '100'); old({ preventDefault() {} }); assert.equal(h.calls.popups.length, 0);
  const current = form(h.tree).props.onSubmit; h.stop(); current({ preventDefault() {} }); assert.equal(h.calls.popups.length, 0); assert.equal(h.calls.session.length, 0);
});

test('failed preparation refreshes only owned history and displays unavailable attempts as not completed without retrying checkout', async t => {
  const h = fixture(t); await h.flush(); await h.change('production-country', 'US'); await h.change('production-method', 'CREDIT_DEBIT_CARD');
  all(h.tree).find(node => node?.props?.name === 'production-provider').props.onChange(); await h.flush();
  form(h.tree).props.onSubmit({ preventDefault() {} });
  assert.equal(h.calls.session.length, 1); assert.equal(h.calls.history, 1);
  h.setHistory([{ checkoutReference: '11111111-1111-4111-8111-111111111111', serviceProvider: 'TRANSAK', requestedAmount: 50,
    sourceCurrencyCode: 'USD', status: 'unavailable', destination: { address }, confirmation: { state: 'unconfirmed', source: 'none', testMode: false } }]);
  h.waiting.reject(Error('wallet_production_unavailable')); await h.flush();
  assert.equal(h.calls.history, 2); assert.equal(h.calls.popups[0].closed, true); assert.equal(h.calls.opened.length, 0);
  const row = all(h.tree).find(node => node?.type === 'li');
  assert.ok(row); assert.equal(all(row).find(node => node?.type === 'span').props.children.at(-1), translateMessage('es', 'walletProduction.failed'));
  for (let index = 0; index < 3; index++) { h.render(); await h.flush(); }
  assert.equal(h.calls.session.length, 1); assert.equal(h.calls.history, 2);
});
