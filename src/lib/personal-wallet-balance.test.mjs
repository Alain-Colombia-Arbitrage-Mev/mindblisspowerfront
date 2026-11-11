import assert from 'node:assert/strict';
import test from 'node:test';
import { personalWalletBalance, personalWalletBalances, readPersonalWalletBalance, readPersonalWalletBalances } from './personal-wallet-balance.mjs';
import { handleCompanyPayment } from './company-payment-bff.mjs';

const walletAddress = `0x${'1'.repeat(40)}`;
const snapshot = (patch = {}) => ({ walletKind: 'personal', walletAddress, chainId: 1,
  tokenAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7', tokenDecimals: 6, asset: 'USDT', network: 'ethereum',
  balanceAtomic: '10000000', nativeBalanceAtomic: '0', observedAt: '2026-11-11T02:00:00Z', ...patch });
const env = { AUTH_PROVIDER: 'better-auth', AUTH_PUBLIC_ORIGIN: 'https://app.mindblisspower.com', NODE_ENV: 'production',
  AUTH_BFF_SHARED_SECRET: 's'.repeat(32), BETTER_AUTH_BACKEND_URL: 'https://auth.core.internal', PERSONAL_COMPANY_PAYMENTS_ENABLED: 'true' };
const request = (suffix = '', method = 'GET', cookie = 'better-auth.session_token=synthetic') => new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/member/company-payments/balance${suffix}`,
  { method, headers: { cookie, 'cf-connecting-ip': '198.51.100.10' } });

const polygon = (patch = {}) => snapshot({ network: 'polygon', chainId: 137, tokenAddress: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f', balanceAtomic: '7000000', ...patch });
const dual = (entries = [snapshot(), polygon()]) => ({ walletKind: 'personal', walletAddress, balances: entries });

test('two network balances stay separate and partial RPC failure cannot erase the other chain or invent a zero', async () => {
  assert.deepEqual(personalWalletBalances(dual()), dual());
  assert.equal(personalWalletBalance(polygon()), null, 'Ethereum-only MAX endpoint must not accept Polygon');
  const unavailable = snapshot({ balanceAtomic: null, nativeBalanceAtomic: null, observedAt: null, error: 'company_payment_rpc_unavailable' });
  assert.deepEqual(personalWalletBalances(dual([unavailable, polygon()])), dual([unavailable, polygon()]));
  for (const entries of [[snapshot()], [snapshot(), snapshot()], [snapshot(), polygon({ chainId: 1 })],
    [snapshot(), polygon({ walletAddress: `0x${'2'.repeat(40)}` })], [{ ...unavailable, balanceAtomic: '0' }, polygon()]]) {
    assert.equal(personalWalletBalances(dual(entries)), null);
  }
  const result = await readPersonalWalletBalances({ fetchImpl: async (path, init) => {
    assert.equal(path, '/api/member/company-payments/balances'); assert.equal(init.method, 'GET'); return Response.json(dual());
  } });
  assert.equal(result.balances[0].balanceAtomic, '10000000'); assert.equal(result.balances[1].balanceAtomic, '7000000');
});

test('dual balance BFF accepts only the exact signed read path and strips provider data per chain', async () => {
  const req = new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/member/company-payments/balances`, { headers: { cookie: 'better-auth.session_token=synthetic', 'cf-connecting-ip': '198.51.100.10' } });
  const response = await handleCompanyPayment(req, 'balances', { env, serviceRequest: async (path, init) => {
    assert.equal(path, 'https://auth.core.internal/api/member/company-payments/balances'); assert.equal(init.method, 'GET');
    return { ok: true, data: dual([snapshot({ privateKey: 'synthetic' }), polygon()]) };
  } });
  assert.equal(response.status, 200); assert.deepEqual(await response.json(), dual());
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
});

test('read-only balance preserves all six token decimals and real zero while discarding private/ledger data', () => {
  for (const balanceAtomic of ['0', '10000000', '9007199254740993123456', ((1n << 256n) - 1n).toString()]) {
    assert.deepEqual(personalWalletBalance({ ...snapshot({ balanceAtomic }), privateKey: 'synthetic', wallet_balance_usd: 5000 }), snapshot({ balanceAtomic }));
  }
  for (const patch of [{ walletKind: 'administrative' }, { network: 'polygon' }, { chainId: 137 }, { asset: 'ETH' },
    { tokenAddress: walletAddress }, { tokenDecimals: 18 }, { walletAddress: [walletAddress] }, { balanceAtomic: 10 },
    { balanceAtomic: '01' }, { balanceAtomic: '-1' }, { balanceAtomic: (1n << 256n).toString() }, { nativeBalanceAtomic: 0 },
    { nativeBalanceAtomic: '1.0' }, { observedAt: 'invalid' }]) assert.equal(personalWalletBalance(snapshot(patch)), null);
});

test('browser balance GET needs only the existing application session, never wallet access or financial writes', async () => {
  const calls = [];
  const value = await readPersonalWalletBalance({ fetchImpl: async (url, init) => {
    calls.push({ url, init }); return Response.json(snapshot());
  } });
  assert.equal(value.balanceAtomic, '10000000');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, '/api/member/company-payments/balance');
  assert.equal(calls[0].init.method, 'GET');
  assert.equal(calls[0].init.cache, 'no-store');
  assert.equal(calls[0].init.credentials, 'same-origin');
  assert.equal(calls[0].init.redirect, 'error');
  assert.equal(calls[0].init.body, undefined);
  for (const response of [Response.json({ error: 'unauthenticated' }, { status: 401 }), Response.json(snapshot({ chainId: 137 })),
    new Response('invalid-json'), Response.json({ error: 'private-provider-detail' }, { status: 503 })]) {
    await assert.rejects(readPersonalWalletBalance({ fetchImpl: async () => response }));
  }
});

test('balance BFF authenticates an exact read-only path and validates the fixed Ethereum response', async () => {
  const calls = [];
  const response = await handleCompanyPayment(request(), 'balance', { env, serviceRequest: async (url, init) => {
    calls.push({ url, init }); return { ok: true, data: { ...snapshot(), providerSecret: 'synthetic' } };
  } });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), snapshot());
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(response.headers.get('vary'), 'Cookie');
  assert.equal(calls[0].url, 'https://auth.core.internal/api/member/company-payments/balance');
  assert.equal(calls[0].init.method, 'GET'); assert.equal(calls[0].init.body, undefined);
  const never = async () => assert.fail('invalid balance selector reached a private service');
  for (const suffix of ['?walletAddress=' + walletAddress, '?chainId=137', '?network=ethereum', '?paymentId=synthetic']) {
    assert.equal((await handleCompanyPayment(request(suffix), 'balance', { env, serviceRequest: never })).status, 400);
  }
  assert.equal((await handleCompanyPayment(request('', 'POST'), 'balance', { env, serviceRequest: never })).status, 405);
  assert.equal((await handleCompanyPayment(request('', 'GET', ''), 'balance', { env, serviceRequest: never })).status, 401);
  for (const data of [snapshot({ chainId: 137 }), snapshot({ walletKind: 'administrative' }), snapshot({ tokenDecimals: 18 })]) {
    assert.equal((await handleCompanyPayment(request(), 'balance', { env, serviceRequest: async () => ({ ok: true, data }) })).status, 502);
  }
});
