import assert from 'node:assert/strict';
import test from 'node:test';
import { personalProductionOptions, fundingAcknowledgement, PERSONAL_FUNDING_DESTINATION } from './wallet-funding-contract.mjs';
import { handleWalletFunding } from './wallet-funding-bff.mjs';
import { createPersonalFundingIntent } from './wallet-funding-client.mjs';
import { personalFundingFailure } from './personal-funding-errors.mjs';

const address = `0x${'1'.repeat(40)}`, other = `0x${'2'.repeat(40)}`;
const input = { requestId: '11111111-1111-4111-8111-111111111111', walletAddress: address, country: 'US', amount: 30,
  sourceCurrencyCode: 'USD', paymentMethodType: 'CREDIT_DEBIT_CARD' };
const ack = { walletKind: 'personal', environment: 'production', provider: 'reown', status: 'initiated',
  checkoutReference: input.requestId, requestedAmount: 30, sourceCurrencyCode: 'USD', paymentMethodType: input.paymentMethodType,
  allowedProviders: ['SWAPPED'], createdAt: '2026-11-11T12:00:00Z', destinationCurrencyCode: 'USDT_POLYGON',
  destination: { address, asset: 'USDT', network: 'polygon', chainId: 137 } };
const env = { AUTH_PROVIDER: 'better-auth', AUTH_BFF_SHARED_SECRET: 's'.repeat(40), NODE_ENV: 'production',
  AUTH_PUBLIC_ORIGIN: 'https://app.mindblisspower.com', BETTER_AUTH_BACKEND_URL: 'https://auth.core.internal' };
const request = () => new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/member/wallet-funding/personal/intent`, { method: 'POST',
  headers: { cookie: 'better-auth.session_token=synthetic', origin: env.AUTH_PUBLIC_ORIGIN, 'content-type': 'application/json',
    'sec-fetch-site': 'same-origin', 'cf-connecting-ip': '198.51.100.1' }, body: JSON.stringify(input) });

test('new personal discovery must explicitly identify Polygon USDT before any payment choices are used', () => {
  const options = { walletKind: 'personal', environment: 'production', provider: 'reown', country: 'US', sourceCurrencyCode: 'USD',
    paymentMethods: [], routes: [], ...PERSONAL_FUNDING_DESTINATION };
  assert.deepEqual(personalProductionOptions(options), options);
  const { destinationCurrencyCode: _currency, network: _network, chainId: _chain, ...oldResponse } = options;
  assert.equal(personalProductionOptions(oldResponse), null);
  for (const patch of [{ destinationCurrencyCode: 'USDT' }, { network: 'ethereum', chainId: 1 }, { chainId: 1 }, { network: 'ethereum' }]) {
    assert.equal(personalProductionOptions({ ...options, ...patch }), null);
  }
});

test('only a Polygon acknowledgement for the submitted wallet can pass the private and browser boundaries', async () => {
  const original = globalThis.fetch;
  try {
    for (const value of [ack, { ...ack, destination: { ...ack.destination, address: other } }, { ...ack, destinationCurrencyCode: 'USDT' },
      { ...ack, destination: { ...ack.destination, network: 'ethereum', chainId: 1 } }, { ...ack, destination: undefined }]) {
      const valid = value === ack;
      const response = await handleWalletFunding(request(), 'personal', { env, serviceRequest: async () => ({ ok: true, data: value }) });
      assert.equal(response.status, valid ? 200 : 502);
      globalThis.fetch = async () => Response.json(value);
      if (valid) assert.deepEqual((await createPersonalFundingIntent(input)).destination, ack.destination);
      else await assert.rejects(createPersonalFundingIntent(input), { message: 'funding_unavailable' });
    }
    assert.equal(fundingAcknowledgement({ ...ack, destinationCurrencyCode: 'USDT' }, 'personal'), null);
  } finally { globalThis.fetch = original; }
});

test('retired new-funding clients receive a safe actionable network policy error', async () => {
  const response = await handleWalletFunding(request(), 'personal', { env,
    serviceRequest: async () => ({ ok: false, status: 409, data: { error: 'wallet_funding_network_changed', privateKey: 'never exposed' } }) });
  assert.equal(response.status, 409); assert.equal((await response.json()).error, 'wallet_funding_network_changed');
  assert.equal(personalFundingFailure(new Error('wallet_funding_network_changed'), 'intent'), 'network_changed');
});
