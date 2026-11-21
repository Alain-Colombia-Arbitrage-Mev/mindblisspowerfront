import assert from 'node:assert/strict';
import test from 'node:test';
import { RECHARGE_PACKAGE_ORIGIN as origin, RECHARGE_PACKAGE_PATH as path, rechargePackageSnapshot } from './recharge-package-contract.mjs';
import { handleRechargePackage } from './recharge-package-bff.mjs';
import { readRechargePackage } from './recharge-package-client.mjs';

const subject = 'member/synthetic', fence = 'x-mindbliss-profile-subject', cookie = 'better-auth.session_token=synthetic';
const env = { AUTH_PROVIDER: 'better-auth', AUTH_PUBLIC_ORIGIN: origin, BETTER_AUTH_BACKEND_URL: 'https://auth.core.internal', AUTH_BFF_SHARED_SECRET: 'x'.repeat(32) };
const item = { level: 3, ceilingUsdMinor: 25_000, grossUsdMinor: 13_789, confirmedAt: '2026-11-20T13:15:30.000Z' };
const headers = { cookie, [fence]: encodeURIComponent(subject) };
const request = (url = `${origin}${path}`, init = {}) => new Request(url, { ...init, headers: { ...headers, ...init.headers } });

test('a confirmed package has its own level, ceiling, exact gross and valid date', () => {
  assert.deepEqual(rechargePackageSnapshot({ package: item }), { package: item });
  assert.deepEqual(rechargePackageSnapshot({ package: null }), { package: null });
  for (const extra of [{ level: '3' }, { level: 0 }, { level: 9 }, { ceilingUsdMinor: 50_000 }, { grossUsdMinor: 0 }, { grossUsdMinor: 13.49 },
    { confirmedAt: '2026-11-31T00:00:00Z' }, { confirmedAt: null }, { status: 'pending' }, { wallet: 'private' }]) {
    assert.equal(rechargePackageSnapshot({ package: { ...item, ...extra } }), null);
  }
  assert.equal(rechargePackageSnapshot({ package: item, state: 'unconfirmed' }), null);
  assert.equal(rechargePackageSnapshot({ balanceUsd: 140 }), null);
});

test('Pagar benefits only accept the exact integer projection tied to an owned package', () => {
  const pagarBenefits = { activeGrossUsdMinor: 13_789, roiAccruedUsdMinor: 42, ownPv: 137, bonusCreditedUsdMinor: 260 };
  assert.deepEqual(rechargePackageSnapshot({ package: item, pagarBenefits }), { package: item, pagarBenefits });
  assert.equal(rechargePackageSnapshot({ package: null, pagarBenefits }), null);
  assert.equal(rechargePackageSnapshot({ package: item, pagarBenefits: { ...pagarBenefits, ownPv: -1 } }), null);
  assert.equal(rechargePackageSnapshot({ package: item, pagarBenefits: { ...pagarBenefits, arbitrarilyCredited: 100 } }), null);
});

test('the exact App GET passes the session cookie and stale-owner fence on a no-store request', async () => {
  const input = request(undefined, { headers: { cookie: `${cookie}; other=discard`, authorization: 'discard' } });
  const response = await handleRechargePackage(input, { env, fetchImpl: async (url, init) => {
    assert.equal(url, `https://auth.core.internal${path}`);
    assert.equal(init.method, 'GET'); assert.equal(init.cache, 'no-store'); assert.equal(init.redirect, 'manual');
    assert.deepEqual(init.headers, { ...headers, origin });
    return Response.json({ package: item });
  } });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store'); assert.equal(response.headers.get('vary'), 'Cookie');
  assert.deepEqual(await response.json(), { package: item });
});

test('other portal hosts, owner selectors, missing session and impersonation are rejected before upstream work', async () => {
  const fetchImpl = async () => assert.fail('unexpected upstream request');
  for (const [input, status] of [
    [request(`https://wallet.mindblisspower.com${path}`), 404], [request(`${origin}${path}?owner=another`), 400],
    [request(undefined, { method: 'POST' }), 405], [request(undefined, { headers: { cookie: 'another=1' } }), 401],
    [request(undefined, { headers: { [fence]: '%' } }), 403], [request(undefined, { headers: { 'x-vp-act-as': 'another' } }), 403],
  ]) assert.equal((await handleRechargePackage(input, { env, fetchImpl })).status, status);
  const rejected = await handleRechargePackage(request(), { env, fetchImpl: async () => Response.json({ secret: 'discard' }, { status: 409 }) });
  assert.equal(rejected.status, 409);
  assert.deepEqual(await rejected.json(), { error: 'recharge_package_unavailable' });
  const malformed = await handleRechargePackage(request(), { env, fetchImpl: async () => Response.json({ package: { ...item, status: 'pending' } }) });
  assert.equal(malformed.status, 502);
});

test('the client requests only its mounted subject and rejects malformed or unauthorized results', async () => {
  let calls = 0;
  assert.deepEqual(await readRechargePackage(subject, { fetchImpl: async (url, init) => {
    calls++; assert.equal(url, path); assert.equal(init.method, 'GET'); assert.equal(init.credentials, 'same-origin');
    assert.equal(init.headers[fence], encodeURIComponent(subject)); assert.equal(init.cache, 'no-store');
    return Response.json({ package: null });
  } }), { package: null });
  assert.equal(calls, 1);
  await assert.rejects(readRechargePackage('', { fetchImpl: () => assert.fail('ownerless request') }));
  await assert.rejects(readRechargePackage(subject, { fetchImpl: async () => Response.json({ package: item }, { status: 409 }) }), { status: 409 });
  await assert.rejects(readRechargePackage(subject, { fetchImpl: async () => Response.json({ package: { ...item, confirmedAt: '' } }) }));
});
