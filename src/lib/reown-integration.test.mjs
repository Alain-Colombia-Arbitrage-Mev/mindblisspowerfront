import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const read = relative => readFileSync(new URL(relative, import.meta.url), "utf8");

test("Reown creates EVM wallets, links one signed address and never replaces member authorization", () => {
  const provider = read("../components/reown/ReownProvider.jsx");
  const dashboardGate = read("../app/dashboard/layout.jsx");
  assert.match(provider, /new EthersAdapter\(\)/);
  assert.match(provider, /networks: \[mainnet\]/);
  assert.match(provider, /defaultAccountTypes: \{ eip155: "eoa" \}/);
  assert.match(provider, /email: true/);
  assert.match(provider, /socials: \["google", "apple"\]/);
  assert.match(provider, /emailShowWallets: false/);
  assert.match(provider, /analytics: false/);
  assert.match(provider, /onramp: true/);
  assert.match(provider, /allowUnsupportedChain: false/);
  assert.match(provider, /view: "OnRampProviders"/);
  assert.match(provider, /onrampIntent\.current = true/);
  assert.match(provider, /void runOnramp\(\)\.catch/);
  assert.match(provider, /signMessage\(challenge\.message\)/);
  assert.match(provider, /\/api\/member\/wallet-link\/challenge/);
  assert.match(provider, /\/api\/member\/wallet-link\/confirm/);
  assert.match(provider, /if \(!isLinked\) await linkWallet\(\)/);
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
  assert.equal(pkg.dependencies["@reown/appkit-siwx"], undefined);
});

test("AppKit is scoped to wallet surfaces and does not slow every dashboard route", () => {
  const shell = read("../app/dashboard/_components/DashboardShell.jsx");
  const finance = read("../app/dashboard/_components/executive-pages/FinanceDashboardPage.jsx");
  const overview = read("../components/panel/overview/OverviewDashboard.jsx");
  assert.doesNotMatch(shell, /ReownProvider/);
  assert.match(finance, /dynamic\(\(\) => import\("@\/components\/reown\/ReownProvider"\)/);
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
