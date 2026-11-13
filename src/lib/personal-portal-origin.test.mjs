import assert from 'node:assert/strict';
import test from 'node:test';
import { isPersonalPortalOrigin, personalWalletMetadata } from './personal-portal-origin.mjs';
import { handleCompanyPayment, handleCompanyPaymentJournal } from './company-payment-bff.mjs';
import { handlePolygonRelay } from './polygon-relay-bff.mjs';
import { handlePersonalSolana } from './solana-wallet-bff.mjs';
import { cloudflarePortalGuard } from './cloudflare-portal-guard.mjs';

const origins = ['https://mindblisspower.com', 'https://app.mindblisspower.com'];
const configuration = origin => ({ NODE_ENV: 'production', AUTH_PROVIDER: 'better-auth', AUTH_PUBLIC_ORIGIN: origin,
  AUTH_BFF_SHARED_SECRET: 's'.repeat(40), BETTER_AUTH_BACKEND_URL: 'https://auth.core.internal',
  PERSONAL_COMPANY_PAYMENTS_ENABLED: 'true', PERSONAL_POLYGON_RELAY_ENABLED: 'true' });
const input = { requestId: '11111111-1111-4111-8111-111111111111', amountAtomic: '1000000' };
function request(origin, path, body, suppliedOrigin = origin) {
  return new Request(`${origin}/api/member/${path}`, { method: body ? 'POST' : 'GET',
    headers: { cookie: 'better-auth.session_token=synthetic', origin: suppliedOrigin, 'sec-fetch-site': 'same-origin',
      'content-type': 'application/json', 'cf-connecting-ip': '198.51.100.10' }, ...(body ? { body: JSON.stringify(body) } : {}) });
}
const rejectTransport = async () => assert.fail('untrusted origin or disabled capability reached Core');

test('wallet metadata matches each exact portal and never initializes on administrative or forged hosts', () => {
  for (const origin of [...origins, 'https://mindbliss-portal-rewon.devfidubit.workers.dev', 'http://localhost:3000', 'http://127.0.0.1:3000']) {
    const metadata = personalWalletMetadata(origin);
    assert.equal(metadata.url, origin); assert.deepEqual(metadata.icons, [`${origin}/mindbliss/mindbliss-favicon.png`]);
  }
  for (const origin of ['https://wallet.mindblisspower.com', 'https://admin.mindblisspower.com', 'https://app.mindblisspower.com.evil.test',
    'https://mindblisspower.com/', 'https://mindblisspower.com:443', 'https://mindblisspower.com:444', 'http://mindblisspower.com',
    'https://user@mindblisspower.com', 'https://mindblisspower.com?x=1', 'http://localhost.evil.test:3000', '', null, undefined]) {
    assert.equal(isPersonalPortalOrigin(origin), false); assert.equal(personalWalletMetadata(origin), null);
  }
  assert.equal(isPersonalPortalOrigin('http://localhost:3000'), false, 'development metadata cannot enable production BFFs');
});

test('both personal domains read owned direct payments, relay history and journal through their own exact origin', async () => {
  for (const origin of origins) {
    const env = configuration(origin), calls = [];
    const serviceRequest = async (url, init) => {
      calls.push(url); assert.equal(init.headers.origin, origin); assert.equal(init.headers.cookie, 'better-auth.session_token=synthetic');
      assert.match(init.headers['x-vp-auth-signature'], /^[a-f0-9]{64}$/);
      return { ok: true, data: url.includes('/activity') ? { walletKind: 'personal', events: [], nextCursor: null }
        : url.includes('/company-payments/') ? { walletKind: 'personal', records: [], membershipAssignment: 'pending' }
          : { walletKind: 'personal', payments: [] } };
    };
    assert.equal((await handleCompanyPayment(request(origin, 'company-payments/history'), 'history', { env, serviceRequest })).status, 200);
    assert.equal((await handleCompanyPaymentJournal(request(origin, 'company-payments/activity?limit=20'), 'activityHistory', { env, serviceRequest })).status, 200);
    assert.equal((await handlePolygonRelay(request(origin, 'polygon-relay/history'), 'history', { env, serviceRequest })).status, 200);
    assert.equal(calls.length, 3);
  }
});

test('root and app cannot authorize each other or administrative origins, even with a shared backend session', async () => {
  for (const origin of origins) {
    const env = configuration(origin);
    for (const supplied of origins.filter(value => value !== origin).concat('https://wallet.mindblisspower.com', 'https://admin.mindblisspower.com')) {
      assert.equal((await handleCompanyPayment(request(origin, 'company-payments/prepare', input, supplied), 'prepare', { env, serviceRequest: rejectTransport })).status, 403);
      assert.equal((await handleCompanyPaymentJournal(request(origin, 'company-payments/events', {}, supplied), 'recordEvent', { env, serviceRequest: rejectTransport })).status, 403);
      assert.equal((await handlePolygonRelay(request(origin, 'polygon-relay/prepare', input, supplied), 'prepare', { env, serviceRequest: rejectTransport })).status, 403);
      assert.equal((await handlePersonalSolana(request(origin, 'solana-wallet-link/challenge', {}, supplied), 'link', 'challenge',
        { env: { ...env, PERSONAL_SOLANA_ENABLED: 'true' }, serviceRequest: rejectTransport })).status, 403);
    }
    for (const path of ['/api/admin/users', '/%61pi/%61dmin/users', '/api%2Fadmin/users']) {
      assert.equal(cloudflarePortalGuard(new Request(origin + path), env).status, 404);
    }
  }
});

test('administrative or untrusted production origins cannot use the personal BFF capabilities', async () => {
  for (const origin of ['https://wallet.mindblisspower.com', 'https://admin.mindblisspower.com', 'https://mindblisspower.com.evil.test']) {
    const env = configuration(origin);
    assert.equal((await handleCompanyPayment(request(origin, 'company-payments/history'), 'history', { env, serviceRequest: rejectTransport })).status, 404);
    assert.equal((await handleCompanyPaymentJournal(request(origin, 'company-payments/activity?limit=20'), 'activityHistory', { env, serviceRequest: rejectTransport })).status, 404);
    assert.equal((await handlePolygonRelay(request(origin, 'polygon-relay/history'), 'history', { env, serviceRequest: rejectTransport })).status, 404);
    assert.equal((await handlePersonalSolana(request(origin, 'solana-wallet-link'), 'link', 'status', { env, serviceRequest: rejectTransport })).status, 404);
  }
});

test('Solana identity uses the exact portal only behind its existing gate; new deployments do not enable Solana payments', async () => {
  for (const origin of origins) {
    const env = configuration(origin);
    assert.equal((await handlePersonalSolana(request(origin, 'solana-wallet-link'), 'link', 'status', { env, serviceRequest: rejectTransport })).status, 503);
    assert.equal((await handlePersonalSolana(request(origin, 'solana-payments/capabilities'), 'payments', 'capabilities', { env, serviceRequest: rejectTransport })).status, 503);
    const response = await handlePersonalSolana(request(origin, 'solana-wallet-link'), 'link', 'status', {
      env: { ...env, PERSONAL_SOLANA_ENABLED: 'true' }, serviceRequest: async (_url, init) => {
        assert.equal(init.headers.origin, origin); return { ok: true, data: { linked: false, address: '' } };
      },
    });
    assert.equal(response.status, 200); assert.deepEqual(await response.json(), { linked: false, address: '' });
  }
});
