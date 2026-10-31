import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import * as policy from './checkout-policy.mjs';
import { cn } from './utils.js';
import { handleMembershipCheckout } from './checkout-bff.mjs';

const require = createRequire(import.meta.url);
function checkoutComponent({ provider, error = '', loading = false, session = null,
  referralResolver = () => ({ code: '', email: '' }) } = {}) {
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
    '@/lib/referral-attribution': { referralForCheckout: referralResolver },
    '@/lib/member-session-context': { useMemberSession: () => session }, '@/lib/checkout-policy.mjs': policy, '@/lib/utils': { cn } };
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

test('the actual operational membership click handler sends chosen provider once and accepts only its validated hosted URL', async () => {
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
    const body = JSON.parse(options.body);
    assert.match(body.purchase_request_id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    assert.deepEqual({ ...body, purchase_request_id: undefined }, { package_id: 7, provider: 'nowpayments', ref: '', ref_email: '', preferred_side: '', purchase_request_id: undefined });
    checkoutStarted(); return pending;
  };
  try {
    const first = button.props.onClick(); await started;
    await button.props.onClick(); assert.equal(checkouts, 1);
    resolveCheckout(Response.json({ provider: 'nowpayments', url: 'https://nowpayments.io/payment/?iid=12345', checkout_environment: 'production', fulfillment_status: 'awaiting_payment' }));
    await first; assert.deepEqual(navigations, ['https://nowpayments.io/payment/?iid=12345']);
  } finally { globalThis.fetch = originalFetch; if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow; }
});

test('ready shell context removes a sequential session GET while a cold context preserves attribution and authoritative BFF identity', async () => {
  const originalFetch = globalThis.fetch, originalWindow = globalThis.window;
  const measurements = [];
  globalThis.window = { location: { assign() {} } };
  try {
    for (const [label, session, expectedSessionReads, expectedElapsedMs] of [
      ['ready', { email: 'member@example.test' }, 0, 250], ['cold', null, 1, 1050],
      ['pending', { name: 'Loading member' }, 1, 1050], ['stale', { email: 'previous@example.test' }, 0, 250],
    ]) {
      let sessionReads = 0, checkouts = 0, privateCalls = 0, elapsedMs = 0;
      const emails = [];
      const { Component } = checkoutComponent({ provider: 'nowpayments', session,
        referralResolver: email => { emails.push(email); return { code: 'SYNTHETIC-REFERRAL', email, side: 'R' }; } });
      globalThis.fetch = async (target, options) => {
        if (target === '/api/auth/session') {
          sessionReads++; elapsedMs += 800; return Response.json({ email: 'member@example.test' });
        }
        assert.equal(target, '/api/payments/checkout'); checkouts++; elapsedMs += 250;
        return handleMembershipCheckout(new Request('https://portal.example.test/api/payments/checkout', {
          ...options, headers: { ...options.headers, origin: 'https://portal.example.test' },
        }), { env: { AUTH_PUBLIC_ORIGIN: 'https://portal.example.test', NOWPAYMENTS_MEMBERSHIPS_ENABLED: 'true',
          VP_PAYMENTS_URL: 'https://payments.core.internal', PAYMENTS_SERVICE_TOKEN: 'synthetic-private' },
          identity: async () => ({ token: 'synthetic-verified-jwt', claims: { sub: 'stable-owner-subject', email: 'member@example.test', email_verified: true } }),
          fetchImpl: async (_target, init) => {
            privateCalls++; const forwarded = JSON.parse(init.body);
            assert.equal(forwarded.email, 'member@example.test', 'presentation context can never choose the owner');
            assert.equal(forwarded.ref, label === 'stale' ? '' : 'SYNTHETIC-REFERRAL');
            assert.equal(forwarded.preferred_side, label === 'stale' ? '' : 'R');
            assert.match(forwarded.purchase_request_id, /^[0-9a-f-]{36}$/);
            return Response.json({ provider: 'nowpayments', url: 'https://nowpayments.io/payment/?iid=12345',
              total_usd: '100.00', fee_usd: '0.00', fulfillment_status: 'awaiting_payment' });
          },
        });
      };
      await findElement(Component({ packageId: 7, nowpaymentsEnabled: true }), 'button').props.onClick();
      assert.equal(sessionReads, expectedSessionReads); assert.equal(checkouts, 1); assert.equal(privateCalls, 1); assert.equal(elapsedMs, expectedElapsedMs);
      assert.deepEqual(emails, [session?.email || 'member@example.test']);
      measurements.push({ label, sessionReads, checkoutRequests: checkouts, syntheticElapsedMs: elapsedMs });
    }
    assert.equal(measurements[1].syntheticElapsedMs - measurements[0].syntheticElapsedMs, 800,
      'synthetic 800ms session + 250ms checkout baseline saves exactly one session roundtrip, not an authorization check');
  } finally {
    globalThis.fetch = originalFetch;
    if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow;
  }
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

test('the real checkout click presents safe failure references in the existing alert without navigation or retries', async () => {
  const originalFetch = globalThis.fetch; const originalWindow = globalThis.window;
  globalThis.window = { location: { assign: () => assert.fail('failed checkout navigated') } };
  try {
    for (const [code, pattern] of [['authentication-unavailable', /comprobar tu sesión/],
      ['nowpayments_checkout_unavailable', /No se ha iniciado un cobro/],
      ['upstream_unavailable', /No vuelvas a pagar todavía/], ['invalid-checkout-response', /No vuelvas a pagar todavía/],
      ['private postgres://operator:password@host', /Referencia: checkout_unknown/]]) {
      let checkouts = 0;
      globalThis.fetch = async url => {
        if (url === '/api/auth/session') return Response.json({ email: 'member@example.test' });
        checkouts++; return Response.json({ error: code, diagnostics: 'private-token' }, { status: 503 });
      };
      const { Component, stateChanges } = checkoutComponent({ provider: 'nowpayments' });
      await findElement(Component({ packageId: 7, nowpaymentsEnabled: true }), 'button').props.onClick();
      const error = stateChanges[1].at(-1);
      assert.match(error, pattern); assert.match(error, /Referencia: [a-z_-]+\.$/);
      assert.doesNotMatch(error, /postgres:|password|operator|private-token/);
      assert.equal(checkouts, 1);
      const view = checkoutComponent({ provider: 'nowpayments', error }).Component;
      const html = renderToStaticMarkup(React.createElement(view, { packageId: 7, nowpaymentsEnabled: true }));
      assert.match(html, /role="alert"/); assert.match(html, /Referencia:/);
      assert.equal((html.match(/role="alert"/g) || []).length, 1);
    }
    let checkouts = 0;
    globalThis.fetch = async url => {
      if (url === '/api/auth/session') return Response.json({ email: 'member@example.test' });
      checkouts++; throw new Error('private transport exception');
    };
    const { Component, stateChanges } = checkoutComponent({ provider: 'nowpayments' });
    await findElement(Component({ packageId: 7, nowpaymentsEnabled: true }), 'button').props.onClick();
    assert.equal(checkouts, 1);
    assert.match(stateChanges[1].at(-1), /No vuelvas a pagar todavía.*Referencia: payments-unreachable\./);
    assert.doesNotMatch(stateChanges[1].at(-1), /private transport/);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow;
  }
});
