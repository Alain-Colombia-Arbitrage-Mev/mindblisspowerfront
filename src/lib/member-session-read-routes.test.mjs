import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { generateKeyPairSync, sign } from 'node:crypto';
import ts from 'typescript';
import { AuthServiceUnavailable } from './better-auth-bridge.mjs';
import { createBetterAuthVerifier } from './better-auth-token.mjs';
import { createPublicJwksCache } from './public-jwks-cache.mjs';
import { getCloudflareScope, runCloudflareRequest } from './cloudflare-runtime.mjs';
import { verifiedEmailFromIdTokenForSession } from './verify-id-token.js';

const env = {
  AUTH_PROVIDER: 'better-auth', NODE_ENV: 'production', AUTH_PUBLIC_ORIGIN: 'https://portal.example.test',
  BETTER_AUTH_BACKEND_URL: 'https://auth.core.internal', BETTER_AUTH_JWT_ISSUER: 'https://auth.example.test',
  BETTER_AUTH_JWT_AUDIENCE: 'synthetic-member-services', BETTER_AUTH_JWKS_URL: 'https://auth.core.internal/api/auth/jwks',
};
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'synthetic-member-session', alg: 'RS256', use: 'sig' };
function token(change = {}) {
  const now = Math.floor(Date.now() / 1000);
  const payload = { sub: 'synthetic-private-subject', person_public_id: '00000000-0000-4000-8000-000000000001',
    email: 'synthetic-private@example.test', email_verified: true, authVerified: true,
    iss: env.BETTER_AUTH_JWT_ISSUER, aud: env.BETTER_AUTH_JWT_AUDIENCE, iat: now, exp: now + 300, ...change };
  const message = [{ alg: 'RS256', kid: jwk.kid }, payload]
    .map(value => Buffer.from(JSON.stringify(value)).toString('base64url')).join('.');
  return `${message}.${sign('RSA-SHA256', Buffer.from(message), privateKey).toString('base64url')}`;
}

function route(name, { rawToken, tokenError, calls }) {
  const source = readFileSync(new URL(`../app/api/${name}/route.js`, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const denied = kind => () => { calls.push(kind); assert.fail(`authentication failure reached ${kind}`); };
  const mocks = {
    '@/lib/admin-bff': { rawIdToken: async () => { if (tokenError) throw tokenError; return rawToken; }, idTokenHeader: denied('service headers') },
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
    '@/lib/verify-id-token': { verifiedEmailFromIdTokenForSession },
    '@/lib/better-auth-bridge.mjs': { AuthServiceUnavailable },
    '@/lib/member-db': { memberDb: denied('database') },
    '@/lib/member-read-policy.mjs': { memberReadLimit: denied('member budget'), withMemberTreeCapacity: denied('tree query') },
    '@/lib/tree-read-model.mjs': { childCoverage: denied('tree projection'), loadedChildCounts: denied('child projection') },
    '@/lib/cloudflare-runtime.mjs': { coreFetch: denied('payments provider transport'), runtimeEnvironment: denied('runtime configuration') },
    '@/lib/referral-links.mjs': { buildReferralLink: denied('referral link'), referralPublicOrigin: denied('referral origin') },
  };
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(id => {
    assert.ok(Object.hasOwn(mocks, id), `unexpected route dependency ${id}`);
    return mocks[id];
  }, module, module.exports);
  assert.equal(module.exports.dynamic, 'force-dynamic');
  return module.exports.GET;
}

for (const name of ['member/tree', 'member/referral', 'payments/me']) {
  for (const failure of ['missing', 'tampered', 'expired', 'jwks unavailable', 'token service unavailable']) {
    test(`${name}: ${failure} preserves unavailable versus invalid without database, service data or cookies`, async t => {
      const logs = [];
      t.mock.method(console, 'warn', value => logs.push(JSON.parse(value)));
      const calls = [];
      let keyRequests = 0;
      const checked = createBetterAuthVerifier(env, { publicKeyCache: createPublicJwksCache(), fetchImpl: async () => {
        keyRequests++;
        assert.equal(failure, 'jwks unavailable', 'seeded invalid proofs must not fetch keys');
        return new Response(null, { status: 503 });
      } });
      if (failure !== 'jwks unavailable') checked.cacheJwks({ keys: [jwk] });
      let rawToken = token();
      if (failure === 'missing') rawToken = '';
      if (failure === 'expired') {
        const now = Math.floor(Date.now() / 1000);
        rawToken = token({ iat: now - 301, exp: now - 1 });
      }
      if (failure === 'tampered') {
        const parts = rawToken.split('.');
        parts[2] = `${parts[2][0] === 'A' ? 'B' : 'A'}${parts[2].slice(1)}`;
        rawToken = parts.join('.');
      }
      const get = route(name, { rawToken, calls,
        tokenError: failure === 'token service unavailable' ? new AuthServiceUnavailable() : undefined });
      const request = new Request(`https://portal.example.test/api/${name}`);
      const response = await runCloudflareRequest(request, env, { waitUntil() {} }, async () => {
        getCloudflareScope().resources.set('auth-verifier', checked);
        return get(request);
      });
      const unavailable = failure.includes('unavailable');
      assert.equal(response.status, unavailable ? 503 : 401);
      assert.match(response.headers.get('cache-control'), /^private, no-store(?:, max-age=0)?$/);
      assert.equal(response.headers.get('vary'), 'Cookie');
      assert.equal(response.headers.get('set-cookie'), null);
      assert.deepEqual(await response.json(), {
        error: unavailable ? 'authentication_unavailable' : failure === 'missing' ? 'unauthenticated' : 'session-invalid',
      });
      assert.deepEqual(calls, []);
      assert.equal(keyRequests, failure === 'jwks unavailable' ? 1 : 0);
      assert.doesNotMatch(JSON.stringify(logs), /synthetic|@|private-subject|person_public_id|cookie|stack/);
    });
  }
}
