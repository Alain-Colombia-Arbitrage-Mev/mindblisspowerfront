import assert from 'node:assert/strict';
import test from 'node:test';
import { fundingInput, fundingAcknowledgement, fundingHistory, fundingStatus, personalProductionOptions,
  administrativeSandboxOptions, validFundingSourceAmount } from './wallet-funding-contract.mjs';
import { createPersonalFundingIntent, readPersonalFundingOptions, readWalletFundingHistory, readWalletFundingStatus } from './wallet-funding-client.mjs';
import { handleWalletFunding } from './wallet-funding-bff.mjs';
import { buildReownProductionOnrampUrl } from './reown-production-onramp.mjs';
import { companyAtomic, companyPaymentInput, companyPaymentView } from './company-payment-contract.mjs';
import { PERSONAL_COMPANY_PAYMENT, personalCompanyPaymentAmountAtomic } from './personal-company-payment-values.mjs';

const reference = 'd8a4c010-cc33-44da-a297-8b3c6440f491';
const address = `0x${'1'.repeat(40)}`;
const createdAt = '2026-11-11T01:00:00.000Z';
const env = { NODE_ENV: 'production', AUTH_PROVIDER: 'better-auth', AUTH_BFF_SHARED_SECRET: 's'.repeat(32),
  AUTH_PUBLIC_ORIGIN: 'https://app.mindblisspower.com', BETTER_AUTH_BACKEND_URL: 'https://auth.core.internal' };
const input = (amount, patch = {}) => ({ requestId: reference, walletAddress: address, country: 'US', sourceCurrencyCode: 'USD',
  amount, paymentMethodType: 'CREDIT_DEBIT_CARD', ...patch });
const ack = (amount, patch = {}) => ({ checkoutReference: reference, walletKind: 'personal', environment: 'production', provider: 'reown',
  status: 'initiated', requestedAmount: amount, sourceCurrencyCode: 'USD', paymentMethodType: 'CREDIT_DEBIT_CARD',
  allowedProviders: ['SWAPPED'], createdAt, ...patch });
const status = (amount, patch = {}) => ({ ...ack(amount), country: 'US', requestStatus: 'initiated',
  destination: { address, asset: 'USDT', network: 'polygon', chainId: 137 },
  confirmation: { state: 'unconfirmed', source: 'none', testMode: false }, ...patch });
const route = (serviceProvider, minimumAmount, maximumAmount, method = 'CREDIT_DEBIT_CARD') => ({ serviceProvider, paymentMethods: [
  { method, currencyCode: 'USD', minimumAmount, maximumAmount, minimumUsd: minimumAmount, maximumUsd: maximumAmount }] });
const discovery = routes => ({ walletKind: 'personal', environment: 'production', provider: 'reown', country: 'US', sourceCurrencyCode: 'USD',
  paymentMethods: [...new Set(routes.flatMap(route => route.paymentMethods.map(method => method.method)))], routes });

test('new personal USD requests, acknowledgements and locked Reown handoff agree on 30 to 15000 without a testing exception', async () => {
  const original = globalThis.fetch;
  const projectId = 'a'.repeat(32);
  const handoff = amount => buildReownProductionOnrampUrl({ providerUrl: `https://meldcrypto.com/?publicKey=synthetic&externalCustomerId=${projectId}`,
    address, projectId, checkoutReference: reference, countryCode: 'US', sourceCurrencyCode: 'USD', amount,
    paymentMethodType: 'CREDIT_DEBIT_CARD', allowedProviders: ['SWAPPED'] });
  try {
    let calls = 0;
    globalThis.fetch = async () => { calls++; assert.fail('invalid funding reached transport'); };
    for (const amount of [20, 29.99, 15000.01, 25000]) {
      assert.equal(fundingInput(input(amount), 'personal'), null);
      assert.equal(fundingAcknowledgement(ack(amount), 'personal'), null);
      await assert.rejects(createPersonalFundingIntent(input(amount)), { message: 'invalid_request' });
      assert.throws(() => handoff(amount), { message: 'reown_context_invalid' });
    }
    assert.equal(calls, 0);
    for (const amount of [30, 15000]) {
      globalThis.fetch = async (path, init) => { calls++; assert.equal(path, '/api/member/wallet-funding/personal/intent');
        assert.equal(JSON.parse(init.body).amount, amount); return Response.json(ack(amount)); };
      assert.equal((await createPersonalFundingIntent(input(amount))).requestedAmount, amount);
      const locked = new URL(handoff(amount));
      assert.equal(locked.searchParams.get('sourceAmount'), String(amount));
      assert.equal(locked.searchParams.get('sourceAmountLocked'), String(amount));
    }
    assert.equal(calls, 2);
  } finally { globalThis.fetch = original; }
});

test('old USD20, USD50 and USD25000 records survive browser and private BFF reads independently of the new request policy', async () => {
  const original = globalThis.fetch;
  try {
    for (const amount of [20, 50, 25000]) {
      const history = { walletKind: 'personal', environment: 'production', settlement: 'unconfirmed', records: [{ checkoutReference: reference,
        requestedAmount: amount, sourceCurrencyCode: 'USD', country: 'CO', status: 'initiated', createdAt, provider: 'reown', paymentMethodType: 'SKRILL' }] };
      const storedStatus = status(amount, { country: 'CO', paymentMethodType: 'SKRILL' });
      let privateReads = 0;
      globalThis.fetch = async path => {
        const isHistory = path.includes('/history?');
        const request = new Request(`${env.AUTH_PUBLIC_ORIGIN}${path}`, { headers: { cookie: 'better-auth.session_token=synthetic' } });
        return handleWalletFunding(request, isHistory ? 'history' : 'personal-status', { env, serviceRequest: async (_url, init) => {
          privateReads++; assert.equal(init.method, 'GET'); assert.equal(init.body, undefined);
          return { ok: true, data: isHistory ? history : storedStatus };
        } });
      };
      assert.equal((await readWalletFundingHistory('personal')).records[0].requestedAmount, amount);
      const persisted = await readWalletFundingStatus('personal', reference);
      assert.equal(persisted.requestedAmount, amount);
      assert.equal(persisted.confirmation.state, 'unconfirmed');
      assert.equal(privateReads, 2);
      assert.ok(fundingHistory(history, 'personal')); assert.ok(fundingStatus(storedStatus, 'personal'));
      assert.equal(Boolean(fundingInput(input(amount), 'personal')), amount === 50);
    }
  } finally { globalThis.fetch = original; }
});

test('USD discovery clamps canonical and legacy aliases together across BFF and client while respecting a higher provider floor', async () => {
  const original = globalThis.fetch;
  const raw = discovery([route('SWAPPED', 20, 25000), route('MERCURYO', 500, 20000)]);
  try {
    globalThis.fetch = async path => handleWalletFunding(new Request(`${env.AUTH_PUBLIC_ORIGIN}${path}`, {
      headers: { cookie: 'better-auth.session_token=synthetic' } }), 'personal-options', { env,
      serviceRequest: async () => ({ ok: true, data: raw }) });
    const safe = await readPersonalFundingOptions('US');
    assert.deepEqual(safe.routes.map(route => route.paymentMethods[0]), [
      { method: 'CREDIT_DEBIT_CARD', currencyCode: 'USD', minimumAmount: 30, maximumAmount: 15000, minimumUsd: 30, maximumUsd: 15000 },
      { method: 'CREDIT_DEBIT_CARD', currencyCode: 'USD', minimumAmount: 500, maximumAmount: 15000, minimumUsd: 500, maximumUsd: 15000 },
    ]);
    const unavailable = personalProductionOptions(discovery([route('SWAPPED', 20, 29)]));
    assert.deepEqual(unavailable.routes, []); assert.deepEqual(unavailable.paymentMethods, []);
    const inconsistent = structuredClone(raw);
    inconsistent.routes[0].paymentMethods[0].minimumAmount = 30;
    assert.equal(personalProductionOptions(inconsistent), null, 'stale USD aliases cannot conceal an inconsistent upstream contract');
  } finally { globalThis.fetch = original; }
});

test('MXN931/SPEI and administrative USD50 to25000 keep their own currency and bounds', () => {
  assert.equal(validFundingSourceAmount(930.99, 'personal', 'MXN'), false);
  assert.equal(validFundingSourceAmount(931, 'personal', 'MXN'), true);
  assert.equal(validFundingSourceAmount(25000, 'personal', 'MXN'), true);
  assert.ok(fundingInput(input(931, { country: 'MX', sourceCurrencyCode: 'MXN', paymentMethodType: 'SPEI' }), 'personal'));
  for (const amount of [50, 25000]) assert.ok(fundingInput({ ...input(amount), serviceProvider: 'TRANSAK' }, 'administrative'));
  assert.equal(fundingInput({ ...input(49.99), serviceProvider: 'TRANSAK' }, 'administrative'), null);
  const sandbox = administrativeSandboxOptions({ walletKind: 'administrative', environment: 'sandbox', provider: 'meld', country: 'US',
    sourceCurrencyCode: 'USD', serviceProvider: 'TRANSAK', paymentMethods: ['CREDIT_DEBIT_CARD'], routes: [route('TRANSAK', 50, 25000)] });
  assert.equal(sandbox.routes[0].paymentMethods[0].minimumAmount, 50);
  assert.equal(sandbox.routes[0].paymentMethods[0].maximumAmount, 25000);
});

test('the private BFF blocks old-range new writes before transport and admits only the exact new USD boundary amounts', async () => {
  let calls = 0;
  const send = amount => handleWalletFunding(new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/member/wallet-funding/personal/intent`, {
    method: 'POST', headers: { cookie: 'better-auth.session_token=synthetic', origin: env.AUTH_PUBLIC_ORIGIN,
      'sec-fetch-site': 'same-origin', 'content-type': 'application/json' }, body: JSON.stringify(input(amount)),
  }), 'personal', { env, serviceRequest: async (_url, init) => { calls++; const amount = JSON.parse(init.body).amount;
    assert.ok(amount >= 30 && amount <= 15000); return { ok: true, data: ack(amount) }; } });
  for (const amount of [20, 29.99, 15000.01, 25000]) assert.equal((await send(amount)).status, 400);
  assert.equal(calls, 0);
  for (const amount of [30, 15000]) assert.equal((await send(amount)).status, 200);
  assert.equal(calls, 2);
});

test('positive personal USDT transfers remain independent of fiat top-up minimums and maximums', () => {
  for (const [display, amountAtomic] of [['0.000001', '1'], ['20', '20000000'], ['25000', '25000000000']]) {
    assert.equal(personalCompanyPaymentAmountAtomic(display), amountAtomic);
    assert.equal(companyAtomic(amountAtomic), true);
    assert.ok(companyPaymentInput({ requestId: reference, amountAtomic }, 'prepare'));
    assert.ok(companyPaymentView({ paymentId: reference, walletKind: 'personal', walletAddress: address, ...PERSONAL_COMPANY_PAYMENT,
      amountAtomic, status: 'prepared', createdAt, expiresAt: '2026-11-11T01:15:00.000Z', transactionHash: null, blockHash: null,
      blockNumber: null, confirmations: 0, requiredConfirmations: 12, failureReason: null, abandonedAt: null, membershipAssignment: 'pending' }));
  }
});
