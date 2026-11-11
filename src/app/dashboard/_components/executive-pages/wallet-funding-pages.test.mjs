import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { translateMessage } from '../../../../i18n/translate.mjs';
import { PERSONAL_FUNDING_COUNTRIES, PERSONAL_FUNDING_MINIMUM_USD, PERSONAL_FUNDING_MAXIMUM_USD, PERSONAL_FUNDING_MINIMUM_MXN, personalFundingMethod, validFundingAmount, validFundingSourceAmount, WALLET_GATEWAY_FAILURE_REASONS, FUNDING_UUID, fundingStatus } from '../../../../lib/wallet-funding-contract.mjs';
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
    if (id === '@/lib/wallet-funding-contract.mjs') return { PERSONAL_FUNDING_COUNTRIES, PERSONAL_FUNDING_MINIMUM_USD, PERSONAL_FUNDING_MAXIMUM_USD, PERSONAL_FUNDING_MINIMUM_MXN, personalFundingMethod, validFundingAmount, validFundingSourceAmount, WALLET_GATEWAY_FAILURE_REASONS, FUNDING_UUID, fundingStatus };
    if (id === '@/components/wallet/PersonalWalletBalances') return { default: function PersonalWalletBalances() { return null; } };
    if (id === 'next/link') return { default: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children) };
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

function formHarness(name, api, detectedCountry = 'US') {
  const harness = componentHarness('WalletFundingForm.jsx', name, { 'lucide-react': icons, '@/i18n/LanguageProvider': i18n,
    '@/lib/browser-onramp-region.mjs': { browserOnrampRegion: () => detectedCountry },
    '@/lib/wallet-funding-client.mjs': { fundingRequestId: () => 'd8a4c010-cc33-44da-a297-8b3c6440f491', ...api },
    '@/lib/wallet-funding-contract.mjs': { PERSONAL_FUNDING_COUNTRIES, PERSONAL_FUNDING_MINIMUM_USD, PERSONAL_FUNDING_MAXIMUM_USD, PERSONAL_FUNDING_MINIMUM_MXN, personalFundingMethod, validFundingAmount, validFundingSourceAmount },
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
const methods = [{ method: 'CREDIT_DEBIT_CARD', minimumUsd: 175, maximumUsd: 1000 }];
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
    for (const code of ['session', 'configuration', 'mismatch', 'rejected', 'connection', 'connection_timeout', 'link_unavailable', 'identity', 'rate_limited', 'method', 'intent', 'cancelled', 'origin', 'provider']) {
      const label = personalOnrampError(code, (key, values) => translateMessage(locale, key, values));
      assert.ok(label && !/^(funding|recharge)\./.test(label), `${locale}/${code}`);
    }
    assert.notEqual(personalOnrampError('intent', key => translateMessage(locale, key)), personalOnrampError('link_unavailable', key => translateMessage(locale, key)));
  }
});

test('first wallet setup composes authentication and ownership into one explicit activation in every locale', async t => {
  const shared = load('WalletFundingUI.jsx', { 'lucide-react': icons, '@/i18n/LanguageProvider': i18n,
    'next/link': { default: ({ prefetch: _prefetch, children, ...props }) => React.createElement('a', props, children) } });
  function PersonalFundingForm() { return null; }
  for (const locale of ['es', 'en', 'ar', 'zh']) {
    const calls = [];
    const reown = { configured: true, isConnected: false, address: '', linkedAddress: '', linkStatus: 'unlinked', onrampStatus: 'idle',
      async connectWallet() { assert.fail('The page must use the composed activation action'); },
      async chooseWallet() { calls.push('choose'); },
      async linkWallet() { assert.fail('No separate verification step'); },
      async prepareWallet() { calls.push('activate'); reown.linkStatus = 'linked'; reown.address = personalStatus.destination.address;
        reown.linkedAddress = reown.address; reown.isConnected = true; return { linked: true, address: reown.linkedAddress }; },
      async startOnramp() { assert.fail('Wallet setup cannot open a purchase'); } };
    const harness = componentHarness('PersonalWalletFundingPage.jsx', 'PersonalWalletFunding', {
      'lucide-react': icons, 'next/dynamic': { default: () => () => null },
      '@/i18n/LanguageProvider': { useI18n: () => ({ locale, t: (key, values) => translateMessage(locale, key, values) }) },
      '@/components/reown/ReownContext': { useReownWallet: () => reown },
      '@/lib/personal-funding-errors.mjs': { personalFundingFailure }, './WalletFundingForm': { PersonalFundingForm },
      './WalletFundingStatus': { default: () => null }, './WalletFundingUI': shared,
    }); t.after(() => harness.unmount());
    let tree = harness.render();
    assert.deepEqual(calls, []);
    assert.ok(renderToStaticMarkup(tree).includes(translateMessage(locale, 'funding.activateWalletCopy')));
    assert.equal(find(tree, 'PersonalFundingForm').props.disabled, true);
    const setup = find(tree, node => node?.type === 'button' && renderToStaticMarkup(node).includes(translateMessage(locale, 'funding.activateWallet')));
    assert.ok(setup); await setup.props.onClick();
    await flush(); tree = harness.render(); assert.deepEqual(calls, ['activate']);
    assert.equal(find(tree, node => node?.type === 'button' && renderToStaticMarkup(node).includes(translateMessage(locale, 'funding.verifyWallet'))), undefined);
    assert.equal(find(tree, 'PersonalFundingForm').props.disabled, false);
    assert.ok(!renderToStaticMarkup(tree).includes(translateMessage(locale, 'funding.activateWalletCopy')));
    assert.equal(find(tree, node => node?.type === 'button' && renderToStaticMarkup(node).includes(translateMessage(locale, 'funding.activateWallet'))), undefined);
  }
});

test('an unlinked foreign embedded connection never exposes its address or requests a proof; setup switches accounts without starting a purchase', async t => {
  const shared = load('WalletFundingUI.jsx', { 'lucide-react': icons, '@/i18n/LanguageProvider': i18n });
  function PersonalFundingForm() { return null; }
  const calls = [], foreignAddress = `0x${'9'.repeat(40)}`;
  const reown = { configured: true, isConnected: true, address: foreignAddress, linkedAddress: '', linkStatus: 'unlinked',
    walletIdentityMismatch: true, onrampStatus: 'idle',
    async chooseWallet() { calls.push('choose'); },
    async prepareWallet() { calls.push('activate'); return { linked: true, address: personalStatus.destination.address }; },
    async openConnect() { assert.fail('A cached foreign connection must be cleared first'); },
    async connectWallet() { assert.fail('The explicit account change action is required'); },
    async linkWallet() { assert.fail('Cannot ask the other account for a signature'); },
    async startOnramp() { assert.fail('Account switching cannot start a purchase'); } };
  const harness = componentHarness('PersonalWalletFundingPage.jsx', 'PersonalWalletFunding', {
    'lucide-react': icons, '@/i18n/LanguageProvider': i18n, '@/components/reown/ReownContext': { useReownWallet: () => reown },
    '@/lib/personal-funding-errors.mjs': { personalFundingFailure }, './WalletFundingForm': { PersonalFundingForm },
    './WalletFundingStatus': { default: () => null }, './WalletFundingUI': shared,
  }); t.after(() => harness.unmount());
  const tree = harness.render(), markup = renderToStaticMarkup(tree);
  assert.ok(!markup.includes(foreignAddress));
  assert.ok(markup.includes(translateMessage('es', 'funding.walletAccountChange')));
  assert.equal(find(tree, 'PersonalFundingForm').props.disabled, true);
  assert.equal(find(tree, 'PersonalFundingForm').props.destinationAddress, '');
  assert.equal(find(tree, node => node?.type === 'button' && renderToStaticMarkup(node).includes(translateMessage('es', 'funding.verifyWallet'))), undefined);
  assert.deepEqual(calls, []);
  await find(tree, node => node?.type === 'button' && renderToStaticMarkup(node).includes(translateMessage('es', 'funding.activateWallet'))).props.onClick();
  await flush(); assert.deepEqual(calls, ['activate']);
});

test('connected activation stays busy until canonical linkage and never offers an onramp cancel for a wallet proof', async t => {
  const shared = load('WalletFundingUI.jsx', { 'lucide-react': icons, '@/i18n/LanguageProvider': i18n });
  function PersonalFundingForm() { return null; }
  let complete; const pending = new Promise(resolve => { complete = resolve; });
  const calls = [], reown = { configured: true, isConnected: true, address: personalStatus.destination.address,
    linkedAddress: '', linkStatus: 'unlinked', onrampStatus: 'idle',
    prepareWallet() { calls.push('activate'); return pending; },
    connectWallet() { assert.fail('No separate connection action'); }, linkWallet() { assert.fail('No separate proof action'); },
    startOnramp() { assert.fail('Activation cannot open a purchase'); }, cancelOnramp() { assert.fail('Activation does not own an onramp'); } };
  const harness = componentHarness('PersonalWalletFundingPage.jsx', 'PersonalWalletFunding', {
    'lucide-react': icons, '@/i18n/LanguageProvider': i18n, '@/components/reown/ReownContext': { useReownWallet: () => reown },
    '@/lib/personal-funding-errors.mjs': { personalFundingFailure }, './WalletFundingForm': { PersonalFundingForm },
    './WalletFundingStatus': { default: () => null }, './WalletFundingUI': shared,
  }); t.after(() => harness.unmount());
  let tree = harness.render(); assert.ok(!renderToStaticMarkup(tree).includes(reown.address));
  find(tree, node => node?.type === 'button' && renderToStaticMarkup(node).includes(translateMessage('es', 'funding.activateWallet'))).props.onClick();
  tree = harness.render(); assert.deepEqual(calls, ['activate']);
  assert.ok(renderToStaticMarkup(tree).includes(translateMessage('es', 'funding.activatingWallet')));
  assert.equal(find(tree, node => node?.type === 'button' && renderToStaticMarkup(node).includes(translateMessage('es', 'funding.cancelConnection'))), undefined);
  assert.equal(find(tree, 'PersonalFundingForm').props.disabled, true);
  reown.linkStatus = 'linked'; reown.linkedAddress = reown.address; complete({ linked: true, address: reown.address });
  await flush(); tree = harness.render(); assert.equal(find(tree, 'PersonalFundingForm').props.disabled, false);
  assert.deepEqual(calls, ['activate']);
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
  assert.equal(calls[0].country, 'US');
  find(tree, 'FundingCountryField').props.onChange('MX');
  harness.render(props);
  assert.equal(calls[0].signal.aborted, true);
  calls[0].resolve({ country: 'US', paymentMethods: ['BANK_TRANSFER'], routes: [{ paymentMethods: [{ method: 'BANK_TRANSFER', minimumUsd: 50, maximumUsd: 500 }] }] });
  await flush();
  tree = harness.render(props);
  assert.deepEqual(find(tree, 'FundingMethodField').props.methods, []);
  calls[1].resolve({ country: 'MX', paymentMethods: ['CREDIT_DEBIT_CARD'], routes: [{ paymentMethods: methods }] });
  await flush(); tree = harness.render(props);
  assert.deepEqual(find(tree, 'FundingMethodField').props.methods, [], '30 USD cannot use a 175 USD route');
  find(tree, 'FundingAmountField').props.onChange('200');
  harness.render(props); tree = harness.render(props);
  assert.deepEqual(find(tree, 'FundingMethodField').props.methods, ['CREDIT_DEBIT_CARD'], JSON.stringify(harness.state));
  tree.props.onSubmit({ preventDefault() {} }); await flush();
  assert.equal(submitted.length, 1);
  assert.equal(submitted[0].countryCode, 'MX');
  assert.equal(submitted[0].paymentMethodType, 'CREDIT_DEBIT_CARD');
  assert.equal(submitted[0].amount, 200);
  assert.equal(Object.hasOwn(submitted[0], 'serviceProvider'), false);
  assert.equal(administrativeCalls, 0);
});

test('the personal wallet route mounts its flow and the retired administrative route returns not found and summary contains no funding hooks or SDK', () => {
  const personalRoute = readFileSync(new URL('../../wallet-personal/page.jsx', import.meta.url), 'utf8');
  const administrativeRoute = readFileSync(new URL('../../wallet-administrative/page.jsx', import.meta.url), 'utf8');
  const summary = readFileSync(new URL('WalletFundingPanels.jsx', import.meta.url), 'utf8');
  assert.match(personalRoute, /PersonalWalletFundingPage/); assert.doesNotMatch(personalRoute, /Administrative|runtimeEnvironment/);
  assert.match(administrativeRoute, /notFound\(\)/); assert.doesNotMatch(administrativeRoute, /AdministrativeWalletFundingPage|runtimeEnvironment/);
  assert.doesNotMatch(summary, /useState|useEffect|FundingForm|ReownProvider|wallet-funding-client/);
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
  const header = readFileSync(new URL('../../../../components/panel/PanelHeader.jsx', import.meta.url), 'utf8');
  const shell = readFileSync(new URL('../../../../components/panel/panel-shell.css', import.meta.url), 'utf8');
  assert.match(styles, /\.setupRequired \.details\s*\{\s*grid-row:\s*1/);
  assert.doesNotMatch(styles, /(?:^|[;}])\s*\.details\s*\{\s*grid-row:\s*1/);
  assert.match(personal, /!verified \? ` \$\{styles\.setupRequired\}`/);
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

test('only explicit personal field edits notify the page, never country detection, option loading, retry or automatic method selection', async t => {
  if (typeof navigator === 'undefined') { Object.defineProperty(globalThis, 'navigator', { value: { language: 'es-CO', languages: ['es-CO'] }, configurable: true }); t.after(() => { delete globalThis.navigator; }); }
  let selectionChanges = 0, sessions = 0;
  const routes = [{ paymentMethods: [
    { method: 'CREDIT_DEBIT_CARD', minimumUsd: 50, maximumUsd: 1000 },
    { method: 'BANK_TRANSFER', minimumUsd: 50, maximumUsd: 1000 },
  ] }];
  const harness = formHarness('PersonalFundingForm', {
    readPersonalFundingOptions: async country => ({ country, paymentMethods: ['CREDIT_DEBIT_CARD', 'BANK_TRANSFER'], routes }),
    readAdministrativeSandboxOptions() { assert.fail('administrative discovery called'); },
  });
  t.after(() => harness.unmount());
  const props = { onSelectionChange() { selectionChanges++; }, onContinue: async () => { sessions++; } };
  harness.render(props); harness.render(props); await flush(); harness.render(props); let tree = harness.render(props);
  assert.equal(selectionChanges, 0, 'automatic country and default method cannot clear an acknowledged request');
  find(tree, 'FundingMethodField').props.onRetry();
  harness.render(props); await flush(); harness.render(props); tree = harness.render(props);
  assert.equal(selectionChanges, 0, 'retrying an availability read preserves the selected request');
  find(tree, 'FundingAmountField').props.onChange('30');
  harness.render(props); tree = harness.render(props);
  assert.equal(selectionChanges, 1);
  find(tree, 'FundingCountryField').props.onChange('US');
  harness.render(props); await flush(); harness.render(props); tree = harness.render(props);
  assert.equal(selectionChanges, 2);
  find(tree, 'FundingMethodField').props.onChange('BANK_TRANSFER');
  harness.render(props);
  assert.equal(selectionChanges, 3);
  assert.equal(sessions, 0, 'editing a selection never starts a purchase');
});

test('live status presentation accepts only its exact own reference and unconfirmed backend contract, never checkout or URL success hints', () => {
  const { currentFundingView } = load('WalletFundingStatus.jsx', statusMocks(() => assert.fail('render-time read')));
  assert.equal(currentFundingView(personalStatus, 'personal', statusReference).state, 'unconfirmed');
  assert.equal(currentFundingView(personalStatus, 'personal', statusReference.toUpperCase()).state, 'unconfirmed');
  assert.equal(currentFundingView(administrativeStatus, 'administrative', statusReference), null);
  assert.equal(currentFundingView(administrativeStatus, 'personal', statusReference), null);
  assert.equal(currentFundingView(personalStatus, 'personal', secondStatusReference), null);
  assert.equal(currentFundingView({ ...personalStatus, success: true, paid: true, status: 'confirmed' }, 'personal', statusReference).state, 'unconfirmed');
  for (const confirmation of [{ state: 'confirmed', source: 'none', testMode: false }, { state: 'pending', source: 'return_url', testMode: false }, { state: 'unconfirmed', source: 'webhook', testMode: false }]) {
    assert.equal(currentFundingView({ ...personalStatus, confirmation }, 'personal', statusReference), null);
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
  const props = { walletKind: 'personal', checkoutReference: statusReference };
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

test('future confirmed visual fixtures distinguish received USDT from requested USD and reject sandbox views on the personal portal', () => {
  const { currentFundingView, WalletFundingStatusView } = load('WalletFundingStatus.jsx', statusMocks(() => assert.fail('fixture cannot fetch')));
  const base = currentFundingView(personalStatus, 'personal', statusReference);
  const confirmed = { ...base, state: 'confirmed', receivedAmount: '46.580001', confirmedAt: '2026-11-10T21:00:00Z' };
  let html = renderToStaticMarkup(WalletFundingStatusView({ view: confirmed }));
  assert.match(html, /Recarga confirmada/);
  assert.match(html, /46\.580001 USDT/);
  assert.ok(html.includes(translateMessage('es', 'funding.statusRequestedAmount')));
  assert.ok(html.includes(translateMessage('es', 'funding.statusReceived')));
  html = renderToStaticMarkup(WalletFundingStatusView({ view: { ...confirmed, testMode: true } }));
  assert.equal(html, '');

  html = renderToStaticMarkup(WalletFundingStatusView({ view: { ...confirmed, receivedAmount: undefined } }));
  assert.doesNotMatch(html, /Recarga confirmada|46\.580001/);
  assert.match(html, /Pago sin confirmar/);
});

test('the personal form reviews its immutable trusted destination immediately before the CTA and blocks a missing address', async t => {
  const harness = formHarness('PersonalFundingForm', { readPersonalFundingOptions: async country => ({ country,
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

test('the personal page selects only its acknowledged request and exposes its backend destination to the review field', async t => {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', { value: { dispatchEvent() {} }, configurable: true });
  t.after(() => { if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow); else delete globalThis.window; });
  const shared = load('WalletFundingUI.jsx', { 'lucide-react': icons, 'next/link': {}, '@/i18n/LanguageProvider': i18n });
  function PersonalFundingForm() { return null; }
  function WalletFundingHistory() { return null; }
  function WalletFundingStatus() { return null; }
  let personalResult = { pending: true, checkoutReference: statusReference }, personalSessions = 0;
  const personal = componentHarness('PersonalWalletFundingPage.jsx', 'PersonalWalletFunding', {
    'lucide-react': icons, 'next/dynamic': { default: () => () => null }, '@/i18n/LanguageProvider': i18n,
    '@/components/reown/ReownContext': { useReownWallet: () => ({ configured: true, isConnected: true, isLinked: true, address: personalStatus.destination.address,
      linkedAddress: personalStatus.destination.address, linkStatus: 'linked', onrampStatus: 'idle', fundingRevision: 0, startOnramp: async () => { personalSessions++; return personalResult; } }) },
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
  assert.equal(find(tree, 'WalletFundingHistory'), undefined, 'request history lives in its own wallet submenu');

  let personalTree = personal.render();
  const clearPersonal = find(personalTree, 'PersonalFundingForm').props.onSelectionChange;
  clearPersonal();
  personalTree = personal.render();
  assert.equal(find(personalTree, 'WalletFundingStatus'), undefined);
  assert.equal(find(personalTree, 'PersonalFundingForm').props.onSelectionChange, clearPersonal);
  assert.equal(find(personalTree, 'PersonalFundingForm').props.disabled, false, 'editing does not revoke backend wallet verification');
  assert.equal(find(personalTree, 'PersonalFundingForm').props.destinationAddress, personalStatus.destination.address);
  assert.equal(find(personalTree, 'WalletFundingHistory'), undefined);
  assert.equal(personalSessions, 2, 'local field edits never post another personal purchase');
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
    routes: [{ serviceProvider: 'SWAPPED', paymentMethods: countries[country].map(method => ({ method, minimumUsd: 20, maximumUsd: 1000 })) }] }),
    readAdministrativeSandboxOptions() { assert.fail('production methods cannot use sandbox'); },
  });
  t.after(() => harness.unmount());
  const props = { onContinue: async input => submitted.push(input) };
  harness.render(props); harness.render(props); await flush(); harness.render(props); let tree = harness.render(props);
  let field = find(tree, 'FundingMethodField');
  let view = field.type(field.props);
  assert.deepEqual(findAll(view, node => node?.type === 'input' && node.props.type === 'radio').map(node => node.props.value), countries.US);
  assert.match(renderToStaticMarkup(view), /5 opciones de pago/);
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
  assert.deepEqual(selectedMethodLimits(routes, 'CREDIT_DEBIT_CARD', 100), { minimumUsd: 30, maximumUsd: 2000 });
  assert.equal(selectedMethodLimits(routes, 'PAYPAL', 100), null);
  assert.equal(selectedMethodLimits(routes, 'CREDIT_DEBIT_CARD', 2500), null);
});

test('USD amount controls expose exact accessible limits, quick presets and a slider without overwriting manual cents', async t => {
  const submitted = [], selections = [];
  const harness = formHarness('PersonalFundingForm', { readPersonalFundingOptions: async country => ({ country, sourceCurrencyCode: 'USD',
    routes: [{ serviceProvider: 'SWAPPED', paymentMethods: [{ method: 'CREDIT_DEBIT_CARD', minimumUsd: 1, maximumUsd: 25000 }] }] }) });
  t.after(() => harness.unmount());
  const props = { onContinue: input => submitted.push(input), onSelectionChange: () => selections.push('changed') };
  harness.render(props); await flush(); harness.render(props); let tree = harness.render(props);
  const amountField = () => { const field = find(tree, 'FundingAmountField'); return field.type(field.props); };
  const range = () => findAll(amountField(), node => node?.type === 'input' && node.props.type === 'range')[0];
  const number = () => findAll(amountField(), node => node?.type === 'input' && node.props.type === 'number')[0];
  const presets = findAll(amountField(), node => node?.type === 'button');
  assert.deepEqual(presets.map(button => button.props.children), [30, 500, 1000, 2000, 5000, 10000, 15000]
    .map(value => new Intl.NumberFormat('es', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)));
  assert.ok(presets.every(button => button.props.type === 'button'));
  assert.equal(range().props.min, 30); assert.equal(range().props.max, 15000); assert.equal(range().props.step, 'any');
  assert.equal(number().props.min, '30'); assert.equal(number().props.max, '15000'); assert.equal(number().props.step, '0.01');
  assert.ok(findAll(amountField(), node => node?.type === 'label').some(label => label.props.htmlFor === range().props.id));
  number().props.onChange({ target: { value: '1234.56' } }); harness.render(props); tree = harness.render(props);
  assert.equal(number().props.value, '1234.56'); assert.equal(range().props.value, 1234.56);
  assert.equal(range().props['aria-valuetext'], new Intl.NumberFormat('es', { style: 'currency', currency: 'USD' }).format(1234.56));
  harness.render(props); tree = harness.render(props); assert.equal(number().props.value, '1234.56');
  assert.equal(submitted.length, 0); assert.equal(selections.length, 1);
  range().props.onChange({ target: { value: '6033.82' } }); harness.render(props); tree = harness.render(props);
  assert.equal(number().props.value, '6000');
  presets.at(-1).props.onClick(); harness.render(props); tree = harness.render(props);
  assert.equal(number().props.value, '15000'); assert.equal(find(tree, 'FundingSubmit').props.disabled, false);
  assert.equal(submitted.length, 0, 'amount controls initiated a checkout');
  for (const invalid of ['20', '29.99', '15000.01']) {
    number().props.onChange({ target: { value: invalid } }); harness.render(props); tree = harness.render(props);
    assert.equal(number().props.value, invalid, 'the slider silently clamped the manual field');
    assert.equal(number().props['aria-invalid'], true); assert.equal(find(tree, 'FundingSubmit').props.disabled, true);
    tree.props.onSubmit({ preventDefault() {} }); await flush(); assert.equal(submitted.length, 0);
  }
});

test('USD slider keyboard actions move useful increments and clamp boundaries without submitting', () => {
  const harness = formHarness('PersonalFundingForm', { readPersonalFundingOptions: async country => ({ country, routes: [] }) }), props = { onContinue: () => assert.fail('slider submitted') };
  try {
    let tree = harness.render(props);
    function range() { const field = find(tree, 'FundingAmountField'); return findAll(field.type(field.props), node => node?.type === 'input' && node.props.type === 'range')[0]; }
    function key(key, expected) {
      let prevented = false; range().props.onKeyDown({ key, preventDefault() { prevented = true; } });
      harness.render(props); tree = harness.render(props);
      assert.equal(prevented, true, key); assert.equal(find(tree, 'FundingAmountField').props.amount, String(expected), key);
    }
    key('ArrowRight', 130); key('ArrowUp', 230); key('PageUp', 1230); key('PageDown', 230); key('ArrowLeft', 130); key('ArrowDown', 30);
    key('ArrowLeft', 30); key('End', 15000); key('ArrowUp', 15000); key('Home', 30);
    range().props.onKeyDown({ key: 'Tab', preventDefault() { assert.fail('the slider trapped keyboard navigation'); } });
    assert.equal(range().props.dir, 'ltr', 'numeric slider direction must match its ArrowRight increment in every locale');
  } finally { harness.unmount(); }
});

test('SPEI amounts retain fixed pesos and have neither USD presets nor a USD slider', () => {
  const harness = formHarness('PersonalFundingForm', { readPersonalFundingOptions: async country => ({ country, routes: [] }) }), props = { onContinue: () => assert.fail('currency change submitted') };
  try {
    let tree = harness.render(props); find(tree, 'FundingCountryField').props.onChange('MX'); tree = harness.render(props);
    find(tree, 'FundingCurrencyField').props.onChange('MXN'); tree = harness.render(props);
    const field = find(tree, 'FundingAmountField'), view = field.type(field.props);
    assert.equal(field.props.amount, '931');
    assert.equal(findAll(view, node => node?.type === 'input' && node.props.type === 'range').length, 0);
    assert.equal(findAll(view, node => node?.type === 'button').length, 0);
    assert.equal(findAll(view, node => node?.type === 'input' && node.props.type === 'number')[0].props.min, '931');
  } finally { harness.unmount(); }
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

test('personal MXN discovery cancels USD responses and enforces the fixed 931 floor above older provider limits', async t => {
  const calls = [], submitted = [];
  const harness = formHarness('PersonalFundingForm', {
    readPersonalFundingOptions(country, { signal, sourceCurrencyCode }) { return new Promise(resolve => calls.push({ country, signal, sourceCurrencyCode, resolve })); },
    readAdministrativeSandboxOptions() { assert.fail('personal funding must not read administrative routes'); },
  });
  t.after(() => harness.unmount());
  const props = { onContinue: async input => submitted.push(input) };
  harness.render(props); let tree = harness.render(props);
  find(tree, 'FundingCountryField').props.onChange('MX');
  harness.render(props); tree = harness.render(props);
  find(tree, 'FundingCurrencyField').props.onChange('MXN');
  harness.render(props); tree = harness.render(props);
  const latest = calls.at(-1);
  assert.equal(latest.sourceCurrencyCode, 'MXN');
  assert.equal(find(tree, 'FundingAmountField').props.amount, '931', 'changing currency selects its fixed minimum rather than relabelling USD 30');
  for (const old of calls.slice(0, -1)) {
    assert.equal(old.signal.aborted, true);
    old.resolve({ country: old.country, sourceCurrencyCode: old.sourceCurrencyCode, routes: [{ paymentMethods: [{ method: 'PAYPAL', minimumUsd: 50, maximumUsd: 5000 }] }] });
  }
  latest.resolve({ country: 'MX', sourceCurrencyCode: 'MXN', routes: [{ paymentMethods: [
    { method: 'SPEI', currencyCode: 'MXN', minimumAmount: 150, maximumAmount: 100000 },
    { method: 'CREDIT_DEBIT_CARD', currencyCode: 'MXN', minimumAmount: 100, maximumAmount: 100000 },
    { method: 'PAYPAL', currencyCode: 'USD', minimumAmount: 50, maximumAmount: 5000 },
  ] }] });
  await flush(); harness.render(props); harness.render(props); tree = harness.render(props);
  const method = find(tree, 'FundingMethodField');
  assert.deepEqual(method.props.methods, ['SPEI']);
  assert.deepEqual(method.props.limits, { minimumAmount: 931, maximumAmount: 100000 });
  assert.match(renderToStaticMarkup(method.type(method.props)), /SPEI.*transferencia bancaria/);
  assert.equal(find(tree, 'FundingAmountField').props.amount, '931', 'the fixed MXN minimum does not depend on a currency conversion');
  assert.equal(find(tree, 'FundingSubmit').props.disabled, false);
  find(tree, 'FundingAmountField').props.onChange('930.99');
  harness.render(props); tree = harness.render(props);
  assert.equal(find(tree, 'FundingSubmit').props.disabled, true);
  tree.props.onSubmit({ preventDefault() {} }); await flush();
  assert.equal(submitted.length, 0, 'below the fixed minimum cannot initiate checkout even when the provider accepts less');
  const belowMinimum = find(tree, 'FundingMethodField');
  const feedback = renderToStaticMarkup(belowMinimum.type(belowMinimum.props));
  assert.doesNotMatch(feedback, /Reintentar/, 'a successfully loaded route cannot masquerade as a lookup failure');
  assert.match(feedback, /Usar/);
  const lookups = calls.length;
  belowMinimum.props.onUseMinimum(); harness.render(props); tree = harness.render(props);
  assert.equal(find(tree, 'FundingAmountField').props.amount, '931.00');
  assert.equal(calls.length, lookups, 'using the provider minimum edits the amount without replaying discovery');
  find(tree, 'FundingAmountField').props.onChange('1200');
  harness.render(props); tree = harness.render(props);
  assert.equal(find(tree, 'FundingSubmit').props.disabled, false);
  tree.props.onSubmit({ preventDefault() {} }); await flush();
  assert.equal(submitted.length, 1);
  assert.equal(submitted[0].sourceCurrencyCode, 'MXN');
  assert.equal(submitted[0].paymentMethodType, 'SPEI');
  assert.equal(submitted[0].amount, 1200);
  find(tree, 'FundingCurrencyField').props.onChange('USD');
  harness.render(props); tree = harness.render(props);
  assert.equal(find(tree, 'FundingAmountField').props.amount, '30');
  assert.deepEqual(find(tree, 'FundingMethodField').props.methods, [], 'old MXN methods disappear before USD lookup completes');
});

test('personal funding defaults to the requested US choice with implicit USD and permits US, Mexico and Colombia', async t => {
  const calls = [];
  const personal = formHarness('PersonalFundingForm', { readPersonalFundingOptions: async (country, { sourceCurrencyCode }) => {
    calls.push({ country, sourceCurrencyCode }); return { country, routes: [] };
  } }, 'CO');
  t.after(() => personal.unmount());
  personal.render(); const personalTree = personal.render();
  const field = find(personalTree, 'FundingCountryField');
  assert.equal(field.props.value, 'US', 'the explicit default is not overwritten by browser detection');
  assert.equal(find(personalTree, 'FundingCurrencyField'), undefined, 'USD does not need a redundant selector in the US');
  assert.equal(find(personalTree, 'FundingAmountField').props.sourceCurrencyCode, 'USD');
  assert.deepEqual(field.props.countries.map(([code]) => code), ['US', 'MX', 'CO']);
  const html = renderToStaticMarkup(field.type(field.props));
  assert.doesNotMatch(html, /value="(?:PA|ES|GB|CR|DO|GT|UY)"/);
  assert.match(html, /value="CO">Colombia</);
  field.props.onChange('CO'); personal.render(); const colombia = personal.render();
  assert.equal(find(colombia, 'FundingCountryField').props.value, 'CO');
  assert.equal(find(colombia, 'FundingCurrencyField'), undefined, 'Colombia uses implicit USD');
  assert.equal(find(colombia, 'FundingAmountField').props.sourceCurrencyCode, 'USD');
  assert.equal(find(colombia, 'FundingAmountField').props.amount, '30');
  assert.deepEqual(calls.at(-1), { country: 'CO', sourceCurrencyCode: 'USD' });
  assert.deepEqual(personal.exports.fundingCurrencyChoices('CO'), ['USD']);
});

test('manual country changes cancel prior methods and remember the Mexican currency without relabelling amounts', async t => {
  const calls = [], edits = [];
  const harness = formHarness('PersonalFundingForm', { readPersonalFundingOptions(country, { sourceCurrencyCode, signal }) {
    return new Promise(resolve => calls.push({ country, sourceCurrencyCode, signal, resolve }));
  } }, 'CO');
  t.after(() => harness.unmount());
  const props = { onContinue() {}, onSelectionChange: () => edits.push('edited') };
  let tree = harness.render(props); tree = harness.render(props);
  assert.equal(find(tree, 'FundingCountryField').props.value, 'US');
  assert.equal(find(tree, 'FundingCurrencyField'), undefined);
  assert.deepEqual([calls[0].country, calls[0].sourceCurrencyCode], ['US', 'USD']);
  find(tree, 'FundingCountryField').props.onChange('MX');
  harness.render(props); tree = harness.render(props);
  assert.equal(calls[0].signal.aborted, true);
  assert.deepEqual(harness.exports.fundingCurrencyChoices('MX'), ['USD', 'MXN']);
  find(tree, 'FundingCurrencyField').props.onChange('MXN');
  harness.render(props); tree = harness.render(props);
  assert.equal(find(tree, 'FundingAmountField').props.amount, '931');
  calls.at(-1).resolve({ country: 'MX', sourceCurrencyCode: 'MXN', routes: [{ paymentMethods: [
    { method: 'SPEI', currencyCode: 'MXN', minimumAmount: 148.66, maximumAmount: 100000 }] }] });
  await flush(); harness.render(props); tree = harness.render(props);
  find(tree, 'FundingAmountField').props.onChange('1000');
  harness.render(props); tree = harness.render(props);
  assert.equal(find(tree, 'FundingAmountField').props.amount, '1000');
  find(tree, 'FundingMethodField').props.onRetry();
  harness.render(props); tree = harness.render(props);
  assert.equal(find(tree, 'FundingAmountField').props.amount, '1000', 'refreshing methods must not overwrite a typed amount');
  find(tree, 'FundingCountryField').props.onChange('US');
  harness.render(props); tree = harness.render(props);
  assert.equal(find(tree, 'FundingCurrencyField'), undefined);
  assert.equal(find(tree, 'FundingAmountField').props.amount, '30');
  assert.equal(find(tree, 'FundingAmountField').props.sourceCurrencyCode, 'USD');
  assert.deepEqual(find(tree, 'FundingMethodField').props.methods, []);
  find(tree, 'FundingCountryField').props.onChange('MX');
  harness.render(props); tree = harness.render(props);
  assert.equal(find(tree, 'FundingCurrencyField').props.value, 'MXN');
  assert.equal(find(tree, 'FundingAmountField').props.amount, '931');
  assert.deepEqual([calls.at(-1).country, calls.at(-1).sourceCurrencyCode], ['MX', 'MXN']);
  assert.equal(calls.slice(0, -1).every(call => call.signal.aborted), true);
  assert.equal(edits.length, 5, 'only explicit country, currency and amount changes notify the page');
});

test('MXN amount validation and higher provider floors remain explicit even when an old route advertises less', async t => {
  const harness = formHarness('PersonalFundingForm', { readPersonalFundingOptions: async country => ({ country, routes: [] }) });
  t.after(() => harness.unmount());
  const tree = harness.render();
  const amount = find(tree, 'FundingAmountField');
  const html = renderToStaticMarkup(amount.type({ ...amount.props, amount: '930.99', sourceCurrencyCode: 'MXN' }));
  assert.match(html, /min="931"/);
  assert.match(html, /931 MXN/);
  assert.match(html, /aria-invalid="true"/);
  const route = (minimumAmount, maximumAmount) => [{ paymentMethods: [{ method: 'SPEI', currencyCode: 'MXN', minimumAmount, maximumAmount }] }];
  assert.deepEqual(harness.exports.eligiblePaymentMethods(route(148.66, 100000), 930.99, 'MXN'), []);
  assert.deepEqual(harness.exports.eligiblePaymentMethods(route(148.66, 100000), 931, 'MXN'), ['SPEI']);
  assert.deepEqual(harness.exports.eligiblePaymentMethods(route(148.66, 930), 931, 'MXN'), []);
  assert.deepEqual(harness.exports.selectedMethodLimits(route(1200, 100000), 'SPEI', 1200, 'MXN'), { minimumAmount: 1200, maximumAmount: 100000 });
});

test('personal history and status surfaces cannot mount or request an administrative wallet', t => {
  const never = () => assert.fail('personal portal requested administrative data');
  const history = componentHarness('WalletFundingHistory.jsx', 'default', {
    'lucide-react': icons, '@/i18n/LanguageProvider': i18n,
    '@/lib/wallet-funding-client.mjs': { readWalletFundingHistory: never },
  });
  const status = componentHarness('WalletFundingStatus.jsx', 'default', statusMocks(never));
  t.after(() => { history.unmount(); status.unmount(); });
  assert.equal(history.render({ walletKind: 'administrative', refreshKey: 0 }), null);
  assert.equal(status.render({ walletKind: 'administrative', checkoutReference: statusReference }), null);
});

test('USD30 uses an eligible route while retaining a higher provider floor and rejects duplicate pending submits', async t => {
  const submitted = [];
  let finish;
  const harness = formHarness('PersonalFundingForm', { readPersonalFundingOptions: async country => ({ country, sourceCurrencyCode: 'USD', routes: [
    { serviceProvider: 'SWAPPED', paymentMethods: [{ method: 'CREDIT_DEBIT_CARD', currencyCode: 'USD', minimumAmount: 7.81, maximumAmount: 111530 }] },
    { serviceProvider: 'MERCURYO', paymentMethods: [{ method: 'APPLE_PAY', currencyCode: 'USD', minimumAmount: 128.04, maximumAmount: 16821.71 }] },
  ] }) });
  t.after(() => harness.unmount());
  const props = { onContinue: input => { submitted.push(input); return new Promise(resolve => { finish = resolve; }); } };
  harness.render(props); harness.render(props); await flush(); harness.render(props); let tree = harness.render(props);
  assert.equal(find(tree, 'FundingAmountField').props.amount, '30');
  assert.deepEqual(find(tree, 'FundingMethodField').props.methods, ['CREDIT_DEBIT_CARD']);
  assert.equal(find(tree, 'FundingSubmit').props.disabled, false);
  find(tree, 'FundingAmountField').props.onChange('29.99'); harness.render(props); tree = harness.render(props);
  assert.equal(find(tree, 'FundingSubmit').props.disabled, true);
  find(tree, 'FundingAmountField').props.onChange('30'); harness.render(props); tree = harness.render(props);
  tree.props.onSubmit({ preventDefault() {} }); tree.props.onSubmit({ preventDefault() {} }); await flush();
  assert.equal(submitted.length, 1);
  assert.equal(submitted[0].amount, 30);
  finish(); await flush();
  find(tree, 'FundingAmountField').props.onChange('128.04'); harness.render(props); tree = harness.render(props);
  assert.deepEqual(find(tree, 'FundingMethodField').props.methods, ['CREDIT_DEBIT_CARD', 'APPLE_PAY']);
});

test('canceling a pending connection recovers the page without revoking its backend-verified wallet or opening checkout', t => {
  function PersonalFundingForm() { return null; }
  let status = 'connecting', cancelled = 0;
  const shared = load('WalletFundingUI.jsx', { 'lucide-react': icons, 'next/link': {}, '@/i18n/LanguageProvider': i18n });
  const harness = componentHarness('PersonalWalletFundingPage.jsx', 'PersonalWalletFunding', {
    'lucide-react': icons, 'next/dynamic': { default: () => () => null }, '@/i18n/LanguageProvider': i18n,
    '@/components/reown/ReownContext': { useReownWallet: () => ({ configured: true, linkStatus: 'linked', linkedAddress: personalStatus.destination.address,
      onrampStatus: status, cancelOnramp() { cancelled++; status = 'idle'; }, startOnramp() { assert.fail('cancel must not initiate checkout'); } }) },
    '@/lib/personal-funding-errors.mjs': { personalFundingFailure }, './WalletFundingForm': { PersonalFundingForm },
    './WalletFundingHistory': { default: () => null }, './WalletFundingStatus': { default: () => null }, './WalletFundingUI': shared,
  });
  t.after(() => harness.unmount());
  let tree = harness.render();
  assert.equal(tree.props.provider, undefined, 'no production environment badge is rendered');
  assert.equal(find(tree, 'PersonalFundingForm').props.busy, true);
  const cancel = find(tree, node => node?.type === 'button' && node.props.children === translateMessage('es', 'funding.cancelConnection'));
  assert.ok(cancel); cancel.props.onClick(); tree = harness.render();
  assert.equal(cancelled, 1);
  assert.equal(find(tree, 'PersonalFundingForm').props.busy, false);
  assert.equal(find(tree, 'PersonalFundingForm').props.disabled, false);
  assert.equal(find(tree, 'PersonalFundingForm').props.destinationAddress, personalStatus.destination.address);
});

test('personal MXN request amounts remain pesos in both history and status presentation', async t => {
  const harness = componentHarness('WalletFundingHistory.jsx', 'default', { 'lucide-react': icons, '@/i18n/LanguageProvider': i18n,
    '@/lib/wallet-funding-client.mjs': { readWalletFundingHistory: async () => ({ records: [{ checkoutReference: statusReference,
      requestedAmount: 150, sourceCurrencyCode: 'MXN', status: 'initiated', createdAt: '2026-11-10T21:00:00Z' }] }) },
  });
  t.after(() => harness.unmount()); harness.render({ walletKind: 'personal' }); await flush();
  const history = renderToStaticMarkup(harness.render({ walletKind: 'personal' }));
  assert.match(history, /MXN/); assert.doesNotMatch(history, /US\$/);
  const { WalletFundingStatusView } = load('WalletFundingStatus.jsx', statusMocks(() => {}));
  const view = { walletKind: 'personal', requestedAmount: 150, sourceCurrencyCode: 'MXN', state: 'unconfirmed', checkoutReference: statusReference, destination: personalStatus.destination };
  const html = renderToStaticMarkup(WalletFundingStatusView({ view }));
  assert.match(html, /MXN/); assert.doesNotMatch(html, /US\$/);
});

test('explicit funding edits clear a stale provider error without reconnecting or revoking the verified destination', t => {
  function PersonalFundingForm() { return null; }
  let resets = 0;
  const reown = { configured: true, linkStatus: 'linked', linkedAddress: personalStatus.destination.address,
    onrampStatus: 'error', onrampError: 'valuation',
    clearOnrampError() { resets++; this.onrampStatus = 'idle'; this.onrampError = ''; },
    startOnramp() { assert.fail('a selection edit cannot initiate a request'); } };
  const shared = load('WalletFundingUI.jsx', { 'lucide-react': icons, 'next/link': {}, '@/i18n/LanguageProvider': i18n });
  const harness = componentHarness('PersonalWalletFundingPage.jsx', 'PersonalWalletFunding', {
    'lucide-react': icons, 'next/dynamic': { default: () => () => null }, '@/i18n/LanguageProvider': i18n,
    '@/components/reown/ReownContext': { useReownWallet: () => reown },
    '@/lib/personal-funding-errors.mjs': { personalFundingFailure }, './WalletFundingForm': { PersonalFundingForm },
    './WalletFundingHistory': { default: () => null }, './WalletFundingStatus': { default: () => null }, './WalletFundingUI': shared,
  });
  t.after(() => harness.unmount());
  let tree = harness.render();
  assert.equal(find(tree, 'WalletActionError').props.message, translateMessage('es', 'funding.speiTemporarilyUnavailable'));
  find(tree, 'PersonalFundingForm').props.onSelectionChange(); tree = harness.render();
  assert.equal(resets, 1);
  assert.equal(find(tree, 'WalletActionError').props.message, '');
  assert.equal(find(tree, 'PersonalFundingForm').props.destinationAddress, personalStatus.destination.address);
  assert.equal(find(tree, 'PersonalFundingForm').props.disabled, false);
});

test('new personal funding review uses Polygon while old funding records retain their recorded network', () => {
  const harness = formHarness('PersonalFundingForm', {});
  const destination = harness.exports.FundingDestination({ address: personalStatus.destination.address });
  assert.match(renderToStaticMarkup(destination), /USDT · Polygon/);
  const { currentFundingView, WalletFundingStatusView } = load('WalletFundingStatus.jsx', statusMocks(() => {}));
  for (const [network, chainId, label] of [['ethereum', 1, 'Ethereum'], ['polygon', 137, 'Polygon']]) {
    const record = { ...personalStatus, destination: { ...personalStatus.destination, network, chainId } };
    const view = currentFundingView(record, 'personal', statusReference);
    assert.ok(view, network);
    const html = renderToStaticMarkup(WalletFundingStatusView({ view }));
    assert.ok(html.includes('USDT · ' + label));
    assert.ok(!html.includes('USDT · ' + (network === 'ethereum' ? 'Polygon' : 'Ethereum')));
  }
});
