import assert from 'node:assert/strict';
import test from 'node:test';
import { handleMeldOnramp } from './meld-onramp-bff.mjs';

const env = { AUTH_PROVIDER: 'better-auth', AUTH_BFF_SHARED_SECRET: 's'.repeat(32),
  AUTH_PUBLIC_ORIGIN: 'https://app.example.test', BETTER_AUTH_BACKEND_URL: 'https://auth.core.internal', NODE_ENV: 'production' };
const address = `0x${'a'.repeat(40)}`;
const input = { walletKind: 'personal', walletAddress: address, country: 'CO', fiat: 'USD', crypto: 'USDT_POLYGON',
  amount: 100, paymentMethodType: 'CREDIT_DEBIT_CARD', serviceProvider: 'TOPPER' };

function request(body = input) {
  return new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/member/onramp/intent`, { method: 'POST', headers: {
    cookie: 'better-auth.session_token=verified-session', origin: env.AUTH_PUBLIC_ORIGIN,
    'sec-fetch-site': 'same-origin', 'content-type': 'application/json',
  }, body: JSON.stringify(body) });
}

test('onramp intent forwards only a stablecoin quote and returns captured commission metadata', async () => {
  let forwarded;
  const response = await handleMeldOnramp(request(), 'intent', { env, serviceRequest: async (url, init) => {
    forwarded = { url, init };
    return { ok: true, status: 201, data: {
      checkoutReference: 'd8a4c010-cc33-44da-a297-8b3c6440f491', walletKind: 'personal',
      quote: { serviceProvider: 'TOPPER', paymentMethodType: 'CREDIT_DEBIT_CARD', sourceAmount: 100,
        destinationAmount: 96, totalFee: 4, transactionFee: 3, networkFee: 1, partnerFee: 0 },
      commission: { ratePercent: 1, estimatedUsd: 1, status: 'estimated' },
    } };
  } });
  assert.equal(response.status, 200);
  assert.equal(forwarded.url, 'https://auth.core.internal/api/member/onramp/intent');
  assert.deepEqual(JSON.parse(forwarded.init.body), input);
  assert.equal((await response.json()).commission.estimatedUsd, 1);
});

test('onramp intent permits only Topper or Swapped and rejects foreign origins before transport', async () => {
  const never = async () => assert.fail('invalid request forwarded');
  for (const serviceProvider of ['BINANCECONNECT', 'BANXA', 'ONRAMPMONEY']) {
    assert.equal((await handleMeldOnramp(request({ ...input, serviceProvider }), 'intent', { env, serviceRequest: never })).status, 400);
  }
  assert.equal((await handleMeldOnramp(request({ ...input, crypto: 'BTC' }), 'intent', { env, serviceRequest: never })).status, 400);
  const foreign = new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/member/onramp/intent`, { method: 'POST', headers: {
    cookie: 'better-auth.session_token=verified-session', origin: 'https://evil.test', 'sec-fetch-site': 'cross-site',
    'content-type': 'application/json',
  }, body: JSON.stringify(input) });
  assert.equal((await handleMeldOnramp(foreign, 'intent', { env, serviceRequest: never })).status, 403);
});
