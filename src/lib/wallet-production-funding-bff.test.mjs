import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash, createHmac } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { handleWalletProductionFunding, productionWalletCoreFetch } from './wallet-production-funding-bff.mjs';
import { runCloudflareRequest } from './cloudflare-runtime.mjs';
import { WALLET_PRODUCTION_PATH as base, WALLET_PRODUCTION_INTERNAL_PATH as internalBase, WALLET_PRODUCTION_ORIGIN as origin } from './wallet-production-funding-contract.mjs';
import { walletProductionStatus, walletProductionHistory } from './wallet-production-funding-contract.mjs';
import { readProductionStatus, readProductionHistory } from './wallet-production-funding-client.mjs';
import { cloudflarePortalGuard } from './cloudflare-portal-guard.mjs';

const owner = 'synthetic-production-owner', reference = '11111111-1111-4111-8111-111111111111', otherReference = '22222222-2222-4222-8222-222222222222';
const address = `0x${'1'.repeat(40)}`, cookie = 'better-auth.session_token=synthetic';
const env = { AUTH_PUBLIC_ORIGIN: origin, AUTH_PROVIDER: 'better-auth', AUTH_BFF_SHARED_SECRET: 's'.repeat(48), NODE_ENV: 'production' };
const destination = { address, asset: 'USDT', network: 'polygon', chainId: 137 };
const capability = { flow: 'wallet_funding', configured: true, environment: 'production', asset: 'USDT', network: 'polygon', chainId: 137, canBroadcast: false };
const input = { country: 'US', sourceCurrencyCode: 'USD', amount: 50, paymentMethodType: 'CREDIT_DEBIT_CARD' };
const sessionInput = { ...input, requestId: reference, serviceProvider: 'ONRAMPMONEY' };
const countries = { countries: [{ code: 'US', name: 'United States' }, { code: 'MX', name: 'Mexico' }] };
const discovery = { country: 'US', currencies: [{ code: 'USD', name: 'US Dollar', decimalPlaces: 2 }], defaultCurrencyCode: 'USD' };
const options = { environment: 'production', country: 'US', sourceCurrencyCode: 'USD',
  routes: [{ serviceProvider: 'ONRAMPMONEY', paymentMethods: [{ method: 'CREDIT_DEBIT_CARD', currencyCode: 'USD', minimumAmount: 20, maximumAmount: 25000 }] }] };
const quote = { walletKind: 'personal', environment: 'production', country: 'US', sourceCurrencyCode: 'USD', requestedAmount: 50, paymentMethodType: 'CREDIT_DEBIT_CARD', destination,
  quotes: [{ serviceProvider: 'ONRAMPMONEY', sourceAmount: 50, destinationAmount: 46.5, totalFee: 3, networkFee: 0.5, sourceCurrencyCode: 'USD', destinationCurrencyCode: 'USDT_POLYGON' }] };
const snapshot = { checkoutReference: reference, provider: 'meld', serviceProvider: 'ONRAMPMONEY', country: 'US', requestedAmount: 50, sourceCurrencyCode: 'USD', paymentMethodType: 'CREDIT_DEBIT_CARD', destination };
const ack = { ...snapshot, walletKind: 'personal', environment: 'production', status: 'session_created', destinationCurrencyCode: 'USDT_POLYGON',
  checkoutUrl: 'https://meldcrypto.com/?token=synthetic_opaque', createdAt: '2026-11-19T12:00:00.000Z' };
const status = { ...snapshot, walletKind: 'personal', environment: 'production', requestStatus: 'session_created', confirmation: { state: 'unconfirmed', source: 'none', testMode: false } };
const history = { walletKind: 'personal', environment: 'production', settlement: 'unconfirmed', records: [{ ...snapshot, status: 'session_created', createdAt: ack.createdAt }] };
const hash = value => createHash('sha256').update(value).digest('hex');
function request(action, body = undefined, headers = {}) {
  return new Request(`${origin}${base}/${action}`, { method: body === undefined ? 'GET' : 'POST', headers: {
    cookie: `${cookie}; unrelated=never-forward`, origin, 'sec-fetch-site': 'same-origin', 'cf-connecting-ip': '192.0.2.7',
    'x-mindbliss-wallet-subject': encodeURIComponent(owner), ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...headers,
  }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
}
const success = data => async () => ({ ok: true, status: 200, data });

test('seven production actions pin the Wallet private service, native cookies, canonical owner fence and fixed origin', async () => {
  const cases = [['capabilities', undefined, capability], ['discovery', undefined, countries], ['discovery?country=US', undefined, discovery],
    ['options?country=US&sourceCurrencyCode=USD', undefined, options], ['quote', input, quote], ['session', sessionInput, ack],
    [`status?checkoutReference=${reference}`, undefined, status], ['history', undefined, history]];
  let calls = 0;
  for (const [path, body, data] of cases) {
    const action = path.split('?')[0];
    const response = await handleWalletProductionFunding(request(path, body), action, { env, serviceRequest: async (url, init) => {
      calls++; assert.equal(url, `https://wallet.core.internal${internalBase}/${path}`); assert.equal(init.method, body === undefined ? 'GET' : 'POST');
      const headers = new Headers(init.headers); assert.equal(headers.get('cookie'), cookie); assert.equal(headers.get('origin'), origin);
      assert.equal(headers.get('x-mindbliss-wallet-subject'), encodeURIComponent(owner)); assert.equal(headers.get('authorization'), null);
      assert.equal(headers.get('x-vp-act-as'), null); assert.equal(headers.get('x-mindbliss-sandbox-subject'), null);
      if (body === undefined) { assert.equal(init.body, undefined); assert.equal(headers.get('x-vp-auth-signature'), null); }
      else { assert.deepEqual(JSON.parse(init.body), body);
        const expected = createHmac('sha256', env.AUTH_BFF_SHARED_SECRET).update(['POST', `${internalBase}/${action}`, headers.get('x-vp-auth-timestamp'),
          headers.get('x-vp-auth-client-ip'), hash(cookie), hash(init.body)].join('\n')).digest('hex');
        assert.equal(headers.get('x-vp-auth-signature'), expected); }
      return { ok: true, status: action === 'session' ? 201 : 200, data };
    } });
    assert.equal(response.status, action === 'session' ? 201 : 200, path); assert.match(response.headers.get('cache-control'), /private.*no-store/); assert.equal(response.headers.get('vary'), 'Cookie');
  }
  assert.equal(calls, 8);
});

test('Mercuryo MX cards stay on USDC Polygon and retain an unknown network fee across the private service', async () => {
  for (const [sourceCurrencyCode, amount] of [['MXN', 1000], ['USD', 100]]) {
    const selection = { ...input, country: 'MX', sourceCurrencyCode, amount };
    const session = { ...selection, requestId: reference, serviceProvider: 'MERCURYO' };
    const receiving = { ...destination, asset: 'USDC' };
    const scopedQuote = { ...quote, country: 'MX', sourceCurrencyCode, requestedAmount: amount, destination: receiving,
      quotes: [{ ...quote.quotes[0], serviceProvider: 'MERCURYO', sourceCurrencyCode, sourceAmount: amount, destinationCurrencyCode: 'USDC_POLYGON', networkFee: null }] };
    const scopedAck = { ...ack, country: 'MX', sourceCurrencyCode, requestedAmount: amount, serviceProvider: 'MERCURYO',
      destinationCurrencyCode: 'USDC_POLYGON', destination: receiving };
    const responses = [
      ['quote', selection, scopedQuote, 200],
      ['session', session, scopedAck, 201],
    ];
    for (const [action, body, data, status] of responses) {
      const response = await handleWalletProductionFunding(request(action, body), action, { env, serviceRequest: async (_url, init) => {
        assert.deepEqual(JSON.parse(init.body), body);
        return { ok: true, status, data };
      } });
      assert.equal(response.status, status);
      const payload = await response.json();
      assert.equal(payload.destination.asset, 'USDC');
      if (action === 'quote') assert.equal(payload.quotes[0].networkFee, null);
      else assert.equal(payload.checkoutUrl, scopedAck.checkoutUrl);
    }
    for (const unsafe of [{ ...session, country: 'US' }, { ...session, sourceCurrencyCode: 'EUR' }, { ...session, paymentMethodType: 'APPLE_PAY' },
      { ...session, destinationCurrencyCode: 'USDC_ARBITRUM' }]) {
      const denied = await handleWalletProductionFunding(request('session', unsafe), 'session', { env, serviceRequest: async () => assert.fail('Unsafe selection reached Core') });
      assert.equal(denied.status, 400);
    }
  }
});

test('Brazil quotes and sessions accept only Pix or card with USDC on Arbitrum', async () => {
  const receiving = { address, asset: 'USDC', network: 'arbitrum', chainId: 42161 };
  for (const [paymentMethodType, serviceProvider] of [['PIX', 'ALCHEMYPAY'], ['CREDIT_DEBIT_CARD', 'MERCURYO']]) {
    const selection = { country: 'BR', sourceCurrencyCode: 'BRL', amount: 500, paymentMethodType };
    const session = { ...selection, requestId: reference, serviceProvider };
    const expected = { country: 'BR', sourceCurrencyCode: 'BRL', requestedAmount: 500, paymentMethodType, destination: receiving };
    const scopedQuote = { ...quote, ...expected, quotes: [{ ...quote.quotes[0], serviceProvider, sourceAmount: 500,
      sourceCurrencyCode: 'BRL', destinationCurrencyCode: 'USDC_ARBITRUM' }] };
    const scopedAck = { ...ack, ...expected, serviceProvider, destinationCurrencyCode: 'USDC_ARBITRUM' };
    for (const [action, body, data, status] of [['quote', selection, scopedQuote, 200], ['session', session, scopedAck, 201]]) {
      const response = await handleWalletProductionFunding(request(action, body), action, { env, serviceRequest: async () => ({ ok: true, status, data }) });
      assert.equal(response.status, status);
      assert.deepEqual((await response.json()).destination, receiving);
    }
    for (const unsafe of [{ ...session, serviceProvider: 'BANXA' }, { ...session, sourceCurrencyCode: 'USD' },
      { ...session, paymentMethodType: 'LOCAL_BANK_TRANSFER' }, { ...session, destinationCurrencyCode: 'USDC_POLYGON' }]) {
      const response = await handleWalletProductionFunding(request('session', unsafe), 'session', { env, serviceRequest: async () => assert.fail('Brazil route unavailable') });
      assert.equal(response.status, 400);
    }
    const wrongDestination = { ...scopedAck, destination: { ...receiving, network: 'polygon', chainId: 137 }, destinationCurrencyCode: 'USDC_POLYGON' };
    const rejected = await handleWalletProductionFunding(request('session', session), 'session', { env, serviceRequest: success(wrongDestination) });
    assert.equal(rejected.status, 502);
  }
});

test('a foreign portal, impersonation, absent native cookie or malformed owner fence cannot reach production Core', async () => {
  const never = async () => assert.fail('Unsafe owner/portal reached transport');
  for (const headers of [{ 'x-mindbliss-wallet-subject': '' }, { 'x-mindbliss-wallet-subject': '%' },
    { 'x-mindbliss-wallet-subject': '%73ynthetic-production-owner' }, { 'x-mindbliss-wallet-subject': 'synthetic%00owner' }, { 'x-vp-act-as': '' }]) {
    assert.equal((await handleWalletProductionFunding(request('history', undefined, headers), 'history', { env, serviceRequest: never })).status, 403);
  }
  assert.equal((await handleWalletProductionFunding(request('history', undefined, { cookie: '' }), 'history', { env, serviceRequest: never })).status, 401);
  const foreign = new Request(`https://app.mindblisspower.com${base}/history`, { headers: request('history').headers });
  assert.equal((await handleWalletProductionFunding(foreign, 'history', { env, serviceRequest: never })).status, 404);
  assert.equal((await handleWalletProductionFunding(request('history'), 'history', { env: { ...env, AUTH_PUBLIC_ORIGIN: 'https://app.mindblisspower.com' }, serviceRequest: never })).status, 404);
  assert.equal((await handleWalletProductionFunding(request('session', sessionInput, { origin: 'https://app.mindblisspower.com' }), 'session', { env, serviceRequest: never })).status, 403);
});

test('strict POST schemas reject destination, environment, provider and owner injection before one Native call', async () => {
  const never = async () => assert.fail('Injected input reached Native');
  for (const action of ['quote', 'session']) {
    const valid = action === 'session' ? sessionInput : input;
    for (const extra of [{ address: `0x${'2'.repeat(40)}` }, { destination }, { destinationCurrencyCode: 'USDT_ETHEREUM' }, { chainId: 1 },
      { environment: 'sandbox' }, { ownerSubject: 'foreign' }, { email: 'foreign@example.test' }, { checkoutUrl: 'https://evil.example/' }, { preferred_side: 'R' }]) {
      assert.equal((await handleWalletProductionFunding(request(action, { ...valid, ...extra }), action, { env, serviceRequest: never })).status, 400);
    }
    for (const change of [{ amount: 49.99 }, { amount: 25000.01 }, { amount: '50' }, { amount: 50.001 }, { country: 'us' }, { sourceCurrencyCode: 'usd' }]) {
      assert.equal((await handleWalletProductionFunding(request(action, { ...valid, ...change }), action, { env, serviceRequest: never })).status, 400);
    }
  }
  assert.equal((await handleWalletProductionFunding(request('quote', { ...input, serviceProvider: 'TRANSAK' }), 'quote', { env, serviceRequest: never })).status, 400);
  assert.equal((await handleWalletProductionFunding(request('session', { ...sessionInput, serviceProvider: 'BINANCECONNECT' }), 'session', { env, serviceRequest: never })).status, 400);
  assert.equal((await handleWalletProductionFunding(request('session', { ...sessionInput, requestId: 'not-a-reference' }), 'session', { env, serviceRequest: never })).status, 400);
});

test('read-only query selectors and duplicate country, fiat or request IDs cannot select another owner or endpoint', async () => {
  const never = async () => assert.fail('Injected selector reached Native');
  for (const [action, path] of [['history', 'history?address=foreign'], ['capabilities', 'capabilities?environment=sandbox'],
    ['discovery', 'discovery?country=US&country=MX'], ['discovery', 'discovery?email=foreign@example.test'],
    ['options', 'options?country=US&sourceCurrencyCode=USD&sourceCurrencyCode=MXN'], ['options', 'options?country=US&sourceCurrencyCode=USD&serviceProvider=TRANSAK'],
    ['status', `status?checkoutReference=${reference}&checkoutReference=${otherReference}`], ['status', `status?checkoutReference=${reference}&subject=foreign`]]) {
    assert.equal((await handleWalletProductionFunding(request(path), action, { env, serviceRequest: never })).status, 400, path);
  }
  assert.equal((await handleWalletProductionFunding(request('history', {}), 'history', { env, serviceRequest: never })).status, 405);
  assert.equal((await handleWalletProductionFunding(request('session'), 'session', { env, serviceRequest: never })).status, 405);
});

test('discovery and options correlate actual country and fiat without fabricating a default or remapping unavailable routes', async () => {
  const empty = { country: 'CO', currencies: [], defaultCurrencyCode: null };
  const result = await handleWalletProductionFunding(request('discovery?country=CO'), 'discovery', { env, serviceRequest: success(empty) });
  assert.equal(result.status, 200); assert.deepEqual(await result.json(), empty);
  for (const [action, path, data] of [['discovery', 'discovery?country=US', { ...discovery, country: 'MX' }],
    ['options', 'options?country=US&sourceCurrencyCode=USD', { ...options, country: 'CO' }],
    ['options', 'options?country=US&sourceCurrencyCode=USD', { ...options, sourceCurrencyCode: 'MXN' }],
    ['options', 'options?country=US&sourceCurrencyCode=USD', { ...options, routes: [{ ...options.routes[0], paymentMethods: [{ ...options.routes[0].paymentMethods[0], currencyCode: 'COP' }] }] }]]) {
    assert.equal((await handleWalletProductionFunding(request(path), action, { env, serviceRequest: success(data) })).status, 502);
  }
});

test('quote and session responses cannot cross source context, request reference, provider or USDT Polygon destination', async () => {
  const cases = [['quote', input, { ...quote, country: 'MX' }], ['quote', input, { ...quote, requestedAmount: 100 }], ['quote', input, { ...quote, paymentMethodType: 'APPLE_PAY' }],
    ['session', sessionInput, { ...ack, checkoutReference: otherReference }], ['session', sessionInput, { ...ack, sourceCurrencyCode: 'MXN' }],
    ['session', sessionInput, { ...ack, serviceProvider: 'TOPPER' }], ['session', sessionInput, { ...ack, paymentMethodType: 'GOOGLE_PAY' }]];
  for (const [action, body, value] of cases) assert.equal((await handleWalletProductionFunding(request(action, body), action, { env, serviceRequest: success(value) })).status, 502);
  for (const change of [{ asset: 'USDC' }, { network: 'ethereum', chainId: 1 }, { address: '0xinvalid' }, { chainId: 10 }]) {
    for (const [action, body, value] of [['quote', input, quote], ['session', sessionInput, ack]]) {
      const result = await handleWalletProductionFunding(request(action, body), action, { env, serviceRequest: success({ ...value, destination: { ...destination, ...change } }) });
      assert.equal(result.status, 502);
    }
  }
});

test('checkout handoff rejects sandbox, arbitrary hosts and injected provider parameters rather than opening them', async () => {
  for (const checkoutUrl of ['https://sb.meldcrypto.com/?token=synthetic', 'https://global-stg.transak.com/?apiKey=synthetic&sessionId=synthetic',
    'https://evil.example/?token=synthetic', 'https://global.transak.com/?apiKey=synthetic&sessionId=synthetic&walletAddress=evil',
    'https://global.transak.com/?apiKey=synthetic&sessionId=synthetic&redirectURL=https%3A%2F%2Fevil.example',
    'https://global.transak.com/?apiKey=synthetic&apiKey=other&sessionId=synthetic', 'https://meldcrypto.com/?wt=synthetic&token=other']) {
    const result = await handleWalletProductionFunding(request('session', sessionInput), 'session', { env, serviceRequest: success({ ...ack, checkoutUrl }) });
    assert.equal(result.status, 502, checkoutUrl);
  }
});

test('session creation and return-style success selectors cannot become payment confirmation', async () => {
  const created = await handleWalletProductionFunding(request('session', sessionInput), 'session', { env, serviceRequest: success({ ...ack,
    paid: true, success: true, confirmation: { state: 'confirmed', source: 'redirect', receivedAmount: 999 } }) });
  assert.equal(created.status, 200); const createdBody = await created.json(); assert.equal(createdBody.status, 'session_created');
  assert.equal(createdBody.confirmation, undefined); assert.equal(createdBody.paid, undefined);
  for (const confirmation of [{ state: 'confirmed', source: 'none', testMode: false, receivedAmount: 46.5, transactionId: 'synthetic', confirmedAt: ack.createdAt },
    { state: 'confirmed', source: 'meld_sandbox_api', testMode: true }, { state: 'paid', source: 'meld_production_api', testMode: false },
    { state: 'confirmed', source: 'meld_production_api', testMode: false, receivedAmount: 0, transactionId: 'synthetic', confirmedAt: ack.createdAt }]) {
    const result = await handleWalletProductionFunding(request(`status?checkoutReference=${reference}`), 'status', { env, serviceRequest: success({ ...status, confirmation }) });
    assert.equal(result.status, 502);
  }
});

test('private errors and ambiguous writes are sanitized with one transport attempt and never trigger a retry or fake success', async () => {
  let calls = 0;
  for (const [code, expected] of [['wallet_production_binding_required', 'wallet_production_binding_required'], ['private secret SQL provider error', 'wallet_production_unavailable']]) {
    const result = await handleWalletProductionFunding(request('session', sessionInput), 'session', { env, serviceRequest: async () => {
      calls++; return { ok: false, status: 409, data: { error: code, signature: 'private', wallet: 'foreign' } };
    } }); assert.equal(result.status, 409); assert.deepEqual(await result.json(), { error: expected });
  }
  const failure = await handleWalletProductionFunding(request('session', sessionInput), 'session', { env, serviceRequest: async () => { calls++; throw Error('network ended after a possible write'); } });
  assert.equal(failure.status, 503); assert.equal(calls, 3); assert.deepEqual(await failure.json(), { error: 'wallet_production_unavailable' });
});

test('default transport can only use WALLET_CORE, never production app Core, sandbox/public DNS or another native path', async t => {
  const calls = { wallet: 0, app: 0, public: 0 };
  t.mock.method(globalThis, 'fetch', () => { calls.public++; assert.fail('No public service fallback'); });
  const scopeEnv = { ...env, WALLET_CORE: { fetch: async (url, init) => { calls.wallet++; assert.equal(String(url), `https://wallet.core.internal${internalBase}/capabilities`);
    assert.equal(init.redirect, 'manual'); return Response.json(capability); } }, CORE_API: { fetch: async () => { calls.app++; assert.fail('No app production Core'); } } };
  const result = await runCloudflareRequest(request('capabilities'), scopeEnv, { waitUntil() {} }, req => handleWalletProductionFunding(req, 'capabilities'));
  assert.equal(result.status, 200); assert.deepEqual(await result.json(), capability);
  const missing = await runCloudflareRequest(request('capabilities'), { ...scopeEnv, WALLET_CORE: undefined }, { waitUntil() {} }, req => handleWalletProductionFunding(req, 'capabilities'));
  assert.equal(missing.status, 503);
  await runCloudflareRequest(request('capabilities'), scopeEnv, { waitUntil() {} }, async () => {
    for (const url of ['https://app.mindblisspower.com/api/member/wallet-funding/capabilities', 'https://auth.core.internal/api/member/wallet-funding/capabilities',
      'https://wallet.core.internal/api/member/sandbox-wallet/status', 'https://wallet.core.internal/api/member/profile',
      `https://wallet.core.internal${base}/history`]) await assert.rejects(productionWalletCoreFetch(url));
    return Response.json({ ok: true });
  });
  assert.deepEqual(calls, { wallet: 1, app: 0, public: 0 });
});

test('the observed Banxa production transit URL is bound to its provider and rejects retired providers and mismatched hosts', async () => {
  const banxaUrl = 'https://meldshared.banxa.com/papi/transit/?initId=synthetic_opaque';
  for (const [provider, checkoutUrl, expected] of [['BANXA', banxaUrl, 200], ['TRANSAK', banxaUrl, 400],
    ['ONRAMPMONEY', banxaUrl, 502], ['TOPPER', banxaUrl, 400], ['BANXA', 'https://meldcrypto.com/?token=synthetic_opaque', 200],
    ['TRANSAK', 'https://meldcrypto.com/?token=synthetic_opaque', 400],
    ['BANXA', banxaUrl + '&walletAddress=foreign', 502], ['BANXA', banxaUrl + '&initId=second', 502],
    ['BANXA', 'https://meldshared.banxa.com/papi/transit?initId=synthetic_opaque', 502], ['BANXA', 'https://checkout.banxa-sandbox.com/?initId=synthetic_opaque', 502]]) {
    const body = { ...sessionInput, serviceProvider: provider }, value = { ...ack, serviceProvider: provider, checkoutUrl };
    const result = await handleWalletProductionFunding(request('session', body), 'session', { env, serviceRequest: success(value) });
    assert.equal(result.status, expected, `${provider}:${checkoutUrl}`);
  }
});

test('an actual production SETTLED proof retains exact USDT string and required evidence through Native, BFF and browser parsing', async t => {
  const confirmation = { state: 'confirmed', source: 'meld_production_api', testMode: false, providerStatus: 'SETTLED',
    receivedAmount: '46.123456', transactionId: 'synthetic-production-transaction', confirmedAt: ack.createdAt };
  const values = { status: { ...status, confirmation }, history: { ...history, records: [{ ...history.records[0], confirmation }] } };
  const responses = new Map();
  for (const action of ['status', 'history']) {
    const suffix = action === 'status' ? `${action}?checkoutReference=${reference}` : action;
    const result = await handleWalletProductionFunding(request(suffix), action, { env, serviceRequest: success(values[action]) });
    assert.equal(result.status, 200); const body = await result.json(); responses.set(action, body);
    const proof = action === 'status' ? body.confirmation : body.records[0].confirmation;
    assert.equal(proof.state, 'confirmed'); assert.equal(proof.source, 'meld_production_api'); assert.equal(proof.testMode, false);
    assert.equal(proof.receivedAmount, '46.123456'); assert.equal(proof.providerStatus, 'SETTLED', 'The browser parser needs this evidence too');
    assert.equal(proof.transactionId, confirmation.transactionId); assert.equal(proof.confirmedAt, confirmation.confirmedAt);
    assert.ok(action === 'status' ? walletProductionStatus(body) : walletProductionHistory(body), 'Sanitized DTO remains valid on a second parse');
  }
  t.mock.method(globalThis, 'fetch', async path => Response.json(responses.get(path.includes('/status?') ? 'status' : 'history')));
  const clientStatus = await readProductionStatus(reference, { ownerSubject: owner }), clientHistory = await readProductionHistory({ ownerSubject: owner });
  assert.equal(clientStatus.confirmation.receivedAmount, '46.123456'); assert.equal(clientHistory.records[0].confirmation.state, 'confirmed');
  assert.equal(clientHistory.settlement, 'unconfirmed', 'A verified provider receipt never activates an internal financial ledger');
});

test('production confirmation cannot be forged with numeric or malformed amounts, missing SETTLED proof or unbounded transaction metadata', async () => {
  const valid = { state: 'confirmed', source: 'meld_production_api', testMode: false, providerStatus: 'SETTLED',
    receivedAmount: '46.123456', transactionId: 'synthetic-production-transaction', confirmedAt: ack.createdAt };
  for (const change of [{ receivedAmount: 46.123456 }, { receivedAmount: '0' }, { receivedAmount: '0.000000' }, { receivedAmount: '-1' },
    { receivedAmount: '1e2' }, { receivedAmount: '1.1234567' }, { receivedAmount: 'NaN' }, { receivedAmount: '1000000000000' },
    { transactionId: '' }, { transactionId: 'x'.repeat(129) }, { transactionId: '../foreign' }, { confirmedAt: 'not-a-date' },
    { providerStatus: 'SETTLING' }, { providerStatus: undefined }, { source: 'none' }, { source: 'meld_sandbox_api' }, { testMode: true }]) {
    const value = { ...status, confirmation: { ...valid, ...change } };
    const result = await handleWalletProductionFunding(request(`status?checkoutReference=${reference}`), 'status', { env, serviceRequest: success(value) });
    assert.equal(result.status, 502, JSON.stringify(change));
  }
});

test('current Native business errors remain actionable without leaking private metadata or retrying writes', async () => {
  const codes = ['wallet_production_verification_required', 'wallet_production_method_unavailable', 'wallet_production_amount_unavailable',
    'wallet_production_rate_limited', 'wallet_production_request_already_used', 'wallet_production_request_pending'];
  let calls = 0;
  for (const error of codes) {
    const result = await handleWalletProductionFunding(request('session', sessionInput), 'session', { env, serviceRequest: async () => {
      calls++; return { ok: false, status: error.includes('rate_limited') ? 429 : 409, data: { error, private: 'not-public' } };
    } }); assert.deepEqual(await result.json(), { error });
  }
  assert.equal(calls, codes.length);
});

test('the actual production route passes the Cloudflare guard and maps its public namespace to the unchanged private path and POST signature', async () => {
  assert.equal(base, '/api/member/wallet-funding/production'); assert.equal(internalBase, '/api/member/wallet-funding');
  assert.equal(existsSync(new URL('../app/api/member/wallet-funding/[...action]/route.js', import.meta.url)), false,
    'The retired catch-all cannot collide with the exact legacy history route');
  const source = readFileSync(new URL('../app/api/member/wallet-funding/production/[...action]/route.js', import.meta.url), 'utf8')
    .replaceAll('@/lib/wallet-production-funding-bff.mjs', new URL('./wallet-production-funding-bff.mjs', import.meta.url).href);
  const route = await import(`data:text/javascript,${encodeURIComponent(source)}`); assert.equal(route.dynamic, 'force-dynamic');
  let calls = 0;
  const scope = { ...env, WALLET_CORE: { fetch: async (url, init) => {
    calls++; const target = new URL(url), headers = new Headers(init.headers);
    assert.equal(target.origin, 'https://wallet.core.internal'); assert.equal(headers.get('x-mindbliss-wallet-subject'), encodeURIComponent(owner));
    if (init.method === 'GET') { assert.equal(target.pathname, `${internalBase}/history`); return Response.json(history); }
    assert.equal(target.pathname, `${internalBase}/session`);
    const expected = createHmac('sha256', env.AUTH_BFF_SHARED_SECRET).update(['POST', `${internalBase}/session`, headers.get('x-vp-auth-timestamp'),
      headers.get('x-vp-auth-client-ip'), hash(cookie), hash(init.body)].join('\n')).digest('hex');
    assert.equal(headers.get('x-vp-auth-signature'), expected); assert.deepEqual(JSON.parse(init.body), sessionInput);
    return Response.json(ack, { status: 201 });
  } } };
  for (const [action, method, body, expected] of [['history', 'GET', undefined, 200], ['session', 'POST', sessionInput, 201]]) {
    const input = request(action, body); assert.equal(cloudflarePortalGuard(input, env), null);
    const response = await runCloudflareRequest(input, scope, { waitUntil() {} }, req => route[method](req, { params: Promise.resolve({ action: [action] }) }));
    assert.equal(response.status, expected); await response.json();
  }
  const denied = cloudflarePortalGuard(new Request(`${origin}${internalBase}/history`), env);
  assert.equal(denied.status, 404); assert.equal(calls, 2);
});

test('RampNow US USD catalog, quote and session preserve the payment method and USDC network through the signed native request', async () => {
  const networks = ['USDC_POLYGON', 'USDC_ARBITRUM', 'USDC'];
  const expected = { address, asset: 'USDC', network: 'polygon', chainId: 137 };
  const actual = { address, asset: 'USDC', network: 'ethereum', chainId: 1 };
  const existingMethod = options.routes[0].paymentMethods[0];
  const allowedMethods = ['CREDIT_DEBIT_CARD', 'APPLE_PAY', 'GOOGLE_PAY', 'ACH', 'LOCAL_BANK_TRANSFER'];
  const paymentMethods = allowedMethods.map(method => ({ ...existingMethod, method, destinationCurrencyCodes: networks }));
  const catalog = { ...options, destinationCurrencyCode: 'USDC_POLYGON', routes: [{ serviceProvider: 'RAMPNOW', paymentMethods }] };
  const routePath = 'options?country=US&sourceCurrencyCode=USD';
  const catalogResponse = await handleWalletProductionFunding(request(routePath), 'options', { env, serviceRequest: success(catalog) });
  assert.equal(catalogResponse.status, 200);
  assert.deepEqual((await catalogResponse.json()).routes[0].paymentMethods, paymentMethods);
  const selection = { ...input, destinationCurrencyCode: 'USDC' };
  const checkout = { ...sessionInput, ...selection, serviceProvider: 'RAMPNOW' };
  for (const paymentMethodType of allowedMethods) {
    const price = { ...quote, paymentMethodType, destination: actual, quotes: [{ ...quote.quotes[0], serviceProvider: 'RAMPNOW', destinationCurrencyCode: 'USDC' }] };
    const session = { ...ack, paymentMethodType, destination: actual, destinationCurrencyCode: 'USDC', serviceProvider: 'RAMPNOW' };
    for (const [action, body, data] of [['quote', { ...selection, paymentMethodType }, price], ['session', { ...checkout, paymentMethodType }, session]]) {
      const response = await handleWalletProductionFunding(request(action, body), action, { env, serviceRequest: async (_url, init) => {
        assert.deepEqual(JSON.parse(init.body), body);
        const headers = new Headers(init.headers);
        const signed = createHmac('sha256', env.AUTH_BFF_SHARED_SECRET).update(['POST', internalBase + '/' + action, headers.get('x-vp-auth-timestamp'),
          headers.get('x-vp-auth-client-ip'), hash(cookie), hash(init.body)].join('\n')).digest('hex');
        assert.equal(headers.get('x-vp-auth-signature'), signed);
        return { ok: true, status: action === 'session' ? 201 : 200, data };
      } });
      assert.equal(response.status, action === 'session' ? 201 : 200);
      assert.deepEqual((await response.json()).destination, actual);
    }
  }
  const never = async () => assert.fail('Invalid route reached the native service');
  for (const [action, body] of [['quote', { ...selection, country: 'MX' }], ['quote', { ...selection, paymentMethodType: 'CASH_APP' }],
    ['session', { ...checkout, serviceProvider: 'BANXA' }], ['session', { ...checkout, destinationCurrencyCode: 'USDC_ETHEREUM' }],
    ['session', { ...checkout, address }], ['session', { ...checkout, paymentMethodType: 'PAYPAL' }],
    ['quote', { ...selection, sourceCurrencyCode: 'EUR', paymentMethodType: 'APPLE_PAY' }],
    ['session', { ...checkout, country: 'MX', paymentMethodType: 'GOOGLE_PAY' }]]) {
    assert.equal((await handleWalletProductionFunding(request(action, body), action, { env, serviceRequest: never })).status, 400);
  }
  for (const paymentMethodType of allowedMethods) {
    const settled = { ...status, paymentMethodType, serviceProvider: 'RAMPNOW', destination: expected, confirmedDestination: actual,
      confirmation: { state: 'confirmed', source: 'meld_production_api', testMode: false, receivedAmount: '46.500000',
        confirmedAt: ack.createdAt, transactionId: 'settled-synthetic', providerStatus: 'SETTLED' } };
    const transaction = await handleWalletProductionFunding(request('status?checkoutReference=' + reference), 'status', { env, serviceRequest: success(settled) });
    assert.equal(transaction.status, 200);
    const projected = await transaction.json();
    assert.deepEqual(projected.destination, expected);
    assert.deepEqual(projected.confirmedDestination, actual);
  }
});
