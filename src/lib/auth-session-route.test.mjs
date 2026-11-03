import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { AuthServiceUnavailable } from './better-auth-bridge.mjs';

function sessionRoute({ token = 'synthetic-private-token', tokenError, claims = null, verificationError } = {}) {
  const source = readFileSync(new URL('../app/api/auth/session/route.js', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const verify = async value => {
    assert.equal(value, token);
    if (verificationError) throw verificationError;
    return claims;
  };
  const mocks = {
    '@/lib/admin-bff': {
      rawIdToken: async () => { if (tokenError) throw tokenError; return token; },
      callPayments: async () => ({ ok: true, data: {} }),
    },
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
    '@/lib/cognito-session': { clearCookie: () => assert.fail('read failure must not clear an auth cookie') },
    '@/lib/verify-id-token': { verifyIdToken: verify, verifyIdTokenForSession: verify },
    '@/lib/better-auth-bridge.mjs': { betterAuthEnabled: () => true, AuthServiceUnavailable },
  };
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(id => {
    assert.ok(Object.hasOwn(mocks, id), `unexpected session dependency ${id}`);
    return mocks[id];
  }, module, module.exports);
  assert.equal(module.exports.dynamic, 'force-dynamic');
  return module.exports.GET;
}

for (const stage of ['token', 'verification']) {
  test(`session ${stage} unavailability is a private generic 503, never an anonymous review decision`, async () => {
    const response = await sessionRoute({ [stage === 'token' ? 'tokenError' : 'verificationError']: new AuthServiceUnavailable() })();
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    assert.equal(response.headers.get('set-cookie'), null);
    assert.deepEqual(await response.json(), { error: 'authentication_unavailable' });
  });
}

test('invalid token proof remains anonymous while a verified server identity retains its existing projection', async () => {
  const anonymous = await sessionRoute()();
  assert.equal(anonymous.status, 200);
  assert.equal((await anonymous.json()).authenticated, false);
  const healthy = await sessionRoute({ claims: { sub: 'synthetic-subject', email: 'synthetic@example.test' } })();
  assert.equal(healthy.status, 200);
  const body = await healthy.json();
  assert.equal(body.authenticated, true);
  assert.equal(body.subject, 'synthetic-subject');
  assert.equal(body.email, 'synthetic@example.test');
  assert.doesNotMatch(JSON.stringify(body), /synthetic-private-token|phase|diagnostic/);
});
