import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash, createHmac } from 'node:crypto';
import { handleWalletFunding } from './wallet-funding-bff.mjs';

const env = { AUTH_PROVIDER: 'better-auth', AUTH_BFF_SHARED_SECRET: 's'.repeat(32),
  AUTH_PUBLIC_ORIGIN: 'https://app.example.test', BETTER_AUTH_BACKEND_URL: 'https://auth.core.internal', NODE_ENV: 'production' };
const requestId = 'd8a4c010-cc33-44da-a297-8b3c6440f491';
const input = { requestId, walletAddress: `0x${'1'.repeat(40)}`, country: 'CO', amount: 100, paymentMethodType: 'CREDIT_DEBIT_CARD' };
const ack = kind => ({ checkoutReference: requestId, walletKind: kind, environment: kind === 'personal' ? 'production' : 'sandbox',
  provider: kind === 'personal' ? 'reown' : 'meld', status: kind === 'personal' ? 'initiated' : 'session_created',
  requestedAmount: 100, createdAt: '2026-11-10T15:00:00.000Z', ...(kind === 'administrative' ? { checkoutUrl: 'https://sb.meldcrypto.com/?token=synthetic' }
    : { paymentMethodType: input.paymentMethodType, allowedProviders: ['TOPPER', 'SWAPPED'] }) });
const request = (body = input, headers = {}) => new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/member/wallet-funding/personal/intent`, {
  method: 'POST', headers: { cookie: 'better-auth.session_token=synthetic-session', origin: env.AUTH_PUBLIC_ORIGIN,
    'sec-fetch-site': 'same-origin', 'content-type': 'application/json', 'cf-connecting-ip': '198.51.100.10', ...headers }, body: JSON.stringify(body),
});

test('personal funding records one native request without Meld credentials, quotes or commissions', async () => {
  let calls = 0;
  const response = await handleWalletFunding(request(), 'personal', { env, serviceRequest: async (url, init) => {
    calls++; assert.equal(url, 'https://auth.core.internal/api/member/wallet-funding/personal/intent');
    assert.deepEqual(JSON.parse(init.body), input);
    assert.equal(init.headers.cookie, 'better-auth.session_token=synthetic-session');
    return { ok: true, data: { ...ack('personal'), commission: 1, token: 'must-not-leak' } };
  } });
  assert.equal(calls, 1); assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.deepEqual(await response.json(), ack('personal'));
});

test('funding rejects foreign origins, extra identity fields and invalid money before private transport', async () => {
  const never = async () => assert.fail('invalid transport');
  for (const body of [{ ...input, subject: 'another-user' }, { ...input, amount: 49 }, { ...input, amount: 100.001 },
    { ...input, amount: '100' }, { ...input, walletAddress: 'bad' }]) {
    assert.equal((await handleWalletFunding(request(body), 'personal', { env, serviceRequest: never })).status, 400);
  }
  assert.equal((await handleWalletFunding(request(input, { origin: 'https://evil.test' }), 'personal', { env, serviceRequest: never })).status, 403);
  assert.equal((await handleWalletFunding(request(input, { cookie: '' }), 'personal', { env, serviceRequest: never })).status, 401);
  const oversized = request({ ...input, additional: 'x'.repeat(3000) });
  assert.equal((await handleWalletFunding(oversized, 'personal', { env, serviceRequest: never })).status, 413);
});

test('administrative funding accepts only a sandbox session and leaves its opaque URL unchanged', async () => {
  const body = { ...input, serviceProvider: 'TRANSAK', paymentMethodType: 'CREDIT_DEBIT_CARD' };
  const expected = ack('administrative');
  const response = await handleWalletFunding(request(body), 'administrative', { env, serviceRequest: async (url, init) => {
    assert.equal(url, 'https://auth.core.internal/api/member/wallet-funding/administrative/session');
    assert.deepEqual(JSON.parse(init.body), body);
    const hash = value => createHash('sha256').update(value).digest('hex');
    const timestamp = init.headers['x-vp-auth-timestamp'];
    assert.equal(init.headers['x-vp-auth-client-ip'], '198.51.100.10');
    assert.equal(init.headers['x-vp-auth-signature'], createHmac('sha256', env.AUTH_BFF_SHARED_SECRET)
      .update(['POST', '/api/member/wallet-funding/administrative/session', timestamp, '198.51.100.10',
        hash(init.headers.cookie), hash(init.body)].join('\n')).digest('hex'));
    return { ok: true, data: expected };
  } });
  assert.equal(response.status, 200); assert.deepEqual(await response.json(), expected);
  assert.equal((await handleWalletFunding(request({ ...body, serviceProvider: 'TOPPER' }), 'administrative', { env,
    serviceRequest: async () => assert.fail('live provider entered sandbox flow') })).status, 400);
  assert.equal((await handleWalletFunding(request(body, { 'cf-connecting-ip': '' }), 'administrative', { env,
    serviceRequest: async () => assert.fail('missing trusted client IP forwarded') })).status, 503);
  for (const checkoutUrl of ['https://meldcrypto.com/?token=live', 'http://sb.meldcrypto.com/?token=bad',
    'https://sb.meldcrypto.com.evil.test/?token=bad', 'https://sb.meldcrypto.com:8443/?token=bad', 'https://user@sb.meldcrypto.com/?token=bad']) {
    assert.equal((await handleWalletFunding(request(body), 'administrative', { env,
      serviceRequest: async () => ({ ok: true, data: { ...expected, checkoutUrl } }) })).status, 502);
  }
});

test('wallet and environment acknowledgements cannot cross funding histories or claim settlement', async () => {
  for (const data of [{ ...ack('personal'), environment: 'sandbox' }, { ...ack('personal'), walletKind: 'administrative' },
    { ...ack('personal'), status: 'complete' }, { ...ack('personal'), requestedAmount: 101 },
    { ...ack('personal'), checkoutReference: 'd8a4c010-cc33-44da-a297-8b3c6440f492' }]) {
    assert.equal((await handleWalletFunding(request(), 'personal', { env, serviceRequest: async () => ({ ok: true, data }) })).status, 502);
  }
  const get = new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/member/wallet-funding/history?walletKind=personal`, { headers: { cookie: 'better-auth.session_token=synthetic' } });
  const history = { walletKind: 'personal', environment: 'production', settlement: 'unconfirmed', records: [{
    checkoutReference: requestId, requestedAmount: 100, country: 'CO', status: 'initiated', createdAt: ack('personal').createdAt, provider: 'reown',
  }] };
  const good = await handleWalletFunding(get, 'history', { env, serviceRequest: async url => {
    assert.equal(url, 'https://auth.core.internal/api/member/wallet-funding/history?walletKind=personal'); return { ok: true, data: history };
  } });
  assert.deepEqual(await good.json(), history);
  const bad = await handleWalletFunding(get, 'history', { env, serviceRequest: async () => ({ ok: true,
    data: { ...history, records: [{ ...history.records[0], status: 'complete' }] } }) });
  assert.equal(bad.status, 502);
});

test('administrative methods use only the selected sandbox country and provider, with no personal fallback', async () => {
  const options = { walletKind: 'administrative', environment: 'sandbox', provider: 'meld', country: 'US', serviceProvider: 'TRANSAK',
    paymentMethods: ['CREDIT_DEBIT_CARD', 'APPLE_PAY'], routes: [{ serviceProvider: 'TRANSAK', paymentMethods: [
      { method: 'CREDIT_DEBIT_CARD', minimumUsd: 20, maximumUsd: 15000 }, { method: 'APPLE_PAY', minimumUsd: 20, maximumUsd: 15000 }] }] };
  const get = new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/member/wallet-funding/administrative/options?country=US&serviceProvider=TRANSAK`,
    { headers: { cookie: 'better-auth.session_token=synthetic' } });
  const response = await handleWalletFunding(get, 'options', { env, serviceRequest: async (url, init) => {
    assert.equal(url, 'https://auth.core.internal/api/member/wallet-funding/administrative/options?country=US&serviceProvider=TRANSAK');
    assert.equal(init.method, 'GET'); assert.equal(init.body, undefined);
    return { ok: true, data: { ...options, privateKey: 'must-not-reach-browser' } };
  } });
  assert.deepEqual(await response.json(), options);
  for (const data of [{ ...options, environment: 'production' }, { ...options, country: 'CO' }, { ...options, serviceProvider: 'BANXA' },
    { ...options, paymentMethods: ['CARD', 'CARD'] }, { ...options, paymentMethods: ['<script>'] }]) {
    assert.equal((await handleWalletFunding(get, 'options', { env, serviceRequest: async () => ({ ok: true, data }) })).status, 502);
  }
  const empty = await handleWalletFunding(get, 'options', { env, serviceRequest: async () => ({ ok: true, data: { ...options, paymentMethods: [], routes: [] } }) });
  assert.deepEqual((await empty.json()).paymentMethods, []);
});

test('personal options authenticate and reject crossed countries, sandbox methods and unknown limits', async () => {
  const options = { walletKind: 'personal', environment: 'production', provider: 'reown', country: 'CO',
    paymentMethods: ['CREDIT_DEBIT_CARD'], routes: [{ serviceProvider: 'SWAPPED', paymentMethods: [
      { method: 'CREDIT_DEBIT_CARD', minimumUsd: 10, maximumUsd: 10000 }] }] };
  const get = new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/member/wallet-funding/personal/options?country=CO`,
    { headers: { cookie: 'better-auth.session_token=synthetic' } });
  const response = await handleWalletFunding(get, 'personal-options', { env, serviceRequest: async (url, init) => {
    assert.equal(url, 'https://auth.core.internal/api/member/wallet-funding/personal/options?country=CO');
    assert.equal(init.method, 'GET'); assert.equal(init.body, undefined);
    return { ok: true, data: { ...options, secret: 'must-not-leak' } };
  } });
  assert.deepEqual(await response.json(), options);
  for (const data of [{ ...options, environment: 'sandbox' }, { ...options, country: 'US' },
    { ...options, routes: [{ ...options.routes[0], serviceProvider: 'BANXA' }] },
    { ...options, routes: [{ ...options.routes[0], paymentMethods: [{ method: 'CREDIT_DEBIT_CARD', minimumUsd: null, maximumUsd: 10000 }] }] }]) {
    assert.equal((await handleWalletFunding(get, 'personal-options', { env, serviceRequest: async () => ({ ok: true, data }) })).status, 502);
  }
  assert.equal((await handleWalletFunding(new Request(get.url), 'personal-options', { env,
    serviceRequest: async () => assert.fail('unauthenticated discovery transport') })).status, 401);
});
