import assert from 'node:assert/strict';
import test from 'node:test';
import { personalProductionOptions, administrativeSandboxOptions, fundingAcknowledgement, fundingInput, fundingHistory, fundingStatus,
  PERSONAL_FUNDING_COUNTRIES } from './wallet-funding-contract.mjs';
import { readAdministrativeSandboxOptions, readPersonalFundingOptions, createPersonalFundingIntent, createAdministrativeSandboxSession } from './wallet-funding-client.mjs';
import { handleWalletFunding } from './wallet-funding-bff.mjs';

const env = { AUTH_PROVIDER: 'better-auth', AUTH_BFF_SHARED_SECRET: 's'.repeat(32),
  AUTH_PUBLIC_ORIGIN: 'https://app.example.test', BETTER_AUTH_BACKEND_URL: 'https://auth.core.internal', NODE_ENV: 'production' };
const requestId = 'd8a4c010-cc33-44da-a297-8b3c6440f491';
const input = { requestId, walletAddress: `0x${'1'.repeat(40)}`, country: 'MX', amount: 1000,
  sourceCurrencyCode: 'MXN', paymentMethodType: 'SPEI' };
const options = kind => ({ walletKind: kind, environment: kind === 'personal' ? 'production' : 'sandbox',
  provider: kind === 'personal' ? 'reown' : 'meld', country: 'MX', sourceCurrencyCode: 'MXN',
  ...(kind === 'administrative' ? { serviceProvider: 'TRANSAK' } : {}), paymentMethods: ['SPEI'],
  routes: [{ serviceProvider: kind === 'personal' ? 'SWAPPED' : 'TRANSAK', paymentMethods: [
    { method: 'SPEI', currencyCode: 'MXN', minimumAmount: kind === 'personal' ? 931 : 150, maximumAmount: 100000 }] }] });
const get = query => new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/member/wallet-funding/${query}`,
  { headers: { cookie: 'better-auth.session_token=synthetic' } });
const post = body => new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/member/wallet-funding/personal/intent`, {
  method: 'POST', headers: { cookie: 'better-auth.session_token=synthetic', origin: env.AUTH_PUBLIC_ORIGIN,
    'content-type': 'application/json', 'sec-fetch-site': 'same-origin' }, body: JSON.stringify(body),
});

test('local methods retain their provider currency and never reinterpret USD limits as pesos', () => {
  for (const [kind, parse] of [['personal', personalProductionOptions], ['administrative', administrativeSandboxOptions]]) {
    const valid = options(kind);
    assert.deepEqual(parse(valid), valid);
    const method = valid.routes[0].paymentMethods[0];
    for (const changed of [
      { ...method, currencyCode: 'USD' },
      { method: 'SPEI', minimumUsd: 10, maximumUsd: 10000 },
      { ...method, minimumUsd: 10, maximumUsd: 10000 },
      { ...method, minimumAmount: undefined },
      { ...method, maximumAmount: undefined },
      { ...method, minimumAmount: '150' },
      { ...method, maximumAmount: Infinity },
      { ...method, method: ['SPEI'] },
    ]) {
      assert.equal(parse({ ...valid, routes: [{ ...valid.routes[0], paymentMethods: [changed] }] }), null);
    }
    assert.equal(parse({ ...valid, sourceCurrencyCode: null }), null);
    assert.equal(parse({ ...valid, sourceCurrencyCode: 'mxn' }), null);
  }
});

test('legacy dollar discovery upgrades explicitly to USD and rejects conflicting new limits', () => {
  const legacy = { walletKind: 'personal', environment: 'production', provider: 'reown', country: 'US',
    paymentMethods: ['CREDIT_DEBIT_CARD'], routes: [{ serviceProvider: 'MERCURYO', paymentMethods: [
      { method: 'CREDIT_DEBIT_CARD', minimumUsd: 20, maximumUsd: 10000 }] }] };
  const parsed = personalProductionOptions(legacy);
  assert.equal(parsed.sourceCurrencyCode, 'USD');
  assert.deepEqual(parsed.routes[0].paymentMethods[0], { method: 'CREDIT_DEBIT_CARD', currencyCode: 'USD',
    minimumAmount: 30, maximumAmount: 10000, minimumUsd: 30, maximumUsd: 10000 });
  const method = { ...parsed.routes[0].paymentMethods[0], minimumUsd: 10 };
  assert.equal(personalProductionOptions({ ...parsed, routes: [{ serviceProvider: 'MERCURYO', paymentMethods: [method] }] }), null);
});

test('currency-aware discovery forwards only its exact country, currency and provider context', async () => {
  const original = globalThis.fetch;
  const calls = [];
  try {
    globalThis.fetch = async (path, init) => { calls.push({ path, init }); return Response.json(options('personal')); };
    assert.deepEqual(await readPersonalFundingOptions('MX', { sourceCurrencyCode: 'MXN' }), options('personal'));
    assert.equal(calls[0].path, '/api/member/wallet-funding/personal/options?country=MX&sourceCurrencyCode=MXN');
    globalThis.fetch = async (path, init) => { calls.push({ path, init }); return Response.json(options('administrative')); };
    assert.deepEqual(await readAdministrativeSandboxOptions('MX', 'TRANSAK', { sourceCurrencyCode: 'MXN' }), options('administrative'));
    assert.equal(calls[1].path, '/api/member/wallet-funding/administrative/options?country=MX&sourceCurrencyCode=MXN&serviceProvider=TRANSAK');
    for (const data of [{ ...options('personal'), sourceCurrencyCode: 'USD' },
      { ...options('personal'), country: 'CO' }, options('administrative')]) {
      globalThis.fetch = async () => Response.json(data);
      await assert.rejects(readPersonalFundingOptions('MX', { sourceCurrencyCode: 'MXN' }), { message: 'funding_unavailable' });
    }
    await assert.rejects(readPersonalFundingOptions('MX', { sourceCurrencyCode: 'MXN&country=US' }), { message: 'invalid_request' });
  } finally { globalThis.fetch = original; }
});

test('a superseded currency read cannot publish a late successful response', async () => {
  const original = globalThis.fetch;
  const controller = new AbortController();
  let resolve;
  try {
    globalThis.fetch = () => new Promise(done => { resolve = done; });
    const old = readPersonalFundingOptions('MX', { sourceCurrencyCode: 'MXN', signal: controller.signal });
    controller.abort();
    resolve(Response.json(options('personal')));
    await assert.rejects(old, { name: 'AbortError' });
  } finally { globalThis.fetch = original; }
});

test('SPEI records its actual MXN amount while other local mutations remain unavailable', async () => {
  const original = globalThis.fetch;
  const acknowledgement = { checkoutReference: requestId, walletKind: 'personal', environment: 'production', provider: 'reown',
    status: 'initiated', requestedAmount: input.amount, sourceCurrencyCode: 'MXN', createdAt: '2026-11-10T15:00:00Z',
    paymentMethodType: 'SPEI', allowedProviders: ['SWAPPED'] };
  try {
    globalThis.fetch = async (path, init) => {
      assert.equal(path, '/api/member/wallet-funding/personal/intent');
      assert.deepEqual(JSON.parse(init.body), input);
      return Response.json(acknowledgement);
    };
    assert.deepEqual(await createPersonalFundingIntent(input), acknowledgement);
    const response = await handleWalletFunding(post(input), 'personal', { env, serviceRequest: async (url, init) => {
      assert.equal(url, 'https://auth.core.internal/api/member/wallet-funding/personal/intent');
      assert.deepEqual(JSON.parse(init.body), input);
      return { ok: true, data: acknowledgement };
    } });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), acknowledgement);
    globalThis.fetch = async () => assert.fail('unvalued local amount reached transport');
    await assert.rejects(createAdministrativeSandboxSession({ ...input, serviceProvider: 'TRANSAK' }), { message: 'wallet_funding_valuation_unavailable' });
    for (const [kind, body] of [
      ['personal', { ...input, sourceCurrencyCode: 'COP' }],
      ['personal', { ...input, country: 'US' }],
      ['personal', { ...input, paymentMethodType: 'CREDIT_DEBIT_CARD' }],
      ['administrative', { ...input, serviceProvider: 'TRANSAK' }],
    ]) {
      if (kind === 'personal') await assert.rejects(createPersonalFundingIntent(body), { message: 'wallet_funding_valuation_unavailable' });
      const response = await handleWalletFunding(post(body), kind, { env, serviceRequest: async () => assert.fail('unsupported local mutation forwarded') });
      assert.equal(response.status, 503);
      assert.deepEqual(await response.json(), { error: 'wallet_funding_valuation_unavailable' });
    }
    for (const amount of [19.99, 0, '20', 20.001, 25000.01]) {
      await assert.rejects(createPersonalFundingIntent({ ...input, sourceCurrencyCode: 'USD', amount }), { message: 'invalid_request' });
    }
  } finally { globalThis.fetch = original; }
});

test('SPEI acknowledgement currency cannot be omitted or changed into dollars by an upstream response', async () => {
  const original = globalThis.fetch;
  const acknowledgement = { checkoutReference: requestId, walletKind: 'personal', environment: 'production', provider: 'reown',
    status: 'initiated', requestedAmount: input.amount, createdAt: '2026-11-10T15:00:00Z',
    paymentMethodType: 'SPEI', allowedProviders: ['SWAPPED'] };
  try {
    for (const sourceCurrencyCode of [undefined, 'USD', 'COP', 'mxn']) {
      const data = { ...acknowledgement, ...(sourceCurrencyCode === undefined ? {} : { sourceCurrencyCode }) };
      globalThis.fetch = async () => Response.json(data);
      await assert.rejects(createPersonalFundingIntent(input), { message: 'funding_unavailable' });
      assert.equal((await handleWalletFunding(post(input), 'personal', { env,
        serviceRequest: async () => ({ ok: true, data }) })).status, 502);
    }
  } finally { globalThis.fetch = original; }
});

test('SPEI history and immutable status retain MXN without valuing the request as USD or confirming funds', () => {
  const record = { checkoutReference: requestId, requestedAmount: 148.66, sourceCurrencyCode: 'MXN', country: 'MX',
    status: 'initiated', createdAt: '2026-11-10T15:00:00Z', provider: 'reown', paymentMethodType: 'SPEI' };
  const history = { walletKind: 'personal', environment: 'production', settlement: 'unconfirmed', records: [record] };
  assert.deepEqual(fundingHistory(history, 'personal'), history);
  const status = { ...record, walletKind: 'personal', environment: 'production', requestStatus: 'initiated',
    destination: { address: input.walletAddress, asset: 'USDT', network: 'polygon', chainId: 137 },
    confirmation: { state: 'unconfirmed', source: 'none', testMode: false } };
  delete status.status;
  delete status.createdAt;
  assert.deepEqual(fundingStatus(status, 'personal'), status);
  for (const patch of [{ sourceCurrencyCode: 'COP' }, { paymentMethodType: undefined },
    { paymentMethodType: 'CREDIT_DEBIT_CARD' }, { country: 'US' }, { requestedAmount: 0 }, { requestedAmount: 148.666 }]) {
    assert.equal(fundingHistory({ ...history, records: [{ ...record, ...patch }] }, 'personal'), null);
    assert.equal(fundingStatus({ ...status, ...patch }, 'personal'), null);
  }
  assert.equal(fundingHistory({ ...history, walletKind: 'administrative', environment: 'sandbox' }, 'administrative'), null);
  assert.equal(fundingStatus({ ...status, walletKind: 'administrative', environment: 'sandbox', provider: 'meld',
    requestStatus: 'session_created', confirmation: { ...status.confirmation, testMode: true } }, 'administrative'), null);
});

test('personal local discovery exposes only SPEI in MXN without borrowing its limits for cards', () => {
  const local = options('personal');
  const card = { ...local.routes[0].paymentMethods[0], method: 'CREDIT_DEBIT_CARD' };
  const candidate = { ...local, paymentMethods: ['SPEI', 'CREDIT_DEBIT_CARD'], routes: [
    { ...local.routes[0], paymentMethods: [...local.routes[0].paymentMethods, card] }] };
  assert.deepEqual(personalProductionOptions(candidate), local);
  const unsupportedCountry = personalProductionOptions({ ...candidate, country: 'US' });
  assert.deepEqual(unsupportedCountry.paymentMethods, []);
  assert.deepEqual(unsupportedCountry.routes, []);
});

test('option BFF canonicalizes query currency and rejects duplicates and crossed responses', async () => {
  for (const kind of ['personal', 'administrative']) {
    const administrative = kind === 'administrative';
    const action = administrative ? 'options' : 'personal-options';
    const suffix = administrative ? '&serviceProvider=TRANSAK' : '';
    const path = `${kind}/options?country=MX&sourceCurrencyCode=MXN${suffix}`;
    const response = await handleWalletFunding(get(path), action, { env, serviceRequest: async url => {
      assert.equal(url, `https://auth.core.internal/api/member/wallet-funding/${path}`);
      return { ok: true, data: options(kind) };
    } });
    assert.deepEqual(await response.json(), options(kind));
    for (const query of [`${path}&sourceCurrencyCode=USD`, path.replace('MXN', 'mxn'), `${path}&environment=production`]) {
      assert.equal((await handleWalletFunding(get(query), action, { env,
        serviceRequest: async () => assert.fail('invalid query forwarded') })).status, 400);
    }
    const stale = { ...options(kind), sourceCurrencyCode: 'USD', paymentMethods: [], routes: [] };
    assert.equal((await handleWalletFunding(get(path), action, { env,
      serviceRequest: async () => ({ ok: true, data: stale }) })).status, 502);
  }
});

test('safe provider authentication and valuation errors pass through without private provider details', async () => {
  for (const error of ['wallet_funding_provider_authentication_unavailable', 'wallet_funding_valuation_unavailable']) {
    const response = await handleWalletFunding(get('administrative/options?country=CO&sourceCurrencyCode=USD&serviceProvider=BANXA'), 'options', {
      env, serviceRequest: async () => ({ ok: false, status: 503, data: { error,
        requestId: 'private-provider-reference', apiKey: 'private-key', message: 'provider-private-message' } }),
    });
    const data = await response.json();
    assert.equal(response.status, 503);
    assert.equal(data.error, error);
    assert.equal(JSON.stringify(data).includes('private-'), false);
  }
});

test('a dollar acknowledgement cannot relabel its requested amount as local fiat', () => {
  const value = { checkoutReference: requestId, walletKind: 'personal', environment: 'production', provider: 'reown',
    status: 'initiated', requestedAmount: 50, createdAt: '2026-11-10T15:00:00Z',
    paymentMethodType: 'CREDIT_DEBIT_CARD', allowedProviders: ['SWAPPED'], sourceCurrencyCode: 'MXN' };
  assert.equal(fundingAcknowledgement(value, 'personal'), null);
});

test('new personal funding allows only configured countries and excludes Neteller and Skrill before transport', async () => {
  const original = globalThis.fetch;
  const valid = { ...input, country: 'US', sourceCurrencyCode: 'USD', amount: 100, paymentMethodType: 'CREDIT_DEBIT_CARD' };
  assert.deepEqual(PERSONAL_FUNDING_COUNTRIES, ['US', 'MX', 'CO']);
  for (const country of PERSONAL_FUNDING_COUNTRIES) assert.ok(fundingInput({ ...valid, country }, 'personal'));
  try {
    globalThis.fetch = async () => assert.fail('an excluded country or method reached transport');
    for (const changed of [{ country: 'CA' }, { country: 'PA' }, { country: 'ES' }, { paymentMethodType: 'NETELLER' }, { paymentMethodType: 'SKRILL' }]) {
      await assert.rejects(createPersonalFundingIntent({ ...valid, ...changed }), { message: 'invalid_request' });
    }
    await assert.rejects(readPersonalFundingOptions('CA'), { message: 'invalid_request' });
    for (const sourceCurrencyCode of ['COP', 'MXN']) {
      await assert.rejects(createPersonalFundingIntent({ ...valid, country: 'CO', amount: 1000, sourceCurrencyCode,
        paymentMethodType: 'SPEI' }), { message: 'wallet_funding_valuation_unavailable' });
    }
  } finally { globalThis.fetch = original; }
  for (const country of ['CA', 'PA']) {
    const response = await handleWalletFunding(get(`personal/options?country=${country}`), 'personal-options', {
      env, serviceRequest: async () => assert.fail('an excluded country reached the private API'),
    });
    assert.equal(response.status, 400);
  }
});

test('personal method filtering preserves valid routes while administrative country and methods stay independent', () => {
  const method = name => ({ method: name, currencyCode: 'USD', minimumAmount: 10, maximumAmount: 1000,
    minimumUsd: 10, maximumUsd: 1000 });
  const personal = { ...options('personal'), country: 'US', sourceCurrencyCode: 'USD',
    paymentMethods: ['NETELLER', 'CREDIT_DEBIT_CARD', 'SKRILL'], routes: [
      { serviceProvider: 'MERCURYO', paymentMethods: [method('NETELLER')] },
      { serviceProvider: 'SWAPPED', paymentMethods: [method('CREDIT_DEBIT_CARD'), method('SKRILL')] },
    ] };
  const parsed = personalProductionOptions(personal);
  assert.deepEqual(parsed.paymentMethods, ['CREDIT_DEBIT_CARD']);
  assert.deepEqual(parsed.routes, [{ serviceProvider: 'SWAPPED', paymentMethods: [{ ...method('CREDIT_DEBIT_CARD'), minimumAmount: 30, minimumUsd: 30 }] }]);
  assert.equal(personalProductionOptions({ ...personal, country: 'CA' }), null);
  const admin = { ...options('administrative'), country: 'CO', sourceCurrencyCode: 'USD', serviceProvider: 'BANXA',
    paymentMethods: ['NETELLER', 'SKRILL'], routes: [{ serviceProvider: 'BANXA', paymentMethods: [method('NETELLER'), method('SKRILL')] }] };
  assert.deepEqual(administrativeSandboxOptions(admin), admin);
  assert.ok(fundingInput({ ...input, country: 'CO', amount: 100, sourceCurrencyCode: 'USD', paymentMethodType: 'SKRILL', serviceProvider: 'BANXA' }, 'administrative'));
});

test('previous personal Colombia and Skrill requests remain readable after new funding restrictions', () => {
  const record = { checkoutReference: requestId, requestedAmount: 100, country: 'CO', status: 'initiated',
    createdAt: '2026-11-10T15:00:00Z', provider: 'reown', paymentMethodType: 'SKRILL' };
  const history = fundingHistory({ walletKind: 'personal', environment: 'production', settlement: 'unconfirmed', records: [record] }, 'personal');
  assert.equal(history.records[0].country, 'CO');
  const status = fundingStatus({ checkoutReference: requestId, walletKind: 'personal', environment: 'production', provider: 'reown',
    country: 'CO', requestedAmount: 100, requestStatus: 'initiated', paymentMethodType: 'SKRILL',
    destination: { address: input.walletAddress, asset: 'USDT', network: 'polygon', chainId: 137 },
    confirmation: { state: 'unconfirmed', source: 'none', testMode: false } }, 'personal');
  assert.equal(status.country, 'CO');
  assert.equal(status.confirmation.state, 'unconfirmed');
});
