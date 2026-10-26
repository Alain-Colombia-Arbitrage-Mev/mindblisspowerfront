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
function checkoutComponent({ provider = 'stripe', error = '', loading = false } = {}) {
  const states = [loading, error, provider];
  const stateChanges = [];
  const mockedReact = { ...React, useState: () => {
    const index = stateChanges.length;
    const state = states[index]; stateChanges.push([]);
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

test('membership selector has a visible associated label, Stripe default and no instant-activation claim', () => {
  const { Component } = checkoutComponent();
  const html = renderToStaticMarkup(React.createElement(Component, { packageId: 1 }));
  assert.match(html, /for="synthetic-selector-provider"/);
  assert.match(html, /<select[^>]*id="synthetic-selector-provider"/);
  assert.match(html, /value="stripe" selected=""/);
  assert.match(html, /Cripto · NOWPayments/); assert.match(html, /Continuar al pago/);
  assert.match(html, /No es una recarga de saldo/); assert.doesNotMatch(html, /Activar membresía|pago completado/);
});

test('crypto pending enablement and errors are explicit and accessible; loading disables all payment controls', () => {
  const { Component } = checkoutComponent({ provider: 'nowpayments', error: 'Los pagos aún no están habilitados.', loading: true });
  const html = renderToStaticMarkup(React.createElement(Component, { packageId: 1 }));
  assert.match(html, /sujeta a validación/); assert.match(html, /al finalizar la habilitación/);
  assert.match(html, /aria-busy="true"/); assert.match(html, /role="alert"/);
  assert.match(html, /<select[^>]*disabled=""/); assert.match(html, /<button[^>]*disabled=""/);
  assert.match(html, /Preparando pago/);
});

test('the actual membership click handler sends chosen provider once and accepts only its validated hosted URL', async () => {
  const { Component } = checkoutComponent({ provider: 'nowpayments' });
  const button = findElement(Component({ packageId: 7 }), 'button');
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
      const button = findElement(Component({ packageId: 7 }), 'button');
      await button.props.onClick();
      assert.equal(stateChanges[0].at(-1), false); assert.match(stateChanges[1].at(-1), /historial/);
    }
  } finally { globalThis.fetch = originalFetch; if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow; }
});
