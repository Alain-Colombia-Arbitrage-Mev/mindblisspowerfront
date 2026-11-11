import assert from 'node:assert/strict';
import test from 'node:test';
import { createReownWalletPreparationRequest } from './reown-wallet-preparation.mjs';
import { verifyReownWalletOwnership } from './reown-funding-operation.mjs';

const wallet = `0x${'1'.repeat(40)}`, other = `0x${'2'.repeat(40)}`, owner = 'synthetic-member';
const deferred = () => { let resolve, reject; const promise = new Promise((done, fail) => { resolve = done; reject = fail; }); return { promise, resolve, reject }; };
const tick = async () => { for (let turn = 0; turn < 12; turn++) await Promise.resolve(); };
function fixture(overrides = {}) {
  const listeners = new Set(), calls = [];
  const snapshot = { owner, linkStatus: 'unlinked', linkedAddress: '', address: '', isConnected: false, isCandidate: false,
    connectWallet: async () => { calls.push('connect'); },
    linkWallet: async () => { calls.push('proof'); return { linked: true, address: wallet }; }, ...overrides };
  const input = { owner, read: () => snapshot, subscribe: listener => { listeners.add(listener); return () => listeners.delete(listener); } };
  return { input, snapshot, calls, listeners,
    patch(value) { Object.assign(snapshot, value); for (const listener of listeners) listener(); } };
}

test('an authoritative linked wallet activation returns its binding without connection or another ownership signature', async () => {
  const f = fixture({ linkStatus: 'linked', linkedAddress: wallet });
  const request = createReownWalletPreparationRequest(f.input);
  assert.deepEqual(await request.promise, { linked: true, address: wallet });
  assert.deepEqual(f.calls, []); assert.equal(f.listeners.size, 0);
});

test('activation waits for initial binding, then connection and a published eligible owner candidate before one current proof', async () => {
  const connection = deferred(), f = fixture({ linkStatus: 'loading', connectWallet: () => { f.calls.push('connect'); return connection.promise; },
    linkWallet: () => assert.fail('An unpublished stale callback cannot sign') });
  const request = createReownWalletPreparationRequest(f.input);
  await tick(); assert.deepEqual(f.calls, []);
  f.patch({ linkStatus: 'unlinked' }); await tick(); assert.deepEqual(f.calls, ['connect']);
  connection.resolve(); await tick(); assert.deepEqual(f.calls, ['connect']);
  f.patch({ isConnected: true, address: wallet, isCandidate: false }); await tick(); assert.deepEqual(f.calls, ['connect']);
  f.patch({ isCandidate: true, linkWallet: async () => { f.calls.push('proof'); return { linked: true, address: wallet }; } });
  assert.deepEqual(await request.promise, { linked: true, address: wallet });
  assert.deepEqual(f.calls, ['connect', 'proof']); assert.equal(f.listeners.size, 0);
});

test('an already selected but unlinked candidate performs proof once only from this explicit activation', async () => {
  const f = fixture({ isConnected: true, isCandidate: true, address: wallet });
  const request = createReownWalletPreparationRequest(f.input);
  await request.promise; assert.deepEqual(f.calls, ['proof']); assert.equal(f.listeners.size, 0);
});

test('another completed backend binding during connection avoids an unnecessary ownership signature', async () => {
  const connection = deferred(), f = fixture({ connectWallet: () => connection.promise });
  const request = createReownWalletPreparationRequest(f.input); await tick();
  f.patch({ linkStatus: 'linked', linkedAddress: wallet }); connection.resolve();
  assert.deepEqual(await request.promise, { linked: true, address: wallet }); assert.deepEqual(f.calls, []);
});

test('connection failure never requests proof or retries connection', async () => {
  const f = fixture({ connectWallet: async () => { f.calls.push('connect'); throw Error('synthetic_auth_cancelled'); } });
  const request = createReownWalletPreparationRequest(f.input);
  await assert.rejects(request.promise, { message: 'synthetic_auth_cancelled' });
  assert.deepEqual(f.calls, ['connect']); assert.equal(f.listeners.size, 0);
});

test('an owner change, including during a late connection result, cannot activate or sign the previous candidate', async () => {
  const connection = deferred(), f = fixture({ connectWallet: () => connection.promise });
  const request = createReownWalletPreparationRequest(f.input); await tick();
  f.patch({ owner: 'another-owner', isConnected: true, isCandidate: true, address: wallet }); connection.resolve();
  await assert.rejects(request.promise, { name: 'AbortError' }); assert.deepEqual(f.calls, []); assert.equal(f.listeners.size, 0);
});

test('cancelled activation removes its subscriber and ignores a later published candidate', async () => {
  const f = fixture(), request = createReownWalletPreparationRequest(f.input);
  await tick(); const cancelled = assert.rejects(request.promise, { name: 'AbortError' }); request.cancel(); await cancelled;
  f.patch({ isConnected: true, isCandidate: true, address: wallet }); await tick();
  assert.deepEqual(f.calls, ['connect']); assert.equal(f.listeners.size, 0);
});

test('a wallet replacement after readiness but before proof cannot use a stale candidate or callback', async () => {
  const f = fixture(), request = createReownWalletPreparationRequest(f.input); await tick();
  f.patch({ isConnected: true, isCandidate: true, address: wallet });
  f.patch({ address: other });
  await assert.rejects(request.promise, { message: 'wallet_address_mismatch' });
  assert.deepEqual(f.calls, ['connect']); assert.equal(f.listeners.size, 0);
});

test('provider proof rejection and malformed acknowledgements never retry or report a linked wallet', async () => {
  for (const linkWallet of [async () => { throw Error('synthetic_proof_rejected'); }, async () => ({ linked: true, address: other })]) {
    const f = fixture({ isConnected: true, isCandidate: true, address: wallet, linkWallet });
    const request = createReownWalletPreparationRequest(f.input);
    await assert.rejects(request.promise, /synthetic_proof_rejected|wallet_link_unconfirmed/);
    assert.deepEqual(f.calls, []); assert.equal(f.listeners.size, 0);
  }
});

test('activation deadlines remove subscribers without polling providers or retrying backend proof', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const f = fixture({ linkStatus: 'loading' }), request = createReownWalletPreparationRequest({ ...f.input, timeoutMs: 1000 });
  await tick(); assert.equal(f.listeners.size, 1);
  const expired = assert.rejects(request.promise, { name: 'TimeoutError' }); t.mock.timers.tick(1000); await expired;
  assert.equal(f.listeners.size, 0); assert.deepEqual(f.calls, []); t.mock.timers.reset();
});

test('the activation deadline also aborts the real ownership proof helper so a late signature cannot confirm or publish binding', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const signature = deferred(), signStarted = deferred(), calls = [];
  const f = fixture({ isConnected: true, isCandidate: true, address: wallet,
    linkWallet: operation => verifyReownWalletOwnership(operation, { address: wallet,
      requestLink: async path => {
        if (path.endsWith('/challenge')) { calls.push('challenge'); return { address: wallet, message: 'Synthetic single-use ownership proof', challengeId: '11111111-1111-4111-8111-111111111111' }; }
        calls.push('confirm'); return { linked: true, address: wallet };
      },
      createSigner: async () => ({ getAddress: async () => wallet, signMessage: () => { calls.push('sign'); signStarted.resolve(); return signature.promise; } }),
      onLinked: () => calls.push('published'),
    }) });
  const request = createReownWalletPreparationRequest({ ...f.input, timeoutMs: 1000 });
  await signStarted.promise; assert.deepEqual(calls, ['challenge', 'sign']);
  const expired = assert.rejects(request.promise, { name: 'TimeoutError' }); t.mock.timers.tick(1000); await expired;
  signature.resolve(`0x${'1'.repeat(130)}`); await tick();
  assert.deepEqual(calls, ['challenge', 'sign']); assert.equal(f.listeners.size, 0); t.mock.timers.reset();
});

test('activation cancellation cancels only the exact pending connection promise and never disconnects an established wallet', async () => {
  const connection = deferred(), cancelled = [];
  const f = fixture({ connectWallet: () => connection.promise, cancelConnection: promise => { cancelled.push(promise); connection.reject(new DOMException('Cancelled', 'AbortError')); } });
  const request = createReownWalletPreparationRequest(f.input); await tick();
  const stopped = assert.rejects(request.promise, { name: 'AbortError' }); request.cancel(); await stopped;
  assert.deepEqual(cancelled, [connection.promise]); assert.deepEqual(f.calls, []); assert.equal(f.listeners.size, 0);
});
