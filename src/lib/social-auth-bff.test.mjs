import assert from 'node:assert/strict';
import test from 'node:test';
import {
  betterAuthSocialProviderEnabled,
  betterAuthSocialProviders,
  proxyBetterAuthSocialCallback,
  proxyBetterAuthSocialStart,
} from './better-auth-bridge.mjs';

const env = {
  AUTH_PROVIDER: 'better-auth',
  AUTH_SOCIAL_PROVIDERS: 'google, apple, GOOGLE, unknown',
  NODE_ENV: 'production',
  AUTH_PUBLIC_ORIGIN: 'https://portal.example.test',
  BETTER_AUTH_BACKEND_URL: 'https://auth.example.test',
  AUTH_BFF_SHARED_SECRET: 'synthetic-auth-proxy-secret-longer-than-32',
};

function socialRequest(provider = 'google', origin = env.AUTH_PUBLIC_ORIGIN) {
  return new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/auth/sign-in/social`, {
    method: 'POST',
    headers: { origin, 'content-type': 'application/json', 'cf-connecting-ip': '192.0.2.10' },
    body: JSON.stringify({ provider }),
  });
}

function cookieResponse(body, init = {}) {
  const headers = new Headers(init.headers);
  for (const value of init.cookies || []) headers.append('set-cookie', value);
  return new Response(body, { status: init.status || 200, headers });
}

test('social providers are explicit, deduplicated and fail closed', () => {
  assert.deepEqual(betterAuthSocialProviders(env), ['google', 'apple']);
  assert.equal(betterAuthSocialProviderEnabled('google', env), true);
  assert.equal(betterAuthSocialProviderEnabled('github', env), false);
  assert.deepEqual(betterAuthSocialProviders({ ...env, AUTH_PROVIDER: 'cognito' }), []);
});

test('social start rejects cross-origin, extra input and unavailable providers before transport', async () => {
  let calls = 0;
  const dependencies = { env, fetchImpl: async () => { calls++; throw new Error('must not reach upstream'); } };
  assert.equal((await proxyBetterAuthSocialStart(socialRequest('google', 'https://attacker.example.test'), dependencies)).status, 400);
  const extra = new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/auth/sign-in/social`, {
    method: 'POST', headers: { origin: env.AUTH_PUBLIC_ORIGIN, 'content-type': 'application/json', 'cf-connecting-ip': '192.0.2.10' },
    body: JSON.stringify({ provider: 'google', callbackURL: 'https://attacker.example.test' }),
  });
  assert.equal((await proxyBetterAuthSocialStart(extra, dependencies)).status, 404);
  assert.equal((await proxyBetterAuthSocialStart(socialRequest('github'), dependencies)).status, 404);
  assert.equal(calls, 0);
});

test('social start fixes callback destinations and only relays the state cookie', async () => {
  let forwarded;
  const response = await proxyBetterAuthSocialStart(socialRequest(), { env, fetchImpl: async (url, options) => {
    forwarded = { url, options, body: JSON.parse(options.body) };
    return cookieResponse(JSON.stringify({ url: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=synthetic', redirect: false }), {
      headers: { 'content-type': 'application/json' },
      cookies: [
        'better-auth.state=synthetic-state; Path=/; HttpOnly; Secure; SameSite=Lax',
        'better-auth.session_token=must-not-be-installed; Path=/; HttpOnly; Secure',
        'unrelated=must-not-leave; Path=/',
      ],
    });
  } });
  assert.equal(response.status, 200);
  assert.equal(forwarded.url, 'https://auth.example.test/api/auth/sign-in/social');
  assert.deepEqual(forwarded.body, {
    provider: 'google',
    callbackURL: 'https://portal.example.test/dashboard',
    errorCallbackURL: 'https://portal.example.test/login?auth=social-failed',
    disableRedirect: true,
  });
  assert.equal(forwarded.options.headers.origin, env.AUTH_PUBLIC_ORIGIN);
  assert.deepEqual(await response.json(), { url: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=synthetic' });
  const setCookie = response.headers.get('set-cookie');
  assert.match(setCookie, /better-auth\.state=synthetic-state/);
  assert.doesNotMatch(setCookie, /session_token|unrelated|Domain=/);
});

test('social callback installs only a freshly proven session and redirects to the dashboard', async () => {
  let calls = 0;
  const expiresAt = new Date(Date.now() + 60_000).toISOString();
  const callback = new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/auth/callback/google?code=synthetic-code&state=synthetic-state`, {
    headers: { cookie: 'better-auth.state=synthetic-state; unrelated=private', 'cf-connecting-ip': '192.0.2.10' },
  });
  const response = await proxyBetterAuthSocialCallback(callback, 'google', { env, fetchImpl: async (url, options) => {
    calls++;
    if (url.includes('/callback/google?')) {
      assert.match(url, /code=synthetic-code/);
      assert.equal(options.redirect, 'manual');
      return cookieResponse(null, {
        status: 302,
        headers: { location: `${env.AUTH_PUBLIC_ORIGIN}/dashboard` },
        cookies: [
          'better-auth.session_token=fresh-social-session; Path=/; HttpOnly; Secure; SameSite=Lax',
          'better-auth.state=; Path=/; HttpOnly; Secure; Max-Age=0',
          'unrelated=must-not-leave; Path=/',
        ],
      });
    }
    assert.equal(url, 'https://auth.example.test/api/auth/get-session');
    assert.equal(options.headers.cookie, 'better-auth.session_token=fresh-social-session');
    return Response.json({
      user: { id: 'social-user', email: 'member@example.test', emailVerified: true },
      session: { id: 'social-session', userId: 'social-user', expiresAt },
    });
  } });
  assert.equal(calls, 2);
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), `${env.AUTH_PUBLIC_ORIGIN}/dashboard`);
  const setCookie = response.headers.get('set-cookie');
  assert.match(setCookie, /better-auth\.session_token=fresh-social-session/);
  assert.doesNotMatch(setCookie, /unrelated|Domain=/);
});

test('Apple form callbacks are normalized to a same-origin GET without contacting the backend', async () => {
  let calls = 0;
  const request = new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/auth/callback/apple`, {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: 'code=synthetic-code&state=synthetic-state&user=%7B%22name%22%3A%7B%7D%7D',
  });
  const response = await proxyBetterAuthSocialCallback(request, 'apple', { env, fetchImpl: async () => { calls++; } });
  assert.equal(calls, 0);
  assert.equal(response.status, 303);
  const target = new URL(response.headers.get('location'));
  assert.equal(target.origin, env.AUTH_PUBLIC_ORIGIN);
  assert.equal(target.pathname, '/api/auth/callback/apple');
  assert.equal(target.searchParams.get('state'), 'synthetic-state');
});

test('malformed callbacks and unsafe upstream redirects fail with one neutral local redirect and no cookie', async () => {
  for (const request of [
    new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/auth/callback/google?code=synthetic-code`),
    new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/auth/callback/google?code=a&code=b&state=c`),
  ]) {
    const response = await proxyBetterAuthSocialCallback(request, 'google', { env, fetchImpl: async () => assert.fail('invalid callbacks must not reach upstream') });
    assert.equal(response.status, 302);
    assert.equal(response.headers.get('location'), `${env.AUTH_PUBLIC_ORIGIN}/login?auth=social-failed`);
    assert.equal(response.headers.get('set-cookie'), null);
  }
  const request = new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/auth/callback/google?code=a&state=b`, {
    headers: { 'cf-connecting-ip': '192.0.2.10' },
  });
  const response = await proxyBetterAuthSocialCallback(request, 'google', { env, fetchImpl: async () => new Response(null, {
    status: 302, headers: { location: 'https://attacker.example.test/dashboard', 'set-cookie': 'better-auth.session_token=private; Path=/' },
  }) });
  assert.equal(response.headers.get('location'), `${env.AUTH_PUBLIC_ORIGIN}/login?auth=social-failed`);
  assert.equal(response.headers.get('set-cookie'), null);
});
