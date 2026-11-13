import assert from 'node:assert/strict';
import test from 'node:test';
import { fundingAcknowledgement, sandboxCheckoutUrl } from './wallet-funding-contract.mjs';
import { createAdministrativeSandboxSession } from './wallet-funding-client.mjs';
import { startAdministrativeMeldOnramp } from './administrative-onramp-client.mjs';
import { handleWalletFunding } from './wallet-funding-bff.mjs';

const requestId = 'd8a4c010-cc33-44da-a297-8b3c6440f491';
const walletAddress = `0x${'b'.repeat(40)}`;
const directUrl = 'https://global-stg.transak.com/?apiKey=synthetic-public-key&sessionId=synthetic.session.value';
const fallbackUrl = 'https://sb.meldcrypto.com/widget?token=synthetic-session';
const input = { requestId, walletAddress, country: 'US', sourceCurrencyCode: 'USD', amount: 100,
  paymentMethodType: 'CREDIT_DEBIT_CARD', serviceProvider: 'TRANSAK' };
const ack = (changes = {}) => ({ checkoutReference: requestId, walletKind: 'administrative', environment: 'sandbox', provider: 'meld',
  status: 'session_created', serviceProvider: 'TRANSAK', requestedAmount: 100, sourceCurrencyCode: 'USD', createdAt: '2026-11-12T15:00:00.000Z', checkoutUrl: directUrl, ...changes });
const env = { AUTH_PROVIDER: 'better-auth', AUTH_BFF_SHARED_SECRET: 's'.repeat(32), AUTH_PUBLIC_ORIGIN: 'https://wallet.mindblisspower.com',
  BETTER_AUTH_BACKEND_URL: 'https://auth.core.internal', NODE_ENV: 'production' };
const request = () => new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/member/wallet-funding/administrative/session`, { method: 'POST', headers: {
  cookie: 'better-auth.session_token=synthetic-session', origin: env.AUTH_PUBLIC_ORIGIN, 'sec-fetch-site': 'same-origin',
  'content-type': 'application/json', 'cf-connecting-ip': '198.51.100.10',
}, body: JSON.stringify(input) });

// Official sources: Meld White-Label quickstart and crypto OpenAPI 2026-02-03;
// Transak Create Widget URL documents the staging host and its single-use session.
test('direct Transak sandbox URL needs both exact provider context and the API-generated two-field session shape', () => {
  assert.equal(sandboxCheckoutUrl(directUrl, 'TRANSAK'), directUrl);
  assert.equal(sandboxCheckoutUrl(directUrl), null);
  assert.equal(sandboxCheckoutUrl(directUrl, 'BANXA'), null);
  assert.equal(fundingAcknowledgement(ack(), 'administrative', 'US', 'TRANSAK').checkoutUrl, directUrl);
  assert.equal(fundingAcknowledgement(ack(), 'administrative', 'US'), null);
  assert.equal(fundingAcknowledgement(ack(), 'administrative', 'US', 'BANXA'), null);
  assert.equal(fundingAcknowledgement(ack({ serviceProvider: undefined }), 'administrative', 'US', 'TRANSAK'), null);
  assert.equal(fundingAcknowledgement(ack({ serviceProvider: 'TOPPER' }), 'administrative', 'US', 'TRANSAK'), null);
});

test('sandbox launches reject live, foreign, mixed-provider, rewritten and ambiguous checkout URLs', () => {
  const invalid = [
    directUrl.replace('global-stg', 'global'), directUrl.replace('https:', 'http:'), directUrl.replace('global-stg.transak.com', 'global-stg.transak.com.evil.test'),
    directUrl.replace('global-stg.transak.com', 'user@global-stg.transak.com'), directUrl.replace('global-stg.transak.com', 'global-stg.transak.com:443'),
    directUrl.replace('/?', '/checkout?'), `${directUrl}#`, `${directUrl}#complete`, `${directUrl}&sessionId=second`, `${directUrl}&apiKey=second`,
    `${directUrl}&walletAddress=${walletAddress}`, `${directUrl}&redirectUrl=https://evil.test`, directUrl.replace('apiKey=', '%61piKey='),
    directUrl.replace('sessionId=synthetic.session.value', 'sessionId='), directUrl.replace('synthetic.session.value', 'bad%0a'),
    ` ${directUrl}`, directUrl.replace('https://', 'https:\\\\'), 'https://checkout.banxa-sandbox.com/?token=synthetic',
    'https://checkout.banxa.com/?token=synthetic', 'https://meldcrypto.com/?token=synthetic',
  ];
  for (const checkoutUrl of invalid) {
    assert.equal(sandboxCheckoutUrl(checkoutUrl, 'TRANSAK'), null, checkoutUrl.split('?')[0]);
    assert.equal(fundingAcknowledgement(ack({ checkoutUrl }), 'administrative', 'US', 'TRANSAK'), null);
  }
});

test('legacy Meld sandbox acknowledgements remain usable and new provider metadata cannot cross the selected provider', () => {
  const legacy = ack({ serviceProvider: undefined, checkoutUrl: fallbackUrl });
  assert.equal(fundingAcknowledgement(legacy, 'administrative').checkoutUrl, fallbackUrl);
  assert.equal(fundingAcknowledgement(legacy, 'administrative', 'US', 'BANXA').checkoutUrl, fallbackUrl);
  assert.equal(fundingAcknowledgement(ack({ serviceProvider: 'BANXA', checkoutUrl: fallbackUrl }), 'administrative', 'US', 'BANXA').serviceProvider, 'BANXA');
  assert.equal(fundingAcknowledgement(ack({ checkoutUrl: fallbackUrl }), 'administrative', 'US', 'BANXA'), null);
  assert.equal(sandboxCheckoutUrl(fallbackUrl.replace('sb.meldcrypto.com', 'sb.meldcrypto.com:443')), null);
});

test('administrative BFF binds the direct provider response to the requested native order and never exposes raw Meld session fields', async () => {
  let calls = 0;
  const response = await handleWalletFunding(request(), 'administrative', { env, serviceRequest: async (url, options) => {
    calls++; assert.equal(url, 'https://auth.core.internal/api/member/wallet-funding/administrative/session');
    assert.deepEqual(JSON.parse(options.body), input);
    return { ok: true, data: ack({ token: 'synthetic-secret-not-projected', serviceProviderWidgetUrl: 'https://evil.test', customerId: 'private-customer' }) };
  } });
  assert.equal(calls, 1); assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.deepEqual(await response.json(), ack());
  for (const changes of [{ serviceProvider: 'BANXA' }, { requestedAmount: 101 }, { sourceCurrencyCode: 'MXN' }, { checkoutReference: 'd8a4c010-cc33-44da-a297-8b3c6440f492' }]) {
    const failed = await handleWalletFunding(request(), 'administrative', { env, serviceRequest: async () => ({ ok: true, data: ack(changes) }) });
    assert.equal(failed.status, 502);
  }
});

test('browser client and administrative launcher preserve the exact backend URL and reject mismatched or cancelled sessions without retry', async t => {
  const calls = [], opened = [];
  t.mock.method(globalThis, 'fetch', async (path, options) => { calls.push({ path, options }); return Response.json(ack()); });
  const result = await createAdministrativeSandboxSession(input);
  assert.equal(result.checkoutUrl, directUrl); assert.equal(result.serviceProvider, 'TRANSAK'); assert.equal(calls.length, 1);
  const launchInput = { requestId, address: walletAddress, amount: input.amount, countryCode: 'US', sourceCurrencyCode: 'USD',
    paymentMethodType: input.paymentMethodType, serviceProvider: 'TRANSAK' };
  await startAdministrativeMeldOnramp(launchInput, { createSession: async () => ack(), openCheckout: url => opened.push(url) });
  assert.deepEqual(opened, [directUrl]);
  await assert.rejects(startAdministrativeMeldOnramp(launchInput, { createSession: async () => ack({ serviceProvider: 'BANXA' }), openCheckout: () => assert.fail('wrong provider opened') }), { message: 'sandbox_unavailable' });
  const controller = new AbortController();
  await assert.rejects(startAdministrativeMeldOnramp(launchInput, { signal: controller.signal, createSession: async () => { controller.abort(); return ack(); }, openCheckout: () => assert.fail('abandoned session opened') }), { name: 'AbortError' });
  assert.equal(calls.length, 1, 'injected session checks never request another order');
});
