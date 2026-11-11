import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from 'node:vm';
import ts from 'typescript';
import { reownFundingSelection, buildReownProductionOnrampUrl } from './reown-production-onramp.mjs';
import { personalFundingFailure } from './personal-funding-errors.mjs';
import { createReownFundingOperation, verifyReownWalletOwnership } from './reown-funding-operation.mjs';

const read = relative => readFileSync(new URL(relative, import.meta.url), "utf8");

function onrampCallback(name, scope) {
  const source = ts.createSourceFile('ReownProvider.jsx', read('../components/reown/ReownProvider.jsx'),
    ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX);
  let callback;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === name && ts.isCallExpression(node.initializer)) {
      callback = node.initializer.arguments[0];
    }
    if (!callback) ts.forEachChild(node, visit);
  }
  visit(source);
  assert.ok(callback, `Missing ${name} production callback`);
  return vm.runInNewContext(`(${callback.getText(source)})`, scope);
}

const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const taskTick = () => new Promise(resolve => setTimeout(resolve, 0));
function fundingRuntime(overrides = {}) {
  const address = `0x${'1'.repeat(40)}`;
  const projectId = 'a'.repeat(32);
  const requestId = 'd8a4c010-cc33-44da-a297-8b3c6440f491';
  const provider = { name: 'meld', url: `https://meldcrypto.com/?publicKey=test&externalCustomerId=${projectId}` };
  const events = [], states = [], bindings = [];
  const ref = () => ({ current: null });
  const scope = {
    reownFundingSelection, buildReownProductionOnrampUrl, personalFundingFailure,
    createReownFundingOperation, verifyReownWalletOwnership, detectPersonalFundingCountry: () => 'US', projectId,
    onrampErrorCode: personalFundingFailure, isAddress: value => /^0x[0-9a-f]{40}$/i.test(value || ''),
    sameAddress: (a, b) => typeof a === 'string' && typeof b === 'string' && a.toLowerCase() === b.toLowerCase(),
    getAddress: value => value, mounted: { current: true }, account: { isConnected: false }, boundAddress: address,
    currentAddress: '', walletProvider: undefined, binding: { status: 'linked', address },
    onrampOperation: ref(), linkingOperation: ref(), onrampFlow: ref(), onrampSelection: ref(), onrampIntent: ref(),
    linking: ref(), connectModalSeen: ref(), appKitState: { open: false },
    PERSONAL_WALLET_MINIMUM_USD: 20, PERSONAL_WALLET_ASSET: 'USDT', DOMException,
    setBinding: value => bindings.push(value), setOnrampState: value => states.push(value),
    setVerificationError() {}, setIsLinking() {}, setFundingRevision: () => events.push('revision'),
    OnRampController: { state: { providers: [provider], selectedProvider: provider }, setSelectedProvider() {} },
    fundingRequestId: () => requestId,
    createPersonalFundingIntent: async body => ({ checkoutReference: body.requestId, requestedAmount: body.amount,
      sourceCurrencyCode: body.sourceCurrencyCode, paymentMethodType: body.paymentMethodType, allowedProviders: ['SWAPPED'] }),
    open: async () => {}, close: () => events.push('close SDK modal'),
    disconnect: () => assert.fail('cancellation must never disconnect a wallet'),
    window: { open: url => { events.push({ opened: new URL(url) }); return { opener: null }; },
      location: { assign: () => assert.fail('unexpected navigation fallback') }, dispatchEvent: () => events.push('linked event') },
    Event: class { constructor(type) { this.type = type; } },
    ...overrides,
  };
  for (const name of ['beginOnrampOperation', 'cancelOnramp', 'openConnect', 'linkWallet', 'runOnramp', 'startOnramp']) {
    scope[name] = onrampCallback(name, scope);
  }
  return { scope, events, states, bindings, address, requestId,
    input: { requestId, country: 'MX', sourceCurrencyCode: 'USD', amount: 20, paymentMethodType: 'CREDIT_DEBIT_CARD' } };
}

test('manual cancellation releases a hung SDK connect and its late result cannot begin funding', async () => {
  const rpc = deferred(), started = deferred();
  const runtime = fundingRuntime({ boundAddress: '', binding: { status: 'unlinked', address: '' },
    appKitState: { open: true }, open: () => { started.resolve(); return rpc.promise; },
    createPersonalFundingIntent: () => assert.fail('cancelled connection created an intent') });
  const pending = runtime.scope.startOnramp(runtime.input);
  await started.promise; runtime.scope.cancelOnramp();
  await assert.rejects(pending, { name: 'AbortError' });
  rpc.resolve(); await taskTick();
  assert.equal(runtime.scope.onrampIntent.current, false);
  assert.equal(runtime.scope.onrampSelection.current, null);
  assert.equal(runtime.scope.onrampOperation.current, null);
  assert.equal(runtime.states.at(-1).status, 'idle');
  assert.equal(runtime.events.some(value => value?.opened), false);
  assert.deepEqual(runtime.bindings, []);
});

test('selection changes clear only a previous onramp error and preserve active work and verified ownership', () => {
  const address = `0x${'1'.repeat(40)}`;
  const binding = Object.freeze({ status: 'linked', address });
  const pending = Object.freeze({ active: true, cancel: () => assert.fail('clearing an error cancelled funding') });
  const scope = {
    onrampOperation: Object.freeze({ current: pending }),
    linkingOperation: Object.freeze({ current: pending }),
    binding, boundAddress: address,
    setBinding: () => assert.fail('clearing an error changed ownership'),
    setVerificationError: () => assert.fail('clearing an error changed signature verification'),
    disconnect: () => assert.fail('clearing an error disconnected a wallet'),
  };
  for (const status of ['error', 'idle', 'connecting', 'linking', 'opening', 'open']) {
    const previous = Object.freeze({ status, error: status === 'error' ? 'valuation' : '', correlation: 'retained' });
    let state = previous;
    scope.setOnrampState = update => { state = update(state); };
    onrampCallback('clearOnrampError', scope)();
    if (status === 'error') {
      assert.equal(state.status, 'idle'); assert.equal(state.error, ''); assert.equal(state.correlation, 'retained');
    } else assert.equal(state, previous);
    assert.equal(scope.binding, binding); assert.equal(scope.boundAddress, address);
    assert.equal(scope.onrampOperation.current, pending); assert.equal(scope.linkingOperation.current, pending);
  }
  assert.match(read('../components/reown/ReownContext.jsx'), /clearOnrampError: \(\) => \{\}/);
  assert.match(read('../components/reown/ReownProvider.jsx'), /clearOnrampError: \(\) => \{\}/);
});

test('company network switching first verifies the connected bound wallet and calls only the Polygon AppKit SDK switch', async () => {
  const address = `0x${'1'.repeat(40)}`, polygon = Object.freeze({ id: 137, name: 'Polygon' });
  const provider = { request() { assert.fail('network switching used a raw provider request or transaction RPC'); } };
  const cases = [{}, { account: { isConnected: false } }, { walletProvider: undefined }, { currentAddress: '' }, { boundAddress: '' },
    { currentAddress: `0x${'2'.repeat(40)}` }];
  for (const change of cases) {
    const events = [];
    const scope = { account: { isConnected: true }, walletProvider: provider, currentAddress: address, boundAddress: address,
      sameAddress: (left, right) => left.toLowerCase() === right.toLowerCase(), polygon,
      switchAppKitNetwork: async network => { assert.equal(network, polygon); events.push('polygon SDK switch'); }, ...change };
    const verifiedProvider = onrampCallback('getCompanyPaymentProvider', scope);
    scope.getCompanyPaymentProvider = () => { events.push('verify bound wallet'); return verifiedProvider(); };
    const callback = onrampCallback('switchCompanyPaymentNetwork', scope);
    if (Object.keys(change).length) {
      await assert.rejects(callback(), { message: 'personal_company_wallet_unavailable' });
      assert.deepEqual(events, ['verify bound wallet']);
    } else {
      await callback({ id: 1 });
      assert.deepEqual(events, ['verify bound wallet', 'polygon SDK switch']);
    }
  }
});

test('a hung SDK connect times out with a recoverable category rather than leaving the button busy', async () => {
  const rpc = deferred();
  const runtime = fundingRuntime({ boundAddress: '', binding: { status: 'unlinked', address: '' },
    createReownFundingOperation: options => createReownFundingOperation({ ...options, timeoutMs: 15 }),
    open: () => rpc.promise });
  await assert.rejects(runtime.scope.startOnramp(runtime.input), { name: 'TimeoutError' });
  assert.equal(runtime.states.at(-1).status, 'error');
  assert.equal(runtime.states.at(-1).error, 'connection_timeout');
  assert.equal(runtime.scope.onrampIntent.current, false);
  rpc.resolve(); await taskTick(); assert.deepEqual(runtime.bindings, []);
});

test('a verified bound address bypasses SDK auth and a cancelled late intent never opens checkout', async () => {
  const intent = deferred(), started = deferred();
  const runtime = fundingRuntime({ open: () => assert.fail('verified wallet asked to authenticate again'),
    createPersonalFundingIntent: () => { started.resolve(); return intent.promise; } });
  const pending = runtime.scope.startOnramp(runtime.input);
  await started.promise; runtime.scope.cancelOnramp(); await assert.rejects(pending, { name: 'AbortError' });
  intent.resolve({ checkoutReference: runtime.requestId, requestedAmount: 20, sourceCurrencyCode: 'USD',
    paymentMethodType: 'CREDIT_DEBIT_CARD', allowedProviders: ['SWAPPED'] });
  await taskTick(); assert.deepEqual(runtime.events, []); assert.deepEqual(runtime.bindings, []);
});

test('an old cancelled signature cannot confirm ownership or overwrite a newly completed verification', async () => {
  const signature = deferred(), started = deferred(); let signerNumber = 0, confirms = 0;
  const address = `0x${'1'.repeat(40)}`;
  const runtime = fundingRuntime({ account: { isConnected: true }, currentAddress: address, walletProvider: {}, boundAddress: '',
    binding: { status: 'unlinked', address: '' },
    requestWalletLink: async path => {
      if (path.endsWith('/challenge')) return { address, challengeId: '11111111-1111-4111-8111-111111111111', message: 'Single use ownership proof' };
      confirms++; return { linked: true, address };
    },
    BrowserProvider: class { async getSigner() { const first = ++signerNumber === 1; return {
      getAddress: async () => address, signMessage: () => { if (first) { started.resolve(); return signature.promise; } return Promise.resolve('new valid signature'); },
    }; } },
  });
  const first = runtime.scope.linkWallet(); await started.promise; runtime.scope.cancelOnramp();
  await assert.rejects(first, { name: 'AbortError' });
  await runtime.scope.linkWallet();
  signature.resolve('old cancelled signature'); await taskTick();
  assert.equal(confirms, 1); assert.equal(runtime.bindings.length, 1);
  assert.equal(runtime.bindings[0].address, address);
});

test('SPEI handoff forwards the actual MXN amount without claiming a USD valuation', async () => {
  const runtime = fundingRuntime({ open: () => assert.fail('verified wallet asked to authenticate again') });
  const result = await runtime.scope.startOnramp({ ...runtime.input, sourceCurrencyCode: 'MXN', paymentMethodType: 'SPEI', amount: 931 });
  assert.equal(result.sourceCurrencyCode, 'MXN'); assert.equal(result.minimumUsd, null);
  const url = runtime.events.find(value => value?.opened).opened;
  assert.equal(url.searchParams.get('sourceAmountLocked'), '931');
  assert.equal(url.searchParams.get('sourceCurrencyCodeLocked'), 'MXN');
  assert.equal(url.searchParams.get('paymentMethodTypeLocked'), 'SPEI');
});

test('a changed checkout reference, amount, currency or method cannot open a provider', async () => {
  for (const change of [{ checkoutReference: '11111111-1111-4111-8111-111111111111' }, { requestedAmount: 100 },
    { sourceCurrencyCode: 'MXN' }, { paymentMethodType: 'APPLE_PAY' }]) {
    const runtime = fundingRuntime({ createPersonalFundingIntent: async body => ({ checkoutReference: body.requestId,
      requestedAmount: body.amount, sourceCurrencyCode: body.sourceCurrencyCode, paymentMethodType: body.paymentMethodType,
      allowedProviders: ['SWAPPED'], ...change }) });
    await assert.rejects(runtime.scope.startOnramp(runtime.input), { message: 'wallet_funding_invalid_acknowledgement' });
    assert.deepEqual(runtime.events, []);
  }
});

test('personal start and continuation reject ineligible country, method and currency before wallet effects', async () => {
  const selections = [
    { input: { country: 'MX', sourceCurrencyCode: 'MXN', amount: 1000, paymentMethodType: 'CREDIT_DEBIT_CARD' }, code: 'wallet_funding_valuation_unavailable', category: 'valuation' },
    { input: { country: 'MX', sourceCurrencyCode: 'COP', amount: 1000, paymentMethodType: 'SPEI' }, code: 'wallet_funding_valuation_unavailable', category: 'valuation' },
    { input: { country: 'CO', amount: 100, paymentMethodType: 'CREDIT_DEBIT_CARD' }, code: 'wallet_funding_invalid_country', category: 'method' },
    { input: { country: 'MX', amount: 100, paymentMethodType: 'SKRILL' }, code: 'wallet_funding_method_unavailable', category: 'method' },
    { input: { country: 'US', amount: 100, paymentMethodType: 'NETELLER' }, code: 'wallet_funding_method_unavailable', category: 'method' },
    { input: { amount: 100, paymentMethodType: 'CREDIT_DEBIT_CARD' }, detected: 'CO', code: 'wallet_funding_invalid_country', category: 'method' },
    { input: { amount: 100, paymentMethodType: 'CREDIT_DEBIT_CARD' }, detected: 'PA', code: 'wallet_funding_invalid_country', category: 'method' },
    { input: { amount: 100, paymentMethodType: 'CREDIT_DEBIT_CARD' }, detected: '', code: 'wallet_funding_invalid_country', category: 'method' },
  ];
  for (const name of ['startOnramp', 'runOnramp']) {
    for (const selection of selections) {
      const states = [];
      const ref = () => ({ current: null });
      const onrampSelection = ref();
      const never = () => assert.fail('unvalued local fiat caused a wallet or checkout side effect');
      const scope = {
        reownFundingSelection, detectPersonalFundingCountry: () => selection.detected ?? 'US', personalFundingFailure, setOnrampState: state => states.push(state),
        onrampSelection, onrampFlow: ref(), onrampAbort: ref(), onrampIntent: ref(),
        boundAddress: `0x${'1'.repeat(40)}`, currentAddress: `0x${'1'.repeat(40)}`, walletProvider: {}, account: { isConnected: true },
        mounted: { current: true }, isAddress: () => true, sameAddress: () => true,
        openConnect: never, runOnramp: never, linkWallet: never, createPersonalFundingIntent: never,
        OnRampController: { get state() { return never(); }, setSelectedProvider: never },
        window: { open: never, location: { assign: never } },
      };
      const callback = onrampCallback(name, scope);
      await assert.rejects(callback(selection.input), { message: selection.code });
      assert.equal(states.at(-1).status, 'error');
      assert.equal(states.at(-1).error, selection.category);
      assert.equal(onrampSelection.current, null);
      if (name === 'runOnramp') {
        scope.onrampFlow.current = Promise.resolve({ opened: true });
        await assert.rejects(callback(selection.input), { message: selection.code });
      }
    }
  }
});

test('personal dollar continuation explicitly forwards its currency to the intent and locked checkout', async () => {
  const events = [];
  const address = `0x${'1'.repeat(40)}`;
  const projectId = 'a'.repeat(32);
  const requestId = 'd8a4c010-cc33-44da-a297-8b3c6440f491';
  const provider = { name: 'meld', url: `https://meldcrypto.com/?publicKey=test&externalCustomerId=${projectId}` };
  const operation = createReownFundingOperation();
  const callback = onrampCallback('runOnramp', {
    reownFundingSelection, detectPersonalFundingCountry: () => 'US', buildReownProductionOnrampUrl, personalFundingFailure, projectId,
    boundAddress: address, mounted: { current: true }, navigator: { languages: ['en-US'], language: 'en-US' },
    PERSONAL_WALLET_MINIMUM_USD: 20, PERSONAL_WALLET_ASSET: 'USDT', AbortController,
    onrampFlow: { current: null }, onrampSelection: { current: null }, onrampIntent: { current: false },
    beginOnrampOperation: () => operation, onrampOperation: { current: operation },
    OnRampController: { state: { providers: [provider], selectedProvider: provider }, setSelectedProvider() { events.push('provider'); } },
    setOnrampState() {}, setFundingRevision() {},
    createPersonalFundingIntent: async body => {
      events.push('intent'); assert.equal(body.sourceCurrencyCode, 'USD'); assert.equal(body.amount, 100);
      assert.equal(body.country, 'MX'); assert.equal(body.walletAddress, address);
      return { checkoutReference: requestId, requestedAmount: 100, paymentMethodType: 'CREDIT_DEBIT_CARD', allowedProviders: ['SWAPPED'] };
    },
    window: { open(url) { events.push('open'); const parsed = new URL(url);
      assert.equal(parsed.searchParams.get('sourceCurrencyCodeLocked'), 'USD');
      assert.equal(parsed.searchParams.get('walletAddressLocked'), address); return { opener: null }; } },
  });
  const result = await callback({ requestId, country: 'MX', sourceCurrencyCode: 'USD', amount: 100, paymentMethodType: 'CREDIT_DEBIT_CARD' });
  assert.equal(result.opened, true);
  assert.deepEqual(events, ['provider', 'intent', 'open']);
});

test("Reown creates EVM wallets, links one signed address and never replaces member authorization", () => {
  const provider = read("../components/reown/ReownProvider.jsx");
  const dashboardGate = read("../app/dashboard/layout.jsx");
  assert.match(provider, /new EthersAdapter\(\)/);
  assert.match(provider, /networks: \[polygon, mainnet\]/);
  assert.match(provider, /defaultNetwork: polygon/);
  assert.match(provider, /defaultAccountTypes: \{ eip155: "eoa" \}/);
  assert.match(provider, /email: true/);
  assert.match(provider, /socials: \["google", "apple"\]/);
  assert.match(provider, /emailShowWallets: false/);
  assert.match(provider, /analytics: false/);
  assert.match(provider, /onramp: false/);
  assert.match(provider, /allowUnsupportedChain: false/);
  assert.match(provider, /buildReownProductionOnrampUrl/);
  assert.match(provider, /createPersonalFundingIntent/);
  assert.doesNotMatch(provider, /createOnrampIntent|createOnrampQuote|getOnrampQuote/);
  assert.match(provider, /OnRampController\.setSelectedProvider/);
  assert.match(provider, /provider: "reown"/);
  assert.doesNotMatch(provider, /\/api\/member\/onramp\/session|app\.topperpay\.com|widget\.swapped\.com|Binance/i);
  assert.match(provider, /onrampIntent\.current = true/);
  assert.match(provider, /const boundReady = Boolean\(boundAddress\)/);
  assert.match(provider, /walletAddress: verifiedAddress/);
  assert.match(provider, /if \(boundReady \|\| connectionReady\) return runOnramp\(selection\)/);
  assert.match(provider, /scope\.wait\(\(\) => disconnect\(\{ namespace: "eip155" \}\)\)/);
  assert.match(provider, /error: "connection_timeout"/);
  assert.match(provider, /void runOnramp\(\)\.catch/);
  assert.match(provider, /verifyReownWalletOwnership\(scope/);
  assert.match(provider, /const confirmed = await scope\.wait\(\(\) => linkWallet\(scope\)\)/);
  assert.match(provider, /cancelOnramp/);
  assert.doesNotMatch(provider, /sendTransaction|privateKey|mnemonic/);
  assert.match(provider, /appKitThemeRef\.current\.setThemeMode/);
  assert.match(provider, /appKitThemeRef\.current\.setThemeVariables/);
  assert.doesNotMatch(provider, /\[setThemeMode, setThemeVariables\]/);
  assert.match(dashboardGate, /rawIdToken\(\{ strictAccess: true \}\)/);
  assert.match(dashboardGate, /verifyIdTokenForSession\(token\)/);
});

test("all Reown packages use the same pinned release", () => {
  const pkg = JSON.parse(read("../../package.json"));
  assert.equal(pkg.dependencies["@reown/appkit"], "1.8.24");
  assert.equal(pkg.dependencies["@reown/appkit-adapter-ethers"], "1.8.24");
  assert.equal(pkg.dependencies["@reown/appkit-controllers"], "1.8.24");
  assert.equal(pkg.dependencies["@reown/appkit-siwx"], undefined);
});

test("personal portal renders only its personal wallet and preserves native member authorization", () => {
 const sidebar=read("../components/panel/PanelSidebar.jsx");
 const card=read("../components/panel/SidebarWalletCard.jsx");
 const finance=read("../app/dashboard/_components/executive-pages/FinanceDashboardPage.jsx");
 const funding=read("../app/dashboard/_components/executive-pages/WalletFundingPanels.jsx");
 const personal=read("../app/dashboard/_components/executive-pages/PersonalWalletFundingPage.jsx");
 const retired=read("../app/dashboard/wallet-administrative/page.jsx");
 const policy=read("./personal-wallet.mjs");
 assert.match(card,/nav\.personalWallet/);assert.match(card,/\/dashboard\/wallet-personal/);
 assert.match(finance,/WalletFundingPanels/);assert.match(personal,/id="personal-wallet"/);assert.match(personal,/<PersonalFundingForm/);
 assert.doesNotMatch(sidebar,/AdministrativeWallet|wallet-administrative/);
 assert.doesNotMatch(funding,/MELD|administrative|ReownProvider|FundingForm|useState|useEffect/);
 assert.match(retired,/notFound\(\)/);assert.doesNotMatch(retired,/AdministrativeWalletFundingPage|runtimeEnvironment/);
 assert.match(personal,/reown\.startOnramp\(\{ walletAddress: reown\.linkedAddress, \.\.\.input \}\)/);
 assert.doesNotMatch(personal,/Administrative|startAdministrative|SandboxFunding/);
 assert.match(policy,/MINDBLISS_ONRAMP_FEE_BPS = 100/);assert.match(policy,/PERSONAL_WALLET_ASSET = "USDT"/);
 assert.match(policy,/PERSONAL_WALLET_MINIMUM_USD = 20/);
});

test("personal funding navigation has one destination and one neutral action label", () => {
 const overview=read("../components/panel/overview/OverviewDiscoveryCard.jsx");
 const sidebar=read("../components/panel/SidebarWalletCard.jsx");
 const funding=read("../app/dashboard/_components/executive-pages/WalletFundingPanels.jsx");
 const messages=read("../i18n/messages.js");
 assert.match(overview,/\/dashboard\/wallet-personal/);assert.match(sidebar,/nav\.addFunds/);
 assert.match(funding,/href="\/dashboard\/wallet-personal"/);
 assert.doesNotMatch(funding,/wallet-administrative|MELD|destination ===|WalletDestinationSelector|aria-pressed/);
 assert.doesNotMatch(overview,/createWallet|openConnect|Buy crypto/);
 assert.match(messages,/buyCrypto: "Recargar fondos"/);assert.match(messages,/amountLabel: "Monto a recargar"/);
});

test("AppKit is scoped to personal wallet surfaces and does not slow every dashboard route", () => {
 const shell=read("../app/dashboard/_components/DashboardShell.jsx");
 const finance=read("../app/dashboard/_components/executive-pages/FinanceDashboardPage.jsx");
 const funding=read("../app/dashboard/_components/executive-pages/WalletFundingPanels.jsx");
 const personal=read("../app/dashboard/_components/executive-pages/PersonalWalletFundingPage.jsx");
 const overview=read("../components/panel/overview/OverviewDashboard.jsx");
 assert.doesNotMatch(shell,/ReownProvider/);assert.doesNotMatch(finance,/ReownProvider/);
 assert.match(personal,/dynamic\(\(\) => import\("@\/components\/reown\/ReownProvider"\)/);
 assert.match(personal,/<ReownProvider><PersonalWalletFunding \/><\/ReownProvider>/);
 assert.doesNotMatch(funding,/ReownProvider|useReownWallet/);
 assert.doesNotMatch(read("../components/reown/ReownProvider.jsx"),/startAdministrativeOnramp|administrativeOnrampState/);
 assert.match(overview,/dynamic\(\(\) => import\("\.\/ReownRechargeDialog"\)/);
 assert.match(overview,/reownLoaded \? <ReownRechargeDialog open=\{rechargeDialog\.open\}/);
});

test("the public Reown identifier is sourced from environment configuration and never hardcoded in application code", () => {
  const provider = read("../components/reown/ReownProvider.jsx");
  const config = read("../../next.config.mjs");
  const ignore = read("../../.gitignore");
  assert.match(provider, /process\.env\.NEXT_PUBLIC_REOWN_PROJECT_ID/);
  assert.match(config, /process\.env\.REOWN_PROJECT_ID/);
  assert.match(ignore, /^\.env\.local$/m);
  assert.doesNotMatch(provider, /[a-f0-9]{32}/i);
});
