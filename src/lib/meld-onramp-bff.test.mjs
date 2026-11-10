import assert from 'node:assert/strict';
import test from 'node:test';
import { handleMeldOnramp } from './meld-onramp-bff.mjs';

const env = { AUTH_PROVIDER: 'better-auth', AUTH_BFF_SHARED_SECRET: 's'.repeat(32),
  AUTH_PUBLIC_ORIGIN: 'https://app.example.test', BETTER_AUTH_BACKEND_URL: 'https://auth.core.internal', NODE_ENV: 'production' };
const address = `0x${'a'.repeat(40)}`;
const input = { walletKind: 'personal', walletAddress: address, country: 'CO', fiat: 'USD', crypto: 'USDT_POLYGON',
  amount: 100, paymentMethodType: 'CREDIT_DEBIT_CARD', serviceProvider: 'TOPPER' };
const checkoutReference = 'd8a4c010-cc33-44da-a297-8b3c6440f491';
const administrativeEnv = { ...env, MELD_CHECKOUT_URL: 'https://meldcrypto.com/?publicKey=synthetic-public-key' };

function capturedIntent(walletKind = 'administrative') {
  return { ok: true, status: 201, data: {
    checkoutReference, walletKind,
    quote: { serviceProvider: 'TOPPER', paymentMethodType: 'CREDIT_DEBIT_CARD', sourceAmount: 100,
      destinationAmount: 96, totalFee: 4, transactionFee: 3, networkFee: 1, partnerFee: 0 },
    commission: { ratePercent: 1, estimatedUsd: 1, status: 'estimated' },
    checkoutUrl: 'https://untrusted.example.test', apiKey: 'must-never-be-exposed',
  } };
}

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
  const result = await response.json();
  assert.equal(result.commission.estimatedUsd, 1);
  assert.equal(Object.hasOwn(result, 'checkoutUrl'), false);
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

test('administrative top-ups reject missing or foreign Meld checkout configuration before creating an intent', async () => {
  const never = async () => assert.fail('an unconfigured administrative checkout created an intent');
  for (const providerUrl of [undefined, '', 'https://foreign.example.test/?publicKey=synthetic',
    'https://meldcrypto.com/', 'http://meldcrypto.com/?publicKey=synthetic',
    'https://user:password@meldcrypto.com/?publicKey=synthetic']) {
    const response = await handleMeldOnramp(request({ ...input, walletKind: 'administrative' }), 'intent', {
      env: { ...env, MELD_CHECKOUT_URL: providerUrl }, serviceRequest: never,
    });
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: 'onramp_unconfigured' });
  }
});

test('administrative checkout uses only configured Meld and the backend-confirmed intent without Reown', async () => {
  const body = { ...input, walletKind: 'administrative' };
  let calls = 0;
  const response = await handleMeldOnramp(request(body), 'intent', {
    env: { ...administrativeEnv,
      MELD_CHECKOUT_URL: `${administrativeEnv.MELD_CHECKOUT_URL}&sourceAmount=9999&walletAddress=stale&serviceProviders=BANXA&paymentMethodType=stale` },
    serviceRequest: async (url, init) => {
      calls++;
      assert.equal(url, 'https://auth.core.internal/api/member/onramp/intent');
      assert.deepEqual(JSON.parse(init.body), body);
      assert.equal(init.headers.cookie, 'better-auth.session_token=verified-session');
      return capturedIntent();
    },
  });
  assert.equal(calls, 1);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  const result = await response.json();
  assert.deepEqual(Object.keys(result).sort(), ['checkoutReference', 'checkoutUrl', 'commission', 'quote', 'walletKind']);
  assert.equal(result.walletKind, 'administrative');
  const checkout = new URL(result.checkoutUrl);
  assert.equal(checkout.origin, 'https://meldcrypto.com');
  assert.equal(checkout.searchParams.get('publicKey'), 'synthetic-public-key');
  assert.equal(checkout.searchParams.get('walletAddress'), address);
  assert.equal(checkout.searchParams.get('sourceAmount'), '100');
  assert.equal(checkout.searchParams.get('countryCode'), 'CO');
  assert.equal(checkout.searchParams.get('destinationCurrencyCode'), 'USDT_POLYGON');
  assert.equal(checkout.searchParams.get('serviceProviders'), 'TOPPER');
  assert.equal(checkout.searchParams.get('paymentMethodType'), 'CREDIT_DEBIT_CARD');
  assert.equal(checkout.searchParams.get('externalCustomerId'), checkoutReference);
  assert.equal(checkout.searchParams.get('externalSessionId'), checkoutReference);
  assert.equal(checkout.searchParams.has('projectId'), false);
});

test('an intent acknowledgement for another wallet kind cannot create a checkout for either wallet', async () => {
  for (const walletKind of ['personal', 'administrative']) {
    const response = await handleMeldOnramp(request({ ...input, walletKind }), 'intent', {
      env: administrativeEnv,
      serviceRequest: async () => capturedIntent(walletKind === 'personal' ? 'administrative' : 'personal'),
    });
    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), { error: 'onramp_unavailable' });
  }
});

test('invalid backend-confirmed administrative quotes fail closed without exposing checkout configuration', async () => {
  for (const sourceAmount of [0, 49, 25_001]) {
    const response = await handleMeldOnramp(request({ ...input, walletKind: 'administrative' }), 'intent', {
      env: administrativeEnv,
      serviceRequest: async () => {
        const result = capturedIntent();
        result.data.quote.sourceAmount = sourceAmount;
        return result;
      },
    });
    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), { error: 'onramp_unavailable' });
  }
});
