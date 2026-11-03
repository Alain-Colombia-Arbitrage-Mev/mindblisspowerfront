import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { createMemberSummaryResource } from "./member-summary-resource.mjs";

const require = createRequire(import.meta.url);
const icon = () => React.createElement("svg", { "aria-hidden": true });
function component(relative, mocks) {
  const source = readFileSync(new URL(relative, import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", code)(id => id === "lucide-react" ? new Proxy({}, { get: () => icon }) : Object.hasOwn(mocks, id) ? mocks[id] : require(id), module, module.exports);
  return module.exports.default;
}

test("the paywall consumes the same validated membership state and never invents active status on errors", () => {
  const state = { loading: false, error: "", data: { active_packages: 1 } };
  let consumers = 0;
  const Gate = component("../app/dashboard/packages/PaywallGate.jsx", {
    "@/hooks/useMemberSummary": { useMemberSummary: () => { consumers++; return { state }; } },
    "next/link": { default: ({ children, ...props }) => React.createElement("a", props, children) },
  });
  const render = () => renderToStaticMarkup(React.createElement(Gate, {}, React.createElement("p", {}, "Catálogo de planes")));
  assert.match(render(), /Tu membresía está activa/); assert.equal(consumers, 1);
  state.data = null; state.error = "No se pudo consultar";
  const failed = render(); assert.match(failed, /Catálogo de planes/); assert.doesNotMatch(failed, /Tu membresía está activa/);
  state.data = { active_packages: "invalid" }; state.error = "";
  assert.doesNotMatch(render(), /Tu membresía está activa/);
});

test("actual payment-result effect refreshes the shared GET once only after confirmed activation", async () => {
  const effects = [];
  const ref = { current: null };
  let calls = 0;
  let active = false;
  let mode = "paid";
  const resource = createMemberSummaryResource({ fresh: true, read: async () => { calls++; return { active_packages: calls }; } });
  await resource.load(); assert.equal(calls, 1);
  const Modal = component("../app/dashboard/packages/PaymentResultModal.jsx", {
    react: { ...React, useState: () => [null, () => {}], useRef: () => ref, useEffect: callback => { effects.push(callback); } },
    "next/navigation": { useRouter: () => ({ replace: () => {}, refresh: () => {} }), useSearchParams: () => new URLSearchParams(`${mode}=1&session_id=cs_synthetic`) },
    "@/lib/utils": { cn: (...classes) => classes.join(" ") },
    "@/hooks/useCheckoutActivation": { useCheckoutActivation: () => ({ active, checking: false }) },
    "@/lib/checkout-status.mjs": { checkoutStatusCopy: () => ({ title: "Prueba", description: "Prueba" }) },
    "@/hooks/useMemberSummary": { useMemberSummary: () => ({ state: resource.getSnapshot(), reload: resource.refresh }) },
    './NOWPaymentsReceiptPopup': { default: () => null },
  });
  const renderEffect = () => { Modal(); effects.splice(0).forEach(effect => effect()); };
  renderEffect(); await new Promise(resolve => setImmediate(resolve)); assert.equal(calls, 1);
  active = true; mode = "canceled"; renderEffect(); await new Promise(resolve => setImmediate(resolve)); assert.equal(calls, 1);
  mode = "paid"; renderEffect(); await new Promise(resolve => setImmediate(resolve)); assert.equal(calls, 2);
  assert.equal(resource.getSnapshot().data.active_packages, 2);
  renderEffect(); await new Promise(resolve => setImmediate(resolve)); assert.equal(calls, 2);
  resource.cancel();
});

test("catalog children keep one fixed React slot across loading, activation, stale errors and explicit toggles so purchase UUIDs and pending guards do not remount", () => {
  const state = { loading: true, error: "", data: null };
  let showPlans = true;
  const Gate = component("../app/dashboard/packages/PaywallGate.jsx", {
    react: { ...React, useState: () => [showPlans, value => { showPlans = typeof value === 'function' ? value(showPlans) : value; }] },
    "@/hooks/useMemberSummary": { useMemberSummary: () => ({ state }) },
    "next/link": { default: ({ children, ...props }) => React.createElement("a", props, children) },
  });
  const PurchaseIntent = () => React.createElement('button', { type: 'button' }, 'Synthetic purchase');
  const catalog = React.createElement('div', { key: 'catalog' }, React.createElement(PurchaseIntent, { key: 'plan-7' }));
  const props = { children: catalog, initialShowPlans: true };
  let previous, syntheticMounts = 0;
  for (const next of [
    { loading: true, error: '', data: null },
    { loading: false, error: '', data: { active_packages: 0 } },
    { loading: false, error: '', data: { active_packages: 1 } },
    { loading: true, error: '', data: { active_packages: 1 } },
    { loading: false, error: 'Unavailable', data: { active_packages: 1 } },
    { loading: false, error: '', data: { active_packages: 2 } },
  ]) {
    Object.assign(state, next);
    const tree = Gate(props), slot = tree.props.children[2];
    assert.equal(tree.type, 'div'); assert.equal(tree.props.children.length, 3);
    assert.equal(slot.type, 'div'); assert.equal(slot.props.children, catalog);
    assert.equal(slot.props.hidden, false, 'the normal catalog remains visible even if an account already has memberships');
    const identity = { parent: tree.type, index: 2, type: slot.type, key: slot.key, child: slot.props.children.type, childKey: slot.props.children.key };
    if (!previous || Object.keys(identity).some(key => identity[key] !== previous[key])) syntheticMounts++;
    previous = identity;
  }
  let tree = Gate(props); const toggle = tree.props.children[1].props.children;
  assert.equal(toggle.props['aria-expanded'], true); toggle.props.onClick();
  tree = Gate(props); assert.equal(tree.props.children[2].props.hidden, true); assert.equal(tree.props.children[2].props.children, catalog);
  tree.props.children[1].props.children.props.onClick();
  tree = Gate(props); assert.equal(tree.props.children[2].props.hidden, false); assert.equal(tree.props.children[2].props.children, catalog);
  assert.equal(syntheticMounts, 1);
});
