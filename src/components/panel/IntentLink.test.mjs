import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import React from "react";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = readFileSync(new URL("./IntentLink.jsx", import.meta.url), "utf8");
const code = ts.transpileModule(source, {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
}).outputText;
const nextLink = () => null;

// Execute the real component's handlers with deterministic React hooks. No
// browser, prefetch requests, account data or framework cache is simulated.
function view() {
  let intent = null;
  let previousHref;
  let initialized = false;
  let effect;
  const hooks = {
    useState: () => [intent, value => { intent = value; }],
    useEffect: (run, [href]) => {
      if (!initialized || previousHref !== href) {
        initialized = true;
        previousHref = href;
        effect = run;
      }
    },
  };
  const module = { exports: {} };
  new Function("require", "module", "exports", code)(id => {
    if (id === "react") return hooks;
    if (id === "next/link") return { default: nextLink };
    if (id === "react/jsx-runtime") return require(id);
    assert.fail(`Unexpected test dependency: ${id}`);
  }, module, module.exports);
  return {
    render(props = { href: "/dashboard/profile" }) {
      const tree = module.exports.default(props);
      effect?.();
      effect = null;
      return tree;
    },
  };
}

function browser(t, { visible = true, online = true } = {}) {
  for (const [name, value] of Object.entries({
    document: { visibilityState: visible ? "visible" : "hidden" },
    navigator: { onLine: online },
  })) {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { configurable: true, value });
    t.after(() => {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    });
  }
}

const event = () => ({ defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } });

test("shell links do not prefetch on mount and preserve anchor/navigation props and modified clicks", () => {
  const harness = view();
  let clicked;
  const onClick = e => { clicked = e; };
  const props = { href: "/dashboard/profile", className: "vp-sidebar-link", "aria-current": "page",
    title: "Mi perfil", children: React.createElement("span", null, "Perfil"), target: "_blank", scroll: false,
    replace: true, onClick };
  const tree = harness.render(props);
  assert.equal(tree.type, nextLink);
  assert.equal(tree.props.prefetch, false);
  for (const [key, value] of Object.entries(props)) assert.equal(tree.props[key], value);
  const modified = { ...event(), ctrlKey: true, metaKey: true };
  tree.props.onClick(modified);
  assert.equal(clicked, modified);
  assert.equal(modified.defaultPrevented, false);
});

test("hover, keyboard focus and touch admit default Next prefetch only after visible online intent", t => {
  browser(t);
  for (const handler of ["onMouseEnter", "onFocus", "onTouchStart"]) {
    const harness = view();
    let originalCalls = 0;
    const props = { href: "/dashboard/profile", [handler]: () => { originalCalls++; } };
    const initial = harness.render(props);
    assert.equal(initial.props.prefetch, false);
    initial.props[handler](event());
    assert.equal(originalCalls, 1);
    assert.equal(harness.render(props).props.prefetch, null);
    harness.render(props).props[handler](event());
    assert.equal(harness.render(props).props.prefetch, null);
  }
});

test("hidden, offline and cancelled intent cannot enable speculation", t => {
  browser(t);
  for (const reason of ["hidden", "offline", "cancelled"]) {
    document.visibilityState = reason === "hidden" ? "hidden" : "visible";
    navigator.onLine = reason !== "offline";
    const harness = view();
    const props = { href: "/dashboard/profile", onFocus: reason === "cancelled" ? e => e.preventDefault() : undefined };
    harness.render(props).props.onFocus(event());
    assert.equal(harness.render(props).props.prefetch, false);
  }
});

test("changing href disables old intent immediately and requires intent again even when returning", t => {
  browser(t);
  const harness = view();
  const first = { href: "/dashboard/profile" };
  const second = { href: "/dashboard/support" };
  harness.render(first).props.onMouseEnter(event());
  assert.equal(harness.render(first).props.prefetch, null);
  assert.equal(harness.render(second).props.prefetch, false);
  assert.equal(harness.render(first).props.prefetch, false);
  harness.render(first).props.onFocus(event());
  assert.equal(harness.render(first).props.prefetch, null);
});

test("an explicitly disabled link stays disabled after intent", t => {
  browser(t);
  const harness = view();
  const props = { href: "/dashboard/profile", prefetch: false };
  harness.render(props).props.onTouchStart(event());
  assert.equal(harness.render(props).props.prefetch, false);
});

test("only shell navigation uses the wrapper and logout is an explicit non-link action", () => {
  for (const filename of ["SidebarNavItem.jsx", "SidebarNavGroup.jsx", "SidebarLogo.jsx", "SidebarUserCard.jsx", "PanelHeader.jsx"]) {
    const shell = readFileSync(new URL(`./${filename}`, import.meta.url), "utf8");
    assert.match(shell, /import Link from "\.\/IntentLink"/);
    assert.doesNotMatch(shell, /from ["']next\/link["']/);
  }
  const sidebar = readFileSync(new URL("./PanelSidebar.jsx", import.meta.url), "utf8");
  for (const shell of [sidebar, readFileSync(new URL('./PanelHeader.jsx', import.meta.url), 'utf8')]) {
    assert.match(shell, /<LogoutButton/);
    assert.doesNotMatch(shell, /href=["']\/api\/auth\/logout/);
  }
  assert.match(sidebar, /<LogoutButton\b[^>]*errorPlacement="above"/);
  assert.doesNotMatch(source, /router\.prefetch|router\.push|setInterval|setTimeout|fetch\(/);
});
