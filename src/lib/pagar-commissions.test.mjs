import assert from 'node:assert/strict';
import test from 'node:test';
import { handlePagarCommissions, isPagarCommissionsHost } from './pagar-commissions-bff.mjs';
import { readPagarCommissions } from './pagar-commissions-client.mjs';
import { PAGAR_COMMISSIONS_PATH as path, pagarCommissionsSnapshot, pagarCommissionWeek } from './pagar-commissions-contract.mjs';
import { REWON_PUBLIC_ORIGIN as origin } from './portal-request-origin.mjs';

const subject = 'member/commissions', fence = 'x-mindbliss-profile-subject', tokenCookie = '__Secure-better-auth.session_token=synthetic';
const env = { AUTH_PROVIDER: 'better-auth', AUTH_PUBLIC_ORIGIN: origin, BETTER_AUTH_BACKEND_URL: 'https://auth.core.internal', AUTH_BFF_SHARED_SECRET: 'x'.repeat(32) };
const privateHeaders = { cookie: tokenCookie, [fence]: encodeURIComponent(subject) };
const request = (url = `${origin}${path}`, init = {}) => new Request(url, { ...init, headers: { ...privateHeaders, ...init.headers } });
const entry = { weekEnd: '2026-11-16', binaryUsdMinor: 150, rankUsdMinor: 50 };
const snapshot = { virtualBalanceUsdMinor: 500, periods: [entry], nextBefore: null };

test('the projection accepts integer USD cents and unique descending Bogotá closes only', () => {
  assert.equal(pagarCommissionWeek('2026-11-16'), true);
  for (const day of ['0000-01-03', '2026-11-15', '2026-02-30', '2026-01-32', '2026-11-16T00:00:00Z', null]) assert.equal(pagarCommissionWeek(day), false);
  assert.deepEqual(pagarCommissionsSnapshot(snapshot), snapshot);
  assert.deepEqual(pagarCommissionsSnapshot({ ...snapshot, periods: [] }), { ...snapshot, periods: [] });
  const periods = Array.from({ length: 12 }, (_, index) => ({
    ...entry, weekEnd: new Date(Date.parse('2026-11-16T00:00:00Z') - index * 604_800_000).toISOString().slice(0, 10),
  }));
  const full = { virtualBalanceUsdMinor: 5_000, periods, nextBefore: periods.at(-1).weekEnd };
  assert.deepEqual(pagarCommissionsSnapshot(full), full);
  for (const invalid of [
    { ...snapshot, virtualBalanceUsdMinor: 199 }, { ...snapshot, virtualBalanceUsdMinor: '500' },
    { ...snapshot, periods: [{ ...entry, binaryUsdMinor: -1 }] }, { ...snapshot, periods: [{ ...entry, rankUsdMinor: 0.5 }] },
    { ...snapshot, periods: [{ ...entry, payoutWallet: 'discard' }] }, { ...snapshot, periods: [entry, entry] },
    { ...snapshot, nextBefore: entry.weekEnd }, { ...snapshot, owner: 'discard' },
    { ...full, nextBefore: '2026-11-16' }, { ...full, periods: [...periods, entry] },
  ]) assert.equal(pagarCommissionsSnapshot(invalid), null);
  assert.equal(pagarCommissionsSnapshot(snapshot, '2026-11-16'), null);
});

test('the BFF forwards the canonical cursor and native ownership proof only on the exact App origin', async () => {
  assert.equal(isPagarCommissionsHost('app.mindblisspower.com', env), true);
  assert.equal(isPagarCommissionsHost('mindblisspower.com', env), false);
  assert.equal(isPagarCommissionsHost('app.mindblisspower.com', { ...env, AUTH_PUBLIC_ORIGIN: 'https://mindblisspower.com' }), false);
  const response = await handlePagarCommissions(request(`${origin}${path}?before=2026-11-23`, {
    headers: { cookie: `${tokenCookie}; ignored=discard`, authorization: 'discard', origin: 'https://elsewhere.test' },
  }), { env, fetchImpl: async (url, init) => {
    assert.equal(url, `https://auth.core.internal${path}?before=2026-11-23`);
    assert.equal(init.method, 'GET');
    assert.equal(init.cache, 'no-store');
    assert.equal(init.redirect, 'manual');
    assert.deepEqual(init.headers, { ...privateHeaders, origin });
    return Response.json(snapshot);
  } });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(response.headers.get('vary'), 'Cookie');
  assert.deepEqual(await response.json(), snapshot);
});

test('the BFF rejects alternate surfaces, extra selectors, invalid dates and ambiguous authentication before a Core call', async () => {
  const fetchImpl = async () => assert.fail('unexpected Core read');
  const route = `${origin}${path}`;
  const cases = [
    [request(`https://wallet.mindblisspower.com${path}`), 404],
    [request(`https://mindbliss-portal-rewon.devfidubit.workers.dev${path}`), 404],
    [request(`${route}/`), 404], [request(route, { method: 'POST' }), 405],
    [request(route, { headers: { cookie: 'irrelevant=1' } }), 401],
    [request(route, { headers: { [fence]: '%' } }), 403],
    [request(route, { headers: { 'x-vp-act-as': 'another' } }), 403],
    ...['?', '?owner=someone', '?before=2026-11-15', '?before=2026-11-16&before=2026-11-16',
      '?before=2026-11-16&wallet=another', '?%62efore=2026-11-16', '?before=2026-11-16&'].map(query => [request(route + query), 400]),
  ];
  for (const [input, status] of cases) {
    const response = await handlePagarCommissions(input, { env, fetchImpl });
    assert.equal(response.status, status, input.url);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
  }
  const stale = await handlePagarCommissions(request(), { env, fetchImpl: async () => Response.json({ private: 'discard' }, { status: 409 }) });
  assert.equal(stale.status, 409);
  assert.deepEqual(await stale.json(), { error: 'pagar_commissions_unavailable' });
  const malformed = await handlePagarCommissions(request(), { env, fetchImpl: async () => Response.json({ ...snapshot, private: 'discard' }) });
  assert.equal(malformed.status, 502);
});

test('the client makes one bounded same-origin read with an exclusive cursor and never replays an ownership failure', async () => {
  let reads = 0;
  const fetchImpl = async (url, init) => {
    reads++;
    assert.equal(url, `${path}?before=2026-11-23`);
    assert.equal(init.method, 'GET');
    assert.equal(init.credentials, 'same-origin');
    assert.equal(init.cache, 'no-store');
    assert.deepEqual(init.headers, { [fence]: encodeURIComponent(subject) });
    return Response.json(snapshot);
  };
  assert.deepEqual(await readPagarCommissions(subject, { before: '2026-11-23', fetchImpl }), snapshot);
  await assert.rejects(readPagarCommissions(subject, { before: 'invalid', fetchImpl }));
  await assert.rejects(readPagarCommissions('', { fetchImpl }));
  assert.equal(reads, 1);
  await assert.rejects(readPagarCommissions(subject, { fetchImpl: async () => {
    reads++;
    return Response.json({ error: 'owner_changed' }, { status: 409 });
  } }), { status: 409 });
  assert.equal(reads, 2);
});
