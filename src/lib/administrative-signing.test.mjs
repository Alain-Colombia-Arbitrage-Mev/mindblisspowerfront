import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash, createHmac } from 'node:crypto';
import { ADMINISTRATIVE_SIGNING_PATH as signing, ADMINISTRATIVE_TRANSFERS_PATH as transfers, ADMINISTRATIVE_USDT_TOKEN as token,
  administrativeSignerCapabilities, administrativeSignerStatus, administrativeSignerChallenge, administrativeSignerVerification,
  administrativeUsdtAmount, administrativeTransferInput, administrativeTransferCalldata, administrativeTransferDraft,
  administrativeTransferHistory, administrativeTransferSnapshot } from './administrative-signing-contract.mjs';
import { readAdministrativeSignerCapabilities, readAdministrativeSignerStatus, createAdministrativeSignerChallenge, verifyAdministrativeSigner,
  prepareAdministrativeTransfer, readAdministrativeTransferHistory, verifyAdministrativeDraftHash } from './administrative-signing-client.mjs';
import { handleAdministrativeSigning } from './administrative-signing-bff.mjs';
import { translateMessage } from '../i18n/translate.mjs';

const reference = '11111111-1111-4111-8111-111111111111', address = `0x${'1'.repeat(40)}`, recipient = `0x${'2'.repeat(40)}`, signature = `0x${'ab'.repeat(65)}`;
const createdAt = '2026-11-12T12:00:00.000Z', expiresAt = '2026-11-12T12:05:00.000Z';
const capability = { flow: 'administrative_signing', configured: true, mode: 'external', environment: 'sandbox', chainId: 137, broadcastEnabled: false, canBroadcast: false, canPrepareOfframp: false };
const status = { ...capability, assignedAddress: address, verified: true, expiresAt: '2099-11-12T12:00:00.000Z' };
const challenge = { challengeId: reference, address, chainId: 137, method: 'personal_sign', expiresAt,
  message: `wallet.mindblisspower.com wants you to verify control of this administrative wallet:\n${address}\n\nMindbliss administrative wallet ownership only. No transaction or transfer of funds.\nSession context: ${'a'.repeat(64)}\n\nURI: https://wallet.mindblisspower.com/dashboard/wallet-administrative\nVersion: 1\nChain ID: 137\nNonce: ${'b'.repeat(64)}\nIssued At: ${createdAt}\nExpiration Time: ${expiresAt}\nRequest ID: ${reference}` };
const input = { requestId: reference, recipient, amount: '1.123456' };
const draft = { flow: 'administrative_transfer', status: 'draft', mode: 'dry_run', broadcastEnabled: false, canBroadcast: false, draftReference: reference,
  source: { address, asset: 'USDT', network: 'polygon', chainId: 137 }, recipient, amount: input.amount,
  transaction: { chainId: 137, from: address, to: token, data: administrativeTransferCalldata(recipient, input.amount), value: '0x0' },
  preparationHash: '0'.repeat(64), createdAt, expiresAt };
draft.preparationHash = createHash('sha256').update(administrativeTransferSnapshot(draft)).digest('hex');
const history = { flow: 'administrative_transfer', mode: 'dry_run', broadcastEnabled: false, canBroadcast: false, records: [draft] };
const env = { AUTH_PROVIDER: 'better-auth', AUTH_BFF_SHARED_SECRET: 's'.repeat(32), AUTH_PUBLIC_ORIGIN: 'https://wallet.mindblisspower.com', BETTER_AUTH_BACKEND_URL: 'https://auth.core.internal', NODE_ENV: 'production' };
const request = (path, body = undefined) => new Request(`${env.AUTH_PUBLIC_ORIGIN}${path}`, { method: body === undefined ? 'GET' : 'POST', headers: {
  cookie: 'better-auth.session_token=synthetic', origin: env.AUTH_PUBLIC_ORIGIN, 'sec-fetch-site': 'same-origin', 'cf-connecting-ip': '198.51.100.10', ...(body === undefined ? {} : { 'content-type': 'application/json' }),
}, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });

test('signer capability and status can never grant broadcasting or another network/environment', () => {
  assert.deepEqual(administrativeSignerCapabilities(capability), capability); assert.deepEqual(administrativeSignerStatus(status), status);
  for (const change of [{ mode: 'reown' }, { environment: 'production' }, { chainId: 1 }, { canBroadcast: true }, { broadcastEnabled: true }, { canPrepareOfframp: undefined }]) assert.equal(administrativeSignerCapabilities({ ...capability, ...change }), null);
  for (const change of [{ expiresAt: undefined }, { assignedAddress: '' }, { verified: 'true' }]) assert.equal(administrativeSignerStatus({ ...status, ...change }), null);
});

test('ownership challenge accepts only the exact administrative ownership statement, assigned address and context format', () => {
  assert.deepEqual(administrativeSignerChallenge(challenge, address), challenge);
  assert.equal(administrativeSignerChallenge(challenge, recipient), null);
  for (const message of [challenge.message.replace('No transaction or transfer of funds.', 'Authorize a transfer.'), challenge.message.replace('Chain ID: 137', 'Chain ID: 1'),
    challenge.message.replace('/dashboard/wallet-administrative', '/dashboard/wallet-personal'), challenge.message + '\n', challenge.message.replace('b'.repeat(64), 'bad_nonce')]) assert.equal(administrativeSignerChallenge({ ...challenge, message }), null);
  for (const payload of [{ challengeId: reference, signature, address }, { challengeId: reference, signature: 'bad' }, { challengeId: reference, signature, nativeSessionId: 'forged' }]) assert.equal(administrativeSignerVerification(payload), null);
  assert.ok(administrativeSignerVerification({ challengeId: reference, signature })); assert.ok(administrativeSignerVerification({ challengeId: reference, signature: `0x${'ab'.repeat(64)}` }));
});

test('USDT uses exact decimal text and BigInt atomic units, never a float or exponent', () => {
  assert.deepEqual(administrativeUsdtAmount('1.000000'), { amount: '1', amountUnits: '1000000' });
  assert.deepEqual(administrativeUsdtAmount('0.000001'), { amount: '0.000001', amountUnits: '1' });
  assert.equal(administrativeUsdtAmount('1000000000').amountUnits, '1000000000000000');
  for (const value of ['0', '0.000000', '1.0000001', '-1', '01', '1e3', '1,5', ' 1', '1000000000.000001', 1, NaN]) assert.equal(administrativeUsdtAmount(value), null);
  for (const change of [{ from: address }, { tokenAddress: token }, { chainId: 1 }, { preparationHash: 'a'.repeat(64) }, { recipient: token }, { recipient: `0x${'0'.repeat(40)}` }]) assert.equal(administrativeTransferInput({ ...input, ...change }), null);
});

test('draft has exact immutable recipient, amount, token calldata and dry-run permission with independently verified hash', async () => {
  assert.ok(administrativeTransferDraft(draft)); assert.equal(await verifyAdministrativeDraftHash(draft), true);
  for (const change of [{ canBroadcast: true }, { broadcastEnabled: true }, { mode: 'live' }, { amount: '2' }, { recipient: address }, { recipient: token }, { expiresAt: createdAt },
    { transaction: { ...draft.transaction, to: recipient } }, { transaction: { ...draft.transaction, value: '0x1' } }, { transaction: { ...draft.transaction, from: recipient } },
    { transaction: { ...draft.transaction, data: administrativeTransferCalldata(recipient, '2') } }]) assert.equal(administrativeTransferDraft({ ...draft, ...change }), null);
  assert.equal(await verifyAdministrativeDraftHash({ ...draft, preparationHash: 'f'.repeat(64) }), false);
  assert.equal(administrativeTransferHistory({ ...history, records: [draft, draft] }), null);
  assert.equal(administrativeTransferHistory({ ...history, canBroadcast: true }), null);
});

test('browser performs only exact native signer endpoints, and recipient/amount-only draft input never contains a sender or transaction', async t => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (path, init) => { calls.push({ path, init }); return Response.json(path.endsWith('/capabilities') ? capability : path.endsWith('/challenge') ? challenge : path.endsWith('/prepare') ? draft : path.endsWith('/history') ? history : status); });
  await readAdministrativeSignerCapabilities(); await readAdministrativeSignerStatus(address); await createAdministrativeSignerChallenge(address);
  await verifyAdministrativeSigner({ challengeId: reference, signature }, address); await prepareAdministrativeTransfer(input, address); await readAdministrativeTransferHistory(address);
  assert.deepEqual(calls.map(call => call.path), [`${signing}/capabilities`, `${signing}/status`, `${signing}/challenge`, `${signing}/verify`, `${transfers}/prepare`, `${transfers}/history`]);
  assert.deepEqual(JSON.parse(calls[2].init.body), {}); assert.deepEqual(JSON.parse(calls[4].init.body), input);
  assert.ok(calls.every(call => call.init.credentials === 'same-origin' && call.init.cache === 'no-store' && call.init.redirect === 'error'));
});

test('browser rejects changed owner addresses, altered draft hashes or amounts, and aborted requests without retrying', async t => {
  let calls = 0;
  for (const reply of [{ ...draft, source: { ...draft.source, address: recipient } }, { ...draft, preparationHash: 'f'.repeat(64) }, { ...draft, amount: '2' }]) {
    t.mock.method(globalThis, 'fetch', async () => { calls++; return Response.json(reply); }); await assert.rejects(prepareAdministrativeTransfer(input, address));
  }
  const controller = new AbortController(); controller.abort();
  await assert.rejects(readAdministrativeSignerCapabilities({ signal: controller.signal }), { name: 'AbortError' });
  await assert.rejects(prepareAdministrativeTransfer({ ...input, recipient: address }, address), /invalid_request/);
  assert.equal(calls, 3);
});

test('BFF pins every native path to wallet Origin, signs POST snapshots and never forwards act-as or caller ownership fields', async () => {
  let calls = 0;
  for (const [action, path, body, reply] of [['capabilities', `${signing}/capabilities`, undefined, capability], ['status', `${signing}/status`, undefined, status],
    ['challenge', `${signing}/challenge`, {}, challenge], ['verify', `${signing}/verify`, { challengeId: reference, signature }, status],
    ['prepare', `${transfers}/prepare`, input, draft], ['history', `${transfers}/history`, undefined, history]]) {
    const response = await handleAdministrativeSigning(request(path, body), action, { env, serviceRequest: async (url, init) => {
      calls++; assert.equal(url, `${env.BETTER_AUTH_BACKEND_URL}${path}`); const headers = new Headers(init.headers); assert.equal(headers.get('origin'), env.AUTH_PUBLIC_ORIGIN);
      if (body !== undefined) {
        const hash = value => createHash('sha256').update(value).digest('hex');
        assert.equal(headers.get('x-vp-auth-signature'), createHmac('sha256', env.AUTH_BFF_SHARED_SECRET).update(['POST', path, headers.get('x-vp-auth-timestamp'), headers.get('x-vp-auth-client-ip'), hash(headers.get('cookie')), hash(init.body)].join('\n')).digest('hex'));
      }
      return { ok: true, data: reply };
    } }); assert.equal(response.status, 200);
    const denied = request(path, body); denied.headers.set('x-vp-act-as', 'other'); assert.equal((await handleAdministrativeSigning(denied, action, { env })).status, 403);
  }
  assert.equal(calls, 6);
  for (const [action, path, body] of [['challenge', `${signing}/challenge`, { walletAddress: address }], ['verify', `${signing}/verify`, { challengeId: reference, signature, nativeSessionId: 'other' }],
    ['prepare', `${transfers}/prepare`, { ...input, source: recipient }]]) assert.equal((await handleAdministrativeSigning(request(path, body), action, { env, serviceRequest: () => { throw Error('must not call'); } })).status, 400);
});

test('configuration errors remain one failed request, and forged server draft hashes never become reviewable', async () => {
  let calls = 0;
  const unavailable = await handleAdministrativeSigning(request(`${signing}/challenge`, {}), 'challenge', { env, serviceRequest: async () => { calls++; return { ok: false, status: 503, data: { error: 'administrative_signing_unconfigured' } }; } });
  assert.equal(unavailable.status, 503); assert.equal(calls, 1);
  const forged = await handleAdministrativeSigning(request(`${transfers}/prepare`, input), 'prepare', { env, serviceRequest: async () => ({ ok: true, data: { ...draft, preparationHash: 'f'.repeat(64) } }) });
  assert.equal(forged.status, 502);
  const app = new Request(`https://app.mindblisspower.com${signing}/capabilities`, { headers: { cookie: 'better-auth.session_token=synthetic' } });
  assert.equal((await handleAdministrativeSigning(app, 'capabilities', { env })).status, 404);
});

test('native expired ownership and missing binding stay actionable 409 errors without a second signature or draft request', async () => {
  let calls = 0;
  for (const [action, path, body, error] of [['verify', `${signing}/verify`, { challengeId: reference, signature }, 'administrative_signing_invalid_challenge'],
    ['prepare', `${transfers}/prepare`, input, 'administrative_transfer_binding_required']]) {
    const response = await handleAdministrativeSigning(request(path, body), action, { env, serviceRequest: async () => { calls++; return { ok: false, status: 409, data: { error } }; } });
    assert.equal(response.status, 409); assert.deepEqual(await response.json(), { error });
  }
  assert.equal(calls, 2);
});

test('all signer, restoration and draft instructions are translated and label the simulation explicitly', () => {
  for (const locale of ['es', 'en', 'ar', 'zh']) for (const key of ['title', 'copy', 'verifiedInactive', 'connect', 'verify', 'simulation', 'activateFirst', 'prepare', 'draft']) assert.notEqual(translateMessage(locale, `administrativeSigning.${key}`), `administrativeSigning.${key}`);
});
