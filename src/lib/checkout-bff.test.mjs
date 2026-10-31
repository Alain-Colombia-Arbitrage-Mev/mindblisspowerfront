import assert from 'node:assert/strict';
import test from 'node:test';
import { handleMembershipCheckout } from './checkout-bff.mjs';

const env = { AUTH_PUBLIC_ORIGIN: 'https://portal.example.test', VP_PAYMENTS_URL: 'https://payments.core.internal',
  PAYMENTS_SERVICE_TOKEN: 'synthetic-private-service-token', NOWPAYMENTS_API_KEY: 'synthetic-not-for-the-portal', NOWPAYMENTS_MEMBERSHIPS_ENABLED: 'true' };
const claims = { sub: 'stable-synthetic-subject', email: ' MEMBER@example.test ', email_verified: true,
  name: 'Synthetic Member', phone_number: '+12025550101', person_public_id: 'a02f5a55-5fa3-4239-845b-ac6b699110ee' };
const identity = async () => ({ token: 'synthetic-verified-jwt', claims });
const payload = { provider: 'nowpayments', url: 'https://nowpayments.io/payment/?iid=12345', total_usd: '101.00', fee_usd: '1.00', fulfillment_status: 'review_required' };
const form = { package_id: 1, provider: 'nowpayments', ref: 'MP-SYNTHETIC', ref_email: 'member@example.test', preferred_side: 'l',
  amount_usd: '0.01', person_id: 1, sponsor_id: 1, email: 'attacker@example.test', is_admin: true };
function request(body = form, extra = {}) {
  return new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/payments/checkout`, { method: 'POST',
    headers: { origin: env.AUTH_PUBLIC_ORIGIN, 'content-type': 'application/json', ...extra }, body: JSON.stringify(body) });
}
const run = (req = request(), overrides = {}) => handleMembershipCheckout(req, {
  env, identity, fetchImpl: async () => Response.json(payload), ...overrides,
});

test('checkout requires same-origin JSON and a verified stable identity before provider access', async () => {
  const noAccess = async () => assert.fail('invalid input reached backend');
  assert.equal((await run(request(form, { origin: 'https://admin.example.test' }), { identity: noAccess })).status, 403);
  assert.equal((await run(request(form, { 'content-type': 'text/plain' }), { identity: noAccess })).status, 415);
  for (const value of [null, { token: 'x', claims: { ...claims, email_verified: false } },
    { token: 'x', claims: { ...claims, sub: '' } }, { token: '', claims }]) {
    const response = await run(request(), { identity: async () => value, fetchImpl: noAccess });
    assert.equal(response.status, 401); assert.equal(response.headers.get('cache-control'), 'private, no-store');
  }
  const unavailable = await run(request(), { identity: async () => { throw new Error('private-auth-details'); }, fetchImpl: noAccess });
  assert.equal(unavailable.status, 503); assert.doesNotMatch(await unavailable.text(), /private-auth/);
});

test('provider and membership input are strictly bounded before creating a checkout', async () => {
  for (const body of [null, [], {}, { ...form, provider: 'wallet' }, { ...form, provider: null },
    { ...form, package_id: true }, { ...form, package_id: 1.2 }, { ...form, package_id: Number.MAX_SAFE_INTEGER + 1 },
    { ...form, ref: 'x'.repeat(65) }, { ...form, preferred_side: 'ROOT' }]) {
    assert.equal((await run(request(body), { fetchImpl: async () => assert.fail('invalid input reached backend') })).status, 400);
  }
  assert.equal((await run(request({ ...form, padding: 'x'.repeat(17000) }))).status, 413);
  assert.equal((await run(request(), { env: { ...env, PAYMENTS_SERVICE_TOKEN: '' } })).status, 503);
});

test('membership checkout forwards verified JWT and catalog ID, never client money, person or tree authority', async () => {
  const response = await run(request(), { fetchImpl: async (url, options) => {
    assert.equal(url, `${env.VP_PAYMENTS_URL}/api/payments/checkout`);
    assert.equal(options.redirect, 'manual'); assert.equal(options.cache, 'no-store');
    assert.equal(options.headers['X-VP-Id-Token'], 'synthetic-verified-jwt');
    assert.deepEqual(JSON.parse(options.body), { provider: 'nowpayments', email: 'member@example.test', package_id: 1,
      ref: 'MP-SYNTHETIC', preferred_side: 'L', name: 'Synthetic Member', phone: '+12025550101' });
    assert.doesNotMatch(JSON.stringify(options), /synthetic-not-for-the-portal|attacker|person_id|sponsor_id|is_admin|amount_usd/);
    return Response.json({ ...payload, private: 'private-account-data', token: 'private-token' }, { headers: { 'set-cookie': 'private-cookie' } });
  } });
  assert.equal(response.status, 200); assert.equal(response.headers.get('set-cookie'), null);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.deepEqual(await response.json(), { ...payload, checkout_environment: 'production' });
});

test('operational NOW checkout accepts awaiting payment only with zero added fee and retains exact server total', async () => {
  const operational = { ...payload, total_usd: '100.00', fee_usd: '0.00', fulfillment_status: 'awaiting_payment' };
  let calls = 0;
  const response = await run(request({ ...form, total_usd: '0.01', fee_usd: '0.00', fulfillment_status: 'activated' }), {
    fetchImpl: async (_url, options) => {
      calls++;
      assert.doesNotMatch(options.body, /amount_usd|total_usd|fee_usd|fulfillment_status|activated/);
      return Response.json({ ...operational, roi_usd: '999999', private_payload: 'not-public' });
    },
  });
  assert.equal(response.status, 200); assert.equal(calls, 1);
  assert.deepEqual(await response.json(), { ...operational, checkout_environment: 'production' });
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  for (const fee_usd of ['1.00', 0, null, undefined]) {
    const invalid = await run(request(), { fetchImpl: async () => Response.json({ ...operational, fee_usd }) });
    assert.equal(invalid.status, 502);
  }
});

test('unbound referral hints cannot influence another verified account and Stripe remains default', async () => {
  const response = await run(request({ package_id: 1, ref: 'MP-OTHER', ref_email: 'other@example.test', preferred_side: 'R' }), {
    env: { ...env, STRIPE_CHECKOUT_ENABLED: 'true' },
    fetchImpl: async (url, options) => {
      const body = JSON.parse(options.body); assert.equal(body.ref, ''); assert.equal(body.preferred_side, ''); assert.equal(body.provider, 'stripe');
      return Response.json({ url: 'https://checkout.stripe.com/c/pay/cs_live_Synthetic123#opaqueState', total_usd: '101.00', fee_usd: '1.00' });
    },
  });
  assert.equal(response.status, 200); assert.equal((await response.json()).provider, 'stripe');
});

test('Stripe checkout fails closed without the exact runtime flag, including direct and omitted-provider requests', async () => {
  let upstreamCalls = 0;
  const fetchImpl = async () => { upstreamCalls++; assert.fail('paused Stripe reached payments'); };
  for (const flag of [undefined, 'false', false, true, 1, '1', 'TRUE', ' true ', '']) {
    for (const provider of ['stripe', undefined]) {
      const response = await run(request({ package_id: 1, provider, STRIPE_CHECKOUT_ENABLED: 'true', stripeEnabled: true }), {
        env: { ...env, STRIPE_CHECKOUT_ENABLED: flag, NEXT_PUBLIC_STRIPE_CHECKOUT_ENABLED: 'true' }, fetchImpl,
      });
      assert.equal(response.status, 503);
      assert.deepEqual(await response.json(), { error: 'stripe_checkout_disabled' });
      assert.equal(response.headers.get('cache-control'), 'private, no-store');
    }
  }
  assert.equal(upstreamCalls, 0);
});

test('the Stripe pause does not change NOWPayments creation, provider or required review', async () => {
  for (const flag of [undefined, 'false', 'true']) {
    let calls = 0;
    const response = await run(request(), { env: { ...env, STRIPE_CHECKOUT_ENABLED: flag }, fetchImpl: async (_url, options) => {
      calls++;
      assert.equal(JSON.parse(options.body).provider, 'nowpayments');
      return Response.json(payload);
    } });
    assert.equal(calls, 1); assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ...payload, checkout_environment: 'production' });
  }
});

test('NOWPayments checkout requires its own exact server flag before any upstream creation', async () => {
  let upstreamCalls = 0;
  for (const enabled of [undefined, 'false', false, true, 1, '1', 'TRUE', ' true ', '']) {
    const response = await run(request({ ...form, NOWPAYMENTS_MEMBERSHIPS_ENABLED: 'true', nowpaymentsEnabled: true }), {
      env: { ...env, NOWPAYMENTS_MEMBERSHIPS_ENABLED: enabled, NEXT_PUBLIC_NOWPAYMENTS_MEMBERSHIPS_ENABLED: 'true', STRIPE_CHECKOUT_ENABLED: 'true' },
      fetchImpl: async () => { upstreamCalls++; assert.fail('disabled NOWPayments reached its provider service'); },
    });
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: 'nowpayments_checkout_disabled' });
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
  }
  assert.equal(upstreamCalls, 0);
});

test('enabling NOWPayments cannot admit Stripe or forward withdrawal/compensation authority', async () => {
  let calls = 0;
  const scopedEnv = { ...env, NOWPAYMENTS_MEMBERSHIPS_ENABLED: 'true', STRIPE_CHECKOUT_ENABLED: 'false',
    FINANCIAL_MUTATIONS_ENABLED: 'false', WITHDRAWALS_ENABLED: 'false' };
  const fetchImpl = async (_url, options) => {
    calls++;
    const body = JSON.parse(options.body);
    assert.equal(body.provider, 'nowpayments');
    assert.doesNotMatch(JSON.stringify(body), /withdraw|commission|activation|FINANCIAL|sponsor_id|person_id/);
    return Response.json(payload);
  };
  for (const provider of ['stripe', undefined]) {
    const response = await run(request({ ...form, provider }), { env: scopedEnv, fetchImpl });
    assert.equal(response.status, 503);
    assert.equal((await response.json()).error, 'stripe_checkout_disabled');
  }
  assert.equal(calls, 0);
  const response = await run(request({ ...form, withdrawals: true, commissions: true, activate: true }), { env: scopedEnv, fetchImpl });
  assert.equal(response.status, 200); assert.equal(calls, 1);
  assert.equal((await response.json()).fulfillment_status, 'review_required');
});

test('NOWPayments cannot fall back to Stripe and sandbox is allowed only by explicit server configuration', async () => {
  for (const body of [{ ...payload, provider: undefined }, { ...payload, provider: 'stripe' },
    { ...payload, url: 'https://checkout.stripe.com/c/pay/cs_live_Synthetic123' },
    { ...payload, url: 'https://sandbox.nowpayments.io/payment/?iid=12345' }, { ...payload, total_usd: 'NaN' },
    { ...payload, total_usd: 1.01 }, { ...payload, total_usd: '0.00' }, { ...payload, total_usd: '0101.00' },
    { ...payload, fee_usd: '102.00' }, { ...payload, fulfillment_status: undefined },
    { ...payload, fulfillment_status: 'activated' }, { ...payload, fulfillment_status: 'paid' }]) {
    assert.equal((await run(request(), { fetchImpl: async () => Response.json(body) })).status, 502);
  }
  const sandbox = await run(request(), { env: { ...env, NOWPAYMENTS_ENV: 'sandbox' }, fetchImpl: async () =>
    Response.json({ ...payload, url: 'https://sandbox.nowpayments.io/payment/?iid=12345' }) });
  assert.equal(sandbox.status, 200); assert.equal((await sandbox.json()).checkout_environment, 'sandbox');
});

test('errors, redirects and oversized provider responses are sanitized without hidden retries', async () => {
  for (const upstream of [Response.json({ error: 'private postgres://operator:password@host' }, { status: 500 }),
    new Response('private-provider-redirect', { status: 302, headers: { location: 'https://attacker.example.test' } }),
    Response.json({ ...payload, diagnostics: 'private'.repeat(4000) })]) {
    let calls = 0;
    const response = await run(request(), { fetchImpl: async () => { calls++; return upstream; } });
    assert.ok(response.status >= 400); assert.equal(calls, 1);
    assert.doesNotMatch(await response.text(), /private|password|postgres:|attacker/);
  }
  const blocked = await run(request(), { fetchImpl: async () => Response.json({ error: 'nowpayments-unavailable' }, { status: 503 }) });
  assert.equal(blocked.status, 503); assert.deepEqual(await blocked.json(), { error: 'nowpayments-unavailable' });
});

test('membership review conflicts and pre-creation disabled gates retain only approved safe error codes', async () => {
  for (const [error, status] of [['membership_payment_pending_review', 409], ['membership_eligibility_unavailable', 503],
    ['stripe_unavailable', 503], ['core_not_ready', 503], ['financial_review_required', 503], ['nowpayments_financial_configuration_unavailable', 503],
    ['upstream_unavailable', 503], ['nowpayments_checkout_unavailable', 503]]) {
    const response = await run(request(), { fetchImpl: async () => Response.json({ error, diagnostics: 'private-payment-details' }, { status }) });
    assert.equal(response.status, status); assert.deepEqual(await response.json(), { error });
  }
});

test('a canceled streamed provider response is bounded and never produces checkout success', async () => {
  const controller = new AbortController();
  const req = new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/payments/checkout`, { method: 'POST', headers: {
    origin: env.AUTH_PUBLIC_ORIGIN, 'content-type': 'application/json' }, body: JSON.stringify(form), signal: controller.signal });
  const response = await run(req, { fetchImpl: async () => {
    const body = new ReadableStream({ start() { queueMicrotask(() => controller.abort()); } });
    return new Response(body);
  } });
  assert.equal(response.status, 502); assert.deepEqual(await response.json(), { error: 'payments-unreachable' });
});
