import assert from 'node:assert/strict';
import test from 'node:test';
import { handleMeldWebhook } from './meld-webhook-bff.mjs';

const env = { AUTH_PROVIDER: 'better-auth', AUTH_BFF_SHARED_SECRET: 's'.repeat(32),
  AUTH_PUBLIC_ORIGIN: 'https://app.mindblisspower.com', BETTER_AUTH_BACKEND_URL: 'https://auth.core.internal', NODE_ENV: 'production' };
const headers = { 'content-type': 'application/json', 'meld-signature': 'a'.repeat(43) + '=',
  'meld-signature-timestamp': '2026-11-10T15:00:00.000Z' };
const request = (body = '{}', path = '/api/webhooks/meld') => new Request(`${env.AUTH_PUBLIC_ORIGIN}${path}`, { method: 'POST', headers, body });

test('Meld ingress preserves the signed raw body and proof headers for the private backend', async () => {
  const body = '{"eventId":"exact-raw-body"}'; let forwarded;
  const response = await handleMeldWebhook(request(body), { env, serviceRequest: async (url, init) => {
    forwarded = { url, init }; return { ok: true, status: 200, data: { received: true } };
  } });
  assert.equal(response.status, 200);
  assert.equal(forwarded.url, 'https://auth.core.internal/api/webhooks/meld');
  assert.equal(new TextDecoder().decode(forwarded.init.body), body);
  assert.equal(forwarded.init.headers['meld-signature'], headers['meld-signature']);
});

test('Meld ingress rejects aliases, missing proof and oversized bodies before private transport', async () => {
  const never = async () => assert.fail('invalid webhook forwarded');
  assert.equal((await handleMeldWebhook(request('{}', '/api/webhooks/meld?debug=1'), { env, serviceRequest: never })).status, 404);
  const unsigned = new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/webhooks/meld`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  assert.equal((await handleMeldWebhook(unsigned, { env, serviceRequest: never })).status, 401);
  const oversized = new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/webhooks/meld`, { method: 'POST', headers: {
    ...headers, 'content-length': String(129 * 1024),
  }, body: '{}' });
  assert.equal((await handleMeldWebhook(oversized, { env, serviceRequest: never })).status, 413);
});
