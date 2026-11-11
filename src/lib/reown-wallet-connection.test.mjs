import assert from 'node:assert/strict';
import test from 'node:test';
import { reownWalletConnectionState as state, createReownWalletConnectionRequest } from './reown-wallet-connection.mjs';

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
