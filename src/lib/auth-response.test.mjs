import assert from 'node:assert/strict';
import test from 'node:test';
import { authSuccess } from './auth-response.mjs';
import { proxyBetterAuth, readAuthBody } from './better-auth-bridge.mjs';
const env = { AUTH_PROVIDER: 'better-auth', NODE_ENV: 'production', BETTER_AUTH_BACKEND_URL: 'https://auth.example.test',
  AUTH_PUBLIC_ORIGIN: 'https://portal.example.test', AUTH_BFF_SHARED_SECRET: 'synthetic-proxy-secret-greater-than-thirty-two' };
const request = (body = '{}') => new Request(env.AUTH_PUBLIC_ORIGIN + '/api/auth/sign-in/email', { method: 'POST',
  headers: { origin: env.AUTH_PUBLIC_ORIGIN, 'cf-connecting-ip': '192.0.2.10' }, body });

test('auth operations only acknowledge their exact installed response contracts', () => {
  for (const path of ['sign-out', 'email-otp/send-verification-otp', 'email-otp/request-password-reset', 'email-otp/reset-password']) {
    assert.deepEqual(authSuccess(path, { success: true }), { ok: true });
    for (const value of [{}, { success: false }, { success: 'true' }, { status: true }, { error: 'failed', success: true }, null, []]) {
      assert.throws(() => authSuccess(path, value));
    }
  }
  assert.deepEqual(authSuccess('email-otp/verify-email', { status: true }), { ok: true });
  assert.throws(() => authSuccess('sign-up/email', { user: {} }));
});

test('sign-in requires a verified user and private session token without projecting secrets', () => {
  const value = { token: 'synthetic-private-token', user: { id: 'synthetic', email: 'member@example.test', emailVerified: true, name: 'Member', role: 'untrusted' } };
  assert.deepEqual(authSuccess('sign-in/email', value), { ok: true, user: { id: 'synthetic', email: 'member@example.test', name: 'Member' } });
  for (const change of [{ token: null }, { token: '' }, { user: { ...value.user, emailVerified: false } }, { user: { ...value.user, id: '' } }]) {
    assert.throws(() => authSuccess('sign-in/email-otp', { ...value, ...change }));
  }
});

test('malformed or false-success HTTP 200 never returns success or installs cookies', async () => {
  for (const body of ['{}', '[]', 'null', '{', '{"error":"synthetic-private-error"}']) {
    const result = await proxyBetterAuth(request(), 'sign-in/email', { env, fetchImpl: async () => new Response(body,
      { headers: { 'set-cookie': 'better-auth.session_token=synthetic-private-cookie' } }) });
    assert.equal(result.status, 503);
    assert.equal(result.headers.get('set-cookie'), null);
    assert.doesNotMatch(await result.text(), /private-error|private-cookie/);
  }
});

test('generic signup and unconsented phone routes cannot bypass reviewed registration or SMS handlers', async () => {
  for (const path of ['sign-up/email', 'phone-number/send-otp', 'phone-number/verify']) {
    const result = await proxyBetterAuth(request(), path, { env, fetchImpl: () => assert.fail('unexpected upstream') });
    assert.equal(result.status, 404);
  }
  for (const body of ['null', '[]']) {
    assert.equal((await proxyBetterAuth(request(body), 'sign-in/email', { env, fetchImpl: () => assert.fail('invalid body') })).status, 400);
  }
});

test('already cancelled auth body cannot leave a Worker waiting for a stream', async () => {
  const controller = new AbortController();
  controller.abort();
  let cancelled = false;
  const body = new ReadableStream({ cancel() { cancelled = true; } });
  await assert.rejects(readAuthBody({ body, signal: controller.signal }), { name: 'AbortError' });
  assert.equal(cancelled, true);
});
