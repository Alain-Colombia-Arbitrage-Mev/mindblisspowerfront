import assert from 'node:assert/strict';
import test from 'node:test';
import { personalProductionOptions, fundingAcknowledgement, fundingHistory, fundingStatus, fundingSourceSupported } from './wallet-funding-contract.mjs';
import { readPersonalFundingOptions, createPersonalFundingIntent } from './wallet-funding-client.mjs';
import { buildReownProductionOnrampUrl } from './reown-production-onramp.mjs';
import { handleWalletFunding } from './wallet-funding-bff.mjs';

const requestId = 'd8a4c010-cc33-44da-a297-8b3c6440f491';
const address = `0x${'1'.repeat(40)}`;
const destination = { address, asset: 'USDT', network: 'polygon', chainId: 137 };
const method = { method: 'PSE', currencyCode: 'COP', minimumAmount: 74321.5, maximumAmount: 1000000 };
const options = { walletKind: 'personal', environment: 'production', provider: 'reown', country: 'CO', sourceCurrencyCode: 'COP',
  destinationCurrencyCode: 'USDT_POLYGON', network: 'polygon', chainId: 137, paymentMethods: ['PSE'],
  routes: [{ serviceProvider: 'ONRAMPMONEY', paymentMethods: [method] }] };
const input = { requestId, walletAddress: address, country: 'CO', amount: 100000, sourceCurrencyCode: 'COP', paymentMethodType: 'PSE' };
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
  for (const change of [{ country: 'US' }, { country: 'MX' }, { sourceCurrencyCode: 'USD' }, { sourceCurrencyCode: 'MXN' },
    { network: 'ethereum', chainId: 1 }, { environment: 'sandbox' },
    { routes: [{ serviceProvider: 'SWAPPED', paymentMethods: [method] }] }]) {
    assert.equal(personalProductionOptions({ ...options, ...change }), null);
  }
  const forbidden = { ...method, method: 'LOCAL_BANK_TRANSFER' };
  assert.deepEqual(personalProductionOptions({ ...options, paymentMethods: ['PSE', forbidden.method], routes: [
    { serviceProvider: 'ONRAMPMONEY', paymentMethods: [method, forbidden] }] }), options);
  assert.deepEqual(personalProductionOptions({ ...options, paymentMethods: [], routes: [] }).paymentMethods, []);
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
  for (const patch of [{ country: 'MX' }, { paymentMethodType: 'SPEI' }, { requestedAmount: 0 },
    { destination: { ...destination, network: 'ethereum', chainId: 1 } }, { destination: undefined }]) {
    assert.equal(fundingHistory({ ...history, records: [{ ...record, ...patch }] }, 'personal'), null);
    assert.equal(fundingStatus({ ...status, ...patch }, 'personal'), null);
  }
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
  for (const [key, expected] of Object.entries({ countryCode: 'CO', sourceCurrencyCode: 'COP', sourceAmount: '100000',
    paymentMethodType: 'PSE', destinationCurrencyCode: 'USDT_POLYGON', walletAddress: address })) {
    assert.equal(url.searchParams.get(key), expected); assert.equal(url.searchParams.get(`${key}Locked`), expected);
  }
  assert.equal(url.searchParams.has('serviceProvider'), false);
  assert.equal(url.searchParams.has('serviceProviders'), false);
  for (const patch of [{ countryCode: 'MX' }, { sourceCurrencyCode: 'USD' }, { paymentMethodType: 'SPEI' }, { allowedProviders: ['MERCURYO'] }]) {
    assert.throws(() => buildReownProductionOnrampUrl({ ...context, ...patch }));
  }
});
