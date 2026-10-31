import assert from 'node:assert/strict';
import test from 'node:test';
import { proxyPhoneOptIn, SMS_CONSENT_VERSION } from './phone-opt-in-bff.mjs';

const env = { AUTH_PROVIDER: 'better-auth', NODE_ENV: 'production', AUTH_PUBLIC_ORIGIN: 'https://portal.example.test',
  BETTER_AUTH_BACKEND_URL: 'https://auth.example.test', AUTH_BFF_SHARED_SECRET: 'synthetic-proxy-secret-greater-than-thirty-two' };
const phoneNumber = '+573001234567';
const cookie = 'better-auth.session_token=synthetic';
const status = { available: true, consentVersion: SMS_CONSENT_VERSION, optedIn: false, phoneNumber: null, phoneNumberVerified: false };
const request = (path, body, extra = {}) => new Request(env.AUTH_PUBLIC_ORIGIN + '/api/auth/' + path, {
  method: body === undefined ? 'GET' : 'POST', headers: { origin: env.AUTH_PUBLIC_ORIGIN,
    cookie: cookie + '; unrelated=private', 'cf-connecting-ip': '192.0.2.10', ...extra },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});
const sendBody = { phoneNumber, consent: true, consentVersion: SMS_CONSENT_VERSION };

test('SMS bridge requires the exact path, method, same origin and existing auth cookie before transport', async () => {
  const dependencies = { env, fetchImpl: () => assert.fail('unexpected transport') };
  assert.equal((await proxyPhoneOptIn(request('phone-number/unknown'), 'phone-number/unknown', dependencies)).status, 404);
  assert.equal((await proxyPhoneOptIn(request('phone-number/send-otp'), 'phone-number/send-otp', dependencies)).status, 404);
  assert.equal((await proxyPhoneOptIn(request('phone-number/send-otp', sendBody, { origin: 'https://evil.example.test' }), 'phone-number/send-otp', dependencies)).status, 403);
  assert.equal((await proxyPhoneOptIn(request('phone-number/opt-in', undefined, { 'sec-fetch-site': 'cross-site' }), 'phone-number/opt-in', dependencies)).status, 403);
  assert.equal((await proxyPhoneOptIn(request('phone-number/opt-in', undefined, { cookie: 'unrelated=private' }), 'phone-number/opt-in', dependencies)).status, 401);
});

test('SMS sends cannot skip explicit versioned consent or submit malformed phone numbers', async () => {
  for (const body of [null, [], {}, { ...sendBody, phoneNumber: '3001234567' }, { ...sendBody, consent: false },
    { ...sendBody, consent: 'true' }, { ...sendBody, consentVersion: 'old' }]) {
    const result = await proxyPhoneOptIn(request('phone-number/send-otp', body), 'phone-number/send-otp',
      { env, fetchImpl: () => assert.fail('invalid consent contacted auth') });
    assert.equal(result.status, 400);
  }
});

test('SMS status only projects approved own-account fields without tokens, cookies or diagnostics', async () => {
  const result = await proxyPhoneOptIn(request('phone-number/opt-in'), 'phone-number/opt-in', { env, fetchImpl: async (url, options) => {
    assert.equal(url, env.BETTER_AUTH_BACKEND_URL + '/api/auth/phone-number/opt-in');
    assert.equal(options.headers.cookie, cookie);
    assert.match(options.headers['x-vp-auth-signature'], /^[a-f0-9]{64}$/);
    return Response.json({ ...status, token: 'synthetic-private-token', role: 'untrusted' }, {
      headers: { 'set-cookie': 'better-auth.session_token=must-not-relay', 'set-auth-jwt': 'private-jwt' },
    });
  } });
  assert.equal(result.status, 200);
  assert.equal(result.headers.get('cache-control'), 'private, no-store');
  assert.equal(result.headers.get('set-cookie'), null);
  assert.equal(result.headers.get('set-auth-jwt'), null);
  assert.deepEqual(await result.json(), status);
});

test('SMS mutation transport strips user IDs, privilege fields and all non-contract inputs', async () => {
  for (const [path, body, forwarded, ack] of [
    ['phone-number/send-otp', { ...sendBody, userId: 'other', role: 'admin' }, sendBody, { ok: true, resendAfter: 60 }],
    ['phone-number/verify', { phoneNumber, code: '001234', updatePhoneNumber: true, disableSession: true, userId: 'other' },
      { phoneNumber, code: '001234', updatePhoneNumber: true, disableSession: true }, { ok: true, phoneNumberVerified: true, optedIn: true }],
    ['phone-number/revoke-consent', { userId: 'other', phoneNumber }, {}, { ok: true, optedIn: false }],
  ]) {
    let calls = 0;
    const result = await proxyPhoneOptIn(request(path, body), path, { env, fetchImpl: async (_url, options) => {
      calls++;
      assert.deepEqual(JSON.parse(options.body), forwarded);
      return Response.json({ ...ack, token: 'must-not-leak' });
    } });
    assert.equal(calls, 1);
    assert.equal(result.status, 200);
    assert.deepEqual(await result.json(), ack);
  }
});

test('SMS HTTP 200 with missing, false or malformed acknowledgements never confirms a send or verification', async () => {
  for (const payload of [{}, { ok: false }, { ok: true }, { ok: true, resendAfter: 0 }, { ok: true, resendAfter: '60' }, []]) {
    const result = await proxyPhoneOptIn(request('phone-number/send-otp', sendBody), 'phone-number/send-otp',
      { env, fetchImpl: async () => Response.json(payload) });
    assert.equal(result.status, 503);
    assert.deepEqual(await result.json(), { error: 'authentication_unavailable' });
  }
});

test('SMS cooldown and auth failures remain explicit and never leak provider diagnostics', async () => {
  for (const code of [401, 403, 404, 429, 500]) {
    let calls = 0;
    const result = await proxyPhoneOptIn(request('phone-number/send-otp', sendBody), 'phone-number/send-otp',
      { env, fetchImpl: async () => { calls++; return Response.json({ message: 'synthetic-private-provider-data' },
        { status: code, headers: { 'retry-after': '120' } }); } });
    assert.equal(calls, 1);
    assert.equal(result.status, code === 500 ? 503 : code);
    if (code === 429) assert.equal(result.headers.get('retry-after'), '120');
    assert.doesNotMatch(await result.text(), /private-provider/);
  }
});

test('SMS verification cannot request a sign-in, a different user binding or a malformed OTP', async () => {
  for (const body of [{ phoneNumber, code: '001234' }, { phoneNumber, code: 'abc123', updatePhoneNumber: true, disableSession: true },
    { phoneNumber, code: '001234', updatePhoneNumber: false, disableSession: true },
    { phoneNumber, code: '001234', updatePhoneNumber: true, disableSession: false }]) {
    const result = await proxyPhoneOptIn(request('phone-number/verify', body), 'phone-number/verify',
      { env, fetchImpl: () => assert.fail('invalid verification contacted auth') });
    assert.equal(result.status, 400);
  }
});
