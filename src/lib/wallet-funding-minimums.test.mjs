import assert from 'node:assert/strict';
import test from 'node:test';
import { validFundingAmount, fundingInput, fundingAcknowledgement, fundingHistory, fundingStatus,
  personalProductionOptions, PERSONAL_FUNDING_MINIMUM_USD, ADMINISTRATIVE_FUNDING_MINIMUM_USD } from './wallet-funding-contract.mjs';
import { createPersonalFundingIntent } from './wallet-funding-client.mjs';
import { buildReownProductionOnrampUrl } from './reown-production-onramp.mjs';

const reference = 'd8a4c010-cc33-44da-a297-8b3c6440f491';
const address = `0x${'1'.repeat(40)}`;
const createdAt = '2026-11-10T15:00:00.000Z';
const identity = kind => ({ walletKind: kind, environment: kind === 'personal' ? 'production' : 'sandbox', provider: kind === 'personal' ? 'reown' : 'meld' });
const input = (kind, amount) => ({ requestId: reference, walletAddress: address, country: 'US', amount, paymentMethodType: 'CREDIT_DEBIT_CARD',
  ...(kind === 'administrative' ? { serviceProvider: 'TRANSAK' } : {}) });
const ack = (kind, amount) => ({ ...identity(kind), checkoutReference: reference, requestedAmount: amount, createdAt,
  status: kind === 'personal' ? 'initiated' : 'session_created', ...(kind === 'personal'
    ? { paymentMethodType: 'CREDIT_DEBIT_CARD', allowedProviders: ['SWAPPED'] }
    : { checkoutUrl: 'https://sb.meldcrypto.com/?token=synthetic' }) });

test('the personal USD floor is 20 while the administrative floor stays 50 with exact cent validation', () => {
  assert.equal(PERSONAL_FUNDING_MINIMUM_USD, 20);
  assert.equal(ADMINISTRATIVE_FUNDING_MINIMUM_USD, 50);
  assert.equal(validFundingAmount(19.99), false);
  assert.equal(validFundingAmount(20), true);
  assert.equal(validFundingAmount(49.99), true);
  assert.equal(validFundingAmount(49.99, 'administrative'), false);
  assert.equal(validFundingAmount(50, 'administrative'), true);
  for (const kind of ['personal', 'administrative']) {
    for (const value of ['50', 20.001, Infinity, NaN, 25000.01]) assert.equal(validFundingAmount(value, kind), false);
    assert.equal(validFundingAmount(25000, kind), true);
  }
  assert.equal(validFundingAmount(100, 'unknown'), false);
  assert.ok(fundingInput(input('personal', 20), 'personal'));
  assert.equal(fundingInput(input('personal', 19.99), 'personal'), null);
  assert.ok(fundingInput(input('administrative', 50), 'administrative'));
  assert.equal(fundingInput(input('administrative', 49.99), 'administrative'), null);
});

test('acknowledgements, immutable status and history apply their own wallet floor without changing settlement', () => {
  for (const [kind, minimum] of [['personal', 20], ['administrative', 50]]) {
    const status = { ...identity(kind), checkoutReference: reference, requestedAmount: minimum, country: 'US',
      requestStatus: kind === 'personal' ? 'initiated' : 'session_created',
      destination: { address, asset: 'USDT', network: 'polygon', chainId: 137 },
      confirmation: { state: 'unconfirmed', source: 'none', testMode: kind === 'administrative' } };
    const history = { walletKind: kind, environment: status.environment, settlement: 'unconfirmed', records: [
      { checkoutReference: reference, requestedAmount: minimum, country: 'US', status: status.requestStatus, createdAt, provider: status.provider }] };
    assert.equal(fundingAcknowledgement(ack(kind, minimum), kind).requestedAmount, minimum);
    assert.equal(fundingStatus(status, kind).requestedAmount, minimum);
    assert.equal(fundingHistory(history, kind).records[0].requestedAmount, minimum);
    assert.equal(fundingAcknowledgement(ack(kind, minimum - 0.01), kind), null);
    assert.equal(fundingStatus({ ...status, requestedAmount: minimum - 0.01 }, kind), null);
    assert.equal(fundingHistory({ ...history, records: [{ ...history.records[0], requestedAmount: minimum - 0.01 }] }, kind), null);
    assert.equal(fundingStatus(status, kind).confirmation.state, 'unconfirmed');
  }
  const legacy = { walletKind: 'personal', environment: 'production', settlement: 'unconfirmed', records: [
    { checkoutReference: reference, requestedAmount: 50, country: 'CO', status: 'initiated', createdAt,
      provider: 'reown', serviceProvider: 'TOPPER', paymentMethodType: 'SKRILL' }] };
  assert.equal(fundingHistory(legacy, 'personal').records.length, 1);
  assert.equal(fundingHistory(legacy, 'personal').records[0].country, 'CO');
});

test('Swapped and Mercuryo keep independent route limits instead of sharing the lowest provider minimum', () => {
  const route = (serviceProvider, minimumAmount) => ({ serviceProvider, paymentMethods: [
    { method: 'CREDIT_DEBIT_CARD', currencyCode: 'USD', minimumAmount, maximumAmount: 10000, minimumUsd: minimumAmount, maximumUsd: 10000 }] });
  const discovery = { ...identity('personal'), country: 'MX', sourceCurrencyCode: 'USD', paymentMethods: ['CREDIT_DEBIT_CARD'],
    routes: [route('SWAPPED', 7.81), route('MERCURYO', 28.04)] };
  const parsed = personalProductionOptions(discovery);
  assert.deepEqual(parsed.routes, discovery.routes);
  assert.deepEqual(parsed.routes.filter(route => route.paymentMethods.some(method => 20 >= method.minimumAmount && 20 <= method.maximumAmount))
    .map(route => route.serviceProvider), ['SWAPPED']);
  assert.equal(personalProductionOptions({ ...discovery, routes: [route('TOPPER', 10)] }), null);
});

test('a 20 USD native request retains the backend eligible-provider echo and does not authorize retired providers', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async (path, init) => {
      assert.equal(path, '/api/member/wallet-funding/personal/intent');
      assert.equal(JSON.parse(init.body).amount, 20);
      return Response.json(ack('personal', 20));
    };
    const result = await createPersonalFundingIntent(input('personal', 20));
    assert.deepEqual(result.allowedProviders, ['SWAPPED']);
    assert.equal(result.requestedAmount, 20);
    globalThis.fetch = async () => Response.json({ ...ack('personal', 20), allowedProviders: ['TOPPER'] });
    await assert.rejects(createPersonalFundingIntent(input('personal', 20)), { message: 'funding_unavailable' });
  } finally { globalThis.fetch = original; }
});

test('production handoff supports the smaller personal amount without pretending URL parameters select a provider', () => {
  const projectId = 'a'.repeat(32);
  const context = { providerUrl: `https://meldcrypto.com/?publicKey=public&externalCustomerId=${projectId}&serviceProvider=MERCURYO&serviceProviders=SWAPPED,MERCURYO`,
    projectId, address, checkoutReference: reference, countryCode: 'US', sourceCurrencyCode: 'USD', amount: 20,
    paymentMethodType: 'CREDIT_DEBIT_CARD', allowedProviders: ['SWAPPED'] };
  const url = new URL(buildReownProductionOnrampUrl(context));
  assert.equal(url.searchParams.get('sourceAmountLocked'), '20');
  assert.equal(url.searchParams.get('walletAddressLocked'), address);
  assert.equal(url.searchParams.has('serviceProvider'), false);
  assert.equal(url.searchParams.has('serviceProviders'), false);
  assert.throws(() => buildReownProductionOnrampUrl({ ...context, amount: 19.99 }), { message: 'reown_context_invalid' });
  assert.throws(() => buildReownProductionOnrampUrl({ ...context, allowedProviders: ['TOPPER'] }), { message: 'reown_context_invalid' });
  assert.ok(buildReownProductionOnrampUrl({ ...context, amount: 28.04, allowedProviders: ['MERCURYO'] }));
});
