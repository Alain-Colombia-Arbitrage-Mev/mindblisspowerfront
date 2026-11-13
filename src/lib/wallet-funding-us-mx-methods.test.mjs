import assert from 'node:assert/strict';
import test from 'node:test';
import { personalProductionOptions, fundingAcknowledgement, fundingHistory, fundingStatus, fundingSourceSupported } from './wallet-funding-contract.mjs';
import { readPersonalFundingOptions, createPersonalFundingIntent } from './wallet-funding-client.mjs';
import { buildReownProductionOnrampUrl } from './reown-production-onramp.mjs';
import { handleWalletFunding } from './wallet-funding-bff.mjs';

const requestId = 'd8a4c010-cc33-44da-a297-8b3c6440f491';
const address = `0x${'1'.repeat(40)}`;
const destination = { address, asset: 'USDT', network: 'polygon', chainId: 137 };
const method = (name, currencyCode = 'USD', minimumAmount = 50) => ({ method: name, currencyCode, minimumAmount, maximumAmount: 15000,
  ...(currencyCode === 'USD' ? { minimumUsd: minimumAmount, maximumUsd: 15000 } : {}) });
const input = (country, sourceCurrencyCode, paymentMethodType, amount = 100) => ({ requestId, walletAddress: address, country, sourceCurrencyCode, paymentMethodType, amount });
const ack = (body, allowedProviders) => ({ checkoutReference: requestId, walletKind: 'personal', environment: 'production', provider: 'reown', status: 'initiated',
  requestedAmount: body.amount, sourceCurrencyCode: body.sourceCurrencyCode, paymentMethodType: body.paymentMethodType,
  allowedProviders, destinationCurrencyCode: 'USDT_POLYGON', destination, createdAt: '2026-11-12T12:00:00Z' });
const usOptions = { walletKind: 'personal', environment: 'production', provider: 'reown', country: 'US', sourceCurrencyCode: 'USD',
  destinationCurrencyCode: 'USDT_POLYGON', network: 'polygon', chainId: 137,
  paymentMethods: ['CREDIT_DEBIT_CARD', 'APPLE_PAY', 'GOOGLE_PAY', 'VENMO', 'PAYPAL'],
  routes: ['SWAPPED', 'MERCURYO', 'TOPPER'].map(serviceProvider => ({ serviceProvider,
    paymentMethods: ['CREDIT_DEBIT_CARD', 'APPLE_PAY', 'GOOGLE_PAY', ...(serviceProvider === 'TOPPER' ? ['VENMO', 'PAYPAL'] : [])].map(name => method(name)) })) };
const env = { AUTH_PROVIDER: 'better-auth', AUTH_BFF_SHARED_SECRET: 's'.repeat(32),
  AUTH_PUBLIC_ORIGIN: 'https://app.example.test', BETTER_AUTH_BACKEND_URL: 'https://auth.core.internal', NODE_ENV: 'production' };
const post = body => new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/member/wallet-funding/personal/intent`, {
  method: 'POST', headers: { cookie: 'better-auth.session_token=synthetic', origin: env.AUTH_PUBLIC_ORIGIN,
    'x-mindbliss-wallet-network': 'polygon', 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' }, body: JSON.stringify(body),
});

test('US dollar options admit three real providers while Topper and Venmo stay scoped to US/USD and both wallet methods remain scoped', () => {
  assert.deepEqual(personalProductionOptions(usOptions), usOptions);
  for (const country of ['CO', 'MX']) assert.equal(personalProductionOptions({ ...usOptions, country }), null);
  assert.equal(personalProductionOptions({ ...usOptions, sourceCurrencyCode: 'MXN' }), null);
  const swappedVenmo = { ...usOptions, routes: usOptions.routes.map(route => route.serviceProvider === 'SWAPPED'
    ? { ...route, paymentMethods: [...route.paymentMethods, method('VENMO')] } : route) };
  assert.deepEqual(personalProductionOptions(swappedVenmo), usOptions);
  const cash = { ...usOptions, paymentMethods: [...usOptions.paymentMethods, 'CASH'], routes: usOptions.routes.map(route => route.serviceProvider === 'TOPPER'
    ? { ...route, paymentMethods: [...route.paymentMethods, method('CASH')] } : route) };
  assert.deepEqual(personalProductionOptions(cash), usOptions);
});

test('Topper acknowledgements require the request residence rather than trusting an unscoped success payload', () => {
  const card = input('US', 'USD', 'CREDIT_DEBIT_CARD');
  const three = ack(card, ['SWAPPED', 'MERCURYO', 'TOPPER']);
  assert.deepEqual(fundingAcknowledgement(three, 'personal', 'US'), three);
  for (const country of ['', 'CO', 'MX']) assert.equal(fundingAcknowledgement(three, 'personal', country), null);
  const venmo = ack(input('US', 'USD', 'VENMO'), ['TOPPER']);
  assert.deepEqual(fundingAcknowledgement(venmo, 'personal', 'US'), venmo);
  for (const allowedProviders of [['MERCURYO'], ['SWAPPED'], ['TOPPER', 'SWAPPED']]) assert.equal(fundingAcknowledgement({ ...venmo, allowedProviders }, 'personal', 'US'), null);
  for (const country of ['CO', 'MX']) assert.equal(fundingSourceSupported(input(country, 'USD', 'VENMO'), 'personal'), false);
  assert.equal(fundingAcknowledgement(ack(input('US', 'USD', 'CASH'), ['TOPPER']), 'personal', 'US'), null);
});

test('PayPal uses only Topper US/USD with contextual acknowledgements, Polygon history and locked checkout', async t => {
  const body = input('US', 'USD', 'PAYPAL');
  const response = ack(body, ['TOPPER']);
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (_path, init) => { calls.push(init); return Response.json(response); });
  assert.deepEqual(await createPersonalFundingIntent(body), response);
  assert.equal((await handleWalletFunding(post(body), 'personal', { env, serviceRequest: async () => ({ ok: true, data: response }) })).status, 200);
  assert.equal(fundingAcknowledgement(response, 'personal'), null);
  assert.deepEqual(fundingAcknowledgement(response, 'personal', 'US'), response);
  for (const country of ['CO', 'MX']) {
    assert.equal(fundingAcknowledgement(response, 'personal', country), null);
    await assert.rejects(createPersonalFundingIntent({ ...body, country }), { message: 'wallet_funding_valuation_unavailable' });
  }
  for (const sourceCurrencyCode of ['MXN', 'COP']) assert.equal(fundingSourceSupported({ ...body, sourceCurrencyCode }, 'personal'), false);
  assert.equal(calls.length, 1);
  const projectId = 'a'.repeat(32);
  const url = new URL(buildReownProductionOnrampUrl({ providerUrl: `https://meldcrypto.com/?publicKey=synthetic&externalCustomerId=${projectId}`,
    projectId, address, checkoutReference: requestId, countryCode: 'US', sourceCurrencyCode: 'USD', amount: 100, paymentMethodType: 'PAYPAL', allowedProviders: ['TOPPER'] }));
  assert.equal(url.searchParams.get('paymentMethodTypeLocked'), 'PAYPAL');
  const status = { ...response, country: 'US', requestStatus: 'initiated', confirmation: { state: 'unconfirmed', source: 'none', testMode: false } };
  assert.equal(fundingStatus(status, 'personal').paymentMethodType, 'PAYPAL');
  for (const patch of [{ country: 'CO' }, { country: 'MX' }, { destination: { ...destination, network: 'ethereum', chainId: 1 } }]) assert.equal(fundingStatus({ ...status, ...patch }, 'personal'), null);
});

test('browser and BFF validate three-provider and Venmo acknowledgements against the exact outgoing country', async t => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async (_url, init) => { calls++; return Response.json(ack(JSON.parse(init.body), ['SWAPPED', 'MERCURYO', 'TOPPER'])); });
  const body = input('US', 'USD', 'CREDIT_DEBIT_CARD');
  assert.deepEqual(await createPersonalFundingIntent(body), ack(body, ['SWAPPED', 'MERCURYO', 'TOPPER']));
  assert.equal((await handleWalletFunding(post(body), 'personal', { env, serviceRequest: async () => ({ ok: true, data: ack(body, ['SWAPPED', 'MERCURYO', 'TOPPER']) }) })).status, 200);
  for (const country of ['CO', 'MX']) {
    await assert.rejects(createPersonalFundingIntent({ ...body, country }), { message: 'funding_unavailable' });
    assert.equal((await handleWalletFunding(post({ ...body, country }), 'personal', { env,
      serviceRequest: async () => ({ ok: true, data: ack(body, ['SWAPPED', 'MERCURYO', 'TOPPER']) }) })).status, 502);
  }
  const before = calls;
  for (const country of ['CO', 'MX']) await assert.rejects(createPersonalFundingIntent(input(country, 'USD', 'VENMO')), { message: 'wallet_funding_valuation_unavailable' });
  assert.equal(calls, before);
});

test('MXN discovery and writes preserve all four canonical methods and the 931 MXN business floor', async t => {
  const methods = ['SPEI', 'CREDIT_DEBIT_CARD', 'APPLE_PAY', 'GOOGLE_PAY'];
  const options = { ...usOptions, country: 'MX', sourceCurrencyCode: 'MXN', paymentMethods: methods,
    routes: [{ serviceProvider: 'SWAPPED', paymentMethods: methods.map(name => method(name, 'MXN', 931)) }] };
  assert.deepEqual(personalProductionOptions(options), options);
  const sent = [];
  t.mock.method(globalThis, 'fetch', async (_url, init) => {
    if (init.method === 'GET') return Response.json(options);
    const body = JSON.parse(init.body); sent.push(body); return Response.json(ack(body, ['SWAPPED']));
  });
  assert.deepEqual(await readPersonalFundingOptions('MX', { sourceCurrencyCode: 'MXN' }), options);
  for (const paymentMethodType of methods) {
    const body = input('MX', 'MXN', paymentMethodType, 931);
    assert.equal((await createPersonalFundingIntent(body)).sourceCurrencyCode, 'MXN');
    await assert.rejects(createPersonalFundingIntent({ ...body, amount: 930.99 }), { message: 'invalid_request' });
  }
  assert.equal(sent.length, 4);
  assert.ok(sent.every(body => body.amount === 931 && body.sourceCurrencyCode === 'MXN' && body.country === 'MX'));
});

test('new MXN card and mobile-wallet history stays on Polygon while legacy SPEI history remains readable', () => {
  for (const paymentMethodType of ['CREDIT_DEBIT_CARD', 'APPLE_PAY', 'GOOGLE_PAY']) {
    const body = input('MX', 'MXN', paymentMethodType, 931);
    const record = { checkoutReference: requestId, requestedAmount: 931, sourceCurrencyCode: 'MXN', paymentMethodType,
      country: 'MX', status: 'initiated', provider: 'reown', createdAt: '2026-11-12T12:00:00Z', destination };
    const history = { walletKind: 'personal', environment: 'production', settlement: 'unconfirmed', records: [record] };
    const status = { ...ack(body, ['SWAPPED']), country: 'MX', requestStatus: 'initiated',
      confirmation: { state: 'unconfirmed', source: 'none', testMode: false } };
    assert.equal(fundingHistory(history, 'personal').records[0].sourceCurrencyCode, 'MXN');
    assert.equal(fundingStatus(status, 'personal').sourceCurrencyCode, 'MXN');
    for (const badDestination of [undefined, { ...destination, network: 'ethereum', chainId: 1 }]) {
      assert.equal(fundingHistory({ ...history, records: [{ ...record, destination: badDestination }] }, 'personal'), null);
      assert.equal(fundingStatus({ ...status, destination: badDestination }, 'personal'), null);
    }
    assert.equal(fundingStatus({ ...status, paymentMethodType: 'SPEI', destination: { ...destination, network: 'ethereum', chainId: 1 } }, 'personal').sourceCurrencyCode, 'MXN');
  }
});

test('Venmo history and status require US dollars on Polygon, not a legacy Ethereum route', () => {
  const record = { checkoutReference: requestId, requestedAmount: 100, sourceCurrencyCode: 'USD', paymentMethodType: 'VENMO',
    country: 'US', status: 'initiated', provider: 'reown', createdAt: '2026-11-12T12:00:00Z', destination };
  const history = { walletKind: 'personal', environment: 'production', settlement: 'unconfirmed', records: [record] };
  const status = { ...ack(input('US', 'USD', 'VENMO'), ['TOPPER']), country: 'US', requestStatus: 'initiated',
    confirmation: { state: 'unconfirmed', source: 'none', testMode: false } };
  assert.equal(fundingHistory(history, 'personal').records[0].paymentMethodType, 'VENMO');
  assert.equal(fundingStatus(status, 'personal').paymentMethodType, 'VENMO');
  for (const patch of [{ country: 'CO' }, { country: 'MX' }, { sourceCurrencyCode: 'MXN' },
    { destination: { ...destination, network: 'ethereum', chainId: 1 } }, { destination: undefined }]) {
    assert.equal(fundingHistory({ ...history, records: [{ ...record, ...patch }] }, 'personal'), null);
    assert.equal(fundingStatus({ ...status, ...patch }, 'personal'), null);
  }
});

test('checkout locks retain US Venmo, three-provider USD cards, and MXN cards without crossing countries or currencies', () => {
  const projectId = 'a'.repeat(32);
  const base = { providerUrl: `https://meldcrypto.com/?publicKey=synthetic&externalCustomerId=${projectId}`, address,
    projectId, checkoutReference: requestId, countryCode: 'US', sourceCurrencyCode: 'USD', amount: 100,
    paymentMethodType: 'VENMO', allowedProviders: ['TOPPER'] };
  const venmo = new URL(buildReownProductionOnrampUrl(base));
  assert.equal(venmo.searchParams.get('paymentMethodTypeLocked'), 'VENMO');
  assert.equal(venmo.searchParams.get('countryCodeLocked'), 'US');
  for (const countryCode of ['CO', 'MX']) assert.throws(() => buildReownProductionOnrampUrl({ ...base, countryCode }));
  assert.throws(() => buildReownProductionOnrampUrl({ ...base, allowedProviders: ['SWAPPED'] }));
  assert.throws(() => buildReownProductionOnrampUrl({ ...base, paymentMethodType: 'CASH' }));
  assert.ok(buildReownProductionOnrampUrl({ ...base, paymentMethodType: 'CREDIT_DEBIT_CARD', allowedProviders: ['SWAPPED', 'MERCURYO', 'TOPPER'] }));
  for (const paymentMethodType of ['CREDIT_DEBIT_CARD', 'APPLE_PAY', 'GOOGLE_PAY']) {
    const url = new URL(buildReownProductionOnrampUrl({ ...base, countryCode: 'MX', sourceCurrencyCode: 'MXN', amount: 931, paymentMethodType, allowedProviders: ['SWAPPED', 'MERCURYO'] }));
    assert.equal(url.searchParams.get('sourceCurrencyCodeLocked'), 'MXN');
    assert.equal(url.searchParams.get('sourceAmountLocked'), '931');
    assert.equal(url.searchParams.get('paymentMethodTypeLocked'), paymentMethodType);
    assert.equal(url.searchParams.get('destinationCurrencyCodeLocked'), 'USDT_POLYGON');
  }
});
