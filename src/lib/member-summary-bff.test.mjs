import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const rawToken = 'synthetic-verified-token';
const email = 'synthetic-member@example.test';

function compile(path, mocks, env) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', 'process', code)(id => {
    assert.ok(Object.hasOwn(mocks, id), `unexpected dependency ${id}`);
    return mocks[id];
  }, module, module.exports, { env });
  return module.exports;
}

function fixture({ token = rawToken, verifiedEmail = email, tokenError, verifyError, config = true,
  forward = true, upstreamStatus = 200, upstreamBody = { active_packages: 1 }, transportError,
  upstreamHeaders = {} } = {}) {
  const calls = { cookies: 0, verify: 0, upstream: 0 };
  const env = {
    ...(config ? { VP_PAYMENTS_URL: 'https://payments.core.internal', PAYMENTS_SERVICE_TOKEN: 'synthetic-service' } : {}),
    VP_FORWARD_ID_TOKEN: forward ? '1' : '0',
  };
  const bridge = {
    betterAuthEnabled: () => false, betterAuthServiceToken: () => assert.fail('no Better Auth exchange in synthetic legacy fixture'),
    trustedAuthClientIp: () => assert.fail('no IP read'), AuthServiceUnavailable: class extends Error {}, AuthAccessRestricted: class extends Error {},
  };
  const bff = compile('./admin-bff.js', {
    'next/headers': { cookies: async () => {
      calls.cookies++;
      if (tokenError) throw tokenError;
      assert.equal(calls.cookies, 1, 'do not re-read cookies after verifying the request token');
      return { get: () => ({ value: token }) };
    }, headers: () => assert.fail('no header read') },
    './verify-id-token': {}, './better-auth-bridge.mjs': bridge,
    './cloudflare-runtime.mjs': {}, './private-service-request.mjs': {},
  }, env);
  const route = compile('../app/api/payments/me/route.js', {
    '@/lib/admin-bff': bff,
    'next/server': { NextResponse: { json: (...args) => Response.json(...args) } },
    '@/lib/verify-id-token': { verifiedEmailFromIdTokenForSession: async value => {
      calls.verify++; assert.equal(value, token);
      if (verifyError) throw verifyError;
      return verifiedEmail;
    } },
    '@/lib/cloudflare-runtime.mjs': { coreFetch: async (url, options) => {
      calls.upstream++;
      assert.equal(new URL(url).origin, 'https://payments.core.internal');
      assert.equal(new URL(url).pathname, '/api/payments/me');
      assert.equal(new URL(url).searchParams.get('email'), email, 'ignore the claimed browser email');
      assert.equal(new URL(url).searchParams.get('fresh'), '1');
      assert.deepEqual(options.headers, { 'X-VP-Service-Token': 'synthetic-service',
        ...(forward ? { 'X-VP-Id-Token': rawToken } : {}) });
      assert.equal(options.cache, 'no-store'); assert.equal(options.redirect, 'manual');
      assert.ok(options.signal instanceof AbortSignal);
      if (transportError) throw transportError;
      return Response.json(upstreamBody, { status: upstreamStatus, headers: upstreamHeaders });
    } },
  }, env);
  return { calls, get: () => route.GET(new Request('https://portal.example.test/api/payments/me?fresh=1&email=untrusted@example.test')) };
}

function privateResponse(response) {
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(response.headers.get('vary'), 'Cookie');
  assert.equal(response.headers.get('set-cookie'), null);
  assert.equal(response.headers.get('location'), null);
}

test('summary forwards the same verified request token once, without a second fallible cookie read', async () => {
  for (const forward of [true, false]) {
    const setup = fixture({ forward });
    const response = await setup.get();
    assert.equal(response.status, 200);
    privateResponse(response);
    assert.deepEqual(await response.json(), { active_packages: 1 });
    assert.deepEqual(setup.calls, { cookies: 1, verify: 1, upstream: 1 });
  }
});

test('summary identity dependency errors fail closed as private 503 before any protected transport', async () => {
  for (const options of [{ tokenError: new Error('private-cookie-detail') }, { verifyError: new Error('private-jwks-detail') }]) {
    const setup = fixture(options);
    const response = await setup.get();
    assert.equal(response.status, 503);
    privateResponse(response);
    assert.deepEqual(await response.json(), { error: 'authentication_unavailable' });
    assert.equal(setup.calls.upstream, 0);
  }
});

test('summary genuinely absent or invalid identity remains 401, never a successful empty summary', async () => {
  for (const [options, error] of [[{ token: '' }, 'unauthenticated'], [{ verifiedEmail: null }, 'session-invalid']]) {
    const setup = fixture(options);
    const response = await setup.get();
    assert.equal(response.status, 401);
    privateResponse(response);
    assert.deepEqual(await response.json(), { error });
    assert.equal(setup.calls.upstream, 0);
  }
});

test('summary preserves real upstream authorization and infrastructure errors without exposing provider payloads', async () => {
  for (const [upstreamStatus, error] of [[401, 'invalid_id_token'], [403, 'account_suspended'], [503, 'authentication_unavailable']]) {
    const setup = fixture({ upstreamStatus, upstreamBody: { error, private: 'not-public' },
      upstreamHeaders: { 'set-cookie': 'private-cookie', location: 'https://untrusted.example.test' } });
    const response = await setup.get();
    assert.equal(response.status, upstreamStatus); privateResponse(response);
    assert.deepEqual(await response.json(), { error });
    assert.equal(setup.calls.upstream, 1);
  }
  const unknown = await fixture({ upstreamStatus: 500, upstreamBody: { error: 'postgres://private-password@host' } }).get();
  assert.deepEqual(await unknown.json(), { error: 'summary-failed' });
});

test('summary transport or configuration failure stays private, never expires the session or repeats a call', async () => {
  for (const [options, status, error] of [[{ config: false }, 503, 'payments-unconfigured'],
    [{ transportError: new Error('private transport and token detail') }, 502, 'payments-unreachable']]) {
    const setup = fixture(options);
    const response = await setup.get();
    assert.equal(response.status, status); privateResponse(response);
    assert.deepEqual(await response.json(), { error });
    assert.equal(setup.calls.upstream, options.config === false ? 0 : 1);
  }
});

test('summary forwards only bounded retry metadata, never cookies or private error details', async () => {
  for (const [value, expected] of [['3', '3'], ['999999999', '86400'], ['invalid', null]]) {
    const setup = fixture({ upstreamStatus: 503, upstreamBody: { error: 'authentication_unavailable' },
      upstreamHeaders: { 'retry-after': value } });
    const response = await setup.get();
    assert.equal(response.status, 503); privateResponse(response);
    assert.equal(response.headers.get('retry-after'), expected);
    assert.deepEqual(await response.json(), { error: 'authentication_unavailable', ...(expected ? { retryAfterSec: Number(expected) } : {}) });
  }
});
