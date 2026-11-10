import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const read = relative => readFileSync(new URL(relative, import.meta.url), "utf8");

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
  assert.match(provider, /onramp: true/);
  assert.match(provider, /allowUnsupportedChain: false/);
  assert.match(provider, /buildMeldOnrampUrl/);
  assert.match(provider, /createOnrampIntent/);
  assert.match(provider, /OnRampController\.setSelectedProvider/);
  assert.match(provider, /provider: "meld"/);
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
  const policy = read("./personal-wallet.mjs");
  assert.match(sidebar, /nav\.personalWallet/);
  assert.match(sidebar, /\/dashboard\/payments#personal-wallet/);
  assert.match(finance, /WalletFundingPanels/);
  assert.match(funding, /id="personal-wallet"/);
  assert.match(funding, /id="administrative-wallet"/);
  assert.equal((funding.match(/<StablecoinOnrampForm/g) || []).length, 2);
  assert.match(funding, /reown\.startOnramp\(\{ walletAddress: address, \.\.\.input \}\)/);
  assert.match(funding, /startAdministrativeMeldOnramp\(\{ address: wallet\.address, \.\.\.input \}/);
  assert.doesNotMatch(funding, /reown\.startAdministrativeOnramp/);
  assert.match(funding, /readAdministrativeWallet/);
  assert.match(funding, /ensureAdministrativeWallet/);
  assert.match(funding, /onramp\.simpleProviderNote/);
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
  assert.match(overview, /\/dashboard\/payments#personal-wallet/);
  assert.match(personalSidebar, /nav\.addFunds/);
  assert.match(administrativeSidebar, /nav\.addFunds/);
  assert.match(administrativeSidebar, /#administrative-wallet/);
  assert.match(funding, /function PersonalWalletFunding/);
  assert.match(funding, /function AdministrativeWalletFunding/);
  assert.doesNotMatch(funding, /destination ===|WalletDestinationSelector|aria-pressed/);
  assert.doesNotMatch(overview, /createWallet|openConnect|Buy crypto/);
  assert.match(messages, /buyCrypto: "Recargar fondos"/);
  assert.match(messages, /amountLabel: "Monto a recargar"/);
});

test("AppKit is scoped to wallet surfaces and does not slow every dashboard route", () => {
  const shell = read("../app/dashboard/_components/DashboardShell.jsx");
  const finance = read("../app/dashboard/_components/executive-pages/FinanceDashboardPage.jsx");
  const funding = read("../app/dashboard/_components/executive-pages/WalletFundingPanels.jsx");
  const overview = read("../components/panel/overview/OverviewDashboard.jsx");
  assert.doesNotMatch(shell, /ReownProvider/);
  assert.doesNotMatch(finance, /ReownProvider/);
  assert.match(funding, /dynamic\(\(\) => import\("@\/components\/reown\/ReownProvider"\)/);
  assert.match(funding, /<ReownProvider><PersonalWalletFunding \/><\/ReownProvider>\s*<AdministrativeWalletFunding \/>/);
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
