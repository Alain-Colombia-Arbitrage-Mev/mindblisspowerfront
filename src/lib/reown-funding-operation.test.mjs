import test from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as sleep } from 'node:timers/promises';
import { createReownFundingOperation, verifyReownWalletOwnership } from './reown-funding-operation.mjs';

const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const address = `0x${'1'.repeat(40)}`;
const challenge = { address, message: 'Sign this single-use ownership challenge', challengeId: '11111111-1111-4111-8111-111111111111' };
const tick = () => sleep(0);

test('cancellation before an SDK wait begins prevents its invocation and rejects further side effects', async () => {
  const operation = createReownFundingOperation();
  let calls = 0;
  const pending = operation.wait(() => { calls++; return 'late'; });
  operation.cancel();
  await assert.rejects(pending, { name: 'AbortError' });
  assert.equal(calls, 0);
  assert.equal(operation.signal.aborted, true);
  assert.throws(() => operation.run(() => calls++), { name: 'AbortError' });
  assert.equal(calls, 0);
});

test('a non-abortable SDK wait expires once and a late completion cannot resume work', async () => {
  const rpc = deferred(); let calls = 0; const stops = [];
  const operation = createReownFundingOperation({ timeoutMs: 15, onStop: error => stops.push(error.name) });
  const pending = operation.wait(() => { calls++; return rpc.promise; });
  await assert.rejects(pending, { name: 'TimeoutError', message: 'reown_connection_timeout' });
  rpc.resolve('late RPC'); await tick();
  assert.equal(calls, 1);
  assert.deepEqual(stops, ['TimeoutError']);
  assert.throws(() => operation.run(() => assert.fail('expired operation resumed')), { name: 'TimeoutError' });
  operation.cancel(); assert.equal(stops.length, 1);
});

test('cancelling a late signature never sends confirmation or publishes a binding', async () => {
  const signature = deferred(); const started = deferred(); const calls = []; let linked = 0;
  const operation = createReownFundingOperation();
  const pending = verifyReownWalletOwnership(operation, { address,
    requestLink: async (path, _body, options) => { calls.push(path); assert.equal(options.signal, operation.signal); return challenge; },
    createSigner: async () => ({ getAddress: async () => address, signMessage: () => { started.resolve(); return signature.promise; } }),
    onLinked: () => linked++,
  });
  await started.promise; operation.cancel();
  await assert.rejects(pending, { name: 'AbortError' });
  signature.resolve('late signature'); await tick();
  assert.deepEqual(calls, ['/api/member/wallet-link/challenge']);
  assert.equal(linked, 0);
});

test('cancelling a pending signer lookup blocks signing and confirmation even if the RPC resolves later', async () => {
  const rpc = deferred(); const started = deferred(); let signs = 0; let confirms = 0;
  const operation = createReownFundingOperation();
  const pending = verifyReownWalletOwnership(operation, { address,
    requestLink: async path => { if (path.endsWith('/confirm')) confirms++; return challenge; },
    createSigner: () => { started.resolve(); return rpc.promise; }, onLinked: () => assert.fail('late binding'),
  });
  await started.promise; operation.cancel(); await assert.rejects(pending, { name: 'AbortError' });
  rpc.resolve({ getAddress: async () => address, signMessage: async () => { signs++; return 'signature'; } }); await tick();
  assert.equal(signs, 0); assert.equal(confirms, 0);
});

test('a cancelled in-flight HTTP confirmation is aborted and its late acknowledgement is never published', async () => {
  const confirmation = deferred(); const started = deferred(); let signal; let linked = 0;
  const operation = createReownFundingOperation();
  const pending = verifyReownWalletOwnership(operation, { address,
    requestLink: async (path, _body, options) => { signal = options.signal;
      if (path.endsWith('/challenge')) return challenge; started.resolve(); return confirmation.promise; },
    createSigner: async () => ({ getAddress: async () => address, signMessage: async () => 'signature' }), onLinked: () => linked++,
  });
  await started.promise; operation.cancel(); await assert.rejects(pending, { name: 'AbortError' });
  assert.equal(signal.aborted, true);
  confirmation.resolve({ linked: true, address }); await tick(); assert.equal(linked, 0);
});

test('ownership proof still requires the selected signer and an exact backend acknowledgement', async () => {
  const calls = []; const operation = createReownFundingOperation(); let linked = 0;
  const result = await verifyReownWalletOwnership(operation, { address,
    requestLink: async (path, body) => { calls.push(path); if (path.endsWith('/challenge')) return challenge;
      assert.equal(body.challengeId, challenge.challengeId); assert.equal(body.signature, 'signed challenge'); return { linked: true, address }; },
    createSigner: async () => ({ getAddress: async () => address, signMessage: async message => {
      assert.equal(message, challenge.message); return 'signed challenge'; } }), onLinked: () => linked++,
  });
  operation.finish(); assert.equal(result.linked, true); assert.equal(linked, 1);
  assert.deepEqual(calls, ['/api/member/wallet-link/challenge', '/api/member/wallet-link/confirm']);
  const invalid = createReownFundingOperation();
  await assert.rejects(verifyReownWalletOwnership(invalid, { address,
    requestLink: async path => { assert.ok(path.endsWith('/challenge')); return challenge; },
    createSigner: async () => ({ getAddress: async () => `0x${'2'.repeat(40)}`, signMessage: () => assert.fail('wrong owner signed') }),
    onLinked: () => assert.fail('wrong owner linked'),
  }), { message: 'wallet_address_mismatch' }); invalid.finish();
});

test('ownership rechecks the current SDK generation after every asynchronous stage without advancing an obsolete proof', async () => {
  for (const stage of ['challenge', 'signer-address', 'signature', 'confirmation']) {
    const gate = deferred(), started = deferred(), calls = [], operation = createReownFundingOperation();
    let current = true;
    const pending = verifyReownWalletOwnership(operation, { address,
      assertCurrent() { if (!current) throw new Error('wallet_address_mismatch'); },
      requestLink: async path => {
        if (path.endsWith('/challenge')) { calls.push('challenge'); if (stage === 'challenge') { started.resolve(); return gate.promise; } return challenge; }
        calls.push('confirm'); if (stage === 'confirmation') { started.resolve(); return gate.promise; } return { linked: true, address };
      },
      createSigner: async () => { calls.push('signer'); return {
        getAddress: async () => { calls.push('address'); if (stage === 'signer-address') { started.resolve(); return gate.promise; } return address; },
        signMessage: async () => { calls.push('sign'); if (stage === 'signature') { started.resolve(); return gate.promise; } return 'synthetic signature'; },
      }; }, onLinked: () => calls.push('published'),
    });
    await started.promise; current = false;
    gate.resolve(stage === 'challenge' ? challenge : stage === 'signer-address' ? address : stage === 'signature' ? 'synthetic signature' : { linked: true, address });
    await assert.rejects(pending, { message: 'wallet_address_mismatch' }); operation.finish();
    const expected = stage === 'challenge' ? ['challenge'] : stage === 'signer-address' ? ['challenge', 'signer', 'address']
      : stage === 'signature' ? ['challenge', 'signer', 'address', 'sign'] : ['challenge', 'signer', 'address', 'sign', 'confirm'];
    assert.deepEqual(calls, expected); await tick(); assert.deepEqual(calls, expected, 'No failed proof may retry itself');
  }
});
