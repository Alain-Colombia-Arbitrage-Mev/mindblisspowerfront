import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { membershipPriceQuote } from "./membership-price-quote.mjs";

const require = createRequire(import.meta.url);
const icon = () => React.createElement("svg", { "aria-hidden": true });
const Link = ({ children, prefetch: _prefetch, ...props }) => React.createElement("a", props, children);
const marker = name => () => React.createElement("p", { "data-test": name }, name);
function moduleAt(relative, mocks = {}) {
  const source = readFileSync(new URL(relative, import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", code)(id => id === "lucide-react" ? new Proxy({}, { get: () => icon })
    : id === "next/link" ? { default: Link } : Object.hasOwn(mocks, id) ? mocks[id] : require(id), module, module.exports);
  return module.exports;
}
const render = element => renderToStaticMarkup(element);
const plan = (id = 1, amount_usd = "100.00", name = "Plan original") => ({ id, name, amount_usd, pv: 999, type: "private-legacy-type" });
function overviewPlans(getCatalog) {
  return moduleAt("../components/panel/overview/OverviewPlans.jsx", { "@/lib/catalog": { getCatalog } });
}

test("overview renders all catalog plans once on the server, keeping exact USD prices and safe plan links", async () => {
  let calls = 0;
  const packages = Array.from({ length: 13 }, (_, index) => plan(index + 1, `${(index + 1) * 100}.01`, `  Plan ${index + 1}  `));
  const { default: Plans } = overviewPlans(async () => { calls++; return { packages, ranks: [{ secret: "not-for-summary" }] }; });
  const element = await Plans();
  const html = render(element);
  assert.equal(calls, 1);
  assert.match(html, /Planes de membresía/);
  assert.equal((html.match(/<article/g) || []).length, 13);
  for (let index = 0; index < packages.length; index++) {
    assert.ok(html.includes(`href="/dashboard/packages?plan=${index + 1}#plan-${index + 1}"`));
    assert.ok(html.includes(`aria-label="Comprar plan ${packages[index].name.trim()}"`));
    assert.ok(html.includes(`>${packages[index].name.trim()}</h3>`));
    assert.ok(html.includes(`$${((index + 1) * 100).toLocaleString("en-US")}.01 USD`));
  }
  assert.doesNotMatch(html, /private-legacy-type|not-for-summary|\bPV\b|ROI|Recomendado|Ver plan|Activar/);
  const section = element.props.children;
  assert.equal(section.props.children[0].props.children[2].props.prefetch, false);
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
  assert.match(html, /href="\/dashboard\/packages\?plan=17#plan-17"/);
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

test("both summary routes stream the server catalog slot without adding a catalog client request", () => {
  const Overview = () => null;
  const Plans = () => null;
  const Loading = () => null;
  for (const route of ["../app/dashboard/page.jsx", "../app/dashboard/home/page.jsx"]) {
    const { default: Page } = moduleAt(route, {
      "@/components/panel/overview/OverviewDashboard": { default: Overview },
      "@/components/panel/overview/OverviewPlans": { default: Plans, OverviewPlansLoading: Loading },
    });
    const page = Page();
    assert.equal(page.type, Overview);
    assert.equal(page.props.plans.type, React.Suspense);
    assert.equal(page.props.plans.props.children.type, Plans);
    assert.equal(page.props.plans.props.fallback.type, Loading);
  }
  const source = readFileSync(new URL("../components/panel/overview/OverviewPlans.jsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /["']use client["']|useEffect|setInterval|\bfetch\s*\(|runtimeEnvironment|process\.env/);
});

test("actual summary places the plans slot after the referral and before secondary support", () => {
  const react = { ...React, useState: initial => [initial, () => {}], useRef: () => ({ current: null }), useCallback: callback => callback, useEffect: () => {} };
  const mocks = { react,
    "@/components/panel/PanelFooter": { default: marker("footer") },
    "@/lib/member-read.mjs": { readMemberParts: () => { throw new Error("Unexpected request"); }, validMemberTree: () => true, validMemberSummary: () => true },
    "@/lib/payment-display.mjs": { formatPaymentMoney: () => "not-called" },
  };
  for (const name of ["EarningsCard", "ReferralLinkCard", "PositionSnapshotCard", "RecentSignupsCard", "ShortcutPill", "TopRanksCard"]) mocks[`./${name}`] = { default: marker(name) };
  const { default: Dashboard } = moduleAt("../components/panel/overview/OverviewDashboard.jsx", mocks);
  const html = render(React.createElement(Dashboard, { plans: React.createElement("p", { "data-test": "plans-slot" }, "planes") }));
  assert.ok(html.indexOf("ReferralLinkCard") < html.indexOf("plans-slot"));
  assert.ok(html.indexOf("plans-slot") < html.indexOf("Centro de soporte"));
});

test("the existing memberships page exposes matching plan anchors without changing checkout controls", async () => {
  const children = ({ children: content }) => content;
  const gateProps = [];
  const { default: Packages } = moduleAt("../app/dashboard/packages/page.jsx", {
    "@/lib/catalog": { getCatalog: async () => ({ packages: [plan(7)], ranks: [] }) },
    "@/lib/cloudflare-runtime.mjs": { runtimeEnvironment: () => ({}) },
    "@/lib/checkout-policy.mjs": { stripeCheckoutEnabled: () => false, nowpaymentsMembershipsEnabled: () => false },
    "@/lib/membership-price-quote.mjs": { membershipPriceQuote },
    "./ActivatePackageButton": { default: props => React.createElement("button", { "data-stripe": props.stripeEnabled, "data-nowpayments": props.nowpaymentsEnabled }, "Existing checkout") },
    "./MyPaymentsPanel": { default: () => null }, "./PaymentResultModal": { default: () => null },
    "./PaywallGate": { default: props => { gateProps.push(props); return props.children; } }, "@/hooks/useMemberSummary": { MemberSummaryProvider: children },
  });
  const html = render(await Packages());
  assert.match(html, /id="plan-7"/);
  assert.match(html, /scroll-mt-24/);
  assert.match(html, /data-stripe="false"/);
  assert.match(html, /data-nowpayments="false"/);
  assert.equal(gateProps.at(-1).initialShowPlans, false);
  for (const value of ["7", "999", "007", "-7", "7/../../outside", ["7", "7"], true, "", undefined]) {
    const page = await Packages({ searchParams: Promise.resolve({ plan: value, paid: "1", activated: "true" }) });
    const html = render(page);
    assert.equal(gateProps.at(-1).initialShowPlans, value === "7");
    assert.match(html, /data-stripe="false"/);
    assert.match(html, /data-nowpayments="false"/);
  }
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
  assert.doesNotMatch(html, /Selected catalog card/);
  assert.match(html, /Ver otros planes/);
  for (const initialShowPlans of [false, "true", 1, undefined]) {
    showPlans = undefined;
    assert.doesNotMatch(render(Gate({ ...props, initialShowPlans })), /Selected catalog card/);
  }
  state.data = { active_packages: 0 };
  showPlans = undefined;
  html = render(Gate(props));
  assert.match(html, /Selected catalog card/);
  assert.doesNotMatch(html, /Tu membresía está activa/);
});

function membershipsWithQuotes(packages, checkoutProps) {
  const children = ({ children: content }) => content;
  return moduleAt("../app/dashboard/packages/page.jsx", {
    "@/lib/catalog": { getCatalog: async () => ({ packages, ranks: [] }) },
    "@/lib/cloudflare-runtime.mjs": { runtimeEnvironment: () => ({}) },
    "@/lib/checkout-policy.mjs": { stripeCheckoutEnabled: () => false, nowpaymentsMembershipsEnabled: () => false },
    "@/lib/membership-price-quote.mjs": { membershipPriceQuote },
    "./ActivatePackageButton": { default: props => { checkoutProps.push(props); return React.createElement("button", {}, "Existing checkout"); } },
    "./MyPaymentsPanel": { default: () => null }, "./PaymentResultModal": { default: () => null },
    "./PaywallGate": { default: children }, "@/hooks/useMemberSummary": { MemberSummaryProvider: children },
  }).default;
}

test("memberships disclose the included one percent cost and unchanged payable total before checkout", async () => {
  const checkoutProps = [];
  const Packages = membershipsWithQuotes([plan(1, "100.00"), plan(2, "250.00"), plan(3, "100000.00"), plan(4, "0.50")], checkoutProps);
  const html = render(await Packages());
  const cards = html.match(/<article\b[\s\S]*?<\/article>/g);
  assert.equal(cards.length, 4);
  for (const [index, fee, commissionBase, total] of [
    [0, "$1.00 USD", "$99.00 USD", "$100.00 USD"],
    [1, "$2.50 USD", "$247.50 USD", "$250.00 USD"],
    [2, "$1,000.00 USD", "$99,000.00 USD", "$100,000.00 USD"],
    [3, "$0.005 USD", "$0.495 USD", "$0.50 USD"],
  ]) {
    const card = cards[index];
    assert.ok(card.includes(`<dt>Precio del plan</dt><dd class="font-semibold">${total}</dd>`));
    assert.ok(card.includes(`<dt>Comisión de procesamiento (1%, incluida)</dt><dd class="font-semibold">${fee}</dd>`));
    assert.ok(card.includes(`<dt>Base para cálculo de comisiones (99%)</dt><dd class="font-semibold">${commissionBase}</dd>`));
    assert.ok(card.includes(`<dt>Total a pagar</dt><dd>${total}</dd>`));
    assert.match(card, /La comisión está incluida; no se suma al precio\./);
    assert.ok(card.indexOf("Total a pagar") < card.indexOf("Existing checkout"));
    assert.doesNotMatch(card, /recargo|activación \(1%\)|\$101\.00|\$252\.50|\$101,000\.00/);
  }
  assert.equal(checkoutProps.length, 4);
  for (const props of checkoutProps) {
    assert.deepEqual(Object.keys(props).sort(), ["featured", "nowpaymentsEnabled", "packageId", "stripeEnabled"]);
    assert.equal(props.stripeEnabled, false);
    assert.equal(props.nowpaymentsEnabled, false);
  }
});

test("invalid membership prices never render a payable zero or checkout control", async () => {
  for (const amount of [undefined, null, "", "0.00", "1.001", "1e3", "90071992547409.92", "<script>invalid</script>"]) {
    const checkoutProps = [];
    const Packages = membershipsWithQuotes([{ ...plan(7), amount_usd: amount }], checkoutProps);
    const html = render(await Packages());
    assert.match(html, /Precio no disponible/);
    assert.match(html, /No se pudo confirmar el precio de este plan/);
    assert.match(html, /No se puede iniciar un cobro/);
    assert.doesNotMatch(html, /Existing checkout|Total a pagar|\$0\.00|NaN|Infinity|<script>/);
    assert.equal(checkoutProps.length, 0);
  }
});
