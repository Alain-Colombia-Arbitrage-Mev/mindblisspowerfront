import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { translateMessage } from '../../../../i18n/translate.mjs';
import { PERSONAL_FUNDING_COUNTRIES, validFundingAmount, WALLET_GATEWAY_FAILURE_REASONS, FUNDING_UUID, fundingStatus } from '../../../../lib/wallet-funding-contract.mjs';
import { walletFundingOwnerKey } from '../../../../lib/wallet-funding-owner.mjs';

const require = createRequire(import.meta.url);
const icons = new Proxy({}, { get: () => () => null });
const i18n = { useI18n: () => ({ locale: 'es', t: (key, values) => translateMessage('es', key, values) }) };
const styles = { default: new Proxy({}, { get: (_target, key) => key }) };

function load(filename, mocks) {
  const source = readFileSync(new URL(filename, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(id => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    if (id === '@/components/ui/popover') return { Popover: ({ children }) => children, PopoverContent: ({ children }) => children, PopoverTrigger: ({ children }) => children };
    if (id === '@/lib/member-session-context') return { useMemberSession: () => ({ subject: 'owner', email: 'owner@example.test' }) };
    if (id === '@/lib/wallet-funding-owner.mjs') return { walletFundingOwnerKey };
    if (id === '@/lib/wallet-funding-contract.mjs') return { PERSONAL_FUNDING_COUNTRIES, validFundingAmount, WALLET_GATEWAY_FAILURE_REASONS, FUNDING_UUID, fundingStatus };
    if (id.endsWith('.module.css')) return styles;
    if (id === 'react/jsx-runtime' || id === 'react') return require(id);
    assert.fail(`Unexpected dependency ${id}`);
  }, module, module.exports);
  return module.exports;
}

function componentHarness(filename, name, mocks) {
  const state = [], refs = [], effects = [], callbacks = [];
  let stateIndex = 0, refIndex = 0, effectIndex = 0, callbackIndex = 0;
  const pendingEffects = [];
  const hooks = { ...React,
    useState(initial) { const index = stateIndex++; if (!(index in state)) state[index] = initial; return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }]; },
    useRef(initial) { const index = refIndex++; return refs[index] ||= { current: initial }; },
    useId: () => 'funding-test',
    useCallback(callback, deps) { const index = callbackIndex++, previous = callbacks[index]; if (!previous || deps.some((value, i) => value !== previous.deps[i])) callbacks[index] = { callback, deps }; return callbacks[index].callback; },
    useEffect(effect, deps) { const index = effectIndex++, previous = effects[index]; if (!previous || deps.some((value, i) => value !== previous.deps[i])) pendingEffects.push(() => { previous?.cleanup?.(); effects[index] = { deps, cleanup: effect() }; }); },
  };
  const exports = load(filename, { ...mocks, react: hooks });
  return { render(props = {}) { stateIndex = 0; refIndex = 0; effectIndex = 0; callbackIndex = 0; const tree = exports[name](props); while (pendingEffects.length) pendingEffects.shift()(); return tree; },
    unmount() { for (const effect of effects) effect?.cleanup?.(); }, exports, state };
}

function formHarness(name, api, selectedCountry = 'US') {
  const harness = componentHarness('WalletFundingForm.jsx', name, { 'lucide-react': icons, '@/i18n/LanguageProvider': i18n,
    '@/lib/meld-onramp-client.mjs': { ONRAMP_COUNTRIES: [['CO'], ['US'], ['MX'], ['ES'], ['PA']] },
    '@/lib/wallet-funding-client.mjs': { fundingRequestId: () => 'd8a4c010-cc33-44da-a297-8b3c6440f491', ...api },
    '@/lib/wallet-funding-contract.mjs': { PERSONAL_FUNDING_COUNTRIES, validFundingAmount },
  });
  const render = harness.render;
  let selected = false;
  return { ...harness, render(props = {}) {
    const context = { destinationAddress: `0x${'1'.repeat(40)}`, ...props };
    if (!selected && selectedCountry) {
      selected = true;
      // Fixture setup represents an explicit user selection; the real initial form is empty.
      const initial = render({ ...context, onSelectionChange: undefined });
      find(initial, 'FundingCountryField').props.onChange(selectedCountry);
    }
    return render(context);
  } };
}

function find(node, name) {
  if (typeof name === 'function' ? name(node) : node?.type?.name === name) return node;
  return React.Children.toArray(node?.props?.children).map(child => find(child, name)).find(Boolean);
}
const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
const statusReference = 'd8a4c010-cc33-44da-a297-8b3c6440f491';
const secondStatusReference = 'd8a4c010-cc33-44da-a297-8b3c6440f492';
const personalStatus = { checkoutReference: statusReference, walletKind: 'personal', environment: 'production', provider: 'reown', requestedAmount: 50,
  country: 'CO', requestStatus: 'initiated', destination: { address: `0x${'1'.repeat(40)}`, asset: 'USDT', network: 'polygon', chainId: 137 },
  confirmation: { state: 'unconfirmed', source: 'none', testMode: false } };
const administrativeStatus = { ...personalStatus, walletKind: 'administrative', environment: 'sandbox', provider: 'meld', requestStatus: 'session_created',
  destination: { ...personalStatus.destination, address: `0x${'2'.repeat(40)}` }, confirmation: { state: 'unconfirmed', source: 'none', testMode: true } };
const statusMocks = read => ({ 'lucide-react': icons, '@/i18n/LanguageProvider': i18n, '@/lib/wallet-funding-client.mjs': { readWalletFundingStatus: read } });

test('administrative country discovery cancels both old requests and automatically chooses the available Colombian sandbox provider', async t => {
  const calls = [], submitted = []; let personalCalls = 0;
  const harness = formHarness('AdministrativeSandboxFundingForm', {
    readPersonalFundingOptions() { personalCalls++; throw Error('wrong wallet'); },
    readAdministrativeSandboxOptions(country, serviceProvider, { signal }) { return new Promise(resolve => calls.push({ country, serviceProvider, signal, resolve })); },
  });
  t.after(() => harness.unmount());
  const props = { onContinue: async value => submitted.push(value) };
  harness.render(props); let tree = harness.render(props);
  assert.equal(calls[0].serviceProvider, 'TRANSAK');
  assert.equal(calls[1].serviceProvider, 'BANXA');
  assert.equal(calls[0].signal, calls[1].signal);
  find(tree, 'FundingCountryField').props.onChange('CO');
  harness.render(props); tree = harness.render(props);
  assert.equal(calls[0].signal.aborted, true);
  assert.equal(calls[1].signal.aborted, true);
  assert.deepEqual(calls.slice(2).map(call => call.country), ['CO', 'CO']);
  assert.deepEqual(find(tree, 'FundingMethodField').props.methods, []);
  for (const call of calls.slice(0, 2)) call.resolve({ country: 'US', serviceProvider: call.serviceProvider, paymentMethods: ['BANK_TRANSFER'], routes: [{ paymentMethods: [{ method: 'BANK_TRANSFER', minimumUsd: 50, maximumUsd: 500 }] }] });
  calls[2].resolve({ country: 'CO', serviceProvider: 'TRANSAK', paymentMethods: [], routes: [] });
  calls[3].resolve({ country: 'CO', serviceProvider: 'BANXA', paymentMethods: ['CREDIT_DEBIT_CARD'], routes: [{ paymentMethods: [{ method: 'CREDIT_DEBIT_CARD', minimumUsd: 50, maximumUsd: 500 }] }] });
  await flush(); harness.render(props); tree = harness.render(props);
  assert.deepEqual(find(tree, 'FundingMethodField').props.methods, ['CREDIT_DEBIT_CARD']);
  assert.equal(find(tree, node => node?.type === 'select' && node.props.id.endsWith('-provider')), undefined, 'one eligible provider requires no selection');
  tree.props.onSubmit({ preventDefault() {} }); await flush();
  assert.equal(submitted[0].serviceProvider, 'BANXA');
  assert.equal(submitted[0].countryCode, 'CO');
  assert.equal(submitted[0].paymentMethodType, 'CREDIT_DEBIT_CARD');
  assert.equal(personalCalls, 0);
});

test('administrative choices preserve a selected provider when the amount changes instead of silently replacing it', async t => {
  const calls = [], submitted = [];
  const harness = formHarness('AdministrativeSandboxFundingForm', {
    readPersonalFundingOptions() { assert.fail('personal discovery called'); },
    readAdministrativeSandboxOptions(country, serviceProvider, { signal }) { return new Promise(resolve => calls.push({ country, serviceProvider, signal, resolve })); },
  });
  t.after(() => harness.unmount());
  const props = { onContinue: async input => submitted.push(input) };
  harness.render(props);
  for (const call of calls) call.resolve({ country: 'US', serviceProvider: call.serviceProvider, paymentMethods: ['CREDIT_DEBIT_CARD'], routes: [{ paymentMethods: [{ method: 'CREDIT_DEBIT_CARD', minimumUsd: 50, maximumUsd: call.serviceProvider === 'TRANSAK' ? 100 : 500 }] }] });
  await flush(); harness.render(props); let tree = harness.render(props);
  const select = find(tree, node => node?.type === 'select' && node.props.id.endsWith('-provider'));
  assert.equal(select.props.value, 'TRANSAK');
  select.props.onChange({ target: { value: 'BANXA' } });
  harness.render(props); tree = harness.render(props);
  tree.props.onSubmit({ preventDefault() {} }); await flush();
  assert.equal(submitted[0].serviceProvider, 'BANXA');
  find(tree, 'FundingAmountField').props.onChange('250');
  harness.render(props); tree = harness.render(props);
  assert.equal(find(tree, node => node?.type === 'select' && node.props.id.endsWith('-provider')).props.value, 'BANXA');
  tree.props.onSubmit({ preventDefault() {} }); await flush();
  assert.equal(submitted[1].serviceProvider, 'BANXA');
  assert.equal(calls.length, 2, 'provider and amount changes use their own already-fetched country routes');
  find(tree, 'FundingAmountField').props.onChange('50');
  harness.render(props); tree = harness.render(props);
  find(tree, 'FundingCountryField').props.onChange('CO');
  harness.render(props);
  for (const call of calls.slice(2)) call.resolve({ country: 'CO', serviceProvider: call.serviceProvider, paymentMethods: ['CREDIT_DEBIT_CARD'], routes: [{ paymentMethods: [{ method: 'CREDIT_DEBIT_CARD', minimumUsd: 50, maximumUsd: 500 }] }] });
  await flush(); harness.render(props); tree = harness.render(props);
  tree.props.onSubmit({ preventDefault() {} }); await flush();
  assert.equal(submitted[2].serviceProvider, 'BANXA', 'an explicit provider preference survives a country change when both providers remain available');
});

test('administrative partial discovery keeps only verified eligible routes and distinguishes incomplete coverage from a supported empty result', async t => {
  const cases = [
    { name: 'US Transak valid and Banxa failed permits only Transak with a partial warning', country: 'US', transak: 'valid', banxa: 'failed', status: 'ready', partial: true },
    { name: 'CO Transak empty and Banxa failed remains a failed lookup, not an unsupported country', country: 'CO', transak: 'empty', banxa: 'failed', status: 'error', partial: false },
    { name: 'both failed remain blocked with retry', country: 'US', transak: 'failed', banxa: 'failed', status: 'error', partial: false },
    { name: 'both successful empty are legitimate no availability', country: 'CO', transak: 'empty', banxa: 'empty', status: 'ready', partial: false },
    { name: 'a returned route retains its limits while an insufficient amount cannot submit', country: 'US', transak: 'aboveMinimum', banxa: 'failed', status: 'ready', partial: true },
  ];
  for (const scenario of cases) await t.test(scenario.name, async t => {
    const calls = [], submitted = [];
    const harness = formHarness('AdministrativeSandboxFundingForm', {
      readPersonalFundingOptions() { assert.fail('personal discovery called'); },
      readAdministrativeSandboxOptions(country, serviceProvider, { signal }) { return new Promise((resolve, reject) => calls.push({ country, serviceProvider, signal, resolve, reject })); },
    });
    t.after(() => harness.unmount());
    const props = { onContinue: async input => { submitted.push(input); throw Error('provider session failed without permission to switch'); } };
    let tree = harness.render(props);
    if (scenario.country !== 'US') { find(tree, 'FundingCountryField').props.onChange(scenario.country); tree = harness.render(props); }
    for (const call of calls) {
      if (call.signal.aborted) { call.resolve({ country: call.country, serviceProvider: call.serviceProvider, paymentMethods: [], routes: [] }); continue; }
      const outcome = scenario[call.serviceProvider === 'TRANSAK' ? 'transak' : 'banxa'];
      if (outcome === 'failed') { call.reject(Error('PRIVATE upstream response api_key=never-render-this')); continue; }
      const paymentMethods = outcome === 'empty' ? [] : ['CREDIT_DEBIT_CARD'];
      call.resolve({ country: call.country, serviceProvider: call.serviceProvider, paymentMethods,
        routes: paymentMethods.length ? [{ paymentMethods: [{ method: 'CREDIT_DEBIT_CARD', minimumUsd: outcome === 'aboveMinimum' ? 75 : 50, maximumUsd: 500 }] }] : [] });
    }
    await flush(); harness.render(props); tree = harness.render(props);
    const field = find(tree, 'FundingMethodField');
    assert.equal(field.props.status, scenario.status);
    assert.equal(field.props.partialAvailability, scenario.partial);
    assert.deepEqual(field.props.methods, scenario.partial ? ['CREDIT_DEBIT_CARD'] : []);
    const eligible = scenario.partial && scenario.transak !== 'aboveMinimum';
    assert.equal(find(tree, 'FundingSubmit').props.disabled, !eligible);
    const html = renderToStaticMarkup(field.type(field.props));
    assert.equal(html.includes(translateMessage('es', 'funding.methodsPartiallyLoaded')), scenario.partial);
    assert.doesNotMatch(html, /PRIVATE|api_key|never-render-this/);
    assert.deepEqual(harness.state[4].failedProviders, ['TRANSAK', 'BANXA'].filter(provider => scenario[provider === 'TRANSAK' ? 'transak' : 'banxa'] === 'failed'));
    assert.equal(harness.state[4].providers.some(provider => harness.state[4].failedProviders.includes(provider.serviceProvider)), false);
    if (!scenario.partial) assert.match(html, new RegExp(translateMessage('es', scenario.status === 'error' ? 'funding.methodsLoadFailed' : 'funding.methodsForAmountUnavailable').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    tree.props.onSubmit({ preventDefault() {} }); await flush();
    assert.equal(submitted.length, eligible ? 1 : 0, 'discovery never starts a checkout automatically or uses missing routes');
    if (eligible) {
      assert.equal(submitted[0].serviceProvider, 'TRANSAK');
      assert.equal(submitted[0].paymentMethodType, 'CREDIT_DEBIT_CARD');
      assert.equal(submitted[0].countryCode, 'US');
      assert.equal(submitted.length, 1, 'a failed selected-provider POST never falls back to another provider');
    }
    if (scenario.transak === 'aboveMinimum') {
      find(tree, 'FundingAmountField').props.onChange('100');
      harness.render(props); tree = harness.render(props);
      assert.equal(find(tree, 'FundingMethodField').props.status, 'ready');
      assert.equal(find(tree, 'FundingMethodField').props.partialAvailability, true);
      assert.equal(find(tree, 'FundingSubmit').props.disabled, false);
    }
    const oldCalls = [...calls];
    find(tree, 'FundingMethodField').props.onRetry();
    harness.render(props); tree = harness.render(props);
    assert.equal(calls.length, oldCalls.length + 2);
    assert.ok(oldCalls.every(call => call.signal.aborted), 'retry cancels the previous country epoch for both providers');
    assert.equal(calls.at(-1).signal, calls.at(-2).signal);
    assert.equal(find(tree, 'FundingMethodField').props.status, 'loading');
    assert.equal(find(tree, 'FundingSubmit').props.disabled, true);
  });
});

test('a failed preferred administrative provider is excluded before submit without erasing an explicit preference that can recover', async t => {
  const calls = [], submitted = [];
  const harness = formHarness('AdministrativeSandboxFundingForm', {
    readPersonalFundingOptions() { assert.fail('personal discovery called'); },
    readAdministrativeSandboxOptions(country, serviceProvider, { signal }) { return new Promise((resolve, reject) => calls.push({ country, serviceProvider, signal, resolve, reject })); },
  });
  t.after(() => harness.unmount());
  const props = { onContinue: async input => submitted.push(input) };
  const valid = call => ({ country: call.country, serviceProvider: call.serviceProvider, paymentMethods: ['CREDIT_DEBIT_CARD'],
    routes: [{ paymentMethods: [{ method: 'CREDIT_DEBIT_CARD', minimumUsd: 50, maximumUsd: 500 }] }] });
  harness.render(props);
  for (const call of calls) call.resolve(valid(call));
  await flush(); harness.render(props); let tree = harness.render(props);
  find(tree, node => node?.type === 'select' && node.props.id.endsWith('-provider')).props.onChange({ target: { value: 'BANXA' } });
  harness.render(props); tree = harness.render(props);
  find(tree, 'FundingMethodField').props.onRetry(); harness.render(props);
  calls[2].resolve(valid(calls[2])); calls[3].reject(Error('temporary outage'));
  await flush(); harness.render(props); tree = harness.render(props);
  assert.equal(harness.state[2], 'BANXA', 'a temporary discovery outage does not silently replace an explicit preference');
  assert.equal(find(tree, node => node?.type === 'select' && node.props.id.endsWith('-provider')), undefined, 'the failed provider cannot be selected');
  assert.match(renderToStaticMarkup(tree), /Procesado por Transak/);
  tree.props.onSubmit({ preventDefault() {} }); await flush();
  assert.equal(submitted.length, 1); assert.equal(submitted[0].serviceProvider, 'TRANSAK');
  find(tree, 'FundingMethodField').props.onRetry(); harness.render(props);
  for (const call of calls.slice(4)) call.resolve(valid(call));
  await flush(); harness.render(props); tree = harness.render(props);
  assert.equal(find(tree, node => node?.type === 'select' && node.props.id.endsWith('-provider')).props.value, 'BANXA');
  assert.equal(submitted.length, 1, 'recovery never submits a new checkout');
  for (const locale of ['es', 'en', 'ar', 'zh']) assert.ok(!translateMessage(locale, 'funding.methodsPartiallyLoaded').startsWith('funding.'), locale);
});

test('administrative method availability and amount limits have distinct localized recovery instructions', () => {
  const { administrativeFundingError } = load('WalletFundingUI.jsx', { 'lucide-react': icons, 'next/link': {}, '@/i18n/LanguageProvider': i18n });
  for (const locale of ['es', 'en', 'ar', 'zh']) {
    const t = key => translateMessage(locale, key);
    const method = administrativeFundingError(new Error('wallet_funding_method_unavailable'), t);
    const amount = administrativeFundingError(new Error('wallet_funding_amount_unavailable'), t);
    assert.equal(method, t('funding.methodReloadRequired'));
    assert.equal(amount, t('funding.amountUnavailable'));
    assert.notEqual(method, amount);
    assert.notEqual(method, t('funding.sandboxUnavailable'));
    assert.ok(!method.startsWith('funding.') && !amount.startsWith('funding.'), locale);
  }
});

test('every administrative failure remains in its own recovery flow, including unknown upstream errors', () => {
  const { administrativeFundingError } = load('WalletFundingUI.jsx', { 'lucide-react': icons, 'next/link': {}, '@/i18n/LanguageProvider': i18n });
  const cases = [
    ['unauthenticated', 'recharge.providerSession'],
    ['wallet_funding_rate_limited', 'funding.rateLimited'],
    ['wallet_funding_request_already_used', 'funding.requestUsed'],
    ['wallet_funding_method_unavailable', 'funding.methodReloadRequired'],
    ['wallet_funding_amount_unavailable', 'funding.amountUnavailable'],
    ['wallet_funding_unconfigured', 'funding.sandboxConfiguration'],
    ['wallet_funding_provider_authentication_unavailable', 'funding.sandboxProviderAuthentication'],
    ['wallet_funding_valuation_unavailable', 'funding.localMinimumPending'],
    ['wallet_funding_provider_unavailable', 'funding.sandboxUnavailable'],
    ['funding_unavailable', 'funding.sandboxUnavailable'],
    ['unrecognized-provider-failure', 'funding.sandboxUnavailable'],
  ];
  const obsoletePersonalMessages = [
    'No pudimos registrar o abrir la recarga personal. Reintenta desde esta pantalla.',
    'We could not record or open your personal top-up. Try again from this screen.',
    'تعذر تسجيل الشحن الشخصي أو فتحه. أعد المحاولة من هذه الشاشة.',
    '无法记录或打开个人充值，请从此页面重试。',
  ];
  for (const locale of ['es', 'en', 'ar', 'zh']) {
    const t = key => translateMessage(locale, key);
    for (const [code, key] of cases) {
      const message = administrativeFundingError(new Error(code), t);
      assert.equal(message, t(key), `${locale}/${code}`);
      assert.ok(!obsoletePersonalMessages.includes(message), `${locale}/${code} leaked personal recovery`);
      assert.ok(!message.startsWith('funding.'), `${locale}/${code} missing translation`);
    }
    // Untrusted error messages are never rendered directly, even if they contain
    // a former personal-flow message or HTML from a provider response.
    for (const message of [...obsoletePersonalMessages, '<script>private-provider-data</script>']) {
      assert.equal(administrativeFundingError(new Error(message), t), t('funding.sandboxUnavailable'));
    }
    assert.equal(administrativeFundingError(null, t), t('funding.sandboxUnavailable'));
  }
});

test('wallet failure markup exposes only the exact safe diagnostic enum while preserving localized customer copy', () => {
  const { WalletActionError, walletFailureDiagnostic } = load('WalletFundingUI.jsx', { 'lucide-react': icons, 'next/link': {}, '@/i18n/LanguageProvider': i18n });
  const message = translateMessage('es', 'funding.personalLinkFailed');
  for (const diagnostic of ['gateway_route_missing', 'gateway_service_unavailable', 'gateway_rejected', 'invalid_gateway_response', 'gateway_transport_unavailable']) {
    const html = renderToStaticMarkup(WalletActionError({ message, diagnostic }));
    assert.match(html, new RegExp(`data-wallet-failure="${diagnostic}"`));
    assert.ok(html.includes(message));
  }
  for (const diagnostic of ['unknown_failure', 'gateway_rejected?token=private-token', 'Bearer private-token', '<script>private-token</script>', null, {}, ['gateway_rejected']]) {
    assert.equal(walletFailureDiagnostic(diagnostic), undefined);
    const html = renderToStaticMarkup(WalletActionError({ message, diagnostic }));
    assert.doesNotMatch(html, /data-wallet-failure|private-token|unknown_failure/);
    assert.ok(html.includes(message));
  }
  assert.equal(WalletActionError({ message: '', diagnostic: 'gateway_rejected' }), null);
});

test('administrative user edits notify the page once without retrying a session or changing personal state', async t => {
  let selectionChanges = 0, sessions = 0;
  const routes = [{ paymentMethods: [
    { method: 'CREDIT_DEBIT_CARD', minimumUsd: 50, maximumUsd: 1000 },
    { method: 'BANK_TRANSFER', minimumUsd: 50, maximumUsd: 1000 },
  ] }];
  const harness = formHarness('AdministrativeSandboxFundingForm', {
    readPersonalFundingOptions() { assert.fail('personal discovery called'); },
    readAdministrativeSandboxOptions: async (country, serviceProvider) => ({ country, serviceProvider, paymentMethods: ['CREDIT_DEBIT_CARD', 'BANK_TRANSFER'], routes }),
  });
  t.after(() => harness.unmount());
  const props = { onSelectionChange() { selectionChanges++; }, onContinue: async () => { sessions++; throw Error('previous provider attempt failed'); } };
  harness.render(props); await flush(); harness.render(props); let tree = harness.render(props);
  assert.equal(selectionChanges, 0, 'loading and automatic method selection cannot clear an error in an effect loop');
  tree.props.onSubmit({ preventDefault() {} }); await flush();
  assert.equal(sessions, 1);
  find(tree, 'FundingAmountField').props.onChange('100');
  harness.render(props); tree = harness.render(props);
  assert.equal(selectionChanges, 1);
  find(tree, 'FundingCountryField').props.onChange('CO');
  harness.render(props); await flush(); harness.render(props); tree = harness.render(props);
  assert.equal(selectionChanges, 2);
  find(tree, node => node?.type === 'select' && node.props.id.endsWith('-provider')).props.onChange({ target: { value: 'BANXA' } });
  harness.render(props); tree = harness.render(props);
  assert.equal(selectionChanges, 3);
  find(tree, 'FundingMethodField').props.onChange('BANK_TRANSFER');
  harness.render(props);
  assert.equal(selectionChanges, 4);
  assert.equal(sessions, 1, 'editing a selection never submits another checkout');
});

test('changing an administrative selection clears its old provider error while preserving its address, copy error and history', async t => {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', { value: { dispatchEvent() {} }, configurable: true });
  t.after(() => { if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow); else delete globalThis.window; });
  const shared = load('WalletFundingUI.jsx', { 'lucide-react': icons, 'next/link': {}, '@/i18n/LanguageProvider': i18n });
  const address = `0x${'2'.repeat(40)}`;
  let sessions = 0;
  function AdministrativeSandboxFundingForm() { return null; }
  function WalletFundingHistory() { return null; }
  const harness = componentHarness('AdministrativeWalletFundingPage.jsx', 'AdministrativeWalletFundingView', {
    'lucide-react': icons, '@/i18n/LanguageProvider': i18n,
    '@/lib/administrative-wallet.mjs': { readAdministrativeWallet: async () => ({ status: 'assigned', address }), ensureAdministrativeWallet() { assert.fail('unnecessary assignment'); } },
    '@/lib/administrative-onramp-client.mjs': { async startAdministrativeMeldOnramp() { sessions++; throw Error('wallet_funding_method_unavailable'); } },
    './WalletFundingForm': { AdministrativeSandboxFundingForm }, './WalletFundingHistory': { default: WalletFundingHistory }, './WalletFundingUI': shared,
    './WalletFundingStatus': { default: () => null },
  });
  t.after(() => harness.unmount());
  const props = { environment: 'sandbox' };
  harness.render(props); await flush(); let tree = harness.render(props);
  find(tree, 'WalletAddress').props.onCopyError();
  tree = harness.render(props);
  await assert.rejects(find(tree, 'AdministrativeSandboxFundingForm').props.onContinue({}), /wallet_funding_method_unavailable/);
  tree = harness.render(props);
  assert.ok(find(tree, 'WalletActionError').props.message);
  const copyError = harness.state[2];
  const revision = find(tree, 'WalletFundingHistory').props.refreshKey;
  find(tree, 'AdministrativeSandboxFundingForm').props.onSelectionChange();
  tree = harness.render(props);
  assert.equal(find(tree, 'WalletActionError').props.message, '');
  assert.equal(find(tree, 'WalletAddress').props.address, address);
  assert.equal(harness.state[2], copyError);
  assert.ok(copyError, 'clipboard error stays separate');
  assert.equal(find(tree, 'WalletFundingHistory').props.refreshKey, revision);
  assert.equal(sessions, 1);
});

test('live status presentation accepts only its exact own reference and unconfirmed backend contract, never checkout or URL success hints', () => {
  const { currentFundingView } = load('WalletFundingStatus.jsx', statusMocks(() => assert.fail('render-time read')));
  assert.equal(currentFundingView(administrativeStatus, 'administrative', statusReference).state, 'checkout_ready');
  assert.equal(currentFundingView(administrativeStatus, 'administrative', statusReference.toUpperCase()).state, 'checkout_ready');
  assert.equal(currentFundingView(administrativeStatus, 'administrative', statusReference).state, 'checkout_ready');
  assert.equal(currentFundingView(personalStatus, 'personal', statusReference), null);
  assert.equal(currentFundingView(administrativeStatus, 'administrative', secondStatusReference), null);
  assert.equal(currentFundingView({ ...administrativeStatus, success: true, paid: true, status: 'confirmed' }, 'administrative', statusReference).state, 'checkout_ready');
  for (const confirmation of [{ state: 'confirmed', source: 'none', testMode: false }, { state: 'pending', source: 'return_url', testMode: false }, { state: 'unconfirmed', source: 'webhook', testMode: false }]) {
    assert.equal(currentFundingView({ ...administrativeStatus, confirmation }, 'administrative', statusReference), null);
  }
});

test('definitive administrative preparation failures do not pose as pending or failed financial payments', () => {
  const { currentFundingView, WalletFundingStatusView } = load('WalletFundingStatus.jsx', statusMocks(() => assert.fail('render-time read')));
  for (const [requestStatus, expected] of [['unavailable', 'request_unavailable'], ['failed', 'checkout_failed']]) {
    const view = currentFundingView({ ...administrativeStatus, requestStatus }, 'administrative', statusReference);
    assert.equal(view.state, expected);
    const html = renderToStaticMarkup(WalletFundingStatusView({ view }));
    assert.match(html, /No se inició una compra/);
    assert.doesNotMatch(html, /Pago sin confirmar|Recarga en proceso|Recarga no completada|Recarga confirmada/);
  }
});

test('status reads are manual, scoped to the chosen wallet and abort old references without publishing a late response', async t => {
  const calls = [];
  const harness = componentHarness('WalletFundingStatus.jsx', 'default', statusMocks((kind, reference, { signal }) => new Promise(resolve => calls.push({ kind, reference, signal, resolve }))));
  t.after(() => harness.unmount());
  const props = { walletKind: 'administrative', checkoutReference: statusReference };
  harness.render(props); harness.render(props);
  assert.equal(calls.length, 1);
  calls[0].resolve(administrativeStatus); await flush();
  let tree = harness.render(props);
  assert.equal(find(tree, 'WalletFundingStatusView').props.view.state, 'checkout_ready');
  const refresh = React.Children.toArray(tree.props.children).find(node => node?.type === 'button');
  refresh.props.onClick(); harness.render(props);
  assert.equal(calls.length, 2);
  const second = { ...props, checkoutReference: secondStatusReference };
  harness.render(second);
  assert.equal(calls[1].signal.aborted, true);
  assert.equal(calls[2].reference, secondStatusReference);
  calls[1].resolve(administrativeStatus); await flush();
  tree = harness.render(second);
  assert.equal(find(tree, 'WalletFundingStatusView'), undefined);
  calls[2].resolve({ ...administrativeStatus, checkoutReference: secondStatusReference }); await flush();
  tree = harness.render(second);
  assert.equal(find(tree, 'WalletFundingStatusView').props.view.checkoutReference, secondStatusReference);
  assert.equal(calls.every(call => call.kind === 'administrative'), true);
  assert.equal(calls.length, 3, 'renders cannot poll or create another checkout');
});

test('a status read failure stays unavailable with an explicit GET retry and never becomes a failed or successful payment', async t => {
  let reads = 0;
  const harness = componentHarness('WalletFundingStatus.jsx', 'default', statusMocks(async () => { reads++; throw Error('private-provider-token'); }));
  t.after(() => harness.unmount());
  const props = { walletKind: 'administrative', checkoutReference: statusReference };
  harness.render(props); await flush();
  const tree = harness.render(props);
  const html = renderToStaticMarkup(tree);
  assert.match(html, /No pudimos consultar el estado/);
  assert.doesNotMatch(html, /private-provider-token|Recarga confirmada|Recarga no completada/);
  assert.equal(reads, 1);
  React.Children.toArray(tree.props.children).find(node => node?.type === 'button').props.onClick();
  harness.render(props); await flush();
  assert.equal(reads, 2);
});

test('future confirmed visual fixtures distinguish received USDT from requested USD and mark sandbox as a test', () => {
  const { currentFundingView, WalletFundingStatusView } = load('WalletFundingStatus.jsx', statusMocks(() => assert.fail('fixture cannot fetch')));
  const base = currentFundingView(administrativeStatus, 'administrative', statusReference);
  const confirmed = { ...base, state: 'confirmed', receivedAmount: '46.580001', confirmedAt: '2026-11-10T21:00:00Z' };
  let html = renderToStaticMarkup(WalletFundingStatusView({ view: confirmed }));
  assert.match(html, /Prueba confirmada/);
  assert.match(html, /46\.580001 USDT/);
  assert.ok(html.includes(translateMessage('es', 'funding.statusRequestedAmount')));
  assert.ok(html.includes(translateMessage('es', 'funding.statusReceived')));
  html = renderToStaticMarkup(WalletFundingStatusView({ view: { ...confirmed, testMode: true } }));
  assert.match(html, /Prueba confirmada/);
  assert.match(html, /No acredita fondos ni comisiones reales/);
  html = renderToStaticMarkup(WalletFundingStatusView({ view: { ...confirmed, receivedAmount: undefined } }));
  assert.doesNotMatch(html, /Recarga confirmada|46\.580001/);
  assert.match(html, /Pago sin confirmar/);
});

test('each form reviews its immutable trusted destination immediately before the CTA and blocks a missing address', async t => {
  const harness = formHarness('AdministrativeSandboxFundingForm', { readAdministrativeSandboxOptions: async (country, serviceProvider) => ({ country, serviceProvider,
    paymentMethods: ['CREDIT_DEBIT_CARD'], routes: [{ paymentMethods: [{ method: 'CREDIT_DEBIT_CARD', minimumUsd: 50, maximumUsd: 1000 }] }] }) });
  t.after(() => harness.unmount());
  harness.render(); await flush(); harness.render(); let tree = harness.render();
  const fields = React.Children.toArray(tree.props.children.props.children);
  assert.equal(fields.at(-2).type.name, 'FundingDestination');
  assert.equal(fields.at(-1).type.name, 'FundingSubmit');
  const destination = harness.exports.FundingDestination({ address: personalStatus.destination.address });
  const input = React.Children.toArray(destination.props.children).find(node => node?.type === 'input');
  assert.equal(input.props.readOnly, true);
  assert.equal(input.props.value, personalStatus.destination.address);
  assert.equal(input.props.onChange, undefined);
  tree = harness.render({ destinationAddress: '' });
  assert.equal(find(tree, 'FundingSubmit').props.disabled, true);
});

test('an automatic Banxa country choice never replaces the default Transak preference for a later supported country', async t => {
  const submitted = [];
  const harness = formHarness('AdministrativeSandboxFundingForm', {
    readAdministrativeSandboxOptions: async (country, serviceProvider) => ({ country, serviceProvider,
      paymentMethods: country === 'CO' && serviceProvider === 'TRANSAK' ? [] : ['CREDIT_DEBIT_CARD'],
      routes: country === 'CO' && serviceProvider === 'TRANSAK' ? [] : [{ paymentMethods: [{ method: 'CREDIT_DEBIT_CARD', minimumUsd: 50, maximumUsd: 1000 }] }] }),
  });
  t.after(() => harness.unmount());
  const props = { onContinue: async value => submitted.push(value) };
  harness.render(props); await flush(); harness.render(props); let tree = harness.render(props);
  find(tree, 'FundingCountryField').props.onChange('CO');
  harness.render(props); await flush(); harness.render(props); tree = harness.render(props);
  tree.props.onSubmit({ preventDefault() {} }); await flush();
  assert.equal(submitted[0].serviceProvider, 'BANXA');
  find(tree, 'FundingCountryField').props.onChange('US');
  harness.render(props); await flush(); harness.render(props); tree = harness.render(props);
  tree.props.onSubmit({ preventDefault() {} }); await flush();
  assert.equal(submitted[1].serviceProvider, 'TRANSAK');
});

test('a history status action selects the exact request for a read without changing its recorded payment status', async t => {
  const selected = [], reads = [];
  const harness = componentHarness('WalletFundingHistory.jsx', 'default', { 'lucide-react': icons, '@/i18n/LanguageProvider': i18n,
    '@/lib/wallet-funding-client.mjs': { readWalletFundingHistory: async kind => { reads.push(kind); return { records: [{ checkoutReference: statusReference,
      requestedAmount: 50, status: 'initiated', createdAt: '2026-11-10T21:00:00Z' }] }; } },
  });
  t.after(() => harness.unmount());
  const props = { walletKind: 'administrative', refreshKey: 0, onSelectRequest: reference => selected.push(reference) };
  harness.render(props); await flush(); const tree = harness.render(props);
  const action = find(tree, node => node?.type === 'button' && node.props.className === 'historyAction');
  assert.ok(action.props['aria-label'].includes(statusReference.slice(-8)));
  action.props.onClick();
  assert.deepEqual(selected, [statusReference]);
  assert.deepEqual(reads, ['administrative']);
  assert.match(renderToStaticMarkup(tree), /Solicitud iniciada/);
  assert.doesNotMatch(renderToStaticMarkup(tree), /Recarga confirmada/);
});

test('selected method limits reflect overlapping real routes and never invent a minimum for an unavailable amount', () => {
  const { selectedMethodLimits } = formHarness('AdministrativeSandboxFundingForm', {}).exports;
  const routes = [{ paymentMethods: [{ method: 'CREDIT_DEBIT_CARD', minimumUsd: 10, maximumUsd: 1000 }] },
    { paymentMethods: [{ method: 'CREDIT_DEBIT_CARD', minimumUsd: 100, maximumUsd: 2000 }] }];
  assert.deepEqual(selectedMethodLimits(routes, 'CREDIT_DEBIT_CARD', 100), { minimumUsd: 50, maximumUsd: 2000 });
  assert.equal(selectedMethodLimits(routes, 'PAYPAL', 100), null);
  assert.equal(selectedMethodLimits(routes, 'CREDIT_DEBIT_CARD', 2500), null);
});

test('history-driven status focus uses native focus and scrolling, respects reduced motion and performs only scoped reads', t => {
  const prior = Object.getOwnPropertyDescriptor(globalThis, 'window');
  let reduced = true;
  Object.defineProperty(globalThis, 'window', { value: { matchMedia: () => ({ matches: reduced }) }, configurable: true });
  t.after(() => { if (prior) Object.defineProperty(globalThis, 'window', prior); else delete globalThis.window; });
  const reads = [], focused = [], scrolled = [];
  const harness = componentHarness('WalletFundingStatus.jsx', 'default', statusMocks((kind, reference, { signal }) => { reads.push({ kind, reference, signal }); return new Promise(() => {}); }));
  t.after(() => harness.unmount());
  const props = { walletKind: 'administrative', checkoutReference: statusReference, focusKey: 0 };
  const tree = harness.render(props);
  tree.ref.current = { focus: options => focused.push(options), scrollIntoView: options => scrolled.push(options) };
  assert.equal(focused.length, 0, 'an automatic checkout acknowledgement cannot steal focus');
  harness.render({ ...props, focusKey: 1 });
  assert.deepEqual(focused, [{ preventScroll: true }]);
  assert.deepEqual(scrolled[0], { block: 'start', behavior: 'auto' });
  reduced = false;
  harness.render({ ...props, focusKey: 2 });
  assert.deepEqual(scrolled[1], { block: 'start', behavior: 'smooth' });
  assert.equal(reads.every(read => read.kind === 'administrative' && read.reference === statusReference), true);
  assert.equal(reads[0].signal.aborted, true);
});

test('administrative MXN methods stay within sandbox provider and currency context', async t => {
  const calls = [], submitted = [];
  const harness = formHarness('AdministrativeSandboxFundingForm', {
    readPersonalFundingOptions() { assert.fail('administrative discovery cannot use Reown production'); },
    readAdministrativeSandboxOptions(country, provider, { signal, sourceCurrencyCode }) { return new Promise(resolve => calls.push({ country, provider, signal, sourceCurrencyCode, resolve })); },
  });
  t.after(() => harness.unmount());
  const props = { onContinue: async input => submitted.push(input) };
  harness.render(props); let tree = harness.render(props);
  find(tree, 'FundingCountryField').props.onChange('MX'); harness.render(props); tree = harness.render(props);
  find(tree, 'FundingCurrencyField').props.onChange('MXN'); harness.render(props);
  const local = calls.filter(call => call.sourceCurrencyCode === 'MXN');
  assert.deepEqual(local.map(call => call.provider), ['TRANSAK', 'BANXA']);
  for (const call of local) call.resolve({ country: 'MX', sourceCurrencyCode: 'MXN', serviceProvider: call.provider,
    routes: call.provider === 'TRANSAK' ? [{ paymentMethods: [{ method: 'CREDIT_DEBIT_CARD', currencyCode: 'MXN', minimumAmount: 200, maximumAmount: 20000 }, { method: 'SPEI', currencyCode: 'MXN', minimumAmount: 200, maximumAmount: 20000 }] }] : [] });
  await flush(); harness.render(props); tree = harness.render(props);
  assert.deepEqual(find(tree, 'FundingMethodField').props.methods, ['CREDIT_DEBIT_CARD']);
  assert.equal(find(tree, 'FundingMethodField').props.sourceCurrencyCode, 'MXN');
  find(tree, 'FundingAmountField').props.onChange('1200'); harness.render(props); tree = harness.render(props);
  tree.props.onSubmit({ preventDefault() {} }); await flush();
  assert.equal(submitted.length, 1);
  assert.equal(submitted[0].sourceCurrencyCode, 'MXN');
  assert.equal(submitted[0].paymentMethodType, 'CREDIT_DEBIT_CARD');
  assert.equal(calls.filter(call => call.sourceCurrencyCode !== 'MXN').every(call => call.signal.aborted), true);
});

test('administrative status and history components reject personal props before any request or rendering', t => {
 let reads=0;
 const mocks={ 'lucide-react':icons,'@/i18n/LanguageProvider':i18n,'@/lib/wallet-funding-client.mjs':{readWalletFundingHistory(){reads++;return Promise.resolve({records:[]});},readWalletFundingStatus(){reads++;return Promise.resolve(personalStatus);}}};
 for(const filename of ['WalletFundingHistory.jsx','WalletFundingStatus.jsx']){
  const harness=componentHarness(filename,'default',mocks);t.after(()=>harness.unmount());
  assert.equal(harness.render({walletKind:'personal',checkoutReference:statusReference}),null);
 }
 assert.equal(reads,0);
 const {WalletFundingStatusView}=load('WalletFundingStatus.jsx',mocks);
 assert.equal(WalletFundingStatusView({view:{walletKind:'personal',testMode:false,state:'confirmed'}}),null);
});
