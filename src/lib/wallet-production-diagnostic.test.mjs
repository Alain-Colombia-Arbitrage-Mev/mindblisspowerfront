import assert from 'node:assert/strict';
import test from 'node:test';
import { walletProductionDiagnostic, walletProductionFailureLog, WALLET_PRODUCTION_PATH as base, WALLET_PRODUCTION_ORIGIN as origin } from './wallet-production-funding-contract.mjs';
import { handleWalletProductionFunding } from './wallet-production-funding-bff.mjs';
import { createProductionFunding, quoteProductionFunding } from './wallet-production-funding-client.mjs';

const address = `0x${'1'.repeat(40)}`, ownerSubject = 'diagnostic-owner';
const quote = { country: 'MX', sourceCurrencyCode: 'MXN', amount: 2000, paymentMethodType: 'SPEI' };
const input = { ...quote, serviceProvider: 'ONRAMPMONEY', requestId: '11111111-1111-4111-8111-111111111111' };
const diagnostic = { stage: 'widget_http', upstreamStatus: 400, providerCode: 'PROVIDER_FAILURE', serviceProviderCode: 'INVALID_CUSTOMER' };
const hostile = { ...diagnostic, url: 'https://private.example/?token=secret', address, ownerSubject, ip: '192.0.2.8', message: 'private provider text', token: 'private' };

test('diagnostic projection preserves only the exact safe stage, integer HTTP status and bounded machine codes', () => {
  assert.deepEqual(walletProductionDiagnostic(hostile), diagnostic);
  for (const value of [null, [], 'private', { stage: 'https://private.example' }, { stage: 'WIDGET_HTTP' }]) assert.equal(walletProductionDiagnostic(value), undefined);
  for (const upstreamStatus of [99, 600, '400', 400.5, NaN]) assert.deepEqual(walletProductionDiagnostic({ stage: 'widget_http', upstreamStatus }), { stage: 'widget_http' });
  for (const code of ['https://private.example', 'contains private text', 'lower_case', 'X', 'X'.repeat(81), `0X${'A'.repeat(40)}`, 'A'.repeat(64), { secret: true }]) {
    assert.deepEqual(walletProductionDiagnostic({ stage: 'widget_schema', providerCode: code, serviceProviderCode: code }), { stage: 'widget_schema' });
  }
  assert.deepEqual(walletProductionFailureLog(Object.assign(Error('private raw message with a wallet'), { status: 503, diagnostic: hostile, url: hostile.url })),
    { error: 'wallet_production_unavailable', status: 503, diagnostic });
});

test('only a recognized Native checkout error can cross the BFF with sanitized diagnostic metadata', async () => {
  const env = { AUTH_PUBLIC_ORIGIN: origin, AUTH_PROVIDER: 'better-auth', AUTH_BFF_SHARED_SECRET: 's'.repeat(48), NODE_ENV: 'production' };
  for (const [action, body, error, expected] of [['session', input, 'wallet_production_unavailable', diagnostic],
    ['quote', quote, 'wallet_production_unavailable', undefined], ['session', input, 'private raw error', undefined]]) {
    const request = new Request(`${origin}${base}/${action}`, { method: 'POST', headers: { cookie: 'better-auth.session_token=synthetic', origin,
      'sec-fetch-site': 'same-origin', 'cf-connecting-ip': '192.0.2.7', 'content-type': 'application/json', 'x-mindbliss-wallet-subject': encodeURIComponent(ownerSubject) }, body: JSON.stringify(body) });
    let calls = 0;
    const response = await handleWalletProductionFunding(request, action, { env, serviceRequest: async () => { calls++; return { ok: false, status: 503, data: { error, diagnostic: hostile, token: 'secret' } }; } });
    assert.equal(calls, 1); assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: 'wallet_production_unavailable', ...(expected ? { diagnostic: expected } : {}) });
  }
});

test('browser checkout errors revalidate diagnostics and never retain raw sensitive metadata or retry', async t => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; return Response.json({ error: 'wallet_production_unavailable', diagnostic: hostile, address, token: 'secret' }, { status: 503 }); });
  await assert.rejects(createProductionFunding(input, address, { ownerSubject }), error => {
    assert.deepEqual(Object.keys(error).sort(), ['diagnostic', 'status']); assert.deepEqual(error.diagnostic, diagnostic); assert.equal(error.status, 503); return true;
  });
  await assert.rejects(quoteProductionFunding(quote, address, { ownerSubject }), error => { assert.equal(error.diagnostic, undefined); return true; });
  assert.equal(calls, 2);
  t.mock.method(globalThis, 'fetch', async () => Response.json({ error: 'wallet_production_unavailable', diagnostic: { stage: 'private raw data', token: 'secret' } }, { status: 503 }));
  await assert.rejects(createProductionFunding(input, address, { ownerSubject }), error => { assert.equal(error.diagnostic, undefined); return true; });
});
