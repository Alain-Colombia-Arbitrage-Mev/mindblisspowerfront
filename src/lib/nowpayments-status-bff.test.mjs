import assert from 'node:assert/strict';
import test from 'node:test';
import { handleNOWPaymentsStatus } from './nowpayments-status-bff.mjs';

const orderId = 'a02f5a55-5fa3-4239-845b-ac6b699110ee';
const receipt = { provider: 'nowpayments', order_id: orderId, state: 'completed', payment_confirmed: true,
  signature_validated: true, provider_verified: true, persisted: true, fulfillment_status: 'not_activated' };
const env = { NOWPAYMENTS_WEBHOOK_ENABLED: 'true', NOWPAYMENTS_MEMBERSHIPS_ENABLED: 'false', STRIPE_CHECKOUT_ENABLED: 'false', PAYMENTS_SERVICE_TOKEN: 'synthetic-service' };
const identity = async () => ({ token: 'synthetic-private-jwt', claims: { sub: 'synthetic-subject', email: 'member@example.test',
  email_verified: true, person_public_id: '00000000-0000-4000-8000-000000000001' } });
const request = (query = `order_id=${orderId}`) => new Request(`https://portal.example.test/api/payments/nowpayments/status?${query}`,
  { headers: { cookie: 'private-browser-cookie', authorization: 'Bearer private-injected-token' } });
const run = (req = request(), overrides = {}) => handleNOWPaymentsStatus(req, { env, identity, fetchImpl: async () => Response.json(receipt), ...overrides });
const noUpstream = () => assert.fail('invalid status request reached an upstream service');

test('receipt lookup accepts one canonical order hint and verifies its session before the fixed private GET', async () => {
  for (const query of ['', `order_id=${orderId}&order_id=${orderId}`, `order_id=${orderId.toUpperCase()}`, `order_id=${orderId}&email=other@example.test`, 'order_id=00000000-0000-0000-0000-000000000000']) {
    assert.equal((await run(request(query), { identity: noUpstream, fetchImpl: noUpstream })).status, 400);
  }
  for (const value of [null, { token: 'private', claims: {} }, { token: 'private', claims: { email_verified: false } }]) {
    assert.equal((await run(request(), { identity: async () => value, fetchImpl: noUpstream })).status, 401);
  }
  assert.equal((await run(request(), { env: { ...env, NOWPAYMENTS_WEBHOOK_ENABLED: 'false' }, identity: noUpstream, fetchImpl: noUpstream })).status, 503);
  let calls = 0;
  const response = await run(request(), { fetchImpl: async (target, options) => {
    calls++; assert.equal(target, `https://payments.core.internal/api/payments/nowpayments/status?order_id=${orderId}`);
    assert.equal(options.method, 'GET'); assert.equal(options.cache, 'no-store'); assert.equal(options.redirect, 'manual');
    assert.deepEqual(options.headers, { 'X-VP-Service-Token': 'synthetic-service', 'X-VP-Id-Token': 'synthetic-private-jwt' });
    assert.doesNotMatch(JSON.stringify(options), /private-browser|private-injected/);
    return Response.json({ ...receipt, token: 'private-response-token', provider_payload: 'private-provider-body' }, { headers: { 'set-cookie': 'private-cookie' } });
  } });
  assert.equal(calls, 1); assert.equal(response.status, 200); assert.deepEqual(await response.json(), receipt);
  assert.equal(response.headers.get('set-cookie'), null); assert.equal(response.headers.get('cache-control'), 'private, no-store');
});

test('only persisted, signed, provider-verified completed evidence survives; another order or activation claim does not', async () => {
  for (const change of [{ order_id: '00000000-0000-4000-8000-000000000001' }, { provider: 'stripe' }, { persisted: false },
    { signature_validated: false }, { provider_verified: false }, { payment_confirmed: 'true' }, { fulfillment_status: 'activated' }, { state: 'pending' }]) {
    const result = await run(request(), { fetchImpl: async () => Response.json({ ...receipt, ...change }) });
    assert.equal(result.status, 503); assert.doesNotMatch(await result.text(), /"payment_confirmed":true|activated/);
  }
  for (const state of ['pending', 'under_review']) {
    const payload = { ...receipt, state, payment_confirmed: false, signature_validated: false, provider_verified: false, persisted: false };
    const result = await run(request(), { fetchImpl: async () => Response.json(payload) });
    assert.equal(result.status, 200); assert.deepEqual(await result.json(), payload);
  }
});

test('unknown ownership, quarantine, malformed responses and outages never become a completed receipt or leak metadata', async () => {
  for (const status of [401, 403, 404, 429, 302, 500, 503]) {
    const result = await run(request(), { fetchImpl: async () => Response.json({ ...receipt, details: 'private-ownership-error' },
      { status, headers: { 'set-cookie': 'private-cookie', location: 'https://evil.example.test', 'retry-after': '10000' } }) });
    assert.ok(result.status >= 400); assert.equal(result.headers.get('set-cookie'), null); assert.equal(result.headers.get('location'), null);
    assert.doesNotMatch(await result.text(), /private-|completed|payment_confirmed/);
    if (status === 429) assert.equal(result.headers.get('retry-after'), '60');
  }
  for (const upstream of [Response.json({ ...receipt, padding: 'x'.repeat(4096) }), Response.json({}), new Response('invalid-json'),
    new Response(JSON.stringify(receipt), { headers: { 'content-type': 'text/plain' } })]) {
    assert.equal((await run(request(), { fetchImpl: async () => upstream })).status, 503);
  }
  const controller = new AbortController();
  const cancelled = await run(new Request(request(), { signal: controller.signal }), { fetchImpl: async () => new Response(new ReadableStream({
    start() { queueMicrotask(() => controller.abort()); },
  }), { headers: { 'content-type': 'application/json' } }) });
  assert.equal(cancelled.status, 503);
});
