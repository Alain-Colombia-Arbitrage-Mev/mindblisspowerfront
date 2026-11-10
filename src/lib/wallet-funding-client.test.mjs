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
    paymentMethods: ['CREDIT_DEBIT_CARD'], routes: [{ serviceProvider: 'SWAPPED',
      paymentMethods: [{ method: 'CREDIT_DEBIT_CARD', currencyCode: 'USD', minimumAmount: 10, maximumAmount: 25000, minimumUsd: 10, maximumUsd: 25000 }] }] };
  const paths = [];
  try {
    globalThis.fetch = async path => { paths.push(path); return Response.json(personal); };
    assert.deepEqual(await readPersonalFundingOptions('US'), personal);
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
    country: 'US', amount: 50, paymentMethodType: 'CREDIT_DEBIT_CARD' };
  try {
    globalThis.fetch = async () => Response.json({ checkoutReference: input.requestId, walletKind: 'personal',
      environment: 'production', provider: 'reown', status: 'initiated', requestedAmount: 50,
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
