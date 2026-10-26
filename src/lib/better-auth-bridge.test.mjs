import assert from "node:assert/strict";
import test from "node:test";
import { generateKeyPairSync, sign, createHash, createHmac } from "node:crypto";
import { betterAuthConfig, betterAuthCookies, betterAuthServiceToken, browserAuthCookie, proxyBetterAuth, proxyBetterAuthKeys, trustedAuthClientIp } from "./better-auth-bridge.mjs";
import { createBetterAuthVerifier, validBetterAuthClaims } from "./better-auth-token.mjs";
import { createPublicJwksCache } from "./public-jwks-cache.mjs";

const env = { AUTH_PROVIDER: "better-auth", NODE_ENV: "production", BETTER_AUTH_BACKEND_URL: "https://auth.example.test", AUTH_PUBLIC_ORIGIN: "https://portal.example.test", AUTH_BFF_SHARED_SECRET: 'synthetic-auth-proxy-secret-longer-than-32' };
const cookie = "better-auth.session_token=synthetic";
const request = (body = "{}", origin = env.AUTH_PUBLIC_ORIGIN) => new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/auth/sign-in/email`, {
  method: "POST", headers: { origin, 'cf-connecting-ip': '192.0.2.10', cookie: `${cookie}; vp_id_token=other; unrelated=private` }, body,
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
  const response = await proxyBetterAuth(request(), "sign-in/email", { env, fetchImpl: async (url, options) => {
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
    .update(['POST', '/api/auth/sign-in/email', forwarded.options.headers['x-vp-auth-timestamp'], '192.0.2.10', hash(cookie), hash('{}')].join('\n')).digest('hex'));
  assert.equal(forwarded.options.cache, "no-store");
  assert.equal(forwarded.options.redirect, "manual");
  assert.equal(response.headers.get("set-auth-jwt"), null);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.ok(response.headers.get("set-cookie").includes("HttpOnly"));
  assert.ok(!response.headers.get("set-cookie").includes("Domain="));
  const body = await response.text();
  for (const secret of ["private-session", "private-jwt", "hidden"]) assert.ok(!body.includes(secret));
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
