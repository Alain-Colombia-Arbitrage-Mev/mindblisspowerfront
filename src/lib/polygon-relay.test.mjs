import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, createHmac } from 'node:crypto';
import { Wallet, TypedDataEncoder } from 'ethers';
import { LEGACY_POLYGON_COMPANY_PAYMENT as policy } from './personal-company-payment-values.mjs';
import { POLYGON_RELAY_DOMAIN, POLYGON_RELAY_META_FIELDS, POLYGON_RELAY_ENTRY_POINT, polygonRelayTransferCall, polygonRelayView, polygonRelayInput } from './polygon-relay-contract.mjs';
import { signPolygonRelay } from './polygon-relay-signing.mjs';
import { isPolygonRelayChain } from './polygon-relay-chain.mjs';
import { handlePolygonRelay } from './polygon-relay-bff.mjs';
import { readPolygonRelayStatus, writePolygonRelay } from './polygon-relay-client.mjs';
import { walletTransferMessages } from '../i18n/wallet-transfer-messages.js';
import { translateMessage } from '../i18n/translate.mjs';

// Synthetic fixture signer, never funded and never sent to an RPC.
const signer = new Wallet(`0x${'24'.repeat(32)}`), address = signer.address.toLowerCase();
const id = 'd8a4c010-cc33-44da-a297-8b3c6440f491', hash = `0x${'ab'.repeat(32)}`;
function payment(patch = {}) {
  const typedData = { domain: { ...POLYGON_RELAY_DOMAIN }, primaryType: 'MetaTransaction', types: { MetaTransaction: POLYGON_RELAY_META_FIELDS.map(item => ({ ...item })) },
    message: { nonce: '1', from: address, functionSignature: polygonRelayTransferCall('28433366') } };
  return { paymentId: id, walletKind: 'personal', executionMode: 'polygon_native_meta_aa', ...policy, walletAddress: address,
    amountAtomic: '28433366', status: 'prepared', authorizationNonce: '1', authorizationDigest: TypedDataEncoder.hash(typedData.domain, typedData.types, typedData.message),
    authorizationHasOnchainExpiry: false, relayerAddress: `0x${'3'.repeat(40)}`, entryPointAddress: POLYGON_RELAY_ENTRY_POINT,
    createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 60000).toISOString(), userOperationHash: null, transactionHash: null, blockNumber: null, blockHash: null,
    confirmations: 0, requiredConfirmations: 12, confirmedAt: null, failureReason: null, membershipAssignment: 'pending', typedData, ...patch };
}
const env = { NODE_ENV: 'production', AUTH_PROVIDER: 'better-auth', AUTH_PUBLIC_ORIGIN: 'https://app.mindblisspower.com',
  AUTH_BFF_SHARED_SECRET: 's'.repeat(40), BETTER_AUTH_BACKEND_URL: 'https://auth.core.internal', PERSONAL_POLYGON_RELAY_ENABLED: 'true' };
function request(path, input, extra = {}) {
  return new Request(`https://app.mindblisspower.com/api/member/polygon-relay/${path}`, { method: input ? 'POST' : 'GET',
    headers: { cookie: '__Secure-better-auth.session_token=synthetic; other=hidden', origin: env.AUTH_PUBLIC_ORIGIN,
      'content-type': 'application/json', 'sec-fetch-site': 'same-origin', 'cf-connecting-ip': '203.0.113.1', ...extra }, ...(input ? { body: JSON.stringify(input) } : {}) });
}
test('Polygon relay cannot display confirmation without UserOp and canonical receipt proof, or relabel it as direct execution', () => {
  const value = payment(); assert.ok(polygonRelayView(value));
  assert.equal(polygonRelayView({ ...value, status: 'confirmed' }), null);
  const confirmed = { ...value, status: 'confirmed', typedData: null, userOperationHash: hash, transactionHash: hash,
    blockNumber: '90000000', blockHash: hash, confirmations: 12, confirmedAt: new Date().toISOString() };
  assert.ok(polygonRelayView(confirmed));
  for (const patch of [{ confirmations: 11 }, { userOperationHash: null }, { blockHash: null }, { transactionHash: null },
    { executionMode: 'direct' }, { chainId: 1 }, { membershipAssignment: 'active' }]) assert.equal(polygonRelayView({ ...confirmed, ...patch }), null);
  for (const patch of [{ amountAtomic: '1' }, { authorizationNonce: '2' }, { recipientAddress: address }, { authorizationHasOnchainExpiry: true },
    { entryPointAddress: address }]) assert.equal(polygonRelayView({ ...value, ...patch }), null);
});
test('Polygon relay identifiers and signatures are strings, never coerced arrays or objects', () => {
  const value = payment({ typedData: null });
  const coercionTrap = { toString() { assert.fail('untrusted identifiers must not be coerced'); } };
  for (const field of ['walletAddress', 'relayerAddress', 'authorizationDigest', 'userOperationHash', 'transactionHash', 'blockHash']) {
    const expected = field.endsWith('Address') ? address : hash;
    for (const invalid of [[expected], coercionTrap, 1, true]) assert.equal(polygonRelayView({ ...value, [field]: invalid }), null, field);
  }
  const signature = `0x${'12'.repeat(65)}`;
  assert.deepEqual(polygonRelayInput('authorize', { paymentId: id, signature }), { paymentId: id, signature });
  for (const invalid of [[signature], coercionTrap, 1, true, null]) assert.equal(polygonRelayInput('authorize', { paymentId: id, signature: invalid }), null);
});
test('Polygon relay transient states cannot contain canonical receipt evidence or an inverted lifetime', () => {
  const value = payment({ typedData: null });
  for (const status of ['prepared', 'authorized', 'broadcasting', 'ambiguous', 'submitted']) {
    const pending = { ...value, status, ...(['ambiguous', 'submitted'].includes(status) ? { userOperationHash: hash } : {}) };
    assert.ok(polygonRelayView(pending), status);
    for (const patch of [{ blockHash: hash }, { blockNumber: '90000000' }, { confirmations: 12 }, { failureReason: 'transaction_mismatch' }]) {
      assert.equal(polygonRelayView({ ...pending, ...patch }), null, `${status} ${Object.keys(patch)[0]}`);
    }
    if (['prepared', 'authorized'].includes(status)) {
      for (const patch of [{ userOperationHash: hash }, { transactionHash: hash }, { confirmations: 1 }]) assert.equal(polygonRelayView({ ...pending, ...patch }), null);
    }
  }
  for (const expiresAt of [value.createdAt, new Date(Date.parse(value.createdAt) - 1).toISOString()]) {
    assert.equal(polygonRelayView({ ...value, expiresAt }), null);
  }
  for (const status of ['ambiguous', 'submitted']) assert.ok(polygonRelayView({ ...value, status, userOperationHash: hash, confirmations: 11 }));
  assert.ok(polygonRelayView({ ...value, status: 'confirmed', userOperationHash: hash, transactionHash: hash,
    blockNumber: '90000000', blockHash: hash, confirmations: 12, confirmedAt: new Date().toISOString() }));
  // A changed native nonce can require reconciliation with or without an included UserOperation.
  for (const userOperationHash of [null, hash]) assert.ok(polygonRelayView({ ...value, status: 'reconciliation_required', userOperationHash,
    blockNumber: '90000000', blockHash: hash, confirmations: 12, failureReason: 'authorization_nonce_changed' }));
});
test('BFF and browser reject malformed relay evidence once without granting a financial acknowledgement', async () => {
  const base = payment({ status: 'confirmed', typedData: null, userOperationHash: hash, transactionHash: hash,
    blockNumber: '90000000', blockHash: hash, confirmations: 12, confirmedAt: new Date().toISOString() });
  const corrupt = [
    ...['walletAddress', 'relayerAddress', 'authorizationDigest'].map(field => ({ ...base, [field]: [base[field]] })),
    { ...base, expiresAt: base.createdAt },
    { ...base, status: 'authorized', confirmedAt: null, userOperationHash: null, transactionHash: null },
    { ...base, status: 'submitted', confirmedAt: null },
  ];
  for (const data of corrupt) {
    let upstream = 0, browser = 0;
    const response = await handlePolygonRelay(request(`status?paymentId=${id}`), 'status', { env,
      serviceRequest: async () => { upstream++; return { ok: true, data }; } });
    assert.equal(response.status, 502); assert.equal(response.headers.get('set-cookie'), null);
    assert.deepEqual(await response.json(), { error: 'polygon_relay_unavailable' });
    assert.equal(upstream, 1);
    await assert.rejects(readPolygonRelayStatus(id, { fetchImpl: async () => { browser++; return Response.json(data); } }), { message: 'polygon_relay_unavailable' });
    assert.equal(browser, 1);
  }
  let writes = 0;
  await assert.rejects(writePolygonRelay('authorize', { paymentId: id, signature: [`0x${'12'.repeat(65)}`] },
    { fetchImpl: async () => { writes++; assert.fail('invalid authorization reached the transport'); } }), { message: 'invalid_request' });
  assert.equal(writes, 0);
});
test('Polygon authorization signs only the exact reviewed transfer from the bound EOA, with no RPC broadcast or SIWX', async () => {
  const value = payment(), calls = [];
  const provider = { async request(input) {
    calls.push(input.method);
    if (input.method === 'eth_chainId') return '0x89';
    if (input.method === 'eth_accounts') return [signer.address];
    if (input.method === 'eth_signTypedData_v4') {
      const payload = JSON.parse(input.params[1]);
      assert.equal(input.params[0], address); assert.equal(payload.message.functionSignature, polygonRelayTransferCall('28433366'));
      return signer.signTypedData(value.typedData.domain, value.typedData.types, value.typedData.message);
    }
    assert.fail(`Unapproved wallet action ${input.method}`);
  } };
  const result = await signPolygonRelay(value, provider, address);
  assert.equal(result.paymentId, id); assert.match(result.signature, /^0x[0-9a-f]{130}$/);
  assert.equal(calls.filter(method => method === 'eth_signTypedData_v4').length, 1);
  assert.ok(!calls.some(method => /send|requestAccounts|personal_sign/.test(method)));
});
test('Wrong domain, different wallet/network, stale ownership and altered authorization digest stop before a signature request', async () => {
  let prompts = 0;
  const provider = { request: async ({ method }) => { if (method === 'eth_chainId') return '0x1'; if (method === 'eth_accounts') return [address]; prompts++; throw new Error('unexpected'); } };
  await assert.rejects(signPolygonRelay(payment(), provider, address));
  await assert.rejects(signPolygonRelay(payment({ authorizationDigest: hash }), provider, address));
  await assert.rejects(signPolygonRelay(payment(), provider, address, () => { throw new DOMException('Aborted', 'AbortError'); }));
  const changed = payment(); changed.typedData.domain.name = 'Untrusted';
  await assert.rejects(signPolygonRelay(changed, provider, address));
  assert.equal(prompts, 0);
});
test('Polygon signer accepts only explicit mainnet chain formats without coercing untrusted values', async () => {
  const valid = [137, '137', '0x89', 'eip155:137'];
  const invalid = [1, '0x1', null, undefined, NaN, Infinity, true, 137n, '0137', '0x089', '0X89', '137 ', 'eip155:0137', ['137'],
    { valueOf() { throw new Error('must not coerce'); }, toString() { throw new Error('must not coerce'); } }];
  for (const chain of [...valid, ...invalid]) {
    const value = payment(); let prompts = 0;
    const provider = { async request({ method }) {
      if (method === 'eth_chainId') return chain;
      if (method === 'eth_accounts') return [address];
      assert.equal(method, 'eth_signTypedData_v4'); prompts++;
      return signer.signTypedData(value.typedData.domain, value.typedData.types, value.typedData.message);
    } };
    if (valid.includes(chain)) {
      assert.equal(isPolygonRelayChain(chain), true);
      assert.equal((await signPolygonRelay(value, provider, address)).paymentId, id); assert.equal(prompts, 1);
    } else {
      assert.equal(isPolygonRelayChain(chain), false);
      await assert.rejects(signPolygonRelay(value, provider, address), { message: 'polygon_relay_network_mismatch' }); assert.equal(prompts, 0);
    }
  }
});
test('a chain change while a typed signature is pending discards the authorization', async () => {
  const value = payment(); let chain = 137, prompts = 0;
  const provider = { async request({ method }) {
    if (method === 'eth_chainId') return chain;
    if (method === 'eth_accounts') return [address];
    assert.equal(method, 'eth_signTypedData_v4'); prompts++; chain = 1;
    return signer.signTypedData(value.typedData.domain, value.typedData.types, value.typedData.message);
  } };
  await assert.rejects(signPolygonRelay(value, provider, address), { message: 'polygon_relay_network_mismatch' });
  assert.equal(prompts, 1);
});
test('Relay BFF keeps all credentials private and validates the exact intent before projecting safe results', async () => {
  let calls = 0;
  const serviceRequest = async (url, init) => {
    calls++; assert.equal(url, 'https://auth.core.internal/api/member/polygon-relay/prepare');
    assert.equal(init.headers.cookie, '__Secure-better-auth.session_token=synthetic'); assert.match(init.headers['x-vp-auth-signature'], /^[a-f0-9]{64}$/);
    assert.deepEqual(JSON.parse(init.body), { requestId: id, amountAtomic: '28433366' });
    return { ok: true, data: { ...payment(), encryptionKey: 'never expose', pimlicoKey: 'never expose' } };
  };
  const result = await handlePolygonRelay(request('prepare', { requestId: id, amountAtomic: '28433366' }), 'prepare', { env, serviceRequest });
  assert.equal(result.status, 200); assert.match(result.headers.get('cache-control'), /no-store/);
  assert.ok(!JSON.stringify(await result.json()).includes('never expose'));
  for (const [req, status] of [[request('prepare', { requestId: id, amountAtomic: '1', recipientAddress: address }), 400],
    [request('prepare', { requestId: id, amountAtomic: '1' }, { origin: 'https://wallet.mindblisspower.com' }), 403],
    [request('prepare', { requestId: id, amountAtomic: '1' }, { cookie: '' }), 401],
    [request('prepare', { requestId: id, amountAtomic: '1' }, { 'content-length': '4097' }), 413]]) {
    assert.equal((await handlePolygonRelay(req, 'prepare', { env, serviceRequest })).status, status);
  }
  assert.equal(calls, 1);
});
test('Relay transport never retries submit or authorization after timeout and rejects owner selectors', async () => {
  let calls = 0;
  for (const [action, input] of [['submit', { paymentId: id }], ['authorize', { paymentId: id, signature: `0x${'12'.repeat(65)}` }]]) {
    await assert.rejects(writePolygonRelay(action, input, { fetchImpl: async () => { calls++; throw new TypeError('interrupted'); } }));
  }
  assert.equal(calls, 2);
  const result = await handlePolygonRelay(request(`status?paymentId=${id}&owner=other`), 'status', { env }); assert.equal(result.status, 400);
});
test('Relay status signs the pathname expected by real backend middleware while forwarding and correlating the exact UUID query', async () => {
  const response = await handlePolygonRelay(request(`status?paymentId=${id}`), 'status', { env,
    serviceRequest: async (url, init) => {
      assert.equal(url, `https://auth.core.internal/api/member/polygon-relay/status?paymentId=${id}`);
      const sha = value => createHash('sha256').update(value).digest('hex');
      const signed = ['GET', '/api/member/polygon-relay/status', init.headers['x-vp-auth-timestamp'], '203.0.113.1', sha(init.headers.cookie), sha('')].join('\n');
      assert.equal(init.headers['x-vp-auth-signature'], createHmac('sha256', env.AUTH_BFF_SHARED_SECRET).update(signed).digest('hex'));
      return { ok: true, data: payment() };
    } });
  assert.equal(response.status, 200); assert.equal((await response.json()).paymentId, id);
});

test('both browser client and BFF reject valid but crossed prepare UUIDs or amounts and never retry the mutation', async () => {
  for (const patch of [{ paymentId: '22222222-2222-4222-8222-222222222222' }, { amountAtomic: '1000000' }]) {
    const crossed = payment(patch);
    crossed.typedData.message.functionSignature = polygonRelayTransferCall(crossed.amountAtomic);
    crossed.authorizationDigest = TypedDataEncoder.hash(crossed.typedData.domain, crossed.typedData.types, crossed.typedData.message);
    assert.ok(polygonRelayView(crossed), 'the crossed reply must be valid independently of request correlation');
    const input = { requestId: id, amountAtomic: '28433366' }; let upstream = 0, browser = 0;
    const response = await handlePolygonRelay(request('prepare', input), 'prepare', { env,
      serviceRequest: async () => { upstream++; return { ok: true, data: crossed }; } });
    assert.equal(response.status, 502); assert.equal(upstream, 1);
    await assert.rejects(writePolygonRelay('prepare', input, { fetchImpl: async () => { browser++; return Response.json(crossed); } }),
      { message: 'polygon_relay_unavailable' });
    assert.equal(browser, 1);
  }
});
test('Transfer instructions and the no-expiry authorization disclosure exist in all supported languages', () => {
  const keys = Object.keys(walletTransferMessages.es.walletTransfer).sort();
  for (const locale of ['es', 'en', 'ar', 'zh']) {
    assert.deepEqual(Object.keys(walletTransferMessages[locale].walletTransfer).sort(), keys);
    for (const key of keys) assert.notEqual(translateMessage(locale, `walletTransfer.${key}`), `walletTransfer.${key}`);
    if (locale !== 'es') assert.notEqual(walletTransferMessages[locale].walletTransfer.authorizationCopy, walletTransferMessages.es.walletTransfer.authorizationCopy);
  }
});
