import assert from 'node:assert/strict';
import test from 'node:test';
import { readAdministrativeSandboxOptions, readPersonalFundingOptions, createPersonalFundingIntent } from './wallet-funding-client.mjs';

const options = { walletKind: 'administrative', environment: 'sandbox', provider: 'meld', country: 'US', sourceCurrencyCode: 'USD',
  serviceProvider: 'TRANSAK', paymentMethods: ['CREDIT_DEBIT_CARD'], routes: [{ serviceProvider: 'TRANSAK',
    paymentMethods: [{ method: 'CREDIT_DEBIT_CARD', currencyCode: 'USD', minimumAmount: 20, maximumAmount: 15000, minimumUsd: 20, maximumUsd: 15000 }] }] };

test('administrative methods never borrow personal provider options or invent an empty fallback', async () => {
  const original = globalThis.fetch;
  const calls = [];
  try {
    globalThis.fetch = async (path, init) => { calls.push({ path, init }); return Response.json({ ...options, paymentMethods: [], routes: [] }); };
    const result = await readAdministrativeSandboxOptions('US', 'TRANSAK');
    assert.deepEqual(result.paymentMethods, []);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].path, '/api/member/wallet-funding/administrative/options?country=US&sourceCurrencyCode=USD&serviceProvider=TRANSAK');
    assert.equal(calls[0].init.credentials, 'same-origin');
    assert.equal(calls[0].init.cache, 'no-store');
    await assert.rejects(readAdministrativeSandboxOptions('US', 'TOPPER'), { message: 'invalid_request' });
    assert.equal(calls.length, 1);
  } finally { globalThis.fetch = original; }
});

test('personal country methods reject sandbox payloads and do not fall back to administrative discovery', async () => {
  const original = globalThis.fetch;
  const personal = { walletKind: 'personal', environment: 'production', provider: 'reown', country: 'US', sourceCurrencyCode: 'USD',
    destinationCurrencyCode: 'USDT_POLYGON', network: 'polygon', chainId: 137,
    paymentMethods: ['CREDIT_DEBIT_CARD'], routes: [{ serviceProvider: 'SWAPPED',
      paymentMethods: [{ method: 'CREDIT_DEBIT_CARD', currencyCode: 'USD', minimumAmount: 10, maximumAmount: 25000, minimumUsd: 10, maximumUsd: 25000 }] }] };
  const paths = [];
  try {
    globalThis.fetch = async path => { paths.push(path); return Response.json(personal); };
    assert.deepEqual(await readPersonalFundingOptions('US'), { ...personal, routes: [{ ...personal.routes[0], paymentMethods: [{ method: 'CREDIT_DEBIT_CARD', currencyCode: 'USD', minimumAmount: 30, maximumAmount: 15000, minimumUsd: 30, maximumUsd: 15000 }] }] });
    assert.deepEqual(paths, ['/api/member/wallet-funding/personal/options?country=US&sourceCurrencyCode=USD']);
    globalThis.fetch = async () => Response.json(options);
    await assert.rejects(readPersonalFundingOptions('US'), { message: 'funding_unavailable' });
    globalThis.fetch = async () => Response.json({ ...personal, routes: [{ ...personal.routes[0], serviceProvider: 'TRANSAK' }] });
    await assert.rejects(readPersonalFundingOptions('US'), { message: 'funding_unavailable' });
  } finally { globalThis.fetch = original; }
});

test('a personal intent cannot silently change the requested payment method', async () => {
  const original = globalThis.fetch;
  const input = { requestId: 'd8a4c010-cc33-44da-a297-8b3c6440f491', walletAddress: `0x${'1'.repeat(40)}`,
    country: 'US', amount: 100, paymentMethodType: 'CREDIT_DEBIT_CARD' };
  try {
    globalThis.fetch = async () => Response.json({ checkoutReference: input.requestId, walletKind: 'personal',
      environment: 'production', provider: 'reown', status: 'initiated', requestedAmount: 100,
      destinationCurrencyCode: 'USDT_POLYGON', destination: { address: input.walletAddress, asset: 'USDT', network: 'polygon', chainId: 137 },
      createdAt: '2026-11-10T15:00:00Z', paymentMethodType: 'APPLE_PAY', allowedProviders: ['SWAPPED'] });
    await assert.rejects(createPersonalFundingIntent(input), { message: 'funding_unavailable' });
  } finally { globalThis.fetch = original; }
});

test('a canceled old country/provider request cannot publish late methods into the new selection', async () => {
  const original = globalThis.fetch;
  const controller = new AbortController();
  let resolve;
  const pending = new Promise(done => { resolve = done; });
  try {
    globalThis.fetch = async () => pending;
    const old = readAdministrativeSandboxOptions('US', 'TRANSAK', { signal: controller.signal });
    controller.abort();
    resolve(Response.json(options));
    await assert.rejects(old, { name: 'AbortError' });
    globalThis.fetch = async () => Response.json(options);
    await assert.rejects(readAdministrativeSandboxOptions('CO', 'BANXA'), { message: 'funding_unavailable' });
  } finally { globalThis.fetch = original; }
});

test('personal discovery retries one transient GET with the exact country and currency, never a payment write', async () => {
  const original = globalThis.fetch;
  const personal = { walletKind: 'personal', environment: 'production', provider: 'reown', country: 'MX', sourceCurrencyCode: 'MXN',
    destinationCurrencyCode: 'USDT_POLYGON', network: 'polygon', chainId: 137,
    paymentMethods: ['SPEI'], routes: [{ serviceProvider: 'SWAPPED', paymentMethods: [{ method: 'SPEI', currencyCode: 'MXN', minimumAmount: 148.66, maximumAmount: 212370.61 }] }] };
  const calls = [];
  try {
    globalThis.fetch = async (path, init) => { calls.push({ path, init }); return calls.length === 1 ? Response.json({ error: 'wallet_funding_provider_unavailable' }, { status: 503 }) : Response.json(personal); };
    assert.deepEqual(await readPersonalFundingOptions('MX', { sourceCurrencyCode: 'MXN' }), { ...personal,
      routes: [{ ...personal.routes[0], paymentMethods: [{ ...personal.routes[0].paymentMethods[0], minimumAmount: 931 }] }] });
    assert.equal(calls.length, 2);
    assert.ok(calls.every(call => call.path.endsWith('country=MX&sourceCurrencyCode=MXN') && call.init.method === 'GET' && call.init.cache === 'no-store'));
    calls.length = 0;
    globalThis.fetch = async (path, init) => { calls.push({ path, init }); return Response.json({ error: 'wallet_funding_provider_unavailable' }, { status: 503 }); };
    await assert.rejects(createPersonalFundingIntent({ requestId: 'd8a4c010-cc33-44da-a297-8b3c6440f491', walletAddress: `0x${'1'.repeat(40)}`, country: 'US', amount: 100, paymentMethodType: 'CREDIT_DEBIT_CARD' }));
    assert.equal(calls.length, 1);
    assert.equal(calls[0].init.method, 'POST');
  } finally { globalThis.fetch = original; }
});

test('discovery stops after its second transient failure and never retries sessions, throttling or malformed success', async () => {
  const original = globalThis.fetch;
  try {
    let calls = 0;
    globalThis.fetch = async () => { calls++; throw new TypeError('Network unavailable'); };
    await assert.rejects(readPersonalFundingOptions('US'), { name: 'TypeError' });
    assert.equal(calls, 2);
    for (const status of [401, 403, 429]) {
      calls = 0;
      globalThis.fetch = async () => { calls++; return Response.json({ error: 'funding_unavailable' }, { status }); };
      await assert.rejects(readPersonalFundingOptions('US'));
      assert.equal(calls, 1);
    }
    calls = 0;
    globalThis.fetch = async () => { calls++; return Response.json({ ...options, environment: 'production' }); };
    await assert.rejects(readPersonalFundingOptions('US'), { message: 'funding_unavailable' });
    assert.equal(calls, 1);
  } finally { globalThis.fetch = original; }
});

test('changing selection during a transient retry delay cancels the old country without a second lookup', async () => {
  const original = globalThis.fetch;
  const controller = new AbortController();
  let calls = 0;
  try {
    globalThis.fetch = async () => { calls++; return Response.json({ error: 'funding_unavailable' }, { status: 503 }); };
    const pending = readPersonalFundingOptions('US', { signal: controller.signal });
    setTimeout(() => controller.abort(), 20);
    await assert.rejects(pending, { name: 'AbortError' });
    assert.equal(calls, 1);
  } finally { globalThis.fetch = original; }
});
