import assert from 'node:assert/strict';
import test from 'node:test';
import { proxyBetterAuth } from './better-auth-bridge.mjs';

const env = { AUTH_PROVIDER: 'better-auth', NODE_ENV: 'production', AUTH_PUBLIC_ORIGIN: 'https://portal.example.test',
  BETTER_AUTH_BACKEND_URL: 'https://auth.example.test', AUTH_BFF_SHARED_SECRET: 'synthetic-sign-in-secret-more-than-32-characters' };
const email = 'member@example.test', subject = 'synthetic-subject', token = 'synthetic-native-session';
const sessionCookie = '__Secure-better-auth.session_token=synthetic-signed-cookie';
const proof = () => ({ token, user: { id: subject, email, emailVerified: true, name: 'Synthetic Member' } });
const canonical = () => ({ user: proof().user, session: { id: 'synthetic-session-id', userId: subject, token,
  expiresAt: new Date(Date.now() + 60_000).toISOString() } });
const request = (path, signal) => new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/auth/${path}`, {
  method: 'POST', signal, headers: { origin: env.AUTH_PUBLIC_ORIGIN, 'cf-connecting-ip': '192.0.2.10',
    cookie: 'better-auth.session_token=old-browser-session; better-auth.session_data=old-cache; unrelated=private', 'content-type': 'application/json' },
  body: JSON.stringify({ email, ...(path.endsWith('email-otp') ? { otp: '001234' } : { password: 'Synthetic password 123' }) }),
});
function issued(cookies = [`${sessionCookie}; Secure; HttpOnly; Max-Age=604800`], payload = proof()) {
  const headers = new Headers();
  for (const cookie of cookies) headers.append('set-cookie', cookie);
  return Response.json(payload, { headers });
}

for (const path of ['sign-in/email', 'sign-in/email-otp']) {
  test(`${path} only acknowledges its new same-owner native session without asking for a service JWT`, async () => {
    const calls = [];
    const response = await proxyBetterAuth(request(path), path, { env, fetchImpl: async (url, options) => {
      calls.push(new URL(url).pathname);
      if (url.endsWith('/get-session')) {
        assert.equal(options.method, 'GET'); assert.equal(options.body, undefined);
        assert.equal(options.headers.cookie, sessionCookie);
        assert.equal(options.cache, 'no-store'); assert.equal(options.redirect, 'manual');
        return Response.json(canonical(), { headers: { 'set-cookie': 'unrelated=canonical-must-not-relay' } });
      }
      return issued([`${sessionCookie}; Secure; HttpOnly; Domain=.auth.example.test; Path=/api/auth; Max-Age=604800`,
        '__Secure-better-auth.session_data=synthetic-cache; Secure; HttpOnly', 'unrelated=private']);
    } });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true, user: proof().user });
    assert.deepEqual(calls, [`/api/auth/${path}`, '/api/auth/get-session']);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    assert.equal(response.headers.getSetCookie().length, 2);
    for (const cookie of response.headers.getSetCookie()) {
      assert.match(cookie, /Path=\/; HttpOnly; SameSite=Lax; Secure$/);
      assert.doesNotMatch(cookie, /Domain=|old-browser|old-cache|unrelated|canonical-must-not-relay/);
    }
  });

  test(`${path} rejects missing, deleted, expired or ambiguous native cookies rather than claiming a verified login`, async () => {
    for (const cookies of [[], ['unrelated=private'], ['better-auth.session_data=cache'],
      ['__Secure-better-auth.session_token=; Max-Age=0'], [`${sessionCookie}; Max-Age=0`],
      [`${sessionCookie}; Max-Age=-1`], [`${sessionCookie}; Expires=Thu, 01 Jan 1970 00:00:00 GMT`],
      [`${sessionCookie}; Expires=not-a-date`], [sessionCookie, 'better-auth.session_token=another'],
      [`${sessionCookie}; Max-Age=3600; Max-Age=0`], [`${sessionCookie}; Expires=Wed, 01 Jan 2100 00:00:00 GMT; Expires=Thu, 01 Jan 1970 00:00:00 GMT`],
      Array.from({ length: 9 }, () => sessionCookie)]) {
      let calls = 0;
      const response = await proxyBetterAuth(request(path), path, { env, fetchImpl: async () => { calls++; return issued(cookies); } });
      assert.equal(response.status, 503);
      assert.equal(response.headers.get('set-cookie'), null);
      assert.deepEqual(await response.json(), { error: 'authentication_unavailable' });
      assert.equal(calls, 1, 'an old browser/cache cookie cannot substitute for the newly issued session');
    }
  });

  test(`${path} does not trust unverified or mismatched sign-in proof or a non-native HTTP response`, async () => {
    for (const upstream of [() => issued(undefined, { ...proof(), user: { ...proof().user, emailVerified: false } }),
      () => issued(undefined, { ...proof(), user: { ...proof().user, email: 'other@example.test' } }),
      () => issued(undefined, { ...proof(), token: null }),
      () => new Response(JSON.stringify(proof()), { status: 201, headers: { 'content-type': 'application/json', 'set-cookie': sessionCookie } }),
      () => new Response(JSON.stringify(proof()), { headers: { 'content-type': 'text/plain', 'set-cookie': sessionCookie } })]) {
      let calls = 0;
      const response = await proxyBetterAuth(request(path), path, { env, fetchImpl: async () => { calls++; return upstream(); } });
      assert.equal(response.status, 503); assert.equal(response.headers.get('set-cookie'), null); assert.equal(calls, 1);
    }
  });

  test(`${path} fails closed if native session identity, owner, token, expiry or response cannot be proved`, async () => {
    for (const value of [null, [], {}, { ...canonical(), error: 'private-native-diagnostic' },
      { ...canonical(), user: { ...proof().user, id: 'other' } }, { ...canonical(), user: { ...proof().user, email: 'other@example.test' } },
      { ...canonical(), user: { ...proof().user, emailVerified: false } },
      { ...canonical(), session: { ...canonical().session, id: '' } },
      { ...canonical(), session: { ...canonical().session, userId: 'other' } },
      { ...canonical(), session: { ...canonical().session, token: 'old-browser-session' } },
      { ...canonical(), session: { ...canonical().session, expiresAt: new Date(0).toISOString() } },
      { ...canonical(), session: { ...canonical().session, expiresAt: 'bad-date' } }]) {
      let calls = 0;
      const response = await proxyBetterAuth(request(path), path, { env, fetchImpl: async url => {
        calls++;
        return url.endsWith('/get-session') ? Response.json(value) : issued();
      } });
      assert.equal(response.status, 503); assert.equal(response.headers.get('set-cookie'), null);
      assert.deepEqual(await response.json(), { error: 'authentication_unavailable' });
      assert.equal(calls, 2, 'a failed session proof never repeats login/OTP or asks for a service JWT');
    }
    for (const upstream of [() => new Response(null, { status: 401 }), () => new Response(null, { status: 403 }),
      () => Response.json({ error: 'private-diagnostic' }, { status: 503 }), () => new Response('not-json'),
      () => new Response(JSON.stringify(canonical()), { headers: { 'content-type': 'text/plain' } })]) {
      let calls = 0;
      const response = await proxyBetterAuth(request(path), path, { env, fetchImpl: async url => {
        calls++; return url.endsWith('/get-session') ? upstream() : issued();
      } });
      assert.equal(response.status, 503); assert.equal(response.headers.get('set-cookie'), null);
      assert.equal(calls, 2);
    }
  });

  test(`${path} does not acknowledge or relay cookies after the session recheck is cancelled`, async () => {
    const controller = new AbortController(); let calls = 0;
    const response = await proxyBetterAuth(request(path, controller.signal), path, { env, fetchImpl: async url => {
      calls++;
      if (url.endsWith('/get-session')) { controller.abort(); return Response.json(canonical()); }
      return issued();
    } });
    assert.equal(response.status, 503); assert.equal(response.headers.get('set-cookie'), null);
    assert.equal(calls, 2);
  });
}
