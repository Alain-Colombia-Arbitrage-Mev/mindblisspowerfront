import test from 'node:test';
import assert from 'node:assert/strict';
import { nowpaymentsPurchases, nowpaymentsResume, nowpaymentsCancellation, readNOWPaymentsPurchases,
  resumeNOWPaymentsPurchase, cancelNOWPaymentsPurchase, nowpaymentsPurchaseLabel, nowpaymentsPurchaseError } from './nowpayments-purchases.mjs';
import { handleNOWPaymentsPurchases } from './nowpayments-purchases-bff.mjs';

const orderId = 'a02f5a55-5fa3-4239-845b-ac6b699110ee';
const otherId = 'a02f5a55-5fa3-4239-845b-ac6b699110ef';
const item = () => ({ order_id: orderId, package_id: 1, package_name: 'Synthetic membership', total_usd: '100.00', fee_usd: '0.00',
  created_at: '2026-10-31T12:00:00Z', updated_at: '2026-10-31T12:00:00Z', payment_status: 'awaiting_payment',
  fulfillment_status: 'awaiting_payment', can_resume: true, can_cancel: true, cancelled_at: null });
const history = () => ({ provider: 'nowpayments', purpose: 'membership', purchases: [item()], has_more: false });
const resumed = () => ({ url: 'https://nowpayments.io/payment/?iid=12345', order_id: orderId, provider: 'nowpayments',
  total_usd: '100.00', fee_usd: '0.00', fulfillment_status: 'awaiting_payment', reused: true });
const cancelled = () => ({ order_id: orderId, state: 'cancelled_local', provider_invoice_revoked: false, late_payment_policy: 'review_required' });
const env = { AUTH_PUBLIC_ORIGIN: 'https://portal.example.test', PAYMENTS_SERVICE_TOKEN: 'synthetic-private-service', NOWPAYMENTS_MEMBERSHIPS_ENABLED: 'false' };
const identity = async () => ({ token: 'synthetic-verified-jwt', claims: { sub: 'synthetic-subject', email: 'member@example.test',
  email_verified: true, person_public_id: otherId } });
const request = (action = 'history', body = { order_id: orderId }, extraHeaders = {}) => new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/payments/nowpayments/purchases${action === 'history' ? '' : `/${action}`}`, {
  method: action === 'history' ? 'GET' : 'POST', headers: { origin: env.AUTH_PUBLIC_ORIGIN, 'content-type': 'application/json',
    cookie: 'private-browser-cookie', authorization: 'Bearer injected-browser-token', ...extraHeaders },
  ...(action === 'history' ? {} : { body: JSON.stringify(body) }),
});
const run = (action = 'history', req = request(action), overrides = {}) => handleNOWPaymentsPurchases(req, { action, env, identity,
  fetchImpl: async () => Response.json(action === 'history' ? history() : action === 'resume' ? resumed() : cancelled()), ...overrides });
const forbidden = () => assert.fail('invalid request reached private service');

test('history projects membership purchases, preserves independent same-SKU orders and rejects partial/malformed lists instead of claiming empty', () => {
  const source = history(); source.purchases.push({ ...item(), order_id: otherId });
  source.purchases[0].private_token = 'not-public'; source.provider_payload = 'not-public';
  const projected = nowpaymentsPurchases(source);
  assert.equal(projected.purchases.length, 2); assert.equal(projected.purchases[0].package_id, projected.purchases[1].package_id);
  assert.doesNotMatch(JSON.stringify(projected), /private_token|provider_payload|not-public/);
  assert.equal(nowpaymentsPurchases({ ...history(), purchases: [] }).purchases.length, 0);
  for (const value of [null, {}, { ...history(), purpose: 'topup' }, { ...history(), purchases: null },
    { ...history(), purchases: [item(), item()] }, { ...history(), purchases: Array(101).fill(item()) },
    ...[{ can_resume: 'true' }, { package_id: '1' }, { total_usd: 100 }, { fee_usd: '101.00' }, { payment_status: 'paid' },
      { created_at: null }, { updated_at: 'invalid' }, { package_name: '' }, { cancelled_at: 'invalid' },
      { payment_status: 'cancelled_local', can_resume: true }, { fulfillment_status: 'activated' }]
      .map(change => ({ ...history(), purchases: [{ ...item(), ...change }] }))]) assert.equal(nowpaymentsPurchases(value), null);
  assert.equal(nowpaymentsPurchaseLabel({ ...item(), payment_status: 'completed', fulfillment_status: 'awaiting_payment' }), 'Pago confirmado');
  assert.equal(nowpaymentsPurchaseLabel({ ...item(), payment_status: 'completed', fulfillment_status: 'activated' }), 'Membresía activada');
});

test('resume accepts only the existing canonical invoice and cancellation cannot claim provider revocation/refund', () => {
  assert.deepEqual(nowpaymentsResume(resumed(), orderId), resumed());
  for (const change of [{ order_id: otherId }, { reused: false }, { fulfillment_status: 'activated' },
    { provider: 'stripe' }, { url: 'https://evil.example.test/payment/?iid=1' }, { url: 'https://nowpayments.io/login?iid=1' },
    { url: 'https://nowpayments.io/payment/?iid=1&iid=2' }, { url: 'javascript:alert(1)' }]) assert.equal(nowpaymentsResume({ ...resumed(), ...change }, orderId), null);
  assert.deepEqual(nowpaymentsCancellation(cancelled(), orderId), cancelled());
  for (const change of [{ order_id: otherId }, { state: 'refunded' }, { provider_invoice_revoked: true },
    { late_payment_policy: 'auto_refund' }, { provider_invoice_revoked: 'false' }]) assert.equal(nowpaymentsCancellation({ ...cancelled(), ...change }, orderId), null);
});

test('owner history requires a verified binding and never accepts another owner/filter in the URL', async () => {
  for (const claims of [{}, { sub: 'x', email_verified: false, person_public_id: otherId }, { sub: '', email_verified: true, person_public_id: otherId },
    { sub: 'x', email_verified: true, person_public_id: '' }]) assert.equal((await run('history', request(), { identity: async () => ({ token: 'x', claims }), fetchImpl: forbidden })).status, 401);
  assert.equal((await run('history', new Request(`${request().url}?email=other@example.test`), { identity: forbidden })).status, 400);
  assert.equal((await run('history', request(), { identity: async () => { throw new Error('private-auth'); } })).status, 503);
  assert.equal((await run('history', request(), { env: {}, identity: forbidden })).status, 503);
  const response = await run(); assert.equal(response.status, 200, 'paused checkout cannot hide existing owner history');
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
});

test('resume/cancel require same-origin JSON and only an order UUID before forwarding a single fixed private request', async () => {
  for (const action of ['resume', 'cancel']) {
    for (const body of [null, [], {}, { order_id: otherId.toUpperCase() }, { order_id: orderId, email: 'other@example.test' },
      { order_id: orderId, total_usd: '0.01' }, { order_id: orderId, url: 'https://evil.example.test' }]) {
      assert.equal((await run(action, request(action, body), { fetchImpl: forbidden })).status, 400);
    }
    assert.equal((await run(action, request(action, { order_id: orderId }, { origin: 'https://admin.example.test' }), { identity: forbidden })).status, 403);
    assert.equal((await run(action, request(action, { order_id: orderId }, { 'sec-fetch-site': 'cross-site' }), { identity: forbidden })).status, 403);
    assert.equal((await run(action, request(action, { order_id: orderId }, { 'content-type': 'text/plain' }), { identity: forbidden })).status, 415);
    let calls = 0;
    const result = await run(action, request(action), { fetchImpl: async (target, options) => {
      calls++; assert.equal(target, `https://payments.core.internal/api/payments/nowpayments/purchases/${action}`);
      assert.equal(options.method, 'POST'); assert.equal(options.cache, 'no-store'); assert.equal(options.redirect, 'manual');
      assert.deepEqual(JSON.parse(options.body), { order_id: orderId });
      assert.deepEqual(options.headers, { 'X-VP-Service-Token': 'synthetic-private-service', 'X-VP-Id-Token': 'synthetic-verified-jwt', 'content-type': 'application/json' });
      assert.doesNotMatch(JSON.stringify(options), /private-browser|injected-browser|email|amount|provider_url/);
      return Response.json({ ...(action === 'resume' ? resumed() : cancelled()), private: 'private-response' }, { headers: { 'set-cookie': 'private-cookie', location: 'https://evil.example.test' } });
    } });
    assert.equal(calls, 1); assert.equal(result.status, 200); assert.equal(result.headers.get('set-cookie'), null); assert.equal(result.headers.get('location'), null);
    assert.doesNotMatch(await result.text(), /private-response/);
  }
});

test('malformed/oversized upstream content, redirects and unknown errors never become a usable purchase or expose details', async () => {
  for (const upstream of [Response.json({}), Response.json({ ...history(), padding: 'x'.repeat(131072) }),
    new Response(JSON.stringify(history()), { headers: { 'content-type': 'text/plain' } }),
    Response.json({ error: 'private postgres://password@host' }, { status: 500 }),
    new Response('', { status: 302, headers: { location: 'https://evil.example.test' } })]) {
    const response = await run('history', request(), { fetchImpl: async () => upstream });
    assert.equal(response.status, 503); assert.doesNotMatch(await response.text(), /password|postgres|"purchases":|evil/);
  }
  for (const error of ['purchase_cannot_cancel', 'purchase_cannot_resume', 'purchase_not_found']) {
    const response = await run('cancel', request('cancel'), { fetchImpl: async () => Response.json({ error, private: 'not-public' }, { status: 409 }) });
    assert.equal(response.status, 409); assert.deepEqual(await response.json(), { error });
  }
  const controller = new AbortController();
  const response = await run('history', new Request(request(), { signal: controller.signal }), { fetchImpl: async () => new Response(new ReadableStream({
    start() { queueMicrotask(() => controller.abort()); },
  }), { headers: { 'content-type': 'application/json' } }) });
  assert.equal(response.status, 503);
});

test('browser transport never retries mutations, never sends owner/money and validates each acknowledgement before returning', async () => {
  for (const [action, operation, payload] of [['history', readNOWPaymentsPurchases, history()], ['resume', resumeNOWPaymentsPurchase, resumed()], ['cancel', cancelNOWPaymentsPurchase, cancelled()]]) {
    let calls = 0;
    const options = { fetchImpl: async (target, init) => {
      calls++; assert.equal(target, `/api/payments/nowpayments/purchases${action === 'history' ? '' : `/${action}`}`);
      assert.equal(init.cache, 'no-store'); assert.equal(init.credentials, 'same-origin'); assert.equal(init.redirect, 'error');
      assert.equal(init.method, action === 'history' ? 'GET' : 'POST');
      if (action !== 'history') assert.deepEqual(JSON.parse(init.body), { order_id: orderId });
      return Response.json(payload);
    } };
    await (action === 'history' ? operation(options) : operation(orderId, options)); assert.equal(calls, 1);
    calls = 0;
    const failure = { fetchImpl: async () => { calls++; throw new Error('private transport failure'); } };
    await assert.rejects(action === 'history' ? operation(failure) : operation(orderId, failure)); assert.equal(calls, 1);
  }
  for (const code of ['private-email@example.test', 'postgres://password@host', '<script>', null, {}]) {
    assert.doesNotMatch(nowpaymentsPurchaseError(code), /private-email|postgres|password|script/);
  }
});
