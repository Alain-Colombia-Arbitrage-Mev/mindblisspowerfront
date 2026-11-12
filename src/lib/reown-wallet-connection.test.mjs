import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import ts from 'typescript';
import { createReownFundingOperation, verifyReownWalletOwnership } from './reown-funding-operation.mjs';
import { personalWalletBalanceSessionKey } from './personal-wallet-balance-store.mjs';
import { createReownWalletPreparationRequest } from './reown-wallet-preparation.mjs';
import { createHeadlessPaymentConnection } from './reown-headless-payment.mjs';
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
function providerHarness(t, { bound = false, reset = async () => {}, proof = false, accountState = {}, readBinding, signProof } = {}) {
  const require = createRequire(import.meta.url), slots = [], queued = [], calls = [];
  const logoutListeners = new Set();
  let cursor = 0, dirty = true, unmounted = false, value;
  let member = { subject: 'owner-new', email: 'new@example.test' };
  const account = { isConnected: true, status: 'connected', address, embeddedWalletInfo: { user: { email: 'previous@example.test' } }, ...accountState };
  const sdk = { initialized: true, loading: false, open: false };
  const originals = new Map(['window', 'document', 'MutationObserver'].map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { location: { origin: 'https://app.mindblisspower.com' }, addEventListener() {}, removeEventListener() {}, dispatchEvent() {} } });
  Object.defineProperty(globalThis, 'document', { configurable: true, value: { documentElement: { dataset: { theme: 'light' } }, body: { classList: { toggle() {}, remove() {} } } } });
  Object.defineProperty(globalThis, 'MutationObserver', { configurable: true, value: class { observe() {} disconnect() {} } });
  const changed = (left, right) => !left || !right || left.length !== right.length || left.some((item, index) => item !== right[index]);
  const hooks = { ...React,
    useRef(initial) { return slots[cursor++] ??= { current: initial }; },
    useState(initial) {
      const cell = slots[cursor++] ??= { value: typeof initial === 'function' ? initial() : initial };
      cell.set ??= update => { assert.equal(unmounted, false, 'No state updates after unmount'); const next = typeof update === 'function' ? update(cell.value) : update;
        if (!Object.is(cell.value, next)) { cell.value = next; dirty = true; } };
      return [cell.value, cell.set];
    },
    useMemo(callback, dependencies) { const cell = slots[cursor++] ??= {}; if (changed(cell.dependencies, dependencies)) { cell.dependencies = dependencies; cell.value = callback(); } return cell.value; },
    useCallback(callback, dependencies) { return hooks.useMemo(() => callback, dependencies); },
    useEffect(effect, dependencies) { const cell = slots[cursor++] ??= {}; if (changed(cell.dependencies, dependencies)) {
      cell.dependencies = dependencies; queued.push(() => { cell.cleanup?.(); cell.cleanup = effect(); }); } },
  };
  const open = async () => { calls.push('open'); }, disconnect = async () => { calls.push('disconnect'); await reset(); };
  const context = { Provider: () => null };
  const imports = {
    react: hooks,
    '@reown/appkit/react': { createAppKit: () => ({ updateFeatures() {} }), useAppKit: () => ({ open, close: async () => {} }),
      useAppKitAccount: options => options?.namespace === 'solana' ? {} : account, useAppKitProvider: () => ({ walletProvider: provider }),
      useAppKitState: () => sdk, useAppKitTheme: () => ({ setThemeMode() {}, setThemeVariables() {} }), useAppKitNetwork: () => ({ switchNetwork() { assert.fail('No payment network switch'); } }),
      useDisconnect: () => ({ disconnect }) },
    '@reown/appkit-adapter-ethers': { EthersAdapter: class {} }, '@reown/appkit-adapter-solana/react': { SolanaAdapter: class {} },
    '@reown/appkit-controllers': { OnRampController: { state: { providers: [] } }, OptionsController: { state: { features: {} } }, ConnectionController: { hasAnyConnection: () => false } },
    '@reown/appkit-common': { ConstantsUtil: { CONNECTOR_ID: { AUTH: 'AUTH' } } }, '@reown/appkit/networks': { mainnet: {}, polygon: {}, solana: {} },
    ethers: { getAddress: input => input.toLowerCase(), BrowserProvider: class {
      getSigner() { assert.equal(proof, true, 'No signature in connection tests'); return {
        getAddress: async () => account.address,
        signMessage: async () => { calls.push('sign'); return signProof ? signProof() : `0x${'1'.repeat(130)}`; },
      }; }
    } },
    '@/lib/member-session-context': { useMemberSession: () => member }, '@/lib/browser-onramp-region.mjs': { browserOnrampRegion() { assert.fail('No funding region lookup'); } },
    '@/lib/reown-production-onramp.mjs': { buildReownProductionOnrampUrl() { assert.fail('No funding URL'); }, reownFundingSelection() { assert.fail('No funding selection'); } },
    '@/lib/wallet-funding-client.mjs': { createPersonalFundingIntent() { assert.fail('No funding intent'); }, fundingRequestId() { assert.fail('No funding intent'); } },
    '@/lib/personal-wallet.mjs': { PERSONAL_WALLET_ASSET: 'USDT', PERSONAL_WALLET_MINIMUM_USD: 30 },
    '@/lib/wallet-binding.mjs': { readWalletBinding: async options => readBinding ? readBinding(options) : bound ? { linked: true, address } : { linked: false },
      requestWalletLink: async path => {
        assert.equal(proof, true, 'Foreign candidate must not request ownership proof');
        if (path.endsWith('/challenge')) { calls.push('challenge'); return { linked: false, address: account.address, message: 'Synthetic explicit wallet ownership proof', challengeId: '11111111-1111-4111-8111-111111111111' }; }
        assert.ok(path.endsWith('/confirm')); calls.push('confirm'); return { linked: true, address: account.address };
      }, walletBindingFailure: error => error.message },
    '@/lib/personal-funding-errors.mjs': { personalFundingFailure: error => error.message },
    '@/lib/personal-portal-origin.mjs': { personalWalletMetadata: () => ({ url: 'https://app.mindblisspower.com' }) },
    '@/lib/reown-funding-operation.mjs': { createReownFundingOperation, verifyReownWalletOwnership },
    '@/lib/reown-wallet-connection.mjs': { createReownWalletConnectionRequest, createReownWalletSwitchRequest, reownWalletConnectionState: state, reownWalletIdentityMismatch: identityMismatch, reownWalletNeedsAccountSelection: needsSelection },
    '@/lib/personal-wallet-balance-store.mjs': { personalWalletBalanceSessionKey },
    '@/lib/member-logout-sync.mjs': { subscribeMemberLogout: listener => { logoutListeners.add(listener); return () => logoutListeners.delete(listener); } },
    '@/lib/reown-wallet-preparation.mjs': { createReownWalletPreparationRequest },
    '@/hooks/useSolanaWalletBinding': { useSolanaWalletBinding: () => ({}) }, './ReownContext': { ReownContext: context, PAYMENT_CONNECTION_UNAVAILABLE: {}, SOLANA_WALLET_UNAVAILABLE: {}, useReownWallet() {} },
  };
  const headlessModule = { exports: {} };
  const headlessCode = ts.transpileModule(readFileSync(new URL('../hooks/useHeadlessPaymentConnection.jsx', import.meta.url), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  new Function('require', 'module', 'exports', headlessCode)(id => {
    if (id === 'react') return hooks;
    if (id === '@/lib/reown-headless-payment.mjs') return { createHeadlessPaymentConnection };
    assert.fail(`Unexpected headless hook dependency ${id}`);
  }, headlessModule, headlessModule.exports);
  imports['@/hooks/useHeadlessPaymentConnection'] = headlessModule.exports;
  const code = ts.transpileModule(readFileSync(new URL('../components/reown/ReownProvider.jsx', import.meta.url), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', 'process', code)(name => {
    if (name === 'react/jsx-runtime') return require(name);
    assert.ok(name in imports, `Unmocked provider dependency: ${name}`); return imports[name];
  }, module, module.exports, { env: { NEXT_PUBLIC_REOWN_PROJECT_ID: 'a'.repeat(32) } });
  const view = { calls, get value() { return value; },
    logout() { for (const listener of logoutListeners) listener(); },
    snapshotLogout() { const callbacks = [...logoutListeners]; return () => { for (const listener of callbacks) listener(); }; },
    async flush() {
      for (let turn = 0, quiet = 0; turn < 40; turn++) {
        if (dirty && !unmounted) { dirty = false; cursor = 0; const outer = module.exports.default({ children: null }); value = outer.type(outer.props).props.value; }
        while (queued.length && !unmounted) queued.shift()();
        await new Promise(done => setImmediate(done));
        if (!dirty && !queued.length) { if (++quiet === 3) return value; } else quiet = 0;
      }
      assert.fail('Synthetic provider failed to settle');
    },
    async account(next) { Object.assign(account, next); dirty = true; return view.flush(); },
    async member(next) { member = next; dirty = true; return view.flush(); },
    unmount() { for (const cell of slots) cell?.cleanup?.(); unmounted = true; },
  };
  t.after(() => { if (!unmounted) view.unmount();
    for (const [name, original] of originals) original ? Object.defineProperty(globalThis, name, original) : delete globalThis[name]; }); return view;
}

test('actual provider hides a known foreign embedded wallet and refuses its ownership signature before a backend challenge', async t => {
  const h = providerHarness(t); await h.flush();
  assert.equal(h.value.walletIdentityMismatch, true); assert.equal(h.value.address, ''); assert.equal(h.value.isConnected, false);
  await assert.rejects(h.value.linkWallet(), { message: 'wallet_address_mismatch' });
  assert.deepEqual(h.calls, []); assert.throws(() => h.value.getCompanyPaymentProvider());
});

test('actual provider coalesces explicit selection and connect requests while waiting for a fresh disconnected SDK observation', async t => {
  const h = providerHarness(t); await h.flush();
  const first = h.value.chooseWallet(), second = h.value.chooseWallet(), third = h.value.connectWallet();
  assert.equal(first, second); assert.equal(second, third); await h.flush();
  assert.deepEqual(h.calls, ['disconnect']); assert.equal(h.value.address, '');
  await h.account({ isConnected: false, status: 'disconnected' });
  assert.deepEqual(h.calls, ['disconnect', 'open']); assert.equal(h.value.isConnected, false);
  await h.account({ isConnected: true, status: 'connected', address: other, embeddedWalletInfo: { user: { email: 'new@example.test' } } });
  assert.deepEqual(await first, { connected: true }); await h.flush();
  assert.equal(h.value.address, other); assert.equal(h.value.isLinked, false); assert.equal(h.value.walletIdentityMismatch, false);
  assert.deepEqual(h.calls, ['disconnect', 'open']);
});

test('a valid authoritative linked wallet keeps its restored session despite a different wallet login email', async t => {
  const h = providerHarness(t, { bound: true }); await h.flush();
  assert.equal(h.value.walletIdentityMismatch, false); assert.equal(h.value.isLinked, true); assert.equal(h.value.address, address);
  assert.deepEqual(await h.value.connectWallet(), { connected: true }); await h.flush(); assert.deepEqual(h.calls, []);
});

test('actual provider fails a reset without exposing the foreign account or initiating funding', async t => {
  const h = providerHarness(t, { reset: async () => { throw Error('synthetic_reset_failure'); } }); await h.flush();
  await assert.rejects(h.value.chooseWallet(), { message: 'synthetic_reset_failure' }); await h.flush();
  assert.equal(h.value.walletIdentityMismatch, true); assert.equal(h.value.address, '');
  assert.deepEqual(h.calls, ['disconnect']); assert.equal(h.value.onrampStatus, 'idle');
});

test('missing embedded email and matching email both require fresh owner-scoped selection before showing an unlinked wallet', async t => {
  const h = providerHarness(t); await h.flush();
  for (const embeddedWalletInfo of [undefined, { user: { email: 'new@example.test' } }]) {
    await h.account({ embeddedWalletInfo });
    assert.equal(h.value.walletIdentityMismatch, false); assert.equal(h.value.walletNeedsAccountSelection, true);
    assert.equal(h.value.address, ''); assert.equal(h.value.isConnected, false);
    await assert.rejects(h.value.linkWallet(), { message: 'wallet_address_mismatch' });
  }
  assert.deepEqual(h.calls, []);
});

test('fresh selection exposes only a candidate; only explicit signed ownership proof links it, and later address changes invalidate selection', async t => {
  const h = providerHarness(t, { proof: true }); await h.flush();
  await h.account({ embeddedWalletInfo: undefined });
  const choice = h.value.connectWallet(); await h.flush();
  await h.account({ isConnected: false, status: 'disconnected' });
  await h.account({ isConnected: true, status: 'connected', address: other });
  await choice; await h.flush();
  assert.equal(h.value.walletNeedsAccountSelection, false); assert.equal(h.value.isLinked, false);
  assert.deepEqual(h.calls, ['disconnect', 'open']);
  await h.value.linkWallet(); await h.flush();
  assert.equal(h.value.isLinked, true); assert.equal(h.value.linkedAddress, other);
  assert.deepEqual(h.calls, ['disconnect', 'open', 'challenge', 'sign', 'confirm']);
});

test('an unlinked candidate selection cannot survive SDK address replacement, including a later return to the old address', async t => {
  const h = providerHarness(t); await h.flush(); await h.account({ embeddedWalletInfo: undefined });
  const choice = h.value.chooseWallet(); await h.flush();
  await h.account({ isConnected: false, status: 'disconnected' });
  await h.account({ isConnected: true, status: 'connected', address: other }); await choice; await h.flush();
  assert.equal(h.value.address, other);
  await h.account({ address }); assert.equal(h.value.address, ''); assert.equal(h.value.walletNeedsAccountSelection, true);
  await h.account({ address: other }); assert.equal(h.value.address, ''); assert.equal(h.value.walletNeedsAccountSelection, true);
  assert.deepEqual(h.calls, ['disconnect', 'open']);
});

test('actual provider cancels an old owner selection and ignores late reset completion after session change or unmount', async t => {
  const reset = deferred(), h = providerHarness(t, { reset: () => reset.promise }); await h.flush();
  const choice = h.value.chooseWallet(), cancelled = assert.rejects(choice, { name: 'AbortError' }); await h.flush();
  await h.member({ subject: 'owner-next', email: 'next@example.test' }); await cancelled;
  reset.resolve(); await h.account({ isConnected: false, status: 'disconnected' }); assert.deepEqual(h.calls, ['disconnect']);
  const again = h.value.chooseWallet(), stopped = assert.rejects(again, { name: 'AbortError' }); h.unmount(); await stopped;
  await tick(); assert.deepEqual(h.calls, ['disconnect']);
});

test('a first wallet with no existing SDK connection safely delegates its reset before opening initial auth once', async t => {
  const h = providerHarness(t, { accountState: { isConnected: false, status: 'disconnected', address: undefined, embeddedWalletInfo: undefined } });
  await h.flush(); const choice = h.value.connectWallet(); await h.flush();
  assert.deepEqual(h.calls, ['disconnect', 'open']); assert.equal(h.value.isConnected, false);
  await h.account({ isConnected: true, status: 'connected', address: other, embeddedWalletInfo: { user: { email: 'new@example.test' } } });
  await choice; await h.flush(); assert.equal(h.value.address, other); assert.equal(h.value.isLinked, false);
});

test('an SDK restoration placeholder cannot authorize reset or opening auth before its actual disconnected observation', async () => {
  let resets = 0, opens = 0;
  const choice = createReownWalletSwitchRequest({ initialState: { status: 'restoring', disconnected: false, modalOpen: false },
    disconnect: () => { resets++; }, open: () => { opens++; } });
  await tick(); assert.equal(resets, 0); assert.equal(opens, 0);
  choice.update({ status: 'restoring', disconnected: false, modalOpen: false });
  await tick(); assert.equal(resets, 0);
  choice.update({ status: 'disconnected', disconnected: true, modalOpen: false });
  await tick(); assert.equal(resets, 1); assert.equal(opens, 1);
  choice.update({ status: 'connected', disconnected: false, modalOpen: false }); await choice.promise;
});

test('a pending authoritative binding read hides the restored SDK candidate until its own linked address is confirmed', async t => {
  const pending = deferred(), h = providerHarness(t, { readBinding: () => pending.promise });
  await h.flush();
  assert.equal(h.value.linkStatus, 'loading'); assert.equal(h.value.address, '');
  assert.equal(h.value.isConnected, false); assert.equal(h.value.isLinked, false);
  assert.deepEqual(h.calls, []);
  pending.resolve({ linked: true, address }); await h.flush();
  assert.equal(h.value.linkStatus, 'linked'); assert.equal(h.value.address, address);
  assert.equal(h.value.isConnected, true); assert.equal(h.value.isLinked, true);
  assert.deepEqual(await h.value.connectWallet(), { connected: true });
  assert.deepEqual(h.calls, []);
});

test('a failed authoritative binding read never presents the restored SDK account as the member wallet', async t => {
  const h = providerHarness(t, { readBinding: async () => { throw Error('synthetic_binding_unavailable'); } });
  await h.flush();
  assert.equal(h.value.linkStatus, 'error'); assert.equal(h.value.address, '');
  assert.equal(h.value.isConnected, false); assert.equal(h.value.isLinked, false);
  assert.throws(() => h.value.getCompanyPaymentProvider());
  assert.deepEqual(h.calls, []);
});

test('one explicit activation coalesces fresh connection and ownership proof without a second application action', async t => {
  const h = providerHarness(t, { proof: true, accountState: { embeddedWalletInfo: undefined } }); await h.flush();
  const first = h.value.prepareWallet(), second = h.value.prepareWallet(); assert.equal(first, second);
  await h.flush(); assert.deepEqual(h.calls, ['disconnect']);
  await h.account({ isConnected: false, status: 'disconnected' }); assert.deepEqual(h.calls, ['disconnect', 'open']);
  await h.account({ isConnected: true, status: 'connected', address: other });
  assert.deepEqual(await first, { linked: true, address: other });
  assert.equal(h.value.prepareWallet(), first, 'A completed canonical proof remains idempotent before binding state publication');
  await h.flush();
  assert.equal(h.value.isLinked, true); assert.deepEqual(h.calls, ['disconnect', 'open', 'challenge', 'sign', 'confirm']);
  assert.deepEqual(await h.value.prepareWallet(), { linked: true, address: other });
  assert.deepEqual(h.calls, ['disconnect', 'open', 'challenge', 'sign', 'confirm']);
});

test('an activation cancelled by unmount cannot request ownership proof after late SDK disconnection', async t => {
  const reset = deferred(), h = providerHarness(t, { reset: () => reset.promise }); await h.flush();
  const pending = h.value.prepareWallet(), cancelled = assert.rejects(pending, { name: 'AbortError' });
  await h.flush(); assert.deepEqual(h.calls, ['disconnect']); h.unmount(); await cancelled;
  reset.resolve(); await tick(); assert.deepEqual(h.calls, ['disconnect']);
});

test('an explicit binding refresh invalidates completed activation before same-tick calls and returns only the new authoritative address', async t => {
  let response = { linked: true, address };
  const h = providerHarness(t, { readBinding: () => response }); await h.flush();
  const previous = h.value.prepareWallet(); assert.deepEqual(await previous, { linked: true, address });
  const pending = deferred(); response = pending.promise;
  const refresh = h.value.refreshLink(), activation = h.value.prepareWallet();
  assert.notEqual(activation, previous); await h.flush();
  assert.equal(h.value.linkStatus, 'loading'); assert.equal(h.value.address, '');
  pending.resolve({ linked: true, address: other }); await refresh; await h.flush();
  assert.deepEqual(await activation, { linked: true, address: other }); assert.deepEqual(h.calls, []);
});

test('a refreshed binding error cannot reuse an earlier completed activation acknowledgement', async t => {
  let response = { linked: true, address };
  const h = providerHarness(t, { readBinding: () => response }); await h.flush();
  const previous = h.value.prepareWallet(); await previous;
  const pending = deferred(); response = pending.promise;
  const refresh = h.value.refreshLink(), failedRefresh = assert.rejects(refresh, /synthetic_refresh_failure/);
  const activation = h.value.prepareWallet(), failedActivation = assert.rejects(activation, /wallet_status_unavailable/);
  assert.notEqual(activation, previous); pending.reject(Error('synthetic_refresh_failure'));
  await failedRefresh; await h.flush(); await failedActivation;
  assert.equal(h.value.linkStatus, 'error'); assert.equal(h.value.address, ''); assert.deepEqual(h.calls, []);
});

test('a refreshed unlinked binding cannot reuse a completed activation and requires fresh selection instead', async t => {
  let response = { linked: true, address };
  const h = providerHarness(t, { readBinding: () => response, accountState: { embeddedWalletInfo: undefined } }); await h.flush();
  const previous = h.value.prepareWallet(); await previous;
  const pending = deferred(); response = pending.promise;
  const refresh = h.value.refreshLink(), activation = h.value.prepareWallet();
  const cancelled = assert.rejects(activation, { name: 'AbortError' });
  assert.notEqual(activation, previous); pending.resolve({ linked: false }); await refresh; await h.flush();
  assert.equal(h.value.linkStatus, 'unlinked'); assert.equal(h.value.walletNeedsAccountSelection, true);
  assert.equal(h.value.address, ''); assert.deepEqual(h.calls, ['disconnect']);
  h.unmount(); await cancelled;
});

test('an authoritative read already pending preserves activation coalescing until its canonical result arrives', async t => {
  const pending = deferred(), h = providerHarness(t, { readBinding: () => pending.promise }); await h.flush();
  const first = h.value.prepareWallet(), refresh = h.value.refreshLink(), second = h.value.prepareWallet();
  assert.equal(first, second); pending.resolve({ linked: true, address });
  await refresh; await h.flush(); assert.deepEqual(await first, { linked: true, address }); assert.deepEqual(h.calls, []);
});

test('confirmed member logout disconnects once and immediately denies a captured wallet provider without another signature', async t => {
  const h = providerHarness(t, { bound: true }); await h.flush();
  const getProvider = h.value.getCompanyPaymentProvider;
  assert.doesNotThrow(getProvider);
  h.logout(); h.logout();
  assert.deepEqual(h.calls, ['disconnect']);
  assert.throws(getProvider, { message: 'personal_company_wallet_unavailable' });
  await assert.rejects(h.value.prepareWallet(), { name: 'AbortError' });
  h.unmount(); h.logout(); assert.deepEqual(h.calls, ['disconnect']);
});

test('logout cancels an unfinished activation and a late binding response cannot authenticate, sign or fund', async t => {
  const pending = deferred(); let signal;
  const h = providerHarness(t, { readBinding: options => { signal = options.signal; return pending.promise; } }); await h.flush();
  const activation = h.value.prepareWallet(), cancelled = assert.rejects(activation, { name: 'AbortError' });
  h.logout(); assert.equal(signal.aborted, true); await cancelled;
  pending.resolve({ linked: true, address }); await h.flush();
  assert.deepEqual(h.calls, ['disconnect']);
  assert.throws(h.value.getCompanyPaymentProvider, { message: 'personal_company_wallet_unavailable' });
});

test('wallet SDK disconnection failure cannot reopen a signer or require another login during confirmed logout', async t => {
  const h = providerHarness(t, { bound: true, reset: async () => { throw Error('synthetic SDK failure'); } }); await h.flush();
  assert.doesNotThrow(() => h.logout()); await h.flush();
  assert.deepEqual(h.calls, ['disconnect']);
  assert.throws(h.value.getCompanyPaymentProvider, { message: 'personal_company_wallet_unavailable' });
  await assert.rejects(h.value.prepareWallet(), { name: 'AbortError' });
});

test('a snapshotted logout still disconnects once when the parent boundary unmounts the provider first', async t => {
  const h = providerHarness(t, { bound: true }); await h.flush();
  const notify = h.snapshotLogout(); h.unmount(); notify(); notify();
  assert.deepEqual(h.calls, ['disconnect']);
  assert.throws(h.value.getCompanyPaymentProvider, { message: 'personal_company_wallet_unavailable' });
});

test('every captured public wallet action rejects after logout without reopening auth or starting another lookup', async t => {
  let reads = 0;
  const h = providerHarness(t, { bound: true, readBinding: async () => { reads++; return { linked: true, address }; } }); await h.flush();
  const previous = h.value; assert.equal(reads, 1);
  h.logout();
  for (const method of ['openAccount', 'openConnect', 'reconnectWallet', 'connectWallet', 'refreshLink', 'linkWallet', 'startOnramp', 'openOnramp', 'prepareWallet']) {
    await assert.rejects(() => previous[method](), { name: 'AbortError' }, method);
  }
  assert.equal(reads, 1); assert.deepEqual(h.calls, ['disconnect']);
});

test('a captured disconnected-wallet connection callback cannot open the SDK after logout', async t => {
  const h = providerHarness(t, { bound: true, accountState: { isConnected: false, status: 'disconnected', address: undefined } }); await h.flush();
  const connect = h.value.connectWallet; h.logout();
  await assert.rejects(connect(), { name: 'AbortError' });
  assert.deepEqual(h.calls, ['disconnect']);
});

test('a captured signer callback cannot expose the former bound provider after the SDK account changes', async t => {
  const h = providerHarness(t, { bound: true }); await h.flush();
  const captured = h.value.getCompanyPaymentProvider;
  assert.doesNotThrow(captured); await h.account({ address: other });
  assert.equal(h.value.isLinked, false); assert.throws(h.value.getCompanyPaymentProvider, { message: 'personal_company_wallet_unavailable' });
  assert.throws(captured, { message: 'personal_company_wallet_unavailable' });
  await h.account({ address }); assert.equal(h.value.isLinked, true);
  assert.throws(captured, { message: 'personal_company_wallet_unavailable' }); assert.doesNotThrow(h.value.getCompanyPaymentProvider);
  assert.deepEqual(h.calls, []);
});

test('a captured proof callback cannot reuse a selected candidate after the SDK account changes away and back', async t => {
  const h = providerHarness(t, { proof: true, accountState: { embeddedWalletInfo: undefined } }); await h.flush();
  const choice = h.value.chooseWallet(); await h.flush();
  await h.account({ isConnected: false, status: 'disconnected' });
  await h.account({ isConnected: true, status: 'connected', address: other }); await choice; await h.flush();
  const captured = h.value.linkWallet; assert.equal(h.value.walletNeedsAccountSelection, false);
  await h.account({ address }); await h.account({ address: other });
  assert.equal(h.value.walletNeedsAccountSelection, true); assert.equal(h.value.address, '');
  await assert.rejects(captured(), { message: 'wallet_address_mismatch' }); await h.flush();
  assert.deepEqual(h.calls, ['disconnect', 'open']); assert.equal(h.value.linkStatus, 'unlinked');
});

test('SDK account replacement during a pending ownership signature cannot confirm, publish or leak a stale error into the new candidate', async t => {
  const signature = deferred(), started = deferred();
  const h = providerHarness(t, { proof: true, accountState: { embeddedWalletInfo: undefined },
    signProof() { started.resolve(); return signature.promise; } }); await h.flush();
  const choice = h.value.chooseWallet(); await h.flush(); await h.account({ isConnected: false, status: 'disconnected' });
  await h.account({ isConnected: true, status: 'connected', address: other }); await choice; await h.flush();
  const proof = h.value.linkWallet(); await started.promise;
  await h.account({ address }); signature.resolve(`0x${'1'.repeat(130)}`);
  await assert.rejects(proof, { message: 'wallet_address_mismatch' }); await h.flush();
  assert.deepEqual(h.calls, ['disconnect', 'open', 'challenge', 'sign']);
  assert.equal(h.value.linkStatus, 'unlinked'); assert.equal(h.value.isLinked, false); assert.equal(h.value.linkError, '');
});

test('a captured signer callback remains obsolete across a member A → B → A transition', async t => {
  const h = providerHarness(t, { bound: true }); await h.flush(); const captured = h.value.getCompanyPaymentProvider;
  await h.member({ subject: 'owner-next', email: 'next@example.test' });
  assert.throws(captured, { message: 'personal_company_wallet_unavailable' });
  await h.member({ subject: 'owner-new', email: 'new@example.test' });
  assert.throws(captured, { message: 'personal_company_wallet_unavailable' });
  assert.deepEqual(h.calls, []);
});
