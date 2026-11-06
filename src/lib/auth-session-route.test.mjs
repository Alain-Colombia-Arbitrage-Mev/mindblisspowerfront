import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { AuthServiceUnavailable, AuthAccessRestricted } from './better-auth-bridge.mjs';

function sessionRequest(query = '') {
  return new Request(`https://portal.example.test/api/auth/session${query}`);
}

function sessionRoute({ token = 'synthetic-private-token', tokenError, claims = null, verificationError,
  betterAuth = true, callPayments = async () => ({ ok: true, data: {} }), clearCookie = () => assert.fail('read failure must not clear an auth cookie') } = {}) {
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
      callPayments,
    },
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
    '@/lib/cognito-session': { clearCookie },
    '@/lib/verify-id-token': { verifyIdToken: verify, verifyIdTokenForSession: verify },
    '@/lib/better-auth-bridge.mjs': { betterAuthEnabled: () => betterAuth, AuthServiceUnavailable, AuthAccessRestricted },
  };
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(id => {
    assert.ok(Object.hasOwn(mocks, id), `unexpected session dependency ${id}`);
    return mocks[id];
  }, module, module.exports);
  assert.equal(module.exports.dynamic, 'force-dynamic');
  return module.exports.GET;
}

test('canonical access denial is a private403 without misreporting logout or querying optional member data', async () => {
  const error = new AuthAccessRestricted();
  error.cause = 'synthetic-private-member@example.test';
  const response = await sessionRoute({ tokenError: error,
    callPayments: () => assert.fail('denied identity cannot query payments'),
  })(sessionRequest('?view=access'));
  assert.equal(response.status, 403);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(response.headers.get('set-cookie'), null);
  assert.deepEqual(await response.json(), { authenticated: false, mode: 'better-auth', error: 'account_access_restricted' });
});

for (const stage of ['token', 'verification']) {
  test(`session ${stage} unavailability is a private generic 503, never an anonymous review decision`, async () => {
    const response = await sessionRoute({ [stage === 'token' ? 'tokenError' : 'verificationError']: new AuthServiceUnavailable() })(sessionRequest());
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    assert.equal(response.headers.get('set-cookie'), null);
    assert.deepEqual(await response.json(), { error: 'authentication_unavailable' });
  });
}

test('invalid token proof remains anonymous while a verified server identity retains its existing projection', async () => {
  const anonymous = await sessionRoute()(sessionRequest());
  assert.equal(anonymous.status, 200);
  assert.equal((await anonymous.json()).authenticated, false);
  const healthy = await sessionRoute({ claims: { sub: 'synthetic-subject', email: 'synthetic@example.test' } })(sessionRequest());
  assert.equal(healthy.status, 200);
  const body = await healthy.json();
  assert.equal(body.authenticated, true);
  assert.equal(body.subject, 'synthetic-subject');
  assert.equal(body.email, 'synthetic@example.test');
  assert.doesNotMatch(JSON.stringify(body), /synthetic-private-token|phase|diagnostic/);
});

test('explicit Better Auth access view never starts optional payments enrichment, even when it would never resolve', async () => {
  let calls = 0;
  const neverResolves = new Promise(() => {});
  const get = sessionRoute({
    claims: { sub: 'synthetic-subject', email: 'synthetic@example.test', name: 'Synthetic Member' },
    callPayments: () => { calls++; return neverResolves; },
  });
  const responsePromise = get(sessionRequest('?view=access&email=other%40example.test'));
  // This assertion fails immediately on the old route instead of hanging on
  // its unbounded payments request. The returned promise must settle unaided.
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls, 0);
  const response = await responsePromise;
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.deepEqual(await response.json(), {
    authenticated: true, mode: 'better-auth', name: 'Synthetic Member', email: 'synthetic@example.test',
    subject: 'synthetic-subject', givenName: null, referralCode: null, isAdmin: false,
  });
});

test('access view still requires verified token proof and keeps anonymous identity fields empty', async () => {
  for (const token of ['', 'synthetic-malformed-token']) {
    const response = await sessionRoute({ token, callPayments: () => assert.fail('anonymous identity cannot query payments') })(sessionRequest('?view=access'));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    assert.deepEqual(await response.json(), {
      authenticated: false, mode: 'better-auth', name: null, email: null,
      subject: null, givenName: null, referralCode: null, isAdmin: false,
    });
  }
});

for (const stage of ['token', 'verification']) {
  test(`access view preserves generic 503 on ${stage} infrastructure failure`, async () => {
    const response = await sessionRoute({
      [stage === 'token' ? 'tokenError' : 'verificationError']: new AuthServiceUnavailable(),
      callPayments: () => assert.fail('unavailable proof cannot query payments'),
    })(sessionRequest('?view=access'));
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    assert.deepEqual(await response.json(), { error: 'authentication_unavailable' });
    assert.equal(response.headers.get('set-cookie'), null);
  });
}

test('default, unsupported and repeated access selectors retain real payments presentation enrichment', async () => {
  for (const query of ['', '?view=Access', '?view=profile', '?view=access&view=profile', '?view=access&view=access']) {
    let calls = 0;
    const response = await sessionRoute({
      claims: { sub: 'synthetic-subject', email: 'synthetic@example.test', name: 'Token Name' },
      callPayments: async path => {
        calls++;
        assert.equal(path, '/api/member/referral?email=synthetic%40example.test');
        return { ok: true, status: 200, data: { name: 'Stored Name', referral_code: 'SyntheticReferral' } };
      },
    })(sessionRequest(query));
    assert.equal(calls, 1);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    assert.deepEqual(await response.json(), {
      authenticated: true, mode: 'better-auth', name: 'Stored Name', email: 'synthetic@example.test',
      subject: 'synthetic-subject', givenName: null, referralCode: 'SyntheticReferral', isAdmin: false,
    });
  }
});

test('access view uses verified name fallback without inventing a referral code', async () => {
  for (const [nameClaims, expectedName] of [[{ given_name: 'Synthetic', family_name: 'Member' }, 'Synthetic Member'], [{ nickname: 'Synthetic' }, 'Synthetic'], [{}, 'synthetic']]) {
    const response = await sessionRoute({
      claims: { sub: 'synthetic-subject', email: 'synthetic@example.test', ...nameClaims },
      callPayments: () => assert.fail('access view cannot query payments'),
    })(sessionRequest('?view=access'));
    const body = await response.json();
    assert.equal(body.name, expectedName);
    assert.equal(body.referralCode, null);
    assert.equal(body.isAdmin, false);
  }
});

test('Cognito retains its payments suspension veto even for the access query', async () => {
  for (const query of ['', '?view=access']) {
    let calls = 0;
    const cleared = [];
    const response = await sessionRoute({
      betterAuth: false, claims: { sub: 'synthetic-cognito-subject', email: 'synthetic@example.test' },
      callPayments: async () => { calls++; return { ok: false, status: 403, data: { error: 'account_suspended' } }; },
      clearCookie: (_response, name) => cleared.push(name),
    })(sessionRequest(query));
    assert.equal(calls, 1);
    assert.equal(response.status, 403);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    assert.deepEqual(await response.json(), { authenticated: false, mode: 'cognito', error: 'account_suspended' });
    assert.deepEqual(cleared, ['vp_access_token', 'vp_id_token', 'vp_refresh_token', 'vp_otp_session',
      'vp_cognito_state', 'vp_cognito_nonce', 'vp_cognito_code_challenge']);
  }
});

test('default Better Auth presentation keeps the existing payments suspension veto', async () => {
  const response = await sessionRoute({
    claims: { sub: 'synthetic-subject', email: 'synthetic@example.test' },
    callPayments: async () => ({ ok: false, status: 403, data: { error: 'account_suspended' } }),
    clearCookie: () => {},
  })(sessionRequest());
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { authenticated: false, mode: 'cognito', error: 'account_suspended' });
});
