import assert from 'node:assert/strict';
import test from 'node:test';
import { personalProductionOptions, fundingAcknowledgement, fundingHistory, fundingStatus, fundingSourceSupported } from './wallet-funding-contract.mjs';
import { readPersonalFundingOptions, createPersonalFundingIntent } from './wallet-funding-client.mjs';
import { buildReownProductionOnrampUrl } from './reown-production-onramp.mjs';
import { handleWalletFunding } from './wallet-funding-bff.mjs';
import { appMeldFundingOptions, appPersonalFundingHistory, appPersonalFundingStatus } from './app-meld-funding-contract.mjs';

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
const post = (body, network = 'polygon') => new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/member/wallet-funding/personal/intent`, {
  method: 'POST', headers: { cookie: 'better-auth.session_token=synthetic', origin: env.AUTH_PUBLIC_ORIGIN,
    'x-mindbliss-wallet-network': network, 'x-mindbliss-funding-provider': 'meld', 'cf-connecting-ip': '198.51.100.5', 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' }, body: JSON.stringify(body),
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

test('historical PayPal uses Topper US/USD with contextual acknowledgements and Polygon history', () => {
  const body = input('US', 'USD', 'PAYPAL');
  const response = ack(body, ['TOPPER']);
  assert.equal(fundingAcknowledgement(response, 'personal'), null);
  assert.deepEqual(fundingAcknowledgement(response, 'personal', 'US'), response);
  for (const country of ['CO', 'MX']) {
    assert.equal(fundingAcknowledgement(response, 'personal', country), null);
  }
  for (const sourceCurrencyCode of ['MXN', 'COP']) assert.equal(fundingSourceSupported({ ...body, sourceCurrencyCode }, 'personal'), false);
  const projectId = 'a'.repeat(32);
  const url = new URL(buildReownProductionOnrampUrl({ providerUrl: `https://meldcrypto.com/?publicKey=synthetic&externalCustomerId=${projectId}`,
    projectId, address, checkoutReference: requestId, countryCode: 'US', sourceCurrencyCode: 'USD', amount: 100, paymentMethodType: 'PAYPAL', allowedProviders: ['TOPPER'] }));
  assert.equal(url.searchParams.get('paymentMethodTypeLocked'), 'PAYPAL');
  const status = { ...response, country: 'US', requestStatus: 'initiated', confirmation: { state: 'unconfirmed', source: 'none', testMode: false } };
  assert.equal(fundingStatus(status, 'personal').paymentMethodType, 'PAYPAL');
  for (const patch of [{ country: 'CO' }, { country: 'MX' }, { destination: { ...destination, network: 'ethereum', chainId: 1 } }]) assert.equal(fundingStatus({ ...status, ...patch }, 'personal'), null);
});

test('US USD uses Mercuryo for card and mobile wallets across three networks and Onramp Money for bank payments on Polygon', async t => {
  const mercuryo = ['CREDIT_DEBIT_CARD', 'APPLE_PAY', 'GOOGLE_PAY'];
  const onrampMoney = ['ACH', 'LOCAL_BANK_TRANSFER'];
  const targets = [
    { destinationCurrencyCode: 'USDC_POLYGON', network: 'polygon', chainId: 137 },
    { destinationCurrencyCode: 'USDC_ARBITRUM', network: 'arbitrum', chainId: 42161 },
    { destinationCurrencyCode: 'USDC', network: 'ethereum', chainId: 1 },
  ];
  const route = (serviceProvider, names, target, maximumAmount) => ({
    serviceProvider, ...target, paymentMethods: names.map(name => ({ method: name, currencyCode: 'USD', minimumAmount: 50,
      maximumAmount: serviceProvider === 'MERCURYO' && name !== 'CREDIT_DEBIT_CARD' ? 2000 : maximumAmount })),
  });
  const options = { ...usOptions, ...targets[0], provider: 'meld', paymentMethods: [...mercuryo, ...onrampMoney],
    routes: [...targets.map(target => route('MERCURYO', mercuryo, target, 16000)), route('ONRAMPMONEY', onrampMoney, targets[0], 25000)] };
  const session = body => {
    const target = targets.find(target => target.destinationCurrencyCode === body.destinationCurrencyCode);
    return { ...ack(body, []), provider: 'meld', status: 'session_created', country: 'US', serviceProvider: body.serviceProvider,
      destinationCurrencyCode: target.destinationCurrencyCode, destination: { address, asset: 'USDC', network: target.network, chainId: target.chainId },
      checkoutUrl: 'https://meldcrypto.com/?token=synthetic' };
  };
  const staleOptions = { ...options, routes: [route('RAMPNOW', [...mercuryo, ...onrampMoney], targets[0], 10000), ...options.routes] };
  let browserBody;
  t.mock.method(globalThis, 'fetch', (url, init) => {
    if (init.method === 'GET') {
      assert.equal(url, '/api/member/wallet-funding/personal/options?country=US&sourceCurrencyCode=USD');
      return Response.json(staleOptions);
    }
    browserBody = JSON.parse(init.body);
    assert.equal(init.headers['x-mindbliss-wallet-network'], session(browserBody).destination.network);
    return Response.json(session(browserBody));
  });
  assert.deepEqual(await readPersonalFundingOptions('US'), options);
  const catalogResponse = await handleWalletFunding(new Request(
    env.AUTH_PUBLIC_ORIGIN + '/api/member/wallet-funding/personal/options?country=US&sourceCurrencyCode=USD',
    { headers: { cookie: 'better-auth.session_token=synthetic', 'x-mindbliss-funding-provider': 'meld' } }), 'personal-options',
  { env, serviceRequest: async () => ({ ok: true, data: staleOptions }) });
  assert.equal(catalogResponse.status, 200);
  assert.deepEqual(await catalogResponse.json(), options);
  for (const route of options.routes) for (const { method: paymentMethodType, maximumAmount } of route.paymentMethods) {
    const body = { ...input('US', 'USD', paymentMethodType), serviceProvider: route.serviceProvider, destinationCurrencyCode: route.destinationCurrencyCode };
    const result = await createPersonalFundingIntent(body);
    assert.equal(result.serviceProvider, body.serviceProvider);
    assert.deepEqual(result.destination, { address, asset: 'USDC', network: route.network, chainId: route.chainId });
    assert.deepEqual(browserBody, body);
    const response = await handleWalletFunding(post(body, route.network), 'personal', { env, serviceRequest: async (_url, init) => {
      assert.deepEqual(JSON.parse(init.body), body);
      return { ok: true, data: session(body) };
    } });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), result);
    const atMaximum = { ...body, amount: maximumAmount };
    assert.equal((await createPersonalFundingIntent(atMaximum)).requestedAmount, maximumAmount);
    const overMaximum = { ...body, amount: Number((maximumAmount + 0.01).toFixed(2)) };
    const error = route.serviceProvider === 'ONRAMPMONEY' ? 'invalid_request' : 'wallet_funding_amount_out_of_range';
    await assert.rejects(createPersonalFundingIntent(overMaximum), { message: error });
    const rejected = await handleWalletFunding(post(overMaximum, route.network), 'personal',
      { env, serviceRequest: () => assert.fail('An amount above the rail limit must not reach the service') });
    assert.equal(rejected.status, 400); assert.deepEqual(await rejected.json(), { error });
  }
  assert.equal(appMeldFundingOptions({ ...options, routes: [...options.routes, { serviceProvider: 'BANXA', paymentMethods: [method('CREDIT_DEBIT_CARD')] }] }), null);
  assert.equal(appMeldFundingOptions({ ...options, paymentMethods: [...mercuryo, ...onrampMoney, 'PAYPAL'] }), null);
  const malformedRoute = { ...options.routes[1], chainId: 137 };
  assert.equal(appMeldFundingOptions({ ...options, routes: [options.routes[0], malformedRoute, ...options.routes.slice(2)] }), null);
});

test('browser and BFF block US methods or destinations missing from the production MELD route contract', async t => {
  const never = () => assert.fail('Unsupported route reached transport');
  t.mock.method(globalThis, 'fetch', never);
  for (const [patch, error] of [
    [{ paymentMethodType: 'VENMO' }, 'wallet_funding_method_unavailable'],
    [{ paymentMethodType: 'PAYPAL' }, 'wallet_funding_method_unavailable'],
    [{ paymentMethodType: 'CASH_APP' }, 'wallet_funding_method_unavailable'],
    [{ serviceProvider: 'BANXA' }, 'wallet_funding_method_unavailable'],
    [{ serviceProvider: 'RAMPNOW' }, 'wallet_funding_method_unavailable'],
    [{ serviceProvider: 'MERCURYO', paymentMethodType: 'ACH' }, 'wallet_funding_method_unavailable'],
    [{ serviceProvider: 'ONRAMPMONEY', paymentMethodType: 'LOCAL_BANK_TRANSFER', destinationCurrencyCode: 'USDC_ARBITRUM' }, 'wallet_funding_method_unavailable'],
    [{ serviceProvider: 'ONRAMPMONEY' }, 'wallet_funding_method_unavailable'],
    [{ destinationCurrencyCode: 'USDT_POLYGON' }, 'wallet_funding_method_unavailable'],
    [{ destinationCurrencyCode: 'UNKNOWN' }, 'invalid_request'],
  ]) {
    const body = { ...input('US', 'USD', 'CREDIT_DEBIT_CARD'), ...patch };
    await assert.rejects(createPersonalFundingIntent(body), { message: error });
    const response = await handleWalletFunding(post(body), 'personal', { env, serviceRequest: never });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error });
  }
});

test('prior RampNow transactions remain readable on their stored USDC network but cannot create a new checkout', () => {
  for (const [code, network, chainId] of [['USDC_POLYGON', 'polygon', 137], ['USDC_ARBITRUM', 'arbitrum', 42161], ['USDC', 'ethereum', 1]]) {
    const body = input('US', 'USD', 'CREDIT_DEBIT_CARD');
    const historical = { ...ack(body, []), provider: 'meld', country: 'US', serviceProvider: 'RAMPNOW',
      destination: { address, asset: 'USDC', network, chainId }, destinationCurrencyCode: code, status: 'session_created' };
    const status = { ...historical, requestStatus: 'session_created', confirmation: { state: 'unconfirmed', source: 'none', testMode: false } };
    assert.deepEqual(appPersonalFundingStatus(status).destination, historical.destination);
    const history = { walletKind: 'personal', environment: 'production', settlement: 'unconfirmed', records: [historical] };
    assert.equal(appPersonalFundingHistory(history).records[0].serviceProvider, 'RAMPNOW');
    assert.deepEqual(appPersonalFundingHistory(history).records[0].destination, historical.destination);
    for (const invalid of [{ country: 'MX' }, { destination: { ...historical.destination, asset: 'USDT' } }]) {
      assert.equal(appPersonalFundingStatus({ ...status, ...invalid }), null);
    }
  }
});

test('MXN discovery uses its exact Polygon USDC provider bounds for SPEI and card', async t => {
  const specifications = [
    ['SPEI', 'ONRAMPMONEY', 200, 500000, 'invalid_request'],
    ['CREDIT_DEBIT_CARD', 'MERCURYO', 520.03, 312013.7, 'wallet_funding_amount_out_of_range'],
  ];
  const checkoutUrl = 'https://meldcrypto.com/?token=synthetic';
  const target = { destinationCurrencyCode: 'USDC_POLYGON', network: 'polygon', chainId: 137 };
  const options = { ...usOptions, ...target, provider: 'meld', country: 'MX', sourceCurrencyCode: 'MXN',
    paymentMethods: specifications.map(([name]) => name),
    routes: specifications.map(([method, serviceProvider, minimumAmount, maximumAmount]) => ({ ...target, serviceProvider,
      paymentMethods: [{ method, currencyCode: 'MXN', minimumAmount, maximumAmount }] })) };
  const sent = [];
  t.mock.method(globalThis, 'fetch', async (_url, init) => {
    if (init.method === 'GET') return Response.json(options);
    const body = JSON.parse(init.body); sent.push(body);
    const [, serviceProvider] = specifications.find(([name]) => name === body.paymentMethodType);
    return Response.json({ ...ack(body, []), provider: 'meld', country: 'MX', serviceProvider,
      destinationCurrencyCode: target.destinationCurrencyCode, destination: { ...destination, asset: 'USDC' }, status: 'session_created', checkoutUrl });
  });
  assert.deepEqual(await readPersonalFundingOptions('MX', { sourceCurrencyCode: 'MXN' }), options);
  for (const [paymentMethodType, serviceProvider, minimumAmount, maximumAmount, belowMinimumError] of specifications) {
    const body = { ...input('MX', 'MXN', paymentMethodType, minimumAmount), serviceProvider, destinationCurrencyCode: target.destinationCurrencyCode };
    const result = await createPersonalFundingIntent(body);
    assert.equal(result.sourceCurrencyCode, 'MXN'); assert.equal(result.destinationCurrencyCode, 'USDC_POLYGON');
    await assert.rejects(createPersonalFundingIntent({ ...body, amount: Number((minimumAmount - 0.01).toFixed(2)) }), { message: belowMinimumError });
    await createPersonalFundingIntent({ ...body, amount: maximumAmount });
    await assert.rejects(createPersonalFundingIntent({ ...body, amount: Number((maximumAmount + 0.01).toFixed(2)) }),
      { message: paymentMethodType === 'SPEI' ? 'invalid_request' : 'wallet_funding_amount_out_of_range' });
  }
  assert.deepEqual(sent.map(body => [body.paymentMethodType, body.amount]), [
    ['SPEI', 200], ['SPEI', 500000], ['CREDIT_DEBIT_CARD', 520.03], ['CREDIT_DEBIT_CARD', 312013.7],
  ]);
  assert.ok(sent.every(body => body.sourceCurrencyCode === 'MXN' && body.country === 'MX'));
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
