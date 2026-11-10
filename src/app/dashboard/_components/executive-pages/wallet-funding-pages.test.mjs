import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { translateMessage } from '../../../../i18n/translate.mjs';
import { validFundingAmount, WALLET_GATEWAY_FAILURE_REASONS } from '../../../../lib/wallet-funding-contract.mjs';
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
    if (id === '@/lib/wallet-funding-contract.mjs') return { validFundingAmount, WALLET_GATEWAY_FAILURE_REASONS };
    if (id.endsWith('.module.css')) return styles;
    if (id === 'react/jsx-runtime' || id === 'react') return require(id);
    assert.fail(`Unexpected dependency ${id}`);
  }, module, module.exports);
  return module.exports;
}

function formHarness(name, api) {
  const state = [], refs = [], effects = [];
  let stateIndex = 0, refIndex = 0, effectIndex = 0;
  const pendingEffects = [];
  const hooks = { ...React,
    useState(initial) { const index = stateIndex++; if (!(index in state)) state[index] = initial; return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }]; },
    useRef(initial) { const index = refIndex++; return refs[index] ||= { current: initial }; },
    useId: () => 'funding-test',
    useEffect(effect, deps) { const index = effectIndex++, previous = effects[index]; if (!previous || deps.some((value, i) => value !== previous.deps[i])) pendingEffects.push(() => { previous?.cleanup?.(); effects[index] = { deps, cleanup: effect() }; }); },
  };
  const exports = load('WalletFundingForm.jsx', { react: hooks, 'lucide-react': icons, '@/i18n/LanguageProvider': i18n,
    '@/lib/meld-onramp.mjs': { browserOnrampRegion: () => 'CO' }, '@/lib/meld-onramp-client.mjs': { ONRAMP_COUNTRIES: [['CO'], ['US']] },
    '@/lib/wallet-funding-client.mjs': { fundingRequestId: () => 'd8a4c010-cc33-44da-a297-8b3c6440f491', ...api },
    '@/lib/wallet-funding-contract.mjs': { validFundingAmount },
  });
  return { render(props = {}) { stateIndex = 0; refIndex = 0; effectIndex = 0; const tree = exports[name](props); while (pendingEffects.length) pendingEffects.shift()(); return tree; },
    unmount() { for (const effect of effects) effect?.cleanup?.(); }, exports, state };
}

function find(node, name) {
  if (node?.type?.name === name) return node;
  return React.Children.toArray(node?.props?.children).map(child => find(child, name)).find(Boolean);
}
const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
const methods = [{ method: 'CREDIT_DEBIT_CARD', minimumUsd: 75, maximumUsd: 1000 }];

test('a connected Reown address never claims backend verification and check failures remain actionable', () => {
  const { personalWalletState, personalOnrampError } = load('PersonalWalletFundingPage.jsx', {
    'lucide-react': icons, 'next/dynamic': { default: () => () => null }, '@/components/reown/ReownContext': {},
    '@/i18n/LanguageProvider': i18n, './WalletFundingForm': {}, './WalletFundingHistory': {}, './WalletFundingUI': {},
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
  assert.equal(React.Children.toArray(tree.props.children.props.children).some(node => node?.type === 'label'), false, 'one eligible provider requires no selection');
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
  const label = React.Children.toArray(tree.props.children.props.children).find(node => node?.type === 'label');
  const select = React.Children.toArray(label.props.children).find(node => node?.type === 'select');
  assert.equal(select.props.value, 'TRANSAK');
  select.props.onChange({ target: { value: 'BANXA' } });
  harness.render(props); tree = harness.render(props);
  tree.props.onSubmit({ preventDefault() {} }); await flush();
  assert.equal(submitted[0].serviceProvider, 'BANXA');
  find(tree, 'FundingAmountField').props.onChange('250');
  harness.render(props); tree = harness.render(props);
  assert.equal(React.Children.toArray(tree.props.children.props.children).some(node => node?.type === 'label'), false);
  tree.props.onSubmit({ preventDefault() {} }); await flush();
  assert.equal(submitted[1].serviceProvider, 'BANXA');
  assert.equal(calls.length, 2, 'provider and amount changes use their own already-fetched country routes');
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
  const { fundingError } = load('WalletFundingUI.jsx', { 'lucide-react': icons, 'next/link': {}, '@/i18n/LanguageProvider': i18n });
  for (const locale of ['es', 'en', 'ar', 'zh']) {
    const t = key => translateMessage(locale, key);
    const method = fundingError(new Error('wallet_funding_method_unavailable'), t, true);
    const amount = fundingError(new Error('wallet_funding_amount_unavailable'), t, true);
    assert.equal(method, t('funding.methodReloadRequired'));
    assert.equal(amount, t('funding.amountUnavailable'));
    assert.notEqual(method, amount);
    assert.notEqual(method, t('funding.sandboxUnavailable'));
    assert.ok(!method.startsWith('funding.') && !amount.startsWith('funding.'), locale);
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
  assert.deepEqual(['ASTROPAY', 'NETELLER', 'PAYSAFECARD', 'SKRILL'].map(code => harness.exports.paymentMethodLabel(code, t)), ['AstroPay', 'Neteller', 'PaysafeCard', 'Skrill']);
  assert.equal(harness.exports.paymentMethodLabel('CREDIT_DEBIT_CARD', t), t('onramp.cardPayment'));
  assert.equal(harness.exports.paymentMethodLabel('APPLE_PAY', t), 'Apple Pay');
  assert.equal(harness.exports.paymentMethodLabel('GOOGLE_PAY', t), 'Google Pay');
  assert.equal(harness.exports.paymentMethodLabel('BANK_TRANSFER', t), t('onramp.bankTransfer'));
});
