import assert from 'node:assert/strict';
import test from 'node:test';
import { PERSONAL_FUNDING_MINIMUM_MXN, validFundingAmount, validFundingSourceAmount, fundingInput,
  fundingAcknowledgement, fundingHistory, fundingStatus, personalProductionOptions, administrativeSandboxOptions } from './wallet-funding-contract.mjs';
import { createPersonalFundingIntent } from './wallet-funding-client.mjs';
import { handleWalletFunding } from './wallet-funding-bff.mjs';

const reference = 'd8a4c010-cc33-44da-a297-8b3c6440f491';
const address = `0x${'1'.repeat(40)}`;
const createdAt = '2026-11-10T15:00:00Z';
const input = amount => ({ requestId: reference, walletAddress: address, country: 'MX', sourceCurrencyCode: 'MXN', amount, paymentMethodType: 'SPEI' });
const ack = amount => ({ checkoutReference: reference, walletKind: 'personal', environment: 'production', provider: 'reown',
  destinationCurrencyCode: 'USDT_POLYGON', destination: { address, asset: 'USDT', network: 'polygon', chainId: 137 },
  status: 'initiated', requestedAmount: amount, sourceCurrencyCode: 'MXN', paymentMethodType: 'SPEI', allowedProviders: ['SWAPPED'], createdAt });
const options = (minimumAmount, maximumAmount = 100000) => ({ walletKind: 'personal', environment: 'production', provider: 'reown',
  destinationCurrencyCode: 'USDT_POLYGON', network: 'polygon', chainId: 137,
  country: 'MX', sourceCurrencyCode: 'MXN', paymentMethods: ['SPEI'], routes: [{ serviceProvider: 'SWAPPED', paymentMethods: [
    { method: 'SPEI', currencyCode: 'MXN', minimumAmount, maximumAmount }] }] });

test('new personal requests and acknowledgements use fixed 931 MXN while USD and administrative minima stay separate', () => {
  assert.equal(PERSONAL_FUNDING_MINIMUM_MXN, 931);
  for (const amount of [0, 148.66, 930.99, 931.001, '931', NaN, Infinity]) {
    assert.equal(validFundingSourceAmount(amount, 'personal', 'MXN'), false);
    assert.equal(fundingInput(input(amount), 'personal'), null);
    assert.equal(fundingAcknowledgement(ack(amount), 'personal'), null);
  }
  assert.equal(validFundingSourceAmount(931, 'personal', 'MXN'), true);
  assert.ok(fundingInput(input(931), 'personal'));
  assert.equal(fundingAcknowledgement(ack(931), 'personal').requestedAmount, 931);
  assert.equal(validFundingAmount(20), false);
  assert.equal(validFundingAmount(100), true);
  assert.equal(validFundingAmount(19.99), false);
  assert.equal(validFundingAmount(49.99, 'administrative'), false);
  assert.equal(validFundingAmount(50, 'administrative'), true);
});

test('historical 148.66 MXN requests remain readable without being relabelled as dollars or authorized as new attempts', () => {
  const record = { checkoutReference: reference, requestedAmount: 148.66, sourceCurrencyCode: 'MXN', paymentMethodType: 'SPEI',
    country: 'MX', status: 'initiated', provider: 'reown', createdAt };
  const history = fundingHistory({ walletKind: 'personal', environment: 'production', settlement: 'unconfirmed', records: [record] }, 'personal');
  assert.equal(history.records[0].requestedAmount, 148.66);
  assert.equal(history.records[0].sourceCurrencyCode, 'MXN');
  const status = fundingStatus({ ...ack(148.66), country: 'MX', requestStatus: 'initiated',
    destination: { address, asset: 'USDT', network: 'polygon', chainId: 137 },
    confirmation: { state: 'unconfirmed', source: 'none', testMode: false } }, 'personal');
  assert.equal(status.requestedAmount, 148.66);
  assert.equal(status.sourceCurrencyCode, 'MXN');
  assert.equal(status.confirmation.state, 'unconfirmed');
  assert.equal(fundingAcknowledgement(ack(148.66), 'personal'), null);
});

test('stale route metadata cannot lower 931, higher provider minima remain intact and impossible routes are omitted', () => {
  assert.equal(personalProductionOptions(options(148.66)).routes[0].paymentMethods[0].minimumAmount, 931);
  assert.equal(personalProductionOptions(options(1200)).routes[0].paymentMethods[0].minimumAmount, 1200);
  assert.deepEqual(personalProductionOptions(options(148.66, 930)).routes, []);
  assert.deepEqual(personalProductionOptions(options(148.66, 930)).paymentMethods, []);
  const administrative = { ...options(150), walletKind: 'administrative', environment: 'sandbox', provider: 'meld',
    serviceProvider: 'TRANSAK', routes: [{ ...options(150).routes[0], serviceProvider: 'TRANSAK' }] };
  assert.equal(administrativeSandboxOptions(administrative).routes[0].paymentMethods[0].minimumAmount, 150);
});

test('below-floor MXN attempts are rejected before browser transport or authenticated private forwarding', async () => {
  const original = globalThis.fetch;
  const env = { AUTH_PROVIDER: 'better-auth', AUTH_BFF_SHARED_SECRET: 's'.repeat(32), AUTH_PUBLIC_ORIGIN: 'https://app.example.test',
    BETTER_AUTH_BACKEND_URL: 'https://auth.core.internal', NODE_ENV: 'production' };
  try {
    globalThis.fetch = async () => assert.fail('below-floor amount reached transport');
    await assert.rejects(createPersonalFundingIntent(input(930.99)), { message: 'invalid_request' });
    const request = new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/member/wallet-funding/personal/intent`, { method: 'POST',
      headers: { cookie: 'better-auth.session_token=synthetic', origin: env.AUTH_PUBLIC_ORIGIN, 'sec-fetch-site': 'same-origin', 'content-type': 'application/json', 'x-mindbliss-wallet-network': 'polygon' },
      body: JSON.stringify(input(930.99)) });
    const response = await handleWalletFunding(request, 'personal', { env, serviceRequest: async () => assert.fail('below-floor amount reached private backend') });
    assert.equal(response.status, 400);
    globalThis.fetch = async (_path, init) => { assert.deepEqual(JSON.parse(init.body), input(931)); return Response.json(ack(931)); };
    assert.equal((await createPersonalFundingIntent(input(931))).sourceCurrencyCode, 'MXN');
  } finally { globalThis.fetch = original; }
});
