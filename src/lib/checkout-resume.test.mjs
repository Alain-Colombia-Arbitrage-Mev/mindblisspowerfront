import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { handleStripeResume } from './checkout-resume.mjs';

const env = { VP_PAYMENTS_URL: 'https://payments.core.internal', PAYMENTS_SERVICE_TOKEN: 'synthetic-service-only' };
const request = () => new Request('https://portal.example.test/api/pay/resume?t=synthetic%2Bbearer');
const fallback = 'https://portal.example.test/dashboard/packages';

test('public Stripe resume cannot create a checkout without the exact runtime flag', async () => {
  let calls = 0;
  for (const flag of [undefined, 'false', false, true, 'TRUE', ' true ', '1']) {
    const response = await handleStripeResume(request(), { env: { ...env, STRIPE_CHECKOUT_ENABLED: flag },
      fetchImpl: async () => { calls++; assert.fail('paused resume reached payments'); } });
    assert.equal(response.status, 303); assert.equal(response.headers.get('location'), fallback);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    assert.doesNotMatch(await response.text(), /bearer|service-only/);
  }
  assert.equal(calls, 0);
});

test('enabled resume preserves the HMAC bearer contract and redirects only to validated Stripe checkout', async () => {
  let calls = 0;
  const response = await handleStripeResume(request(), { env: { ...env, STRIPE_CHECKOUT_ENABLED: 'true' },
    fetchImpl: async (url, options) => {
      calls++; assert.equal(url, `${env.VP_PAYMENTS_URL}/api/payments/resume?t=synthetic%2Bbearer`);
      assert.equal(options.headers['X-VP-Service-Token'], env.PAYMENTS_SERVICE_TOKEN);
      assert.equal(options.cache, 'no-store'); assert.equal(options.redirect, 'manual');
      assert.ok(options.signal instanceof AbortSignal);
      return Response.json({ url: 'https://checkout.stripe.com/c/pay/cs_live_Synthetic123#opaque' });
    } });
  assert.equal(calls, 1); assert.equal(response.status, 303);
  assert.equal(response.headers.get('location'), 'https://checkout.stripe.com/c/pay/cs_live_Synthetic123#opaque');
});

test('invalid, expired or redirected resume results never become a cross-provider or untrusted navigation', async () => {
  for (const upstream of [Response.json({ error: 'expired' }, { status: 403 }),
    Response.json({ url: 'https://attacker.example.test' }), Response.json({ url: 'https://nowpayments.io/payment/?iid=1' }),
    new Response(null, { status: 302, headers: { Location: 'https://checkout.stripe.com/c/pay/cs_live_Synthetic123' } })]) {
    let calls = 0;
    const response = await handleStripeResume(request(), { env: { ...env, STRIPE_CHECKOUT_ENABLED: 'true' },
      fetchImpl: async () => { calls++; return upstream; } });
    assert.equal(calls, 1); assert.equal(response.headers.get('location'), fallback);
  }
});

test('resume rejects other methods and skips upstream for missing configuration or bearer', async () => {
  const fetchImpl = async () => assert.fail('incomplete resume reached payments');
  for (const [input, config] of [[new Request('https://portal.example.test/api/pay/resume'), env],
    [request(), {}]]) {
    const response = await handleStripeResume(input, { env: { ...config, STRIPE_CHECKOUT_ENABLED: 'true' }, fetchImpl });
    assert.equal(response.headers.get('location'), fallback);
  }
  const denied = await handleStripeResume(new Request(request(), { method: 'POST' }), { env, fetchImpl });
  assert.equal(denied.status, 405);
});

test('the deployed resume route reads request runtime bindings, never a build-time public flag', () => {
  const route = readFileSync(new URL('../app/api/pay/resume/route.js', import.meta.url), 'utf8');
  assert.match(route, /handleStripeResume\(request, \{ env: runtimeEnvironment\(\), fetchImpl: coreFetch \}\)/);
  assert.doesNotMatch(route, /NEXT_PUBLIC|process\.env/);
});
