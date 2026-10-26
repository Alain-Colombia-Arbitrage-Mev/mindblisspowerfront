import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash, createHmac } from 'node:crypto';
import { handleRegistrationPhone } from './registration-phone-auth.mjs';
import { handleRegistration } from './registration-auth.mjs';
import { fetchBetterAuth, betterAuthCookies } from './better-auth-bridge.mjs';
import { registrationPhoneProof, registrationPhoneProofCookie, registrationSmsRequired } from './registration-phone.mjs';

const env = { AUTH_PROVIDER: 'better-auth', NODE_ENV: 'production', AUTH_PUBLIC_ORIGIN: 'https://portal.example.test',
  BETTER_AUTH_BACKEND_URL: 'https://auth.example.test', AUTH_BFF_SHARED_SECRET: 'synthetic-shared-secret-at-least-thirty-two',
  BETTER_AUTH_REGISTRATION_SMS_REQUIRED: 'true' };
const proof = 'a'.repeat(43);
const flowId = 'b'.repeat(43);
const input = { email: ' MEMBER@example.test ', phoneNumber: '+573001234567', consent: true, consentVersion: 'registration-phone-v1' };
const verified = { ok: true, verified: true, purpose: 'registration', email: 'member@example.test', phoneNumber: input.phoneNumber, proof };
const form = { fullName: 'Synthetic Member', email: 'member@example.test', phoneNumber: input.phoneNumber,
  password: 'synthetic password 123', acceptsPrivacy: true, phoneNumberVerified: true, isAdmin: true };
const request = (body = input, options = {}) => new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/auth/register/phone/send`, {
  method: 'POST', headers: { origin: env.AUTH_PUBLIC_ORIGIN, 'cf-connecting-ip': '192.0.2.10',
    cookie: `__Secure-vp_registration_phone=${proof}; unrelated=private`, ...options }, body: JSON.stringify(body),
});

test('registration SMS is an exact server flag and cannot enable login or be activated from browser input', async () => {
  for (const flag of [undefined, false, true, 'TRUE', '1', 'false']) {
    const current = { ...env, BETTER_AUTH_REGISTRATION_SMS_REQUIRED: flag };
    assert.equal(registrationSmsRequired(current), false);
    const r = await handleRegistrationPhone(request({ ...input, BETTER_AUTH_REGISTRATION_SMS_REQUIRED: 'true' }), 'send', {
      env: current, fetchImpl: () => assert.fail('disabled registration contacted auth'),
    });
    assert.equal(r.status, 404);
  }
  for (const action of ['login', 'verify-phone', 'sign-in/phone-number', '../send']) {
    assert.equal((await handleRegistrationPhone(request(), action, { env })).status, 404);
  }
});

test('origin, E.164, explicit consent, flow and OTP are checked before contacting the auth service', async () => {
  const dependencies = { env, fetchImpl: () => assert.fail('invalid input reached auth') };
  assert.equal((await handleRegistrationPhone(request(input, { origin: 'https://evil.example' }), 'send', dependencies)).status, 403);
  for (const body of [null, [], {}, { ...input, email: 'invalid' }, { ...input, email: `${'a'.repeat(250)}@example.test` },
    { ...input, phoneNumber: '3001234567' }, { ...input, phoneNumber: '+57 3001234567' },
    { ...input, consent: false }, { ...input, consent: 'true' }, { ...input, consentVersion: 'sms-auth-v1' }]) {
    assert.equal((await handleRegistrationPhone(request(body), 'send', dependencies)).status, 400);
  }
  for (const extra of [{}, { flowId }, { flowId, code: '123' }, { flowId: '../send', code: '123456' }, { flowId, code: 123456 }]) {
    assert.equal((await handleRegistrationPhone(request({ ...input, ...extra }), 'verify', dependencies)).status, 400);
  }
});

test('send forwards only registration purpose fields once and does not forward any browser cookie or verified flag', async () => {
  let calls = 0;
  const response = await handleRegistrationPhone(request({ ...input, role: 'admin', phoneNumberVerified: true, url: 'https://evil.example' }), 'send', {
    env, fetchImpl: async (url, options) => {
      calls++;
      assert.equal(url, 'https://auth.example.test/api/auth/registration/phone/send');
      assert.deepEqual(JSON.parse(options.body), { ...input, email: 'member@example.test' });
      assert.equal(options.headers.cookie, '');
      assert.equal(options.cache, 'no-store');
      assert.equal(options.redirect, 'manual');
      return Response.json({ ok: true, flowId, resendAfter: 60, expiresIn: 300, privateDetail: 'must-not-leak' }, {
        headers: { 'set-cookie': 'better-auth.session_token=must-not-leak', 'set-auth-jwt': 'must-not-leak' },
      });
    },
  });
  assert.equal(response.status, 200); assert.equal(calls, 1);
  assert.deepEqual(await response.json(), { ok: true, flowId, resendAfter: 60, expiresIn: 300 });
  assert.match(response.headers.get('set-cookie'), /__Secure-vp_registration_phone=;.*Max-Age=0/);
  assert.doesNotMatch(response.headers.get('set-cookie'), /better-auth/);
  assert.equal(response.headers.get('set-auth-jwt'), null);
});

test('a verified SMS proof is HttpOnly, short-lived and registration-only; it never enters the browser JSON', async () => {
  const response = await handleRegistrationPhone(request({ ...input, flowId, code: '001234' }), 'verify', {
    env, fetchImpl: async (_url, options) => {
      assert.deepEqual(JSON.parse(options.body), { email: 'member@example.test', phoneNumber: input.phoneNumber, flowId, code: '001234' });
      return Response.json(verified);
    },
  });
  assert.equal(response.status, 200);
  const cookie = response.headers.get('set-cookie');
  for (const attribute of ['HttpOnly', 'SameSite=Strict', 'Secure', 'Max-Age=300', 'Path=/api/auth/register']) assert.ok(cookie.includes(attribute));
  assert.doesNotMatch(cookie, /Domain=/i);
  const json = await response.json();
  assert.deepEqual(json, { ok: true, verified: true, purpose: 'registration', email: 'member@example.test', phoneNumber: input.phoneNumber });
  assert.doesNotMatch(JSON.stringify(json), new RegExp(proof));
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
});

test('HTTP 200 or a code alone cannot verify a different email, phone, purpose or malformed acknowledgement', async () => {
  for (const payload of [{}, [], { ...verified, ok: false }, { ...verified, verified: false }, { ...verified, proof: 'short' },
    { ...verified, email: 'other@example.test' }, { ...verified, phoneNumber: '+12025550123' },
    { ...verified, purpose: 'login' }, { ...verified, session: { token: 'private' } }, { ...verified, token: 'private' }]) {
    const r = await handleRegistrationPhone(request({ ...input, flowId, code: '001234' }), 'verify', {
      env, fetchImpl: async () => Response.json(payload),
    });
    assert.equal(r.status, 503); assert.equal(r.headers.get('set-cookie'), null);
    assert.doesNotMatch(await r.text(), /private|short|other@example/);
  }
});

test('rate limits, provider failures and redirects are safe and never cause an automatic resend', async () => {
  for (const upstream of [new Response('provider-secret', { status: 503 }), new Response('provider-secret', { status: 302 }),
    Response.json({ message: 'provider-secret' }, { status: 429, headers: { 'retry-after': '120' } })]) {
    let calls = 0;
    const r = await handleRegistrationPhone(request(), 'send', { env, fetchImpl: async () => { calls++; return upstream; } });
    assert.equal(calls, 1); assert.ok([429, 503].includes(r.status));
    if (r.status === 429) assert.equal(r.headers.get('retry-after'), '120');
    assert.doesNotMatch(await r.text(), /provider-secret/);
  }
});

test('signup requires an opaque cookie and expected phone; it never trusts a browser verified flag', async () => {
  for (const cookie of ['', `vp_registration_phone=${proof}`, `__Secure-vp_registration_phone=short`,
    `__Secure-vp_registration_phone=${proof}; __Secure-vp_registration_phone=${proof}`]) {
    const r = await handleRegistration(request(form, { cookie }), 'register', {
      env, fetchImpl: () => assert.fail('missing/ambiguous proof reached signup'),
    });
    assert.equal(r.status, 400); assert.equal((await r.json()).code, 'REGISTRATION_PHONE_REQUIRED');
  }
  const r = await handleRegistration(request({ ...form, phoneNumber: '3001234567' }), 'register', {
    env, fetchImpl: () => assert.fail('invalid phone reached signup'),
  });
  assert.equal(r.status, 400);
});

test('the signup proof, expected phone and registration body are covered by the existing BFF HMAC', async () => {
  const r = await handleRegistration(request(form), 'register', { env, fetchImpl: async (url, options) => {
    assert.equal(url, 'https://auth.example.test/api/auth/sign-up/email');
    assert.deepEqual(JSON.parse(options.body), { name: form.fullName, email: form.email, password: form.password });
    const cookie = `__Secure-vp_registration_phone=${proof}; vp_registration_phone_expected=${form.phoneNumber}`;
    assert.equal(options.headers.cookie, cookie);
    const hash = value => createHash('sha256').update(value).digest('hex');
    assert.equal(options.headers['x-vp-auth-signature'], createHmac('sha256', env.AUTH_BFF_SHARED_SECRET).update([
      'POST', '/api/auth/sign-up/email', options.headers['x-vp-auth-timestamp'], '192.0.2.10', hash(cookie), hash(options.body),
    ].join('\n')).digest('hex'));
    return Response.json({ token: null, user: { id: 'synthetic', email: form.email, emailVerified: false } });
  } });
  assert.equal(r.status, 201);
  assert.match(r.headers.get('set-cookie'), /Max-Age=0/);
  const json = await r.json();
  assert.equal(json.userConfirmed, false); assert.equal(json.authenticated, undefined);
});

test('proof transport cannot be used for login, tokens, keys or other auth paths', async () => {
  for (const path of ['/sign-in/email', '/sign-in/email-otp', '/token', '/jwks', '/registration/phone/send']) {
    await assert.rejects(fetchBetterAuth(path, { method: 'POST', origin: env.AUTH_PUBLIC_ORIGIN, body: {},
      registrationPhoneProof: proof, registrationPhoneNumber: input.phoneNumber,
    }, { env, clientIp: '192.0.2.10', fetchImpl: () => assert.fail('proof escaped signup') }), /invalid_registration_phone_transport/);
  }
  assert.equal(betterAuthCookies(`__Secure-vp_registration_phone=${proof}`), '');
  assert.equal(registrationPhoneProof(`__Secure-vp_registration_phone=${proof}\r\nInjected: secret`), '');
  assert.throws(() => registrationPhoneProofCookie('invalid', true));
});
