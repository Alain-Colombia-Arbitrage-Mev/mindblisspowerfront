import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import * as policy from './checkout-policy.mjs';
import { cn } from './utils.js';

const require = createRequire(import.meta.url);
function checkoutComponent({ provider, error = '', loading = false } = {}) {
  const states = [loading, error, provider];
  const stateChanges = [];
  const mockedReact = { ...React, useState: initial => {
    const index = stateChanges.length;
    const state = index === 2 && provider === undefined ? typeof initial === 'function' ? initial() : initial : states[index]; stateChanges.push([]);
    return [state, value => stateChanges[index].push(value)];
  }, useId: () => 'synthetic-selector', useRef: () => ({ current: false }) };
  const source = readFileSync(new URL('../app/dashboard/packages/ActivatePackageButton.jsx', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  const mocks = { react: mockedReact, 'lucide-react': { ArrowRight: () => null, Loader2: () => null },
    '@/lib/referral-attribution': { referralForCheckout: () => ({ code: '', email: '' }) }, '@/lib/checkout-policy.mjs': policy, '@/lib/utils': { cn } };
  new Function('require', 'module', 'exports', code)(id => Object.hasOwn(mocks, id) ? mocks[id] : require(id), module, module.exports);
  return { Component: module.exports.default, stateChanges };
}
function findElement(node, type) {
  if (node?.type === type) return node;
  const children = React.Children.toArray(node?.props?.children);
  return children.map(child => findElement(child, type)).find(Boolean);
}

test('membership selector keeps its design and NOWPayments while disabled Stripe is absent', () => {
  const { Component } = checkoutComponent();
  const html = renderToStaticMarkup(React.createElement(Component, { packageId: 1 }));
  assert.match(html, /for="synthetic-selector-provider"/);
  assert.match(html, /<select[^>]*id="synthetic-selector-provider"/);
  assert.doesNotMatch(html, /value="stripe"|Stripe|suspendido/);
  assert.match(html, /value="nowpayments" disabled="" selected=""/);
  assert.match(html, /Cripto · NOWPayments/); assert.match(html, /Pagos no disponibles/);
  assert.match(html, /Los pagos de membresías aún no están habilitados para este método/);
  assert.match(html, /No se ha iniciado ningún cobro/);
  assert.doesNotMatch(html, /Continuar al pago/);
  assert.match(html, /No es una recarga de saldo/); assert.doesNotMatch(html, /Activar membresía|pago completado/);
  assert.match(html, /<button[^>]*disabled=""/);
});

test('an explicitly enabled server prop can restore the Stripe choice, never a truthy public string', () => {
  const { Component } = checkoutComponent();
  const html = renderToStaticMarkup(React.createElement(Component, { packageId: 1, stripeEnabled: true }));
  assert.match(html, /value="stripe" selected=""/);
  assert.doesNotMatch(html, /suspendido|Stripe están suspendidos/);
  const invalid = checkoutComponent().Component;
  for (const stripeEnabled of [undefined, false, 'true', 1]) {
    assert.doesNotMatch(renderToStaticMarkup(React.createElement(invalid, { packageId: 1, stripeEnabled })), /value="stripe"|Stripe|suspendido/);
  }
});

test('a stale or forged Stripe selection cannot send even a session read or checkout while paused', async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; assert.fail('paused Stripe handler performed network I/O'); };
  try {
    const { Component, stateChanges } = checkoutComponent({ provider: 'stripe' });
    const button = findElement(Component({ packageId: 7 }), 'button');
    assert.equal(button.props.disabled, true);
    await button.props.onClick();
    assert.equal(calls, 0); assert.match(stateChanges[1].at(-1), /Stripe están suspendidos/);
  } finally { globalThis.fetch = originalFetch; }
});

test('crypto pending enablement and errors are explicit and accessible; loading disables all payment controls', () => {
  const { Component } = checkoutComponent({ provider: 'nowpayments', error: 'Los pagos aún no están habilitados.', loading: true });
  const html = renderToStaticMarkup(React.createElement(Component, { packageId: 1 }));
  assert.match(html, /aún no están habilitados/); assert.match(html, /No se ha iniciado ningún cobro/);
  assert.match(html, /aria-busy="true"/); assert.match(html, /role="alert"/);
  assert.match(html, /<select[^>]*disabled=""/); assert.match(html, /<button[^>]*disabled=""/);
  assert.match(html, /Preparando pago/);
});

test('the actual membership click handler sends chosen provider once and accepts only its validated hosted URL', async () => {
  const { Component } = checkoutComponent({ provider: 'nowpayments' });
  const button = findElement(Component({ packageId: 7, nowpaymentsEnabled: true }), 'button');
  let resolveCheckout; let checkoutStarted;
  const started = new Promise(resolve => { checkoutStarted = resolve; });
  const pending = new Promise(resolve => { resolveCheckout = resolve; });
  const originalFetch = globalThis.fetch; const originalWindow = globalThis.window;
  const navigations = []; let checkouts = 0;
  globalThis.window = { location: { assign: url => navigations.push(url) } };
  globalThis.fetch = async (url, options) => {
    if (url === '/api/auth/session') return Response.json({ email: 'member@example.test' });
    assert.equal(url, '/api/payments/checkout'); checkouts++;
    assert.equal(options.cache, 'no-store'); assert.ok(options.signal instanceof AbortSignal);
    assert.equal(JSON.parse(options.body).provider, 'nowpayments'); assert.equal(JSON.parse(options.body).package_id, 7);
    checkoutStarted(); return pending;
  };
  try {
    const first = button.props.onClick(); await started;
    await button.props.onClick(); assert.equal(checkouts, 1);
    resolveCheckout(Response.json({ provider: 'nowpayments', url: 'https://nowpayments.io/payment/?iid=12345', checkout_environment: 'production', fulfillment_status: 'review_required' }));
    await first; assert.deepEqual(navigations, ['https://nowpayments.io/payment/?iid=12345']);
  } finally { globalThis.fetch = originalFetch; if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow; }
});

test('a successful HTTP response with wrong-provider or malicious URL never navigates', async () => {
  const originalFetch = globalThis.fetch; const originalWindow = globalThis.window;
  globalThis.window = { location: { assign: () => assert.fail('untrusted checkout navigation') } };
  try {
    for (const result of [{ provider: 'stripe', url: 'https://checkout.stripe.com/c/pay/cs_live_Synthetic123' },
      { provider: 'nowpayments', url: 'https://attacker.example.test/payment/?iid=1', fulfillment_status: 'review_required' },
      { provider: 'nowpayments', url: 'https://nowpayments.io/payment/?iid=1', fulfillment_status: 'activated' },
      { provider: 'nowpayments', url: 'https://nowpayments.io/payment/?iid=1' }]) {
      const { Component, stateChanges } = checkoutComponent({ provider: 'nowpayments' });
      globalThis.fetch = async url => Response.json(url === '/api/auth/session' ? { email: 'member@example.test' } : result);
      const button = findElement(Component({ packageId: 7, nowpaymentsEnabled: true }), 'button');
      await button.props.onClick();
      assert.equal(stateChanges[0].at(-1), false); assert.match(stateChanges[1].at(-1), /historial/);
    }
  } finally { globalThis.fetch = originalFetch; if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow; }
});

test('disabled or loosely typed NOWPayments props cannot send even a session read or a direct checkout', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => assert.fail('disabled NOWPayments performed network I/O');
  try {
    for (const nowpaymentsEnabled of [undefined, false, 'true', 1]) {
      const { Component, stateChanges } = checkoutComponent({ provider: 'nowpayments' });
      const button = findElement(Component({ packageId: 7, nowpaymentsEnabled }), 'button');
      assert.equal(button.props.disabled, true);
      await button.props.onClick();
      assert.match(stateChanges[1].at(-1), /aún no están habilitadas/);
    }
  } finally { globalThis.fetch = originalFetch; }
});

test('enabled NOWPayments retains the design, warns about a real purchase and never claims automatic success', () => {
  const { Component } = checkoutComponent();
  const html = renderToStaticMarkup(React.createElement(Component, { packageId: 1, nowpaymentsEnabled: true, stripeEnabled: false }));
  assert.match(html, /value="nowpayments" selected=""/);
  assert.doesNotMatch(html, /value="stripe"|Stripe|suspendido/);
  assert.match(html, /Realizarás un pago real de membresía/);
  assert.match(html, /Continuar al pago/);
  assert.doesNotMatch(html, /Pagos no disponibles|<button[^>]*disabled=""/);
  assert.match(html, /El servidor debe validar el pago y confirmar su activación/);
  assert.doesNotMatch(html, /membresía activada|pago completado|activación garantizada/);
});

test('unknown providers cannot look payable or perform a session read or checkout', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => assert.fail('unknown provider performed network I/O');
  try {
    for (const provider of ['unknown', '', 'NOWPayments', undefined]) {
      const { Component, stateChanges } = checkoutComponent({ provider });
      const element = Component({ packageId: 7 });
      const html = renderToStaticMarkup(element);
      assert.match(html, /Pagos no disponibles/);
      assert.doesNotMatch(html, /Continuar al pago/);
      const button = findElement(element, 'button');
      assert.equal(button.props.disabled, true);
      await button.props.onClick();
      assert.ok(stateChanges[1].at(-1));
    }
  } finally { globalThis.fetch = originalFetch; }
});
