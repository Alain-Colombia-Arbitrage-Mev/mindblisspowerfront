import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { AuthAccessRestricted, AuthServiceUnavailable, betterAuthServiceToken } from './better-auth-bridge.mjs';

const env = { NODE_ENV: 'production', AUTH_PROVIDER: 'better-auth',
  BETTER_AUTH_BACKEND_URL: 'https://auth.example.test', AUTH_BFF_SHARED_SECRET: 'synthetic-proxy-secret-with-at-least32' };
const cookie = '__Secure-better-auth.session_token=synthetic-signed-session';
const denial = () => Response.json({ code: 'AUTH_IDENTITY_REVIEW_REQUIRED',
  message: 'synthetic-private@example.test', token: 'synthetic-private-token' }, { status: 403 });

test('cache and remember-me cookies alone are not a native session and never call the API', async () => {
  for (const metadata of ['better-auth.session_data=synthetic', '__Secure-better-auth.dont_remember=true',
    '__Secure-better-auth.session_token=', 'unrelated=synthetic']) {
    assert.equal(await betterAuthServiceToken(metadata, { env, strictAccess: true,
      fetchImpl: () => assert.fail('non-session metadata cannot start a token lookup') }), '');
  }
});

test('strict handoff maps only the closed native binding-denial code; legacy reads remain fail closed', async t => {
  const logs = [];
  t.mock.method(console, 'warn', value => logs.push(JSON.parse(value)));
  let calls = 0;
  const dependencies = { env, strictAccess: true, clientIp: '192.0.2.17', fetchImpl: async () => { calls++; return denial(); } };
  await assert.rejects(betterAuthServiceToken(cookie, dependencies), error => error instanceof AuthAccessRestricted
    && error.message === 'account_access_restricted' && !error.cause);
  assert.equal(calls, 1);
  assert.equal(await betterAuthServiceToken(cookie, { ...dependencies, strictAccess: false }), '');
  assert.equal(calls, 2);
  assert.deepEqual(logs, Array.from({ length: 2 }, () => ({ event: 'auth_service_token', stage: 'endpoint', status: 403 })));
});

test('unknown403, malformed denial and middleware storage503 cannot masquerade as an account restriction', async t => {
  const logs = [];
  t.mock.method(console, 'warn', value => logs.push(JSON.parse(value)));
  for (const response of [() => Response.json({ code: 'FORBIDDEN' }, { status: 403 }),
    () => Response.json({ message: 'Identity review required' }, { status: 403 }),
    () => new Response('<html>private-provider-response</html>', { status: 403 }),
    () => new Response('{malformed', { status: 403, headers: { 'content-type': 'application/json' } }),
    () => Response.json({ code: 'AUTH_SESSION_LOOKUP_UNAVAILABLE' }, { status: 503 })]) {
    let calls = 0;
    await assert.rejects(betterAuthServiceToken(cookie, { env, strictAccess: true, clientIp: '192.0.2.17',
      fetchImpl: async () => { calls++; return response(); },
    }), error => error instanceof AuthServiceUnavailable && !(error instanceof AuthAccessRestricted));
    assert.equal(calls, 1);
  }
  assert.doesNotMatch(JSON.stringify(logs), /private-provider|Identity|@|synthetic|cause|stack|message/);
  for (const event of logs) assert.deepEqual(Object.keys(event).sort(), ['event', 'stage', 'status']);
});

test('ordinary401 remains missing proof; success remains server-only and does not grant access by itself', async t => {
  t.mock.method(console, 'warn', () => {});
  for (const strictAccess of [true, false]) {
    assert.equal(await betterAuthServiceToken(cookie, { env, strictAccess, clientIp: '192.0.2.17',
      fetchImpl: async url => url.endsWith('/get-session') ? Response.json(null) : new Response(null, { status: 401 }) }), '');
    assert.equal(await betterAuthServiceToken(cookie, { env, strictAccess, clientIp: '192.0.2.17',
      fetchImpl: async () => Response.json({ token: 'synthetic-service-token' }) }), 'synthetic-service-token');
  }
});

test('strict401 probes native absence once without retrying tokens or accepting limited sessions as authority', async t => {
  const logs = [];
  t.mock.method(console, 'warn', value => logs.push(JSON.parse(value)));
  for (const session of [() => new Response(null, { status: 500 }),
    () => Response.json({ session: { id: 'synthetic-private', expiresAt: new Date(Date.now() + 60000).toISOString() },
      user: { email: 'synthetic-private@example.test', emailVerified: true } }),
    () => Response.json({ error: 'private-storage-exception' }),
    () => new Response('null'), () => Response.json(null, { status: 401 }),
    () => new Response('malformed', { headers: { 'content-type': 'application/json' } })]) {
    const paths = [];
    await assert.rejects(betterAuthServiceToken(cookie, { env, strictAccess: true, clientIp: '192.0.2.17',
      fetchImpl: async (url, init) => {
        paths.push(new URL(url).pathname);
        assert.equal(init.method, 'GET'); assert.equal(init.headers.cookie, cookie);
        return url.endsWith('/get-session') ? session() : new Response(null, { status: 401 });
      },
    }), AuthServiceUnavailable);
    assert.deepEqual(paths, ['/api/auth/token', '/api/auth/get-session']);
  }
  assert.doesNotMatch(JSON.stringify(logs), /synthetic-private|@|storage-exception|cause|stack|message/);
});

function tokenReader(store, reader) {
  const source = readFileSync(new URL('./admin-bff.js', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const mocks = {
    'next/headers': { cookies: async () => store, headers: async () => new Headers() },
    './verify-id-token': { verifyIdToken: () => assert.fail('token reads are not signature verification') },
    './better-auth-bridge.mjs': { betterAuthEnabled: () => true, betterAuthServiceToken: reader,
      trustedAuthClientIp: () => '192.0.2.17', AuthServiceUnavailable, AuthAccessRestricted },
    './cloudflare-runtime.mjs': { coreFetch: () => assert.fail('unexpected member service fetch'), runtimeEnvironment: () => ({}) },
    './private-service-request.mjs': { boundedServiceRequest: () => assert.fail('unexpected member service request') },
  };
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(name => {
    assert.ok(Object.hasOwn(mocks, name), `unexpected dependency ${name}`); return mocks[name];
  }, module, module.exports);
  return module.exports.rawIdToken;
}

test('request-local denial is shared once, while only the handoff opts into explicit restricted state', async () => {
  let calls = 0;
  const store = { toString: () => cookie };
  const rawIdToken = tokenReader(store, async (_cookie, dependencies) => {
    calls++; assert.equal(dependencies.strictAccess, true); throw new AuthAccessRestricted();
  });
  assert.equal(await rawIdToken(), '');
  await assert.rejects(rawIdToken({ strictAccess: true }), AuthAccessRestricted);
  assert.equal(await rawIdToken(), '');
  assert.equal(calls, 1);
});

test('request-local outage never becomes anonymous even after an ordinary API consumer reads it first', async () => {
  const rawIdToken = tokenReader({ toString: () => cookie }, async () => { throw new AuthServiceUnavailable(); });
  await assert.rejects(rawIdToken(), AuthServiceUnavailable);
  await assert.rejects(rawIdToken({ strictAccess: true }), AuthServiceUnavailable);
});
