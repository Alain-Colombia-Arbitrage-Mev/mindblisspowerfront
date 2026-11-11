import assert from 'node:assert/strict';
import test from 'node:test';
import { personalProductionOptions, fundingAcknowledgement, PERSONAL_FUNDING_DESTINATION } from './wallet-funding-contract.mjs';
import { handleWalletFunding } from './wallet-funding-bff.mjs';
import { createPersonalFundingIntent, createAdministrativeSandboxSession } from './wallet-funding-client.mjs';
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
    'x-mindbliss-wallet-network': 'polygon',
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
      globalThis.fetch = async (_url, init) => {
        assert.equal(new Headers(init.headers).get('x-mindbliss-wallet-network'), 'polygon');
        return Response.json(value);
      };
      if (valid) assert.deepEqual((await createPersonalFundingIntent(input)).destination, ack.destination);
      else await assert.rejects(createPersonalFundingIntent(input), { message: 'funding_unavailable' });
    }
    assert.equal(fundingAcknowledgement({ ...ack, destinationCurrencyCode: 'USDT' }, 'personal'), null);
  } finally { globalThis.fetch = original; }
});

test('a stale personal client cannot persist a Polygon request without the exact current network header', async () => {
  let calls = 0;
  const serviceRequest = async () => { calls++; return { ok: true, data: ack }; };
  for (const network of [null, 'ethereum', 'Polygon', '137', 'polygon,ethereum']) {
    const stale = request();
    if (network === null) stale.headers.delete('x-mindbliss-wallet-network');
    else stale.headers.set('x-mindbliss-wallet-network', network);
    const response = await handleWalletFunding(stale, 'personal', { env, serviceRequest });
    assert.equal(response.status, 409); assert.equal((await response.json()).error, 'wallet_funding_network_changed');
  }
  const forged = new Request(request().url, { method: 'POST', headers: {
    cookie: 'better-auth.session_token=synthetic', origin: env.AUTH_PUBLIC_ORIGIN, 'content-type': 'application/json', 'sec-fetch-site': 'same-origin',
  }, body: JSON.stringify({ ...input, network: 'polygon', chainId: 137, destinationCurrencyCode: 'USDT_POLYGON' }) });
  assert.equal((await handleWalletFunding(forged, 'personal', { env, serviceRequest })).status, 409);
  assert.equal(calls, 0, 'no stale or body-forged request may reach persistence');
  assert.equal((await handleWalletFunding(request(), 'personal', { env, serviceRequest })).status, 200);
  assert.equal(calls, 1);
});

test('the personal client sets the network fence itself while administrative writes remain independent', async () => {
  const original = globalThis.fetch; const seen = [];
  try {
    globalThis.fetch = async (path, init) => {
      const network = new Headers(init.headers).get('x-mindbliss-wallet-network'); seen.push(network);
      if (path.includes('/personal/')) {
        assert.equal(network, 'polygon');
        return handleWalletFunding(new Request(`${env.AUTH_PUBLIC_ORIGIN}${path}`, { ...init, headers: {
          ...init.headers, cookie: 'better-auth.session_token=synthetic', origin: env.AUTH_PUBLIC_ORIGIN,
          'sec-fetch-site': 'same-origin', 'cf-connecting-ip': '198.51.100.1',
        } }), 'personal', { env, serviceRequest: async (_url, upstream) => {
          assert.equal(upstream.headers['x-mindbliss-wallet-network'], undefined, 'the fence is scoped to the browser BFF');
          return { ok: true, data: ack };
        } });
      }
      assert.equal(network, null);
      return Response.json({ checkoutReference: input.requestId, walletKind: 'administrative', environment: 'sandbox', provider: 'meld',
        status: 'session_created', requestedAmount: 50, createdAt: ack.createdAt, checkoutUrl: 'https://sb.meldcrypto.com/?token=synthetic' });
    };
    assert.deepEqual((await createPersonalFundingIntent(input)).destination, ack.destination);
    assert.equal((await createAdministrativeSandboxSession({ ...input, amount: 50, serviceProvider: 'TRANSAK' })).walletKind, 'administrative');
    assert.deepEqual(seen, ['polygon', null]);
  } finally { globalThis.fetch = original; }
});

test('retired new-funding clients receive a safe actionable network policy error', async () => {
  const response = await handleWalletFunding(request(), 'personal', { env,
    serviceRequest: async () => ({ ok: false, status: 409, data: { error: 'wallet_funding_network_changed', privateKey: 'never exposed' } }) });
  assert.equal(response.status, 409); assert.equal((await response.json()).error, 'wallet_funding_network_changed');
  assert.equal(personalFundingFailure(new Error('wallet_funding_network_changed'), 'intent'), 'network_changed');
});
