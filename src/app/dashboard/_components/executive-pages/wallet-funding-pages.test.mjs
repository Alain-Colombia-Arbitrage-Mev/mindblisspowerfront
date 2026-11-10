import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { translateMessage } from '../../../../i18n/translate.mjs';
import { validFundingAmount, WALLET_GATEWAY_FAILURE_REASONS, FUNDING_UUID, fundingStatus } from '../../../../lib/wallet-funding-contract.mjs';
import { personalFundingFailure } from '../../../../lib/personal-funding-errors.mjs';

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
    if (id === '@/lib/wallet-funding-contract.mjs') return { validFundingAmount, WALLET_GATEWAY_FAILURE_REASONS, FUNDING_UUID, fundingStatus };
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

function formHarness(name, api) {
  const harness = componentHarness('WalletFundingForm.jsx', name, { 'lucide-react': icons, '@/i18n/LanguageProvider': i18n,
    '@/lib/meld-onramp.mjs': { browserOnrampRegion: () => 'CO' }, '@/lib/meld-onramp-client.mjs': { ONRAMP_COUNTRIES: [['CO'], ['US']] },
    '@/lib/wallet-funding-client.mjs': { fundingRequestId: () => 'd8a4c010-cc33-44da-a297-8b3c6440f491', ...api },
    '@/lib/wallet-funding-contract.mjs': { validFundingAmount },
  });
  const render = harness.render;
  return { ...harness, render(props = {}) { return render({ destinationAddress: `0x${'1'.repeat(40)}`, ...props }); } };
}

function find(node, name) {
  if (typeof name === 'function' ? name(node) : node?.type?.name === name) return node;
  return React.Children.toArray(node?.props?.children).map(child => find(child, name)).find(Boolean);
}
function findAll(node, predicate) {
  return [...(predicate(node) ? [node] : []), ...React.Children.toArray(node?.props?.children).flatMap(child => findAll(child, predicate))];
}
const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
const methods = [{ method: 'CREDIT_DEBIT_CARD', minimumUsd: 75, maximumUsd: 1000 }];
const statusReference = 'd8a4c010-cc33-44da-a297-8b3c6440f491';
const secondStatusReference = 'd8a4c010-cc33-44da-a297-8b3c6440f492';
const personalStatus = { checkoutReference: statusReference, walletKind: 'personal', environment: 'production', provider: 'reown', requestedAmount: 50,
  country: 'CO', requestStatus: 'initiated', destination: { address: `0x${'1'.repeat(40)}`, asset: 'USDT', network: 'polygon', chainId: 137 },
  confirmation: { state: 'unconfirmed', source: 'none', testMode: false } };
const administrativeStatus = { ...personalStatus, walletKind: 'administrative', environment: 'sandbox', provider: 'meld', requestStatus: 'session_created',
  destination: { ...personalStatus.destination, address: `0x${'2'.repeat(40)}` }, confirmation: { state: 'unconfirmed', source: 'none', testMode: true } };
const statusMocks = read => ({ 'lucide-react': icons, '@/i18n/LanguageProvider': i18n, '@/lib/wallet-funding-client.mjs': { readWalletFundingStatus: read } });

test('a connected Reown address never claims backend verification and check failures remain actionable', () => {
  const { personalWalletState, personalOnrampError } = load('PersonalWalletFundingPage.jsx', {
    'lucide-react': icons, 'next/dynamic': { default: () => () => null }, '@/components/reown/ReownContext': {},
    '@/i18n/LanguageProvider': i18n, './WalletFundingForm': {}, './WalletFundingHistory': {}, './WalletFundingStatus': {}, './WalletFundingUI': {},
    '@/lib/personal-funding-errors.mjs': { personalFundingFailure },
  });
  const account = { configured: true, isConnected: true, address: `0x${'1'.repeat(40)}`, linkStatus: 'unlinked', linkedAddress: '' };
  assert.equal(personalWalletState(account), 'connected');
  assert.equal(personalWalletState({ ...account, linkStatus: 'error' }), 'error');
  assert.equal(personalWalletState({ ...account, linkStatus: 'loading' }), 'checking');
  assert.equal(personalWalletState({ ...account, isConnected: false, address: '' }), 'disconnected');
  assert.equal(personalWalletState({ ...account, linkStatus: 'linked', linkedAddress: account.address }), 'verified');
  assert.equal(personalWalletState({ ...account, linkStatus: 'linked', linkedAddress: '' }), 'connected');
  for (const locale of ['es', 'en', 'ar', 'zh']) {
    for (const code of ['session', 'configuration', 'mismatch', 'rejected', 'connection', 'link_unavailable', 'identity', 'rate_limited', 'method', 'intent', 'cancelled', 'origin', 'provider']) {
      const label = personalOnrampError(code, (key, values) => translateMessage(locale, key, values));
      assert.ok(label && !/^(funding|recharge)\./.test(label), `${locale}/${code}`);
    }
    assert.notEqual(personalOnrampError('intent', key => translateMessage(locale, key)), personalOnrampError('link_unavailable', key => translateMessage(locale, key)));
  }
});

test('personal countries discard canceled responses, respect route limits and submit only the selected production method', async t => {
  if (typeof navigator === 'undefined') { Object.defineProperty(globalThis, 'navigator', { value: { language: 'es-CO', languages: ['es-CO'] }, configurable: true }); t.after(() => { delete globalThis.navigator; }); }
  const calls = [], submitted = [];
  let administrativeCalls = 0;
  const harness = formHarness('PersonalFundingForm', {
    readPersonalFundingOptions(country, { signal }) { return new Promise(resolve => calls.push({ country, signal, resolve })); },
    readAdministrativeSandboxOptions() { administrativeCalls++; throw Error('wrong wallet'); },
  });
  t.after(() => harness.unmount());
  const props = { onContinue: async value => submitted.push(value) };
  harness.render(props); harness.render(props);
  let tree = harness.render(props);
  assert.equal(calls[0].country, 'CO');
  find(tree, 'FundingCountryField').props.onChange('US');
  harness.render(props);
  assert.equal(calls[0].signal.aborted, true);
  calls[0].resolve({ country: 'CO', paymentMethods: ['BANK_TRANSFER'], routes: [{ paymentMethods: [{ method: 'BANK_TRANSFER', minimumUsd: 50, maximumUsd: 500 }] }] });
  await flush();
  tree = harness.render(props);
  assert.deepEqual(find(tree, 'FundingMethodField').props.methods, []);
  calls[1].resolve({ country: 'US', paymentMethods: ['CREDIT_DEBIT_CARD'], routes: [{ paymentMethods: methods }] });
  await flush(); tree = harness.render(props);
  assert.deepEqual(find(tree, 'FundingMethodField').props.methods, [], '50 USD cannot use a 75 USD route');
  find(tree, 'FundingAmountField').props.onChange('100');
  harness.render(props); tree = harness.render(props);
  assert.deepEqual(find(tree, 'FundingMethodField').props.methods, ['CREDIT_DEBIT_CARD'], JSON.stringify(harness.state));
  tree.props.onSubmit({ preventDefault() {} }); await flush();
  assert.equal(submitted.length, 1);
  assert.equal(submitted[0].countryCode, 'US');
  assert.equal(submitted[0].paymentMethodType, 'CREDIT_DEBIT_CARD');
  assert.equal(submitted[0].amount, 100);
  assert.equal(Object.hasOwn(submitted[0], 'serviceProvider'), false);
  assert.equal(administrativeCalls, 0);
});

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

test('administrative choices contain only amount-eligible providers and retain a selected provider when both are available', async t => {
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
  assert.equal(find(tree, node => node?.type === 'select' && node.props.id.endsWith('-provider')), undefined);
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

test('an administrative provider outage fails closed with explicit retry rather than posing as an unavailable country', async t => {
  const calls = [];
  const harness = formHarness('AdministrativeSandboxFundingForm', {
    readPersonalFundingOptions() { assert.fail('personal discovery called'); },
    readAdministrativeSandboxOptions(country, serviceProvider, { signal }) { return new Promise((resolve, reject) => calls.push({ country, serviceProvider, signal, resolve, reject })); },
  });
  t.after(() => harness.unmount());
  harness.render();
  calls[0].resolve({ country: 'US', serviceProvider: 'TRANSAK', paymentMethods: ['CREDIT_DEBIT_CARD'], routes: [{ paymentMethods: [{ method: 'CREDIT_DEBIT_CARD', minimumUsd: 50, maximumUsd: 500 }] }] });
  calls[1].reject(Error('sandbox provider unavailable'));
  await flush(); let tree = harness.render();
  assert.equal(find(tree, 'FundingMethodField').props.status, 'error');
  assert.deepEqual(find(tree, 'FundingMethodField').props.methods, []);
  assert.equal(find(tree, 'FundingSubmit').props.disabled, true);
  find(tree, 'FundingMethodField').props.onRetry();
  harness.render(); tree = harness.render();
  assert.equal(calls.length, 4);
  assert.equal(find(tree, 'FundingMethodField').props.status, 'loading');
});

test('each wallet route mounts only its own flow and summary contains no funding hooks or SDK', () => {
  const personalRoute = readFileSync(new URL('../../wallet-personal/page.jsx', import.meta.url), 'utf8');
  const administrativeRoute = readFileSync(new URL('../../wallet-administrative/page.jsx', import.meta.url), 'utf8');
  const summary = readFileSync(new URL('WalletFundingPanels.jsx', import.meta.url), 'utf8');
  assert.match(personalRoute, /PersonalWalletFundingPage/); assert.doesNotMatch(personalRoute, /Administrative|runtimeEnvironment/);
  assert.match(administrativeRoute, /AdministrativeWalletFundingPage/); assert.doesNotMatch(administrativeRoute, /Reown|PersonalWallet/);
  assert.doesNotMatch(summary, /useState|useEffect|FundingForm|ReownProvider|wallet-funding-client/);
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

test('narrow wallet layouts prioritize funding after assignment and constrain long shell titles beside controls', () => {
  const styles = readFileSync(new URL('wallet-funding.module.css', import.meta.url), 'utf8');
  const personal = readFileSync(new URL('PersonalWalletFundingPage.jsx', import.meta.url), 'utf8');
  const administrative = readFileSync(new URL('AdministrativeWalletFundingPage.jsx', import.meta.url), 'utf8');
  const header = readFileSync(new URL('../../../../components/panel/PanelHeader.jsx', import.meta.url), 'utf8');
  const shell = readFileSync(new URL('../../../../components/panel/panel-shell.css', import.meta.url), 'utf8');
  assert.match(styles, /\.setupRequired \.details\s*\{\s*grid-row:\s*1/);
  assert.doesNotMatch(styles, /(?:^|[;}])\s*\.details\s*\{\s*grid-row:\s*1/);
  assert.match(personal, /!verified \? ` \$\{styles\.setupRequired\}`/);
  assert.doesNotMatch(administrative, /styles\.setupRequired/);
  assert.ok(administrative.indexOf('styles.formPanel') < administrative.indexOf('styles.details'));
  assert.match(header, /className="vp-panel-title"/);
  assert.match(header, /<h1 title=\{title\}>\{title\}<\/h1>/);
  assert.match(shell, /\.vp-panel-title\s*\{[^}]*min-width:\s*0;[^}]*overflow:\s*hidden/s);
  assert.match(shell, /\.vp-panel-heading h1\s*\{[^}]*text-overflow:\s*ellipsis;[^}]*white-space:\s*nowrap/s);
});

test('returned canonical payment methods use brand labels without changing their submitted identifiers', () => {
  const harness = formHarness('PersonalFundingForm', {});
  const t = key => translateMessage('es', key);
  assert.deepEqual(['ASTROPAY', 'NETELLER', 'PAYSAFECARD', 'SKRILL', 'PAYPAL', 'VENMO'].map(code => harness.exports.paymentMethodLabel(code, t)), ['AstroPay', 'Neteller', 'PaysafeCard', 'Skrill', 'PayPal', 'Venmo']);
  assert.equal(harness.exports.paymentMethodLabel('CREDIT_DEBIT_CARD', t), t('onramp.cardPayment'));
  assert.equal(harness.exports.paymentMethodLabel('APPLE_PAY', t), 'Apple Pay');
  assert.equal(harness.exports.paymentMethodLabel('GOOGLE_PAY', t), 'Google Pay');
  assert.equal(harness.exports.paymentMethodLabel('BANK_TRANSFER', t), t('onramp.bankTransfer'));
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
  const harness = componentHarness('AdministrativeWalletFundingPage.jsx', 'default', {
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
  assert.equal(currentFundingView(personalStatus, 'personal', statusReference).state, 'unconfirmed');
  assert.equal(currentFundingView(personalStatus, 'personal', statusReference.toUpperCase()).state, 'unconfirmed');
  assert.equal(currentFundingView(administrativeStatus, 'administrative', statusReference).state, 'checkout_ready');
  assert.equal(currentFundingView(administrativeStatus, 'personal', statusReference), null);
  assert.equal(currentFundingView(personalStatus, 'personal', secondStatusReference), null);
  assert.equal(currentFundingView({ ...personalStatus, success: true, paid: true, status: 'confirmed' }, 'personal', statusReference).state, 'unconfirmed');
  for (const confirmation of [{ state: 'confirmed', source: 'none', testMode: false }, { state: 'pending', source: 'return_url', testMode: false }, { state: 'unconfirmed', source: 'webhook', testMode: false }]) {
    assert.equal(currentFundingView({ ...personalStatus, confirmation }, 'personal', statusReference), null);
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
  const props = { walletKind: 'personal', checkoutReference: statusReference };
  harness.render(props); harness.render(props);
  assert.equal(calls.length, 1);
  calls[0].resolve(personalStatus); await flush();
  let tree = harness.render(props);
  assert.equal(find(tree, 'WalletFundingStatusView').props.view.state, 'unconfirmed');
  const refresh = React.Children.toArray(tree.props.children).find(node => node?.type === 'button');
  refresh.props.onClick(); harness.render(props);
  assert.equal(calls.length, 2);
  const second = { ...props, checkoutReference: secondStatusReference };
  harness.render(second);
  assert.equal(calls[1].signal.aborted, true);
  assert.equal(calls[2].reference, secondStatusReference);
  calls[1].resolve(personalStatus); await flush();
  tree = harness.render(second);
  assert.equal(find(tree, 'WalletFundingStatusView'), undefined);
  calls[2].resolve({ ...personalStatus, checkoutReference: secondStatusReference }); await flush();
  tree = harness.render(second);
  assert.equal(find(tree, 'WalletFundingStatusView').props.view.checkoutReference, secondStatusReference);
  assert.equal(calls.every(call => call.kind === 'personal'), true);
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
  const base = currentFundingView(personalStatus, 'personal', statusReference);
  const confirmed = { ...base, state: 'confirmed', receivedAmount: '46.580001', confirmedAt: '2026-11-10T21:00:00Z' };
  let html = renderToStaticMarkup(WalletFundingStatusView({ view: confirmed }));
  assert.match(html, /Recarga confirmada/);
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

test('each page selects only its own acknowledged request and exposes its backend destination to the review field', async t => {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', { value: { dispatchEvent() {} }, configurable: true });
  t.after(() => { if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow); else delete globalThis.window; });
  const shared = load('WalletFundingUI.jsx', { 'lucide-react': icons, 'next/link': {}, '@/i18n/LanguageProvider': i18n });
  function PersonalFundingForm() { return null; }
  function AdministrativeSandboxFundingForm() { return null; }
  function WalletFundingHistory() { return null; }
  function WalletFundingStatus() { return null; }
  let personalResult = { pending: true, checkoutReference: statusReference };
  const personal = componentHarness('PersonalWalletFundingPage.jsx', 'PersonalWalletFunding', {
    'lucide-react': icons, 'next/dynamic': { default: () => () => null }, '@/i18n/LanguageProvider': i18n,
    '@/components/reown/ReownContext': { useReownWallet: () => ({ configured: true, isConnected: true, isLinked: true, address: personalStatus.destination.address,
      linkedAddress: personalStatus.destination.address, linkStatus: 'linked', onrampStatus: 'idle', fundingRevision: 0, startOnramp: async () => personalResult }) },
    '@/lib/personal-funding-errors.mjs': { personalFundingFailure }, './WalletFundingForm': { PersonalFundingForm },
    './WalletFundingHistory': { default: WalletFundingHistory }, './WalletFundingStatus': { default: WalletFundingStatus }, './WalletFundingUI': shared,
  });
  t.after(() => personal.unmount());
  let tree = personal.render();
  assert.equal(find(tree, 'PersonalFundingForm').props.destinationAddress, personalStatus.destination.address);
  await find(tree, 'PersonalFundingForm').props.onContinue({});
  tree = personal.render();
  assert.equal(find(tree, 'WalletFundingStatus'), undefined, 'pending wallet connection is not a checkout acknowledgement');
  personalResult = { opened: true, checkoutReference: statusReference };
  await find(tree, 'PersonalFundingForm').props.onContinue({});
  tree = personal.render();
  assert.equal(find(tree, 'WalletFundingStatus').props.walletKind, 'personal');
  assert.equal(find(tree, 'WalletFundingStatus').props.checkoutReference, statusReference);
  assert.equal(find(tree, 'WalletFundingStatus').props.focusKey, 0);
  find(tree, 'WalletFundingHistory').props.onSelectRequest(secondStatusReference);
  tree = personal.render();
  assert.equal(find(tree, 'WalletFundingStatus').props.checkoutReference, secondStatusReference);
  assert.equal(find(tree, 'WalletFundingStatus').props.focusKey, 1);

  const administrative = componentHarness('AdministrativeWalletFundingPage.jsx', 'default', {
    'lucide-react': icons, '@/i18n/LanguageProvider': i18n,
    '@/lib/administrative-wallet.mjs': { readAdministrativeWallet: async () => ({ status: 'assigned', address: administrativeStatus.destination.address }) },
    '@/lib/administrative-onramp-client.mjs': { startAdministrativeMeldOnramp: async () => ({ checkoutReference: statusReference }) },
    './WalletFundingForm': { AdministrativeSandboxFundingForm }, './WalletFundingHistory': { default: WalletFundingHistory }, './WalletFundingStatus': { default: WalletFundingStatus }, './WalletFundingUI': shared,
  });
  t.after(() => administrative.unmount());
  const props = { environment: 'sandbox' };
  administrative.render(props); await flush(); tree = administrative.render(props);
  assert.equal(find(tree, 'AdministrativeSandboxFundingForm').props.destinationAddress, administrativeStatus.destination.address);
  await find(tree, 'AdministrativeSandboxFundingForm').props.onContinue({});
  tree = administrative.render(props);
  assert.equal(find(tree, 'WalletFundingStatus').props.walletKind, 'administrative');
  assert.equal(find(tree, 'WalletFundingStatus').props.checkoutReference, statusReference);
  assert.equal(find(personal.render(), 'WalletFundingStatus').props.checkoutReference, secondStatusReference, 'administrative activity cannot replace the personal selection');
});

test('a history status action selects the exact request for a read without changing its recorded payment status', async t => {
  const selected = [], reads = [];
  const harness = componentHarness('WalletFundingHistory.jsx', 'default', { 'lucide-react': icons, '@/i18n/LanguageProvider': i18n,
    '@/lib/wallet-funding-client.mjs': { readWalletFundingHistory: async kind => { reads.push(kind); return { records: [{ checkoutReference: statusReference,
      requestedAmount: 50, status: 'initiated', createdAt: '2026-11-10T21:00:00Z' }] }; } },
  });
  t.after(() => harness.unmount());
  const props = { walletKind: 'personal', refreshKey: 0, onSelectRequest: reference => selected.push(reference) };
  harness.render(props); await flush(); const tree = harness.render(props);
  const action = find(tree, node => node?.type === 'button' && node.props.className === 'historyAction');
  assert.ok(action.props['aria-label'].includes(statusReference.slice(-8)));
  action.props.onClick();
  assert.deepEqual(selected, [statusReference]);
  assert.deepEqual(reads, ['personal']);
  assert.match(renderToStaticMarkup(tree), /Solicitud iniciada/);
  assert.doesNotMatch(renderToStaticMarkup(tree), /Recarga confirmada/);
});

test('all returned production methods remain visible and selectable, including PayPal and Venmo, without a card-only filter', async t => {
  if (typeof navigator === 'undefined') { Object.defineProperty(globalThis, 'navigator', { value: { language: 'es-CO', languages: ['es-CO'] }, configurable: true }); t.after(() => { delete globalThis.navigator; }); }
  const countries = { CO: ['CREDIT_DEBIT_CARD', 'APPLE_PAY', 'GOOGLE_PAY', 'ASTROPAY', 'NETELLER', 'PAYSAFECARD', 'SKRILL'],
    US: ['CREDIT_DEBIT_CARD', 'APPLE_PAY', 'GOOGLE_PAY', 'PAYPAL', 'VENMO'] };
  const submitted = [];
  const harness = formHarness('PersonalFundingForm', { readPersonalFundingOptions: async country => ({ country, paymentMethods: countries[country],
    routes: [{ serviceProvider: 'TOPPER', paymentMethods: countries[country].map(method => ({ method, minimumUsd: 50, maximumUsd: 1000 })) }] }),
    readAdministrativeSandboxOptions() { assert.fail('production methods cannot use sandbox'); },
  });
  t.after(() => harness.unmount());
  const props = { onContinue: async input => submitted.push(input) };
  harness.render(props); harness.render(props); await flush(); harness.render(props); let tree = harness.render(props);
  let field = find(tree, 'FundingMethodField');
  let view = field.type(field.props);
  assert.deepEqual(findAll(view, node => node?.type === 'input' && node.props.type === 'radio').map(node => node.props.value), countries.CO);
  assert.match(renderToStaticMarkup(view), /7 opciones de pago/);
  assert.doesNotMatch(renderToStaticMarkup(view), /PSE/);
  const group = React.Children.toArray(tree.props.children.props.children)[0];
  assert.deepEqual(React.Children.toArray(group.props.children).map(node => node.type.name), ['FundingCountryField', 'FundingAmountField', 'FundingMethodField']);
  find(tree, 'FundingCountryField').props.onChange('US');
  harness.render(props); await flush(); harness.render(props); tree = harness.render(props);
  field = find(tree, 'FundingMethodField'); view = field.type(field.props);
  const radios = findAll(view, node => node?.type === 'input' && node.props.type === 'radio');
  assert.deepEqual(radios.map(node => node.props.value), countries.US);
  const html = renderToStaticMarkup(view);
  assert.match(html, /PayPal/); assert.match(html, /Venmo/); assert.match(html, /5 opciones de pago/);
  assert.equal((html.match(/Límites:/g) || []).length, 1, 'selected-method limits appear once');
  assert.equal((html.match(/El proveedor confirma disponibilidad y comisiones antes de pagar/g) || []).length, 1, 'coverage options do not promise checkout availability or final fees');
  radios.find(node => node.props.value === 'PAYPAL').props.onChange();
  tree = harness.render(props);
  tree.props.onSubmit({ preventDefault() {} }); await flush();
  assert.equal(submitted[0].paymentMethodType, 'PAYPAL');
  assert.equal(submitted[0].countryCode, 'US');
});

test('selected method limits reflect overlapping real routes and never invent a minimum for an unavailable amount', () => {
  const { selectedMethodLimits } = formHarness('PersonalFundingForm', {}).exports;
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
  const props = { walletKind: 'personal', checkoutReference: statusReference, focusKey: 0 };
  const tree = harness.render(props);
  tree.ref.current = { focus: options => focused.push(options), scrollIntoView: options => scrolled.push(options) };
  assert.equal(focused.length, 0, 'an automatic checkout acknowledgement cannot steal focus');
  harness.render({ ...props, focusKey: 1 });
  assert.deepEqual(focused, [{ preventScroll: true }]);
  assert.deepEqual(scrolled[0], { block: 'start', behavior: 'auto' });
  reduced = false;
  harness.render({ ...props, focusKey: 2 });
  assert.deepEqual(scrolled[1], { block: 'start', behavior: 'smooth' });
  assert.equal(reads.every(read => read.kind === 'personal' && read.reference === statusReference), true);
  assert.equal(reads[0].signal.aborted, true);
});
