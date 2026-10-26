import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import * as profilePolicy from './member-profile.mjs';
import { memberMutationError } from './member-mutation-policy.mjs';
import { memberProfilePatch, validMemberProfile, validMemberProfileUpdate, readMemberProfileJson } from './member-profile.mjs';

const profile = { first_name: 'Ana', last_name: 'Perez', phone: '+573001234567', country: 'Colombia', payout_wallet_usdc: `0x${'1'.repeat(40)}` };

test('KYC name-only patches preserve omitted profile fields and cannot select another identity', () => {
  const patch = memberProfilePatch({ name: ' Ana Perez ', email: 'other@example.test', is_admin: true });
  assert.deepEqual(patch, { name: 'Ana Perez' });
  assert.deepEqual(memberProfilePatch({ phone: '', country: '', payout_wallet_usdc: '' }), { phone: '', country: '', payout_wallet_usdc: '' });
  assert.deepEqual(memberProfilePatch({ first_name: ' Ana ' }), { first_name: 'Ana' });
});

test('profile patches reject null, nonstrings, controls, excess size and invalid wallet', () => {
  for (const input of [null, [], {}, { name: null }, { phone: 42 }, { name: 'x'.repeat(241) }, { name: 'Ana\nPerez' }, { payout_wallet_usdc: 'invalid' }]) {
    assert.equal(memberProfilePatch(input), null);
  }
});

test('only a typed explicit saved profile confirms a profile mutation', () => {
  assert.equal(validMemberProfile(profile), true);
  assert.equal(validMemberProfileUpdate({ ok: true, profile }), true);
  for (const data of [{}, { ok: true }, { ok: 'true', profile }, { ok: true, profile: {} }, { ok: true, profile, error: 'internal' }, { ...profile, phone: null }]) {
    assert.equal(validMemberProfileUpdate(data), false);
  }
  assert.equal(validMemberProfile({ ...profile, phone: null }), false);
});

test('profile JSON is bounded and malformed success never becomes an empty saved object', async () => {
  const signal = AbortSignal.timeout(1000);
  assert.deepEqual(await readMemberProfileJson(Response.json(profile).body, signal), profile);
  for (const value of ['{', 'null', '[]', '"text"']) {
    await assert.rejects(readMemberProfileJson(new Response(value).body, signal));
  }
  await assert.rejects(readMemberProfileJson(new Response('x'.repeat(16385)).body, signal), RangeError);
});

test('a canceled stalled profile response cannot confirm a save', async () => {
  const controller = new AbortController();
  const body = new ReadableStream({});
  const pending = readMemberProfileJson(body, controller.signal);
  controller.abort();
  await assert.rejects(pending, /request_cancelled/);
  let canceled = false;
  const alreadyCanceledBody = new ReadableStream({ cancel() { canceled = true; } });
  await assert.rejects(readMemberProfileJson(alreadyCanceledBody, controller.signal), /request_cancelled/);
  assert.equal(canceled, true);
});

function profileRoute(upstream) {
  const source = readFileSync(new URL('../app/api/member/profile/route.js', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  const calls = [];
  const mocks = {
    '@/lib/cloudflare-runtime.mjs': { runtimeEnvironment: () => ({ AUTH_PUBLIC_ORIGIN: 'https://mindblisspower.com', VP_PAYMENTS_URL: 'https://payments.core.internal', PAYMENTS_SERVICE_TOKEN: 'synthetic' }),
      coreFetch: async (url, options) => { calls.push({ url, options }); return upstream(); } },
    '@/lib/admin-bff': { rawIdToken: async () => 'synthetic-jwt' },
    'next/server': { NextResponse: Response },
    '@/lib/verify-id-token': { verifyIdToken: async () => ({ email: 'verified@example.test' }) },
    '@/lib/member-mutation-policy.mjs': { memberMutationError },
    '@/lib/member-profile.mjs': profilePolicy,
  };
  new Function('require', 'module', 'exports', code)(id => {
    assert.ok(Object.hasOwn(mocks, id), `Unexpected route dependency ${id}`);
    return mocks[id];
  }, module, module.exports);
  return { route: module.exports, calls };
}

test('the actual profile BFF preserves a name-only patch and verified identity with strict acknowledgement', async () => {
  const { route, calls } = profileRoute(() => Response.json({ ok: true, profile }));
  const request = new Request('https://mindblisspower.com/api/member/profile', {
    method: 'POST', headers: { origin: 'https://mindblisspower.com', 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Ana Perez', email: 'other@example.test', is_admin: true }),
  });
  const result = await route.POST(request);
  assert.equal(result.status, 200);
  assert.deepEqual(JSON.parse(calls[0].options.body), { name: 'Ana Perez', email: 'verified@example.test' });
  assert.equal(calls[0].options.headers['X-VP-Id-Token'], 'synthetic-jwt');
  assert.equal(calls[0].options.redirect, 'manual');
  assert.equal(result.headers.get('cache-control'), 'private, no-store');
});

test('the actual profile BFF rejects wrong origins, malformed successes, empty patches and diagnostics', async () => {
  for (const payload of [{}, { ok: true }, { ok: true, profile, error: 'private-sql-detail' }]) {
    const { route } = profileRoute(() => Response.json(payload));
    const result = await route.POST(new Request('https://mindblisspower.com/api/member/profile', { method: 'POST',
      headers: { origin: 'https://mindblisspower.com', 'content-type': 'application/json' }, body: '{"name":"Ana"}' }));
    assert.equal(result.status, 502);
    assert.deepEqual(await result.json(), { error: 'profile-outcome-unconfirmed' });
  }
  const { route, calls } = profileRoute(() => Response.json(profile));
  const denied = await route.POST(new Request('https://mindblisspower.com/api/member/profile', { method: 'POST',
    headers: { origin: 'https://admin.mindblisspower.com', 'content-type': 'application/json' }, body: '{"name":"Ana"}' }));
  assert.equal(denied.status, 403); assert.equal(calls.length, 0);
  const invalid = await route.POST(new Request('https://mindblisspower.com/api/member/profile', { method: 'POST',
    headers: { origin: 'https://mindblisspower.com', 'content-type': 'application/json' }, body: '{}' }));
  assert.equal(invalid.status, 400); assert.equal(calls.length, 0);
  const read = await route.GET(new Request('https://mindblisspower.com/api/member/profile'));
  assert.equal(read.status, 200);
});
