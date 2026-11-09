import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import * as links from './referral-links.mjs';
import { AuthServiceUnavailable } from './better-auth-bridge.mjs';

function route({ token = 'synthetic-token', email = 'member@example.test', rows = [
  [{ status: 'active', blacklisted: false, listed_by_blacklist: false }],
  [{ id: 50793, invitation_link: 'OpaqueHandle' }], [],
], env = { AUTH_PUBLIC_ORIGIN: 'https://mindblisspower.com' }, authError = false, databaseError = false } = {}) {
  let calls = 0;
  const source = readFileSync(new URL('../app/api/member/referral/route.js', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const mocks = {
    '@/lib/admin-bff': { rawIdToken: async () => { if (authError) throw new Error('private-auth-detail'); return token; } },
    'next/server': { NextResponse: { json: (...args) => Response.json(...args) } },
    '@/lib/member-db': { memberDb: () => { if (databaseError) throw new Error('private-database-detail'); return async () => {
      const result = rows[calls++]; if (result instanceof Error) throw result; return result;
    }; } },
    '@/lib/verify-id-token': { verifiedEmailFromIdTokenForSession: async () => email },
    '@/lib/better-auth-bridge.mjs': { AuthServiceUnavailable },
    '@/lib/cloudflare-runtime.mjs': { runtimeEnvironment: () => env },
    '@/lib/referral-links.mjs': links,
  };
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(id => { assert.ok(Object.hasOwn(mocks, id), `Unexpected dependency ${id}`); return mocks[id]; }, module, module.exports);
  return { get: module.exports.GET, calls: () => calls };
}

function privateResponse(response) {
  assert.equal(response.headers.get('cache-control'), 'private, no-store, max-age=0');
  assert.equal(response.headers.get('vary'), 'Cookie');
  assert.equal(response.headers.get('set-cookie'), null);
}

test('member referral generates both public branches from runtime configuration rather than the old build-time alias', async () => {
  for (const env of [{ AUTH_PUBLIC_ORIGIN: 'https://mindblisspower.com', REFERRAL_BASE_URL: 'https://app.mindblisspower.com' },
    { AUTH_PUBLIC_ORIGIN: 'https://preview.example.test' }]) {
    const fixture = route({ env }), response = await fixture.get();
    assert.equal(response.status, 200); privateResponse(response);
    const data = await response.json(); assert.equal(data.positioned, true); assert.equal(data.code, 'OpaqueHandle');
    assert.deepEqual(data.links, links.buildReferralLinks(data.code, env.AUTH_PUBLIC_ORIGIN));
    assert.equal(data.link, data.links.left); assert.equal(data.link_right, data.links.right); assert.equal(fixture.calls(), 3);
  }
});

test('missing legacy invitation codes retain the backend-compatible MP decimal affiliate code', async () => {
  const fixture = route({ rows: [[], [{ id: 50793, invitation_link: null }], []] });
  const response = await fixture.get(), data = await response.json();
  assert.equal(response.status, 200); privateResponse(response);
  assert.equal(data.code, 'MP50793'); assert.equal(data.generated, true);
  assert.equal(new URL(data.link).searchParams.get('ref'), 'MP50793');
});

test('anonymous, invalid, suspended, unpositioned and unavailable responses are all private and never cached across mailboxes', async t => {
  t.mock.method(console, 'error', () => {});
  for (const [options, status, positioned] of [[{ token: '' }, 401, undefined], [{ email: '' }, 401, undefined],
    [{ authError: true }, 503, undefined], [{ databaseError: true }, 503, undefined],
    [{ rows: [[{ status: 'suspended' }]] }, 403, false], [{ rows: [[{ status: 'active', listed_by_blacklist: true }]] }, 403, false],
    [{ rows: [[], []] }, 200, false], [{ rows: [new Error('private-query-detail')] }, 502, undefined]]) {
    const fixture = route(options), response = await fixture.get();
    assert.equal(response.status, status); privateResponse(response);
    const data = await response.json(); assert.equal(data.positioned, positioned);
    assert.doesNotMatch(JSON.stringify(data), /private-|synthetic-token|member@example/);
    if (['token', 'email', 'authError', 'databaseError'].some(key => Object.hasOwn(options, key))) assert.equal(fixture.calls(), 0);
  }
});
