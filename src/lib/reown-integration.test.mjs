import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from 'node:vm';
import ts from 'typescript';
import { reownFundingSelection, buildReownProductionOnrampUrl } from './reown-production-onramp.mjs';
import { personalFundingFailure } from './personal-funding-errors.mjs';

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

test('personal start and continuation reject ineligible country, method and currency before wallet effects', async () => {
  const selections = [
    { input: { country: 'MX', sourceCurrencyCode: 'MXN', amount: 1000, paymentMethodType: 'SPEI' }, code: 'wallet_funding_valuation_unavailable', category: 'valuation' },
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
  const callback = onrampCallback('runOnramp', {
    reownFundingSelection, detectPersonalFundingCountry: () => 'US', buildReownProductionOnrampUrl, personalFundingFailure, projectId,
    boundAddress: address, mounted: { current: true }, navigator: { languages: ['en-US'], language: 'en-US' },
    PERSONAL_WALLET_MINIMUM_USD: 50, PERSONAL_WALLET_ASSET: 'USDT', AbortController,
    onrampFlow: { current: null }, onrampSelection: { current: null }, onrampAbort: { current: null }, onrampIntent: { current: false },
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
  assert.match(provider, /await disconnect\(\{ namespace: "eip155" \}\)/);
  assert.match(provider, /setOnrampState\(\{ status: "error", error: "connection" \}\)/);
  assert.match(provider, /void runOnramp\(\)\.catch/);
  assert.match(provider, /signMessage\(challenge\.message\)/);
  assert.match(provider, /\/api\/member\/wallet-link\/challenge/);
  assert.match(provider, /\/api\/member\/wallet-link\/confirm/);
  assert.match(provider, /const confirmed = await linkWallet\(\)/);
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

test("personal and administrative wallets remain visibly separate without loading AppKit in the global shell", () => {
  const sidebar = read("../components/panel/SidebarWalletCard.jsx");
  const finance = read("../app/dashboard/_components/executive-pages/FinanceDashboardPage.jsx");
  const funding = read("../app/dashboard/_components/executive-pages/WalletFundingPanels.jsx");
  const personal = read("../app/dashboard/_components/executive-pages/PersonalWalletFundingPage.jsx");
  const administrative = read("../app/dashboard/_components/executive-pages/AdministrativeWalletFundingPage.jsx");
  const policy = read("./personal-wallet.mjs");
  assert.match(sidebar, /nav\.personalWallet/);
  assert.match(sidebar, /\/dashboard\/wallet-personal/);
  assert.match(finance, /WalletFundingPanels/);
  assert.match(personal, /id="personal-wallet"/);
  assert.match(administrative, /id="administrative-wallet"/);
  assert.match(personal, /<PersonalFundingForm/);
  assert.match(administrative, /<AdministrativeSandboxFundingForm/);
  assert.doesNotMatch(funding, /StablecoinOnrampForm/);
  assert.match(personal, /reown\.startOnramp\(\{ walletAddress: reown\.linkedAddress, \.\.\.input \}\)/);
  assert.match(administrative, /startAdministrativeMeldOnramp\(\{ address: wallet\.address, \.\.\.input \}/);
  assert.doesNotMatch(funding, /reown\.startAdministrativeOnramp/);
  assert.match(administrative, /readAdministrativeWallet/);
  assert.match(administrative, /ensureAdministrativeWallet/);
  assert.doesNotMatch(funding, /ReownProvider|FundingForm|useState|useEffect/);
  assert.doesNotMatch(personal, /Administrative|startAdministrative|SandboxFunding/);
  assert.doesNotMatch(administrative, /Reown|PersonalFunding/);
  assert.match(policy, /MINDBLISS_ONRAMP_FEE_BPS = 100/);
  assert.match(policy, /PERSONAL_WALLET_ASSET = "USDT"/);
  assert.match(policy, /PERSONAL_WALLET_MELD_ASSET = "USDT_POLYGON"/);
  assert.match(policy, /PERSONAL_WALLET_MINIMUM_USD = 50/);
  assert.doesNotMatch(funding, /PERSONAL_WALLET_RECOMMENDED_PROVIDERS|Topper|Swapped/);
  assert.doesNotMatch(sidebar, /Binance/i);
});

test("each wallet owns an independent funding component and keeps one neutral action label", () => {
  const overview = read("../components/panel/overview/OverviewDiscoveryCard.jsx");
  const personalSidebar = read("../components/panel/SidebarWalletCard.jsx");
  const administrativeSidebar = read("../components/panel/SidebarAdministrativeWalletCard.jsx");
  const funding = read("../app/dashboard/_components/executive-pages/WalletFundingPanels.jsx");
  const messages = read("../i18n/messages.js");
  assert.match(overview, /\/dashboard\/wallet-personal/);
  assert.match(personalSidebar, /nav\.addFunds/);
  assert.match(administrativeSidebar, /nav\.addFunds/);
  assert.match(administrativeSidebar, /\/dashboard\/wallet-administrative/);
  assert.match(funding, /href="\/dashboard\/wallet-personal"/);
  assert.match(funding, /href="\/dashboard\/wallet-administrative"/);
  assert.doesNotMatch(funding, /destination ===|WalletDestinationSelector|aria-pressed/);
  assert.doesNotMatch(overview, /createWallet|openConnect|Buy crypto/);
  assert.match(messages, /buyCrypto: "Recargar fondos"/);
  assert.match(messages, /amountLabel: "Monto a recargar"/);
});

test("AppKit is scoped to wallet surfaces and does not slow every dashboard route", () => {
  const shell = read("../app/dashboard/_components/DashboardShell.jsx");
  const finance = read("../app/dashboard/_components/executive-pages/FinanceDashboardPage.jsx");
  const funding = read("../app/dashboard/_components/executive-pages/WalletFundingPanels.jsx");
  const personal = read("../app/dashboard/_components/executive-pages/PersonalWalletFundingPage.jsx");
  const administrative = read("../app/dashboard/_components/executive-pages/AdministrativeWalletFundingPage.jsx");
  const overview = read("../components/panel/overview/OverviewDashboard.jsx");
  assert.doesNotMatch(shell, /ReownProvider/);
  assert.doesNotMatch(finance, /ReownProvider/);
  assert.match(personal, /dynamic\(\(\) => import\("@\/components\/reown\/ReownProvider"\)/);
  assert.match(personal, /<ReownProvider><PersonalWalletFunding \/><\/ReownProvider>/);
  assert.doesNotMatch(funding, /ReownProvider|useReownWallet/);
  assert.doesNotMatch(administrative, /ReownProvider|useReownWallet/);
  assert.doesNotMatch(read("./administrative-onramp-client.mjs"), /Reown|OnRampController/);
  assert.doesNotMatch(read("../components/reown/ReownProvider.jsx"), /startAdministrativeOnramp|administrativeOnrampState/);
  assert.match(overview, /dynamic\(\(\) => import\("\.\/ReownRechargeDialog"\)/);
  assert.match(overview, /reownLoaded \? <ReownRechargeDialog open=\{rechargeDialog\.open\}/);
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
