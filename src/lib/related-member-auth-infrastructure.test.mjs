import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { AuthServiceUnavailable } from './better-auth-bridge.mjs';

const routes = [
  { name: 'ranks', path: 'member/ranks', method: 'GET' },
  { name: 'BMP status', path: 'payments/bmp-status', method: 'GET', service: 'withdrawals', upstreamPath: '/api/payments/bmp-status' },
  { name: 'withdrawal', path: 'payments/withdraw', method: 'POST', service: 'withdrawals', upstreamPath: '/api/payments/withdraw', body: { amount: '100.00', bank_info: 'synthetic bank' } },
  { name: 'existing KYC documents route', path: 'member/kyc/documents', method: 'GET', service: 'payments', upstreamPath: '/api/member/kyc/documents' },
  { name: 'existing KYC confirmation route', path: 'member/kyc/confirm', method: 'POST', service: 'payments', upstreamPath: '/api/member/kyc/confirm', body: { document_id: 42 } },
];

function fixture(descriptor, {
  token = 'synthetic-private-token', email = 'member@example.test', tokenError, verificationError,
  bodyError, body = descriptor.body, providerStatus = 200, providerPayload = { ok: true }, providerError,
  catalogError, limitResponse = null,
} = {}) {
  const calls = { token: 0, verification: 0, body: 0, limiter: 0, catalog: 0, provider: 0, idTokenHeader: 0 };
  let providerRequest;
  const source = readFileSync(new URL(`../app/api/${descriptor.path}/route.js`, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const mocks = {
    '@/lib/admin-bff': {
      rawIdToken: async () => { calls.token++; if (tokenError) throw tokenError; return token; },
      idTokenHeader: async () => { calls.idTokenHeader++; return { 'X-VP-Id-Token': token }; },
    },
    'next/server': { NextResponse: { json: (...args) => Response.json(...args) } },
    '@/lib/verify-id-token': {
      // Intentionally omit the legacy helper: every route must use the strict
      // session contract so JWKS outages cannot be misclassified as bad proof.
      verifiedEmailFromIdTokenForSession: async value => {
        calls.verification++;
        assert.equal(value, token);
        if (verificationError) throw verificationError;
        return email;
      },
    },
    '@/lib/catalog': { getRankCatalog: async () => {
      calls.catalog++;
      if (catalogError) throw catalogError;
      return { ranks: [{ id: 1, name: 'Synthetic rank' }] };
    } },
    '@/lib/member-read-policy.mjs': { memberReadLimit: (value, scope) => {
      calls.limiter++;
      assert.equal(value, email);
      assert.equal(scope, 'ranks');
      return limitResponse;
    } },
    '@/lib/cloudflare-runtime.mjs': { coreFetch: async (url, options) => {
      calls.provider++;
      providerRequest = { url, options };
      if (providerError) throw providerError;
      return Response.json(providerPayload, { status: providerStatus });
    } },
  };
  const module = { exports: {} };
  // Inject synthetic configuration instead of inspecting or mutating process.env.
  new Function('require', 'module', 'exports', 'process', code)(id => {
    assert.ok(Object.hasOwn(mocks, id), `Unexpected route dependency ${id}`);
    return mocks[id];
  }, module, module.exports, { env: {
    VP_WITHDRAWALS_URL: 'https://withdrawals.example.test',
    VP_PAYMENTS_URL: 'https://payments.example.test',
    PAYMENTS_SERVICE_TOKEN: 'synthetic-service-token',
  } });
  assert.equal(module.exports.runtime, 'nodejs');
  assert.equal(module.exports.dynamic, 'force-dynamic');
  return {
    calls,
    providerRequest: () => providerRequest,
    invoke: () => module.exports[descriptor.method]({ json: async () => {
      calls.body++;
      if (bodyError) throw bodyError;
      return body;
    } }),
  };
}

function privateAuthResponse(response) {
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(response.headers.get('vary'), 'Cookie');
  assert.equal(response.headers.get('set-cookie'), null);
}

function noProtectedWork(calls) {
  for (const key of ['body', 'limiter', 'catalog', 'provider', 'idTokenHeader']) assert.equal(calls[key], 0, key);
}

for (const descriptor of routes) {
  for (const phase of ['token', 'verification']) {
    test(`${descriptor.name}: ${phase} infrastructure failure is private 503 before protected work`, async () => {
      const setup = fixture(descriptor, {
        [phase === 'token' ? 'tokenError' : 'verificationError']: new AuthServiceUnavailable(),
      });
      const response = await setup.invoke();
      assert.equal(response.status, 503);
      privateAuthResponse(response);
      assert.deepEqual(await response.json(), { error: 'authentication_unavailable' });
      assert.equal(setup.calls.verification, phase === 'token' ? 0 : 1);
      noProtectedWork(setup.calls);
    });
  }

  test(`${descriptor.name}: genuinely missing or invalid identity remains 401`, async () => {
    for (const [options, expected] of [[{ token: '' }, 'unauthenticated'], [{ email: '' }, 'session-invalid']]) {
      const setup = fixture(descriptor, options);
      const response = await setup.invoke();
      assert.equal(response.status, 401);
      privateAuthResponse(response);
      assert.deepEqual(await response.json(), { error: expected });
      noProtectedWork(setup.calls);
    }
  });

  test(`${descriptor.name}: auth error details and private token are never returned`, async () => {
    const setup = fixture(descriptor, { verificationError: new Error('private-jwks-endpoint-and-token') });
    const response = await setup.invoke();
    assert.equal(response.status, 503);
    privateAuthResponse(response);
    const text = await response.text();
    assert.equal(text, '{"error":"authentication_unavailable"}');
    assert.doesNotMatch(text, /private-|member@example|stack|diagnostic|phase/);
    noProtectedWork(setup.calls);
  });

  if (descriptor.service) {
    test(`${descriptor.name}: verified requests retain existing identity forwarding and service response`, async () => {
      const setup = fixture(descriptor, { body: { ...descriptor.body, email: 'untrusted@example.test' }, providerPayload: { status: 'synthetic-existing-result' } });
      const response = await setup.invoke();
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { status: 'synthetic-existing-result' });
      const { url, options } = setup.providerRequest();
      assert.equal(new URL(url).origin, `https://${descriptor.service}.example.test`);
      assert.equal(new URL(url).pathname, descriptor.upstreamPath);
      assert.equal(options.cache, 'no-store');
      assert.equal(options.headers['X-VP-Service-Token'], 'synthetic-service-token');
      assert.equal(options.headers['X-VP-Id-Token'], 'synthetic-private-token');
      if (descriptor.method === 'POST') {
        assert.equal(options.method, 'POST');
        assert.deepEqual(JSON.parse(options.body), { email: 'member@example.test', ...descriptor.body });
      } else {
        assert.equal(new URL(url).searchParams.get('email'), 'member@example.test');
      }
      assert.equal(setup.calls.provider, 1);
    });

    test(`${descriptor.name}: real upstream authorization failures remain unchanged`, async () => {
      for (const status of [401, 403]) {
        const setup = fixture(descriptor, { providerStatus: status, providerPayload: { error: 'synthetic_access_denied' } });
        const response = await setup.invoke();
        assert.equal(response.status, status);
        assert.deepEqual(await response.json(), { error: 'synthetic_access_denied' });
        assert.equal(setup.calls.provider, 1);
      }
    });

    test(`${descriptor.name}: service transport failure is still 502, not an auth failure`, async t => {
      t.mock.method(console, 'error', () => {});
      const setup = fixture(descriptor, { providerError: new Error('synthetic transport failure') });
      const response = await setup.invoke();
      assert.equal(response.status, 502);
      assert.deepEqual(await response.json(), { error: descriptor.path === 'payments/bmp-status' ? 'withdrawals-unreachable' : 'payments-unreachable' });
    });
  }

  if (descriptor.method === 'POST') {
    test(`${descriptor.name}: verified invalid JSON and fields still fail before provider calls`, async () => {
      for (const [options, error] of [[{ bodyError: new SyntaxError('synthetic bad JSON') }, 'invalid-json'], [{ body: {} }, 'missing-fields']]) {
        const setup = fixture(descriptor, options);
        const response = await setup.invoke();
        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), { error });
        assert.equal(setup.calls.body, 1);
        assert.equal(setup.calls.provider, 0);
      }
    });
  }
}

test('ranks: verified catalog and rate-limit behavior is preserved', async () => {
  const healthy = fixture(routes[0]);
  const response = await healthy.invoke();
  assert.equal(response.status, 200);
  privateAuthResponse(response);
  assert.deepEqual(await response.json(), { ranks: [{ id: 1, name: 'Synthetic rank' }] });
  assert.equal(healthy.calls.limiter, 1);
  assert.equal(healthy.calls.catalog, 1);

  const limitResponse = Response.json({ error: 'rate-limited' }, { status: 429 });
  const limited = fixture(routes[0], { limitResponse });
  assert.equal(await limited.invoke(), limitResponse);
  assert.equal(limited.calls.catalog, 0);

  const unavailable = fixture(routes[0], { catalogError: new Error('private catalog detail') });
  const failure = await unavailable.invoke();
  assert.equal(failure.status, 503);
  privateAuthResponse(failure);
  assert.deepEqual(await failure.json(), { error: 'ranks-unavailable' });
});
