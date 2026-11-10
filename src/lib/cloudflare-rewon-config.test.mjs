import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cloudflareReadiness } from './cloudflare-runtime.mjs';
import { cloudflarePortalGuard, cloudflarePortalRequest } from './cloudflare-portal-guard.mjs';

const config = JSON.parse(readFileSync(new URL('../../wrangler.jsonc', import.meta.url), 'utf8'));
const rewon = config.env.rewon;

test('rewon is an isolated production Worker with only the exact app custom domain', () => {
  assert.equal(rewon.name, 'mindbliss-portal-rewon');
  assert.notEqual(rewon.name, config.env.production.name);
  assert.notEqual(rewon.name, config.env.staging.name);
  assert.equal(rewon.workers_dev, true);
  assert.equal(rewon.preview_urls, false);
  assert.deepEqual(rewon.routes, [{ pattern: 'app.mindblisspower.com', custom_domain: true }]);
  assert.equal(rewon.vars.AUTH_PUBLIC_ORIGIN, 'https://app.mindblisspower.com');
  assert.equal(rewon.vars.AUTH_SOCIAL_PROVIDERS, 'google');
  assert.equal(rewon.vars.ADMINISTRATIVE_ONRAMP_ENVIRONMENT, undefined);
  assert.equal(config.env.production.vars.ADMINISTRATIVE_ONRAMP_ENVIRONMENT, undefined);
  assert.equal(config.env.staging.vars.ADMINISTRATIVE_ONRAMP_ENVIRONMENT, undefined);
  assert.equal(config.env.production.vars.AUTH_SOCIAL_PROVIDERS, undefined);
  assert.equal(config.env.staging.vars.AUTH_SOCIAL_PROVIDERS, undefined);
  assert.equal(rewon.vars.AUTH_ALTERNATE_ORIGIN, 'https://mindbliss-portal-rewon.devfidubit.workers.dev');
  assert.equal(config.env.production.vars.AUTH_ALTERNATE_ORIGIN, undefined);
  assert.equal(config.env.staging.vars.AUTH_ALTERNATE_ORIGIN, undefined);
  assert.deepEqual(config.env.production.routes, [{ pattern: 'mindblisspower.com', custom_domain: true }]);
  assert.deepEqual(config.env.staging.routes, []);
  assert.equal(config.env.production.vars.AUTH_PUBLIC_ORIGIN, 'https://mindblisspower.com');
  assert.equal(config.env.staging.vars.CLOUDFLARE_DEPLOYMENT_READY, 'false');
});

test('rewon explicitly reuses only the fresh production reader and private Core binding', () => {
  assert.deepEqual(rewon.hyperdrive, config.env.production.hyperdrive);
  assert.equal(rewon.hyperdrive.length, 1);
  assert.equal(rewon.hyperdrive[0].binding, 'HYPERDRIVE_MEMBER_FRESH');
  assert.deepEqual(rewon.services, [{ binding: 'CORE_API', service: 'mindbliss-core-production' }]);
  assert.equal(rewon.vars.MEMBER_DB_PROVIDER, 'hyperdrive');
  assert.equal(rewon.vars.MEMBER_DB_QUERY_CACHE_DISABLED, 'true');
  for (const key of ['AUTH_PROVIDER', 'BETTER_AUTH_BACKEND_URL', 'VP_PAYMENTS_URL', 'VP_WITHDRAWALS_URL',
    'STRIPE_CHECKOUT_ENABLED', 'NOWPAYMENTS_MEMBERSHIPS_ENABLED']) {
    assert.equal(rewon.vars[key], config.env.production.vars[key], key);
  }
  for (const key of ['NOWPAYMENTS_WEBHOOK_ENABLED', 'RESEND_WEBHOOK_ENABLED', 'RESEND_TRACE_ENABLED']) {
    assert.equal(rewon.vars[key], 'false', key);
    assert.equal(config.env.production.vars[key], 'true', key);
  }
  // Credentials belong to separately provisioned secrets, never this manifest.
  for (const key of Object.keys(rewon.vars)) {
    assert.doesNotMatch(key, /SECRET|TOKEN|API_KEY|DATABASE_URL|PASSWORD|CERT|PRIVATE_KEY/);
  }
  assert.equal(rewon.durable_objects, undefined);
  assert.equal(rewon.triggers, undefined);
});

test('rewon readiness and admission retain fresh bindings, exact-origin CSRF and admin isolation', () => {
  const env = { ...rewon.vars, HYPERDRIVE_MEMBER_FRESH: { connectionString: 'synthetic-not-used' },
    CORE_API: { fetch() { assert.fail('no Core calls are allowed in this configuration test'); } } };
  assert.equal(cloudflareReadiness(env), true);
  assert.equal(cloudflareReadiness({ ...env, MEMBER_DB_QUERY_CACHE_DISABLED: 'false' }), false);
  assert.equal(cloudflareReadiness({ ...env, HYPERDRIVE_MEMBER_FRESH: undefined }), false);
  assert.equal(cloudflareReadiness({ ...env, CORE_API: undefined }), false);
  const request = (path, origin = env.AUTH_PUBLIC_ORIGIN) => cloudflarePortalRequest(new Request(env.AUTH_PUBLIC_ORIGIN + path,
    { method: 'POST', headers: { origin, 'sec-fetch-site': 'same-origin', 'content-type': 'application/json' } }));
  assert.equal(cloudflarePortalGuard(request('/api/member/profile'), env), null);
  assert.equal(cloudflarePortalGuard(request('/api/member/profile', 'https://mindblisspower.com'), env).status, 403);
  assert.equal(cloudflarePortalGuard(request('/api/admin/users'), env).status, 404);
});
