import assert from 'node:assert/strict';
import test from 'node:test';
import { createAdministrativeSandboxSession, createPersonalFundingIntent, readAdministrativeSandboxOptions, readPersonalFundingOptions,
  readWalletFundingHistory, readWalletFundingStatus } from './wallet-funding-client.mjs';
import { handleWalletFunding } from './wallet-funding-bff.mjs';

const versionHeader = 'x-mindbliss-sandbox-contract';
const reference = 'd8a4c010-cc33-44da-a297-8b3c6440f491', address = `0x${'b'.repeat(40)}`;
const destination = { address, asset: 'USDT', network: 'polygon', chainId: 137 };
const input = { requestId: reference, walletAddress: address, country: 'US', sourceCurrencyCode: 'USD', amount: 100, paymentMethodType: 'CREDIT_DEBIT_CARD', serviceProvider: 'TRANSAK' };
const env = { AUTH_PROVIDER: 'better-auth', AUTH_BFF_SHARED_SECRET: 's'.repeat(32), AUTH_PUBLIC_ORIGIN: 'https://wallet.mindblisspower.com',
  BETTER_AUTH_BACKEND_URL: 'https://auth.core.internal', NODE_ENV: 'production' };
const legacyAck = { walletKind: 'administrative', environment: 'sandbox', provider: 'meld', checkoutReference: reference, requestedAmount: 100, sourceCurrencyCode: 'USD',
  status: 'session_created', createdAt: '2026-11-12T15:00:00Z', checkoutUrl: 'https://sb.meldcrypto.com/?token=synthetic' };
const modernAck = { ...legacyAck, serviceProvider: 'TRANSAK', checkoutUrl: 'https://global-stg.transak.com/?apiKey=synthetic-public&sessionId=synthetic-session' };
const proof = { state: 'confirmed', source: 'meld_sandbox_api', testMode: true, transactionId: 'synthetic-transaction', providerStatus: 'SETTLED', receivedAmount: '97.123456', confirmedAt: '2026-11-12T15:10:00Z' };
const status = (kind = 'administrative', modern = false) => ({ walletKind: kind, environment: kind === 'administrative' ? 'sandbox' : 'production', provider: kind === 'administrative' ? 'meld' : 'reown',
  checkoutReference: reference, requestedAmount: 100, sourceCurrencyCode: 'USD', country: 'US', paymentMethodType: 'CREDIT_DEBIT_CARD', destination,
  requestStatus: kind === 'administrative' ? 'session_created' : 'initiated', confirmation: modern ? proof : { state: 'unconfirmed', source: 'none', testMode: kind === 'administrative' } });
const history = (kind = 'administrative', modern = false) => ({ walletKind: kind, environment: kind === 'administrative' ? 'sandbox' : 'production', settlement: 'unconfirmed',
  records: modern ? [{ checkoutReference: reference, requestedAmount: 100, sourceCurrencyCode: 'USD', country: 'US', paymentMethodType: 'CREDIT_DEBIT_CARD', provider: 'meld',
    status: 'session_created', destination, createdAt: '2026-11-12T15:00:00Z', confirmation: proof }] : [] });
const options = kind => ({ walletKind: kind, environment: kind === 'administrative' ? 'sandbox' : 'production', provider: kind === 'administrative' ? 'meld' : 'reown', country: 'US', sourceCurrencyCode: 'USD',
  ...(kind === 'administrative' ? { serviceProvider: 'TRANSAK' } : { destinationCurrencyCode: 'USDT_POLYGON', network: 'polygon', chainId: 137 }), paymentMethods: [], routes: [] });
const personalInput = () => { const { serviceProvider: _serviceProvider, ...body } = input; return body; };
const personalAck = () => ({ walletKind: 'personal', environment: 'production', provider: 'reown', checkoutReference: reference, requestedAmount: 100, sourceCurrencyCode: 'USD',
  status: 'initiated', createdAt: '2026-11-12T15:00:00Z', paymentMethodType: 'CREDIT_DEBIT_CARD', allowedProviders: ['SWAPPED', 'MERCURYO'], destinationCurrencyCode: 'USDT_POLYGON', destination });
function nativeRequest(path, { body, version } = {}) {
  const headers = new Headers({ cookie: 'better-auth.session_token=synthetic', origin: env.AUTH_PUBLIC_ORIGIN, 'sec-fetch-site': 'same-origin',
    'cf-connecting-ip': '198.51.100.10', 'x-mindbliss-wallet-network': 'polygon' });
  if (version !== undefined) headers.set(versionHeader, version);
  if (body) headers.set('content-type', 'application/json');
  return new Request(`${env.AUTH_PUBLIC_ORIGIN}${path}`, { method: body ? 'POST' : 'GET', headers, ...(body ? { body: JSON.stringify(body) } : {}) });
}

test('new administrative JavaScript opts in only create, status and history, and accepts an older BFF legacy projection', async t => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (path, init) => {
    calls.push({ path, init });
    if (path.endsWith('/session')) return Response.json(legacyAck);
    if (path.includes('/status?')) return Response.json(status());
    if (path.includes('/history?')) return Response.json(history());
    return Response.json(options('administrative'));
  });
  assert.equal((await createAdministrativeSandboxSession(input)).checkoutUrl, legacyAck.checkoutUrl);
  assert.equal((await readWalletFundingStatus('administrative', reference)).confirmation.source, 'none');
  assert.deepEqual((await readWalletFundingHistory('administrative')).records, []);
  await readAdministrativeSandboxOptions('US', 'TRANSAK');
  assert.deepEqual(calls.map(call => new Headers(call.init.headers).get(versionHeader)), ['v2', 'v2', 'v2', null]);
  assert.equal(calls.filter(call => call.init.method === 'POST').length, 1, 'version negotiation never retries or opens a second order');
});

test('personal JavaScript never sends the administrative opt-in on writes, status, history or discovery', async t => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (path, init) => {
    calls.push({ path, init });
    if (path.endsWith('/intent')) return Response.json(personalAck());
    if (path.includes('/status?')) return Response.json(status('personal'));
    if (path.includes('/history?')) return Response.json(history('personal'));
    return Response.json(options('personal'));
  });
  await createPersonalFundingIntent(personalInput()); await readWalletFundingStatus('personal', reference);
  await readWalletFundingHistory('personal'); await readPersonalFundingOptions('US');
  assert.equal(calls.length, 4); assert.ok(calls.every(call => new Headers(call.init.headers).get(versionHeader) === null));
});

test('BFF forwards exactly v2 on the three validated administrative actions and keeps old or unknown clients on legacy output', async () => {
  const cases = [
    { action: 'administrative', path: '/api/member/wallet-funding/administrative/session', body: input, legacy: legacyAck, modern: modernAck },
    { action: 'administrative-status', path: `/api/member/wallet-funding/administrative/status?checkoutReference=${reference}`, legacy: status(), modern: status('administrative', true) },
    { action: 'history', path: '/api/member/wallet-funding/history?walletKind=administrative', legacy: history(), modern: history('administrative', true) },
  ];
  for (const item of cases) for (const version of [undefined, 'v1', 'V2', 'v2, v2', 'v2, v3', 'v2']) {
    let calls = 0;
    const response = await handleWalletFunding(nativeRequest(item.path, { body: item.body, version }), item.action, { env, serviceRequest: async (_url, init) => {
      calls++; assert.equal(new Headers(init.headers).get(versionHeader), version === 'v2' ? 'v2' : null);
      return { ok: true, data: version === 'v2' ? item.modern : item.legacy };
    } });
    assert.equal(calls, 1); assert.equal(response.status, 200);
    const result = await response.json();
    if (item.action === 'administrative') assert.equal(result.checkoutUrl, version === 'v2' ? modernAck.checkoutUrl : legacyAck.checkoutUrl);
    if (item.action === 'administrative-status') assert.equal(result.confirmation.source, version === 'v2' ? 'meld_sandbox_api' : 'none');
  }
});

test('BFF strips an injected administrative contract version from personal and discovery requests', async () => {
  const cases = [
    { action: 'personal', path: '/api/member/wallet-funding/personal/intent', body: personalInput(), data: personalAck() },
    { action: 'personal-status', path: `/api/member/wallet-funding/personal/status?checkoutReference=${reference}`, data: status('personal') },
    { action: 'history', path: '/api/member/wallet-funding/history?walletKind=personal', data: history('personal') },
    { action: 'options', path: '/api/member/wallet-funding/administrative/options?country=US&serviceProvider=TRANSAK', data: options('administrative') },
    { action: 'personal-options', path: '/api/member/wallet-funding/personal/options?country=US', data: options('personal') },
  ];
  for (const item of cases) {
    const response = await handleWalletFunding(nativeRequest(item.path, { body: item.body, version: 'v2' }), item.action, { env,
      serviceRequest: async (_url, init) => { assert.equal(new Headers(init.headers).get(versionHeader), null); return { ok: true, data: item.data }; } });
    assert.equal(response.status, 200);
  }
});

test('new JavaScript and new BFF negotiate provider checkout and verified test reads without duplicating orders', async t => {
  const upstream = [];
  t.mock.method(globalThis, 'fetch', async (path, init) => {
    const isCreate = path.endsWith('/session'), isStatus = path.includes('/status?');
    return handleWalletFunding(nativeRequest(path, { body: isCreate ? JSON.parse(init.body) : undefined, version: new Headers(init.headers).get(versionHeader) }),
      isCreate ? 'administrative' : isStatus ? 'administrative-status' : 'history', { env, serviceRequest: async (url, options) => {
        upstream.push({ url, options }); assert.equal(new Headers(options.headers).get(versionHeader), 'v2');
        return { ok: true, data: isCreate ? modernAck : isStatus ? status('administrative', true) : history('administrative', true) };
      } });
  });
  assert.equal((await createAdministrativeSandboxSession(input)).checkoutUrl, modernAck.checkoutUrl);
  assert.equal((await readWalletFundingStatus('administrative', reference)).confirmation.state, 'confirmed');
  assert.equal((await readWalletFundingHistory('administrative')).records[0].confirmation.testMode, true);
  assert.equal(upstream.length, 3); assert.equal(upstream.filter(call => call.options.method === 'POST').length, 1);
});
