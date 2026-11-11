import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { PublicKey } from '@solana/web3.js';
import { personalWalletBalanceSessionKey } from '../lib/personal-wallet-balance-store.mjs';
import { createReownWalletConnectionRequest } from '../lib/reown-wallet-connection.mjs';
import { createReownFundingOperation } from '../lib/reown-funding-operation.mjs';

const wallet = '8U6UD6UmRkYvpubEUg3GG9LBobH5J2c9871mryh1TA5k';
const otherWallet = 'So11111111111111111111111111111111111111112';
const challengeId = '11111111-1111-4111-8111-111111111111';
const message = `app.mindblisspower.com\nSolana mainnet wallet verification\n${wallet}\nNonce: único-唯一`;
const challenge = patch => ({ challengeId, address: wallet, message, expiresAt: new Date(Date.now() + 60_000).toISOString(), ...patch });
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };

function harness(overrides = {}) {
  const slots = [], effects = [], calls = [], signatures = [], opened = [];
  let cursor = 0, dirty = true, current, enabled = overrides.enabled ?? true, session = { subject: 'owner-A', email: 'member@example.test' };
  let account = { address: wallet, isConnected: true, status: 'connected', ...overrides.account };
  let appKitState = { initialized: true, loading: false, open: false, ...overrides.appKitState };
  const provider = { publicKey: new PublicKey(wallet), async signMessage(bytes) { signatures.push(bytes); return overrides.sign ? overrides.sign(bytes) : new Uint8Array(64).fill(7); },
    signTransaction() { assert.fail('binding attempted to sign a transfer'); }, sendTransaction() { assert.fail('binding attempted a transfer'); } };
  const changed = (a, b) => !a || !b || a.length !== b.length || a.some((value, index) => !Object.is(value, b[index]));
  const hooks = {
    useRef(value) { const index = cursor++; return slots[index] ??= { current: value }; },
    useState(value) { const index = cursor++, cell = slots[index] ??= { value: typeof value === 'function' ? value() : value };
      cell.set ??= update => { const next = typeof update === 'function' ? update(cell.value) : update;
        if (!Object.is(next, cell.value)) { cell.value = next; dirty = true; } }; return [cell.value, cell.set]; },
    useCallback(callback, deps) { const index = cursor++, cell = slots[index] ??= {};
      if (changed(cell.deps, deps)) { cell.value = callback; cell.deps = deps; } return cell.value; },
    useMemo(callback, deps) { const index = cursor++, cell = slots[index] ??= {};
      if (changed(cell.deps, deps)) { cell.value = callback(); cell.deps = deps; } return cell.value; },
    useEffect(callback, deps) { const index = cursor++, cell = slots[index] ??= {};
      if (changed(cell.deps, deps)) { cell.deps = deps; effects.push(() => { cell.cleanup?.(); cell.cleanup = callback(); }); } },
  };
  const client = {
    async readSolanaWalletLink(options) { calls.push({ action: 'status', options }); return overrides.status ? overrides.status(options) : { linked: false, address: '' }; },
    async requestSolanaWalletLink(action, input, options) {
      calls.push({ action, input, options });
      return overrides.request ? overrides.request(action, input, options) : action === 'challenge' ? challenge() : { linked: true, address: wallet };
    },
  };
  const source = readFileSync(new URL('./useSolanaWalletBinding.jsx', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  const mocks = { react: hooks, '@solana/web3.js': { PublicKey }, '@/lib/member-session-context': { useMemberSession: () => session },
    '@/lib/personal-wallet-balance-store.mjs': { personalWalletBalanceSessionKey }, '@/lib/solana-wallet-link-client.mjs': client,
    '@/lib/reown-funding-operation.mjs': { createReownFundingOperation: options => createReownFundingOperation({ ...options, ...(overrides.timeoutMs ? { timeoutMs: overrides.timeoutMs } : {}) }) },
    '@/lib/reown-wallet-connection.mjs': { createReownWalletConnectionRequest: options => createReownWalletConnectionRequest({ ...options, ...(overrides.timeoutMs ? { timeoutMs: overrides.timeoutMs } : {}) }) },
  };
  const browser = new EventTarget();
  const open = async options => { opened.push(options); return overrides.open?.(options); };
  const switchNetwork = async () => calls.push({ action: 'switchSolanaNetwork' });
  new Function('require', 'module', 'exports', 'window', code)(id => {
    assert.ok(Object.hasOwn(mocks, id), `Unexpected binding dependency: ${id}`); return mocks[id];
  }, module, module.exports, browser);
  const render = () => { cursor = 0; dirty = false; current = module.exports.useSolanaWalletBinding({ account, walletProvider: provider, appKitState, open, switchNetwork, enabled }); };
  return {
    get flow() { return current; }, calls, signatures, opened, provider, browser,
    async flush() { for (let turn = 0, quiet = 0; turn < 40; turn++) {
      if (dirty) render(); while (effects.length) effects.shift()(); await new Promise(resolve => setImmediate(resolve));
      if (dirty || effects.length) quiet = 0; else if (++quiet === 2) return current;
    } assert.fail('Solana binding did not settle'); },
    async session(next, flush = true) { session = next; dirty = true; if (!flush) { render(); return current; } return this.flush(); },
    async enabled(next) { enabled = next; dirty = true; return this.flush(); },
    async wallet(nextAddress) { account = { ...account, address: nextAddress }; provider.publicKey = new PublicKey(nextAddress); dirty = true; return this.flush(); },
    async connection(nextAccount, state = {}) { account = { ...account, ...nextAccount }; appKitState = { ...appKitState, ...state }; dirty = true; return this.flush(); },
    unmount() { for (const cell of slots) cell?.cleanup?.(); },
  };
}
const mutations = h => h.calls.filter(call => ['challenge', 'confirm'].includes(call.action));

test('a disabled namespace makes no automatic requests and cannot connect, link or sign', async t => {
  const h = harness({ enabled: false }); t.after(() => h.unmount()); await h.flush();
  assert.equal(h.flow.configured, false); assert.equal(h.flow.address, '');
  assert.equal(h.flow.isConnected, false); assert.equal(h.flow.isLinked, false);
  assert.equal(h.flow.linkStatus, 'unavailable'); assert.deepEqual(h.calls, []);
  await assert.rejects(h.flow.connectWallet(), { message: 'unauthenticated' });
  await assert.rejects(h.flow.linkWallet(), { message: 'unauthenticated' });
  await assert.rejects(h.flow.refreshLink(), { message: 'unauthenticated' });
  assert.equal(h.signatures.length, 0); assert.deepEqual(h.opened, []);
  await h.enabled(true); assert.equal(h.calls.length, 1); assert.equal(h.calls[0].action, 'status');
  await h.enabled(false); assert.equal(h.flow.address, ''); assert.equal(h.flow.isLinked, false);
  assert.equal(h.calls.length, 1);
});

test('connected Solana initially reads only its own binding and never signs or links from an effect', async t => {
  const h = harness(); t.after(() => h.unmount()); await h.flush();
  assert.equal(h.flow.namespace, 'solana'); assert.equal(h.flow.address, wallet); assert.equal(h.flow.isConnected, true);
  assert.equal(h.flow.linkStatus, 'unlinked'); assert.equal(h.flow.isLinked, false); assert.equal(h.flow.needsVerification, true);
  assert.deepEqual(mutations(h), []); assert.equal(h.signatures.length, 0); assert.deepEqual(h.opened, []);
  assert.throws(h.flow.getProvider, { message: 'solana_wallet_unavailable' });
  await h.flow.connectWallet(); assert.deepEqual(h.opened, []); assert.equal(h.signatures.length, 0);
});

test('one explicit verification signs exact UTF8 once and confirms canonical Base64 without EVM normalization', async t => {
  const h = harness(); t.after(() => h.unmount()); await h.flush();
  const first = h.flow.linkWallet(), duplicate = h.flow.linkWallet(); assert.equal(first, duplicate);
  await first; await h.flush();
  assert.deepEqual(mutations(h).map(value => value.action), ['challenge', 'confirm']);
  assert.deepEqual(mutations(h)[0].input, { address: wallet });
  assert.equal(h.signatures.length, 1); assert.equal(new TextDecoder().decode(h.signatures[0]), message);
  assert.deepEqual(mutations(h)[1].input, { challengeId, signature: Buffer.from(new Uint8Array(64).fill(7)).toString('base64') });
  assert.equal(h.flow.linkedAddress, wallet); assert.equal(h.flow.isLinked, true); assert.equal(h.flow.needsVerification, false);
  assert.equal(h.flow.getProvider(), h.provider);
  await h.flow.linkWallet(); await h.flush(); assert.equal(h.signatures.length, 1); assert.equal(mutations(h).length, 2);
});

test('a previously verified Solana wallet restores ownership without another challenge or signature', async t => {
  const h = harness({ status: async () => ({ linked: true, address: wallet }) }); t.after(() => h.unmount()); await h.flush();
  assert.equal(h.flow.isLinked, true); await h.flow.linkWallet(); await h.flush();
  assert.equal(h.flow.linkedAddress, wallet); assert.equal(h.signatures.length, 0); assert.deepEqual(mutations(h), []);
});

test('an idempotent already-linked challenge skips signing but a different linked address cannot be adopted', async () => {
  for (const response of [{ linked: true, address: wallet }, { linked: true, address: otherWallet }]) {
    const h = harness({ request: async () => response });
    try {
      await h.flush();
      if (response.address === wallet) { await h.flow.linkWallet(); await h.flush(); assert.equal(h.flow.isLinked, true); }
      else { await assert.rejects(h.flow.linkWallet(), { message: 'wallet_address_mismatch' }); await h.flush(); assert.equal(h.flow.isLinked, false); }
      assert.equal(h.signatures.length, 0); assert.equal(mutations(h).length, 1);
    } finally { h.unmount(); }
  }
});

test('switching SDK accounts cannot replace an existing backend binding or expose its signer', async t => {
  const h = harness({ status: async () => ({ linked: true, address: wallet }) }); t.after(() => h.unmount()); await h.flush(); await h.wallet(otherWallet);
  assert.equal(h.flow.connectionStatus, 'mismatch'); assert.equal(h.flow.linkedAddress, wallet); assert.equal(h.flow.isLinked, false);
  assert.throws(h.flow.getProvider, { message: 'solana_wallet_unavailable' });
  await assert.rejects(h.flow.linkWallet(), { message: 'wallet_already_linked' }); await h.flush();
  assert.equal(h.signatures.length, 0); assert.deepEqual(mutations(h), []); assert.equal(h.flow.linkedAddress, wallet);
});

test('owner and account changes cancel a late challenge or signature before confirmation', async () => {
  for (const kind of ['challenge', 'signature']) {
    const pending = deferred();
    const h = harness({ request: async action => action === 'challenge' ? kind === 'challenge' ? pending.promise : challenge() : assert.fail('stale proof confirmed'),
      sign: async () => pending.promise });
    try {
      await h.flush(); const linking = h.flow.linkWallet(); const cancelled = assert.rejects(linking, { name: 'AbortError' }); await h.flush();
      if (kind === 'challenge') await h.session({ subject: 'owner-B', email: 'member@example.test' }); else await h.wallet(otherWallet);
      await cancelled; pending.resolve(kind === 'challenge' ? challenge() : new Uint8Array(64).fill(7)); await h.flush();
      assert.equal(mutations(h).some(value => value.action === 'confirm'), false); assert.equal(h.flow.isLinked, false); assert.equal(h.flow.isLinking, false);
    } finally { h.unmount(); }
  }
});

test('invalid or expired challenges and malformed signatures cannot reach backend confirmation', async () => {
  for (const kind of ['expired', 'signature']) {
    const h = harness({ request: async action => action === 'challenge' ? challenge(kind === 'expired' ? { expiresAt: new Date(Date.now() - 1).toISOString() } : {}) : assert.fail('invalid proof confirmed'),
      sign: async () => new Uint8Array(63) });
    try {
      await h.flush(); await assert.rejects(h.flow.linkWallet(), { message: kind === 'expired' ? 'wallet_challenge_invalid' : 'wallet_signature_invalid' }); await h.flush();
      assert.equal(mutations(h).length, 1); assert.equal(h.flow.isLinked, false); assert.equal(h.flow.isLinking, false);
    } finally { h.unmount(); }
  }
});

test('wallet rejections expose only a safe category and a hung signer releases the UI without confirming a late signature', async () => {
  for (const kind of ['rejected', 'timeout']) {
    const pending = deferred(), h = harness({ timeoutMs: 20, sign: async () => {
      if (kind === 'rejected') throw Object.assign(new Error('private provider details'), { code: 4001 }); return pending.promise;
    } });
    try {
      await h.flush(); await assert.rejects(h.flow.linkWallet()); await h.flush();
      assert.equal(h.flow.linkError, kind === 'rejected' ? 'wallet_rejected' : 'wallet_connection_timeout');
      assert.equal(h.flow.isLinking, false); pending.resolve(new Uint8Array(64).fill(7)); await h.flush();
      assert.equal(mutations(h).length, 1);
    } finally { h.unmount(); }
  }
});

test('Solana connection is namespace-specific, deduplicated and cannot itself verify ownership', async t => {
  const h = harness({ account: { isConnected: false, status: 'disconnected' } }); t.after(() => h.unmount()); await h.flush();
  const first = h.flow.connectWallet(), second = h.flow.connectWallet(); assert.equal(first, second); await h.flush();
  assert.deepEqual(h.opened, [{ view: 'Connect', namespace: 'solana' }]);
  await h.connection({ isConnected: true, status: 'connected' }, { open: true }); await first; await h.flush();
  assert.equal(h.flow.needsVerification, true); assert.deepEqual(mutations(h), []); assert.equal(h.signatures.length, 0);
  await h.flow.switchNetwork(); assert.equal(h.calls.at(-1).action, 'switchSolanaNetwork');
});

test('logout immediately hides the old verified address and stops every captured action', async t => {
  const h = harness({ status: async () => ({ linked: true, address: wallet }) }); t.after(() => h.unmount()); await h.flush();
  const previous = h.flow; await h.session(null, false);
  assert.equal(h.flow.linkedAddress, ''); assert.equal(h.flow.address, ''); assert.equal(h.flow.isLinked, false);
  assert.throws(previous.getProvider, { message: 'solana_wallet_unavailable' });
  await assert.rejects(previous.linkWallet(), { message: 'unauthenticated' }); await assert.rejects(previous.connectWallet(), { message: 'unauthenticated' });
  await h.flush(); assert.equal(h.flow.linkStatus, 'unavailable'); assert.deepEqual(mutations(h), []);
});

test('disconnect invalidates a captured signer and pending ownership proof even if publicKey and address remain cached', async () => {
  const restored = harness({ status: async () => ({ linked: true, address: wallet }) });
  try {
    await restored.flush(); const oldProvider = restored.flow.getProvider; assert.equal(oldProvider(), restored.provider);
    await restored.connection({ isConnected: false, status: 'disconnected' });
    assert.equal(restored.flow.isLinked, false); assert.throws(oldProvider, { message: 'solana_wallet_unavailable' });
  } finally { restored.unmount(); }
  const pending = deferred(), h = harness({ request: async () => pending.promise });
  try {
    await h.flush(); const proof = h.flow.linkWallet(), cancelled = assert.rejects(proof, { name: 'AbortError' }); await h.flush();
    await h.connection({ isConnected: false, status: 'disconnected' }); await cancelled;
    pending.resolve(challenge()); await h.flush(); assert.equal(h.signatures.length, 0); assert.equal(mutations(h).length, 1);
  } finally { h.unmount(); }
});

test('an unfinished Solana connection releases the button and returns a safe error without linking or disconnecting', async t => {
  const h = harness({ timeoutMs: 20, account: { isConnected: false, status: 'disconnected' } }); t.after(() => h.unmount()); await h.flush();
  await assert.rejects(h.flow.connectWallet(), { name: 'TimeoutError' }); await h.flush();
  assert.equal(h.flow.isRestoring, false); assert.equal(h.flow.linkError, 'wallet_connection_timeout');
  assert.deepEqual(mutations(h), []); assert.equal(h.signatures.length, 0);
});
