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
import * as fundingContract from '../../../../lib/wallet-production-funding-contract.mjs';

const require = createRequire(import.meta.url), address = `0x${'1'.repeat(40)}`;
const polygonDestination = { address, asset: 'USDT', network: 'polygon', chainId: 137 };
const genericCountry = 'CA';
const mexicoRoutes = {
  EUR: { serviceProvider: 'ALCHEMYPAY', method: 'CREDIT_DEBIT_CARD', destinationCurrencyCode: 'USDC_ARBITRUM', minimumAmount: 100, maximumAmount: 5000 },
  MXN: { serviceProvider: 'ONRAMPMONEY', method: 'SPEI', destinationCurrencyCode: 'USDC_POLYGON', minimumAmount: 200, maximumAmount: 500000 },
};
const mexicoCatalog = currency => {
  const route = mexicoRoutes[currency];
  if (!route) return { routes: [] };
  const { serviceProvider, method, destinationCurrencyCode, minimumAmount, maximumAmount } = route;
  return { destinationCurrencyCode, routes: [{ serviceProvider, paymentMethods: [{ method, currencyCode: currency, minimumAmount, maximumAmount }] }] };
};
const all = node => [node, ...React.Children.toArray(node?.props?.children).flatMap(all)];
const field = (tree, id) => all(tree).find(node => node?.props?.id === id);
const submit = tree => all(tree).find(node => node?.type === 'button' && node.props.type === 'submit');
const form = tree => all(tree).find(node => node?.type === 'form');
const deferred = () => { let resolve, reject; return { promise: new Promise((done, fail) => { resolve = done; reject = fail; }), resolve, reject }; };
const discoveryValue = country => country ? { country, defaultCurrencyCode: { US: 'USD', MX: 'MXN', CO: 'COP', [genericCountry]: 'MXN' }[country],
  currencies: ['USD', 'MXN', 'COP', 'EUR', 'GBP'].map(code => ({ code, name: code, decimalPlaces: 2 })) }
  : { countries: [{ code: 'US', name: 'United States' }, { code: 'MX', name: 'Mexico' }, { code: 'CO', name: 'Colombia' }, { code: genericCountry, name: 'Canada' }] };
const retryButton = tree => all(tree).find(node => node?.type === 'button' && node.props.children === translateMessage('es', 'walletProduction.retry'));
function fixture(t, config = {}) {
  const cells = [], queue = [], cache = new Map(), calls = { session: [], opened: [], popups: [], retries: 0, quoteInputs: [], binding: 0, connect: 0, history: 0 };
  let history = config.history ?? [], quoteExpired = false;
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
    '@/lib/wallet-production-funding-contract.mjs': fundingContract,
    '@/components/wallet/useProductionFundingQuote': { default: options => {
      calls.quoteInputs.push(options);
      const key = options.valid && options.ready ? selection.productionFundingSelectionKey(options.ownerSubject, options.address, options.input, options.destinationCurrencyCode) : '';
      if (key && !cache.has(key)) {
        const { asset, network, chainId } = fundingContract.walletProductionAsset(options.destinationCurrencyCode);
        cache.set(key, { ...options.input, requestedAmount: options.input.amount, destination: { address, asset, network, chainId }, receivedAt: Date.now(),
          quotes: config.quotes ? config.quotes(options.input) : options.input.country === 'MX'
            ? [{ serviceProvider: mexicoRoutes[options.input.sourceCurrencyCode].serviceProvider, destinationAmount: 48, totalFee: 2 }]
            : [{ serviceProvider: 'TRANSAK', destinationAmount: 48, totalFee: 2 }, { serviceProvider: 'BANXA', destinationAmount: 47, totalFee: 3 }] });
      }
      return { quote: key && !quoteExpired ? cache.get(key) : null, loading: false, error: quoteExpired ? 'quoteExpired' : '',
        invalidate() { cache.clear(); quoteExpired = false; }, retry() { calls.retries++; quoteExpired = false; }, expire() { cache.clear(); quoteExpired = true; dirty = true; } };
    } },
    '@/components/wallet/ProductionCountrySelect': { default: 'country-selector-fixture' },
    '@/components/wallet/WalletUsdcBalance': { default: 'wallet-usdc-balance-fixture' },
    '@/lib/wallet-production-funding-client.mjs': { readProductionDiscovery: async country => config.discovery ? config.discovery(country) : discoveryValue(country),
      readProductionOptions: async (country, currency) => config.options ? config.options(country, currency) : country === 'MX' ? mexicoCatalog(currency) : ({ routes: ['TRANSAK', 'BANXA'].map(serviceProvider => ({ serviceProvider, paymentMethods: [
        { method: 'CREDIT_DEBIT_CARD', currencyCode: currency, minimumAmount: currency === 'USD' ? 20 : 931, maximumAmount: currency === 'USD' ? 50000 : 500000 },
        { method: currency === 'COP' ? 'PSE' : 'SPEI', currencyCode: currency, minimumAmount: currency === 'COP' ? 42300 : 200, maximumAmount: 500000 }] })) }),
      createProductionFunding: async (...args) => { calls.session.push(args); return waiting.promise; }, readProductionHistory: async () => { calls.history++; return { records: history }; }, readProductionStatus: async () => assert.fail('no callback or user status request') },
    '@/lib/sandbox-wallet-client.mjs': { readSandboxWalletFundingHistory: async () => assert.fail('Legacy remains collapsed') },
    '@/i18n/LanguageProvider': { useI18n: () => ({ locale: 'es', t: (key, values) => translateMessage('es', key, values) }) },
    '@/components/ui/popover': { Popover: ({ children }) => children, PopoverTrigger: ({ children }) => children, PopoverContent: ({ children }) => children },
    './WalletFundingUI': { WalletAddress: () => null }, './WalletDepositQr': { default: 'wallet-deposit-qr-fixture' },
    './WalletFundingHistory': { default: () => null }, './wallet-funding.module.css': { default: {} }, './production-wallet.module.css': { default: {} } };
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
    async change(id, value) { const control = field(tree, id); control.props.onChange(control.type === 'country-selector-fixture' ? value : { target: { value } }); await flush(); return tree; } };
}

test('form retains country, currency, method and amount order and shows every verified fiat from discovery', async t => {
  const h = fixture(t); await h.flush(); await h.change('production-country', genericCountry);
  const inputs = all(h.tree).filter(node => node?.props?.id?.startsWith('production-') && ['input', 'select', 'country-selector-fixture'].includes(node.type));
  assert.deepEqual(inputs.map(node => node.props.id), ['production-country', 'production-currency', 'production-method', 'production-amount']);
  assert.deepEqual(all(field(h.tree, 'production-currency')).filter(node => node?.type === 'option').map(node => node.props.value), ['', 'MXN', 'USD', 'COP', 'EUR', 'GBP']);
  assert.equal(field(h.tree, 'production-amount').props.value, ''); assert.equal(submit(h.tree).props.children.at(-1), 'Recargar fondos');
  assert.ok(!all(h.tree).some(node => node?.type === 'button' && node.props.children === 'Consultar opciones'));
  assert.equal(h.calls.connect, 0); assert.equal(h.calls.binding, 0); assert.equal(h.calls.session.length, 0);
});

test('all USDC balances use the verified wallet and disappear when its binding is retired', async t => {
  const h = fixture(t);
  const findBalances = tree => all(tree).filter(node => node?.type === 'wallet-usdc-balance-fixture');
  assert.deepEqual(findBalances(await h.flush()).map(({ props }) => [props.address, props.network ?? 'polygon']),
    [[address, 'polygon'], [address, 'arbitrum'], [address, 'ethereum']]);
  assert.equal(all(h.tree).find(node => node?.type === 'wallet-deposit-qr-fixture').props.address, address);
  h.binding.retire();
  assert.deepEqual(findBalances(h.render()), []);
  assert.ok(!all(h.tree).some(node => node?.type === 'wallet-deposit-qr-fixture'));
});

test('Mexico EUR shows USDC on Arbitrum and does not open a checkout reporting the same token on Polygon', async t => {
  const config = {
    options: async (_country, currency) => currency === 'EUR' ? mexicoCatalog(currency) : { routes: [] },
    history: [{ checkoutReference: '11111111-1111-4111-8111-111111111111', serviceProvider: 'ALCHEMYPAY', requestedAmount: 100,
      sourceCurrencyCode: 'EUR', status: 'session_created', destination: { address, asset: 'USDC', network: 'arbitrum', chainId: 42161 },
      confirmation: { state: 'unconfirmed', source: 'none', testMode: false } }],
  };
  const h = fixture(t, config);
  await h.flush(); await h.change('production-country', 'MX');
  assert.equal(field(h.tree, 'production-mexico-EUR').props.checked, false);
  assert.equal(field(h.tree, 'production-mexico-MXN'), undefined);
  assert.equal(field(h.tree, 'production-currency'), undefined);
  assert.equal(field(h.tree, 'production-method'), undefined);
  await h.change('production-mexico-EUR', 'EUR');
  assert.equal(field(h.tree, 'production-mexico-EUR').props.checked, true);
  assert.equal(h.calls.quoteInputs.at(-1).input.paymentMethodType, 'CREDIT_DEBIT_CARD');
  assert.ok(all(all(h.tree).find(node => node?.type === 'li')).includes('USDC · Arbitrum'));
  assert.equal(field(h.tree, 'production-amount').props.value, '100');
  assert.equal(h.calls.quoteInputs.at(-1).destinationCurrencyCode, 'USDC_ARBITRUM');
  assert.ok(all(h.tree).includes('Importe a pagar 100 EUR'));
  assert.ok(all(h.tree).includes('Arbitrum'));
  assert.ok(!all(h.tree).some(node => node?.props?.name === 'production-provider'));
  assert.equal(submit(h.tree).props.children.at(-1), 'Continuar con Alchemy Pay');
  assert.equal(submit(h.tree).props.disabled, false);
  form(h.tree).props.onSubmit({ preventDefault() {} });
  assert.equal(h.calls.session.length, 1);
  const [request] = h.calls.session[0];
  assert.equal(request.serviceProvider, 'ALCHEMYPAY');
  assert.equal(request.sourceCurrencyCode, 'EUR');
  assert.equal(Object.hasOwn(request, 'destination'), false);
  h.waiting.resolve({ checkoutUrl: 'https://meldcrypto.com/?token=synthetic_opaque', destination: { ...polygonDestination, asset: 'USDC' } });
  await h.flush();
  assert.equal(h.calls.popups[0].closed, true);
  assert.deepEqual(h.calls.opened, []);
});

test('Mexico method switching resets the fiat amount, rejects a stale submit and aborts a preparing checkout', async t => {
  const catalogCalls = [];
  const h = fixture(t, { options: async (country, currency) => { catalogCalls.push([country, currency]); return mexicoCatalog(currency); } });
  await h.flush(); await h.change('production-country', 'MX');
  assert.deepEqual(catalogCalls, [['MX', 'EUR'], ['MX', 'MXN']]);
  assert.equal(field(h.tree, 'production-mexico-EUR').props.checked, false);
  assert.equal(field(h.tree, 'production-mexico-MXN').props.checked, false);
  assert.ok(all(h.tree).includes('Paga en euros (EUR) con Alchemy Pay'));
  assert.ok(all(h.tree).includes('Paga en pesos mexicanos (MXN) con Onramp Money'));
  assert.equal(submit(h.tree), undefined);
  await h.change('production-mexico-EUR', 'EUR');
  await h.change('production-amount', '125');
  const previousSubmit = form(h.tree).props.onSubmit;
  await h.change('production-mexico-MXN', 'MXN');
  assert.equal(field(h.tree, 'production-amount').props.value, '200');
  assert.equal(field(h.tree, 'production-mexico-MXN').props.checked, true);
  await h.change('production-amount', '300');
  await h.change('production-mexico-MXN', 'MXN');
  assert.equal(field(h.tree, 'production-amount').props.value, '300');
  assert.deepEqual(catalogCalls, [['MX', 'EUR'], ['MX', 'MXN']]);
  previousSubmit({ preventDefault() {} });
  assert.equal(h.calls.session.length, 0);
  assert.equal(h.calls.popups.length, 0);
  const queuedCardChange = field(h.tree, 'production-mexico-EUR').props.onChange;
  form(h.tree).props.onSubmit({ preventDefault() {} });
  await h.flush();
  assert.equal(field(h.tree, 'production-mexico-EUR').props.disabled, true);
  assert.equal(h.calls.session.length, 1);
  const [checkout, wallet, { signal }] = h.calls.session[0];
  assert.deepEqual({ ...checkout, requestId: undefined }, { country: 'MX', sourceCurrencyCode: 'MXN', amount: 300,
    paymentMethodType: 'SPEI', serviceProvider: 'ONRAMPMONEY', requestId: undefined });
  assert.equal(wallet, address);
  queuedCardChange();
  await h.flush();
  assert.equal(field(h.tree, 'production-amount').props.value, '100');
  assert.equal(signal.aborted, true);
  assert.equal(h.calls.popups[0].closed, true);
  h.waiting.resolve({ checkoutUrl: 'https://meldcrypto.com/?token=synthetic_opaque', destination: { ...polygonDestination, asset: 'USDC' } });
  await h.flush();
  assert.deepEqual(h.calls.opened, []);
  assert.equal(h.calls.session.length, 1);
});

test('Mexico retains a verified route when the other method fails and recovers it on explicit retry', async t => {
  let bankUnavailable = true;
  const h = fixture(t, { options: async (_country, currency) => {
    if (currency === 'MXN' && bankUnavailable) throw Error('unavailable');
    return mexicoCatalog(currency);
  } });
  await h.flush(); await h.change('production-country', 'MX');
  assert.equal(field(h.tree, 'production-mexico-MXN'), undefined);
  assert.ok(all(h.tree).includes(translateMessage('es', 'walletProduction.mexicoAvailability')));
  await h.change('production-mexico-EUR', 'EUR');
  await h.change('production-amount', '125');
  assert.equal(submit(h.tree).props.disabled, false);
  bankUnavailable = false;
  retryButton(h.tree).props.onClick(); await h.flush();
  assert.equal(field(h.tree, 'production-mexico-EUR').props.checked, true);
  assert.equal(field(h.tree, 'production-mexico-MXN').props.checked, false);
  assert.equal(field(h.tree, 'production-amount').props.value, '125');
  assert.equal(retryButton(h.tree), undefined);
  assert.equal(h.calls.session.length, 0);
});

test('Mexico offers no checkout when discovered currencies lack either matching provider rail', async t => {
  const h = fixture(t, { options: async (_country, currency) => {
    const options = mexicoCatalog(currency);
    if (currency === 'EUR') return { ...options, destinationCurrencyCode: 'USDC_POLYGON' };
    const [route] = options.routes;
    return { ...options, routes: [{ ...route, paymentMethods: [{ ...route.paymentMethods[0], method: 'CREDIT_DEBIT_CARD' }] }] };
  } });
  await h.flush(); await h.change('production-country', 'MX');
  assert.equal(field(h.tree, 'production-mexico-EUR'), undefined);
  assert.equal(field(h.tree, 'production-mexico-MXN'), undefined);
  assert.equal(field(h.tree, 'production-amount'), undefined);
  assert.equal(submit(h.tree), undefined);
  assert.equal(retryButton(h.tree), undefined);
  assert.ok(all(h.tree).includes(translateMessage('es', 'walletProduction.mexicoNoMethod')));
  assert.ok(h.calls.quoteInputs.every(call => !call.valid));
  assert.equal(h.calls.session.length, 0);
});

test('RampNow US card offers three USDC networks, defaults to Polygon and uses the selected network to open checkout', async t => {
  const networks = ['USDC_POLYGON', 'USDC_ARBITRUM', 'USDC'];
  const ethereumDestination = { address, asset: 'USDC', network: 'ethereum', chainId: 1 };
  const config = {
    options: async (country, currency) => country === 'US' && currency === 'USD' ? {
      destinationCurrencyCode: 'USDC_POLYGON',
      routes: [{ serviceProvider: 'RAMPNOW', paymentMethods: [{ method: 'CREDIT_DEBIT_CARD', currencyCode: 'USD', minimumAmount: 50, maximumAmount: 5000, destinationCurrencyCodes: networks }] }],
    } : { routes: [] },
    quotes: () => [{ serviceProvider: 'RAMPNOW', destinationAmount: 47, totalFee: 3 }],
    history: [{ checkoutReference: '11111111-1111-4111-8111-111111111111', serviceProvider: 'RAMPNOW', requestedAmount: 50,
      sourceCurrencyCode: 'USD', status: 'session_created', destination: { ...polygonDestination, asset: 'USDC' }, confirmedDestination: ethereumDestination,
      confirmation: { state: 'confirmed', source: 'meld_production_api', testMode: false } }],
  };
  const h = fixture(t, config); await h.flush();
  assert.equal(field(h.tree, 'production-network'), undefined);
  await h.change('production-country', 'US');
  assert.equal(field(h.tree, 'production-network').props.value, 'USDC_POLYGON');
  assert.deepEqual(all(field(h.tree, 'production-network')).filter(node => node?.type === 'option').map(node => node.props.value), networks);
  assert.equal(h.calls.quoteInputs.at(-1).input.destinationCurrencyCode, 'USDC_POLYGON');
  const historyRow = all(h.tree).find(node => node?.type === 'li');
  assert.ok(all(historyRow).includes('Cotización en USDC · Polygon'));
  assert.ok(all(historyRow).includes('Recibido en USDC · Ethereum'));
  await h.change('production-amount', '70');
  await h.change('production-network', 'USDC_ETHEREUM');
  assert.equal(field(h.tree, 'production-network').props.value, 'USDC_POLYGON');
  await h.change('production-network', 'USDC_ARBITRUM');
  await h.change('production-network', 'USDC');
  assert.equal(h.calls.quoteInputs.at(-1).input.destinationCurrencyCode, 'USDC');
  assert.equal(h.calls.quoteInputs.at(-1).input.amount, 70);
  assert.ok(all(h.tree).includes('Cotización en Ethereum'));
  assert.equal(h.calls.session.length, 0);
  form(h.tree).props.onSubmit({ preventDefault() {} });
  assert.equal(h.calls.session.length, 1);
  const [request, expectedAddress] = h.calls.session[0];
  assert.equal(expectedAddress, address);
  assert.equal(request.serviceProvider, 'RAMPNOW');
  assert.equal(request.destinationCurrencyCode, 'USDC');
  assert.equal(request.amount, 70);
  assert.equal(Object.hasOwn(request, 'address'), false);
  h.waiting.resolve({ checkoutUrl: 'https://meldcrypto.com/?token=synthetic_opaque', destination: ethereumDestination });
  await h.flush();
  assert.deepEqual(h.calls.opened, ['https://meldcrypto.com/?token=synthetic_opaque']);
  await h.change('production-country', 'MX');
  assert.equal(field(h.tree, 'production-network'), undefined);
});

for (const [paymentMethod, label, network, destination] of [
  ['APPLE_PAY', 'Apple Pay', 'USDC_ARBITRUM', { address, asset: 'USDC', network: 'arbitrum', chainId: 42161 }],
  ['GOOGLE_PAY', 'Google Pay', 'USDC', { address, asset: 'USDC', network: 'ethereum', chainId: 1 }],
]) {
  test('RampNow displays and sends ' + label + ' with the selected USDC network', async t => {
    const networks = ['USDC_POLYGON', 'USDC_ARBITRUM', 'USDC'];
    const paymentMethods = ['CREDIT_DEBIT_CARD', 'APPLE_PAY', 'GOOGLE_PAY'].map(method => ({ method, currencyCode: 'USD',
      minimumAmount: 50, maximumAmount: 5000, destinationCurrencyCodes: networks }));
    const config = {
      options: async (country, currency) => country === 'US' && currency === 'USD' ? {
        destinationCurrencyCode: 'USDC_POLYGON', routes: [{ serviceProvider: 'RAMPNOW', paymentMethods }],
      } : { routes: [] },
      quotes: () => [{ serviceProvider: 'RAMPNOW', destinationAmount: 47, totalFee: 3 }],
    };
    const h = fixture(t, config); await h.flush(); await h.change('production-country', 'US');
    assert.equal(field(h.tree, 'production-network'), undefined);
    const options = all(field(h.tree, 'production-method')).filter(node => node?.type === 'option');
    assert.equal(options.find(node => node.props.value === paymentMethod).props.children, label);
    await h.change('production-method', 'CREDIT_DEBIT_CARD');
    await h.change('production-network', 'USDC');
    await h.change('production-method', paymentMethod);
    assert.equal(field(h.tree, 'production-network').props.value, 'USDC_POLYGON');
    await h.change('production-network', network);
    const { input } = h.calls.quoteInputs.at(-1);
    assert.equal(input.paymentMethodType, paymentMethod);
    assert.equal(input.destinationCurrencyCode, network);
    assert.equal(h.calls.session.length, 0);
    form(h.tree).props.onSubmit({ preventDefault() {} });
    const [checkout, expectedAddress] = h.calls.session[0];
    assert.equal(h.calls.session.length, 1);
    assert.equal(checkout.serviceProvider, 'RAMPNOW');
    assert.equal(checkout.paymentMethodType, paymentMethod);
    assert.equal(checkout.destinationCurrencyCode, network);
    assert.equal(expectedAddress, address);
    h.waiting.resolve({ checkoutUrl: 'https://meldcrypto.com/?token=synthetic_opaque', destination });
    await h.flush();
    assert.deepEqual(h.calls.opened, ['https://meldcrypto.com/?token=synthetic_opaque']);
  });
}

test('new fiat initializes its own provider minimum and never carries USD 50 into MXN or COP', async t => {
  const h = fixture(t); await h.flush(); await h.change('production-country', 'US'); await h.change('production-method', 'CREDIT_DEBIT_CARD');
  assert.equal(field(h.tree, 'production-amount').props.value, '50'); assert.equal(field(h.tree, 'production-amount').props.min, 50); assert.equal(field(h.tree, 'production-amount').props.max, 25000);
  await h.change('production-country', 'MX'); assert.equal(field(h.tree, 'production-amount'), undefined);
  await h.change('production-mexico-MXN', 'MXN');
  assert.equal(field(h.tree, 'production-amount').props.value, '200');
  assert.equal(h.calls.quoteInputs.at(-1).input.sourceCurrencyCode, 'MXN');
  assert.equal(h.calls.quoteInputs.at(-1).input.paymentMethodType, 'SPEI');
  assert.equal(h.calls.quoteInputs.at(-1).destinationCurrencyCode, 'USDC_POLYGON');
  assert.equal(submit(h.tree).props.children.at(-1), 'Continuar con Onramp Money');
  await h.change('production-country', 'CO'); await h.change('production-method', 'PSE'); assert.equal(field(h.tree, 'production-amount').props.value, '42300');
  await h.change('production-currency', 'USD'); assert.equal(field(h.tree, 'production-amount').props.value, ''); assert.equal(field(h.tree, 'production-method').props.value, '');
});

test('changing methods preserves a typed amount, explains an invalid range and offers its real minimum without a quote', async t => {
  const h = fixture(t); await h.flush(); await h.change('production-country', genericCountry); await h.change('production-method', 'SPEI'); await h.change('production-amount', '250');
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
  h.waiting.resolve({ checkoutUrl: 'https://global.transak.com/?apiKey=fixture&sessionId=fixture', destination: polygonDestination }); await h.flush();
  assert.equal(h.calls.opened.length, 1);
});

test('a captured old quote submit cannot open checkout after editing its amount, retiring the owner or unmounting', async t => {
  const h = fixture(t); await h.flush(); await h.change('production-country', 'US'); await h.change('production-method', 'CREDIT_DEBIT_CARD');
  all(h.tree).find(node => node?.props?.name === 'production-provider').props.onChange(); await h.flush(); const old = form(h.tree).props.onSubmit;
  await h.change('production-amount', '100'); old({ preventDefault() {} }); assert.equal(h.calls.popups.length, 0);
  const current = form(h.tree).props.onSubmit; h.stop(); current({ preventDefault() {} }); assert.equal(h.calls.popups.length, 0); assert.equal(h.calls.session.length, 0);
});

test('failed preparation refreshes only owned history and displays unavailable attempts as not completed without retrying checkout', async t => {
  const warnings = []; t.mock.method(console, 'warn', (...args) => warnings.push(args));
  const h = fixture(t); await h.flush(); await h.change('production-country', 'US'); await h.change('production-method', 'CREDIT_DEBIT_CARD');
  all(h.tree).find(node => node?.props?.name === 'production-provider').props.onChange(); await h.flush();
  form(h.tree).props.onSubmit({ preventDefault() {} });
  assert.equal(h.calls.session.length, 1); assert.equal(h.calls.history, 1);
  h.setHistory([{ checkoutReference: '11111111-1111-4111-8111-111111111111', serviceProvider: 'TRANSAK', requestedAmount: 50,
    sourceCurrencyCode: 'USD', status: 'unavailable', destination: polygonDestination, confirmation: { state: 'unconfirmed', source: 'none', testMode: false } }]);
  h.waiting.reject(Error('wallet_production_unavailable')); await h.flush();
  assert.equal(h.calls.history, 2); assert.equal(h.calls.popups[0].closed, true); assert.equal(h.calls.opened.length, 0);
  assert.deepEqual(warnings, [['wallet_production_checkout_failed', { error: 'wallet_production_unavailable' }]]);
  const row = all(h.tree).find(node => node?.type === 'li');
  assert.ok(row); assert.equal(all(row).find(node => node?.type === 'span').props.children.at(-1), translateMessage('es', 'walletProduction.failed'));
  for (let index = 0; index < 3; index++) { h.render(); await h.flush(); }
  assert.equal(h.calls.session.length, 1); assert.equal(h.calls.history, 2);
  assert.ok(all(h.tree).some(node => node?.props?.role === 'alert' && node.props.children === translateMessage('es', 'walletProduction.unavailable')));
  assert.ok(!all(h.tree).some(node => node?.type === 'button' && node.props.children === 'Actualizar cotización'));
  assert.equal(submit(h.tree).props.disabled, false);
  form(h.tree).props.onSubmit({ preventDefault() {} }); await h.flush();
  assert.equal(h.calls.retries, 1); assert.equal(h.calls.session.length, 1);
  assert.equal(all(h.tree).some(node => node?.props?.role === 'alert' && node.props.children === translateMessage('es', 'walletProduction.unavailable')), false);
});

test('an authoritative removed country clears its complete selection and aborts a preparing checkout without choosing another country', async t => {
  const config = { discovery: async () => { throw Error('catalog unavailable'); } }, h = fixture(t, config);
  await h.flush(); const retry = retryButton(h.tree).props.onClick;
  config.discovery = null; retry(); await h.flush();
  await h.change('production-country', 'US'); await h.change('production-method', 'CREDIT_DEBIT_CARD');
  all(h.tree).find(node => node?.props?.name === 'production-provider').props.onChange(); await h.flush();
  form(h.tree).props.onSubmit({ preventDefault() {} }); assert.equal(h.calls.session.length, 1);
  config.discovery = async country => country ? discoveryValue(country) : { countries: [{ code: genericCountry, name: 'Canada' }] };
  retry(); await h.flush();
  for (const id of ['production-country', 'production-currency', 'production-method', 'production-amount']) assert.equal(field(h.tree, id).props.value, '');
  assert.equal(h.calls.session[0][2].signal.aborted, true); assert.equal(h.calls.popups[0].closed, true);
  h.waiting.resolve({ checkoutUrl: 'https://global.transak.com/?apiKey=fixture&sessionId=fixture', destination: polygonDestination }); await h.flush();
  assert.equal(h.calls.opened.length, 0); assert.equal(h.calls.session.length, 1); assert.equal(submit(h.tree).props.disabled, true);
});

test('a late country catalog cannot reset a newer residence and fiat selection', async t => {
  const config = { discovery: async () => { throw Error('catalog unavailable'); } }, h = fixture(t, config);
  await h.flush(); const retry = retryButton(h.tree).props.onClick; config.discovery = null; retry(); await h.flush();
  await h.change('production-country', 'US');
  const old = deferred(); config.discovery = country => country ? discoveryValue(country) : old.promise;
  retry(); await h.flush(); await h.change('production-country', genericCountry);
  old.resolve({ countries: [{ code: 'US', name: 'United States' }] }); await h.flush();
  assert.equal(field(h.tree, 'production-country').props.value, genericCountry); assert.equal(field(h.tree, 'production-currency').props.value, 'MXN');
  assert.equal(h.calls.session.length, 0); assert.equal(h.calls.popups.length, 0);
});

test('currency refresh retains an explicit valid choice and clears a withdrawn choice without selecting its replacement', async t => {
  const config = { discovery: async country => { if (country) throw Error('fiat unavailable'); return discoveryValue(country); } }, h = fixture(t, config);
  await h.flush(); await h.change('production-country', genericCountry); const retry = retryButton(h.tree).props.onClick;
  config.discovery = null; retry(); await h.flush(); await h.change('production-currency', 'USD'); await h.change('production-method', 'CREDIT_DEBIT_CARD');
  retry(); await h.flush(); assert.equal(field(h.tree, 'production-currency').props.value, 'USD');
  config.discovery = async country => country ? { country, currencies: [{ code: 'MXN', name: 'Mexican Peso', decimalPlaces: 2 }], defaultCurrencyCode: 'MXN' } : discoveryValue(country);
  retry(); await h.flush(); assert.equal(field(h.tree, 'production-country').props.value, genericCountry);
  for (const id of ['production-currency', 'production-method', 'production-amount']) assert.equal(field(h.tree, id).props.value, '');
  assert.equal(submit(h.tree).props.disabled, true); assert.equal(h.calls.session.length, 0);
});

test('a fresh cached quote cannot display or submit a provider withdrawn from the current exact method routes', async t => {
  const config = { options: async () => { throw Error('method catalog unavailable'); } }, h = fixture(t, config);
  await h.flush(); await h.change('production-country', genericCountry); const retry = retryButton(h.tree).props.onClick;
  config.options = null; retry(); await h.flush(); await h.change('production-method', 'SPEI'); await h.change('production-amount', '250');
  all(h.tree).find(node => node?.props?.name === 'production-provider' && node.props.value === 'TRANSAK').props.onChange(); await h.flush();
  const oldSubmit = form(h.tree).props.onSubmit;
  config.options = async () => ({ routes: [{ serviceProvider: 'ONRAMPMONEY', paymentMethods: [{ method: 'SPEI', currencyCode: 'MXN', minimumAmount: 200, maximumAmount: 500000 }] }] });
  retry(); await h.flush(); assert.equal(field(h.tree, 'production-method').props.value, 'SPEI');
  assert.equal(field(h.tree, 'production-amount').props.value, '250');
  assert.equal(all(h.tree).some(node => node?.props?.name === 'production-provider'), false);
  assert.equal(submit(h.tree).props.disabled, false); oldSubmit({ preventDefault() {} });
  assert.equal(h.calls.retries, 0);
  form(h.tree).props.onSubmit({ preventDefault() {} });
  assert.equal(h.calls.session.length, 0); assert.equal(h.calls.popups.length, 0); assert.equal(h.calls.retries, 1);
});

test('a rejected old country catalog cannot paint an error or clear the new residence method loader', async t => {
  const config = { discovery: async () => { throw Error('catalog unavailable'); } }, h = fixture(t, config);
  await h.flush(); const retry = retryButton(h.tree).props.onClick; config.discovery = null; retry(); await h.flush();
  const old = deferred(), methods = deferred();
  config.discovery = country => country ? discoveryValue(country) : old.promise; config.options = () => methods.promise;
  retry(); await h.flush(); await h.change('production-country', genericCountry);
  const placeholder = () => all(field(h.tree, 'production-method')).find(node => node?.type === 'option' && node.props.value === '').props.children;
  assert.equal(placeholder(), translateMessage('es', 'walletProduction.loading'));
  old.reject(Error('retired metadata failed')); await h.flush();
  assert.equal(placeholder(), translateMessage('es', 'walletProduction.loading'));
  assert.equal(all(h.tree).some(node => node?.props?.role === 'alert'), false);
  assert.equal(field(h.tree, 'production-country').props.value, genericCountry); assert.equal(h.calls.session.length, 0);
  methods.resolve({ routes: [] }); await h.flush(); assert.equal(submit(h.tree).props.disabled, true);
});

test('a rejected stale currency refresh cannot paint an error or clear the newly chosen fiat method loader', async t => {
  const config = { discovery: async country => { if (country) throw Error('fiat unavailable'); return discoveryValue(country); } }, h = fixture(t, config);
  await h.flush(); await h.change('production-country', genericCountry); const retry = retryButton(h.tree).props.onClick;
  config.discovery = null; retry(); await h.flush();
  const old = deferred(), methods = deferred(); config.discovery = country => country ? old.promise : discoveryValue(country);
  retry(); await h.flush(); config.options = () => methods.promise; await h.change('production-currency', 'USD');
  const placeholder = () => all(field(h.tree, 'production-method')).find(node => node?.type === 'option' && node.props.value === '').props.children;
  assert.equal(placeholder(), translateMessage('es', 'walletProduction.loading'));
  old.reject(Error('old currency metadata failed')); await h.flush();
  assert.equal(placeholder(), translateMessage('es', 'walletProduction.loading'));
  assert.equal(all(h.tree).some(node => node?.props?.role === 'alert'), false);
  assert.equal(field(h.tree, 'production-currency').props.value, 'USD'); assert.equal(h.calls.session.length, 0);
  methods.resolve({ routes: [] }); await h.flush(); assert.equal(submit(h.tree).props.disabled, true);
});

test('a sole real fiat, valid method and quoted provider remove redundant choices but never open checkout automatically', async t => {
  const config = { discovery: async country => country ? { country, defaultCurrencyCode: null, currencies: [{ code: 'MXN', name: 'Mexican Peso', decimalPlaces: 2 }] } : discoveryValue(country),
    options: async () => ({ routes: [{ serviceProvider: 'ONRAMPMONEY', paymentMethods: [{ method: 'SPEI', currencyCode: 'MXN', minimumAmount: 200, maximumAmount: 500000 }] }] }),
    quotes: () => [{ serviceProvider: 'ONRAMPMONEY', destinationAmount: 10.18, totalFee: 2 }] };
  const h = fixture(t, config); await h.flush(); assert.equal(field(h.tree, 'production-country').props.value, '');
  await h.change('production-country', genericCountry);
  const fiatField = field(h.tree, 'production-currency');
  assert.equal(fiatField.type, 'output');
  assert.deepEqual(all(fiatField).filter(node => typeof node === 'string'), ['MXN', ' · ', 'Mexican Peso']);
  assert.equal(all(h.tree).find(node => node?.type === 'label' && node.props.htmlFor === 'production-currency').props.children, 'Moneda de pago');
  const methodField = field(h.tree, 'production-method');
  assert.equal(methodField.type, 'input'); assert.equal(methodField.props.readOnly, true); assert.equal(methodField.props.value, 'SPEI');
  assert.equal(field(h.tree, 'production-amount').props.value, '200');
  assert.equal(all(h.tree).find(node => node?.props?.name === 'production-provider').props.checked, true);
  assert.equal(submit(h.tree).props.disabled, false); assert.equal(h.calls.session.length, 0); assert.equal(h.calls.popups.length, 0);
  assert.equal(h.calls.connect, 0); assert.equal(h.calls.binding, 0);
  form(h.tree).props.onSubmit({ preventDefault() {} }); assert.equal(h.calls.session.length, 1);
});

test('changing method never silently substitutes the previously selected provider even when the next quote has only one provider', async t => {
  const config = { quotes: input => [{ serviceProvider: input.paymentMethodType === 'SPEI' ? 'TRANSAK' : 'BANXA', destinationAmount: 48, totalFee: 2 }] };
  const h = fixture(t, config); await h.flush(); await h.change('production-country', genericCountry); await h.change('production-method', 'SPEI');
  assert.equal(all(h.tree).find(node => node?.props?.name === 'production-provider').props.checked, true);
  await h.change('production-amount', '1000'); await h.change('production-method', 'CREDIT_DEBIT_CARD');
  const replacement = all(h.tree).find(node => node?.props?.name === 'production-provider');
  assert.equal(replacement.props.value, 'BANXA'); assert.equal(replacement.props.checked, false); assert.equal(submit(h.tree).props.disabled, true);
  assert.equal(field(h.tree, 'production-amount').props.value, '1000'); assert.equal(h.calls.session.length, 0);
  replacement.props.onChange(); await h.flush(); assert.equal(submit(h.tree).props.disabled, false); assert.equal(h.calls.session.length, 0);
});

test('a withdrawn selected method requires an explicit replacement rather than automatically choosing the sole remaining method', async t => {
  const config = { options: async () => { throw Error('initial method read failed'); }, quotes: () => [{ serviceProvider: 'TRANSAK', destinationAmount: 48, totalFee: 2 }] };
  const h = fixture(t, config); await h.flush(); await h.change('production-country', genericCountry); const retry = retryButton(h.tree).props.onClick;
  config.options = async () => ({ routes: [{ serviceProvider: 'TRANSAK', paymentMethods: [{ method: 'SPEI', currencyCode: 'MXN', minimumAmount: 200, maximumAmount: 500000 }] }] });
  retry(); await h.flush(); assert.equal(field(h.tree, 'production-method').props.value, 'SPEI');
  config.options = async () => ({ routes: [{ serviceProvider: 'TRANSAK', paymentMethods: [{ method: 'CREDIT_DEBIT_CARD', currencyCode: 'MXN', minimumAmount: 931, maximumAmount: 500000 }] }] });
  retry(); await h.flush(); assert.equal(field(h.tree, 'production-method').type, 'select'); assert.equal(field(h.tree, 'production-method').props.value, '');
  assert.equal(submit(h.tree).props.disabled, true); assert.equal(h.calls.session.length, 0);
});

test('reselecting the current residence preserves the chosen method, typed amount and valid quote', async t => {
  const h = fixture(t); await h.flush(); await h.change('production-country', genericCountry); await h.change('production-method', 'SPEI'); await h.change('production-amount', '2000');
  all(h.tree).find(node => node?.props?.name === 'production-provider').props.onChange(); await h.flush();
  assert.equal(submit(h.tree).props.disabled, false); await h.change('production-country', genericCountry);
  assert.equal(field(h.tree, 'production-currency').props.value, 'MXN'); assert.equal(field(h.tree, 'production-method').props.value, 'SPEI');
  assert.equal(field(h.tree, 'production-amount').props.value, '2000'); assert.equal(submit(h.tree).props.disabled, false);
  assert.equal(h.calls.session.length, 0); assert.equal(h.calls.popups.length, 0);
});
