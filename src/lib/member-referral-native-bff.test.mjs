import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash, createHmac } from 'node:crypto';
import { handleNativeMemberReferral, handleNativeReferralAttribution } from './member-referral-native-bff.mjs';
const origin = 'https://app.mindblisspower.com', cookie = 'better-auth.session_token=synthetic';
const env = { AUTH_PROVIDER: 'better-auth', AUTH_PUBLIC_ORIGIN: origin, BETTER_AUTH_BACKEND_URL: 'https://auth.core.internal', AUTH_BFF_SHARED_SECRET: 'x'.repeat(32), NODE_ENV: 'production' };
const value = (extra = {}) => ({ positioned: false, code: 'MPStable', name: 'Synthetic Member', placement: 'automatic', generated: true,
  metrics: { total: 0, active: 0, pending: 0 }, referrals: [], sponsor_name: '', sponsor_referral_code: '', attribution_source: 'unassigned', ...extra });
const request = (path = '/api/member/referral', options = {}) => new Request(`${origin}${path}`, {
  ...options, headers: { cookie, 'x-mindbliss-referral-subject': 'subject%2Fowner', 'x-mindbliss-referral-contract': 'v2', ...options.headers } });

test('native own-link GET uses exact private path, cookie and mounted subject, without JWT/token/Go enrichment', async () => {
  let calls = 0;
  const response = await handleNativeMemberReferral(request(), { env, serviceRequest: async (url, init) => {
    calls++; assert.equal(url, 'https://auth.core.internal/api/member/referral'); assert.equal(init.method, 'GET');
    assert.deepEqual(init.headers, { cookie, origin, 'x-mindbliss-referral-subject': 'subject%2Fowner' });
    assert.equal(init.body, undefined); return { ok: true, data: value({ private: 'discard' }) };
  } });
  assert.equal(calls, 1); assert.equal(response.status, 200); const body = await response.json();
  assert.equal(body.positioned, false); assert.equal(body.link, `${origin}/register?ref=MPStable`); assert.equal(body.private, undefined);
  assert.match(response.headers.get('cache-control'), /no-store/); assert.equal(response.headers.get('vary'), 'Cookie');
});

test('invalid query, origin, subject, session and impersonation never reach private transport', async () => {
  const never = async () => assert.fail('invalid request reached service');
  for (const [input, status] of [[request('/api/member/referral?email=other@example.test'), 400],
    [request('/api/member/referral', { headers: { 'x-mindbliss-referral-subject': '' } }), 403],
    [request('/api/member/referral', { headers: { 'x-mindbliss-referral-subject': 'subject%2fowner' } }), 403],
    [request('/api/member/referral', { headers: { cookie: '' } }), 401],
    [request('/api/member/referral', { headers: { 'x-vp-act-as': 'foreign' } }), 403],
    [new Request('https://wallet.mindblisspower.com/api/member/referral'), 404]]) {
    assert.equal((await handleNativeMemberReferral(input, { env, serviceRequest: never })).status, status);
  }
});

test('canonical sponsor GET is read-only and projects immutable independently from placement', async () => {
  for (const source of ['unassigned', 'existing_affiliate', 'referral', 'company']) {
    const response = await handleNativeReferralAttribution(request('/api/member/referral-attribution'), { env, serviceRequest: async (url, init) => {
      assert.equal(url, 'https://auth.core.internal/api/member/referral'); assert.equal(init.method, 'GET');
      return { ok: true, data: value({ sponsor_referral_code: source === 'unassigned' ? '' : 'MPActual', attribution_source: source }) };
    } });
    assert.deepEqual(await response.json(), { ok: true, ref: source === 'unassigned' ? '' : 'MPActual', preferred_side: '', positioned: false, immutable: source !== 'unassigned' });
  }
});

test('one explicit post-auth referral/default choice signs only native ref, never browser email or a company ID', async () => {
  for (const ref of ['', 'ExplicitSponsor']) {
    let calls = 0;
    const response = await handleNativeReferralAttribution(request('/api/member/referral-attribution', { method: 'POST',
      headers: { origin, 'sec-fetch-site': 'same-origin', 'content-type': 'application/json', 'cf-connecting-ip': '198.51.100.10' },
      body: JSON.stringify({ ref, preferred_side: '', expected_email: 'owner@example.test' }) }), { env, serviceRequest: async (url, init) => {
      calls++; assert.equal(url, 'https://auth.core.internal/api/member/referral-attribution'); assert.equal(init.method, 'POST'); assert.deepEqual(JSON.parse(init.body), { ref });
      const hash = text => createHash('sha256').update(text).digest('hex');
      const signature = createHmac('sha256', env.AUTH_BFF_SHARED_SECRET).update(['POST', '/api/member/referral-attribution', init.headers['x-vp-auth-timestamp'],
        '198.51.100.10', hash(cookie), hash(init.body)].join('\n')).digest('hex');
      assert.equal(init.headers['x-vp-auth-signature'], signature);
      return { ok: true, data: { ok: true, ref: 'MPAuthoritative', preferred_side: '', positioned: false, immutable: true } };
    } });
    assert.equal(calls, 1); assert.deepEqual(await response.json(), { ok: true, ref: 'MPAuthoritative', preferred_side: '', positioned: false, immutable: true });
  }
});

test('a malformed success cannot fabricate an own code, positioning or sponsor capture; owner mismatch stays explicit', async () => {
  for (const invalid of [value({ code: '' }), value({ code: 'bad code' }), value({ attribution_source: 'browser_hint' }), value({ metrics: { total: 1, active: 0, pending: 0 } })]) {
    assert.equal((await handleNativeMemberReferral(request(), { env, serviceRequest: async () => ({ ok: true, data: invalid }) })).status, 502);
  }
  const changed = await handleNativeMemberReferral(request(), { env, serviceRequest: async () => ({ ok: false, status: 409, data: { error: 'member_referral_owner_changed', private: 'discard' } }) });
  assert.equal(changed.status, 409); assert.deepEqual(await changed.json(), { error: 'member_referral_owner_changed' });
});

test('attribution capture rejects foreign origins, side selection and browser owner/company selectors before transport', async () => {
  const never = async () => assert.fail('invalid capture reached native');
  const headers = { origin, 'sec-fetch-site': 'same-origin', 'content-type': 'application/json', 'cf-connecting-ip': '198.51.100.10' };
  for (const body of [{ ref: 'MPValid', subject: 'another-owner' }, { ref: '', companyAffiliateId: 1 },
    { ref: 'MPValid', preferred_side: 'L' }, { ref: ' bad code ' }, { email: 'another@example.test' }]) {
    assert.equal((await handleNativeReferralAttribution(request('/api/member/referral-attribution', { method: 'POST', headers,
      body: JSON.stringify(body) }), { env, serviceRequest: never })).status, 400);
  }
  assert.equal((await handleNativeReferralAttribution(request('/api/member/referral-attribution', { method: 'POST', headers: { ...headers, origin: 'https://evil.example' },
    body: JSON.stringify({ ref: '' }) }), { env, serviceRequest: never })).status, 403);
});

test('real totals remain independent from the capped displayed referrals list and must remain consistent', async () => {
  const rows = [{ id: 'person:synthetic', name: 'Synthetic Invitee', status: 'activo', date: '2026-11-14T12:00:00.000Z' }];
  const response = await handleNativeMemberReferral(request(), { env, serviceRequest: async () => ({ ok: true,
    data: value({ metrics: { total: 60, active: 35, pending: 25 }, referrals: rows }) }) });
  assert.equal(response.status, 200); const body = await response.json(); assert.equal(body.metrics.total, 60); assert.equal(body.referrals.length, 1);
  for (const metrics of [{ total: 0, active: 0, pending: 0 }, { total: 60, active: 0, pending: 60 }, { total: 1_000_000_001, active: 1, pending: 1_000_000_000 }]) {
    assert.equal((await handleNativeMemberReferral(request(), { env, serviceRequest: async () => ({ ok: true, data: value({ metrics, referrals: rows }) }) })).status, 502);
  }
});

test('already-open legacy documents retain their exact four-field attribution contract without changing native authority', async () => {
  for (const capability of ['', 'v1', 'V2', 'v2, v2']) {
    const response = await handleNativeReferralAttribution(request('/api/member/referral-attribution', { headers: { 'x-mindbliss-referral-contract': capability } }),
      { env, serviceRequest: async (url, init) => {
        assert.equal(url, 'https://auth.core.internal/api/member/referral'); assert.equal(init.headers['x-mindbliss-referral-subject'], 'subject%2Fowner');
        return { ok: true, data: value({ positioned: true, attribution_source: 'existing_affiliate' }) };
      } });
    assert.equal(response.status, 200); assert.deepEqual(await response.json(), { ok: true, ref: '', preferred_side: '', positioned: true });
  }
  const response = await handleNativeReferralAttribution(request('/api/member/referral-attribution', { method: 'POST',
    headers: { 'x-mindbliss-referral-contract': '', origin, 'sec-fetch-site': 'same-origin', 'content-type': 'application/json', 'cf-connecting-ip': '198.51.100.10' },
    body: JSON.stringify({ ref: 'AttemptedSponsor' }) }), { env, serviceRequest: async (_url, init) => {
    assert.deepEqual(JSON.parse(init.body), { ref: 'AttemptedSponsor' });
    return { ok: true, data: { ok: true, ref: 'ActualImmutableSponsor', preferred_side: '', positioned: false, immutable: true } };
  } });
  assert.deepEqual(await response.json(), { ok: true, ref: 'ActualImmutableSponsor', preferred_side: '', positioned: false });
});
