import test from 'node:test';
import assert from 'node:assert/strict';
import { coreFetch, getCloudflareScope, runtimeEnvironment, runCloudflareRequest, cloudflareReadiness } from './cloudflare-runtime.mjs';
import { cloudflarePortalGuard, portalProxyMatches, cloudflarePortalRequest } from './cloudflare-portal-guard.mjs';
import { memberMutationError } from './member-mutation-policy.mjs';
import { customerDomainDecision } from './domain-routing.js';
import { memberDb } from './member-db.js';
import { trustedAuthClientIp } from './better-auth-bridge.mjs';

const request = path => new Request(`https://app.mindblisspower.com${path}`);
const context = () => ({ waitUntil(promise) { return promise; } });
const env = { CLOUDFLARE_DEPLOYMENT_READY: 'true', AUTH_PROVIDER: 'better-auth', AUTH_PUBLIC_ORIGIN: 'https://app.mindblisspower.com', MEMBER_DB_PROVIDER: 'hyperdrive', MEMBER_DB_QUERY_CACHE_DISABLED: 'true',
  HYPERDRIVE_MEMBER_FRESH: { connectionString: 'postgres://synthetic:synthetic@127.0.0.1:5432/synthetic' }, CORE_API: { fetch: async () => new Response('private') } };

test('readiness requires explicit activation, fresh pool and private API binding', () => {
  assert.equal(cloudflareReadiness(env), true);
  for (const [key, value] of [['CLOUDFLARE_DEPLOYMENT_READY', 'false'], ['AUTH_PROVIDER', 'cognito'], ['MEMBER_DB_QUERY_CACHE_DISABLED', 'false'], ['HYPERDRIVE_MEMBER_FRESH', undefined], ['CORE_API', undefined]]) {
    assert.equal(cloudflareReadiness({ ...env, [key]: value }), false);
  }
});

test('concurrent Worker requests isolate database clients and release only after stream consumption', async () => {
  let closes = 0;
  const clients = [];
  const handler = async () => {
    const scope = getCloudflareScope();
    const sql = memberDb();
    assert.equal(memberDb(), sql); // Driver creation is lazy: no SQL/network.
    clients.push(sql);
    scope.resources.set('synthetic-close', { end: async () => { closes++; } });
    assert.deepEqual(runtimeEnvironment(), { ...env, NODE_ENV: 'production' });
    assert.throws(() => trustedAuthClientIp(new Headers()), /trusted_proxy_required/);
    return new Response('synthetic');
  };
  const responses = await Promise.all([runCloudflareRequest(request('/'), env, context(), handler), runCloudflareRequest(request('/'), env, context(), handler)]);
  assert.notEqual(clients[0], clients[1]);
  assert.equal(closes, 0);
  await Promise.all(responses.map(response => response.text()));
  assert.equal(closes, 2);
  assert.equal(getCloudflareScope(), undefined);
});

test('cancellation and exceptions release request resources', async () => {
  let closes = 0;
  const handler = async () => {
    getCloudflareScope().resources.set('synthetic', { end: async () => { closes++; } });
    return new Response(new ReadableStream({ pull() {} }));
  };
  const response = await runCloudflareRequest(request('/'), env, context(), handler);
  await response.body.cancel();
  await assert.rejects(runCloudflareRequest(request('/'), env, context(), async () => { await handler(); throw new Error('synthetic'); }), /synthetic/);
  assert.equal(closes, 2);
});

test('Worker API transport uses a host allowlist and has no network fallback', async () => {
  const calls = [];
  const privateEnv = { ...env, CORE_API: { fetch: async (input, init) => { calls.push([String(input), init]); return new Response('private'); } } };
  const response = await runCloudflareRequest(request('/'), privateEnv, context(), async () => {
    for (const url of ['https://auth.core.internal/api/auth/token', 'https://payments.core.internal/api/me']) assert.equal(await (await coreFetch(url)).text(), 'private');
    for (const url of ['https://public.example/api', 'http://auth.core.internal/api', 'https://user:pass@auth.core.internal/api', 'https://auth.core.internal:444/api', 'https://auth.core.internal/api#fragment']) await assert.rejects(coreFetch(url), /private_api_unavailable/);
    return new Response('ok');
  });
  await response.text();
  assert.equal(calls.length, 2);
  assert.ok(calls.every(([, init]) => init.cache === 'no-store' && init.redirect === 'manual'));
});

test('fresh SQL fails closed when Hyperdrive/cache gates are missing', async () => {
  for (const overrides of [{ MEMBER_DB_QUERY_CACHE_DISABLED: 'false' }, { HYPERDRIVE_MEMBER_FRESH: undefined }]) {
    const response = await runCloudflareRequest(request('/'), { ...env, ...overrides }, context(), async () => {
      assert.throws(memberDb, /member_database_unavailable/);
      return new Response(null, { status: 204 });
    });
    assert.equal(response.status, 204);
  }
});

test('Workers guard preserves proxy matcher, CSRF and customer/admin separation', () => {
  const paths = ['/api/member/tree', '/api/payments/create', '/api/network/change', '/api/admin/tree', '/dashboard/admin', '/dashboard/command-center', '/dashboard/ai', '/dashboard/ai-analysis'];
  for (const path of paths) {
    assert.equal(portalProxyMatches(path), true);
    const input = request(path);
    const decision = customerDomainDecision({ host: new URL(input.url).host, pathname: path });
    const result = cloudflarePortalGuard(input, {});
    if (decision.type === 'notFound') assert.equal(result.status, 404);
    else if (decision.type === 'redirect') { assert.equal(result.status, 308); assert.equal(result.headers.get('location'), decision.location); }
    else assert.equal(result, null);
  }
  for (const path of ['/api/memberish', '/api/auth/sign-in/email-otp', '/dashboard/ai-other', '/']) assert.equal(portalProxyMatches(path), false);
  for (const headers of [{}, { origin: 'https://evil.example', 'content-type': 'application/json' }, { origin: 'https://app.mindblisspower.com', 'content-type': 'text/plain' }]) {
    const input = new Request('https://app.mindblisspower.com/api/payments/create', { method: 'POST', headers });
    assert.equal(cloudflarePortalGuard(input, {}).status, memberMutationError(input, {}).status);
  }
});

test('edge normalization rejects forged forwarding hosts before CSRF checks', () => {
  const forged = new Request('https://app.mindblisspower.com/api/member/profile', { method: 'POST', headers: {
    origin: 'https://evil.example', 'x-forwarded-host': 'evil.example', 'x-forwarded-proto': 'https', 'content-type': 'application/json',
  } });
  const normalized = cloudflarePortalRequest(forged);
  assert.equal(normalized.headers.get('x-forwarded-host'), 'app.mindblisspower.com');
  assert.equal(cloudflarePortalGuard(normalized, {}).status, 403);
  assert.equal(cloudflareReadiness({ ...env, AUTH_PUBLIC_ORIGIN: 'http://app.mindblisspower.com' }), false);
});

test('Better Auth cutover rejects legacy Cognito without contacting its provider', () => {
  for (const path of ['/api/auth/cognito/code-login/request', '/api/auth/cognito/register', '/api/auth/cognito/phone/request', '/api/auth/%63ognito/register', '/api/auth/%2563ognito/register', '/api/auth%2Fcognito/register']) {
    assert.equal(cloudflarePortalGuard(request(path), { AUTH_PROVIDER: 'better-auth' }).status, 404);
  }
  assert.equal(cloudflarePortalGuard(request('/api/auth/sign-in/email-otp'), { AUTH_PROVIDER: 'better-auth' }), null);
});
