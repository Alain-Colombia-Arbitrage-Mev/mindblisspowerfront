import assert from 'node:assert/strict';
import test from 'node:test';
import { WALLET_PRODUCTION_PATH as base, walletProductionInput, walletProductionCapabilities, walletProductionDiscovery, walletProductionOptions,
  walletProductionQuote, walletProductionAcknowledgement, walletProductionCheckoutUrl,
  walletProductionStatus, walletProductionHistory } from './wallet-production-funding-contract.mjs';
import { readProductionDiscovery, readProductionOptions, quoteProductionFunding, createProductionFunding,
  readProductionStatus, readProductionHistory } from './wallet-production-funding-client.mjs';

const ownerSubject = 'synthetic-wallet-owner';
const address = `0x${'1'.repeat(40)}`, otherAddress = `0x${'2'.repeat(40)}`;
const reference = '11111111-1111-4111-8111-111111111111';
const otherReference = '22222222-2222-4222-8222-222222222222';
const input = { country: 'US', sourceCurrencyCode: 'USD', amount: 50, paymentMethodType: 'CREDIT_DEBIT_CARD' };
const sessionInput = { ...input, requestId: reference, serviceProvider: 'ONRAMPMONEY' };
const destination = { address, asset: 'USDT', network: 'polygon', chainId: 137 };
const quoteItem = { serviceProvider: 'ONRAMPMONEY', sourceAmount: 50, destinationAmount: 47.25, totalFee: 2.5,
  networkFee: 0.25, sourceCurrencyCode: 'USD', destinationCurrencyCode: 'USDT_POLYGON', rampScore: 90 };
const quote = { walletKind: 'personal', environment: 'production', country: 'US', sourceCurrencyCode: 'USD',
  requestedAmount: 50, paymentMethodType: 'CREDIT_DEBIT_CARD', destination, quotes: [quoteItem] };
const checkoutUrl = 'https://meldcrypto.com/?token=synthetic_opaque';
const ack = { checkoutReference: reference, walletKind: 'personal', environment: 'production', provider: 'meld',
  serviceProvider: 'ONRAMPMONEY', country: 'US', sourceCurrencyCode: 'USD', requestedAmount: 50,
  paymentMethodType: 'CREDIT_DEBIT_CARD', destinationCurrencyCode: 'USDT_POLYGON', destination,
  status: 'session_created', checkoutUrl, createdAt: '2026-11-19T12:00:00.000Z' };
const discovery = { countries: [{ code: 'US', name: 'United States' }, { code: 'MX', name: 'Mexico' }, { code: 'CO', name: 'Colombia' }] };
const mexico = { country: 'MX', currencies: [{ code: 'MXN', name: 'Mexican Peso', decimalPlaces: 2 },
  { code: 'USD', name: 'US Dollar', decimalPlaces: 2 }], defaultCurrencyCode: 'MXN' };
const options = { environment: 'production', country: 'MX', sourceCurrencyCode: 'MXN',
  routes: [{ serviceProvider: 'ONRAMPMONEY', paymentMethods: [{ method: 'CREDIT_DEBIT_CARD', currencyCode: 'MXN', minimumAmount: 1000, maximumAmount: 100000 }] }] };
const status = { ...ack, requestStatus: 'session_created', confirmation: { state: 'unconfirmed', source: 'none', testMode: false } };
const history = { walletKind: 'personal', environment: 'production', settlement: 'unconfirmed', records: [ack] };
const context = { ownerSubject };
const clone = value => structuredClone(value);

test('production capabilities remain explicit about the environment, token, chain and absence of broadcasting', () => {
  assert.equal(base, '/api/member/wallet-funding/production', 'public production requests must not collide with legacy administrative history');
  const capability = { flow: 'wallet_funding', configured: true, environment: 'production', asset: 'USDT',
    network: 'polygon', chainId: 137, canBroadcast: false };
  assert.deepEqual(walletProductionCapabilities(capability), capability);
  for (const patch of [{ environment: 'sandbox' }, { asset: 'USDC' }, { chainId: 1 }, { network: 'ethereum' }, { canBroadcast: true }]) {
    assert.equal(walletProductionCapabilities({ ...capability, ...patch }), null);
  }
});

test('production input preserves native country and fiat units with USD 50–25,000 and strict cent precision', () => {
  assert.deepEqual(walletProductionInput(input), input);
  for (const amount of [50, 25000]) assert.equal(walletProductionInput({ ...input, amount }).amount, amount);
  for (const amount of [0, -1, 49.99, 25000.01, 50.005, NaN, Infinity, '50']) assert.equal(walletProductionInput({ ...input, amount }), null);
  for (const value of [{ country: 'MX', sourceCurrencyCode: 'MXN', amount: 931 },
    { country: 'CO', sourceCurrencyCode: 'COP', amount: 170000 }, { country: 'ES', sourceCurrencyCode: 'EUR', amount: 50 },
    { country: 'MX', sourceCurrencyCode: 'MXN', amount: 0.01 }]) {
    const next = { ...input, ...value };
    assert.deepEqual(walletProductionInput(next), next);
  }
  for (const patch of [{ country: 'mexico' }, { country: 'mx' }, { sourceCurrencyCode: 'mxn' },
    { sourceCurrencyCode: 'USDT' }, { paymentMethodType: 'card' }, { sourceCurrencyCode: 'MXN', amount: 1_000_000_000.01 }]) {
    assert.equal(walletProductionInput({ ...input, ...patch }), null);
  }
});

test('quote and session inputs reject browser-selected destinations, environment, owner and secret fields', async t => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; return Response.json(ack); });
  for (const patch of [{ address: otherAddress }, { destination }, { chainId: 1 }, { environment: 'sandbox' },
    { walletKind: 'administrative' }, { ownerSubject: 'another-owner' }, { apiKey: 'not-a-browser-field' },
    { paymentMethodType: 'CARD&provider=other' }]) {
    assert.equal(walletProductionInput({ ...input, ...patch }), null);
    assert.equal(walletProductionInput({ ...sessionInput, ...patch }, true), null);
    await assert.rejects(quoteProductionFunding({ ...input, ...patch }, address, context), /invalid_request/);
    await assert.rejects(createProductionFunding({ ...sessionInput, ...patch }, address, context), /invalid_request/);
  }
  for (const patch of [{ requestId: 'not-a-reference' }, { serviceProvider: 'BINANCECONNECT' }, { serviceProvider: 'UNKNOWN' }]) {
    assert.equal(walletProductionInput({ ...sessionInput, ...patch }, true), null);
    await assert.rejects(createProductionFunding({ ...sessionInput, ...patch }, address, context), /invalid_request/);
  }
  assert.equal(calls, 0);
});

test('all production browser calls require the mounted owner before any request', async t => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; return Response.json({}); });
  for (const call of [() => readProductionDiscovery(), () => readProductionDiscovery('MX'),
    () => readProductionOptions('MX', 'MXN'), () => quoteProductionFunding(input, address),
    () => createProductionFunding(sessionInput, address), () => readProductionStatus(reference), () => readProductionHistory()]) {
    await assert.rejects(call, /unauthenticated/);
  }
  assert.equal(calls, 0);
});

test('quote and session require a valid expected linked address before any network work', async t => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; return Response.json(ack); });
  for (const expectedAddress of [undefined, null, '', '0x1234', `0x${'0'.repeat(40)}`, { address }]) {
    await assert.rejects(quoteProductionFunding(input, expectedAddress, context), /invalid_request/);
    await assert.rejects(createProductionFunding(sessionInput, expectedAddress, context), /invalid_request/);
  }
  assert.equal(calls, 0);
});

test('discovery and options remain tied to the requested country and currency without inventing default routes', async t => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (path, init) => {
    calls.push({ path, init });
    return Response.json(path === `${base}/discovery` ? discovery : path.includes('/discovery?') ? mexico : options);
  });
  assert.deepEqual(await readProductionDiscovery('', context), discovery);
  assert.deepEqual(await readProductionDiscovery('MX', context), mexico);
  const selected = await readProductionOptions('MX', 'MXN', context);
  assert.equal(selected.sourceCurrencyCode, 'MXN');
  assert.deepEqual(selected.paymentMethods, ['CREDIT_DEBIT_CARD']);
  assert.equal(selected.routes[0].paymentMethods[0].minimumAmount, 1000);
  assert.deepEqual(calls.map(call => call.path), [`${base}/discovery`, `${base}/discovery?country=MX`, `${base}/options?country=MX&sourceCurrencyCode=MXN`]);
  for (const { init } of calls) {
    assert.equal(init.method, 'GET'); assert.equal(init.body, undefined);
    assert.equal(init.headers['x-mindbliss-wallet-subject'], encodeURIComponent(ownerSubject));
    assert.equal(init.credentials, 'same-origin'); assert.equal(init.cache, 'no-store'); assert.equal(init.redirect, 'error');
  }
  t.mock.method(globalThis, 'fetch', async () => Response.json({ ...mexico, country: 'CO' }));
  await assert.rejects(readProductionDiscovery('MX', context), /wallet_production_unavailable/);
  t.mock.method(globalThis, 'fetch', async () => Response.json({ ...options, sourceCurrencyCode: 'USD' }));
  await assert.rejects(readProductionOptions('MX', 'MXN', context), /wallet_production_unavailable/);
  assert.equal(walletProductionDiscovery({ ...mexico, defaultCurrencyCode: 'COP' }, 'MX'), null);
  assert.equal(walletProductionOptions({ ...options, routes: [] }).routes.length, 0);
});

test('options reject malformed route members and sandbox or foreign-currency responses without throwing', () => {
  for (const patch of [{ environment: 'sandbox' }, { routes: [null] },
    { routes: [{ ...options.routes[0], serviceProvider: 'BINANCECONNECT' }] },
    { routes: [{ ...options.routes[0], paymentMethods: [null] }] },
    { routes: [{ ...options.routes[0], paymentMethods: [{ ...options.routes[0].paymentMethods[0], currencyCode: 'USD' }] }] },
    { routes: [{ ...options.routes[0], paymentMethods: [{ ...options.routes[0].paymentMethods[0], maximumAmount: 999 }] }] }]) {
    assert.equal(walletProductionOptions({ ...options, ...patch }), null);
  }
});

test('a production quote is an estimate pinned to the requested amount, source and linked USDT Polygon destination', async t => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (path, init) => { calls.push({ path, init }); return Response.json(quote); });
  assert.deepEqual(await quoteProductionFunding(input, address, context), quote);
  assert.equal(calls.length, 1); assert.equal(calls[0].path, `${base}/quote`);
  assert.equal(calls[0].init.method, 'POST'); assert.deepEqual(JSON.parse(calls[0].init.body), input);
  assert.equal(calls[0].init.headers['x-mindbliss-wallet-subject'], encodeURIComponent(ownerSubject));
  assert.equal(calls[0].init.headers['content-type'], 'application/json');
  assert.equal(quote.confirmation, undefined);
  assert.equal(walletProductionQuote(quote, input, otherAddress), null);
  for (const patch of [{ walletKind: 'administrative' }, { environment: 'sandbox' }, { country: 'MX' },
    { sourceCurrencyCode: 'MXN' }, { requestedAmount: 100 }, { paymentMethodType: 'APPLE_PAY' },
    { destination: { ...destination, address: otherAddress } }, { destination: { ...destination, asset: 'USDC' } },
    { destination: { ...destination, network: 'ethereum', chainId: 1 } }, { quotes: [] }, { quotes: [null] }]) {
    assert.equal(walletProductionQuote({ ...quote, ...patch }, input, address), null);
  }
  for (const patch of [{ serviceProvider: 'BINANCECONNECT' }, { sourceAmount: 51 }, { sourceCurrencyCode: 'MXN' },
    { destinationCurrencyCode: 'USDT_ETHEREUM' }, { destinationAmount: 0 }, { totalFee: -1 }, { networkFee: Infinity }]) {
    assert.equal(walletProductionQuote({ ...quote, quotes: [{ ...quoteItem, ...patch }] }, input, address), null);
  }
});

test('crossed production quote responses fail after one request and never create a checkout automatically', async t => {
  let calls = 0;
  for (const patch of [{ country: 'CO' }, { sourceCurrencyCode: 'COP' }, { requestedAmount: 100 },
    { paymentMethodType: 'GOOGLE_PAY' }, { destination: { ...destination, address: otherAddress } }]) {
    t.mock.method(globalThis, 'fetch', async (path, init) => {
      calls++; assert.equal(path, `${base}/quote`); assert.equal(init.method, 'POST'); return Response.json({ ...quote, ...patch });
    });
    await assert.rejects(quoteProductionFunding(input, address, context), /wallet_production_unavailable/);
  }
  assert.equal(calls, 5);
});

test('checkout accepts only a correlated production snapshot and submits no writable destination or environment', async t => {
  let request;
  t.mock.method(globalThis, 'fetch', async (path, init) => { request = { path, init }; return Response.json(ack); });
  assert.deepEqual(await createProductionFunding(sessionInput, address, context), ack);
  assert.equal(request.path, `${base}/session`); assert.equal(request.init.method, 'POST');
  assert.deepEqual(JSON.parse(request.init.body), sessionInput);
  assert.equal(walletProductionAcknowledgement(ack, sessionInput).checkoutUrl, checkoutUrl);
  for (const patch of [{ checkoutReference: otherReference }, { country: 'MX' }, { requestedAmount: 100 },
    { sourceCurrencyCode: 'MXN' }, { paymentMethodType: 'APPLE_PAY' }, { serviceProvider: 'BANXA' },
    { walletKind: 'administrative' }, { environment: 'sandbox' }, { destinationCurrencyCode: 'USDT_ETHEREUM' },
    { destination: { ...destination, chainId: 1 } }, { status: 'confirmed' }]) {
    assert.equal(walletProductionAcknowledgement({ ...ack, ...patch }, sessionInput), null);
  }
});

test('a foreign checkout destination is rejected after one manual session request without a retry', async t => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; return Response.json({ ...ack, destination: { ...destination, address: otherAddress } }); });
  await assert.rejects(createProductionFunding(sessionInput, address, context), /wallet_production_unavailable/);
  assert.equal(calls, 1);
});

test('checkout URLs allow only exact production MELD or Banxa contracts, excluding retired providers and query injection', () => {
  for (const url of [checkoutUrl, 'https://meldcrypto.com/?token=synthetic_token', 'https://meldcrypto.com/?wt=synthetic_token']) {
    assert.equal(walletProductionCheckoutUrl(url), url);
  }
  for (const url of ['https://sb.meldcrypto.com/?token=synthetic', 'https://global-stg.transak.com/?apiKey=x&sessionId=y',
    'https://meldcrypto.com.evil.example/?token=x', 'http://meldcrypto.com/?token=x', 'https://user@meldcrypto.com/?token=x',
    'https://meldcrypto.com/?token=x#success', 'https://meldcrypto.com/?token=x&redirect=https://evil.example',
    'https://meldcrypto.com/?token=x&token=y', 'https://global.transak.com/?apiKey=x&sessionId=y&redirect=https://evil.example',
    'https://global.transak.com/?apiKey=x&apiKey=z&sessionId=y', 'https://global.transak.com/?apiKey=x&sessionId=y&sessionId=z',
    'https://global.transak.com:443/?apiKey=x&sessionId=y', 'https://global.transak.com/?apiKey=x&sessionId=y#success']) {
    assert.equal(walletProductionCheckoutUrl(url), null, url);
    assert.equal(walletProductionAcknowledgement({ ...ack, checkoutUrl: url }, sessionInput), null, url);
  }
});

test('production history and status never reinterpret sandbox evidence as settled production funds', async t => {
  t.mock.method(globalThis, 'fetch', async path => Response.json(path.includes('/status?') ? status : history));
  assert.equal((await readProductionStatus(reference, context)).confirmation.state, 'unconfirmed');
  assert.equal((await readProductionHistory(context)).settlement, 'unconfirmed');
  assert.equal(walletProductionStatus({ ...status, environment: 'sandbox' }), null);
  assert.equal(walletProductionStatus({ ...status, confirmation: { state: 'confirmed', source: 'meld_sandbox_api', testMode: true,
    receivedAmount: 50, transactionId: 'synthetic', confirmedAt: ack.createdAt } }), null);
  assert.equal(walletProductionHistory({ ...history, environment: 'sandbox' }), null);
  const crossed = clone(status); crossed.checkoutReference = otherReference;
  t.mock.method(globalThis, 'fetch', async () => Response.json(crossed));
  await assert.rejects(readProductionStatus(reference, context), /wallet_production_unavailable/);
});

test('provider failures, non-JSON and oversized responses never trigger automatic retries', async t => {
  const responses = [() => Response.json({ error: 'wallet_production_quote_unavailable' }, { status: 503 }),
    () => Response.json({ error: 'Private provider diagnostic: synthetic secret' }, { status: 503 }),
    () => new Response('<html>upstream unavailable</html>', { status: 502 }),
    () => new Response(' '.repeat(131073), { status: 200 })];
  let calls = 0;
  for (const response of responses) {
    t.mock.method(globalThis, 'fetch', async () => { calls++; return response(); });
    await assert.rejects(quoteProductionFunding(input, address, context), failure =>
      failure.message === 'wallet_production_quote_unavailable' || failure.message === 'wallet_production_unavailable');
  }
  assert.equal(calls, responses.length);
});

test('cancellation before dispatch and during response parsing never hands off or retries checkout', async t => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; return Response.json(ack); });
  const before = new AbortController(); before.abort();
  await assert.rejects(createProductionFunding(sessionInput, address, { ...context, signal: before.signal }), { name: 'AbortError' });
  assert.equal(calls, 0);
  const during = new AbortController();
  t.mock.method(globalThis, 'fetch', async () => {
    calls++; return { ok: true, text: async () => { during.abort(); return JSON.stringify(ack); } };
  });
  await assert.rejects(createProductionFunding(sessionInput, address, { ...context, signal: during.signal }), { name: 'AbortError' });
  assert.equal(calls, 1);
});

test('Mexico EUR card accepts only Alchemy Pay with the exact Arbitrum USDC destination and an opaque MELD checkout', () => {
  const route = { country: 'MX', sourceCurrencyCode: 'EUR', paymentMethodType: 'CREDIT_DEBIT_CARD' };
  const request = { ...sessionInput, ...route, serviceProvider: 'ALCHEMYPAY' };
  const arbDestination = { address, asset: 'USDC', network: 'arbitrum', chainId: 42161 };
  const destinationCurrencyCode = 'USDC_ARBITRUM';
  const card = { method: 'CREDIT_DEBIT_CARD', currencyCode: 'EUR', minimumAmount: 100, maximumAmount: 5000 };
  const merchant = { serviceProvider: 'ALCHEMYPAY', paymentMethods: [card] };
  const offer = { ...options, country: 'MX', sourceCurrencyCode: 'EUR', destinationCurrencyCode, routes: [merchant] };
  const price = { ...quote, ...route, destination: arbDestination, quotes: [{ ...quoteItem, serviceProvider: 'ALCHEMYPAY', sourceCurrencyCode: 'EUR', destinationCurrencyCode }] };
  const session = { ...ack, ...route, serviceProvider: 'ALCHEMYPAY', destinationCurrencyCode, destination: arbDestination };
  assert.equal(walletProductionOptions(offer).destinationCurrencyCode, destinationCurrencyCode);
  assert.deepEqual(walletProductionQuote(price, request, address).destination, arbDestination);
  assert.equal(walletProductionQuote(price, request, otherAddress), null);
  assert.deepEqual(walletProductionAcknowledgement(session, request).destination, arbDestination);
  assert.deepEqual(walletProductionHistory({ ...history, records: [ack, { ...session, checkoutReference: otherReference }] }).records.map(item => item.destination.network), ['polygon', 'arbitrum']);
  assert.deepEqual(walletProductionStatus({ ...status, ...session }).destination, arbDestination);
  assert.equal(walletProductionStatus({ ...status, ...session, destinationCurrencyCode: 'USDC_POLYGON' }), null);
  for (const unexpected of [{ country: 'US' }, { routes: [{ ...merchant, serviceProvider: 'BANXA' }] },
    { sourceCurrencyCode: 'MXN', routes: [{ ...merchant, paymentMethods: [{ ...card, currencyCode: 'MXN' }] }] },
    { routes: [{ ...merchant, paymentMethods: [{ ...card, method: 'APPLE_PAY' }] }] }]) {
    assert.equal(walletProductionOptions({ ...offer, ...unexpected }), null);
  }
  for (const unexpected of [{ country: 'US' }, { sourceCurrencyCode: 'MXN' }, { paymentMethodType: 'APPLE_PAY' },
    { destination: { ...arbDestination, network: 'polygon', chainId: 137 } }, { destination: { ...arbDestination, chainId: 137 } }]) {
    assert.equal(walletProductionQuote({ ...price, ...unexpected }, undefined, address), null);
    assert.equal(walletProductionAcknowledgement({ ...session, ...unexpected }, undefined), null);
  }
  assert.equal(walletProductionAcknowledgement({ ...session, destinationCurrencyCode: 'USDC_POLYGON' }, request), null);
  assert.equal(walletProductionAcknowledgement({ ...session, checkoutUrl: 'https://meldcrypto.com/?wt=synthetic' }, request), null);
  assert.equal(walletProductionAcknowledgement({ ...session, checkoutUrl: 'https://ramp.alchemypay.org/?token=synthetic' }, request), null);
});

test('RampNow preserves the quoted chain and accepts only a settled native USDC change to the same wallet', () => {
  const networks = [
    ['USDC_POLYGON', { address, asset: 'USDC', network: 'polygon', chainId: 137 }],
    ['USDC_ARBITRUM', { address, asset: 'USDC', network: 'arbitrum', chainId: 42161 }],
    ['USDC', { address, asset: 'USDC', network: 'ethereum', chainId: 1 }],
  ];
  const priced = { ...quote, destination: networks[0][1], quotes: [{ ...quoteItem, serviceProvider: 'RAMPNOW', destinationCurrencyCode: 'USDC_POLYGON' }] };
  for (const [destinationCurrencyCode, requestedDestination] of networks) {
    const selection = { ...sessionInput, destinationCurrencyCode, serviceProvider: 'RAMPNOW' };
    const price = { ...priced, destination: requestedDestination, quotes: [{ ...priced.quotes[0], destinationCurrencyCode }] };
    const session = { ...ack, destinationCurrencyCode, destination: requestedDestination, serviceProvider: 'RAMPNOW' };
    assert.deepEqual(walletProductionQuote(price, selection, address).destination, requestedDestination);
    assert.deepEqual(walletProductionAcknowledgement(session, selection).destination, requestedDestination);
    assert.equal(walletProductionQuote(price, { ...selection, destinationCurrencyCode: 'USDT_POLYGON' }, address), null);
    assert.equal(walletProductionAcknowledgement(session, { ...selection, destinationCurrencyCode: 'USDT_POLYGON' }), null);
  }
  const [expected, , actual] = networks.map(([, destination]) => destination);
  const confirmation = { state: 'confirmed', source: 'meld_production_api', testMode: false, receivedAmount: '44.123456',
    providerStatus: 'SETTLED', confirmedAt: ack.createdAt, transactionId: 'synthetic-transfer' };
  const settled = { ...status, serviceProvider: 'RAMPNOW', destinationCurrencyCode: 'USDC_POLYGON', destination: expected, confirmedDestination: actual, confirmation };
  assert.deepEqual(walletProductionStatus(settled).confirmedDestination, actual);
  assert.deepEqual(walletProductionStatus(settled).destination, expected);
  assert.deepEqual(walletProductionStatus({ ...settled, confirmedDestination: expected }).confirmedDestination, expected);
  assert.deepEqual(walletProductionHistory({ ...history, records: [settled] }).records[0].confirmedDestination, actual);
  for (const change of [{ serviceProvider: 'ONRAMPMONEY' }, { requestedAmount: 0 }, { country: 'MX' }, { paymentMethodType: 'CASH_APP' },
    { confirmedDestination: undefined }, { confirmedDestination: null },
    { confirmation: { state: 'pending', source: 'meld_production_api', testMode: false } },
    { confirmedDestination: { ...actual, address: otherAddress } }, { confirmedDestination: { ...actual, asset: 'USDT' } },
    { confirmedDestination: { ...actual, chainId: 137 } }, { confirmedDestination: { ...actual, network: 'base', chainId: 8453 } }]) {
    const invalid = { ...settled, ...change };
    assert.equal(walletProductionStatus(invalid), null);
    assert.equal(walletProductionHistory({ ...history, records: [invalid] }), null);
  }
});

test('a US bank quote can offer both providers on Polygon while the checkout preserves destination and method', () => {
  const polygon = { ...destination, asset: 'USDC' };
  const ethereum = { ...polygon, network: 'ethereum', chainId: 1 };
  for (const paymentMethodType of ['ACH', 'LOCAL_BANK_TRANSFER']) {
    const selection = { ...input, paymentMethodType, destinationCurrencyCode: 'USDC_POLYGON' };
    const order = { ...sessionInput, ...selection };
    assert.deepEqual(walletProductionInput(order, true), order);
    const { destinationCurrencyCode: _explicit, ...legacyOrder } = order;
    assert.deepEqual(walletProductionInput(legacyOrder, true), legacyOrder);
    for (const patch of [{ destinationCurrencyCode: 'USDC' }, { paymentMethodType: 'CREDIT_DEBIT_CARD' }, { country: 'MX' }]) {
      assert.equal(walletProductionInput({ ...order, ...patch }, true), null);
    }
    const bankPrice = { ...quote, destination: polygon, paymentMethodType, quotes: ['RAMPNOW', 'ONRAMPMONEY'].map(serviceProvider =>
      ({ ...quoteItem, serviceProvider, destinationCurrencyCode: 'USDC_POLYGON' })) };
    assert.deepEqual(walletProductionQuote(bankPrice, selection, address), bankPrice);
    const ethereumPrice = { ...bankPrice, destination: ethereum, quotes: bankPrice.quotes.map(item => ({ ...item, destinationCurrencyCode: 'USDC' })) };
    assert.equal(walletProductionQuote(ethereumPrice, { ...selection, destinationCurrencyCode: 'USDC' }, address), null);
    const session = { ...ack, paymentMethodType, destination: polygon, destinationCurrencyCode: 'USDC_POLYGON' };
    assert.deepEqual(walletProductionAcknowledgement(session, order), session);
    assert.equal(walletProductionAcknowledgement({ ...session, destination: ethereum, destinationCurrencyCode: 'USDC' }, order), null);
  }
});
