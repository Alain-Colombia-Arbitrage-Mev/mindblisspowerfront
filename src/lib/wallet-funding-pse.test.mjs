import assert from 'node:assert/strict';
import test from 'node:test';
import { personalProductionOptions, fundingAcknowledgement, fundingHistory, fundingStatus, fundingSourceSupported, validFundingSourceAmount } from './wallet-funding-contract.mjs';
import { readPersonalFundingOptions, createPersonalFundingIntent } from './wallet-funding-client.mjs';
import { buildReownProductionOnrampUrl } from './reown-production-onramp.mjs';
import { handleWalletFunding } from './wallet-funding-bff.mjs';

const reference = 'd8a4c010-cc33-44da-a297-8b3c6440f491';
const address = `0x${'1'.repeat(40)}`;
const destination = { address, asset: 'USDT', network: 'polygon', chainId: 137 };
const env = { AUTH_PROVIDER: 'better-auth', AUTH_BFF_SHARED_SECRET: 's'.repeat(32), AUTH_PUBLIC_ORIGIN: 'https://app.example.test',
  BETTER_AUTH_BACKEND_URL: 'https://auth.core.internal', NODE_ENV: 'production' };
const post = body => new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/member/wallet-funding/personal/intent`, { method: 'POST',
  headers: { cookie: 'better-auth.session_token=synthetic', origin: env.AUTH_PUBLIC_ORIGIN, 'x-mindbliss-wallet-network': 'polygon',
    'content-type': 'application/json', 'sec-fetch-site': 'same-origin' }, body: JSON.stringify(body) });

test('new Colombia COP routes, writes, acknowledgements and checkout URLs are disabled before transport', async t => {
  t.mock.method(globalThis, 'fetch', () => assert.fail('Disabled COP reached browser transport'));
  for (const paymentMethodType of ['PSE', 'LOCAL_BANK_TRANSFER']) {
    const options = { walletKind: 'personal', environment: 'production', provider: 'reown', country: 'CO', sourceCurrencyCode: 'COP',
      destinationCurrencyCode: 'USDT_POLYGON', network: 'polygon', chainId: 137, paymentMethods: [paymentMethodType],
      routes: [{ serviceProvider: 'ONRAMPMONEY', paymentMethods: [{ method: paymentMethodType, currencyCode: 'COP', minimumAmount: 170000, maximumAmount: 4000000 }] }] };
    assert.equal(personalProductionOptions(options), null);
    await assert.rejects(readPersonalFundingOptions('CO', { sourceCurrencyCode: 'COP' }), { message: 'invalid_request' });
    const query = new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/member/wallet-funding/personal/options?country=CO&sourceCurrencyCode=COP`, { headers: { cookie: 'better-auth.session_token=synthetic' } });
    assert.equal((await handleWalletFunding(query, 'personal-options', { env, serviceRequest: () => assert.fail('Disabled COP discovery reached core') })).status, 400);
    for (const amount of [42300, 100000, 170000, 500000, 4000000]) {
      const body = { requestId: reference, walletAddress: address, country: 'CO', amount, sourceCurrencyCode: 'COP', paymentMethodType };
      assert.equal(validFundingSourceAmount(amount, 'personal', 'COP'), false);
      assert.equal(fundingSourceSupported(body, 'personal'), false);
      await assert.rejects(createPersonalFundingIntent(body), { message: 'invalid_request' });
      assert.equal((await handleWalletFunding(post(body), 'personal', { env, serviceRequest: () => assert.fail('Disabled COP intent reached core') })).status, 400);
      assert.equal(fundingAcknowledgement({ checkoutReference: reference, walletKind: 'personal', environment: 'production', provider: 'reown', status: 'initiated',
        requestedAmount: amount, sourceCurrencyCode: 'COP', paymentMethodType, allowedProviders: ['ONRAMPMONEY'], destinationCurrencyCode: 'USDT_POLYGON', destination,
        createdAt: '2026-11-12T12:00:00Z' }, 'personal', 'CO'), null);
      const projectId = 'a'.repeat(32);
      assert.throws(() => buildReownProductionOnrampUrl({ providerUrl: `https://meldcrypto.com/?publicKey=synthetic&externalCustomerId=${projectId}`,
        address, projectId, checkoutReference: reference, countryCode: 'CO', sourceCurrencyCode: 'COP', amount, paymentMethodType, allowedProviders: ['ONRAMPMONEY'] }),
      { message: 'wallet_funding_valuation_unavailable' });
    }
  }
});

test('existing personal COP PSE and local-bank requests retain their actual amounts, network and unconfirmed status', () => {
  for (const paymentMethodType of ['PSE', 'LOCAL_BANK_TRANSFER']) for (const requestedAmount of [42300, 100000, 500000]) {
    const record = { checkoutReference: reference, requestedAmount, country: 'CO', sourceCurrencyCode: 'COP', paymentMethodType,
      provider: 'reown', status: 'initiated', destination, createdAt: '2026-11-12T12:00:00Z' };
    const history = { walletKind: 'personal', environment: 'production', settlement: 'unconfirmed', records: [record] };
    const status = { checkoutReference: reference, walletKind: 'personal', environment: 'production', provider: 'reown', requestedAmount,
      country: 'CO', sourceCurrencyCode: 'COP', paymentMethodType, requestStatus: 'initiated', destination,
      confirmation: { state: 'unconfirmed', source: 'none', testMode: false } };
    assert.deepEqual(fundingHistory(history, 'personal'), history);
    assert.deepEqual(fundingStatus(status, 'personal'), status);
    for (const patch of [{ country: 'MX' }, { paymentMethodType: 'CREDIT_DEBIT_CARD' }, { destination: { ...destination, network: 'ethereum', chainId: 1 } }, { destination: undefined }]) {
      assert.equal(fundingHistory({ ...history, records: [{ ...record, ...patch }] }, 'personal'), null);
      assert.equal(fundingStatus({ ...status, ...patch }, 'personal'), null);
    }
  }
});

test('new Colombia dollar methods use only Swapped cards and mobile wallets without Binance, Topper or Mercuryo', () => {
  const methods = ['CREDIT_DEBIT_CARD', 'APPLE_PAY', 'GOOGLE_PAY'];
  const options = { walletKind: 'personal', environment: 'production', provider: 'reown', country: 'CO', sourceCurrencyCode: 'USD',
    destinationCurrencyCode: 'USDT_POLYGON', network: 'polygon', chainId: 137, paymentMethods: methods,
    routes: [{ serviceProvider: 'SWAPPED', paymentMethods: methods.map(method => ({ method, currencyCode: 'USD', minimumAmount: 50, maximumAmount: 15000, minimumUsd: 50, maximumUsd: 15000 })) }] };
  assert.deepEqual(personalProductionOptions(options), options);
  for (const serviceProvider of ['TOPPER', 'MERCURYO', 'BINANCECONNECT', 'ONRAMPMONEY']) assert.equal(personalProductionOptions({ ...options,
    routes: [{ ...options.routes[0], serviceProvider }] }), null);
  for (const paymentMethodType of ['PSE', 'LOCAL_BANK_TRANSFER', 'SPEI', 'PAYPAL', 'VENMO', 'CASH']) {
    assert.equal(fundingSourceSupported({ country: 'CO', sourceCurrencyCode: 'USD', paymentMethodType }, 'personal'), false);
    const extra = { ...options.routes[0].paymentMethods[0], method: paymentMethodType };
    assert.deepEqual(personalProductionOptions({ ...options, paymentMethods: [...methods, paymentMethodType], routes: [{ serviceProvider: 'SWAPPED', paymentMethods: [...options.routes[0].paymentMethods, extra] }] }), options);
  }
});
