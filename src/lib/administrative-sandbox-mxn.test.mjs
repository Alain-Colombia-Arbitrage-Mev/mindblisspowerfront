import assert from 'node:assert/strict';
import test from 'node:test';
import { fundingAcknowledgement, fundingHistory, fundingStatus, fundingSourceSupported, validFundingSourceAmount } from './wallet-funding-contract.mjs';
import { createAdministrativeSandboxSession } from './wallet-funding-client.mjs';
import { startAdministrativeMeldOnramp } from './administrative-onramp-client.mjs';
import { handleWalletFunding } from './wallet-funding-bff.mjs';

const requestId = 'd8a4c010-cc33-44da-a297-8b3c6440f491';
const address = `0x${'b'.repeat(40)}`;
const body = { requestId, walletAddress: address, country: 'MX', amount: 150, sourceCurrencyCode: 'MXN', paymentMethodType: 'CREDIT_DEBIT_CARD', serviceProvider: 'TRANSAK' };
const ack = () => ({ checkoutReference: requestId, walletKind: 'administrative', environment: 'sandbox', provider: 'meld',
  status: 'session_created', requestedAmount: body.amount, sourceCurrencyCode: 'MXN', createdAt: '2026-11-12T15:00:00.000Z', checkoutUrl: 'https://sb.meldcrypto.com/widget?token=synthetic' });
const destination = { address, asset: 'USDT', network: 'polygon', chainId: 137 };
const record = () => ({ checkoutReference: requestId, requestedAmount: body.amount, sourceCurrencyCode: 'MXN', paymentMethodType: 'CREDIT_DEBIT_CARD', country: 'MX',
  provider: 'meld', status: 'session_created', destination, createdAt: ack().createdAt });
const history = () => ({ walletKind: 'administrative', environment: 'sandbox', settlement: 'unconfirmed', records: [record()] });
const status = () => ({ ...record(), walletKind: 'administrative', environment: 'sandbox', requestStatus: 'session_created', confirmation: { state: 'unconfirmed', source: 'none', testMode: true } });

test('sandbox MXN uses positive actual fiat, never the personal 931 floor or a USD valuation', () => {
  for (const amount of [0.01, 30, 150, 2000]) assert.equal(validFundingSourceAmount(amount, 'administrative', 'MXN'), true);
  for (const amount of [0, -1, 0.001, Infinity, '150', 1_000_000_001]) assert.equal(validFundingSourceAmount(amount, 'administrative', 'MXN'), false);
  assert.equal(validFundingSourceAmount(49.99, 'administrative', 'USD'), false);
  assert.equal(validFundingSourceAmount(50, 'administrative', 'USD'), true);
  assert.equal(validFundingSourceAmount(25_000, 'administrative', 'USD'), true);
  assert.equal(validFundingSourceAmount(25_001, 'administrative', 'USD'), false);
  assert.equal(validFundingSourceAmount(150, 'personal', 'MXN'), false);
  for (const paymentMethodType of ['CREDIT_DEBIT_CARD', 'APPLE_PAY', 'GOOGLE_PAY']) assert.equal(fundingSourceSupported({ ...body, paymentMethodType }, 'administrative'), true);
  for (const changed of [{ country: 'US' }, { country: 'CO', sourceCurrencyCode: 'COP' }, { sourceCurrencyCode: 'EUR' }, { paymentMethodType: 'SPEI' }, { paymentMethodType: 'NETELLER' }, { serviceProvider: 'BANXA', paymentMethodType: 'APPLE_PAY' }]) {
    assert.equal(fundingSourceSupported({ ...body, ...changed }, 'administrative'), false);
  }
});

test('administrative sandbox MXN history/status preserve currency, owner destination and unconfirmed test mode', () => {
  assert.equal(fundingAcknowledgement(ack(), 'administrative').sourceCurrencyCode, 'MXN');
  assert.equal(fundingHistory(history(), 'administrative').records[0].sourceCurrencyCode, 'MXN');
  assert.equal(fundingStatus(status(), 'administrative').requestedAmount, 150);
  for (const changed of [{ country: 'CO' }, { paymentMethodType: 'SPEI' }, { paymentMethodType: undefined }, { sourceCurrencyCode: 'COP' }, { destination: { ...destination, network: 'ethereum', chainId: 1 } }]) {
    assert.equal(fundingStatus({ ...status(), ...changed }, 'administrative'), null);
    assert.equal(fundingHistory({ ...history(), records: [{ ...record(), ...changed }] }, 'administrative'), null);
  }
  assert.equal(fundingStatus({ ...status(), confirmation: { state: 'confirmed', source: 'provider', testMode: true } }, 'administrative'), null);
  assert.equal(fundingStatus(status(), 'personal'), null);
});

test('the BFF and browser preserve exact MXN into sandbox and reject currency-swapped success contracts', async t => {
  const env = { AUTH_PROVIDER: 'better-auth', AUTH_BFF_SHARED_SECRET: 's'.repeat(32), AUTH_PUBLIC_ORIGIN: 'https://wallet.example.test', BETTER_AUTH_BACKEND_URL: 'https://auth.core.internal', NODE_ENV: 'production' };
  const post = value => new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/member/wallet-funding/administrative/session`, { method: 'POST', headers: { cookie: 'better-auth.session_token=synthetic', origin: env.AUTH_PUBLIC_ORIGIN, 'content-type': 'application/json', 'sec-fetch-site': 'same-origin', 'cf-connecting-ip': '198.51.100.10' }, body: JSON.stringify(value) });
  let calls = 0;
  const serviceRequest = async (_url, init) => { calls++; assert.deepEqual(JSON.parse(init.body), body); return { ok: true, status: 200, data: ack() }; };
  const response = await handleWalletFunding(post(body), 'administrative', { env, serviceRequest });
  assert.equal(response.status, 200); assert.equal((await response.json()).sourceCurrencyCode, 'MXN');
  assert.equal(calls, 1);
  for (const changed of [{ country: 'CO' }, { paymentMethodType: 'SPEI' }]) {
    const denied = await handleWalletFunding(post({ ...body, ...changed }), 'administrative', { env, serviceRequest: async () => assert.fail('unsupported rail crossed BFF') });
    assert.equal(denied.status, 503);
  }
  const wrongCurrency = await handleWalletFunding(post(body), 'administrative', { env, serviceRequest: async () => ({ ok: true, data: { ...ack(), sourceCurrencyCode: 'USD' } }) });
  assert.equal(wrongCurrency.status, 502);
  const fetchImpl = globalThis.fetch; t.after(() => { globalThis.fetch = fetchImpl; });
  globalThis.fetch = async (_url, init) => { assert.deepEqual(JSON.parse(init.body), body); return Response.json(ack()); };
  assert.equal((await createAdministrativeSandboxSession(body)).sourceCurrencyCode, 'MXN');
  globalThis.fetch = async () => Response.json({ ...ack(), sourceCurrencyCode: 'USD' });
  await assert.rejects(createAdministrativeSandboxSession(body), { message: 'funding_unavailable' });
});

test('administrative checkout opens only its exact MXN sandbox session once and never falls back to production', async () => {
  const opened = [];
  const input = { requestId, address, countryCode: 'MX', amount: 150, sourceCurrencyCode: 'MXN', paymentMethodType: 'CREDIT_DEBIT_CARD', serviceProvider: 'TRANSAK' };
  await startAdministrativeMeldOnramp(input, { createSession: async value => { assert.deepEqual(value, body); return ack(); }, openCheckout: url => opened.push(url) });
  assert.deepEqual(opened, [ack().checkoutUrl]);
  for (const changed of [{ sourceCurrencyCode: 'USD' }, { environment: 'production' }, { checkoutUrl: 'https://meldcrypto.com/widget?token=synthetic' }]) {
    await assert.rejects(startAdministrativeMeldOnramp(input, { createSession: async () => ({ ...ack(), ...changed }), openCheckout: () => assert.fail('invalid currency/origin opened') }));
  }
});
