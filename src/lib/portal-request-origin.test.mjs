import assert from 'node:assert/strict';
import test from 'node:test';
import { createHmac, createHash } from 'node:crypto';
import { portalRequestEnvironment, REWON_PUBLIC_ORIGIN, REWON_TEMPORARY_ORIGIN } from './portal-request-origin.mjs';
import { cloudflarePortalGuard, cloudflarePortalRequest } from './cloudflare-portal-guard.mjs';
import { runtimeEnvironment, runCloudflareRequest } from './cloudflare-runtime.mjs';
import { fetchBetterAuth, browserAuthCookie, proxyBetterAuth } from './better-auth-bridge.mjs';
import { buildReferralLinks, referralPublicOrigin } from './referral-links.mjs';

const env = Object.freeze({ AUTH_PROVIDER: 'better-auth', AUTH_PUBLIC_ORIGIN: REWON_PUBLIC_ORIGIN,
  AUTH_ALTERNATE_ORIGIN: REWON_TEMPORARY_ORIGIN, BETTER_AUTH_BACKEND_URL: 'https://auth.core.internal',
  AUTH_BFF_SHARED_SECRET: 'synthetic-alias-proxy-secret-longer-than-32',
  BETTER_AUTH_JWT_ISSUER: 'https://mindblisspower.com', BETTER_AUTH_JWT_AUDIENCE: 'mindbliss-services',
  BETTER_AUTH_JWKS_URL: 'https://auth.core.internal/api/auth/jwks' });
const request = (origin, path = '/login', extra = {}) => new Request(origin + path, extra);

test('rewon grants exactly one configured alternate origin without changing production token contracts', () => {
  assert.equal(portalRequestEnvironment(request(REWON_PUBLIC_ORIGIN), env), env);
  const alternate = portalRequestEnvironment(request(REWON_TEMPORARY_ORIGIN), env);
  assert.notEqual(alternate, env);
  assert.equal(alternate.AUTH_PUBLIC_ORIGIN, REWON_TEMPORARY_ORIGIN);
  for (const name of ['BETTER_AUTH_JWT_ISSUER', 'BETTER_AUTH_JWT_AUDIENCE', 'BETTER_AUTH_JWKS_URL', 'AUTH_BFF_SHARED_SECRET']) {
    assert.equal(alternate[name], env[name]);
  }
  assert.equal(env.AUTH_PUBLIC_ORIGIN, REWON_PUBLIC_ORIGIN);
  assert.equal(portalRequestEnvironment(request(REWON_TEMPORARY_ORIGIN), { ...env, AUTH_ALTERNATE_ORIGIN: undefined }), null);
  assert.equal(portalRequestEnvironment(request(REWON_TEMPORARY_ORIGIN), { ...env, AUTH_PUBLIC_ORIGIN: 'https://mindblisspower.com' }), null);
});

test('other Workers, preview names, host tricks, protocol and ports cannot inherit the alias', () => {
  for (const origin of ['https://mindbliss-portal-production.devfidubit.workers.dev', 'https://other.devfidubit.workers.dev',
    'https://preview-mindbliss-portal-rewon.devfidubit.workers.dev', REWON_TEMPORARY_ORIGIN + '.evil.test',
    REWON_TEMPORARY_ORIGIN + '.', REWON_TEMPORARY_ORIGIN + ':444', REWON_TEMPORARY_ORIGIN.replace('https:', 'http:')]) {
    assert.equal(portalRequestEnvironment(request(origin, '/login', { headers: {
      host: new URL(REWON_TEMPORARY_ORIGIN).host, 'x-forwarded-host': new URL(REWON_TEMPORARY_ORIGIN).host,
      origin: REWON_TEMPORARY_ORIGIN,
    } }), env), null, origin);
  }
  assert.equal(portalRequestEnvironment(request(REWON_TEMPORARY_ORIGIN), { ...env, AUTH_ALTERNATE_ORIGIN: 'https://*.workers.dev' }), null);
  assert.equal(portalRequestEnvironment(request(REWON_TEMPORARY_ORIGIN), { ...env, AUTH_ALTERNATE_ORIGIN: REWON_TEMPORARY_ORIGIN + '/' }), null);
});

test('alias preserves encoded admin isolation and exact same-origin mutations in both directions', async () => {
  for (const origin of [REWON_PUBLIC_ORIGIN, REWON_TEMPORARY_ORIGIN]) {
    for (const path of ['/api/admin/users', '/%61pi/%61dmin/users', '/api%2Fadmin/users', '/api/%2561dmin/users']) {
      const input = request(origin, path);
      assert.equal(cloudflarePortalGuard(cloudflarePortalRequest(input), portalRequestEnvironment(input, env)).status, 404);
    }
    for (const supplied of [REWON_PUBLIC_ORIGIN, REWON_TEMPORARY_ORIGIN, 'https://mindblisspower.com']) {
      const input = request(origin, '/api/payments/checkout', { method: 'POST', body: '{}', headers: {
        origin: supplied, 'sec-fetch-site': supplied === origin ? 'same-origin' : 'cross-site', 'content-type': 'application/json',
      } });
      const selected = portalRequestEnvironment(input, env);
      assert.equal(cloudflarePortalGuard(cloudflarePortalRequest(input), selected)?.status ?? null, supplied === origin ? null : 403);
      if (supplied !== origin) {
        const response = await proxyBetterAuth(input, 'sign-out', { env: selected,
          fetchImpl() { assert.fail('cross-origin logout must not contact Core'); } });
        assert.equal(response.status, 403);
      }
    }
  }
});

test('concurrent canonical and alternate BFF requests never share their effective origin', async () => {
  const calls = [], waits = [];
  const configured = Object.freeze({ ...env, CORE_API: { async fetch(url, init) {
    assert.equal(String(url), 'https://auth.core.internal/api/auth/sign-out');
    const hash = value => createHash('sha256').update(value).digest('hex');
    const header = new Headers(init.headers);
    const expected = createHmac('sha256', env.AUTH_BFF_SHARED_SECRET).update(['POST', '/api/auth/sign-out',
      header.get('x-vp-auth-timestamp'), '192.0.2.10', hash(''), hash('{}')].join('\n')).digest('hex');
    assert.equal(header.get('x-vp-auth-signature'), expected);
    calls.push(header.get('origin'));
    return Response.json({ success: true });
  } } });
  const responses = await Promise.all([REWON_PUBLIC_ORIGIN, REWON_TEMPORARY_ORIGIN].map(async origin => {
    const input = request(origin), selected = portalRequestEnvironment(input, configured);
    return runCloudflareRequest(input, selected, { waitUntil(p) { waits.push(p); } }, async () => {
      await Promise.resolve();
      assert.equal(runtimeEnvironment().AUTH_PUBLIC_ORIGIN, origin);
      const response = await fetchBetterAuth('/sign-out', { method: 'POST', body: {}, origin }, { clientIp: '192.0.2.10' });
      await response.body.cancel();
      await Promise.resolve();
      assert.equal(runtimeEnvironment().AUTH_PUBLIC_ORIGIN, origin);
      assert.equal(referralPublicOrigin(runtimeEnvironment()), origin);
      assert.equal(new URL(buildReferralLinks('SyntheticSponsor', origin).right).origin, origin);
      return Response.json({ origin });
    });
  }));
  const body = await Promise.all(responses.map(r => r.json()));
  await Promise.all(waits);
  assert.deepEqual(body.map(b => b.origin), [REWON_PUBLIC_ORIGIN, REWON_TEMPORARY_ORIGIN]);
  assert.deepEqual(calls.sort(), [REWON_PUBLIC_ORIGIN, REWON_TEMPORARY_ORIGIN].sort());
  assert.equal(configured.AUTH_PUBLIC_ORIGIN, REWON_PUBLIC_ORIGIN);
});

test('backend cookie domains cannot cross the canonical/temporary boundary', () => {
  const value = browserAuthCookie('better-auth.session_token=synthetic-token; Domain=.mindblisspower.com; Path=/api; Max-Age=3600', true);
  assert.doesNotMatch(value, /(?:^|;)\s*Domain=/i);
  for (const flag of ['Path=/', 'HttpOnly', 'Secure', 'SameSite=Lax']) assert.ok(value.includes(flag));
});
