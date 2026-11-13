import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash, createHmac } from 'node:crypto';
import ts from 'typescript';
import { handleNativeMemberProfile } from './member-profile-native-bff.mjs';
import { nativeMemberProfilePatch, memberProfileUpdateMatches, validNativeMemberProfile } from './member-profile.mjs';

const origin = 'https://app.mindblisspower.com', path = '/api/member/profile';
const env = { AUTH_PROVIDER: 'better-auth', AUTH_PUBLIC_ORIGIN: origin, AUTH_BFF_SHARED_SECRET: 's'.repeat(32), BETTER_AUTH_BACKEND_URL: 'https://auth.core.internal', NODE_ENV: 'production' };
const profile = { first_name: 'Persona', last_name: 'Prueba', phone: '+525551234567', country: 'México', payout_wallet_usdc: '',
  sponsor_name: 'Patrocinador Verificado', sponsor_referral_code: 'SPONSOR-SYNTHETIC', referral_code: 'OWN-SYNTHETIC' };
const input = { name: 'Persona Prueba', phone: profile.phone };
const request = (body = undefined, changes = {}) => new Request(`${origin}${path}${changes.query || ''}`, { method: body === undefined ? 'GET' : 'POST',
  headers: { cookie: 'better-auth.session_token=synthetic', origin, 'sec-fetch-site': 'same-origin', 'cf-connecting-ip': '198.51.100.10', 'x-mindbliss-profile-subject': encodeURIComponent('owner-view-A'), ...(body ? { 'content-type': 'application/json' } : {}), ...changes.headers },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }) });

test('native contact updates accept only full name, explicit international phone and optional ISO2 country', () => {
  assert.deepEqual(nativeMemberProfilePatch({ name: '  Persona   Prueba ', phone: profile.phone }), input);
  assert.equal(nativeMemberProfilePatch({ ...input, name: 'Persona D’Angelo' }).name, 'Persona D’Angelo');
  assert.deepEqual(nativeMemberProfilePatch({ ...input, country: '' }), { ...input, country: '' });
  assert.deepEqual(nativeMemberProfilePatch({ ...input, phone: '', country: 'MX' }), { ...input, phone: '', country: 'MX' });
  for (const extra of [{ email: 'other@example.test' }, { subject: 'other' }, { userId: 'other' }, { payout_wallet_usdc: `0x${'1'.repeat(40)}` },
    { sponsor_name: 'Forged' }, { sponsor_referral_code: 'FORGED' }, { referral_code: 'FORGED' }, { phoneNumberVerified: true }]) assert.equal(nativeMemberProfilePatch({ ...input, ...extra }), null);
  for (const change of [{ name: '' }, { name: 'x'.repeat(161) }, { name: 'Persona\nPrueba' }, { phone: '5551234567' }, { phone: '+52 555 1234567' },
    { country: 'México' }, { country: 'mx' }, { name: 'Persona <script>' }, { name: '---' }, { name: '...' }, { name: '’' }, { phone: null }]) assert.equal(nativeMemberProfilePatch({ ...input, ...change }), null);
});

test('native profile includes bounded canonical sponsor metadata while save acknowledgement matches only the submitted fields', () => {
  assert.equal(validNativeMemberProfile(profile), true); assert.equal(memberProfileUpdateMatches({ ok: true, profile }, input), true);
  assert.equal(memberProfileUpdateMatches({ ok: true, profile }, { ...input, country: 'MX' }), false);
  for (const field of ['sponsor_name', 'sponsor_referral_code', 'referral_code']) {
    const value = { ...profile }; delete value[field]; assert.equal(validNativeMemberProfile(value), false);
    assert.equal(validNativeMemberProfile({ ...profile, [field]: 123 }), false);
  }
  assert.equal(validNativeMemberProfile({ ...profile, sponsor_name: 'x'.repeat(481) }), false);
  assert.equal(validNativeMemberProfile({ ...profile, first_name: 'x'.repeat(241) }), false);
  assert.equal(memberProfileUpdateMatches({ ok: true, profile: { ...profile, phone: '+573001234567' } }, input), false);
});

test('native profile reads use only the current Better Auth cookie, fixed app Origin and auth Core transport', async () => {
  let calls = 0;
  const result = await handleNativeMemberProfile(request(), { env, serviceRequest: async (url, init) => {
    calls++; assert.equal(url, `${env.BETTER_AUTH_BACKEND_URL}${path}`); assert.equal(init.method, 'GET'); assert.equal(init.body, undefined);
    assert.deepEqual(init.headers, { cookie: 'better-auth.session_token=synthetic', origin, 'x-mindbliss-profile-subject': 'owner-view-A' });
    return { ok: true, data: { ...profile, authSubject: 'not-projected', internalAudit: 'not-projected' } };
  } });
  assert.equal(result.status, 200); assert.deepEqual(await result.json(), profile); assert.equal(calls, 1);
  assert.equal(result.headers.get('cache-control'), 'private, no-store'); assert.equal(result.headers.get('vary'), 'Cookie');
});

test('native profile saves sign the exact field whitelist and preserve an omitted legacy country', async () => {
  let calls = 0;
  const result = await handleNativeMemberProfile(request(input), { env, serviceRequest: async (url, init) => {
    calls++; assert.equal(url, `${env.BETTER_AUTH_BACKEND_URL}${path}`); assert.equal(init.method, 'POST'); assert.deepEqual(JSON.parse(init.body), input);
    const h = new Headers(init.headers), hash = value => createHash('sha256').update(value).digest('hex');
    assert.equal(h.get('x-vp-auth-signature'), createHmac('sha256', env.AUTH_BFF_SHARED_SECRET).update(['POST', path, h.get('x-vp-auth-timestamp'), h.get('x-vp-auth-client-ip'), hash(h.get('cookie')), hash(init.body)].join('\n')).digest('hex'));
    assert.equal(h.get('origin'), origin); assert.equal(h.get('X-VP-Service-Token'), null); assert.equal(h.get('X-VP-Id-Token'), null);
    assert.equal(h.get('x-mindbliss-profile-subject'), 'owner-view-A');
    return { ok: true, data: { ok: true, profile } };
  } });
  assert.equal(result.status, 200); assert.deepEqual(await result.json(), { ok: true, profile }); assert.equal(calls, 1);
});

test('bounded legacy readonly phone/wallet metadata cannot block loading or editing the owned contact profile', async () => {
  const legacy = { ...profile, phone: '1'.repeat(64), payout_wallet_usdc: 'legacy-readonly-value'.padEnd(128, 'x') };
  assert.equal(validNativeMemberProfile(legacy), true);
  const read = await handleNativeMemberProfile(request(), { env, serviceRequest: async () => ({ ok: true, data: legacy }) });
  assert.equal(read.status, 200); assert.deepEqual(await read.json(), legacy);
  const updated = { ...legacy, phone: input.phone };
  const saved = await handleNativeMemberProfile(request(input), { env, serviceRequest: async () => ({ ok: true, data: { ok: true, profile: updated } }) });
  assert.equal(saved.status, 200); assert.equal((await saved.json()).profile.payout_wallet_usdc.length, 128);
  assert.equal(validNativeMemberProfile({ ...legacy, phone: '1'.repeat(65) }), false);
  assert.equal(validNativeMemberProfile({ ...legacy, payout_wallet_usdc: 'x'.repeat(129) }), false);
  assert.equal(nativeMemberProfilePatch({ ...input, phone: legacy.phone }), null);
});

test('native profile rejects cross-owner selectors, impersonation, wrong Origin and financial fields before Core', async () => {
  const never = async () => assert.fail('No private transport allowed');
  for (const query of ['?email=other@example.test', '?subject=other', '?userId=other']) assert.equal((await handleNativeMemberProfile(request(undefined, { query }), { env, serviceRequest: never })).status, 400);
  assert.equal((await handleNativeMemberProfile(request(undefined, { headers: { 'x-vp-act-as': 'other' } }), { env, serviceRequest: never })).status, 403);
  assert.equal((await handleNativeMemberProfile(request(input, { headers: { origin: 'https://evil.example' } }), { env, serviceRequest: never })).status, 403);
  assert.equal((await handleNativeMemberProfile(request(undefined, { headers: { cookie: 'unrelated=value' } }), { env, serviceRequest: never })).status, 401);
  assert.equal((await handleNativeMemberProfile(request({ ...input, payout_wallet_usdc: `0x${'1'.repeat(40)}` }), { env, serviceRequest: never })).status, 400);
  assert.equal((await handleNativeMemberProfile(new Request(`https://wallet.mindblisspower.com${path}`, { headers: { cookie: 'better-auth.session_token=synthetic' } }), { env, serviceRequest: never })).status, 404);
});

test('a wrong stored phone/name or stale partial success never becomes a successful save and is never retried', async () => {
  for (const data of [{ ok: true, profile: { ...profile, phone: '+573001234567' } }, { ok: true, profile: { ...profile, first_name: 'Otro' } }, { ok: true },
    { ok: true, profile: { ...profile, sponsor_name: null } }]) {
    let calls = 0;
    const result = await handleNativeMemberProfile(request(input), { env, serviceRequest: async () => { calls++; return { ok: true, data }; } });
    assert.equal(result.status, 502); assert.deepEqual(await result.json(), { error: 'member_profile_outcome_unconfirmed' }); assert.equal(calls, 1);
  }
  const disabled = await handleNativeMemberProfile(request(input), { env, serviceRequest: async () => ({ ok: false, status: 503, data: { error: 'member_profile_unconfigured', detail: 'private-sql' } }) });
  assert.equal(disabled.status, 503); assert.deepEqual(await disabled.json(), { error: 'member_profile_unconfigured' });
});

test('the actual Better Auth route selects the native capability before all legacy token or service operations', async () => {
  let native = 0;
  const mocks = { 'next/server': { NextResponse: Response }, '@/lib/cloudflare-runtime.mjs': {}, '@/lib/admin-bff': {}, '@/lib/verify-id-token': {},
    '@/lib/member-mutation-policy.mjs': {}, '@/lib/member-profile.mjs': {}, '@/lib/better-auth-bridge.mjs': { betterAuthEnabled: () => true },
    '@/lib/member-profile-native-bff.mjs': { handleNativeMemberProfile: async () => { native++; return Response.json(profile); } } };
  const module = { exports: {} }, code = ts.transpileModule(readFileSync(new URL('../app/api/member/profile/route.js', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('require', 'module', 'exports', code)(key => { assert.ok(Object.hasOwn(mocks, key)); return mocks[key]; }, module, module.exports);
  assert.equal((await module.exports.GET(request())).status, 200); assert.equal((await module.exports.POST(request(input))).status, 200); assert.equal(native, 2);
});

test('native profile requires a canonical bounded view-subject fence and preserves a current-cookie owner mismatch without retry', async () => {
  let calls = 0;
  for (const encoded of ['', '%', 'owner%2dview%2dA', '%20owner-view-A', 'x'.repeat(256), '%00owner']) {
    const result = await handleNativeMemberProfile(request(undefined, { headers: { 'x-mindbliss-profile-subject': encoded } }), { env,
      serviceRequest: async () => { calls++; throw Error('must not reach native transport'); } });
    assert.equal(result.status, 403);
  }
  assert.equal(calls, 0);
  for (const method of ['GET', 'POST']) {
    const result = await handleNativeMemberProfile(request(method === 'POST' ? input : undefined), { env, serviceRequest: async (_url, init) => {
      calls++; assert.equal(new Headers(init.headers).get('x-mindbliss-profile-subject'), 'owner-view-A');
      return { ok: false, status: 409, data: { error: 'member_profile_owner_changed' } };
    } });
    assert.equal(result.status, 409); assert.deepEqual(await result.json(), { error: 'member_profile_owner_changed' });
  }
  assert.equal(calls, 2, 'the subject fence never changes cookie authority or retries a stale view');
});
