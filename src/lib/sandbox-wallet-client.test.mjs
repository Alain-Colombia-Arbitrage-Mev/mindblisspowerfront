import assert from 'node:assert/strict';
import test from 'node:test';
import { SANDBOX_WALLET_PATH as base, sandboxWalletCapabilities, sandboxWalletStatus, sandboxWalletChallenge, sandboxWalletFundingInput,
  sandboxWalletAcknowledgement } from './sandbox-wallet-contract.mjs';
import { readSandboxWalletCapabilities, readSandboxWalletStatus, requestSandboxWalletChallenge, verifySandboxWallet, readSandboxWalletOptions,
  createSandboxWalletCheckout, readSandboxWalletFundingStatus, readSandboxWalletFundingHistory } from './sandbox-wallet-client.mjs';
import { sandboxSubject as ownerSubject, sandboxAddress as address, sandboxOtherAddress as other, sandboxReference as reference,
  sandboxOtherReference as otherReference, sandboxSignature as signature, sandboxCapability as capability, sandboxStatus as state,
  sandboxChallenge as challenge, sandboxFundingInput as input, sandboxAck as ack, sandboxOptions as options,
  sandboxFundingStatus as status, sandboxHistory as history, sandboxProofConfirmations } from './sandbox-wallet-test-fixtures.mjs';

test('new sandbox contracts forbid production, broadcasting, changed chain/provider and malformed ownership messages', () => {
  assert.deepEqual(sandboxWalletCapabilities(capability), capability); assert.deepEqual(sandboxWalletStatus(state), state);
  for (const patch of [{ canBroadcast: true }, { chainId: 1 }, { environment: 'production' }, { serviceProvider: 'BANXA' }]) assert.equal(sandboxWalletCapabilities({ ...capability, ...patch }), null);
  const value = challenge(); assert.deepEqual(sandboxWalletChallenge(value, address), value);
  for (const patch of [{ message: value.message + '\n' }, { address: other }, { chainId: 1 }, { expiresAt: value.issuedAt },
    { message: value.message.replace('No transaction or transfer of funds.', 'Transfer all funds.') }]) assert.equal(sandboxWalletChallenge({ ...value, ...patch }, address), null);
});
test('browser requires mounted owner on every route and sends no writable destination/provider/chain fields', async t => {
  const calls = []; const proof = challenge();
  t.mock.method(globalThis, 'fetch', async (path, init) => { calls.push({ path, init });
    return Response.json(path.endsWith('/capabilities') ? capability : path.endsWith('/challenge') ? proof : path.includes('/funding/options?') ? options
      : path.endsWith('/funding/session') ? ack : path.includes('/funding/status?') ? status : path.endsWith('/funding/history') ? history : state); });
  const context = { ownerSubject };
  await readSandboxWalletCapabilities(context); await readSandboxWalletStatus(context); await requestSandboxWalletChallenge(address, context);
  await verifySandboxWallet({ challengeId: reference, signature }, address, context); await readSandboxWalletOptions('US', 'TRANSAK', context);
  await createSandboxWalletCheckout(input, address, context); await readSandboxWalletFundingStatus(reference, context); await readSandboxWalletFundingHistory(context);
  assert.equal(calls.length, 8); assert.ok(calls.every(call => call.path.startsWith(base + '/') && call.init.headers['x-mindbliss-sandbox-subject'] === encodeURIComponent(ownerSubject)
    && call.init.credentials === 'same-origin' && call.init.cache === 'no-store' && call.init.redirect === 'error'));
  assert.deepEqual(JSON.parse(calls[2].init.body), { address }); assert.deepEqual(JSON.parse(calls[3].init.body), { challengeId: reference, signature });
  assert.deepEqual(JSON.parse(calls[5].init.body), input);
  for (const fn of [() => readSandboxWalletCapabilities(), () => readSandboxWalletStatus(), () => requestSandboxWalletChallenge(address),
    () => verifySandboxWallet({ challengeId: reference, signature }, address), () => readSandboxWalletOptions('US', 'TRANSAK'),
    () => createSandboxWalletCheckout(input, address), () => readSandboxWalletFundingStatus(reference), () => readSandboxWalletFundingHistory()]) await assert.rejects(fn, /unauthenticated/);
  assert.equal(calls.length, 8);
});
test('strict new funding input cannot inject destination, production provider or unsupported source context', () => {
  assert.deepEqual(sandboxWalletFundingInput(input), input);
  for (const patch of [{ walletAddress: other }, { serviceProvider: 'BANXA' }, { chainId: 1 }, { subject: 'foreign' }, { amount: 49.99 },
    { country: 'GB' }, { country: 'CO', sourceCurrencyCode: 'MXN' }, { sourceCurrencyCode: 'COP' }, { paymentMethodType: 'SPEI' },
    { country: 'MX', sourceCurrencyCode: 'MXN', amount: 10000000.01 }]) assert.equal(sandboxWalletFundingInput({ ...input, ...patch }), null);
});
test('checkout rejects crossed request/amount/source/merchant URL and connected address without retrying', async t => {
  let calls = 0;
  for (const patch of [{ checkoutReference: otherReference }, { requestedAmount: 100 }, { sourceCurrencyCode: 'MXN' },
    { destination: { ...ack.destination, address: other } }, { serviceProvider: 'BANXA' }, { checkoutUrl: 'https://global.transak.com/?apiKey=x&sessionId=y' },
    { checkoutUrl: 'https://global-stg.transak.com/?apiKey=x&sessionId=y&redirect=https://evil.example' }]) {
    const value = { ...ack, ...patch }; t.mock.method(globalThis, 'fetch', async () => { calls++; return Response.json(value); });
    await assert.rejects(createSandboxWalletCheckout(input, address, { ownerSubject }));
  }
  assert.equal(calls, 7); assert.ok(sandboxWalletAcknowledgement(ack, input));
});
test('status and options are correlated to request; cancellation and safe server failures do not retry or change ledgers', async t => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; return Response.json({ ...status, checkoutReference: otherReference }); });
  await assert.rejects(readSandboxWalletFundingStatus(reference, { ownerSubject }));
  t.mock.method(globalThis, 'fetch', async () => { calls++; return Response.json({ ...options, country: 'MX' }); });
  await assert.rejects(readSandboxWalletOptions('US', 'TRANSAK', { ownerSubject }));
  t.mock.method(globalThis, 'fetch', async () => { calls++; return Response.json({ error: 'sandbox_wallet_address_in_use' }, { status: 409 }); });
  await assert.rejects(createSandboxWalletCheckout(input, address, { ownerSubject }), /sandbox_wallet_address_in_use/);
  assert.equal(calls, 3);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(readSandboxWalletStatus({ ownerSubject, signal: controller.signal }), { name: 'AbortError' }); assert.equal(calls, 3);
});
test('actual Native pending, confirmed and failed proof DTOs pass browser status/history without an invented nested provider field', async t => {
  let calls = 0;
  for (const confirmation of sandboxProofConfirmations) {
    assert.equal(confirmation.serviceProvider, undefined);
    t.mock.method(globalThis, 'fetch', async (path, init) => { calls++; assert.equal(init.method, 'GET');
      return Response.json(path.includes('/funding/status?') ? { ...status, confirmation }
        : { ...history, records: [{ ...history.records[0], confirmation }] }); });
    const checked = await readSandboxWalletFundingStatus(reference, { ownerSubject }); assert.deepEqual(checked.confirmation, confirmation);
    const cached = await readSandboxWalletFundingHistory({ ownerSubject }); assert.deepEqual(cached.records[0].confirmation, confirmation);
    assert.equal(cached.settlement, 'unconfirmed'); assert.equal(checked.confirmation.testMode, true);
  }
  assert.equal(calls, 6);
});
test('explicit foreign provider on Native status or cached test evidence is rejected without reinterpretation or retry', async t => {
  let calls = 0;
  for (const confirmation of sandboxProofConfirmations) {
    const crossed = { ...confirmation, serviceProvider: 'BANXA' };
    t.mock.method(globalThis, 'fetch', async path => { calls++; return Response.json(path.includes('/funding/status?') ? { ...status, confirmation: crossed }
      : { ...history, records: [{ ...history.records[0], confirmation: crossed }] }); });
    await assert.rejects(readSandboxWalletFundingStatus(reference, { ownerSubject }));
    await assert.rejects(readSandboxWalletFundingHistory({ ownerSubject }));
  }
  assert.equal(calls, 6);
});
