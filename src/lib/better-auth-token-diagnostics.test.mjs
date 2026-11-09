import assert from 'node:assert/strict';
import test from 'node:test';
import { generateKeyPairSync, sign } from 'node:crypto';
import { AuthVerificationUnavailable, authVerificationDiagnostic, createBetterAuthVerifier } from './better-auth-token.mjs';
import { createPublicJwksCache } from './public-jwks-cache.mjs';
import { getCloudflareScope, runCloudflareRequest } from './cloudflare-runtime.mjs';
import { verifyIdToken, verifyIdTokenForSession, verifiedEmailFromIdTokenForSession } from './verify-id-token.js';

const env = { AUTH_PROVIDER: 'better-auth', NODE_ENV: 'production', AUTH_PUBLIC_ORIGIN: 'https://portal.example.test',
  BETTER_AUTH_BACKEND_URL: 'https://auth.core.internal', BETTER_AUTH_JWT_ISSUER: 'https://auth.example.test',
  BETTER_AUTH_JWT_AUDIENCE: 'synthetic-member-services', BETTER_AUTH_JWKS_URL: 'https://auth.core.internal/api/auth/jwks' };
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'synthetic-diagnostics', alg: 'RS256', use: 'sig' };
const now = () => Math.floor(Date.now() / 1000);
const claims = () => ({ sub: 'synthetic-private-subject', person_public_id: '00000000-0000-4000-8000-000000000001',
  email: 'synthetic-private@example.test', email_verified: true, authVerified: true, iss: env.BETTER_AUTH_JWT_ISSUER,
  aud: env.BETTER_AUTH_JWT_AUDIENCE, iat: now(), exp: now() + 300 });
function token(change = {}, header = {}) {
  const body = [{ alg: 'RS256', kid: jwk.kid, ...header }, { ...claims(), ...change }]
    .map(value => Buffer.from(JSON.stringify(value)).toString('base64url')).join('.');
  return `${body}.${sign('RSA-SHA256', Buffer.from(body), privateKey).toString('base64url')}`;
}
function verifier(fetchImpl = async () => assert.fail('seeded signature verification must not fetch')) {
  return createBetterAuthVerifier(env, { fetchImpl, publicKeyCache: createPublicJwksCache() });
}
function inRequest(verifier, run, configuration = env) {
  return runCloudflareRequest(new Request('https://portal.example.test/api/auth/session'), configuration,
    { waitUntil() {} }, async () => {
      if (verifier) getCloudflareScope().resources.set('auth-verifier', verifier);
      await run();
      return new Response(null);
    });
}

test('real RS256 signatures distinguish invalid proof from trusted-key issuer/audience configuration failures', async () => {
  const checked = verifier(); checked.cacheJwks({ keys: [jwk] });
  assert.equal((await checked.verify(token())).email, claims().email);
  for (const change of [{ email_verified: false }, { authVerified: false }, { exp: now() - 1, iat: now() - 301 }]) {
    await assert.rejects(checked.verify(token(change)), error => authVerificationDiagnostic(error).status === 'invalid');
  }
  const broken = token().split('.'); broken[2] = `${broken[2][0] === 'A' ? 'B' : 'A'}${broken[2].slice(1)}`;
  await assert.rejects(checked.verify(broken.join('.')), error => {
    assert.deepEqual(authVerificationDiagnostic(error), { phase: 'token', status: 'invalid' }); return true;
  });
  for (const change of [{ iss: 'https://wrong.example.test' }, { aud: 'wrong-services' }]) {
    await assert.rejects(checked.verify(token(change)), error => {
      assert.deepEqual(authVerificationDiagnostic(error), { phase: 'claims', status: 'unavailable' }); return true;
    });
  }
});

test('configuration, transport, response and key-payload failures have safe unavailable categories without weakening verification', async () => {
  assert.throws(() => createBetterAuthVerifier({ ...env, BETTER_AUTH_JWKS_URL: 'private-invalid-url' }), error => {
    assert.deepEqual(authVerificationDiagnostic(error), { phase: 'configuration', status: 'unavailable' }); return true;
  });
  for (const fetchImpl of [async () => { throw new Error('synthetic-private-token@example.test'); },
    async () => new Response('synthetic-private-response', { status: 503 }),
    async () => new Response('{synthetic-private-json'), async () => Response.json({ keys: [{ ...jwk, d: 'private-key' }] })]) {
    await assert.rejects(verifier(fetchImpl).verify(token()), error => {
      assert.deepEqual(authVerificationDiagnostic(error), { phase: 'jwks', status: 'unavailable' }); return true;
    });
  }
  let reads = 0;
  const rotated = verifier(async () => ++reads === 1 ? Response.json({ keys: [jwk] }) : new Response(null, { status: 503 }));
  await rotated.verify(token());
  await assert.rejects(rotated.verify(token({}, { kid: 'synthetic-unknown-kid' })), error => {
    assert.deepEqual(authVerificationDiagnostic(error), { phase: 'jwks', status: 'unavailable' }); return true;
  });
  assert.equal(reads, 2, 'rotation failure does not retry or accept an unknown key');
});

test('strict session readiness returns only generic unavailability while other consumers retain null and diagnostics contain enums only', async t => {
  const logs = [];
  t.mock.method(console, 'warn', value => logs.push(JSON.parse(value)));
  const unavailable = new AuthVerificationUnavailable('jwks', 'synthetic-private-token@example.test');
  unavailable.phase = 'synthetic-private-phase';
  await inRequest({ verify: async () => { throw unavailable; } }, async () => {
    await assert.rejects(verifyIdTokenForSession('synthetic-private-token'), { name: 'AuthServiceUnavailable', message: 'authentication_unavailable' });
    assert.equal(await verifyIdToken('synthetic-private-token'), null);
  });
  assert.deepEqual(logs, Array.from({ length: 2 }, () => ({ event: 'auth_verification', phase: 'verification', status: 'unavailable' })));
  assert.doesNotMatch(JSON.stringify(logs), /synthetic|@|token|cookie|subject|public_id|message|stack/);
  assert.deepEqual(authVerificationDiagnostic(Object.assign(new Error('private secret'), {
    code: 'ERR_JWT_CLAIM_VALIDATION_FAILED', claim: 'synthetic-private@example.test', phase: 'private',
  })), { phase: 'token', status: 'invalid' });
});

test('invalid proof remains anonymous in strict session mode and no token does not inspect a broken configuration', async t => {
  const logs = [];
  t.mock.method(console, 'warn', value => logs.push(JSON.parse(value)));
  const checked = verifier(); checked.cacheJwks({ keys: [jwk] });
  await inRequest(checked, async () => {
    assert.equal(await verifyIdTokenForSession(token({ email_verified: false })), null);
    const valid = await verifyIdTokenForSession(token());
    assert.equal(valid.email, claims().email);
  });
  assert.deepEqual(logs, [{ event: 'auth_verification', phase: 'claims', status: 'invalid' }]);
  await inRequest(null, async () => {
    assert.equal(await verifyIdTokenForSession(''), null);
    await assert.rejects(verifyIdTokenForSession('synthetic-private-token'), { name: 'AuthServiceUnavailable' });
  }, { AUTH_PROVIDER: 'better-auth' });
  assert.deepEqual(logs.at(-1), { event: 'auth_verification', phase: 'configuration', status: 'unavailable' });
});

test('private read email helper retains signature checks and distinguishes unavailable proof', async t => {
  t.mock.method(console, 'warn', () => {});
  const checked = verifier(); checked.cacheJwks({ keys: [jwk] });
  await inRequest(checked, async () => {
    assert.equal(await verifiedEmailFromIdTokenForSession(token()), claims().email);
    assert.equal(await verifiedEmailFromIdTokenForSession(token({ email_verified: false })), '');
    assert.equal(await verifiedEmailFromIdTokenForSession(''), '');
  });
  await inRequest({ verify: async () => { throw new AuthVerificationUnavailable('jwks'); } }, async () => {
    await assert.rejects(verifiedEmailFromIdTokenForSession('synthetic-private-token'), { name: 'AuthServiceUnavailable' });
    assert.equal(await verifyIdToken('synthetic-private-token'), null, 'legacy helper contract remains fail-closed null');
  });
});
