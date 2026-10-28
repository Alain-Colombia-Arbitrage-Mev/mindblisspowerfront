import assert from 'node:assert/strict';
import test from 'node:test';
import { handleRegistration } from './registration-auth.mjs';

const env = { AUTH_PROVIDER: 'better-auth', NODE_ENV: 'production', AUTH_PUBLIC_ORIGIN: 'https://portal.example.test',
  BETTER_AUTH_BACKEND_URL: 'https://auth.example.test', AUTH_BFF_SHARED_SECRET: 'synthetic-proxy-signature-secret-longer-than-32' };
const form = { fullName: 'Synthetic Member', email: ' MEMBER@example.test ', password: 'synthetic password 123', acceptsPrivacy: true,
  referralCode: 'MP-SYNTHETIC', preferredSide: 'L', is_admin: true, personId: 'other', emailVerified: true };
const request = (body = form, origin = env.AUTH_PUBLIC_ORIGIN) => new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/auth/register`, {
  method: 'POST', headers: { origin, 'cf-connecting-ip': '192.0.2.10', 'content-type': 'application/json', cookie: 'unrelated=private' }, body: JSON.stringify(body),
});

test('registration validates provider, origin, body, consent and bounded fields before contacting auth', async () => {
  const dependencies = { env, fetchImpl: () => assert.fail('invalid request contacted auth') };
  assert.equal((await handleRegistration(request(), 'register', { ...dependencies, env: {} })).status, 404);
  assert.equal((await handleRegistration(request(form, 'https://attacker.example.test'), 'register', dependencies)).status, 403);
  for (const body of [null, [], {}, { ...form, fullName: 'a' }, { ...form, password: 'short' }, { ...form, password: 'a'.repeat(129) },
    { ...form, acceptsPrivacy: false }, { ...form, email: 'invalid' }, { ...form, preferredSide: 'ROOT' }, { ...form, referralCode: 'x'.repeat(65) }]) {
    assert.equal((await handleRegistration(request(body), 'register', dependencies)).status, 400);
  }
  assert.equal((await handleRegistration(request({ ...form, fullName: 'a'.repeat(33000) }), 'register', dependencies)).status, 413);
});

test('signup forwards only name/email/password through signed transport and never exposes session or tree permissions', async () => {
  const response = await handleRegistration(request(), 'register', { env, fetchImpl: async (url, options) => {
    assert.equal(url, 'https://auth.example.test/api/auth/sign-up/email');
    assert.deepEqual(JSON.parse(options.body), { name: form.fullName, email: 'member@example.test', password: form.password });
    assert.equal(options.headers.cookie, '');
    assert.match(options.headers['x-vp-auth-signature'], /^[0-9a-f]{64}$/);
    return Response.json({ token: null, user: { id: 'synthetic', email: 'member@example.test', emailVerified: false, role: 'not-trusted' } }, {
      headers: { 'set-cookie': 'better-auth.session_token=must-not-leak; Secure; HttpOnly', 'set-auth-jwt': 'must-not-leak' },
    });
  } });
  assert.equal(response.status, 201);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(response.headers.get('set-cookie'), null);
  assert.equal(response.headers.get('set-auth-jwt'), null);
  const body = await response.json();
  assert.equal(body.userConfirmed, false);
  assert.equal(body.resendAfter, 300);
  assert.equal(body.referralReviewRequired, true);
  assert.doesNotMatch(JSON.stringify(body), /must-not-leak|password|personId|role|not-trusted/);
});

test('confirmation uses email-verification OTP purpose and ends without authenticating or claiming a network node', async () => {
  const response = await handleRegistration(request({ email: 'member@example.test', code: '001-234' }), 'confirm', {
    env, fetchImpl: async (url, options) => {
      assert.equal(url, 'https://auth.example.test/api/auth/email-otp/verify-email');
      assert.deepEqual(JSON.parse(options.body), { email: 'member@example.test', otp: '001234' });
      return Response.json({ status: true, token: null, user: { id: 'synthetic' } });
    },
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.needsLogin, true);
  assert.match(body.redirectTo, /^\/login\?email=/);
  assert.equal(body.authenticated, undefined);
  assert.equal(response.headers.get('set-cookie'), null);
});

test('resend is explicit, purpose-bound and preserves server cooldown without hidden retries', async () => {
  let calls = 0;
  const response = await handleRegistration(request({ email: 'member@example.test', resend: true }), 'confirm', { env, fetchImpl: async (url, options) => {
    calls++;
    assert.equal(url, 'https://auth.example.test/api/auth/email-otp/send-verification-otp');
    assert.deepEqual(JSON.parse(options.body), { email: 'member@example.test', type: 'email-verification' });
    return Response.json({ message: 'private provider detail' }, { status: 429, headers: { 'retry-after': '450' } });
  } });
  assert.equal(calls, 1);
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('retry-after'), '450');
  assert.equal((await response.json()).retryAfter, 450);
});

test('unexpected successes and upstream diagnostics never become verified signup or exposed secrets', async () => {
  for (const upstream of [Response.json({ user: { id: 'synthetic', email: 'other@example.test', emailVerified: false } }),
    Response.json({ user: { id: 'synthetic', email: 'member@example.test', emailVerified: true } }),
    Response.json({ token: 'private-token', user: { id: 'synthetic', email: 'member@example.test', emailVerified: false } }),
    new Response('private-db-connection', { status: 503 }), new Response('private-redirect', { status: 302 })]) {
    const response = await handleRegistration(request(), 'register', { env, fetchImpl: async () => upstream });
    assert.equal(response.status, 503);
    assert.doesNotMatch(await response.text(), /private-db|private-token|private-redirect/);
  }
});

test('a confirmed signup delivery failure preserves only the normalized pending registration and manual retry budget', async () => {
  let calls = 0;
  const response = await handleRegistration(request(), 'register', { env, fetchImpl: async () => {
    calls++;
    return Response.json({ code: 'AUTH_EMAIL_DELIVERY_UNAVAILABLE', message: 'private-provider-diagnostic', email: 'attacker@example.test',
      token: 'private-session', user: { id: 'private-user', role: 'admin' } }, { status: 503, headers: {
      'retry-after': '1', 'set-cookie': 'better-auth.session_token=private-session; HttpOnly', 'set-auth-jwt': 'private-jwt',
    } });
  } });
  assert.equal(calls, 1);
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(response.headers.get('retry-after'), '300');
  assert.equal(response.headers.get('set-cookie'), null);
  assert.equal(response.headers.get('set-auth-jwt'), null);
  const body = await response.json();
  assert.equal(body.code, 'EMAIL_DELIVERY_UNAVAILABLE');
  assert.equal(body.registrationPending, true);
  assert.equal(body.email, 'member@example.test');
  assert.equal(body.requiresConfirmation, true);
  assert.equal(body.retryAfter, 300);
  assert.equal(body.ok, undefined);
  assert.doesNotMatch(JSON.stringify(body), /private-|attacker|token|role|userConfirmed/);
});

test('only the exact signup 503 code offers pending recovery; resend never implies account creation', async () => {
  for (const [status, code] of [[500, 'AUTH_EMAIL_DELIVERY_UNAVAILABLE'], [400, 'AUTH_EMAIL_DELIVERY_UNAVAILABLE'],
    [503, 'AUTH_EMAIL_DELIVERY_UNAVAILABLE_EXTRA'], [503, 'authentication_unavailable']]) {
    const response = await handleRegistration(request(), 'register', { env, fetchImpl: async () => Response.json({ code, registrationPending: true,
      email: 'member@example.test', requiresConfirmation: true }, { status }) });
    const body = await response.json();
    assert.equal(body.registrationPending, undefined);
    assert.equal(body.email, undefined);
    assert.notEqual(body.code, 'EMAIL_DELIVERY_UNAVAILABLE');
  }
  const response = await handleRegistration(request({ email: 'member@example.test', resend: true }), 'confirm', {
    env, fetchImpl: async () => Response.json({ code: 'AUTH_EMAIL_DELIVERY_UNAVAILABLE' }, { status: 503 }),
  });
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('retry-after'), '300');
  const body = await response.json();
  assert.equal(body.code, 'EMAIL_DELIVERY_UNAVAILABLE');
  assert.equal(body.registrationPending, undefined);
  assert.equal(body.email, undefined);
});
