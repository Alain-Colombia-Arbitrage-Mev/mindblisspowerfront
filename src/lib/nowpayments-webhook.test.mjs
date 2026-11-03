import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test from 'node:test';
import { handleNOWPaymentsWebhook, NOWPAYMENTS_CALLBACK_TIMEOUT_MS } from './nowpayments-webhook.mjs';

const env = { NOWPAYMENTS_WEBHOOK_ENABLED: 'true', PAYMENTS_SERVICE_TOKEN: 'synthetic-private-service-token',
  VP_PAYMENTS_URL: 'https://must-not-be-used.example.test', NOWPAYMENTS_API_KEY: 'synthetic-must-not-be-forwarded' };
const raw = '{\n  "payment_id": "12345", "order_id": "a02f5a55-5fa3-4239-845b-ac6b699110ee",\n  "invoice_id": "67890", "payment_status": "finished", "price_amount": 101.00\n}';
// Real canonical HMAC with a synthetic key; validation belongs to Go, while the
// BFF must preserve the original spaced JSON and 101.00 numeric representation.
const canonical = JSON.stringify(Object.fromEntries(Object.entries(JSON.parse(raw)).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)));
const signature = createHmac('sha512', 'synthetic-ipn-secret').update(canonical).digest('hex');
const ack = { received: true, mode: 'capture_only', state: 'captured', fulfillment_status: 'not_activated' };
function request(body = raw, extra = {}, signal) {
  return new Request('https://portal.example.test/api/webhooks/nowpayments', { method: 'POST',
    headers: { 'content-type': 'application/json', 'x-nowpayments-sig': signature, ...extra }, body, signal });
}
const run = (req = request(), overrides = {}) => handleNOWPaymentsWebhook(req, {
  env, fetchImpl: async () => Response.json(ack), ...overrides,
});
const noBackend = async () => assert.fail('rejected callback reached backend');

test('capture deadline accommodates the bounded provider verification without retries or an unbounded wait', async t => {
  const timeout = AbortSignal.timeout.bind(AbortSignal), deadlines = [];
  t.mock.method(AbortSignal, 'timeout', value => { deadlines.push(value); return timeout(value); });
  assert.equal((await run()).status, 200);
  assert.equal(NOWPAYMENTS_CALLBACK_TIMEOUT_MS, 20000);
  assert.deepEqual(deadlines, [20000]);
});

test('callback is explicitly disabled by default before reading the body or calling Core', async () => {
  for (const enabled of [undefined, 'false', true, 'TRUE', '1']) {
    const req = { method: 'POST', get body() { assert.fail('disabled callback read body'); } };
    const response = await run(req, { env: { NOWPAYMENTS_WEBHOOK_ENABLED: enabled }, fetchImpl: noBackend });
    assert.equal(response.status, 503); assert.equal(response.headers.get('cache-control'), 'private, no-store');
    assert.deepEqual(await response.json(), { error: 'payment_callback_unavailable' });
  }
});

test('unsigned, malformed-signature, non-JSON and invalid-JSON callbacks never reach Core', async () => {
  for (const sig of ['', 'a'.repeat(127), 'a'.repeat(129), 'g'.repeat(128), `${signature.slice(0, 63)} ${signature.slice(64)}`, `${signature},${signature}`]) {
    assert.equal((await run(request(raw, { 'x-nowpayments-sig': sig }), { fetchImpl: noBackend })).status, 401);
  }
  assert.equal((await run(request(raw, { 'content-type': 'text/plain' }), { fetchImpl: noBackend })).status, 415);
  for (const invalid of ['broken-json', 'null', '[]', '"string"']) {
    assert.equal((await run(request(invalid), { fetchImpl: noBackend })).status, 400);
  }
  assert.equal((await run(request(new Uint8Array([255])), { fetchImpl: noBackend })).status, 400);
  assert.equal((await run(new Request('https://portal.example.test/api/webhooks/nowpayments'), { fetchImpl: noBackend })).status, 405);
});

test('raw payload cap is enforced on actual stream bytes even without a trustworthy Content-Length', async () => {
  assert.equal((await run(request(' '.repeat(131073)), { fetchImpl: noBackend })).status, 413);
  assert.equal((await run(request(raw, { 'content-length': '131073' }), { fetchImpl: noBackend })).status, 413);
  assert.equal((await run(request(' '.repeat(131073), { 'content-length': '1' }), { fetchImpl: noBackend })).status, 413);
});

test('a signed callback needs no cookie/origin/JWT and preserves raw JSON bytes to one fixed private target', async () => {
  let calls = 0;
  const response = await run(request(raw, { cookie: 'private-browser-cookie', origin: 'https://untrusted.example.test',
    authorization: 'Bearer private-browser-token', 'x-vp-id-token': 'private-spoofed-token', 'x-forwarded-host': 'attacker.example.test' }), {
    fetchImpl: async (url, options) => {
      calls++; assert.equal(url, 'https://payments.core.internal/api/webhooks/nowpayments');
      assert.equal(options.redirect, 'manual'); assert.equal(options.cache, 'no-store');
      assert.ok(options.body instanceof Uint8Array); assert.equal(Buffer.from(options.body).toString('utf8'), raw);
      assert.deepEqual(options.headers, { 'content-type': 'application/json', 'x-nowpayments-sig': signature,
        'X-VP-Service-Token': env.PAYMENTS_SERVICE_TOKEN });
      assert.doesNotMatch(JSON.stringify(options), /private-browser|private-spoofed|attacker|synthetic-must-not-be-forwarded/);
      return Response.json({ ...ack, payment: 'private-payment-detail', jwt: 'private-jwt' }, {
        headers: { 'set-cookie': 'private-cookie', 'x-provider-key': 'private-key' },
      });
    },
  });
  assert.equal(calls, 1); assert.equal(response.status, 200); assert.deepEqual(await response.json(), ack);
  assert.equal(response.headers.get('set-cookie'), null); assert.equal(response.headers.get('x-provider-key'), null);
});

test('upstream failures and redirects are never acknowledged and leak no diagnostic bodies or headers', async () => {
  for (const status of [400, 401, 403, 404, 409, 413, 415, 422, 429, 302, 500, 503]) {
    let calls = 0;
    const response = await run(request(), { fetchImpl: async () => {
      calls++; return Response.json({ received: true, diagnostics: 'private-postgres-password', ...ack }, { status,
        headers: { location: 'https://attacker.example.test', 'set-cookie': 'private-cookie' } });
    } });
    assert.ok(response.status >= 400); assert.equal(calls, 1); assert.equal(response.headers.get('location'), null);
    assert.doesNotMatch(await response.text(), /received|private|password|attacker/);
  }
  const network = await run(request(), { fetchImpl: async () => { throw new Error('private-transport-secret'); } });
  assert.equal(network.status, 503); assert.doesNotMatch(await network.text(), /private|received/);
});

test('only bounded JSON HTTP200 capture acknowledgement is relayed; captured never means completed or activated', async () => {
  for (const upstream of [Response.json({ ...ack, received: false }), Response.json({ ...ack, received: 'true' }),
    Response.json({ ...ack, fulfillment_status: 'activated' }), Response.json({ ...ack, state: 'activated' }),
    Response.json({ ...ack, state: 'closed_reviewed' }), Response.json(ack, { status: 201 }),
    new Response('private-not-json', { headers: { 'content-type': 'application/json' } }),
    new Response(JSON.stringify(ack), { headers: { 'content-type': 'text/plain' } }),
    Response.json({ ...ack, private: 'x'.repeat(4096) })]) {
    const response = await run(request(), { fetchImpl: async () => upstream });
    assert.equal(response.status, 503); assert.doesNotMatch(await response.text(), /received|activated|private/);
  }
  for (const state of ['invoice_created', 'invoice_unknown', 'pending_review', 'completed']) {
    const response = await run(request(), { fetchImpl: async () => Response.json({ ...ack, state }) });
    assert.equal(response.status, 503);
  }
  for (const value of [{ ...ack, mode: undefined }, { received: true, state: 'pending_review', fulfillment_status: 'review_required' }]) {
    assert.equal((await run(request(), { fetchImpl: async () => Response.json(value) })).status, 503);
  }
  const response = await run(); assert.equal(response.status, 200); assert.deepEqual(await response.json(), ack);
});

test('cancellation aborts a stalled upstream body and returns a retryable failure without a false ACK', async () => {
  const controller = new AbortController();
  const response = await run(request(raw, {}, controller.signal), { fetchImpl: async () => new Response(new ReadableStream({
    start() { queueMicrotask(() => controller.abort()); },
  }), { headers: { 'content-type': 'application/json' } }) });
  assert.equal(response.status, 503); assert.doesNotMatch(await response.text(), /received/);
});
