import assert from 'node:assert/strict';
import test from 'node:test';
import { personalProductionOptions, fundingAcknowledgement, fundingHistory, fundingStatus, fundingSourceSupported, validFundingSourceAmount } from './wallet-funding-contract.mjs';
import { readPersonalFundingOptions, createPersonalFundingIntent } from './wallet-funding-client.mjs';
import { buildReownProductionOnrampUrl } from './reown-production-onramp.mjs';
import { handleWalletFunding } from './wallet-funding-bff.mjs';

const requestId = 'd8a4c010-cc33-44da-a297-8b3c6440f491';
const address = `0x${'1'.repeat(40)}`;
const destination = { address, asset: 'USDT', network: 'polygon', chainId: 137 };
const method = { method: 'PSE', currencyCode: 'COP', minimumAmount: 170000, maximumAmount: 4000000 };
const options = { walletKind: 'personal', environment: 'production', provider: 'reown', country: 'CO', sourceCurrencyCode: 'COP',
  destinationCurrencyCode: 'USDT_POLYGON', network: 'polygon', chainId: 137, paymentMethods: ['PSE'],
  routes: [{ serviceProvider: 'ONRAMPMONEY', paymentMethods: [method] }] };
const input = { requestId, walletAddress: address, country: 'CO', amount: 200000, sourceCurrencyCode: 'COP', paymentMethodType: 'PSE' };
const acknowledgement = { checkoutReference: requestId, walletKind: 'personal', environment: 'production', provider: 'reown',
  status: 'initiated', requestedAmount: input.amount, sourceCurrencyCode: 'COP', paymentMethodType: 'PSE',
  allowedProviders: ['ONRAMPMONEY'], destinationCurrencyCode: 'USDT_POLYGON', destination, createdAt: '2026-11-12T12:00:00Z' };
const env = { AUTH_PROVIDER: 'better-auth', AUTH_BFF_SHARED_SECRET: 's'.repeat(32),
  AUTH_PUBLIC_ORIGIN: 'https://app.example.test', BETTER_AUTH_BACKEND_URL: 'https://auth.core.internal', NODE_ENV: 'production' };
const post = body => new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/member/wallet-funding/personal/intent`, {
  method: 'POST', headers: { cookie: 'better-auth.session_token=synthetic', origin: env.AUTH_PUBLIC_ORIGIN,
    'x-mindbliss-wallet-network': 'polygon', 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' }, body: JSON.stringify(body),
});

test('PSE discovery keeps provider COP limits and admits Onramp Money only for Colombia COP', () => {
  assert.deepEqual(personalProductionOptions(options), options);
  assert.deepEqual(personalProductionOptions({ ...options, routes: [{ serviceProvider: 'ONRAMPMONEY', paymentMethods: [
    { ...method, minimumAmount: 42300, maximumAmount: 59900000 }] }] }), options);
  assert.deepEqual(personalProductionOptions({ ...options, paymentMethods: ['PSE'], routes: [{ serviceProvider: 'ONRAMPMONEY', paymentMethods: [
    { ...method, minimumAmount: 250000, maximumAmount: 500000 }] }] }).routes[0].paymentMethods[0], { ...method, minimumAmount: 250000, maximumAmount: 500000 });
  for (const change of [{ country: 'US' }, { country: 'MX' }, { sourceCurrencyCode: 'USD' }, { sourceCurrencyCode: 'MXN' },
    { network: 'ethereum', chainId: 1 }, { environment: 'sandbox' },
    { routes: [{ serviceProvider: 'SWAPPED', paymentMethods: [method] }] }]) {
    assert.equal(personalProductionOptions({ ...options, ...change }), null);
  }
  const forbidden = { ...method, method: 'BRE_B' };
  assert.deepEqual(personalProductionOptions({ ...options, paymentMethods: ['PSE', forbidden.method], routes: [
    { serviceProvider: 'ONRAMPMONEY', paymentMethods: [method, forbidden] }] }), options);
  assert.deepEqual(personalProductionOptions({ ...options, paymentMethods: [], routes: [] }).paymentMethods, []);
  const local = { ...method, method: 'LOCAL_BANK_TRANSFER' };
  const both = { ...options, paymentMethods: ['PSE', 'LOCAL_BANK_TRANSFER'], routes: [{ serviceProvider: 'ONRAMPMONEY', paymentMethods: [method, local] }] };
  assert.deepEqual(personalProductionOptions(both), both);
  for (const paymentMethodType of both.paymentMethods) {
    assert.equal(fundingSourceSupported({ ...input, paymentMethodType }, 'personal'), true);
    assert.ok(fundingAcknowledgement({ ...acknowledgement, paymentMethodType }, 'personal'));
    assert.equal(fundingSourceSupported({ ...input, sourceCurrencyCode: 'USD', paymentMethodType }, 'personal'), false);
  }
  assert.equal(fundingSourceSupported({ ...input, country: 'MX', sourceCurrencyCode: 'USD', paymentMethodType: 'SPEI' }, 'personal'), false);
});

test('PSE acknowledgement and history preserve COP, ownership destination, and unconfirmed settlement', () => {
  assert.deepEqual(fundingAcknowledgement(acknowledgement, 'personal'), acknowledgement);
  for (const patch of [{ sourceCurrencyCode: 'USD' }, { sourceCurrencyCode: undefined }, { paymentMethodType: 'SPEI' },
    { allowedProviders: ['SWAPPED'] }, { allowedProviders: ['ONRAMPMONEY', 'MERCURYO'] },
    { destination: { ...destination, network: 'ethereum', chainId: 1 } }]) {
    assert.equal(fundingAcknowledgement({ ...acknowledgement, ...patch }, 'personal'), null);
  }
  const record = { checkoutReference: requestId, requestedAmount: input.amount, country: 'CO', sourceCurrencyCode: 'COP',
    paymentMethodType: 'PSE', provider: 'reown', status: 'initiated', destination, createdAt: acknowledgement.createdAt };
  const history = { walletKind: 'personal', environment: 'production', settlement: 'unconfirmed', records: [record] };
  const status = { checkoutReference: requestId, walletKind: 'personal', environment: 'production', provider: 'reown',
    requestedAmount: input.amount, country: 'CO', sourceCurrencyCode: 'COP', paymentMethodType: 'PSE', requestStatus: 'initiated', destination,
    confirmation: { state: 'unconfirmed', source: 'none', testMode: false } };
  assert.deepEqual(fundingHistory(history, 'personal'), history);
  assert.deepEqual(fundingStatus(status, 'personal'), status);
  for (const requestedAmount of [42300, 100000]) {
    assert.equal(fundingHistory({ ...history, records: [{ ...record, requestedAmount }] }, 'personal').records[0].requestedAmount, requestedAmount);
    assert.equal(fundingStatus({ ...status, requestedAmount }, 'personal').requestedAmount, requestedAmount);
    assert.equal(fundingAcknowledgement({ ...acknowledgement, requestedAmount }, 'personal'), null, 'New acknowledgements respect the new floor');
  }
  for (const patch of [{ country: 'MX' }, { paymentMethodType: 'SPEI' }, { requestedAmount: 0 },
    { destination: { ...destination, network: 'ethereum', chainId: 1 } }, { destination: undefined }]) {
    assert.equal(fundingHistory({ ...history, records: [{ ...record, ...patch }] }, 'personal'), null);
    assert.equal(fundingStatus({ ...status, ...patch }, 'personal'), null);
  }
});

test('new COP requests reject below-business-minimum and over-cap amounts before either transport', async t => {
  t.mock.method(globalThis, 'fetch', () => assert.fail('Invalid COP amount reached the browser transport'));
  for (const amount of [42300, 100000, 169999.99, 4000000.01, 0, -1, Infinity, 170000.001]) {
    await assert.rejects(createPersonalFundingIntent({ ...input, amount }), { message: 'invalid_request' });
    assert.equal((await handleWalletFunding(post({ ...input, amount }), 'personal', { env,
      serviceRequest: () => assert.fail('Invalid COP amount reached the core') })).status, 400);
  }
  assert.equal(validFundingSourceAmount(170000, 'personal', 'COP'), true);
  assert.equal(validFundingSourceAmount(4000000, 'personal', 'COP'), true);
});

test('PSE browser and BFF transmit actual COP amounts once and reject crossed source contexts before transport', async t => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (path, init) => {
    calls.push({ path, init });
    if (init.method === 'GET') return Response.json(options);
    assert.deepEqual(JSON.parse(init.body), input);
    return Response.json(acknowledgement);
  });
  assert.deepEqual(await readPersonalFundingOptions('CO', { sourceCurrencyCode: 'COP' }), options);
  assert.equal(calls[0].path, '/api/member/wallet-funding/personal/options?country=CO&sourceCurrencyCode=COP');
  assert.deepEqual(await createPersonalFundingIntent(input), acknowledgement);
  assert.equal(calls.length, 2);
  const result = await handleWalletFunding(post(input), 'personal', { env, serviceRequest: async (url, init) => {
    assert.equal(url, 'https://auth.core.internal/api/member/wallet-funding/personal/intent');
    assert.deepEqual(JSON.parse(init.body), input);
    return { ok: true, data: acknowledgement };
  } });
  assert.equal(result.status, 200); assert.deepEqual(await result.json(), acknowledgement);
  for (const patch of [{ country: 'MX' }, { country: 'US' }, { sourceCurrencyCode: 'USD', amount: 100 }, { paymentMethodType: 'CREDIT_DEBIT_CARD' }, { paymentMethodType: 'SPEI' }]) {
    assert.equal(fundingSourceSupported({ ...input, ...patch }, 'personal'), false);
    await assert.rejects(createPersonalFundingIntent({ ...input, ...patch }), { message: 'wallet_funding_valuation_unavailable' });
    assert.equal((await handleWalletFunding(post({ ...input, ...patch }), 'personal', { env,
      serviceRequest: async () => assert.fail('Crossed PSE context reached the backend') })).status, 503);
  }
  assert.equal(calls.length, 2);
});

test('PSE checkout locks Colombia, COP, exact amount, PSE and the verified Polygon destination', () => {
  const projectId = 'a'.repeat(32);
  const context = { providerUrl: `https://meldcrypto.com/?publicKey=synthetic&externalCustomerId=${projectId}`, address,
    projectId, checkoutReference: requestId, countryCode: 'CO', sourceCurrencyCode: 'COP', amount: input.amount,
    paymentMethodType: 'PSE', allowedProviders: ['ONRAMPMONEY'] };
  const url = new URL(buildReownProductionOnrampUrl(context));
  for (const [key, expected] of Object.entries({ countryCode: 'CO', sourceCurrencyCode: 'COP', sourceAmount: '200000',
    paymentMethodType: 'PSE', destinationCurrencyCode: 'USDT_POLYGON', walletAddress: address })) {
    assert.equal(url.searchParams.get(key), expected); assert.equal(url.searchParams.get(`${key}Locked`), expected);
  }
  assert.equal(url.searchParams.has('serviceProvider'), false);
  assert.equal(url.searchParams.has('serviceProviders'), false);
  for (const patch of [{ countryCode: 'MX' }, { sourceCurrencyCode: 'USD' }, { paymentMethodType: 'SPEI' }, { allowedProviders: ['MERCURYO'] }]) {
    assert.throws(() => buildReownProductionOnrampUrl({ ...context, ...patch }));
  }
  const bank = new URL(buildReownProductionOnrampUrl({ ...context, paymentMethodType: 'LOCAL_BANK_TRANSFER' }));
  assert.equal(bank.searchParams.get('paymentMethodTypeLocked'), 'LOCAL_BANK_TRANSFER');
  assert.equal(bank.searchParams.get('sourceCurrencyCodeLocked'), 'COP');
  assert.equal(bank.searchParams.get('countryCodeLocked'), 'CO');
});
