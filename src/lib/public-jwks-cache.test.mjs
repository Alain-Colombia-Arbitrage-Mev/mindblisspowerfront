import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateKeyPairSync, sign } from 'node:crypto';
import { createBetterAuthVerifier } from './better-auth-token.mjs';
import { createPublicJwksCache, publicJwksConfiguration, publicJwksJson, PUBLIC_JWKS_TTL_MS } from './public-jwks-cache.mjs';
import { runCloudflareRequest, getCloudflareScope } from './cloudflare-runtime.mjs';

const keyPair = () => {
  const pair = generateKeyPairSync('rsa', { modulusLength: 2048 });
  return { ...pair, jwk: { ...pair.publicKey.export({ format: 'jwk' }), kid: 'first', alg: 'RS256', use: 'sig' } };
};
const first = keyPair();
const second = keyPair();
second.jwk.kid = 'second';
const env = { NODE_ENV: 'production', AUTH_PROVIDER: 'better-auth', AUTH_PUBLIC_ORIGIN: 'https://portal.example.test',
  BETTER_AUTH_BACKEND_URL: 'https://auth.core.internal', BETTER_AUTH_JWT_ISSUER: 'https://issuer.example.test',
  BETTER_AUTH_JWT_AUDIENCE: 'member-services', BETTER_AUTH_JWKS_URL: 'https://auth.core.internal/api/auth/jwks' };
const claims = change => {
  const time = Math.floor(Date.now() / 1000);
  return { sub: 'synthetic', person_public_id: '00000000-0000-4000-8000-000000000001',
    email: 'fixture@example.test', email_verified: true, authVerified: true, iss: env.BETTER_AUTH_JWT_ISSUER,
    aud: env.BETTER_AUTH_JWT_AUDIENCE, iat: time, exp: time + 300, ...change };
};
function token(pair = first, change = {}, kid = pair.jwk.kid) {
  const input = [{ alg: 'RS256', kid }, claims(change)].map(value => Buffer.from(JSON.stringify(value)).toString('base64url')).join('.');
  return input + '.' + sign('RSA-SHA256', Buffer.from(input), pair.privateKey).toString('base64url');
}
function fixture(fetchImpl) {
  let time = Date.now();
  const now = () => time;
  const publicKeyCache = createPublicJwksCache({ now });
  return { publicKeyCache, now, advance: ms => { time += ms; },
    verifier: (config = env, fetcher = fetchImpl) => createBetterAuthVerifier(config, { publicKeyCache, now, fetchImpl: fetcher }) };
}

test('five independent Workers requests share only public JSON: one JWKS GET, every JWT still verified', async () => {
  const state = fixture();
  let calls = 0;
  const boundEnv = { ...env, CORE_API: { fetch: async (url, options) => {
    calls++;
    assert.equal(url, env.BETTER_AUTH_JWKS_URL);
    assert.equal(options.headers, undefined, 'no browser cookies or token reach public-key fetch');
    assert.equal(options.cache, 'no-store');
    assert.equal(options.redirect, 'manual');
    assert.equal(getCloudflareScope().env.AUTH_PUBLIC_ORIGIN, env.AUTH_PUBLIC_ORIGIN);
    return Response.json({ keys: [first.jwk] });
  } } };
  for (let index = 0; index < 5; index++) {
    await runCloudflareRequest(new Request('https://portal.example.test/dashboard'), boundEnv, { waitUntil() {} }, async () => {
      const verifier = createBetterAuthVerifier(undefined, { publicKeyCache: state.publicKeyCache, now: state.now });
      assert.equal((await verifier.verify(token(first, { sub: 'user-' + index }))).sub, 'user-' + index);
      await assert.rejects(verifier.verify(token(second, {}, first.jwk.kid)), /signature verification failed/);
      for (const change of [{ aud: 'wrong' }, { iss: 'wrong' }, { exp: 1 }, { authVerified: false }, { email_verified: false }]) {
        await assert.rejects(verifier.verify(token(first, change)));
      }
      return new Response(null);
    });
  }
  assert.equal(calls, 1);
});

test('strict 60s TTL applies to new and reused verifiers; expired key fetch failures never serve stale', async () => {
  let calls = 0; let fail = false;
  const state = fixture(async () => { calls++; return fail ? new Response('', { status: 503 }) : Response.json({ keys: [first.jwk] }); });
  const verifier = state.verifier();
  await verifier.verify(token());
  state.advance(PUBLIC_JWKS_TTL_MS - 1);
  await state.verifier().verify(token());
  assert.equal(calls, 1);
  state.advance(1); fail = true;
  await assert.rejects(verifier.verify(token()), /auth_keys_unavailable/);
  assert.equal(calls, 2);
  fail = false;
  await state.verifier().verify(token());
  assert.equal(calls, 3, 'failure was not cached or treated as authorization');
});

test('unknown kid refreshes once, observes rotation, and random-kid abuse is bounded by cooldown', async () => {
  let calls = 0; let current = first.jwk;
  const state = fixture(async () => { calls++; return Response.json({ keys: [current] }); });
  await state.verifier().verify(token());
  current = second.jwk;
  await state.verifier().verify(token(second));
  await state.verifier().verify(token(second));
  assert.equal(calls, 2);
  for (let i = 0; i < 10; i++) await assert.rejects(state.verifier().verify(token(first, {}, 'unknown-' + i)), /auth_keys_refresh_limited/);
  assert.equal(calls, 2);
  state.advance(30_000);
  await assert.rejects(state.verifier().verify(token(first, {}, 'still-unknown')), /no applicable key/);
  assert.equal(calls, 3, 'one refresh, not recursive retries or per-kid cache entries');
  await assert.rejects(state.verifier().verify(token(first, {}, 'another-unknown')), /auth_keys_refresh_limited/);
  assert.equal(calls, 3);
});

test('failed rotation fails closed, preserves only originally valid keys within original TTL, and can recover', async () => {
  let calls = 0; let fail = false; let current = first.jwk;
  const state = fixture(async () => { calls++; return fail ? new Response('', { status: 503 }) : Response.json({ keys: [current] }); });
  await state.verifier().verify(token());
  fail = true; current = second.jwk;
  await assert.rejects(state.verifier().verify(token(second)), /auth_keys_unavailable/);
  await state.verifier().verify(token());
  assert.equal(calls, 2);
  fail = false; state.advance(30_000);
  await state.verifier().verify(token(second));
  assert.equal(calls, 3);
});

test('issuer, audience, URL, origin, backend and deployment configuration never share snapshots', async () => {
  let calls = 0;
  const state = fixture(async () => { calls++; return Response.json({ keys: [first.jwk] }); });
  const variants = [env, ...Object.entries({ BETTER_AUTH_JWT_ISSUER: 'https://other-issuer.example.test',
    BETTER_AUTH_JWT_AUDIENCE: 'another-service', BETTER_AUTH_JWKS_URL: 'https://auth.core.internal/other-jwks',
    NODE_ENV: 'development', AUTH_PUBLIC_ORIGIN: 'https://admin.example.test', BETTER_AUTH_BACKEND_URL: 'https://other-auth.example.test',
    CORE_ENV: 'staging', CLOUDFLARE_ENV: 'preview', AUTH_PROVIDER: 'isolated' }).map(([key, value]) => ({ ...env, [key]: value }))];
  for (const variant of variants) {
    await state.verifier(variant).verify(token(first, { iss: variant.BETTER_AUTH_JWT_ISSUER, aud: variant.BETTER_AUTH_JWT_AUDIENCE }));
  }
  assert.equal(calls, variants.length);
  await state.verifier().verify(token());
  assert.equal(calls, variants.length + 1, 'oldest of more than eight configurations is evicted');
});

test('snapshot inputs/outputs are independent JSON copies; capacity and expiry are bounded', () => {
  const state = fixture();
  const input = { keys: [{ ...first.jwk }] };
  state.publicKeyCache.write('one', input, state.publicKeyCache.beginFetch());
  input.keys[0].kid = 'changed-input';
  const copy = state.publicKeyCache.read('one');
  copy.jwks.keys[0].kid = 'changed-output';
  assert.equal(state.publicKeyCache.read('one').jwks.keys[0].kid, first.jwk.kid);
  for (let i = 0; i < 8; i++) state.publicKeyCache.write('key-' + i, { keys: [first.jwk] }, state.publicKeyCache.beginFetch());
  assert.equal(state.publicKeyCache.read('one'), null);
  state.advance(60_000);
  for (let i = 0; i < 8; i++) assert.equal(state.publicKeyCache.read('key-' + i), null);
  assert.notEqual(publicJwksConfiguration(env, env.BETTER_AUTH_JWKS_URL),
    publicJwksConfiguration({ ...env, AUTH_PUBLIC_ORIGIN: 'https://other.example.test' }, env.BETTER_AUTH_JWKS_URL));
});

test('invalid, symmetric, private, malformed, oversized and ambiguous keys never enter cache', async () => {
  const malformed = [{ keys: [null] }, { keys: [] }, { keys: Array(33).fill(first.jwk) }, { keys: [first.jwk, first.jwk] },
    { keys: [{ ...first.jwk, kty: 'oct', k: 'secret' }] }, { keys: [{ ...first.jwk, alg: 'HS256' }] },
    { keys: [{ ...first.jwk, use: 'enc' }] }, { keys: [{ ...first.jwk, key_ops: ['sign'] }] },
    { keys: [{ ...first.jwk, n: 'not-base64%' }] }, { keys: [{ ...first.jwk, n: 'AAAA' }] },
    { keys: [{ ...first.jwk, e: 'Ag' }] }, { keys: [{ ...first.jwk, kid: 1 }] },
    { keys: [{ ...first.jwk, kid: 'x'.repeat(257) }] }, { keys: [{ ...first.jwk, ext: 'true' }] },
    { keys: [{ ...first.privateKey.export({ format: 'jwk' }), kid: 'private' }] },
    ...['d', 'p', 'q', 'dp', 'dq', 'qi', 'oth', 'k'].map(field => ({ keys: [{ ...first.jwk, [field]: 'private' }] })),
    { keys: [first.jwk], session: 'never retain user data' }, { keys: [{ ...first.jwk, unknown: 'untrusted metadata' }] },
    { keys: [{ ...first.jwk, n: 'A'.repeat(65_536) }] }];
  for (const value of malformed) {
    assert.throws(() => publicJwksJson(value), /auth_keys_invalid/);
    let current = value; let calls = 0;
    const state = fixture(async () => { calls++; return Response.json(current); });
    await assert.rejects(state.verifier().verify(token()));
    current = { keys: [first.jwk] };
    await state.verifier().verify(token());
    assert.equal(calls, 2);
  }
  let calls = 0;
  const state = fixture(async () => { calls++; return calls === 1 ? new Response('x'.repeat(65_537)) : Response.json({ keys: [first.jwk] }); });
  await assert.rejects(state.verifier().verify(token()), /auth_keys_too_large/);
  await state.verifier().verify(token());
  assert.equal(calls, 2);
});

test('simultaneous cold requests own their fetch, promise, signal and resolver; warmed JSON is safe across scopes', async () => {
  const state = fixture();
  const releases = [];
  const signals = [];
  const results = ['A', 'B'].map(id => runCloudflareRequest(new Request('https://portal.example.test/' + id),
    { ...env, CORE_API: { fetch: async (_, options) => {
      const scope = getCloudflareScope();
      signals.push(options.signal);
      assert.equal(scope.env.fixture, id);
      await new Promise(resolve => releases.push(resolve));
      assert.equal(getCloudflareScope(), scope, 'own async request context is retained');
      return Response.json({ keys: [first.jwk] });
    } }, fixture: id }, { waitUntil() {} }, async () => {
      const verifier = createBetterAuthVerifier(undefined, { publicKeyCache: state.publicKeyCache, now: state.now });
      assert.equal((await verifier.verify(token(first, { sub: id }))).sub, id);
      return new Response(null);
    }));
  while (releases.length < 2) await new Promise(resolve => setTimeout(resolve, 0));
  assert.notEqual(signals[0], signals[1]);
  releases[1](); await results[1];
  releases[0](); await results[0];
  await state.verifier(env, () => { throw new Error('unexpected HTTP after warming'); }).verify(token());
});

test('old in-flight snapshot cannot replace a later response; rollback expires cache; explicit test seeding stays local', async () => {
  const state = fixture(() => { throw new Error('must not fetch'); });
  const oldTicket = state.publicKeyCache.beginFetch();
  const newTicket = state.publicKeyCache.beginFetch();
  state.publicKeyCache.write('race', { keys: [second.jwk] }, newTicket);
  state.publicKeyCache.write('race', { keys: [first.jwk] }, oldTicket);
  assert.equal(state.publicKeyCache.read('race').jwks.keys[0].kid, second.jwk.kid);
  state.advance(-1);
  assert.equal(state.publicKeyCache.read('race'), null);
  const verifier = state.verifier();
  verifier.cacheJwks({ keys: [first.jwk] });
  await verifier.verify(token());
  await assert.rejects(state.verifier().verify(token()), /must not fetch/);
  state.advance(60_000);
  await assert.rejects(verifier.verify(token()), /auth_keys_expired/);
});

test('separate Next/OpenNext copies share only the bounded snapshot carrier, not functions or I/O', async () => {
  const one = await import('./public-jwks-cache.mjs?bundle=one');
  const two = await import('./public-jwks-cache.mjs?bundle=two');
  const configuration = publicJwksConfiguration({ ...env, AUTH_PUBLIC_ORIGIN: 'https://bundles.example.test' }, env.BETTER_AUTH_JWKS_URL);
  one.publicJwksCache.write(configuration, { keys: [first.jwk] }, one.publicJwksCache.beginFetch());
  assert.equal(two.publicJwksCache.read(configuration).jwks.keys[0].kid, first.jwk.kid);
  const carrier = globalThis[Symbol.for('mindbliss.public-jwks-cache.v1')];
  assert.deepEqual(Object.keys(carrier).sort(), ['entries', 'version']);
  assert.ok(carrier.entries.size <= 8);
  for (const [key, value] of carrier.entries) {
    assert.equal(typeof key, 'string');
    for (const [field, data] of Object.entries(value)) assert.equal(typeof data, field === 'json' ? 'string' : 'number');
    assert.deepEqual(Object.keys(JSON.parse(value.json)), ['keys']);
  }
});
