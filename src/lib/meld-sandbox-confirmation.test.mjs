import assert from 'node:assert/strict';
import test from 'node:test';
import { fundingConfirmation, fundingStatus, fundingHistory } from './wallet-funding-contract.mjs';
import { readWalletFundingStatus, readWalletFundingHistory } from './wallet-funding-client.mjs';
import { handleWalletFunding } from './wallet-funding-bff.mjs';

const reference = 'd8a4c010-cc33-44da-a297-8b3c6440f491', otherReference = 'd8a4c010-cc33-44da-a297-8b3c6440f492';
const destination = { address: `0x${'a'.repeat(40)}`, asset: 'USDT', network: 'polygon', chainId: 137 };
const proof = (changes = {}) => ({ state: 'confirmed', source: 'meld_sandbox_api', testMode: true, transactionId: 'synthetic-transaction.1', providerStatus: 'SETTLED',
  receivedAmount: '97.123456', confirmedAt: '2026-11-12T15:10:00.000Z', ...changes });
const status = (changes = {}) => ({ walletKind: 'administrative', environment: 'sandbox', provider: 'meld', checkoutReference: reference, requestedAmount: 200,
  sourceCurrencyCode: 'MXN', paymentMethodType: 'CREDIT_DEBIT_CARD', country: 'MX', requestStatus: 'session_created', destination, confirmation: proof(), ...changes });
const record = (changes = {}) => ({ checkoutReference: reference, requestedAmount: 200, sourceCurrencyCode: 'MXN', paymentMethodType: 'CREDIT_DEBIT_CARD', country: 'MX',
  status: 'session_created', createdAt: '2026-11-12T15:00:00.000Z', provider: 'meld', destination, ...changes });
const history = records => ({ walletKind: 'administrative', environment: 'sandbox', settlement: 'unconfirmed', records });
const env = { AUTH_PROVIDER: 'better-auth', AUTH_BFF_SHARED_SECRET: 's'.repeat(32), AUTH_PUBLIC_ORIGIN: 'https://wallet.mindblisspower.com',
  BETTER_AUTH_BACKEND_URL: 'https://auth.core.internal', NODE_ENV: 'production' };
const request = (path = `/api/member/wallet-funding/administrative/status?checkoutReference=${reference}`) => new Request(`${env.AUTH_PUBLIC_ORIGIN}${path}`, { headers: { cookie: 'better-auth.session_token=synthetic-session' } });

test('only the exact correlated sandbox API proof confirms a test and preserves received USDT separately from requested fiat', () => {
  const safe = fundingStatus(status({ token: 'must-not-project', commission: 2 }), 'administrative');
  assert.equal(safe.requestedAmount, 200); assert.equal(safe.sourceCurrencyCode, 'MXN'); assert.deepEqual(safe.confirmation, proof());
  assert.deepEqual(safe.destination, destination); assert.equal(safe.commission, undefined); assert.equal(safe.token, undefined);
  assert.equal(safe.confirmation.testMode, true);
});

test('Meld canonical states map to four sandbox states without translating unknown statuses into success', () => {
  const pending = ['PENDING_CREATED', 'PENDING', 'PROCESSING', 'AUTHORIZED', 'ACCEPTED', 'PARTIALLY_SETTLED', 'SETTLING', 'TWO_FA_REQUIRED', 'TWO_FA_PROVIDED', 'ERROR'];
  const failed = ['FAILED', 'DECLINED', 'CANCELLED', 'REFUNDED', 'VOIDED', 'AUTHORIZATION_EXPIRED'];
  for (const [state, values] of [['pending', pending], ['failed', failed]]) for (const providerStatus of values) {
    const value = { state, source: 'meld_sandbox_api', testMode: true, transactionId: 'synthetic-tx', providerStatus };
    assert.deepEqual(fundingConfirmation(value, 'administrative'), value);
  }
  for (const providerStatus of ['SUCCESS', 'COMPLETE', 'PENDING CREATED', '', 'SETTLED ']) assert.equal(fundingConfirmation(proof({ providerStatus }), 'administrative'), null);
});

test('malformed, swapped and browser-claimed proofs never confirm sandbox funding', () => {
  const invalid = [
    { source: 'return_url' }, { source: 'postMessage' }, { source: 'webhook' }, { source: 'none' }, { testMode: false }, { providerStatus: 'PENDING' },
    { state: 'pending' }, { transactionId: '' }, { transactionId: 'x'.repeat(129) }, { transactionId: 'foreign\ntransaction' },
    { receivedAmount: 97 }, { receivedAmount: '0' }, { receivedAmount: '0.000000' }, { receivedAmount: '-1' }, { receivedAmount: '1e2' }, { receivedAmount: '1.0000001' },
    { receivedAmount: '001.5' }, { confirmedAt: '2026-02-30T15:10:00Z' }, { confirmedAt: '2026-11-12' }, { confirmedAt: undefined },
  ];
  for (const changes of invalid) assert.equal(fundingStatus(status({ confirmation: proof(changes) }), 'administrative'), null);
  for (const changes of [{ environment: 'production' }, { walletKind: 'personal' }, { provider: 'reown' }, { destination: { ...destination, network: 'ethereum', chainId: 1 } }]) {
    assert.equal(fundingStatus(status(changes), 'administrative'), null);
  }
  const none = { state: 'unconfirmed', source: 'none', testMode: true };
  assert.deepEqual(fundingStatus(status({ confirmation: none, paid: true, success: true, checkoutUrl: '?status=success' }), 'administrative').confirmation, none);
});

test('cached administrative history accepts optional verified test results without declaring real settlement or changing legacy records', () => {
  const old = record(), checked = record({ checkoutReference: otherReference, confirmation: proof() });
  const safe = fundingHistory(history([old, checked]), 'administrative');
  assert.equal(safe.settlement, 'unconfirmed'); assert.equal(safe.records[0].confirmation, undefined); assert.deepEqual(safe.records[1].confirmation, proof());
  assert.equal(safe.records[1].sourceCurrencyCode, 'MXN'); assert.equal(safe.records[1].requestedAmount, 200);
  assert.equal(fundingHistory({ ...history([checked]), settlement: 'confirmed' }, 'administrative'), null);
  for (const changes of [{ destination: undefined }, { destination: { ...destination, network: 'ethereum', chainId: 1 } }, { provider: 'reown' }, { confirmation: proof({ testMode: false }) }]) {
    assert.equal(fundingHistory(history([record({ confirmation: proof(), ...changes })]), 'administrative'), null);
  }
});

test('personal status and history cannot acquire administrative test confirmation or a production settlement bypass', () => {
  const personal = { ...status(), walletKind: 'personal', environment: 'production', provider: 'reown', requestedAmount: 100, sourceCurrencyCode: 'USD', country: 'US', requestStatus: 'initiated' };
  assert.equal(fundingStatus(personal, 'personal'), null);
  assert.equal(fundingStatus({ ...personal, confirmation: proof({ testMode: false }) }, 'personal'), null);
  const legacy = { state: 'unconfirmed', source: 'none', testMode: false };
  assert.deepEqual(fundingStatus({ ...personal, confirmation: legacy }, 'personal').confirmation, legacy);
  const personalHistory = { walletKind: 'personal', environment: 'production', settlement: 'unconfirmed', records: [{ ...record(), country: 'US', requestedAmount: 100,
    sourceCurrencyCode: 'USD', provider: 'reown', status: 'initiated', confirmation: proof() }] };
  assert.equal(fundingHistory(personalHistory, 'personal').records[0].confirmation, undefined, 'personal history preserves its existing projection');
});

test('native BFF and browser reads bind verified status to the exact owned reference and never trust success query parameters', async t => {
  let calls = 0;
  const response = await handleWalletFunding(request(), 'administrative-status', { env, serviceRequest: async url => {
    calls++; assert.equal(url, `https://auth.core.internal/api/member/wallet-funding/administrative/status?checkoutReference=${reference}`); return { ok: true, data: status() };
  } });
  assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'private, no-store'); assert.deepEqual((await response.json()).confirmation, proof());
  const wrong = await handleWalletFunding(request(), 'administrative-status', { env, serviceRequest: async () => ({ ok: true, data: status({ checkoutReference: otherReference }) }) });
  assert.equal(wrong.status, 502);
  const injected = await handleWalletFunding(request(`/api/member/wallet-funding/administrative/status?checkoutReference=${reference}&success=true`), 'administrative-status', { env,
    serviceRequest: async () => assert.fail('browser success parameters cannot start reconciliation') });
  assert.equal(injected.status, 400); assert.equal(calls, 1);
  t.mock.method(globalThis, 'fetch', async () => Response.json(status()));
  assert.deepEqual((await readWalletFundingStatus('administrative', reference)).confirmation, proof());
});

test('history uses a native cached read and retains test proof without opening a checkout or querying a provider', async t => {
  let calls = 0;
  const value = history([record({ confirmation: proof() })]);
  const response = await handleWalletFunding(request('/api/member/wallet-funding/history?walletKind=administrative'), 'history', { env,
    serviceRequest: async url => { calls++; assert.equal(url, 'https://auth.core.internal/api/member/wallet-funding/history?walletKind=administrative'); return { ok: true, data: value }; } });
  assert.equal(calls, 1); assert.equal(response.status, 200); assert.equal((await response.json()).records[0].confirmation.state, 'confirmed');
  t.mock.method(globalThis, 'fetch', async (path, options) => { assert.equal(path, '/api/member/wallet-funding/history?walletKind=administrative'); assert.equal(options.method, 'GET'); return Response.json(value); });
  assert.equal((await readWalletFundingHistory('administrative')).records[0].confirmation.testMode, true);
});
