import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash, createHmac } from 'node:crypto';
import { handleSandboxWallet, walletCoreFetch } from './sandbox-wallet-bff.mjs';
import { runCloudflareRequest } from './cloudflare-runtime.mjs';
import { SANDBOX_WALLET_PATH as base, SANDBOX_WALLET_ORIGIN as origin } from './sandbox-wallet-contract.mjs';
import { sandboxSubject as ownerSubject, sandboxAddress as address, sandboxOtherAddress as other, sandboxReference as reference,
  sandboxSignature as signature, sandboxCapability as capability, sandboxStatus as state, sandboxChallenge as challenge,
  sandboxFundingInput as input, sandboxAck as ack, sandboxOptions as options, sandboxFundingStatus as status, sandboxHistory as history,
  sandboxProofConfirmations } from './sandbox-wallet-test-fixtures.mjs';

const env = { AUTH_PUBLIC_ORIGIN: origin, AUTH_PROVIDER: 'better-auth', AUTH_BFF_SHARED_SECRET: 's'.repeat(48), NODE_ENV: 'production' };
function request(action, body = undefined, headers = {}) {
  return new Request(`${origin}${base}/${action}`, { method: body === undefined ? 'GET' : 'POST', headers: {
    cookie: 'better-auth.session_token=synthetic', origin, 'sec-fetch-site': 'same-origin', 'cf-connecting-ip': '192.0.2.1',
    'x-mindbliss-sandbox-subject': encodeURIComponent(ownerSubject), ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...headers,
  }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
}
const hash = value => createHash('sha256').update(value).digest('hex');
test('BFF pins all eight routes to dedicated wallet service and forwards owner fence without treating it as identity authority', async () => {
  const proof = challenge(), cases = [['capabilities', undefined, capability], ['status', undefined, state], ['challenge', { address }, proof],
    ['verify', { challengeId: reference, signature }, state], ['funding/options?country=US&sourceCurrencyCode=USD', undefined, options],
    ['funding/session', input, ack], ['funding/status?checkoutReference=' + reference, undefined, status], ['funding/history', undefined, history]];
  let calls = 0;
  for (const [actionQuery, body, value] of cases) {
    const action = actionQuery.split('?')[0];
    const response = await handleSandboxWallet(request(actionQuery, body), action, { env, serviceRequest: async (url, init) => {
      calls++; assert.equal(url, `https://wallet.core.internal${base}/${actionQuery}`);
      const headers = new Headers(init.headers); assert.equal(headers.get('origin'), origin);
      assert.equal(headers.get('x-mindbliss-sandbox-subject'), encodeURIComponent(ownerSubject));
      assert.equal(headers.get('cookie'), 'better-auth.session_token=synthetic'); assert.equal(headers.get('x-vp-act-as'), null);
      if (body !== undefined) {
        assert.deepEqual(JSON.parse(init.body), body);
        const expected = createHmac('sha256', env.AUTH_BFF_SHARED_SECRET).update(['POST', `${base}/${action}`, headers.get('x-vp-auth-timestamp'),
          headers.get('x-vp-auth-client-ip'), hash(headers.get('cookie')), hash(init.body)].join('\n')).digest('hex');
        assert.equal(headers.get('x-vp-auth-signature'), expected);
      }
      return { ok: true, status: body === undefined || action === 'verify' ? 200 : 201, data: value };
    } });
    assert.equal(response.status, body === undefined || action === 'verify' ? 200 : 201, action);
    assert.match(response.headers.get('cache-control'), /no-store/);
  }
  assert.equal(calls, 8);
});
test('BFF rejects foreign portal/config, missing cookies, acting-as and malformed/absent owner fences before service transport', async () => {
  let calls = 0; const serviceRequest = async () => { calls++; throw Error('must not call'); };
  for (const headers of [{ 'x-mindbliss-sandbox-subject': '' }, { 'x-mindbliss-sandbox-subject': '%' }, { 'x-mindbliss-sandbox-subject': '%73ynthetic-wallet-owner' },
    { 'x-mindbliss-sandbox-subject': 'synthetic%00owner' }, { 'x-vp-act-as': '' }]) {
    assert.equal((await handleSandboxWallet(request('status', undefined, headers), 'status', { env, serviceRequest })).status, 403);
  }
  assert.equal((await handleSandboxWallet(request('status', undefined, { cookie: '' }), 'status', { env, serviceRequest })).status, 401);
  const foreign = new Request(`https://app.mindblisspower.com${base}/status`, { headers: request('status').headers });
  assert.equal((await handleSandboxWallet(foreign, 'status', { env, serviceRequest })).status, 404);
  assert.equal((await handleSandboxWallet(request('status'), 'status', { env: { ...env, AUTH_PUBLIC_ORIGIN: 'https://app.mindblisspower.com' }, serviceRequest })).status, 404);
  assert.equal((await handleSandboxWallet(request('challenge', { address }, { origin: 'https://app.mindblisspower.com' }), 'challenge', { env, serviceRequest })).status, 403);
  assert.equal(calls, 0);
});
test('strict BFF rejects address/provider/chain/owner injection and unsupported query contexts before Native calls', async () => {
  let calls = 0; const serviceRequest = async () => { calls++; throw Error('must not call'); };
  for (const body of [{ ...input, walletAddress: other }, { ...input, serviceProvider: 'BANXA' }, { ...input, chainId: 1 }, { ...input, subject: 'foreign' },
    { ...input, country: 'GB' }, { ...input, country: 'CO', sourceCurrencyCode: 'MXN' }, { ...input, paymentMethodType: 'SPEI' }]) {
    assert.equal((await handleSandboxWallet(request('funding/session', body), 'funding/session', { env, serviceRequest })).status, 400);
  }
  for (const [action, suffix] of [['status', 'status?subject=foreign'], ['funding/history', 'funding/history?address=foreign'],
    ['funding/status', `funding/status?checkoutReference=${reference}&checkoutReference=${reference}`],
    ['funding/options', 'funding/options?country=CO&sourceCurrencyCode=MXN'], ['funding/options', 'funding/options?country=GB&sourceCurrencyCode=USD']]) {
    assert.equal((await handleSandboxWallet(request(suffix), action, { env, serviceRequest })).status, 400);
  }
  assert.equal(calls, 0);
});
test('Native owner mismatch and private provider/SQL diagnostics are sanitized and never retried by BFF', async () => {
  let calls = 0;
  for (const [upstream, expected] of [['sandbox_wallet_forbidden', 'sandbox_wallet_forbidden'], ['private vendor secret must not escape', 'sandbox_wallet_unavailable']]) {
    const response = await handleSandboxWallet(request('challenge', { address }), 'challenge', { env, serviceRequest: async () => {
      calls++; return { ok: false, status: 403, data: { error: upstream, session: 'private', signature } }; } });
    assert.equal(response.status, 403); assert.deepEqual(await response.json(), { error: expected });
  }
  const failure = await handleSandboxWallet(request('funding/session', input), 'funding/session', { env, serviceRequest: async () => { calls++; throw Error('ambiguous transport'); } });
  assert.equal(failure.status, 503); assert.equal(calls, 3);
});
test('crossed challenge/quote acknowledgement or production checkout URL cannot be handed to browser', async () => {
  for (const [action, body, value] of [['challenge', { address }, { ...challenge(), address: other }],
    ['funding/session', input, { ...ack, requestedAmount: 100 }], ['funding/session', input, { ...ack, serviceProvider: 'BANXA' }],
    ['funding/session', input, { ...ack, checkoutUrl: 'https://global.transak.com/?apiKey=x&sessionId=y' }]]) {
    const response = await handleSandboxWallet(request(action, body), action, { env, serviceRequest: async () => ({ ok: true, status: 201, data: value }) });
    assert.equal(response.status, 502);
  }
});
test('default transport uses WALLET_CORE exclusively and cannot fall back to production CORE_API or public fetch', async t => {
  let walletCalls = 0, productionCalls = 0, publicCalls = 0;
  t.mock.method(globalThis, 'fetch', async () => { publicCalls++; throw Error('no public transport'); });
  const scopeEnv = { ...env, WALLET_CORE: { fetch: async (url, init) => { walletCalls++; assert.equal(String(url), `https://wallet.core.internal${base}/capabilities`);
    assert.equal(init.redirect, 'manual'); return Response.json(capability); } }, CORE_API: { fetch: async () => { productionCalls++; throw Error('no production transport'); } } };
  const response = await runCloudflareRequest(request('capabilities'), scopeEnv, { waitUntil() {} }, req => handleSandboxWallet(req, 'capabilities'));
  assert.equal(response.status, 200); assert.deepEqual(await response.json(), capability);
  const missing = await runCloudflareRequest(request('capabilities'), { ...scopeEnv, WALLET_CORE: undefined }, { waitUntil() {} }, req => handleSandboxWallet(req, 'capabilities'));
  assert.equal(missing.status, 503); await missing.json();
  await assert.rejects(walletCoreFetch(`https://wallet.core.internal${base}/capabilities`));
  assert.deepEqual([walletCalls, productionCalls, publicCalls], [1, 0, 0]);
});
test('BFF preserves actual Native pending, confirmed and failed sandbox proof DTOs without requiring a nested provider echo', async () => {
  let calls = 0;
  for (const confirmation of sandboxProofConfirmations) for (const action of ['funding/status', 'funding/history']) {
    assert.equal(confirmation.serviceProvider, undefined);
    const isStatus = action === 'funding/status', value = isStatus ? { ...status, confirmation } : { ...history, records: [{ ...history.records[0], confirmation }] };
    const response = await handleSandboxWallet(request(action + (isStatus ? `?checkoutReference=${reference}` : '')), action, { env,
      serviceRequest: async (_url, init) => { calls++; assert.equal(init.method, 'GET'); return { ok: true, status: 200, data: value }; } });
    assert.equal(response.status, 200, `${action}:${confirmation.state}`);
    const body = await response.json(); assert.deepEqual(isStatus ? body.confirmation : body.records[0].confirmation, confirmation);
    if (!isStatus) assert.equal(body.settlement, 'unconfirmed');
  }
  assert.equal(calls, 6);
});
test('BFF rejects explicit BANXA proof metadata even when the outer Transak request is otherwise valid', async () => {
  for (const confirmation of sandboxProofConfirmations) for (const action of ['funding/status', 'funding/history']) {
    const crossed = { ...confirmation, serviceProvider: 'BANXA' }, isStatus = action === 'funding/status';
    const value = isStatus ? { ...status, confirmation: crossed } : { ...history, records: [{ ...history.records[0], confirmation: crossed }] };
    const response = await handleSandboxWallet(request(action + (isStatus ? `?checkoutReference=${reference}` : '')), action, { env,
      serviceRequest: async () => ({ ok: true, status: 200, data: value }) });
    assert.equal(response.status, 502); assert.deepEqual(await response.json(), { error: 'sandbox_wallet_unavailable' });
  }
});
