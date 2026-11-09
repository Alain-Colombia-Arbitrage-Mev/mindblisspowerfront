import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { generateKeyPairSync, sign } from 'node:crypto';
import ts from 'typescript';
import { AuthServiceUnavailable } from './better-auth-bridge.mjs';
import { createBetterAuthVerifier } from './better-auth-token.mjs';
import { createPublicJwksCache } from './public-jwks-cache.mjs';
import { getCloudflareScope, runCloudflareRequest } from './cloudflare-runtime.mjs';
import { verifyIdTokenForSession } from './verify-id-token.js';
import { handleMembershipCheckout } from './checkout-bff.mjs';
import { handleNOWPaymentsStatus } from './nowpayments-status-bff.mjs';
import { handleNOWPaymentsPurchases } from './nowpayments-purchases-bff.mjs';
import { handleReferralAttribution } from './referral-attribution-bff.mjs';

const env = {
  AUTH_PROVIDER: 'better-auth', NODE_ENV: 'production', AUTH_PUBLIC_ORIGIN: 'https://portal.example.test',
  BETTER_AUTH_BACKEND_URL: 'https://auth.core.internal', BETTER_AUTH_JWT_ISSUER: 'https://auth.example.test',
  BETTER_AUTH_JWT_AUDIENCE: 'synthetic-member-services', BETTER_AUTH_JWKS_URL: 'https://auth.core.internal/api/auth/jwks',
  PAYMENTS_SERVICE_TOKEN: 'synthetic-service-token', NOWPAYMENTS_WEBHOOK_ENABLED: 'true', NOWPAYMENTS_MEMBERSHIPS_ENABLED: 'true',
  VP_PAYMENTS_URL: 'https://payments.core.internal',
};
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'synthetic-member-proxy', alg: 'RS256', use: 'sig' };
const order = '00000000-0000-4000-8000-000000000002';
function token(expired = false) {
  const now = Math.floor(Date.now() / 1000);
  const claims = { sub: 'synthetic-private-subject', person_public_id: '00000000-0000-4000-8000-000000000001',
    email: 'synthetic-private@example.test', email_verified: true, authVerified: true,
    iss: env.BETTER_AUTH_JWT_ISSUER, aud: env.BETTER_AUTH_JWT_AUDIENCE,
    iat: expired ? now - 301 : now, exp: expired ? now - 1 : now + 300 };
  const message = [{ alg: 'RS256', kid: jwk.kid }, claims]
    .map(value => Buffer.from(JSON.stringify(value)).toString('base64url')).join('.');
  return `${message}.${sign('RSA-SHA256', Buffer.from(message), privateKey).toString('base64url')}`;
}

function route(path, method, rawToken, tokenError, serviceCalls) {
  const source = readFileSync(new URL(`../app/api/${path}/route.js`, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const mocks = {
    '@/lib/admin-bff': { rawIdToken: async () => { if (tokenError) throw tokenError; return rawToken; } },
    '@/lib/verify-id-token': { verifyIdTokenForSession },
    '@/lib/cloudflare-runtime.mjs': { runtimeEnvironment: () => env, coreFetch: () => {
      serviceCalls.push(path); assert.fail('auth failure must not create, query, resume or cancel a payment or persist a referral');
    } },
    '@/lib/checkout-bff.mjs': { handleMembershipCheckout },
    '@/lib/nowpayments-status-bff.mjs': { handleNOWPaymentsStatus },
    '@/lib/nowpayments-purchases-bff.mjs': { handleNOWPaymentsPurchases },
    '@/lib/referral-attribution-bff.mjs': { handleReferralAttribution },
  };
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(id => {
    assert.ok(Object.hasOwn(mocks, id), `unexpected proxy dependency ${id}`);
    return mocks[id];
  }, module, module.exports);
  assert.equal(module.exports.dynamic, 'force-dynamic');
  return module.exports[method];
}

const cases = [
  ['payments/checkout', 'POST', 'authentication-unavailable'],
  ['payments/nowpayments/status', 'GET', 'payment_status_unavailable'],
  ['payments/nowpayments/purchases', 'GET', 'authentication_unavailable'],
  ['payments/nowpayments/purchases/cancel', 'POST', 'authentication_unavailable'],
  ['payments/nowpayments/purchases/resume', 'POST', 'authentication_unavailable'],
  ['member/referral-attribution', 'GET', 'referral_unavailable'],
  ['member/referral-attribution', 'POST', 'referral_unavailable'],
];
for (const [path, method, unavailableError] of cases) {
  for (const failure of ['expired', 'jwks unavailable', 'token service unavailable']) {
    test(`${method} ${path}: ${failure} reaches the existing safe BFF catch before any financial transport`, async t => {
      const logs = [];
      t.mock.method(console, 'warn', value => logs.push(JSON.parse(value)));
      const serviceCalls = [];
      let keyRequests = 0;
      const checked = createBetterAuthVerifier(env, { publicKeyCache: createPublicJwksCache(), fetchImpl: async () => {
        keyRequests++;
        assert.equal(failure, 'jwks unavailable');
        return new Response(null, { status: 503 });
      } });
      if (failure !== 'jwks unavailable') checked.cacheJwks({ keys: [jwk] });
      const get = route(path, method, token(failure === 'expired'),
        failure === 'token service unavailable' ? new AuthServiceUnavailable() : undefined, serviceCalls);
      const url = `https://portal.example.test/api/${path}${path.endsWith('/status') ? `?order_id=${order}` : ''}`;
      const request = new Request(url, { method, headers: {
        origin: env.AUTH_PUBLIC_ORIGIN, 'sec-fetch-site': 'same-origin', 'content-type': 'application/json',
      }, ...(method === 'POST' ? { body: JSON.stringify({ order_id: order }) } : {}) });
      const response = await runCloudflareRequest(request, env, { waitUntil() {} }, async () => {
        getCloudflareScope().resources.set('auth-verifier', checked);
        return get(request);
      });
      assert.equal(response.status, failure === 'expired' ? 401 : 503);
      assert.deepEqual(await response.json(), { error: failure === 'expired' ? 'unauthenticated' : unavailableError });
      assert.equal(response.headers.get('cache-control'), path === 'member/referral-attribution'
        ? 'private, no-store, max-age=0' : 'private, no-store');
      assert.equal(response.headers.get('set-cookie'), null);
      assert.equal(request.bodyUsed, false, 'authentication must fail before parsing any mutation body');
      assert.deepEqual(serviceCalls, []);
      assert.equal(keyRequests, failure === 'jwks unavailable' ? 1 : 0);
      assert.doesNotMatch(JSON.stringify(logs), /synthetic|@|private-subject|person_public_id|cookie|stack/);
    });
  }
}
