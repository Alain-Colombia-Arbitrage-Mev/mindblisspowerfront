import assert from 'node:assert/strict';
import test from 'node:test';
import { handleAdministrativeWallet } from './administrative-wallet-bff.mjs';

const env = { AUTH_PROVIDER: 'better-auth', AUTH_BFF_SHARED_SECRET: 's'.repeat(32),
  AUTH_PUBLIC_ORIGIN: 'https://app.example.test', BETTER_AUTH_BACKEND_URL: 'https://auth.core.internal', NODE_ENV: 'production' };
const cookie = 'better-auth.session_token=verified-session';
const assigned = { status: 'assigned', address: `0x${'a'.repeat(40)}`, addressFamily: 'EVM', asset: 'USDT',
  checkoutReference: 'd8a4c010-cc33-44da-a297-8b3c6440f491', assignedAt: '2026-11-10T15:00:00.000Z' };

const request = (action = 'status', origin = env.AUTH_PUBLIC_ORIGIN) => new Request(
  `${env.AUTH_PUBLIC_ORIGIN}/api/member/administrative-wallet${action === 'ensure' ? '/ensure' : ''}`,
  { method: action === 'ensure' ? 'POST' : 'GET', headers: { cookie: `${cookie}; unrelated=private`,
    ...(action === 'ensure' ? { origin, 'sec-fetch-site': 'same-origin', 'content-type': 'application/json' } : {}) },
    body: action === 'ensure' ? '{}' : undefined });

test('administrative wallet status returns only the current assignment', async () => {
  let forwarded;
  const response = await handleAdministrativeWallet(request(), 'status', { env, serviceRequest: async (url, init) => {
    forwarded = { url, init }; return { ok: true, status: 200, data: assigned };
  } });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), assigned);
  assert.equal(forwarded.url, 'https://auth.core.internal/api/member/administrative-wallet');
  assert.equal(forwarded.init.headers.cookie, cookie);
});

test('ensure is same-origin, empty and idempotent', async () => {
  let forwarded;
  const response = await handleAdministrativeWallet(request('ensure'), 'ensure', { env, serviceRequest: async (url, init) => {
    forwarded = { url, init }; return { ok: true, status: 200, data: assigned };
  } });
  assert.equal(response.status, 200);
  assert.equal(forwarded.url, 'https://auth.core.internal/api/member/administrative-wallet/ensure');
  assert.equal(forwarded.init.body, '{}');
  assert.equal(forwarded.init.headers.origin, env.AUTH_PUBLIC_ORIGIN);
  assert.equal((await handleAdministrativeWallet(request('ensure', 'https://evil.test'), 'ensure', { env,
    serviceRequest: async () => assert.fail('CSRF request forwarded') })).status, 403);
});

test('inventory fields and malformed assignment responses never reach the browser', async () => {
  const response = await handleAdministrativeWallet(request(), 'status', { env, serviceRequest: async () => ({
    ok: true, status: 200, data: { ...assigned, remaining: 27 },
  }) });
  assert.equal(response.status, 200);
  assert.equal(Object.hasOwn(await response.json(), 'remaining'), false);
  const malformed = await handleAdministrativeWallet(request(), 'status', { env, serviceRequest: async () => ({
    ok: true, status: 200, data: { status: 'assigned', address: 'bad', remaining: 27 },
  }) });
  assert.equal(malformed.status, 502);
});
