import assert from 'node:assert/strict';
import test from 'node:test';
import { fundingStatus } from './wallet-funding-contract.mjs';
import { readWalletFundingStatus } from './wallet-funding-client.mjs';
import { handleWalletFunding } from './wallet-funding-bff.mjs';

const reference = 'd8a4c010-cc33-44da-a297-8b3c6440f491';
const otherReference = 'd8a4c010-cc33-44da-a297-8b3c6440f492';
const env = { AUTH_PROVIDER: 'better-auth', AUTH_BFF_SHARED_SECRET: 's'.repeat(32),
  AUTH_PUBLIC_ORIGIN: 'https://app.example.test', BETTER_AUTH_BACKEND_URL: 'https://auth.core.internal', NODE_ENV: 'production' };
function status(kind = 'personal') {
  return { checkoutReference: reference, walletKind: kind, environment: kind === 'personal' ? 'production' : 'sandbox',
    provider: kind === 'personal' ? 'reown' : 'meld', requestedAmount: 50, country: 'CO',
    requestStatus: kind === 'personal' ? 'initiated' : 'session_created',
    destination: { address: `0x${'1'.repeat(40)}`, asset: 'USDT', network: 'polygon', chainId: 137 },
    confirmation: { state: 'unconfirmed', source: 'none', testMode: kind === 'administrative' } };
}
function request(kind, query = `checkoutReference=${reference}`, cookie = 'better-auth.session_token=synthetic') {
  return new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/member/wallet-funding/${kind}/status?${query}`, { headers: { cookie } });
}

test('persisted funding status retains each immutable destination and never promotes a checkout to payment success', () => {
  for (const kind of ['personal', 'administrative']) {
    const record = status(kind);
    assert.deepEqual(fundingStatus({ ...record, signingKey: 'private', checkoutUrl: 'https://example.invalid/?token=private',
      confirmation: { ...record.confirmation, unsignedReturnStatus: 'success' } }, kind), record);
    for (const confirmation of [{ ...record.confirmation, state: 'confirmed' }, { ...record.confirmation, state: 'pending' },
      { ...record.confirmation, source: 'query_string' }, { ...record.confirmation, testMode: !record.confirmation.testMode }]) {
      assert.equal(fundingStatus({ ...record, confirmation }, kind), null);
    }
    for (const destination of [{ ...record.destination, address: 'untrusted' }, { ...record.destination, asset: 'USDC' },
      { ...record.destination, network: 'ethereum' }, { ...record.destination, chainId: 1 }]) {
      assert.equal(fundingStatus({ ...record, destination }, kind), null);
    }
    assert.equal(fundingStatus(record, kind === 'personal' ? 'administrative' : 'personal'), null);
  }
  assert.equal(fundingStatus({ ...status(), requestStatus: 'session_created' }, 'personal'), null);
  for (const patch of [{ checkoutReference: [reference] }, { checkoutReference: `${reference}\n` }, { country: ['CO'] },
    { destination: { ...status().destination, address: [status().destination.address] } },
    { destination: { ...status().destination, address: `${status().destination.address}\n` } }]) {
    assert.equal(fundingStatus({ ...status(), ...patch }, 'personal'), null);
  }
  assert.equal(fundingStatus({ ...status('administrative'), requestStatus: 'unavailable' }, 'administrative')?.requestStatus, 'unavailable');
});

test('status BFF uses exact owner-authenticated read-only paths with no sensitive extra fields', async () => {
  for (const kind of ['personal', 'administrative']) {
    const record = status(kind);
    const response = await handleWalletFunding(request(kind), `${kind}-status`, { env, serviceRequest: async (url, init) => {
      assert.equal(url, `https://auth.core.internal/api/member/wallet-funding/${kind}/status?checkoutReference=${reference}`);
      assert.equal(init.method, 'GET'); assert.equal(init.body, undefined);
      assert.equal(init.headers.cookie, 'better-auth.session_token=synthetic');
      return { ok: true, data: { ...record, subject: 'must-not-leak', providerSessionId: 'private' } };
    } });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    assert.equal(response.headers.get('vary'), 'Cookie');
    assert.deepEqual(await response.json(), record);
  }
  const canonical = await handleWalletFunding(request('personal', `checkoutReference=${reference.toUpperCase()}`), 'personal-status', {
    env, serviceRequest: async url => {
      assert.equal(new URL(url).searchParams.get('checkoutReference'), reference);
      return { ok: true, data: status() };
    },
  });
  assert.equal(canonical.status, 200);
});

test('status BFF rejects forged callback claims, duplicate references, missing sessions and changed upstream ownership context', async () => {
  const never = async () => assert.fail('invalid request reached private backend');
  for (const query of ['', 'checkoutReference=not-a-uuid', `checkoutReference=${reference}&status=success`,
    `checkoutReference=${reference}&walletKind=administrative`, `checkoutReference=${reference}&checkoutReference=${otherReference}`]) {
    assert.equal((await handleWalletFunding(request('personal', query), 'personal-status', { env, serviceRequest: never })).status, 400);
  }
  assert.equal((await handleWalletFunding(request('personal', `checkoutReference=${reference}`, ''), 'personal-status', { env, serviceRequest: never })).status, 401);
  for (const data of [status('administrative'), { ...status(), checkoutReference: otherReference },
    { ...status(), confirmation: { state: 'confirmed', source: 'none', testMode: false } }]) {
    assert.equal((await handleWalletFunding(request('personal'), 'personal-status', { env,
      serviceRequest: async () => ({ ok: true, data }) })).status, 502);
  }
  const missing = await handleWalletFunding(request('personal'), 'personal-status', { env,
    serviceRequest: async () => ({ ok: false, status: 404, data: { error: 'wallet_funding_not_found', private: 'discard' } }) });
  assert.equal(missing.status, 404); assert.deepEqual(await missing.json(), { error: 'wallet_funding_not_found' });
});

test('browser status reads cannot mix wallets, reuse another reference or replay payment writes', async () => {
  const original = globalThis.fetch;
  const calls = [];
  try {
    globalThis.fetch = async (path, init) => { calls.push({ path, init }); return Response.json(status()); };
    assert.deepEqual(await readWalletFundingStatus('personal', reference), status());
    assert.equal(calls[0].path, `/api/member/wallet-funding/personal/status?checkoutReference=${reference}`);
    assert.equal(calls[0].init.method, 'GET'); assert.equal(calls[0].init.body, undefined);
    assert.equal(calls[0].init.credentials, 'same-origin'); assert.equal(calls[0].init.cache, 'no-store');
    assert.equal(calls[0].init.redirect, 'error');
    await assert.rejects(readWalletFundingStatus('personal', `${reference}&status=success`), { message: 'invalid_request' });
    assert.equal(calls.length, 1);
    await assert.rejects(readWalletFundingStatus('administrative', reference), { message: 'funding_unavailable' });
    globalThis.fetch = async () => Response.json({ ...status(), checkoutReference: otherReference });
    await assert.rejects(readWalletFundingStatus('personal', reference), { message: 'funding_unavailable' });
    const controller = new AbortController(); controller.abort();
    await assert.rejects(readWalletFundingStatus('personal', reference, { signal: controller.signal }), { name: 'AbortError' });
  } finally { globalThis.fetch = original; }
});
