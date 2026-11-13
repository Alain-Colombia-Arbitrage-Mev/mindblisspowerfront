import assert from 'node:assert/strict';
import test from 'node:test';
import { reownWalletConnectionState as state, createReownWalletConnectionRequest, createReownWalletSwitchRequest,
  reownWalletIdentityMismatch as identityMismatch, reownWalletNeedsAccountSelection as needsSelection } from './reown-wallet-connection.mjs';

const address = `0x${'1'.repeat(40)}`, other = `0x${'2'.repeat(40)}`;
const provider = { request() { assert.fail('connection status must not request an RPC or signature'); } };
const linked = { initialized: true, isConnected: true, currentAddress: address, boundAddress: address, walletProvider: provider };

test('backend linkage does not impersonate an active wallet session and SDK restoration stays distinct from disconnection', () => {
  assert.equal(state(linked), 'connected');
  assert.equal(state({ boundAddress: address }), 'disconnected');
  assert.equal(state({ ...linked, walletProvider: undefined }), 'restoring');
  assert.equal(state({ ...linked, isConnected: false, status: 'reconnecting' }), 'restoring');
  assert.equal(state({ initialized: false, boundAddress: address }), 'restoring');
  assert.equal(state({ ...linked, currentAddress: other }), 'mismatch');
  assert.equal(state({ ...linked, boundAddress: '', walletProvider: provider }), 'connected');
});

test('opening the auth modal alone never completes connection; only the matching live account state does', async () => {
  let opened = 0, completed = 0;
  const request = createReownWalletConnectionRequest({ open: async () => { opened++; } });
  request.promise.then(() => completed++);
  await Promise.resolve(); await Promise.resolve();
  assert.equal(opened, 1); assert.equal(completed, 0);
  request.update({ status: 'restoring', modalOpen: true });
  request.update({ status: 'mismatch', modalOpen: true });
  assert.equal(completed, 0);
  request.update({ status: 'connected', modalOpen: false });
  assert.deepEqual(await request.promise, { connected: true });
  assert.equal(completed, 1);
});

test('canceling before opening suppresses the late modal and late SDK events cannot revive the operation', async () => {
  let opened = 0, settled = 0;
  const request = createReownWalletConnectionRequest({ open: () => opened++, onSettled: () => settled++ });
  const rejected = assert.rejects(request.promise, { name: 'AbortError' });
  request.cancel(); request.update({ status: 'connected', modalOpen: true });
  await rejected; await Promise.resolve();
  assert.equal(opened, 0); assert.equal(settled, 1);
});

test('an unlocked wallet restored by the SDK completes connection without opening a second authentication modal', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let opened = 0;
  const request = createReownWalletConnectionRequest({ initialState: { status: 'restoring', modalOpen: false }, open: () => opened++ });
  await Promise.resolve();
  assert.equal(opened, 0);
  request.update({ status: 'restoring', modalOpen: false });
  t.mock.timers.tick(14_000); await Promise.resolve(); assert.equal(opened, 0);
  request.update({ status: 'connected', modalOpen: false });
  assert.deepEqual(await request.promise, { connected: true });
  t.mock.timers.tick(90_000); await Promise.resolve(); assert.equal(opened, 0);
  t.mock.timers.reset();
});

test('restoration failure opens the explicit connection flow once, while its deadline and cancellation stay bounded', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let opened = 0;
  const request = createReownWalletConnectionRequest({ initialState: { status: 'restoring' }, open: () => opened++ });
  request.update({ status: 'disconnected', modalOpen: false });
  request.update({ status: 'disconnected', modalOpen: false });
  await Promise.resolve(); assert.equal(opened, 1);
  const rejected = assert.rejects(request.promise, { name: 'AbortError' }); request.cancel(); await rejected;
  const timed = createReownWalletConnectionRequest({ initialState: { status: 'restoring' }, open: () => opened++ });
  t.mock.timers.tick(15_000); await Promise.resolve(); assert.equal(opened, 2);
  const cancelled = assert.rejects(timed.promise, { name: 'AbortError' }); timed.cancel(); await cancelled;
  const stopped = createReownWalletConnectionRequest({ initialState: { status: 'restoring' }, open: () => opened++ });
  const aborted = assert.rejects(stopped.promise, { name: 'AbortError' }); stopped.cancel(); await aborted;
  t.mock.timers.tick(90_000); await Promise.resolve(); assert.equal(opened, 2);
  t.mock.timers.reset();
});

test('a closed modal releases the reconnect state without claiming authentication or changing the bound account', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const request = createReownWalletConnectionRequest({ open: async () => {} });
  const rejected = assert.rejects(request.promise, { name: 'AbortError' });
  await Promise.resolve(); request.update({ status: 'disconnected', modalOpen: true });
  request.update({ status: 'disconnected', modalOpen: false });
  t.mock.timers.tick(500); await rejected; t.mock.timers.reset();
});

test('the connection deadline recovers a stalled third-party wallet login without creating a funding or payment operation', async () => {
  const request = createReownWalletConnectionRequest({ open: async () => {}, timeoutMs: 5 });
  await assert.rejects(request.promise, { name: 'TimeoutError', message: 'wallet_connection_timeout' });
  const failure = createReownWalletConnectionRequest({ open: async () => { throw new Error('provider_failed'); } });
  await assert.rejects(failure.promise, { message: 'provider_failed' });
});

test('only known different embedded emails on an unlinked account suppress a restored candidate; email never proves ownership', () => {
  const input = { bindingStatus: 'unlinked', sessionEmail: ' Member@Example.Test ', embeddedEmail: 'other@example.test' };
  assert.equal(identityMismatch(input), true);
  assert.equal(identityMismatch({ ...input, embeddedEmail: 'member@example.test' }), false);
  assert.equal(identityMismatch({ ...input, embeddedEmail: undefined }), false);
  assert.equal(identityMismatch({ ...input, sessionEmail: '' }), false);
  assert.equal(identityMismatch({ ...input, bindingStatus: 'loading' }), false);
  assert.equal(identityMismatch({ ...input, bindingStatus: 'linked' }), false);
  assert.equal(state({ ...linked, boundAddress: '', identityMismatch: true }), 'mismatch');
  // The same email still cannot stand in for an unlocked signer or binding.
  assert.equal(state({ boundAddress: address, identityMismatch: false }), 'disconnected');
});

const deferred = () => { let resolve, reject; const promise = new Promise((done, fail) => { resolve = done; reject = fail; }); return { promise, resolve, reject }; };
const tick = async () => { for (let count = 0; count < 6; count++) await Promise.resolve(); };

test('wallet selection requires both completed reset and observable disconnection, ignoring stale connected snapshots before fresh Connect', async () => {
  const reset = deferred(); let resets = 0, opens = 0, completed = false;
  const choice = createReownWalletSwitchRequest({ disconnect: () => { resets++; return reset.promise; }, open: () => { opens++; } });
  choice.promise.then(() => { completed = true; });
  await tick(); assert.equal(resets, 1);
  choice.update({ status: 'connected', modalOpen: false, disconnected: false });
  reset.resolve(); await tick(); assert.equal(opens, 0); assert.equal(completed, false);
  choice.update({ status: 'disconnected', modalOpen: false, disconnected: true });
  choice.update({ status: 'connected', modalOpen: false, disconnected: false });
  assert.equal(completed, false);
  await tick(); assert.equal(opens, 1); assert.equal(completed, false);
  choice.update({ status: 'connected', modalOpen: false, disconnected: false });
  assert.deepEqual(await choice.promise, { connected: true }); assert.equal(opens, 1);
});

test('a failed disconnect cannot open auth, accept the old connection, or claim the wallet is ready', async () => {
  let opens = 0;
  const choice = createReownWalletSwitchRequest({ disconnect: () => Promise.reject(Error('reset_failed')), open: () => opens++ });
  const failed = assert.rejects(choice.promise, { message: 'reset_failed' });
  choice.update({ status: 'connected', modalOpen: false, disconnected: false });
  await failed; assert.equal(opens, 0);
});

test('owner cancellation suppresses late disconnect results and fresh auth events', async () => {
  const reset = deferred(); let opens = 0;
  const choice = createReownWalletSwitchRequest({ disconnect: () => reset.promise, open: () => opens++ });
  const failed = assert.rejects(choice.promise, { name: 'AbortError' });
  await tick(); choice.cancel(); reset.resolve();
  choice.update({ status: 'disconnected', modalOpen: false, disconnected: true });
  choice.update({ status: 'connected', modalOpen: true, disconnected: false });
  await failed; await tick(); assert.equal(opens, 0);
  let disconnects = 0;
  const immediate = createReownWalletSwitchRequest({ disconnect: () => disconnects++, open: () => opens++ });
  const cancelled = assert.rejects(immediate.promise, { name: 'AbortError' }); immediate.cancel();
  await cancelled; await tick(); assert.equal(disconnects, 0);
});

test('another wrong embedded account stays a mismatch after choosing and a stalled reset has a bounded deadline', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const choice = createReownWalletSwitchRequest({ initialState: { status: 'disconnected', modalOpen: false, disconnected: true },
    disconnect: async () => {}, open: async () => {} });
  await tick(); choice.update({ status: 'mismatch', modalOpen: true, disconnected: false });
  const mismatch = assert.rejects(choice.promise, { message: 'wallet_address_mismatch' });
  choice.update({ status: 'mismatch', modalOpen: false, disconnected: false });
  t.mock.timers.tick(500); await mismatch;
  const stuck = createReownWalletSwitchRequest({ disconnect: () => new Promise(() => {}), open: () => assert.fail('no disconnect observed') });
  const expired = assert.rejects(stuck.promise, { name: 'TimeoutError' });
  t.mock.timers.tick(90_000); await expired; t.mock.timers.reset();
});

/** Exercise the actual provider callbacks with a synthetic SDK and session.
 * No browser storage, real wallet, provider RPC, email or signature is used. */
