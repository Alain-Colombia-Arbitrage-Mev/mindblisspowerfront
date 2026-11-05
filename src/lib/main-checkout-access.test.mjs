import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import React from 'react';
import ts from 'typescript';
import * as deadlines from './browser-request-deadline.mjs';
import * as policy from './checkout-policy.mjs';
import * as intent from './checkout-intent.mjs';

const require = createRequire(import.meta.url);
const subject = 'synthetic-main-owner';
const email = 'main-checkout@example.test';

// Compile main's actual component. These fixtures neither contact a payment
// provider nor replace the owner-scoped intent persistence implementation.
function fixture(t, referral = address => ({ ok: true, code: 'SyntheticSponsor', email: address, side: 'R' })) {
  const previous = globalThis.window, values = new Map(), timings = [], changes = [];
  globalThis.window = { sessionStorage: { getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) },
    location: { assign() { assert.fail('a failed fixture cannot navigate to payment'); } } };
  t.after(() => { if (previous === undefined) delete globalThis.window; else globalThis.window = previous; });
  const react = { ...React, useState(initial) {
    const value = typeof initial === 'function' ? initial() : initial;
    return [value, next => changes.push(next)];
  }, useRef: initial => ({ current: initial }), useEffect() {}, useId: () => 'main-checkout' };
  const mocks = { react, 'lucide-react': { ArrowRight: () => null, Loader2: () => null },
    '@/lib/member-session-context': { useMemberSession: () => null },
    '@/lib/referral-sync.mjs': { verifiedReferralForCheckout: async address => referral(address) },
    '@/lib/checkout-policy.mjs': policy, '@/lib/checkout-intent.mjs': intent,
    '@/lib/utils': { cn: (...values) => values.filter(Boolean).join(' ') },
    '@/lib/browser-request-deadline.mjs': { browserRequestDeadline(parent, timeoutMs) {
      const deadline = deadlines.browserRequestDeadline(parent, timeoutMs);
      const entry = { timeoutMs, disposed: false }; timings.push(entry);
      return { signal: deadline.signal, dispose() { entry.disposed = true; deadline.dispose(); } };
    } } };
  const source = readFileSync(new URL('../app/dashboard/packages/ActivatePackageButton.jsx', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
  const compiled = { exports: {} };
  new Function('require', 'module', 'exports', code)(name => Object.hasOwn(mocks, name) ? mocks[name] : require(name), compiled, compiled.exports);
  const nodes = tree => tree && typeof tree === 'object' ? [tree, ...React.Children.toArray(tree.props?.children).flatMap(nodes)] : [];
  const tree = compiled.exports.default({ packageId: 1, nowpaymentsEnabled: true });
  const button = nodes(tree).find(node => node.type === 'button' && node.props.onClick?.name === 'activate');
  return { click: () => button.props.onClick(), values, timings, changes };
}

test('main cold checkout uses canonical access with a 15-second portable deadline and preserves the UUID after an uncertain result', async t => {
  const descriptors = new Map(['any', 'timeout'].map(name => [name, Object.getOwnPropertyDescriptor(AbortSignal, name)]));
  for (const name of descriptors.keys()) Object.defineProperty(AbortSignal, name, { configurable: true, value: undefined });
  t.after(() => { for (const [name, descriptor] of descriptors) Object.defineProperty(AbortSignal, name, descriptor); });
  const view = fixture(t), calls = [], bodies = [];
  t.mock.method(globalThis, 'fetch', async (path, options) => {
    calls.push(path); assert.ok(options.signal instanceof AbortSignal);
    assert.equal(options.cache, 'no-store');
    if (path === '/api/auth/session?view=access') return Response.json({ authenticated: true, mode: 'better-auth', email, subject });
    assert.equal(path, '/api/payments/checkout');
    const body = JSON.parse(options.body); bodies.push(body);
    assert.equal(body.purchase_subject, subject); assert.equal(body.ref_email, email);
    assert.equal(body.ref, 'SyntheticSponsor'); assert.equal(body.preferred_side, 'R');
    return Response.json({ error: 'upstream_unavailable' }, { status: 503 });
  });
  await view.click();
  assert.deepEqual(calls, ['/api/auth/session?view=access', '/api/payments/checkout']);
  assert.deepEqual(view.timings.map(entry => entry.timeoutMs), [15000, 20000]);
  assert.ok(view.timings.every(entry => entry.disposed), 'identity and checkout body reads both release their timers');
  assert.equal(bodies.length, 1, 'an uncertain response never automatically resubmits a purchase');
  await view.click();
  assert.equal(bodies.length, 2); assert.equal(bodies[0].purchase_request_id, bodies[1].purchase_request_id);
  assert.equal(view.values.size, 1, 'explicit retry uses the same persisted owner intention');
});

test('main missing access or an unconfirmed referral cannot allocate an intent, default a sponsor or create an invoice', async t => {
  const view = fixture(t, address => address ? { ok: false, error: 'pending' } : { ok: false, error: 'unavailable' });
  const calls = [];
  let available = false;
  t.mock.method(globalThis, 'fetch', async path => {
    calls.push(path); assert.equal(path, '/api/auth/session?view=access');
    return available ? Response.json({ authenticated: true, mode: 'better-auth', email, subject })
      : Response.json({ error: 'authentication_unavailable' }, { status: 503 });
  });
  await view.click(); available = true; await view.click();
  assert.equal(view.values.size, 0); assert.equal(calls.length, 2);
  assert.ok(view.timings.every(entry => entry.disposed));
  assert.ok(view.changes.filter(value => typeof value === 'string').some(value => /No se inició ningún cobro/.test(value)));
});
