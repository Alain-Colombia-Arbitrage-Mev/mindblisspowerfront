import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { Keypair, Transaction, PublicKey, SystemProgram } from '@solana/web3.js';
import { createTransferCheckedInstruction, createAssociatedTokenAccountIdempotentInstruction, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { SOLANA_PERSONAL_WALLET as policy, solanaWalletLinkInput, solanaWalletLinkView, solanaPaymentView,
  solanaBalanceView, canonicalBase64, solanaAtomic, solanaBase58Bytes } from './solana-wallet-contract.mjs';
import { inspectSolanaPayment, signSolanaPayment } from './solana-payment-signing.mjs';
import { handlePersonalSolana } from './solana-wallet-bff.mjs';
import { requestSolanaWalletLink } from './solana-wallet-link-client.mjs';
import { writeSolanaPayment } from './solana-payment-client.mjs';

// Synthetic deterministic test keys. These never access an RPC or real funds.
const owner = Keypair.fromSeed(new Uint8Array(32).fill(4)), payer = Keypair.fromSeed(new Uint8Array(32).fill(7));
const address = owner.publicKey.toBase58(), feePayerAddress = payer.publicKey.toBase58();
const id = 'd8a4c010-cc33-44da-a297-8b3c6440f491';
function payment(patch = {}) {
  const mint = new PublicKey(policy.mintAddress), target = new PublicKey(policy.recipientAddress);
  const source = getAssociatedTokenAddressSync(mint, owner.publicKey), destination = getAssociatedTokenAddressSync(mint, target);
  const transaction = new Transaction({ feePayer: payer.publicKey, recentBlockhash: new PublicKey(new Uint8Array(32).fill(9)).toBase58() })
    .add(createAssociatedTokenAccountIdempotentInstruction(payer.publicKey, destination, target, mint))
    .add(createTransferCheckedInstruction(source, mint, destination, owner.publicKey, 1000000n, 6));
  const transactionBase64 = transaction.serialize({ requireAllSignatures: false }).toString('base64');
  return { paymentId: id, walletKind: 'personal', network: 'solana', cluster: 'mainnet-beta', walletAddress: address,
    mintAddress: policy.mintAddress, tokenDecimals: 6, recipientAddress: policy.recipientAddress, sourceTokenAccount: source.toBase58(), destinationTokenAccount: destination.toBase58(),
    amountAtomic: '1000000', status: 'prepared', transactionSignature: null, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 60000).toISOString(),
    blockhash: transaction.recentBlockhash, lastValidBlockHeight: '1234567', messageHash: createHash('sha256').update(transaction.serializeMessage()).digest('hex'),
    feePayerAddress, estimatedFeeLamports: '2044280', maxFeeLamports: '3000000', transactionBase64, membershipAssignment: 'pending',
    slot: null, finalizedAt: null, confirmationStatus: 'unconfirmed', ...patch };
}
const env = { NODE_ENV: 'production', AUTH_PROVIDER: 'better-auth', AUTH_PUBLIC_ORIGIN: 'https://app.mindblisspower.com',
  AUTH_BFF_SHARED_SECRET: 's'.repeat(40), BETTER_AUTH_BACKEND_URL: 'https://auth.core.internal', PERSONAL_SOLANA_ENABLED: 'true' };
function req(path, body, extra = {}) {
  return new Request(`https://app.mindblisspower.com/api/member/${path}`, { method: body ? 'POST' : 'GET',
    headers: { cookie: '__Secure-better-auth.session_token=synthetic; unrelated=private', origin: env.AUTH_PUBLIC_ORIGIN,
      'content-type': 'application/json', 'sec-fetch-site': 'same-origin', 'cf-connecting-ip': '203.0.113.1', ...extra }, ...(body ? { body: JSON.stringify(body) } : {}) });
}

test('Solana wire contract keeps address case, rejects EVM addresses, foreign fields, malformed signatures and u64 overflow', () => {
  assert.equal(solanaBase58Bytes(address).length, 32);
  assert.deepEqual(solanaWalletLinkInput('challenge', { address }), { address });
  for (const value of [{ address: address.toLowerCase() }, { address: `0x${'1'.repeat(40)}` }, { address, userId: id }]) assert.equal(solanaWalletLinkInput('challenge', value), null);
  const signature = Buffer.alloc(64, 3).toString('base64');
  assert.ok(solanaWalletLinkInput('confirm', { challengeId: id, signature }));
  assert.equal(canonicalBase64(`${signature.slice(0, -3)}B==`, { bytes: 64 }), null);
  assert.equal(solanaAtomic('18446744073709551615'), '18446744073709551615');
  for (const value of ['18446744073709551616', '01', '-1', '1.0', 1]) assert.equal(solanaAtomic(value), null);
  assert.deepEqual(solanaWalletLinkView('status', { linked: false, privateKey: 'never-exposed' }), { linked: false, address: '' });
});

test('Solana confirmed display requires finalized evidence and exact company ATA/mint', () => {
  const value = payment();
  assert.ok(solanaPaymentView(value));
  assert.equal(solanaPaymentView({ ...value, status: 'confirmed' }), null);
  for (const patch of [{ recipientAddress: address }, { destinationTokenAccount: address }, { mintAddress: address }, { cluster: 'devnet' },
    { membershipAssignment: 'active' }, { maxFeeLamports: '1' }, { amountAtomic: '0' }]) assert.equal(solanaPaymentView({ ...value, ...patch }), null);
  assert.equal(solanaBalanceView({ walletKind: 'administrative', network: 'solana' }), null);
});

test('Explicit Solana signing preserves the exact prepared message and leaves only Pimlico signature missing', async () => {
  const value = payment();
  let prompts = 0, activeChecks = 0;
  const provider = { publicKey: owner.publicKey, async signTransaction(transaction) { prompts++; transaction.partialSign(owner); return transaction; } };
  await inspectSolanaPayment(value, address);
  assert.equal(prompts, 0);
  const result = await signSolanaPayment(value, provider, address, () => { activeChecks++; });
  assert.equal(prompts, 1); assert.ok(activeChecks >= 3);
  const signed = Transaction.from(Buffer.from(result.transactionBase64, 'base64'));
  assert.equal(signed.signatures[0].signature, null); assert.ok(signed.signatures[1].signature); assert.ok(signed.verifySignatures(false));
  assert.equal(createHash('sha256').update(signed.serializeMessage()).digest('hex'), value.messageHash);
});

test('Mutations, different sender, arbitrary instructions and stale sessions cannot reach backend broadcast', async () => {
  const value = payment(); let prompts = 0;
  const honest = { publicKey: owner.publicKey, async signTransaction(transaction) { prompts++; transaction.partialSign(owner); return transaction; } };
  await assert.rejects(signSolanaPayment(value, honest, feePayerAddress));
  await assert.rejects(signSolanaPayment({ ...value, amountAtomic: '2' }, honest, address));
  await assert.rejects(signSolanaPayment(value, honest, address, () => { throw new DOMException('Aborted', 'AbortError'); }));
  assert.equal(prompts, 0);
  const tampered = Transaction.from(Buffer.from(value.transactionBase64, 'base64'));
  tampered.add(SystemProgram.transfer({ fromPubkey: payer.publicKey, toPubkey: owner.publicKey, lamports: 1 }));
  const changed = { ...value, transactionBase64: tampered.serialize({ requireAllSignatures: false }).toString('base64'), messageHash: createHash('sha256').update(tampered.serializeMessage()).digest('hex') };
  await assert.rejects(signSolanaPayment(changed, honest, address));
  const evil = { publicKey: owner.publicKey, async signTransaction(transaction) { transaction.recentBlockhash = address; transaction.partialSign(owner); return transaction; } };
  await assert.rejects(signSolanaPayment(value, evil, address));
});

test('Private Solana BFF enforces app host, native cookie, exact origin, strict input, signed forwarding and response projection', async () => {
  let calls = 0;
  const serviceRequest = async (url, init) => {
    calls++; assert.equal(url, 'https://auth.core.internal/api/member/solana-wallet-link/challenge');
    assert.equal(init.headers.cookie, '__Secure-better-auth.session_token=synthetic');
    assert.match(init.headers['x-vp-auth-signature'], /^[0-9a-f]{64}$/);
    return { ok: true, data: { linked: true, address, secret: 'do-not-expose' } };
  };
  const response = await handlePersonalSolana(req('solana-wallet-link/challenge', { address }), 'link', 'challenge', { env, serviceRequest });
  assert.deepEqual(await response.json(), { linked: true, address });
  assert.match(response.headers.get('cache-control'), /no-store/);
  for (const [request, expected, config] of [
    [req('solana-wallet-link/challenge', { address, owner: id }), 400, env],
    [req('solana-wallet-link/challenge', { address }, { origin: 'https://wallet.mindblisspower.com' }), 403, env],
    [req('solana-wallet-link/challenge', { address }, { cookie: '' }), 401, env],
    [req('solana-wallet-link/challenge', { address }), 404, { ...env, AUTH_PUBLIC_ORIGIN: 'https://wallet.mindblisspower.com' }],
    [req('solana-wallet-link/challenge', { address }, { 'content-length': '4097' }), 413, env],
  ]) assert.equal((await handlePersonalSolana(request, 'link', 'challenge', { env: config, serviceRequest })).status, expected);
  assert.equal(calls, 1);
});

test('Private BFF rejects owner selectors and mismatched receipts without disclosing upstream errors', async () => {
  const value = payment();
  const invalid = await handlePersonalSolana(req('solana-payments/status?paymentId=' + id + '&owner=other'), 'payments', 'status', { env });
  assert.equal(invalid.status, 400);
  const response = await handlePersonalSolana(req('solana-payments/prepare', { requestId: id, amountAtomic: '1' }), 'payments', 'prepare', {
    env, serviceRequest: async () => ({ ok: true, data: value }) });
  assert.equal(response.status, 502);
  const failed = await handlePersonalSolana(req('solana-payments/verify', { paymentId: id }), 'payments', 'verify', {
    env, serviceRequest: async () => ({ ok: false, status: 500, data: { error: 'secret-key-value' } }) });
  assert.deepEqual(await failed.json(), { error: 'solana_payment_unavailable' });
});

test('Browser clients never retry a possibly committed transfer and verify exact response identity', async () => {
  let calls = 0;
  await assert.rejects(writeSolanaPayment('submit', { paymentId: id, transactionBase64: payment().transactionBase64 }, {
    fetchImpl: async () => { calls++; throw new TypeError('network interrupted'); } }));
  assert.equal(calls, 1);
  await assert.rejects(requestSolanaWalletLink('challenge', { address }, { fetchImpl: async () => Response.json({ linked: true, address: feePayerAddress }) }));
  const result = await requestSolanaWalletLink('confirm', { challengeId: id, signature: Buffer.alloc(64, 3).toString('base64') }, {
    fetchImpl: async (_url, init) => { assert.equal(init.credentials, 'same-origin'); assert.equal(init.redirect, 'error'); return Response.json({ linked: true, address }); } });
  assert.deepEqual(result, { linked: true, address });
});
