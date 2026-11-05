import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { AuthServiceUnavailable } from './better-auth-bridge.mjs';
import * as profilePolicy from './member-profile.mjs';
import * as onboardingPolicy from './member-onboarding-schema.js';
import { memberMutationError } from './member-mutation-policy.mjs';
import { hasSameOrigin } from './request-origin.js';

const profile = { first_name: 'Synthetic', last_name: 'Member', phone: '', country: '', payout_wallet_usdc: '' };
const onboarding = {
  fullName: 'Synthetic Member', phone: '+573001234567', country: 'Colombia', city: 'Bogota',
  preferredLanguage: 'es', communicationChannel: 'email', memberInterest: 'community',
  acceptsPrivacy: true, acceptsCommunications: false,
};
const routes = [
  { path: 'member/news', method: 'GET', upstreamPath: '/api/member/news' },
  { path: 'member/onboarding', method: 'GET', upstreamPath: '/api/member/onboarding' },
  { path: 'member/onboarding', method: 'POST', upstreamPath: '/api/member/onboarding', input: onboarding },
  { path: 'member/profile', method: 'GET', upstreamPath: '/api/member/profile', profile: true },
  { path: 'member/profile', method: 'POST', upstreamPath: '/api/member/profile', input: { name: 'Synthetic Member' }, profile: true },
  { path: 'member/support/ticket', method: 'POST', upstreamPath: '/api/support/ticket', input: { subject: 'Synthetic subject', body: 'Synthetic request' } },
  { path: 'member/support/tickets', method: 'GET', upstreamPath: '/api/support/tickets' },
  { path: 'network/analyze', method: 'GET', analysis: true },
  { path: 'network/analyze', method: 'POST', upstreamPath: '/network/analyze', input: { metrics: { total_members: 10 } }, analysis: true },
];

function fixture(descriptor, {
  token = 'synthetic-private-token', email = 'member@example.test', tokenError, verificationError,
  origin = 'https://portal.example.test', contentType = 'application/json',
  rawBody = JSON.stringify(descriptor.input ?? {}), providerStatus = 200, providerError, engineEnabled = true,
  providerPayload = descriptor.profile ? descriptor.method === 'POST' ? { ok: true, profile } : profile : { result: 'synthetic-provider-result' },
} = {}) {
  const calls = { token: 0, verification: 0, body: 0, profileParser: 0, schema: 0, limiter: 0, model: 0, provider: 0 };
  let providerRequest;
  const env = {
    AUTH_PUBLIC_ORIGIN: 'https://portal.example.test', VP_PAYMENTS_URL: 'https://payments.example.test',
    PAYMENTS_SERVICE_TOKEN: 'synthetic-service-token',
    ...(engineEnabled ? { VP_ENGINE_HTTP_URL: 'https://engine.example.test' } : {}),
  };
  const verify = async value => {
    calls.verification++;
    assert.equal(value, token);
    if (verificationError) throw verificationError;
    return email ? { email } : null;
  };
  const mocks = {
    '@/lib/admin-bff': { rawIdToken: async () => { calls.token++; if (tokenError) throw tokenError; return token; } },
    'next/server': { NextResponse: { json: (...args) => Response.json(...args) } },
    '@/lib/verify-id-token': {
      // No legacy helper is available in this fixture; aliases must resolve to
      // the strict contract that throws only for unavailable verification.
      verifyIdTokenForSession: verify,
      verifiedEmailFromIdTokenForSession: async value => (await verify(value))?.email || '',
    },
    '@/lib/better-auth-bridge.mjs': { AuthServiceUnavailable },
    '@/lib/cloudflare-runtime.mjs': {
      runtimeEnvironment: () => env,
      coreFetch: async (url, options) => {
        calls.provider++;
        providerRequest = { url, options };
        if (providerError) throw providerError;
        return Response.json(providerPayload, { status: providerStatus });
      },
    },
    '@/lib/member-mutation-policy.mjs': { memberMutationError },
    '@/lib/request-origin': { hasSameOrigin },
    '@/lib/rate-limit': { rateLimit: () => { calls.limiter++; return { allowed: true }; } },
    '@/lib/member-onboarding-schema': {
      ...onboardingPolicy,
      memberOnboardingSchema: { safeParse: input => { calls.schema++; return onboardingPolicy.memberOnboardingSchema.safeParse(input); } },
    },
    '@/lib/member-profile.mjs': {
      ...profilePolicy,
      readMemberProfileJson: (...args) => { calls.profileParser++; return profilePolicy.readMemberProfileJson(...args); },
    },
    '@/lib/dashboardNetworkModel': { getNetworkDashboardModel: () => {
      calls.model++;
      return {
        insights: ['synthetic insight'], llmContext: { source: 'synthetic' },
        network: { totalMembers: 10, activeMembers: 8, leftLeg: { members: 5, volume: 100 }, rightLeg: { members: 5, volume: 100 } },
      };
    } },
  };
  const source = readFileSync(new URL(`../app/api/${descriptor.path}/route.js`, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', 'process', code)(id => {
    assert.ok(Object.hasOwn(mocks, id), `Unexpected dependency ${id}`);
    return mocks[id];
  }, module, module.exports, { env });
  assert.equal(module.exports.runtime, 'nodejs');
  assert.equal(module.exports.dynamic, 'force-dynamic');
  const request = new Request(`https://portal.example.test/api/${descriptor.path}`, {
    method: descriptor.method,
    headers: { origin, 'content-type': contentType, 'sec-fetch-site': 'same-origin' },
    ...(descriptor.method === 'POST' ? { body: rawBody } : {}),
  });
  const observedRequest = {
    url: request.url, method: request.method, headers: request.headers, signal: request.signal,
    get body() { calls.body++; return request.body; },
    json: () => { calls.body++; return request.json(); },
    text: () => { calls.body++; return request.text(); },
  };
  return { calls, providerRequest: () => providerRequest, invoke: () => module.exports[descriptor.method](observedRequest) };
}

function privateResponse(response, descriptor) {
  assert.match(response.headers.get('cache-control'), /^private, no-store(?:, max-age=0)?$/);
  if (!descriptor.profile) assert.equal(response.headers.get('vary'), 'Cookie');
  assert.equal(response.headers.get('set-cookie'), null);
}

function noProtectedWork(calls) {
  for (const key of ['body', 'profileParser', 'schema', 'limiter', 'model', 'provider']) assert.equal(calls[key], 0, key);
}

for (const descriptor of routes) {
  const name = `${descriptor.method} ${descriptor.path}`;
  for (const phase of ['token', 'verification']) {
    test(`${name}: ${phase} outage is generic private 503 before reading body or data`, async () => {
      const setup = fixture(descriptor, {
        [phase === 'token' ? 'tokenError' : 'verificationError']: new AuthServiceUnavailable(),
      });
      const response = await setup.invoke();
      assert.equal(response.status, 503);
      privateResponse(response, descriptor);
      assert.deepEqual(await response.json(), { error: 'authentication_unavailable' });
      assert.equal(setup.calls.verification, phase === 'token' ? 0 : 1);
      noProtectedWork(setup.calls);
    });
  }

  test(`${name}: missing or invalid proof remains 401, without protected work`, async () => {
    for (const [options, error] of [[{ token: '' }, 'unauthenticated'], [{ email: '' }, descriptor.analysis ? 'unauthenticated' : 'session-invalid']]) {
      const setup = fixture(descriptor, options);
      const response = await setup.invoke();
      assert.equal(response.status, 401);
      privateResponse(response, descriptor);
      assert.deepEqual(await response.json(), { error });
      noProtectedWork(setup.calls);
    }
  });

  test(`${name}: verified identity preserves the existing successful route contract`, async () => {
    const setup = fixture(descriptor);
    const response = await setup.invoke();
    assert.equal(response.status, 200);
    privateResponse(response, descriptor);
    const data = await response.json();
    if (descriptor.analysis && descriptor.method === 'GET') {
      assert.deepEqual(data, { provider: 'local-network-rules', insights: ['synthetic insight'], context: { source: 'synthetic' } });
      assert.equal(setup.calls.provider, 0);
      assert.equal(setup.calls.model, 1);
      return;
    }
    assert.deepEqual(data, descriptor.profile ? descriptor.method === 'POST' ? { ok: true, profile } : profile : { result: 'synthetic-provider-result' });
    assert.equal(setup.calls.provider, 1);
    const { url, options } = setup.providerRequest();
    assert.equal(new URL(url).pathname, descriptor.upstreamPath);
    assert.equal(options.cache, 'no-store');
    if (!descriptor.analysis) {
      assert.equal(options.headers['X-VP-Id-Token'], 'synthetic-private-token');
      assert.equal(options.headers['X-VP-Service-Token'], 'synthetic-service-token');
      if (descriptor.method === 'POST') assert.equal(JSON.parse(options.body).email, 'member@example.test');
    }
    assert.equal(setup.calls.verification, 1);
  });

  if (!descriptor.analysis) {
    test(`${name}: upstream authorization denial is not converted to an infrastructure outage`, async () => {
      const setup = fixture(descriptor, { providerStatus: 403, providerPayload: { error: 'account_suspended' } });
      const response = await setup.invoke();
      assert.equal(response.status, 403);
      privateResponse(response, descriptor);
      assert.deepEqual(await response.json(), { error: 'account_suspended' });
      assert.equal(setup.calls.provider, 1);
    });
  }
}

for (const path of ['member/onboarding', 'member/profile']) {
  const descriptor = routes.find(route => route.path === path && route.method === 'POST');
  test(`POST ${path}: origin and content-type defenses still reject before auth or body reads`, async () => {
    for (const [options, status, error] of [
      [{ origin: 'https://other.example.test' }, 403, 'invalid_origin'],
      [{ contentType: 'text/plain' }, 415, 'json_required'],
    ]) {
      const setup = fixture(descriptor, { ...options, tokenError: new AuthServiceUnavailable() });
      const response = await setup.invoke();
      assert.equal(response.status, status);
      assert.deepEqual(await response.json(), { error });
      assert.equal(setup.calls.token, 0);
      noProtectedWork(setup.calls);
    }
  });
}

test('POST network/analyze: malformed and nonobject JSON fails safely before model or engine', async () => {
  const descriptor = routes.find(route => route.analysis && route.method === 'POST');
  for (const rawBody of ['{', 'null', '[]', '"text"', '42']) {
    const setup = fixture(descriptor, { rawBody });
    const response = await setup.invoke();
    assert.equal(response.status, 400);
    privateResponse(response, descriptor);
    assert.deepEqual(await response.json(), { error: 'invalid_json' });
    assert.equal(setup.calls.body, 1);
    assert.equal(setup.calls.provider, 0);
    assert.equal(setup.calls.model, 0);
  }
});

test('POST network/analyze: engine transport fallback never exposes raw infrastructure errors', async () => {
  const descriptor = routes.find(route => route.analysis && route.method === 'POST');
  const setup = fixture(descriptor, { providerError: new Error('private-engine-hostname-and-token') });
  const response = await setup.invoke();
  assert.equal(response.status, 200);
  privateResponse(response, descriptor);
  const data = await response.json();
  assert.equal(data.mode, 'deterministic');
  assert.equal(data.provider, 'next-local-network-rules');
  assert.deepEqual(data.warnings, ['El servicio de análisis no está disponible; se muestra un cálculo local.']);
  assert.doesNotMatch(JSON.stringify(data), /private-engine|synthetic-private-token|stack/);
});
