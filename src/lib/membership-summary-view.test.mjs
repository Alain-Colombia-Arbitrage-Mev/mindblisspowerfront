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
  });
  const renderEffect = () => { Modal(); effects.splice(0).forEach(effect => effect()); };
  renderEffect(); await new Promise(resolve => setImmediate(resolve)); assert.equal(calls, 1);
  active = true; mode = "canceled"; renderEffect(); await new Promise(resolve => setImmediate(resolve)); assert.equal(calls, 1);
  mode = "paid"; renderEffect(); await new Promise(resolve => setImmediate(resolve)); assert.equal(calls, 2);
  assert.equal(resource.getSnapshot().data.active_packages, 2);
  renderEffect(); await new Promise(resolve => setImmediate(resolve)); assert.equal(calls, 2);
  resource.cancel();
});
