import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { generateKeyPairSync, sign, createHash, createHmac } from "node:crypto";
import { betterAuthConfig, betterAuthCookies, betterAuthServiceToken, betterAuthTimeoutMs, fetchBetterAuth, browserAuthCookie, proxyBetterAuth, proxyBetterAuthKeys, trustedAuthClientIp } from "./better-auth-bridge.mjs";
import { createBetterAuthVerifier, validBetterAuthClaims } from "./better-auth-token.mjs";
import { createPublicJwksCache } from "./public-jwks-cache.mjs";

const env = { AUTH_PROVIDER: "better-auth", NODE_ENV: "production", BETTER_AUTH_BACKEND_URL: "https://auth.example.test", AUTH_PUBLIC_ORIGIN: "https://portal.example.test", AUTH_BFF_SHARED_SECRET: 'synthetic-auth-proxy-secret-longer-than-32' };
const cookie = "better-auth.session_token=synthetic";
const request = (body = "{}", origin = env.AUTH_PUBLIC_ORIGIN) => new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/auth/sign-in/email`, {
  method: "POST", headers: { origin, 'cf-connecting-ip': '192.0.2.10', cookie: `${cookie}; vp_id_token=other; unrelated=private` }, body,
});

test('delivery and atomic registration verification have a bounded cold-start budget while reads and sign-in remain short', async () => {
  for (const path of ['/sign-up/email', '/email-otp/send-verification-otp', '/send-verification-email', '/email-otp/request-password-reset', '/email-otp/verify-email']) assert.equal(betterAuthTimeoutMs(path), 20000);
  for (const path of ['/get-session', '/token', '/jwks', '/sign-in/email-otp', '/sign-in/email']) assert.equal(betterAuthTimeoutMs(path), 8000);
  const cancelled = new AbortController(); cancelled.abort(); let calls = 0;
  await fetchBetterAuth('/email-otp/send-verification-otp', { method: 'POST', body: { email: 'synthetic@example.test', type: 'sign-in' }, signal: cancelled.signal }, {
    env, clientIp: '192.0.2.10', fetchImpl: async (_url, options) => { calls++; assert.equal(options.signal.aborted, true); return Response.json({ success: true }); },
  });
  assert.equal(calls, 1, 'the transport does not retry a send');
});

test("auth configuration fails closed and does not allow credentials or production plaintext", () => {
  for (const url of ["http://auth.example.test", "https://app:secret@auth.example.test", "https://auth.example.test/extra", "https://auth.example.test?private=1"]) {
    assert.throws(() => betterAuthConfig({ ...env, BETTER_AUTH_BACKEND_URL: url }));
  }
  assert.throws(() => betterAuthConfig({}));
  assert.equal(betterAuthConfig(env), "https://auth.example.test");
  assert.equal(betterAuthCookies(`${cookie}; unrelated=private; __Secure-better-auth.session_data=fixture`), `${cookie}; __Secure-better-auth.session_data=fixture`);
  assert.equal(betterAuthCookies(`${cookie}\r\nInjected: true`), "");
  assert.equal(browserAuthCookie("unrelated=secret"), null);
  assert.ok(!browserAuthCookie(`${cookie}; Domain=.example.test; Path=/other; Secure`).includes("Domain="));
});

test('trusted edge IP is required in production; untrusted forwarding lists are never accepted', () => {
  assert.throws(() => trustedAuthClientIp(new Headers({ 'x-forwarded-for': '192.0.2.10' }), env));
  assert.throws(() => trustedAuthClientIp(new Headers({ 'cf-connecting-ip': '192.0.2.10, 127.0.0.1' }), env));
  assert.equal(trustedAuthClientIp(new Headers({ 'cf-connecting-ip': '192.0.2.10' }), env), '192.0.2.10');
});

test('public JWKS proxy never forwards browser cookies or private key material', async () => {
  const publicKey = { kty: 'RSA', alg: 'RS256', use: 'sig', kid: 'synthetic', n: 'a'.repeat(342), e: 'AQAB' };
  const response = await proxyBetterAuthKeys(request(), { env, fetchImpl: async (_url, options) => {
    assert.equal(options.headers.cookie, '');
    return Response.json({ keys: [{ ...publicKey, d: 'private-material-must-not-leave' }] });
  } });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { keys: [publicKey] });
});

test("proxy checks origin/path/body before transport, including private JWT endpoint denial", async () => {
  let calls = 0;
  const dependencies = { env, fetchImpl: async () => { calls++; throw new Error("must not reach upstream"); } };
  assert.equal((await proxyBetterAuth(request(), "token", dependencies)).status, 404);
  assert.equal((await proxyBetterAuth(request(), "../sign-out", dependencies)).status, 404);
  assert.equal((await proxyBetterAuth(request("{}", "https://attacker.example.test"), "sign-in/email", dependencies)).status, 403);
  assert.equal((await proxyBetterAuth(request("{"), "sign-in/email", dependencies)).status, 400);
  assert.equal((await proxyBetterAuth(request(JSON.stringify({ data: "x".repeat(32769) })), "sign-in/email", dependencies)).status, 413);
  assert.equal(calls, 0);
});

test("proxy keeps HttpOnly cookies but never exposes JWT/session tokens or internal headers", async () => {
  let forwarded;
  const requestBody = JSON.stringify({ email: 'user@example.test', password: 'Synthetic password 123' });
  const response = await proxyBetterAuth(request(requestBody), "sign-in/email", { env, fetchImpl: async (url, options) => {
    if (url.endsWith('/get-session')) return Response.json({
      user: { id: 'synthetic-user', email: 'user@example.test', emailVerified: true },
      session: { id: 'synthetic-session', userId: 'synthetic-user', token: 'private-session', expiresAt: new Date(Date.now() + 60_000).toISOString() },
    });
    forwarded = { url, options };
    return Response.json({ token: "private-session", user: { id: "synthetic-user", email: "user@example.test", emailVerified: true, name: "Test", secret: "hidden" } }, {
      headers: { "set-cookie": `${cookie}; Secure; HttpOnly; Domain=.example.test`, "set-auth-jwt": "private-jwt" },
    });
  } });
  assert.equal(response.status, 200);
  assert.equal(forwarded.options.headers.cookie, cookie);
  assert.equal(forwarded.options.headers['x-vp-auth-client-ip'], '192.0.2.10');
  const hash = value => createHash('sha256').update(value).digest('hex');
  assert.equal(forwarded.options.headers['x-vp-auth-signature'], createHmac('sha256', env.AUTH_BFF_SHARED_SECRET)
    .update(['POST', '/api/auth/sign-in/email', forwarded.options.headers['x-vp-auth-timestamp'], '192.0.2.10', hash(cookie), hash(requestBody)].join('\n')).digest('hex'));
  assert.equal(forwarded.options.cache, "no-store");
  assert.equal(forwarded.options.redirect, "manual");
  assert.equal(response.headers.get("set-auth-jwt"), null);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.ok(response.headers.get("set-cookie").includes("HttpOnly"));
  assert.ok(!response.headers.get("set-cookie").includes("Domain="));
  const body = await response.text();
  for (const secret of ["private-session", "private-jwt", "hidden"]) assert.ok(!body.includes(secret));
});

test('the explicit missing-account decision survives the BFF without diagnostics, cookies, tokens or a redirect supplied by upstream', async () => {
  for (const path of ['email-otp/send-verification-otp', 'sign-in/email']) {
    const response = await proxyBetterAuth(request(JSON.stringify({ email: 'new@example.test',
      ...(path === 'sign-in/email' ? { password: 'Synthetic private password' } : { type: 'sign-in' }) })), path, {
      env, fetchImpl: async () => Response.json({ code: 'REGISTRATION_REQUIRED', message: 'private-upstream-diagnostic',
        email: 'new@example.test', token: 'must-not-leak', redirectTo: 'https://attacker.example.test' }, {
        status: 400, headers: { 'set-cookie': `${cookie}; Secure; HttpOnly`, 'set-auth-jwt': 'must-not-leak', location: 'https://attacker.example.test' },
      }),
    });
    assert.equal(response.status, 400);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    assert.equal(response.headers.get('set-cookie'), null);
    assert.equal(response.headers.get('set-auth-jwt'), null);
    assert.equal(response.headers.get('location'), null);
    assert.deepEqual(await response.json(), { error: 'authentication_failed', code: 'REGISTRATION_REQUIRED' });
  }
});

test("service JWT is obtained server-side only using the filtered session cookie", async () => {
  assert.equal(await betterAuthServiceToken("unrelated=private", { env, fetchImpl: () => { throw Error("not allowed"); } }), "");
  assert.equal(await betterAuthServiceToken(cookie, { env, clientIp: '192.0.2.10', fetchImpl: async (url, options) => {
    assert.equal(url, "https://auth.example.test/api/auth/token");
    assert.equal(options.headers.cookie, cookie);
    return Response.json({ token: "synthetic-jwt" });
  } }), "synthetic-jwt");
  await assert.rejects(betterAuthServiceToken(cookie, { env, clientIp: '192.0.2.10', fetchImpl: async () => new Response(null, { status: 503 }) }), { name: 'AuthServiceUnavailable' });
  assert.equal(await betterAuthServiceToken(cookie, { env, clientIp: '192.0.2.10', fetchImpl: async () => new Response(null, { status: 401 }) }), '');
  const failure = await proxyBetterAuth(request(), "sign-in/email", { env, fetchImpl: async () => { throw Error("private-token-url"); } });
  assert.deepEqual(await failure.json(), { error: "authentication_unavailable" });
});

test('service-token observations are silent for missing cookies and successful token responses', async t => {
  const logs = [];
  t.mock.method(console, 'warn', value => logs.push(JSON.parse(value)));
  let calls = 0;
  const dependencies = { env, clientIp: '192.0.2.10', fetchImpl: async () => { calls++; return Response.json({ token: 'synthetic-private-jwt' }); } };
  assert.equal(await betterAuthServiceToken('unrelated=synthetic-private-cookie', dependencies), '');
  assert.equal(calls, 0);
  assert.equal(await betterAuthServiceToken(cookie, dependencies), 'synthetic-private-jwt');
  assert.equal(calls, 1);
  assert.deepEqual(logs, []);
});

test('service-token endpoint failures observe one bounded HTTP status and preserve anonymous versus unavailable contracts', async t => {
  const logs = [];
  t.mock.method(console, 'warn', value => logs.push(JSON.parse(value)));
  const statuses = [401, 403, 302, 404, 429, 500, 503, 0, -1, 600, NaN, 'synthetic-private@example.test'];
  for (const status of statuses) {
    logs.length = 0;
    let calls = 0;
    const dependencies = { env, clientIp: '192.0.2.10', fetchImpl: async () => {
      calls++;
      return { status, ok: false, body: new ReadableStream({ start(controller) {
        controller.enqueue(new TextEncoder().encode('synthetic-private@example.test cookie secret jwt'));
        controller.close();
      } }) };
    } };
    if ([401, 403].includes(status)) assert.equal(await betterAuthServiceToken(cookie, dependencies), '');
    else await assert.rejects(betterAuthServiceToken(cookie, dependencies), { name: 'AuthServiceUnavailable', message: 'authentication_unavailable' });
    assert.equal(calls, 1, 'observing a failure never repeats token issuance');
    assert.deepEqual(logs, [{ event: 'auth_service_token', stage: 'endpoint',
      status: Number.isInteger(status) && status >= 100 && status <= 599 ? status : 'unavailable' }]);
    assert.doesNotMatch(JSON.stringify(logs), /synthetic-private|@|cookie|secret|message|stack/);
  }
});

test('malformed service-token responses expose only the response enum, never body contents or token material', async t => {
  const logs = [];
  t.mock.method(console, 'warn', value => logs.push(JSON.parse(value)));
  for (const response of [() => new Response('synthetic-private@example.test jwt secret cookie'),
    () => Response.json({ email: 'synthetic-private@example.test', token: null }),
    () => Response.json({ token: '' }), () => Response.json({ token: 'x'.repeat(16001) }),
    () => Response.json([]), () => new Response(null)]) {
    logs.length = 0;
    let calls = 0;
    await assert.rejects(betterAuthServiceToken(cookie, { env, clientIp: '192.0.2.10', fetchImpl: async () => { calls++; return response(); } }),
      { name: 'AuthServiceUnavailable', message: 'authentication_unavailable' });
    assert.equal(calls, 1);
    assert.deepEqual(logs, [{ event: 'auth_service_token', stage: 'response', status: 'unavailable' }]);
    assert.doesNotMatch(JSON.stringify(logs), /synthetic-private|@|cookie|secret|message|stack/);
  }
});

test('service-token transport, configuration and cancellation failures log only safe transport enums once', async t => {
  const logs = [];
  t.mock.method(console, 'warn', value => logs.push(JSON.parse(value)));
  for (const failure of [new Error('synthetic-private@example.test secret cookie jwt'),
    new DOMException('synthetic-private@example.test cookie jwt', 'AbortError'),
    new DOMException('synthetic-private@example.test cookie jwt', 'TimeoutError')]) {
    logs.length = 0;
    let calls = 0;
    await assert.rejects(betterAuthServiceToken(cookie, { env, clientIp: '192.0.2.10', fetchImpl: async () => { calls++; throw failure; } }),
      { name: 'AuthServiceUnavailable', message: 'authentication_unavailable' });
    assert.equal(calls, 1);
    assert.deepEqual(logs, [{ event: 'auth_service_token', stage: 'transport', status: 'unavailable' }]);
    assert.doesNotMatch(JSON.stringify(logs), /synthetic-private|@|cookie|secret|message|stack/);
  }
  logs.length = 0;
  await assert.rejects(betterAuthServiceToken(cookie, { env: { ...env, AUTH_BFF_SHARED_SECRET: '' }, clientIp: '192.0.2.10',
    fetchImpl: () => assert.fail('invalid configuration must not fetch') }), { name: 'AuthServiceUnavailable' });
  assert.deepEqual(logs, [{ event: 'auth_service_token', stage: 'transport', status: 'unavailable' }]);
});

test('a service-token body timeout remains a transport failure without echoing stream diagnostics', async t => {
  const logs = [];
  t.mock.method(console, 'warn', value => logs.push(JSON.parse(value)));
  await assert.rejects(betterAuthServiceToken(cookie, { env, clientIp: '192.0.2.10', fetchImpl: async () => new Response(new ReadableStream({
    start(controller) { controller.error(new DOMException('synthetic-private@example.test jwt', 'TimeoutError')); },
  })) }), { name: 'AuthServiceUnavailable', message: 'authentication_unavailable' });
  assert.deepEqual(logs, [{ event: 'auth_service_token', stage: 'transport', status: 'unavailable' }]);
});

test('an unavailable diagnostic sink never changes the service-token authentication result', async t => {
  t.mock.method(console, 'warn', () => { throw new Error('synthetic logging unavailable'); });
  for (const status of [401, 403, 503]) {
    const dependencies = { env, clientIp: '192.0.2.10', fetchImpl: async () => new Response(null, { status }) };
    if (status === 503) await assert.rejects(betterAuthServiceToken(cookie, dependencies), { name: 'AuthServiceUnavailable', message: 'authentication_unavailable' });
    else assert.equal(await betterAuthServiceToken(cookie, dependencies), '');
  }
});

test('service-token logging source projects only static event, stage and bounded status fields', () => {
  const source = readFileSync(new URL('./better-auth-bridge.mjs', import.meta.url), 'utf8');
  const helper = source.slice(source.indexOf('export async function betterAuthServiceToken('), source.indexOf('export const browserAuthPaths'));
  assert.match(helper, /event:\s*['"]auth_service_token['"]/);
  assert.doesNotMatch(helper, /(?:error|response|payload|dependencies)\?*\.(?:message|stack|headers)|console\.(?:error|debug|log)\(/);
  assert.doesNotMatch(helper, /JSON\.stringify\((?:error|response|payload|dependencies)\)/);
});

test("Better Auth signature, audience, verification and five-minute lifetime are enforced", async () => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const jwk = { ...publicKey.export({ format: "jwk" }), kid: "synthetic", alg: "RS256", use: "sig" };
  const issuer = "https://auth.example.test";
  const verifier = createBetterAuthVerifier({ ...env, BETTER_AUTH_JWT_ISSUER: issuer, BETTER_AUTH_JWT_AUDIENCE: "member-services", BETTER_AUTH_JWKS_URL: `${issuer}/api/auth/jwks` });
  verifier.cacheJwks({ keys: [jwk] });
  const now = Math.floor(Date.now() / 1000);
  const claims = { sub: "stable-subject", person_public_id: '00000000-0000-4000-8000-000000000001', email: "user@example.test", email_verified: true, authVerified: true, iss: issuer, aud: "member-services", iat: now, exp: now + 300 };
  const token = value => { const body = [ { alg: "RS256", kid: "synthetic" }, value ].map(part => Buffer.from(JSON.stringify(part)).toString("base64url")).join("."); return `${body}.${sign("RSA-SHA256", Buffer.from(body), privateKey).toString("base64url")}`; };
  assert.equal((await verifier.verify(token(claims))).sub, claims.sub);
  for (const change of [{ aud: "other-service" }, { email_verified: false }, { authVerified: false }, { sub: "" }, { person_public_id: undefined }, { exp: now + 301 }, { iat: now + 100, exp: now + 200 }]) {
    await assert.rejects(verifier.verify(token({ ...claims, ...change })));
  }
  assert.equal(validBetterAuthClaims({ ...claims, email_verified: "true" }), false);
});

test('private JWKS fetcher validates real signatures and bounds response sizes', async () => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'synthetic-private', alg: 'RS256', use: 'sig' };
  const jwtEnv = { ...env, BETTER_AUTH_JWT_ISSUER: 'https://issuer.example.test', BETTER_AUTH_JWT_AUDIENCE: 'services', BETTER_AUTH_JWKS_URL: 'https://auth.core.internal/api/auth/jwks' };
  let calls = 0;
  const verifier = createBetterAuthVerifier(jwtEnv, { fetchImpl: async (url, options) => {
    calls++; assert.equal(url, jwtEnv.BETTER_AUTH_JWKS_URL); assert.equal(options.redirect, 'manual'); assert.equal(options.cache, 'no-store');
    return Response.json({ keys: [jwk] });
  } });
  const now = Math.floor(Date.now() / 1000);
  const claims = { sub: 'synthetic', person_public_id: '00000000-0000-4000-8000-000000000001', email: 'test@example.test', email_verified: true, authVerified: true, iss: jwtEnv.BETTER_AUTH_JWT_ISSUER, aud: 'services', iat: now, exp: now + 300 };
  const body = [{ alg: 'RS256', kid: jwk.kid }, claims].map(value => Buffer.from(JSON.stringify(value)).toString('base64url')).join('.');
  const token = `${body}.${sign('RSA-SHA256', Buffer.from(body), privateKey).toString('base64url')}`;
  assert.equal((await verifier.verify(token)).sub, claims.sub);
  assert.equal(calls, 1);
  const excessive = createBetterAuthVerifier(jwtEnv, { publicKeyCache: createPublicJwksCache(), fetchImpl: async () => new Response('x'.repeat(65537)) });
  await assert.rejects(excessive.verify(token), /auth_keys_too_large/);
});
