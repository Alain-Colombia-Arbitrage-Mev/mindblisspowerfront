import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from 'node:vm';
import ts from 'typescript';
import { reownFundingSelection, buildReownProductionOnrampUrl } from './reown-production-onramp.mjs';
import { personalFundingFailure } from './personal-funding-errors.mjs';
import { createReownFundingOperation, verifyReownWalletOwnership } from './reown-funding-operation.mjs';
import { personalWalletMetadata } from './personal-portal-origin.mjs';

const read = relative => readFileSync(new URL(relative, import.meta.url), "utf8");

function onrampCallback(name, scope) {
  scope.mounted ??= { current: true };
  scope.logoutStarted ??= { current: false };
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
    switchRequest: ref(), walletIdentityMismatch: false, walletNeedsAccountSelection: false,
    linking: ref(), connectModalSeen: ref(), appKitState: { open: false },
    PERSONAL_WALLET_MINIMUM_USD: 30, PERSONAL_WALLET_ASSET: 'USDT', DOMException,
    setBinding: value => bindings.push(value), setOnrampState: value => states.push(value),
    setVerificationError() {}, setIsLinking() {}, setFundingRevision: () => events.push('revision'),
    OnRampController: { state: { providers: [provider], selectedProvider: provider }, setSelectedProvider() {} },
    fundingRequestId: () => requestId,
    createPersonalFundingIntent: async body => ({ checkoutReference: body.requestId, requestedAmount: body.amount,
      sourceCurrencyCode: body.sourceCurrencyCode, paymentMethodType: body.paymentMethodType, allowedProviders: ['SWAPPED'],
      destinationCurrencyCode: 'USDT_POLYGON', destination: { address: body.walletAddress, asset: 'USDT', network: 'polygon', chainId: 137 } }),
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
    input: { requestId, country: 'MX', sourceCurrencyCode: 'USD', amount: 100, paymentMethodType: 'CREDIT_DEBIT_CARD' } };
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

test('company network switching first verifies the connected bound wallet before the Ethereum AppKit SDK switch', async () => {
  const address = `0x${'1'.repeat(40)}`, mainnet = Object.freeze({ id: 1, name: 'Ethereum' });
  const provider = { request() { assert.fail('network switching used a raw provider request or transaction RPC'); } };
  const cases = [{}, { account: { isConnected: false } }, { walletProvider: undefined }, { currentAddress: '' }, { boundAddress: '' },
    { currentAddress: `0x${'2'.repeat(40)}` }, { switchRequest: { current: { pending: true } } }, { walletIdentityMismatch: true },
    { mounted: { current: false } }, { logoutStarted: { current: true } }, { latestOwner: { current: 'other-owner' } }];
  for (const change of cases) {
    const events = [];
    const scope = { account: { isConnected: true }, walletProvider: provider, currentAddress: address, boundAddress: address,
      switchRequest: { current: null }, walletIdentityMismatch: false,
      ownerKey: 'synthetic-owner', latestOwner: { current: 'synthetic-owner' },
      sameAddress: (left, right) => left.toLowerCase() === right.toLowerCase(), mainnet,
      switchAppKitNetwork: async network => { assert.equal(network, mainnet); events.push('mainnet SDK switch'); }, ...change };
    const verifiedProvider = onrampCallback('getCompanyPaymentProvider', scope);
    scope.getCompanyPaymentProvider = () => { events.push('verify bound wallet'); return verifiedProvider(); };
    const callback = onrampCallback('switchCompanyPaymentNetwork', scope);
    if (Object.keys(change).length) {
      await assert.rejects(callback(), { message: 'personal_company_wallet_unavailable' });
      assert.deepEqual(events, ['verify bound wallet']);
    } else {
      await callback(1);
      assert.deepEqual(events, ['verify bound wallet', 'mainnet SDK switch']);
    }
  }
});

test('Polygon network switching uses its fixed AppKit network and rejects unsupported chains without an SDK request', async () => {
  const calls = [];
  const polygon = Object.freeze({ id: 137 });
  const scope = { getCompanyPaymentProvider: () => calls.push('verify'), mainnet: { id: 1 }, polygon,
    switchAppKitNetwork: async network => { assert.equal(network, polygon); calls.push('polygon'); } };
  const callback = onrampCallback('switchCompanyPaymentNetwork', scope);
  await callback(137); assert.deepEqual(calls, ['verify', 'polygon']);
  for (const chainId of [10, '137', null, {}, []]) {
    await assert.rejects(callback(chainId), { message: 'personal_company_chain_changed' });
  }
  assert.equal(calls.filter(value => value === 'polygon').length, 1);
});

test('one AppKit instance configures Ethereum and Solana adapters with explicitly scoped accounts', () => {
  const text = read('../components/reown/ReownProvider.jsx');
  const source = ts.createSourceFile('ReownProvider.jsx', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX);
  const calls = [];
  const visit = node => { if (ts.isCallExpression(node) && node.expression.getText(source) === 'createAppKit') calls.push(node); ts.forEachChild(node, visit); };
  visit(source); assert.equal(calls.length, 1);
  const mainnet = Object.freeze({ id: 1 }), polygon = Object.freeze({ id: 137 }), solana = Object.freeze({ id: 'mainnet-solana' });
  class EthersAdapter {} class SolanaAdapter {}
  const config = vm.runInNewContext(`(${calls[0].arguments[0].getText(source)})`, {
    EthersAdapter, SolanaAdapter, mainnet, polygon, solana, projectId: 'a'.repeat(32), initialWalletTheme: 'light', themeVariables: () => ({}),
    walletMetadata: personalWalletMetadata('https://app.mindblisspower.com'),
  });
  assert.equal(config.adapters.length, 2); assert.ok(config.adapters[0] instanceof EthersAdapter); assert.ok(config.adapters[1] instanceof SolanaAdapter);
  assert.equal(config.networks.length, 3); assert.equal(config.networks[0], mainnet); assert.equal(config.networks[1], polygon); assert.equal(config.networks[2], solana);
  assert.equal(config.defaultNetwork, polygon); assert.equal(config.defaultAccountTypes.eip155, 'eoa'); assert.equal(config.defaultAccountTypes.solana, 'eoa');
  const rootMetadata = personalWalletMetadata('https://mindblisspower.com');
  const rootConfig = vm.runInNewContext(`(${calls[0].arguments[0].getText(source)})`, {
    EthersAdapter, SolanaAdapter, mainnet, polygon, solana, projectId: 'a'.repeat(32), initialWalletTheme: 'light', themeVariables: () => ({}),
    walletMetadata: rootMetadata,
  });
  assert.equal(rootConfig.metadata, rootMetadata); assert.equal(rootConfig.metadata.url, 'https://mindblisspower.com');
  assert.equal(config.metadata.url, 'https://app.mindblisspower.com');
  assert.match(text, /useAppKitAccount\(\{ namespace: "solana" \}\)/); assert.match(text, /useAppKitProvider\("solana"\)/);
  assert.match(text, /solana: solanaWallet/);
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
  intent.resolve({ checkoutReference: runtime.requestId, requestedAmount: 100, sourceCurrencyCode: 'USD',
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

test('ownership callbacks refuse a mismatched, unselected or switching wallet before challenge, signer or provider access', async () => {
  for (const [guard, message] of [
    [{ walletIdentityMismatch: true }, 'wallet_address_mismatch'],
    [{ walletNeedsAccountSelection: true }, 'wallet_address_mismatch'],
    [{ switchRequest: { current: { pending: true } } }, 'wallet_not_connected'],
  ]) {
    let challengeCalls = 0, signerCalls = 0;
    const runtime = fundingRuntime({ account: { isConnected: true }, currentAddress: `0x${'1'.repeat(40)}`,
      walletProvider: { request() { assert.fail('Guarded wallet reached its provider'); } },
      boundAddress: '', binding: { status: 'unlinked', address: '' }, ...guard,
      requestWalletLink: async () => { challengeCalls++; assert.fail('Guarded wallet requested an ownership challenge'); },
      BrowserProvider: class { constructor() { signerCalls++; assert.fail('Guarded wallet reached its signer'); } },
    });
    await assert.rejects(runtime.scope.linkWallet(), { message });
    assert.equal(challengeCalls, 0); assert.equal(signerCalls, 0);
    assert.deepEqual(runtime.bindings, []); assert.deepEqual(runtime.events, []);
    assert.equal(runtime.scope.linking.current, null); assert.equal(runtime.scope.onrampOperation.current, null);
  }
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
  for (const change of [{ checkoutReference: '11111111-1111-4111-8111-111111111111' }, { requestedAmount: 101 },
    { sourceCurrencyCode: 'MXN' }, { paymentMethodType: 'APPLE_PAY' }, { destinationCurrencyCode: 'USDT' },
    { destination: { address: `0x${'2'.repeat(40)}`, asset: 'USDT', network: 'polygon', chainId: 137 } },
    { destination: { address: `0x${'1'.repeat(40)}`, asset: 'USDT', network: 'ethereum', chainId: 1 } }]) {
    const runtime = fundingRuntime({ createPersonalFundingIntent: async body => ({ checkoutReference: body.requestId,
      requestedAmount: body.amount, sourceCurrencyCode: body.sourceCurrencyCode, paymentMethodType: body.paymentMethodType,
      destinationCurrencyCode: 'USDT_POLYGON', destination: { address: body.walletAddress, asset: 'USDT', network: 'polygon', chainId: 137 },
      allowedProviders: ['SWAPPED'], ...change }) });
    await assert.rejects(runtime.scope.startOnramp(runtime.input), { message: 'wallet_funding_invalid_acknowledgement' });
    assert.deepEqual(runtime.events, []);
  }
});

test('personal start and continuation reject ineligible country, method and currency before wallet effects', async () => {
  const selections = [
    { input: { country: 'MX', sourceCurrencyCode: 'MXN', amount: 1000, paymentMethodType: 'CREDIT_DEBIT_CARD' }, code: 'wallet_funding_valuation_unavailable', category: 'valuation' },
    { input: { country: 'MX', sourceCurrencyCode: 'COP', amount: 1000, paymentMethodType: 'SPEI' }, code: 'wallet_funding_valuation_unavailable', category: 'valuation' },
    { input: { country: 'CA', amount: 100, paymentMethodType: 'CREDIT_DEBIT_CARD' }, code: 'wallet_funding_invalid_country', category: 'method' },
    { input: { country: 'MX', amount: 100, paymentMethodType: 'SKRILL' }, code: 'wallet_funding_method_unavailable', category: 'method' },
    { input: { country: 'US', amount: 100, paymentMethodType: 'NETELLER' }, code: 'wallet_funding_method_unavailable', category: 'method' },
    { input: { amount: 100, paymentMethodType: 'CREDIT_DEBIT_CARD' }, detected: 'CA', code: 'wallet_funding_invalid_country', category: 'method' },
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
    sameAddress: (left, right) => typeof left === 'string' && typeof right === 'string' && left.toLowerCase() === right.toLowerCase(),
    boundAddress: address, mounted: { current: true }, navigator: { languages: ['en-US'], language: 'en-US' },
    PERSONAL_WALLET_MINIMUM_USD: 30, PERSONAL_WALLET_ASSET: 'USDT', AbortController,
    onrampFlow: { current: null }, onrampSelection: { current: null }, onrampIntent: { current: false },
    beginOnrampOperation: () => operation, onrampOperation: { current: operation },
    OnRampController: { state: { providers: [provider], selectedProvider: provider }, setSelectedProvider() { events.push('provider'); } },
    setOnrampState() {}, setFundingRevision() {},
    createPersonalFundingIntent: async body => {
      events.push('intent'); assert.equal(body.sourceCurrencyCode, 'USD'); assert.equal(body.amount, 100);
      assert.equal(body.country, 'MX'); assert.equal(body.walletAddress, address);
      return { checkoutReference: requestId, requestedAmount: 100, paymentMethodType: 'CREDIT_DEBIT_CARD', allowedProviders: ['SWAPPED'],
        destinationCurrencyCode: 'USDT_POLYGON', destination: { address: body.walletAddress, asset: 'USDT', network: 'polygon', chainId: 137 } };
    },
    window: { open(url) { events.push('open'); const parsed = new URL(url);
      assert.equal(parsed.searchParams.get('sourceCurrencyCodeLocked'), 'USD');
      assert.equal(parsed.searchParams.get('walletAddressLocked'), address); return { opener: null }; } },
  });
  const result = await callback({ requestId, country: 'MX', sourceCurrencyCode: 'USD', amount: 100, paymentMethodType: 'CREDIT_DEBIT_CARD' });
  assert.equal(result.opened, true);
  assert.deepEqual(events, ['provider', 'intent', 'open']);
});

test("Reown creates separate EVM and Solana wallets while retaining native member authorization", () => {
  const provider = read("../components/reown/ReownProvider.jsx");
  const dashboardGate = read("../app/dashboard/layout.jsx");
  assert.match(provider, /new EthersAdapter\(\)/);
  assert.match(provider, /networks: \[mainnet, polygon, solana\]/);
  assert.match(provider, /defaultNetwork: polygon/);
  assert.match(provider, /defaultAccountTypes: \{ eip155: "eoa", solana: "eoa" \}/);
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
  assert.equal(pkg.dependencies["@reown/appkit-adapter-solana"], "1.8.24");
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
 assert.match(policy,/PERSONAL_WALLET_MINIMUM_USD = 30/);
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

test("AppKit loads lazily once and its dashboard provider persists across personal-wallet route changes", () => {
 const shell=read("../app/dashboard/_components/DashboardShell.jsx");
 const finance=read("../app/dashboard/_components/executive-pages/FinanceDashboardPage.jsx");
 const funding=read("../app/dashboard/_components/executive-pages/WalletFundingPanels.jsx");
 const personal=read("../app/dashboard/_components/executive-pages/PersonalWalletFundingPage.jsx");
 const payments=read("../app/dashboard/_components/executive-pages/CompanyPaymentPage.jsx");
 const persistent=read("../components/reown/DashboardWalletProvider.jsx");
 const overview=read("../components/panel/overview/OverviewDashboard.jsx");
 assert.doesNotMatch(shell,/ReownProvider/);assert.doesNotMatch(finance,/ReownProvider/);
 assert.match(shell,/DashboardWalletProvider/);
 assert.match(persistent,/dynamic\(\(\) => import\("\.\/ReownProvider"\)/);
 assert.doesNotMatch(personal,/ReownProvider/);assert.doesNotMatch(payments,/ReownProvider/);
 assert.match(personal,/<PersonalWalletFunding \/>/);
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
