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
import * as intentPolicy from './checkout-intent.mjs';

const require = createRequire(import.meta.url);
const subject = 'synthetic-verified-owner';
function memoryStorage() {
  const values = new Map();
  return { values, getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => { values.set(key, String(value)); }, removeItem: key => { values.delete(key); } };
}
function browserFixture(assign = () => {}, storage = memoryStorage()) {
  const events = new EventTarget();
  return { sessionStorage: storage, location: { assign },
    addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events),
    dispatchEvent: events.dispatchEvent.bind(events) };
}
function checkoutComponent({ provider, error = '', loading = false, session = null,
  referralResolver = () => ({ code: '', email: '' }) } = {}) {
  const states = [loading, error, provider];
  const stateChanges = [];
  const mockedReact = { ...React, useState: initial => {
    const index = stateChanges.length;
    const state = index === 2 && provider === undefined ? typeof initial === 'function' ? initial() : initial : states[index]; stateChanges.push([]);
    return [state, value => stateChanges[index].push(value)];
  }, useId: () => 'synthetic-selector', useRef: initial => ({ current: initial }), useEffect: () => {} };
  const source = readFileSync(new URL('../app/dashboard/packages/ActivatePackageButton.jsx', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  const mocks = { react: mockedReact, 'lucide-react': { ArrowRight: () => null, Loader2: () => null },
    '@/lib/referral-attribution': { referralForCheckout: referralResolver },
    '@/lib/member-session-context': { useMemberSession: () => session }, '@/lib/checkout-policy.mjs': policy,
    '@/lib/checkout-intent.mjs': intentPolicy, '@/lib/utils': { cn } };
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
  globalThis.window = browserFixture(url => navigations.push(url));
  globalThis.fetch = async (url, options) => {
    if (url === '/api/auth/session') return Response.json({ authenticated: true, subject, email: 'member@example.test' });
    assert.equal(url, '/api/payments/checkout'); checkouts++;
    assert.equal(options.cache, 'no-store'); assert.ok(options.signal instanceof AbortSignal);
    const body = JSON.parse(options.body);
    assert.match(body.purchase_request_id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    assert.deepEqual({ ...body, purchase_request_id: undefined }, { package_id: 7, provider: 'nowpayments', ref: '', ref_email: '', preferred_side: '', purchase_subject: subject, purchase_request_id: undefined });
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
  globalThis.window = browserFixture();
  try {
    for (const [label, session, expectedSessionReads, expectedElapsedMs] of [
      ['ready', { subject, email: 'member@example.test' }, 0, 250], ['cold', null, 1, 1050],
      ['pending', { name: 'Loading member' }, 1, 1050], ['stale', { subject, email: 'previous@example.test' }, 0, 250],
    ]) {
      let sessionReads = 0, checkouts = 0, privateCalls = 0, elapsedMs = 0;
      const emails = [];
      const { Component } = checkoutComponent({ provider: 'nowpayments', session,
        referralResolver: email => { emails.push(email); return { code: 'SYNTHETIC-REFERRAL', email, side: 'R' }; } });
      globalThis.fetch = async (target, options) => {
        if (target === '/api/auth/session') {
          sessionReads++; elapsedMs += 800; return Response.json({ authenticated: true, subject, email: 'member@example.test' });
        }
        assert.equal(target, '/api/payments/checkout'); checkouts++; elapsedMs += 250;
        return handleMembershipCheckout(new Request('https://portal.example.test/api/payments/checkout', {
          ...options, headers: { ...options.headers, origin: 'https://portal.example.test' },
        }), { env: { AUTH_PUBLIC_ORIGIN: 'https://portal.example.test', NOWPAYMENTS_MEMBERSHIPS_ENABLED: 'true',
          VP_PAYMENTS_URL: 'https://payments.core.internal', PAYMENTS_SERVICE_TOKEN: 'synthetic-private' },
          identity: async () => ({ token: 'synthetic-verified-jwt', claims: { sub: subject, email: 'member@example.test', email_verified: true } }),
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
  globalThis.window = browserFixture(() => assert.fail('untrusted checkout navigation'));
  try {
    for (const result of [{ provider: 'stripe', url: 'https://checkout.stripe.com/c/pay/cs_live_Synthetic123' },
      { provider: 'nowpayments', url: 'https://attacker.example.test/payment/?iid=1', fulfillment_status: 'review_required' },
      { provider: 'nowpayments', url: 'https://nowpayments.io/payment/?iid=1', fulfillment_status: 'activated' },
      { provider: 'nowpayments', url: 'https://nowpayments.io/payment/?iid=1' }]) {
      const { Component, stateChanges } = checkoutComponent({ provider: 'nowpayments' });
      globalThis.fetch = async url => Response.json(url === '/api/auth/session' ? { authenticated: true, subject, email: 'member@example.test' } : result);
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
  globalThis.window = browserFixture(() => assert.fail('failed checkout navigated'));
  try {
    for (const [code, pattern] of [['authentication-unavailable', /comprobar tu sesión/],
      ['nowpayments_checkout_unavailable', /No se ha iniciado un cobro/],
      ['upstream_unavailable', /No vuelvas a pagar todavía/], ['invalid-checkout-response', /No vuelvas a pagar todavía/],
      ['private postgres://operator:password@host', /Referencia: checkout_unknown/]]) {
      let checkouts = 0;
      globalThis.fetch = async url => {
        if (url === '/api/auth/session') return Response.json({ authenticated: true, subject, email: 'member@example.test' });
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
      if (url === '/api/auth/session') return Response.json({ authenticated: true, subject, email: 'member@example.test' });
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

const elements = tree => tree && typeof tree === 'object'
  ? [tree, ...React.Children.toArray(tree.props?.children).flatMap(elements)] : [];
const payButton = tree => elements(tree).find(element => element.type === 'button' && element.props.onClick?.name === 'activate');
const newPurchaseButton = tree => elements(tree).find(element => element.type === 'button' && element.props.onClick?.name === 'prepareAnotherPurchase');

// One compiled component type, separate hook stores: catches accidental module-
// global intention sharing while exercising the actual JSX and browser helpers.
function checkoutRuntime() {
  let current;
  const instances = [];
  const mockedReact = { ...React,
    useState(initial) {
      const owner = current, index = owner.stateIndex++;
      if (!(index in owner.states)) owner.states[index] = typeof initial === 'function' ? initial() : initial;
      return [owner.states[index], value => { owner.states[index] = typeof value === 'function' ? value(owner.states[index]) : value; }];
    },
    useRef(initial) { const index = current.refIndex++; return current.refs[index] ??= { current: initial }; },
    useId: () => `synthetic-${current.id}`,
    useEffect(effect, deps) {
      const index = current.effectIndex++, previous = current.effects[index];
      if (!previous || deps.some((value, offset) => value !== previous.deps[offset])) {
        previous?.cleanup?.(); current.effects[index] = { effect, deps, pending: true };
      }
    },
  };
  const source = readFileSync(new URL('../app/dashboard/packages/ActivatePackageButton.jsx', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} }, mocks = { react: mockedReact, 'lucide-react': { ArrowRight: () => null, Loader2: () => null },
    '@/lib/referral-attribution': { referralForCheckout: () => ({ code: '', email: '' }) },
    '@/lib/member-session-context': { useMemberSession: () => current.session },
    '@/lib/checkout-policy.mjs': policy, '@/lib/checkout-intent.mjs': intentPolicy, '@/lib/utils': { cn } };
  new Function('require', 'module', 'exports', code)(id => Object.hasOwn(mocks, id) ? mocks[id] : require(id), module, module.exports);
  return {
    create(packageId = 7, session = { subject, email: 'member@example.test' }) {
      const view = { id: instances.length, states: [], refs: [], effects: [], session,
        tree() {
          current = view; view.stateIndex = view.refIndex = view.effectIndex = 0;
          return module.exports.default({ packageId, nowpaymentsEnabled: true });
        },
        mount() {
          this.tree(); for (const effect of this.effects) if (effect.pending) { effect.pending = false; effect.cleanup = effect.effect(); }
          return this.tree();
        },
      };
      instances.push(view); return view;
    },
    cleanup() { for (const view of instances) for (const effect of view.effects) effect.cleanup?.(); },
  };
}

async function withCheckoutBrowser(run, saved = memoryStorage()) {
  const originalWindow = globalThis.window, originalFetch = globalThis.fetch, runtimes = [];
  const browser = browserFixture(() => {}, saved); globalThis.window = browser;
  const runtime = () => { const value = checkoutRuntime(); runtimes.push(value); return value; };
  try { await run({ browser, runtime }); }
  finally {
    for (const value of runtimes) value.cleanup(); globalThis.fetch = originalFetch;
    if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow;
  }
}

test('explicit independent same-SKU purchases use two different persisted IDs, while ambiguous retries and a fresh component recover the first intention without creating another', async () => {
  await withCheckoutBrowser(async ({ browser, runtime }) => {
    const bodies = [], syntheticInvoices = new Map();
    globalThis.fetch = async (target, options) => {
      assert.equal(target, '/api/payments/checkout'); const body = JSON.parse(options.body); bodies.push(body);
      syntheticInvoices.set(body.purchase_request_id, { packageId: body.package_id, status: 'pending' });
      throw new Error('synthetic response lost after server admission');
    };
    const first = runtime().create(); first.mount();
    assert.equal(bodies.length, 0); assert.equal(browser.sessionStorage.values.size, 0);
    await payButton(first.tree()).props.onClick(); await payButton(first.tree()).props.onClick();
    assert.equal(bodies.length, 2); const originalId = bodies[0].purchase_request_id;
    assert.equal(bodies[1].purchase_request_id, originalId); assert.equal(syntheticInvoices.size, 1);
    const reloaded = runtime().create(); let tree = reloaded.mount();
    assert.equal(bodies.length, 2); assert.ok(newPurchaseButton(tree), 'a reload recovers the saved intention and exposes its explicit alternative');
    await payButton(tree).props.onClick(); assert.equal(bodies[2].purchase_request_id, originalId);
    tree = reloaded.tree(); newPurchaseButton(tree).props.onClick();
    assert.equal(bodies.length, 3, 'preparing another purchase never issues a checkout');
    assert.equal(browser.sessionStorage.values.size, 0, 'the new ID is not generated until the primary action');
    await payButton(reloaded.tree()).props.onClick();
    assert.notEqual(bodies[3].purchase_request_id, originalId); assert.equal(syntheticInvoices.size, 2);
    assert.deepEqual(bodies.map(body => body.package_id), [7, 7, 7, 7]);
    for (const invoice of syntheticInvoices.values()) assert.equal(invoice.status, 'pending', 'the previous invoice is not cancelled or paid by preparing another');
    for (const body of bodies) assert.deepEqual(Object.keys(body).sort(), ['package_id', 'provider', 'purchase_request_id', 'purchase_subject', 'ref', 'ref_email', 'preferred_side'].sort());
  });
});

test('different package cards and different authenticated owners stay independent without using email as the persisted namespace', async () => {
  await withCheckoutBrowser(async ({ browser, runtime }) => {
    const bodies = [];
    globalThis.fetch = async (target, options) => {
      assert.equal(target, '/api/payments/checkout'); bodies.push(JSON.parse(options.body));
      return Response.json({ error: 'membership_payment_pending_review' }, { status: 409 });
    };
    const shared = runtime(), first = shared.create(7), second = shared.create(9), other = shared.create(7, { subject: 'synthetic-other-owner', email: 'other@example.test' });
    first.mount(); second.mount(); other.mount();
    await payButton(first.tree()).props.onClick(); assert.equal(payButton(second.tree()).props.disabled, false);
    await payButton(second.tree()).props.onClick(); await payButton(other.tree()).props.onClick(); await payButton(first.tree()).props.onClick();
    assert.equal(new Set(bodies.slice(0, 3).map(body => body.purchase_request_id)).size, 3);
    assert.equal(bodies[0].purchase_request_id, bodies[3].purchase_request_id);
    assert.deepEqual(bodies.map(body => body.package_id), [7, 9, 7, 7]);
    assert.equal(browser.sessionStorage.values.size, 3);
    for (const [key, value] of browser.sessionStorage.values) {
      assert.match(key, /^vp:checkout-intent:v1:production:NOW:/); assert.doesNotMatch(key, /@|example\.test/);
      assert.match(value, /^[0-9a-f-]{36}$/); assert.doesNotMatch(value, /@|https:|Bearer/);
    }
  });
});

test('BFCache return unlocks the hosted checkout controls but preserves its ID and never automatically submits or prepares another purchase', async () => {
  await withCheckoutBrowser(async ({ browser, runtime }) => {
    const bodies = [], navigations = []; browser.location.assign = target => { navigations.push(target); };
    globalThis.fetch = async (target, options) => {
      assert.equal(target, '/api/payments/checkout'); bodies.push(JSON.parse(options.body));
      return Response.json({ provider: 'nowpayments', url: 'https://nowpayments.io/payment/?iid=12345',
        fulfillment_status: 'awaiting_payment', total_usd: '100.00', fee_usd: '0.00' });
    };
    const view = runtime().create(); view.mount(); await payButton(view.tree()).props.onClick();
    assert.equal(payButton(view.tree()).props.disabled, true); assert.equal(navigations.length, 1);
    browser.dispatchEvent(new Event('pageshow')); assert.equal(payButton(view.tree()).props.disabled, true);
    const restored = new Event('pageshow'); Object.defineProperty(restored, 'persisted', { value: true }); browser.dispatchEvent(restored);
    assert.equal(payButton(view.tree()).props.disabled, false); assert.equal(bodies.length, 1); assert.equal(navigations.length, 1);
    assert.equal([...browser.sessionStorage.values.values()][0], bodies[0].purchase_request_id);
    await payButton(view.tree()).props.onClick(); assert.equal(bodies.length, 2);
    assert.equal(bodies[0].purchase_request_id, bodies[1].purchase_request_id);
  });
});

test('unavailable identity or browser persistence fails before checkout, and a failed explicit reset keeps its original durable intention', async () => {
  const denied = () => { throw new DOMException('private storage diagnostic', 'SecurityError'); };
  for (const saved of [null, { getItem: denied }, { getItem: () => null, setItem: denied }, { getItem: () => null, setItem() {} }]) {
    await withCheckoutBrowser(async ({ runtime }) => {
      globalThis.fetch = async () => assert.fail('unsafe persistence reached checkout or session transport');
      const view = runtime().create(); view.mount(); await payButton(view.tree()).props.onClick();
      const html = renderToStaticMarkup(view.tree()); assert.match(html, /No se inició ningún cobro/); assert.match(html, /role="alert"/);
      assert.doesNotMatch(html, /private storage diagnostic/); assert.equal(payButton(view.tree()).props.disabled, false);
    }, saved);
  }
  await withCheckoutBrowser(async ({ runtime }) => {
    let sessionReads = 0;
    globalThis.fetch = async target => { assert.equal(target, '/api/auth/session'); sessionReads++; return Response.json({ authenticated: false, email: 'member@example.test' }); };
    const view = runtime().create(7, { email: 'member@example.test' }); view.mount(); await payButton(view.tree()).props.onClick();
    assert.equal(sessionReads, 1); assert.match(renderToStaticMarkup(view.tree()), /No se inició ningún cobro/);
  });
  await withCheckoutBrowser(async ({ browser, runtime }) => {
    const firstId = intentPolicy.getOrCreateCheckoutIntent(browser.sessionStorage, subject, 7, () => 'a02f5a55-5fa3-4239-845b-ac6b699110ee');
    const view = runtime().create(); view.mount(); const originalRemove = browser.sessionStorage.removeItem; browser.sessionStorage.removeItem = denied;
    let checkouts = 0; globalThis.fetch = async (target, options) => {
      assert.equal(target, '/api/payments/checkout'); checkouts++; assert.equal(JSON.parse(options.body).purchase_request_id, firstId);
      return Response.json({ error: 'upstream_unavailable' }, { status: 503 });
    };
    newPurchaseButton(view.tree()).props.onClick(); assert.equal(checkouts, 0);
    assert.equal(intentPolicy.readCheckoutIntent(browser.sessionStorage, subject, 7), firstId);
    assert.match(renderToStaticMarkup(view.tree()), /No pudimos preparar otra compra segura/);
    browser.sessionStorage.removeItem = originalRemove; await payButton(view.tree()).props.onClick(); assert.equal(checkouts, 1);
  });
});

test('checkout identity projection comes from verified subject claims and the mounted shell retains only the opaque namespace hint, never credentials', () => {
  const route = readFileSync(new URL('../app/api/auth/session/route.js', import.meta.url), 'utf8');
  const shell = readFileSync(new URL('../app/dashboard/_components/DashboardShell.jsx', import.meta.url), 'utf8');
  assert.match(route, /verifyIdToken\(idToken\)/); assert.match(route, /subject:/); assert.match(route, /claims\.sub/);
  assert.match(shell, /subject:\s*d\.subject/);
  const helper = readFileSync(new URL('./checkout-intent.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(helper, /email|localStorage|authorization|access_token|id_token|session_token/i);
});

test('a stale shell account cannot turn its saved request into another invoice for a newly authenticated cookie owner', async () => {
  await withCheckoutBrowser(async ({ browser, runtime }) => {
    const currentSubject = 'synthetic-current-owner';
    const previousId = intentPolicy.getOrCreateCheckoutIntent(browser.sessionStorage, subject, 7, () => 'a02f5a55-5fa3-4239-845b-ac6b699110ee');
    const currentId = intentPolicy.getOrCreateCheckoutIntent(browser.sessionStorage, currentSubject, 7, () => 'a02f5a55-5fa3-4239-845b-ac6b699110ef');
    let requests = 0, privateCalls = 0, navigations = 0; browser.location.assign = () => { navigations++; };
    globalThis.fetch = async (target, options) => {
      assert.equal(target, '/api/payments/checkout'); requests++;
      const body = JSON.parse(options.body); assert.equal(body.purchase_subject, subject); assert.equal(body.purchase_request_id, previousId);
      return handleMembershipCheckout(new Request('https://portal.example.test/api/payments/checkout', {
        ...options, headers: { ...options.headers, origin: 'https://portal.example.test' },
      }), { env: { AUTH_PUBLIC_ORIGIN: 'https://portal.example.test', NOWPAYMENTS_MEMBERSHIPS_ENABLED: 'true',
        VP_PAYMENTS_URL: 'https://payments.core.internal', PAYMENTS_SERVICE_TOKEN: 'synthetic-private' },
        identity: async () => ({ token: 'verified-current-session', claims: { sub: currentSubject, email: 'current@example.test', email_verified: true } }),
        fetchImpl: async () => { privateCalls++; assert.fail('stale namespace created another invoice for the current account'); },
      });
    };
    const view = runtime().create(); view.mount(); await payButton(view.tree()).props.onClick();
    const html = renderToStaticMarkup(view.tree());
    assert.match(html, /La sesión cambió en otra pestaña/); assert.match(html, /Recarga esta página antes de continuar/);
    assert.match(html, /Referencia: checkout_session_changed/); assert.equal(requests, 1); assert.equal(privateCalls, 0); assert.equal(navigations, 0);
    assert.equal(intentPolicy.readCheckoutIntent(browser.sessionStorage, subject, 7), previousId);
    assert.equal(intentPolicy.readCheckoutIntent(browser.sessionStorage, currentSubject, 7), currentId);
    assert.equal(browser.sessionStorage.values.size, 2, 'neither account loses its existing intention after a context mismatch');
  });
});
