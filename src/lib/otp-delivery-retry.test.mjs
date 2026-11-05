import assert from 'node:assert/strict';
import test from 'node:test';
import { proxyBetterAuth, readAuthUpstreamBody } from './better-auth-bridge.mjs';
import { handleRegistration } from './registration-auth.mjs';

const env = { AUTH_PROVIDER: 'better-auth', NODE_ENV: 'production', AUTH_PUBLIC_ORIGIN: 'https://portal.example.test',
  BETTER_AUTH_BACKEND_URL: 'https://auth.example.test', AUTH_BFF_SHARED_SECRET: 'synthetic-otp-retry-secret-longer-than-32' };
const email = 'synthetic@example.test';
const request = (path, body) => new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/auth/${path}`, { method: 'POST',
  headers: { origin: env.AUTH_PUBLIC_ORIGIN, 'cf-connecting-ip': '192.0.2.10', 'content-type': 'application/json', cookie: 'better-auth.session_token=synthetic-incoming' }, body: JSON.stringify(body) });
const input = path => path === 'email-otp/reset-password' ? { email, otp: '123456', password: 'Synthetic Password for reset' }
  : path === 'sign-in/email-otp' ? { email, otp: '123456' } : { email, type: 'sign-in' };
const privateHeaders = { 'set-cookie': 'better-auth.session_token=private-upstream', 'set-auth-jwt': 'private-upstream', location: 'https://private.example.test' };
const signup = { fullName: 'Synthetic Person', email, acceptsPrivacy: true };

test('auth send, redemption and recovery preserve sanitized 429 JSON/HTML/malformed responses and normalized waits without retrying', async t => {
  const now = Date.parse('Thu, 05 Nov 2026 12:00:00 GMT');
  t.mock.method(Date, 'now', () => now);
  for (const path of ['email-otp/send-verification-otp', 'sign-in/email-otp', 'email-otp/request-password-reset', 'email-otp/reset-password']) {
    for (const mime of ['text/html', 'application/json', 'malformed-json']) {
      for (const [raw, expected] of [['900', '900'], ['Thu, 05 Nov 2026 12:15:00 GMT', '900'], ['invalid', path.includes('reset-password') && !path.includes('request-') || path === 'sign-in/email-otp' ? '60' : '300']]) {
        let calls = 0;
        const response = await proxyBetterAuth(request(path, input(path)), path, { env, fetchImpl: async () => {
          calls++;
          return new Response(mime === 'application/json' ? JSON.stringify({ code: 'TOO_MANY_REQUESTS', email, token: 'private-upstream', message: 'private-provider-detail' })
            : mime === 'malformed-json' ? '{private-upstream' : '<html>private-upstream</html>', { status: 429,
            headers: { ...privateHeaders, 'content-type': mime === 'text/html' ? mime : 'application/json', 'retry-after': raw } });
        } });
        assert.equal(response.status, 429, `${path}/${mime}`);
        assert.equal(response.headers.get('retry-after'), expected);
        assert.equal(response.headers.get('cache-control'), 'private, no-store');
        for (const header of Object.keys(privateHeaders)) assert.equal(response.headers.get(header), null);
        const body = await response.json();
        assert.equal(body.error, 'authentication_failed');
        if (mime === 'application/json') assert.equal(body.code, 'TOO_MANY_REQUESTS');
        assert.doesNotMatch(JSON.stringify(body), /private-|synthetic@|html|token/);
        assert.equal(calls, 1);
      }
    }
  }
});

test('an HTML 429 body is cancelled without awaiting an untrusted cancellation promise', async () => {
  let cancelled = false;
  const body = new ReadableStream({ cancel() { cancelled = true; return new Promise(() => {}); } });
  const upstream = new Response(body, { status: 429, headers: { 'content-type': 'text/html' } });
  assert.deepEqual(await readAuthUpstreamBody(upstream), {});
  assert.equal(cancelled, true);
});

test('registration and manual resend retain 429 status and HTTP-date waits without leaking WAF content or implying account creation', async t => {
  const now = Date.parse('Thu, 05 Nov 2026 12:00:00 GMT'); t.mock.method(Date, 'now', () => now);
  for (const [action, body] of [['register', signup], ['confirm', { email, resend: true }]]) {
    for (const [content, type, retry, expected] of [['<html>private-upstream</html>', 'text/html', 'Thu, 05 Nov 2026 12:15:00 GMT', 900],
      ['{private-upstream', 'application/json', 'invalid', 300], [JSON.stringify({ code: 'REGISTRATION_REQUIRED', token: 'private-upstream' }), 'application/json', '450', 450]]) {
      let calls = 0;
      const response = await handleRegistration(request('register', body), action, { env, fetchImpl: async () => {
        calls++; return new Response(content, { status: 429, headers: { ...privateHeaders, 'content-type': type, 'retry-after': retry } });
      } });
      assert.equal(response.status, 429); assert.equal(calls, 1);
      assert.equal(response.headers.get('retry-after'), String(expected));
      const payload = await response.json(); assert.equal(payload.retryAfter, expected); assert.equal(payload.code, 'RATE_LIMITED');
      assert.equal(payload.registrationPending, undefined);
      assert.doesNotMatch(JSON.stringify(payload), /private-|synthetic@|html|token/);
      for (const header of Object.keys(privateHeaders)) assert.equal(response.headers.get(header), null);
    }
  }
});

test('503 delivery ambiguity preserves a bounded wait but never installs a session, claims delivery or retries', async t => {
  const now = Date.parse('Thu, 05 Nov 2026 12:00:00 GMT'); t.mock.method(Date, 'now', () => now);
  for (const [raw, seconds] of [['1', 300], ['900', 900], ['Thu, 05 Nov 2026 12:15:00 GMT', 900], ['invalid', 300]]) {
    const upstream = () => Response.json({ code: 'AUTH_EMAIL_DELIVERY_UNAVAILABLE', email: 'private@example.test', token: 'private-upstream', message: 'private-provider-detail' },
      { status: 503, headers: { ...privateHeaders, 'retry-after': raw } });
    let calls = 0;
    const path = 'email-otp/send-verification-otp';
    const login = await proxyBetterAuth(request(path, input(path)), path, { env, fetchImpl: async () => { calls++; return upstream(); } });
    assert.equal(login.status, 503); assert.equal(login.headers.get('retry-after'), String(seconds));
    assert.deepEqual(await login.json(), { error: 'authentication_failed', code: 'AUTH_EMAIL_DELIVERY_UNAVAILABLE' });
    assert.equal(calls, 1);
    for (const [action, body] of [['register', signup], ['confirm', { email, resend: true }]]) {
      calls = 0;
      const response = await handleRegistration(request('register', body), action, { env, fetchImpl: async () => { calls++; return upstream(); } });
      assert.equal(response.status, 503); assert.equal(response.headers.get('retry-after'), String(seconds));
      const payload = await response.json(); assert.equal(payload.retryAfter, seconds);
      assert.match(payload.error, /No pudimos confirmar el envío/);
      assert.match(payload.error, /si recibes un código vigente/);
      assert.equal(payload.registrationPending, action === 'register' ? true : undefined);
      assert.doesNotMatch(JSON.stringify(payload), /private-|token|no pudimos enviar|código enviado/i);
      assert.equal(calls, 1);
      for (const header of Object.keys(privateHeaders)) assert.equal(response.headers.get(header), null);
    }
  }
});
