import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { translateMessage } from "../i18n/translate.mjs";
import * as paymentValues from './personal-company-payment-values.mjs';

const require = createRequire(import.meta.url);
const icon = () => React.createElement("svg", { "aria-hidden": true });
const Link = ({ children, prefetch: _prefetch, ...props }) => React.createElement("a", props, children);
const marker = name => () => React.createElement("p", { "data-test": name }, name);
function moduleAt(relative, mocks = {}) {
  const source = readFileSync(new URL(relative, import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", code)(id => id === "lucide-react" ? new Proxy({}, { get: () => icon })
    : id === "next/link" ? { default: Link }
    : id === "@/i18n/LanguageProvider" ? { useI18n: () => ({ locale: "es", dir: "ltr", t: (key, values) => translateMessage("es", key, values) }) }
    : id === "@/i18n/LanguageSwitcher" ? { default: marker("LanguageSwitcher") }
    : id === "@/i18n/LocalizedText" ? { default: ({ as = "span", id: messageId, htmlId, values, ...props }) => React.createElement(as, { id: htmlId, ...props }, translateMessage("es", messageId, values)) }
    : Object.hasOwn(mocks, id) ? mocks[id] : require(id), module, module.exports);
  return module.exports;
}
const render = element => renderToStaticMarkup(element);
const plan = (id = 1, amount_usd = "100.00", name = "Plan original") => ({ id, name, amount_usd, pv: 999, type: "private-legacy-type" });
function overviewPlans(getCatalog) {
  return moduleAt("../components/panel/overview/OverviewPlans.jsx", { "@/lib/catalog": { getPackageCatalog: getCatalog } });
}

test("overview renders catalogue reference prices once and links to payment without promising plan selection", async () => {
  let calls = 0;
  const packages = Array.from({ length: 13 }, (_, index) => plan(index + 1, `${(index + 1) * 100}.01`, `  Plan ${index + 1}  `));
  const { default: Plans } = overviewPlans(async () => { calls++; return { packages, ranks: [{ secret: "not-for-summary" }] }; });
  const element = await Plans();
  const html = render(element);
  assert.equal(calls, 1);
  assert.match(html, /Planes de membresía/);
  assert.equal((html.match(/<article/g) || []).length, 13);
  assert.equal((html.match(/href="\/dashboard\/packages"/g) || []).length, 13);
  for (let index = 0; index < packages.length; index++) {
    assert.ok(html.includes(`<span>${translateMessage("es", "companyPayment.title")}</span>`));
    assert.ok(html.includes(`>${packages[index].name.trim()}</h3>`));
    assert.ok(html.includes(`$${((index + 1) * 100).toLocaleString("en-US")}.01 USD`));
  }
  assert.doesNotMatch(html, /private-legacy-type|not-for-summary|\bPV\b|ROI|Recomendado|Ver plan|Comprar plan|Activar|\?plan=|#plan-/);
  const section = element.props.children;
  const cards = React.Children.toArray(section.props.children);
  assert.ok(cards.every(card => React.Children.toArray(card.props.children).at(-1).props.prefetch === false));
});

test("overview USD rendering preserves cents and large decimal strings without float rounding", async () => {
  const { default: Plans } = overviewPlans(async () => ({ packages: [plan(1, "0.01"), plan(2, 100.1), plan(3, "999999999999.99")] }));
  const html = render(await Plans());
  assert.match(html, /\$0\.01 USD/);
  assert.match(html, /\$100\.10 USD/);
  assert.match(html, /\$999,999,999,999\.99 USD/);
});

test("overview escapes catalog names, ignores unneeded fields and never accepts a catalog-controlled destination", async () => {
  const { default: Plans } = overviewPlans(async () => ({ packages: [{ ...plan(17, "3500.35", "  <script>unsafe</script>  "), href: "https://outside.invalid", token: "not-visible", email: "private@example.test" }] }));
  const html = render(await Plans());
  assert.match(html, /&lt;script&gt;unsafe&lt;\/script&gt;/);
  assert.match(html, /href="\/dashboard\/packages"/);
  assert.doesNotMatch(html, /\?plan=|#plan-/);
  assert.doesNotMatch(html, /<script>|outside\.invalid|not-visible|private@example/);
});

test("overview loading, empty catalog and failures remain honest without invented prices or error details", async () => {
  const loading = overviewPlans(async () => ({ packages: [] }));
  const loadingHtml = render(React.createElement(loading.OverviewPlansLoading));
  assert.match(loadingHtml, /role="status"/);
  assert.match(loadingHtml, /aria-busy="true"/);
  assert.match(loadingHtml, /Cargando planes/);
  const empty = render(await loading.default());
  assert.match(empty, /No hay planes de membresía publicados/);
  assert.doesNotMatch(empty, /<article|\$0/);
  const { default: Failed } = overviewPlans(async () => { throw new Error("postgres://synthetic-user:SYNTHETIC-SECRET@private.invalid"); });
  const failed = render(await Failed());
  assert.match(failed, /No se pudieron consultar los planes/);
  assert.match(failed, /href="\/dashboard\/packages"/);
  assert.doesNotMatch(failed, /postgres|SYNTHETIC|private\.invalid|\$0|<article/);
});

test("overview rejects malformed catalog rows and duplicate IDs instead of publishing partial or zero-dollar offers", async () => {
  const invalid = [
    undefined, null, {}, [null],
    [plan(0)], [plan(-1)], [plan("1/../../outside")], [plan("9007199254740992")],
    [plan(1, "")], [plan(1, "0.00")], [plan(1, -1)], [plan(1, false)], [plan(1, null)],
    [plan(1, Infinity)], [plan(1, "1.001")], [plan(1, "1e3")], [plan(1, " 100.00 ")],
    [plan(1, "90071992547409.92")], [plan(1, "100", " ")], [plan(1, "100", {})],
    [plan(1, "100", "Name\nHidden")], [plan(1, "100", "x".repeat(161))],
    [plan(1), plan(1)], [plan(1), null],
  ];
  for (const packages of invalid) {
    const { default: Plans } = overviewPlans(async () => ({ packages }));
    const html = render(await Plans());
    assert.match(html, /No se pudieron consultar los planes/);
    assert.doesNotMatch(html, /<article|\$0/);
  }
});

test("the canonical summary route renders the Pen overview and the legacy home route redirects to it", () => {
  const Overview = () => null;
  const { default: Page } = moduleAt("../app/dashboard/page.jsx", {
    "@/components/panel/overview/OverviewDashboard": { default: Overview },
  });
  assert.equal(Page().type, Overview);
  assert.equal(Object.keys(Page().props).length, 0);
  const destinations = [];
  const { default: Home } = moduleAt("../app/dashboard/home/page.jsx", {
    "next/navigation": { redirect: destination => destinations.push(destination) },
  });
  Home();
  assert.deepEqual(destinations, ["/dashboard"]);
  const source = readFileSync(new URL("../components/panel/overview/OverviewPlans.jsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /["']use client["']|useEffect|setInterval|\bfetch\s*\(|runtimeEnvironment|process\.env/);
});

test("actual summary follows the Pen bento and omits the retired long-form sections", () => {
  const react = { ...React, useState: initial => [initial, () => {}], useRef: () => ({ current: null }), useCallback: callback => callback, useEffect: () => {} };
  const mocks = { react,
    "next/dynamic": { default: () => marker("ReownRechargeDialog") },
    "@/app/_components/ThemeToggle": { default: marker("ThemeToggle") },
    "@/lib/member-read.mjs": { readMemberParts: () => { throw new Error("Unexpected request"); }, validMemberTree: () => true, validMemberSummary: () => true },
    "@/hooks/usePersonalWalletBalance": { usePersonalWalletBalance: () => ({ loading: true, error: '', walletAddress: '', balanceAtomic: null }) },
    "@/lib/personal-company-payment-values.mjs": paymentValues,
    "@/components/wallet/PersonalWalletBalances": { default: marker('PersonalWalletBalances') },
  };
  for (const name of ["EarningsCard", "OverviewDiscoveryCard", "PositionSnapshotCard"]) mocks[`./${name}`] = { default: marker(name) };
  const { default: Dashboard } = moduleAt("../components/panel/overview/OverviewDashboard.jsx", mocks);
  const html = render(React.createElement(Dashboard));
  assert.match(html, /Tu espacio Mindbliss/);
  assert.match(html, /Tu wallet, tus compras de cripto y tus membresías/);
  assert.match(html, /OverviewDiscoveryCard/);
  assert.doesNotMatch(html, /ReownRechargeDialog/);
  assert.match(html, /Mis membresías/);
  assert.match(html, /Accesos rápidos/);
  assert.match(html, /Abre Soporte para elegir un canal/);
  assert.doesNotMatch(html, /plans-slot|RecentSignupsCard|TopRanksCard|NOWPaymentsBalances|Centro de soporte/);
});

test("the memberships entry mounts one personal company-payment flow and preserves independent provider-return verification", () => {
  const Company = marker("Personal company payment");
  const ReturnModal = marker("Independent provider return");
  const Provider = ({ children }) => children;
  const { default: Packages, dynamic } = moduleAt("../app/dashboard/packages/page.jsx", {
    "../_components/executive-pages/CompanyPaymentPage": { default: Company },
    "./PaymentResultModal": { default: ReturnModal },
    "@/hooks/useMemberSummary": { MemberSummaryProvider: Provider },
  });
  const element = Packages();
  assert.equal(dynamic, "force-dynamic");
  assert.equal(element.type, Provider);
  assert.equal(element.props.fresh, true);
  const children = React.Children.toArray(element.props.children);
  assert.equal(children.length, 2);
  assert.equal(children[0].type, React.Suspense);
  assert.equal(children[0].props.fallback, null);
  assert.equal(children[0].props.children.type, ReturnModal);
  assert.equal(children[1].type, Company);
  assert.deepEqual(children[1].props, {});
  const html = render(element);
  assert.equal((html.match(/data-test="Personal company payment"/g) || []).length, 1);
  assert.equal((html.match(/data-test="Independent provider return"/g) || []).length, 1);
  assert.doesNotMatch(html, /data-selected-plan|id="plan-|Existing checkout|Activar/);
});

test("the real active-membership gate reveals a validated selected card while its toggle stays functional", () => {
  let showPlans;
  const state = { loading: false, error: "", data: { active_packages: 1 } };
  const { default: Gate } = moduleAt("../app/dashboard/packages/PaywallGate.jsx", {
    react: { ...React, useState: initial => {
      if (showPlans === undefined) showPlans = initial;
      return [showPlans, value => { showPlans = typeof value === "function" ? value(showPlans) : value; }];
    } },
    "@/hooks/useMemberSummary": { useMemberSummary: () => ({ state }) },
  });
  const props = { children: React.createElement("p", {}, "Selected catalog card"), initialShowPlans: true };
  let element = Gate(props);
  let html = render(element);
  assert.match(html, /Selected catalog card/);
  assert.match(html, /Tu membresía está activa/);
  assert.match(html, /Ocultar planes/);
  const toggle = element.props.children[1].props.children;
  toggle.props.onClick();
  html = render(Gate(props));
  assert.match(html, /<div hidden=""[^>]*><p>Selected catalog card<\/p><\/div>/);
  assert.equal(Gate(props).props.children[2].props.children, props.children, 'hiding the catalog must not unmount its purchase intents');
  assert.match(html, /Comprar otra membresía/);
  for (const initialShowPlans of [false, "true", 1, undefined]) {
    showPlans = undefined;
    assert.match(render(Gate({ ...props, initialShowPlans })), /<div hidden=""[^>]*><p>Selected catalog card<\/p><\/div>/);
  }
  state.data = { active_packages: 0 };
  showPlans = undefined;
  html = render(Gate(props));
  assert.match(html, /Selected catalog card/);
  assert.doesNotMatch(html, /Tu membresía está activa/);
});

function companyMembershipEntry({ Company = marker("Personal company payment"), ReturnModal = marker("Independent provider return"), catalog = async () => assert.fail("removed catalogue queried") } = {}) {
  return moduleAt("../app/dashboard/packages/page.jsx", {
    "../_components/executive-pages/CompanyPaymentPage": { default: Company },
    "./PaymentResultModal": { default: ReturnModal },
    "@/hooks/useMemberSummary": { MemberSummaryProvider: ({ children }) => children },
    "@/lib/catalog": { getCatalog: catalog, getPackageCatalog: catalog },
    "@/lib/membership-price-quote.mjs": { membershipPriceQuote: () => assert.fail("removed quote calculated") },
    "./ActivatePackageButton": { default: () => assert.fail("removed checkout mounted") },
    "./PaywallGate": { default: () => assert.fail("removed catalogue paywall mounted") },
  }).default;
}

test("legacy plan, amount and paid URL selectors cannot preselect, price or activate the company-payment flow", () => {
  const companyProps = [], returnProps = [];
  const Packages = companyMembershipEntry({
    Company: props => { companyProps.push(props); return React.createElement("p", {}, "Personal company payment"); },
    ReturnModal: props => { returnProps.push(props); return React.createElement("p", {}, "Independent provider return"); },
  });
  for (const value of ["7", "999", "007", "-7", "7/../../outside", ["7", "7"], true, "", undefined]) {
    const html = render(Packages({ searchParams: Promise.resolve({ plan: value, paid: "1", activated: "true", amount: "0", commission: "1" }) }));
    assert.match(html, /Personal company payment/);
    assert.match(html, /Independent provider return/);
    assert.deepEqual(companyProps.at(-1), {});
    assert.deepEqual(returnProps.at(-1), {});
    assert.doesNotMatch(html, /data-selected-plan|id="plan-|Total a pagar|Precio del plan|Comisión|Activar|\$0/);
  }
});

test("unavailable or malformed catalogue prices are never fetched or turned into checkout cards on the company-payment entry", () => {
  let catalogCalls = 0;
  for (const amount of [undefined, null, "", "0.00", "1.001", "1e3", "90071992547409.92", "<script>invalid</script>"]) {
    const Packages = companyMembershipEntry({ catalog: async () => { catalogCalls++; return { packages: [{ ...plan(7), amount_usd: amount }], ranks: [] }; } });
    const html = render(Packages());
    assert.match(html, /Personal company payment/);
    assert.doesNotMatch(html, /<article|Existing checkout|Total a pagar|Precio del plan|\$0\.00|NaN|Infinity|<script>/);
  }
  assert.equal(catalogCalls, 0);
  const source = readFileSync(new URL("../app/dashboard/packages/page.jsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /getCatalog|getPackageCatalog|membershipPriceQuote|ActivatePackageButton|PaywallGate|selectedPackage|plan-/);
});
