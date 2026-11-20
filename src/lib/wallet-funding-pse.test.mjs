import assert from 'node:assert/strict';
import test from 'node:test';
import { personalProductionOptions, fundingAcknowledgement, fundingHistory, fundingStatus, fundingSourceSupported, validFundingSourceAmount } from './wallet-funding-contract.mjs';
import { readPersonalFundingOptions, createPersonalFundingIntent } from './wallet-funding-client.mjs';
import { buildReownProductionOnrampUrl } from './reown-production-onramp.mjs';
import { handleWalletFunding } from './wallet-funding-bff.mjs';
import { appMeldFundingOptions } from './app-meld-funding-contract.mjs';

const reference = 'd8a4c010-cc33-44da-a297-8b3c6440f491';
const address = `0x${'1'.repeat(40)}`;
const destination = { address, asset: 'USDT', network: 'polygon', chainId: 137 };
const env = { AUTH_PROVIDER: 'better-auth', AUTH_BFF_SHARED_SECRET: 's'.repeat(32), AUTH_PUBLIC_ORIGIN: 'https://app.example.test',
  BETTER_AUTH_BACKEND_URL: 'https://auth.core.internal', NODE_ENV: 'production' };
const post = body => new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/member/wallet-funding/personal/intent`, { method: 'POST',
  headers: { cookie: 'better-auth.session_token=synthetic', origin: env.AUTH_PUBLIC_ORIGIN, 'x-mindbliss-wallet-network': 'polygon', 'x-mindbliss-funding-provider': 'meld',
    'cf-connecting-ip': '198.51.100.10', 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' }, body: JSON.stringify(body) });

test('MELD COP discovery and checkout preserve PSE or bank, the COP amount and linked USDC Polygon destination', async t => {
  const paymentMethods = ['PSE', 'LOCAL_BANK_TRANSFER'];
  const context = { walletKind: 'personal', environment: 'production', provider: 'meld', country: 'CO', sourceCurrencyCode: 'COP',
    destinationCurrencyCode: 'USDC_POLYGON' };
  const target = { destinationCurrencyCode: 'USDC_POLYGON', network: 'polygon', chainId: 137 };
  const options = { ...context, ...target, paymentMethods, routes: [{ ...target, serviceProvider: 'ONRAMPMONEY',
    paymentMethods: paymentMethods.map(method => ({ method, currencyCode: 'COP', minimumAmount: 42300, maximumAmount: 59900000 })) }] };
  const lookup = '/api/member/wallet-funding/personal/options?country=CO&sourceCurrencyCode=COP';
  const query = new Request(`${env.AUTH_PUBLIC_ORIGIN}${lookup}`, { headers: { cookie: 'better-auth.session_token=synthetic' } });
  const session = body => ({ ...context, checkoutReference: body.requestId, status: 'session_created', serviceProvider: body.serviceProvider,
    requestedAmount: body.amount, paymentMethodType: body.paymentMethodType, destination: { ...destination, asset: 'USDC' },
    checkoutUrl: 'https://meldcrypto.com/?token=synthetic', createdAt: '2026-11-12T12:00:00Z' });
  const sent = [];
  t.mock.method(globalThis, 'fetch', (path, init) => {
    if (init.method === 'GET') { assert.equal(path, lookup); return Response.json(options); }
    assert.equal(path, '/api/member/wallet-funding/personal/intent');
    const body = JSON.parse(init.body); sent.push(body);
    return Response.json(session(body));
  });
  const transport = async (url, init) => {
    if (url.endsWith(lookup)) return { ok: true, data: options };
    assert.equal(url, 'https://auth.core.internal/api/member/wallet-funding/personal/intent');
    const body = JSON.parse(init.body); sent.push(body);
    return { ok: true, data: session(body) };
  };
  assert.deepEqual(await readPersonalFundingOptions('CO', { sourceCurrencyCode: 'COP' }), options);
  assert.deepEqual(await (await handleWalletFunding(query, 'personal-options', { env, serviceRequest: transport })).json(), options);
  for (const paymentMethodType of paymentMethods) for (const amount of [42300, 42300.5, 59900000]) {
    const body = { requestId: reference, walletAddress: address, country: 'CO', amount, sourceCurrencyCode: 'COP', paymentMethodType,
      serviceProvider: 'ONRAMPMONEY', destinationCurrencyCode: 'USDC_POLYGON' };
    assert.deepEqual(await createPersonalFundingIntent(body), session(body));
    assert.deepEqual(await (await handleWalletFunding(post(body), 'personal', { env, serviceRequest: transport })).json(), session(body));
    assert.deepEqual(sent.splice(0), [body, body]);
  }
  assert.equal(appMeldFundingOptions({ ...options, destinationCurrencyCode: 'USDT_POLYGON' }), null);
  assert.equal(appMeldFundingOptions({ ...options, routes: [{ ...options.routes[0], serviceProvider: 'BANXA' }] }), null);
});

test('COP checkout blocks out-of-range amounts and fractional centavos and unapproved method, provider or asset before transport', async t => {
  const never = () => assert.fail('Rejected COP checkout reached transport');
  t.mock.method(globalThis, 'fetch', never);
  const body = { requestId: reference, walletAddress: address, country: 'CO', amount: 170000, sourceCurrencyCode: 'COP',
    paymentMethodType: 'PSE', serviceProvider: 'ONRAMPMONEY', destinationCurrencyCode: 'USDC_POLYGON' };
  for (const [changes, error] of [
    [{ amount: 42299.99 }, 'invalid_request'], [{ amount: 42300.001 }, 'invalid_request'], [{ amount: 59900000.01 }, 'invalid_request'],
    [{ sourceCurrencyCode: 'USD' }, 'invalid_request'], [{ destinationCurrencyCode: 'USDT_POLYGON' }, 'wallet_funding_method_unavailable'],
    [{ paymentMethodType: 'CREDIT_DEBIT_CARD' }, 'wallet_funding_method_unavailable'], [{ serviceProvider: 'BANXA' }, 'wallet_funding_method_unavailable'],
  ]) {
    const input = { ...body, ...changes };
    await assert.rejects(createPersonalFundingIntent(input), { message: error });
    const response = await handleWalletFunding(post(input), 'personal', { env, serviceRequest: never });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error });
  }
});

test('legacy Reown COP writes remain unavailable', () => {
  for (const paymentMethodType of ['PSE', 'LOCAL_BANK_TRANSFER']) {
    const amount = 170000, projectId = 'a'.repeat(32);
    assert.equal(validFundingSourceAmount(amount, 'personal', 'COP'), true);
    assert.equal(fundingSourceSupported({ country: 'CO', sourceCurrencyCode: 'COP', paymentMethodType }, 'personal'), false);
    assert.equal(fundingAcknowledgement({ checkoutReference: reference, walletKind: 'personal', environment: 'production', provider: 'reown', status: 'initiated',
      requestedAmount: amount, sourceCurrencyCode: 'COP', paymentMethodType, allowedProviders: ['ONRAMPMONEY'], destinationCurrencyCode: 'USDT_POLYGON', destination,
      createdAt: '2026-11-12T12:00:00Z' }, 'personal', 'CO'), null);
    assert.throws(() => buildReownProductionOnrampUrl({ providerUrl: `https://meldcrypto.com/?publicKey=synthetic&externalCustomerId=${projectId}`,
      address, projectId, checkoutReference: reference, countryCode: 'CO', sourceCurrencyCode: 'COP', amount, paymentMethodType, allowedProviders: ['ONRAMPMONEY'] }),
    { message: 'wallet_funding_valuation_unavailable' });
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

test('legacy Colombia dollar methods retain their Reown validation rules', () => {
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
