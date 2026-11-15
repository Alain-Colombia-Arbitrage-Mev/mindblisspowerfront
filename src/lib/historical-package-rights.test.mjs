import assert from 'node:assert/strict';
import test from 'node:test';
import { historicalPackageRights, historicalPackageInstant, HISTORICAL_PACKAGE_RIGHTS_POLICY as policy } from './historical-package-rights-contract.mjs';
import { handleHistoricalPackageRights } from './historical-package-rights-bff.mjs';
import { readHistoricalPackageRights } from './historical-package-rights-client.mjs';

const origin = 'https://app.mindblisspower.com', subject = 'synthetic/owner', cookie = 'better-auth.session_token=synthetic';
const env = { AUTH_PROVIDER: 'better-auth', AUTH_PUBLIC_ORIGIN: origin, BETTER_AUTH_BACKEND_URL: 'https://auth.core.internal', AUTH_BFF_SHARED_SECRET: 'x'.repeat(32) };
const item = (extra = {}) => ({ id: '11111111-1111-4111-8111-111111111111', packageName: '1001', sourcePackageId: '1', packageBaseUsd: '100.00',
  boughtAt: '2026-07-25T16:10:00.000Z', recognizedAt: '2026-11-15T12:00:00.000Z', status: 'active',
  term: { type: 'until_revoked', startsAt: '2026-11-15T12:00:00.000Z', endsAt: null }, source: 'stripe_import', ...extra });
const rights = (extra = {}) => ({ rightsOnly: true, economicActivation: false, roiEnabled: false, commissionsEnabled: false, policy,
  activeCount: 1, totalCount: 1, items: [item()], ...extra });
const request = (path = '/api/member/package-rights', options = {}) => new Request(`${origin}${path}`, { ...options,
  headers: { cookie, 'x-mindbliss-profile-subject': encodeURIComponent(subject), ...options.headers } });

test('each receipt retains original purchase and current recognition dates, with no economic activation or private evidence', () => {
  const second = item({ id: '22222222-2222-4222-8222-222222222222', packageName: '1002', sourcePackageId: '2', packageBaseUsd: '250.00', boughtAt: '2026-08-27T23:15:00.000Z', status: 'revoked' });
  const result = historicalPackageRights(rights({ totalCount: 2, items: [{ ...item(), email: 'private@example.test', paymentIntentId: 'not-public' }, second] }));
  assert.equal(result.items.length, 2); assert.equal(result.activeCount, 1); assert.equal(result.items[0].boughtAt, item().boughtAt);
  assert.equal(result.items[1].boughtAt, second.boughtAt); assert.equal(result.items[0].recognizedAt, item().recognizedAt);
  assert.equal(result.items[0].term.startsAt, item().recognizedAt); assert.equal(result.items[0].term.endsAt, null);
  assert.equal(result.economicActivation, false); assert.equal(result.roiEnabled, false); assert.equal(result.commissionsEnabled, false);
  assert.doesNotMatch(JSON.stringify(result), /private@example|not-public|paymentIntentId|wallet|affiliate_package/);
});

test('real totals can exceed the latest bounded receipts list without inventing tiers or access counts', () => {
  const result = historicalPackageRights(rights({ totalCount: 150, activeCount: 125 }));
  assert.equal(result.totalCount, 150); assert.equal(result.activeCount, 125); assert.equal(result.items.length, 1);
  for (const extra of [{ totalCount: 0 }, { activeCount: 2 }, { activeCount: 0 }, { activeCount: 734, totalCount: 734 }]) assert.equal(historicalPackageRights(rights(extra)), null);
});

test('economic flags, unsupported policies/statuses/sources and duplicate receipts fail closed', () => {
  for (const extra of [{ rightsOnly: false }, { economicActivation: true }, { roiEnabled: true }, { commissionsEnabled: true }, { policy: 'investment' },
    { items: [item({ status: 'paid' })] }, { items: [item({ source: 'browser_hint' })] }, { items: [item(), item()] }, { items: Array.from({ length: 101 }, () => item()) }]) {
    assert.equal(historicalPackageRights(rights(extra)), null);
  }
  for (const packageBaseUsd of ['100', '-1.00', '0.00', '1e2', '100.000', ' 100.00']) assert.equal(historicalPackageRights(rights({ items: [item({ packageBaseUsd })] })), null);
});

test('historical dates are absolute, calendar-valid and never backdate the access recognition term', () => {
  for (const value of ['2026-02-31T12:00:00Z', '2026-07-25', '2026-07-25T12:00:00', 'not-a-date']) assert.equal(historicalPackageInstant(value), false);
  for (const change of [{ boughtAt: '2027-01-01T00:00:00Z' }, { term: { type: 'historical', startsAt: item().boughtAt, endsAt: null } },
    { term: { type: 'until_revoked', startsAt: item().boughtAt, endsAt: null } }, { term: { ...item().term, endsAt: '2027-01-01T00:00:00Z' } }]) {
    assert.equal(historicalPackageRights(rights({ items: [item(change)] })), null);
  }
});

test('BFF forwards only current native cookie, fixed app origin and mounted subject to the one read-only path', async () => {
  let calls = 0;
  const response = await handleHistoricalPackageRights(request(), { env, serviceRequest: async (url, init) => {
    calls++; assert.equal(url, 'https://auth.core.internal/api/member/package-rights'); assert.equal(init.method, 'GET'); assert.equal(init.body, undefined);
    assert.deepEqual(init.headers, { cookie, origin, 'x-mindbliss-profile-subject': encodeURIComponent(subject) }); return { ok: true, data: rights() };
  } });
  assert.equal(calls, 1); assert.equal(response.status, 200); assert.deepEqual(await response.json(), rights());
  assert.match(response.headers.get('cache-control'), /private.*no-store/); assert.equal(response.headers.get('vary'), 'Cookie');
});

test('missing/foreign owners, selectors, impersonation and mutations never reach the native reader', async () => {
  const never = async () => assert.fail('unsafe request reached native');
  for (const [input, status] of [[request('/api/member/package-rights?email=other@example.test'), 400],
    [request('/api/member/package-rights', { method: 'POST', body: '{}' }), 405],
    [request('/api/member/package-rights', { headers: { cookie: '' } }), 401],
    [request('/api/member/package-rights', { headers: { 'x-mindbliss-profile-subject': '' } }), 403],
    [request('/api/member/package-rights', { headers: { 'x-vp-act-as': 'other' } }), 403],
    [new Request('https://wallet.mindblisspower.com/api/member/package-rights'), 404]]) {
    assert.equal((await handleHistoricalPackageRights(input, { env, serviceRequest: never })).status, status);
  }
  const changed = await handleHistoricalPackageRights(request(), { env, serviceRequest: async () => ({ ok: false, status: 409, data: { error: 'member_package_rights_owner_changed', private: 'discard' } }) });
  assert.equal(changed.status, 409); assert.deepEqual(await changed.json(), { error: 'member_package_rights_owner_changed' });
});

test('client performs one subject-fenced GET, rejects invalid results and never retries or posts access fields', async () => {
  const calls = [];
  assert.deepEqual(await readHistoricalPackageRights(subject, { fetchImpl: async (url, init) => { calls.push({ url, init }); return Response.json(rights()); } }), rights());
  assert.equal(calls.length, 1); assert.equal(calls[0].url, '/api/member/package-rights'); assert.equal(calls[0].init.method, 'GET');
  assert.equal(calls[0].init.headers['x-mindbliss-profile-subject'], encodeURIComponent(subject)); assert.equal(calls[0].init.credentials, 'same-origin');
  let failed = 0;
  await assert.rejects(readHistoricalPackageRights(subject, { fetchImpl: async () => { failed++; return Response.json({}, { status: 503 }); } })); assert.equal(failed, 1);
  await assert.rejects(readHistoricalPackageRights('', { fetchImpl: () => assert.fail('ownerless request') }));
  await assert.rejects(readHistoricalPackageRights(subject, { fetchImpl: async () => Response.json(rights({ economicActivation: true })) }));
});

test('aborting or timing out a non-cooperative read settles locally without publishing a grant', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const action = readHistoricalPackageRights(subject, { fetchImpl: () => new Promise(() => {}) });
  t.mock.timers.tick(20_000); await assert.rejects(action);
  const controller = new AbortController(), aborted = readHistoricalPackageRights(subject, { signal: controller.signal, fetchImpl: () => new Promise(() => {}) });
  controller.abort(); await assert.rejects(aborted);
});
