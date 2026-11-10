import assert from 'node:assert/strict';
import test from 'node:test';
import { handleWalletLink } from './wallet-link-bff.mjs';

const env = {
  AUTH_PROVIDER: 'better-auth',
  AUTH_BFF_SHARED_SECRET: 's'.repeat(32),
  AUTH_PUBLIC_ORIGIN: 'https://app.example.test',
  BETTER_AUTH_BACKEND_URL: 'https://auth.core.internal',
  NODE_ENV: 'production',
};
const session = 'better-auth.session_token=verified-session';

function request(path, { method = 'GET', body, origin = 'https://app.example.test', cookie = session } = {}) {
  return new Request(`https://app.example.test/api/member/wallet-link${path}`, {
    method,
    headers: {
      cookie: `${cookie}; unrelated=must-not-leave-portal`,
      ...(body ? { 'content-type': 'application/json', origin, 'sec-fetch-site': 'same-origin' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

test('wallet status forwards only the native Better Auth session cookie', async () => {
  let forwarded;
  const response = await handleWalletLink(request(''), 'status', { env, fetchImpl: async () => assert.fail('direct fetch'),
    serviceRequest: async (url, init) => {
      forwarded = { url, init };
      return { ok: true, status: 200, data: { linked: false } };
    } });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { linked: false });
  assert.equal(forwarded.url, 'https://auth.core.internal/api/member/wallet-link');
  assert.equal(forwarded.init.headers.cookie, session);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
});

test('challenge accepts one exact address and preserves the same-origin proof', async () => {
  const address = `0x${'a'.repeat(40)}`;
  const challengeId = '66f30bd5-00ec-4aab-9462-1e6513bdcdb7';
  let forwarded;
  const response = await handleWalletLink(request('/challenge', { method: 'POST', body: { address } }), 'challenge', { env,
    serviceRequest: async (_url, init) => {
      forwarded = init;
      return { ok: true, status: 200, data: { linked: false, address, challengeId, message: 'verify ownership' } };
    } });
  assert.equal(response.status, 200);
  assert.equal(forwarded.headers.origin, env.AUTH_PUBLIC_ORIGIN);
  assert.deepEqual(JSON.parse(forwarded.body), { address });
});

test('wallet mutations fail before transport for CSRF, extra fields and oversized input', async () => {
  const address = `0x${'b'.repeat(40)}`;
  let calls = 0;
  const serviceRequest = async () => { calls += 1; };
  assert.equal((await handleWalletLink(request('/challenge', { method: 'POST', body: { address }, origin: 'https://evil.test' }), 'challenge', { env, serviceRequest })).status, 403);
  assert.equal((await handleWalletLink(request('/challenge', { method: 'POST', body: { address, role: 'admin' } }), 'challenge', { env, serviceRequest })).status, 400);
  const oversized = new Request('https://app.example.test/api/member/wallet-link/challenge', { method: 'POST', headers: {
    cookie: session, origin: env.AUTH_PUBLIC_ORIGIN, 'sec-fetch-site': 'same-origin', 'content-type': 'application/json', 'content-length': '5000',
  }, body: JSON.stringify({ address }) });
  assert.equal((await handleWalletLink(oversized, 'challenge', { env, serviceRequest })).status, 413);
  assert.equal(calls, 0);
});

test('missing sessions and malformed upstream success fail closed', async () => {
  assert.equal((await handleWalletLink(request('', { cookie: 'better-auth.state=state' }), 'status', { env,
    serviceRequest: async () => assert.fail('unauthenticated request forwarded') })).status, 401);
  const response = await handleWalletLink(request(''), 'status', { env,
    serviceRequest: async () => ({ ok: true, status: 200, data: { linked: true, address: 'not-an-address' } }) });
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { error: 'wallet_link_unavailable' });
});
