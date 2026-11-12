import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { createHeadlessPaymentConnection, headlessPaymentFailure } from './reown-headless-payment.mjs';

const address = `0x${'1'.repeat(40)}`, other = `0x${'2'.repeat(40)}`;
const tick = async () => { for (let index = 0; index < 12; index++) await new Promise(resolve => setImmediate(resolve)); };
const deferred = () => { let resolve, reject; const promise = new Promise((done, fail) => { resolve = done; reject = fail; }); return { promise, resolve, reject }; };
function harness(overrides = {}) {
  const calls = [], states = [];
  const snapshot = { live: true, owner: 'A', generation: 1, available: true, email: 'a@example.test', linkStatus: 'unlinked', linkedAddress: '', address: '', isConnected: false, providerReady: false, candidate: false };
  let clock = 1_000_000, controller;
  const notify = () => controller.update();
  const connected = () => { Object.assign(snapshot, { address, isConnected: true, providerReady: true }); notify(); };
  controller = createHeadlessPaymentConnection({ read: () => snapshot, onState: value => states.push(value),
    reset: async () => { calls.push('reset'); Object.assign(snapshot, { isConnected: false, candidate: false }); notify(); },
    requestEmail: async email => { calls.push(['email', email]); return { action: 'VERIFY_OTP' }; },
    verifyEmail: async otp => { calls.push(['otp', otp]); connected(); },
    confirmDevice: async () => { calls.push('device'); },
    connectSocial: async provider => { calls.push(['social', provider]); connected(); },
    connectExternal: async id => { calls.push(['external', id]); connected(); },
    openNative: async () => { calls.push('native'); connected(); },
    markCandidate: () => { calls.push('candidate'); snapshot.candidate = true; notify(); },
    link: async () => { calls.push('link'); return { linked: true, address }; },
    fetchWallets: async () => calls.push('wallets'), cleanup: () => calls.push('cleanup'), now: () => clock,
    ...overrides,
  });
  return { controller, snapshot, calls, states, notify, connected, advance: ms => { clock += ms; } };
}

test('constructing and observing headless payment connection performs no auth, proof or financial work', () => {
  const h = harness(); h.notify(); h.notify();
  assert.deepEqual(h.calls, []); assert.deepEqual(h.states, []);
});

test('a live matching canonical wallet skips picker, disconnect, email and ownership proof', async () => {
  const h = harness(); Object.assign(h.snapshot, { linkedAddress: address, linkStatus: 'linked', address, isConnected: true, providerReady: true });
  assert.deepEqual(await h.controller.start(false), { connected: true });
  assert.deepEqual(await h.controller.start(true), { linked: true, address });
  assert.deepEqual(h.calls, []);
});

test('email activation sends once per manual action, retains code errors and links only after explicit valid OTP', async () => {
  let bad = true;
  const h = harness({ verifyEmail: async otp => { h.calls.push(['otp', otp]); if (bad) throw new Error('Invalid OTP'); h.connected(); } });
  const pending = h.controller.start(true); assert.equal(h.controller.start(true), pending);
  await tick(); assert.equal(h.controller.state.phase, 'choosing'); assert.deepEqual(h.calls, ['reset', 'wallets']);
  await h.controller.requestEmail('a@example.test'); await h.controller.requestEmail('a@example.test');
  assert.equal(h.calls.filter(item => Array.isArray(item) && item[0] === 'email').length, 1);
  assert.equal(h.controller.state.phase, 'code'); assert.equal(h.controller.state.resendAt, 1_060_000);
  await assert.rejects(h.controller.verifyEmail('123456'), { message: 'Invalid OTP' });
  assert.equal(h.controller.state.phase, 'code'); assert.equal(h.controller.state.error, 'invalid_otp'); assert.ok(!h.calls.includes('link'));
  bad = false; await h.controller.verifyEmail('654321');
  assert.deepEqual(await pending, { linked: true, address });
  assert.equal(h.calls.filter(item => item === 'link').length, 1); assert.equal(h.controller.state.phase, 'idle');
});

test('device approval stays manual and never automatically sends a second OTP', async () => {
  const h = harness({ requestEmail: async email => { h.calls.push(['email', email]); return { action: 'VERIFY_DEVICE' }; } });
  const pending = h.controller.start(false); await tick(); await h.controller.requestEmail('a@example.test');
  assert.equal(h.controller.state.phase, 'device'); assert.ok(!h.calls.includes('device'));
  await h.controller.confirmDevice(); assert.equal(h.controller.state.phase, 'code');
  assert.equal(h.calls.filter(item => Array.isArray(item) && item[0] === 'email').length, 1);
  await h.controller.verifyEmail('123456'); assert.deepEqual(await pending, { connected: true }); assert.ok(!h.calls.includes('link'));
});

test('an OTP request in flight is coalesced and cancellation prevents late code or wallet publication', async () => {
  const response = deferred(), h = harness({ requestEmail: async email => { h.calls.push(['email', email]); return response.promise; } });
  const pending = h.controller.start(true); const stopped = assert.rejects(pending, { name: 'AbortError' }); await tick();
  const first = h.controller.requestEmail('a@example.test'), rejected = assert.rejects(first, { name: 'AbortError' });
  await tick(); await h.controller.requestEmail('a@example.test');
  h.controller.cancel(); await stopped; await rejected; response.resolve({ action: 'CONNECT' }); await tick();
  assert.equal(h.controller.state.phase, 'idle'); assert.ok(!h.calls.includes('candidate')); assert.ok(!h.calls.includes('link'));
});

test('a parent abort signal cancels activation and late Google completion cannot link or resume payment', async () => {
  const result = deferred(), abort = new AbortController(), h = harness({ connectSocial: () => result.promise });
  const pending = h.controller.start(true, { signal: abort.signal }), rejected = assert.rejects(pending, { name: 'AbortError' }); await tick();
  const social = h.controller.connectSocial('google'), failed = assert.rejects(social, { name: 'AbortError' }); await tick();
  abort.abort(); await rejected; await failed; result.resolve(); h.connected(); await tick();
  assert.ok(!h.calls.includes('candidate')); assert.ok(!h.calls.includes('link'));
});

test('owner A to B to A invalidates stale callbacks and cannot reuse a late wallet result', async () => {
  const result = deferred(), h = harness({ connectSocial: () => result.promise });
  const pending = h.controller.start(true), rejected = assert.rejects(pending, { name: 'AbortError' }); await tick();
  const social = h.controller.connectSocial('google'), failed = assert.rejects(social, { name: 'AbortError' }); await tick();
  h.snapshot.owner = 'B'; h.snapshot.generation++; h.notify(); h.snapshot.owner = 'A'; h.snapshot.generation++; h.notify();
  await rejected; await failed; result.resolve(); h.connected(); await tick();
  assert.ok(!h.calls.includes('candidate')); assert.ok(!h.calls.includes('link'));
});

test('a different authenticated address cannot replace a canonical backend-linked destination', async () => {
  const h = harness(); h.snapshot.linkStatus = 'linked'; h.snapshot.linkedAddress = other;
  const pending = h.controller.start(false), mismatch = assert.rejects(pending, { message: 'wallet_address_mismatch' }); await tick();
  await h.controller.connectSocial('google'); await mismatch;
  assert.equal(h.controller.state.error, 'mismatch'); assert.ok(!h.calls.includes('candidate')); assert.ok(!h.calls.includes('link'));
});

test('an explicitly selected unlinked candidate needs only its existing owner proof, without a new authentication', async () => {
  const h = harness(); Object.assign(h.snapshot, { address, isConnected: true, providerReady: true, candidate: true });
  assert.deepEqual(await h.controller.start(true), { linked: true, address }); assert.deepEqual(h.calls, ['link']);
});

test('a rejected or mismatched backend ownership acknowledgement never reports activation success', async () => {
  const h = harness({ link: async () => ({ linked: true, address: other }) });
  const pending = h.controller.start(true), rejected = assert.rejects(pending, { message: 'wallet_address_mismatch' }); await tick();
  await h.controller.connectExternal('synthetic-extension'); await rejected; assert.equal(h.controller.state.error, 'mismatch');
});

test('headless disabled and pre-aborted starts fail before provider lookup or resetting a wallet', async () => {
  const h = harness(); h.snapshot.available = false;
  await assert.rejects(h.controller.start(true), { message: 'headless_unavailable' });
  const abort = new AbortController(); abort.abort(); h.snapshot.available = true;
  await assert.rejects(h.controller.start(true, { signal: abort.signal }), { name: 'AbortError' }); assert.deepEqual(h.calls, []);
});

test('the secure native wallet fallback connects only and never creates or submits a payment', async () => {
  const h = harness(), pending = h.controller.start(false); await tick(); await h.controller.openNative();
  assert.deepEqual(await pending, { connected: true }); assert.ok(h.calls.includes('native')); assert.ok(!h.calls.includes('link'));
});

test('safe failure messages are bounded enums rather than secrets or arbitrary SDK error text', () => {
  assert.equal(headlessPaymentFailure(new Error('https://auth.example.test/?secret=private')), 'connection_failed');
  assert.equal(headlessPaymentFailure({ status: 429 }), 'rate_limited');
  assert.equal(headlessPaymentFailure({ code: 4001 }), 'rejected');
  assert.equal(headlessPaymentFailure({ name: 'TimeoutError' }), 'timeout');
});

test('cancel clears a terminal error and a fresh explicit start can reconnect', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const h = harness({ timeoutMs: 5000 }), pending = h.controller.start(true), rejected = assert.rejects(pending, { name: 'TimeoutError' });
  await tick(); t.mock.timers.tick(5001); await rejected;
  assert.equal(h.controller.state.phase, 'error'); assert.equal(h.controller.state.error, 'timeout');
  h.controller.cancel(); assert.equal(h.controller.state.phase, 'idle'); assert.equal(h.controller.state.error, '');
  const next = h.controller.start(false); await tick(); await h.controller.connectSocial('google');
  assert.deepEqual(await next, { connected: true }); assert.ok(!h.calls.includes('link')); t.mock.timers.reset();
});

test('closing and reopening activation does not bypass the same owner email cooldown', async () => {
  const h = harness(), pending = h.controller.start(true), stopped = assert.rejects(pending, { name: 'AbortError' });
  await tick(); await h.controller.requestEmail('a@example.test'); h.controller.cancel(); await stopped;
  const next = h.controller.start(true), cancelled = assert.rejects(next, { name: 'AbortError' }); await tick();
  await h.controller.requestEmail('a@example.test');
  assert.equal(h.controller.state.resendAt, 1_060_000);
  assert.equal(h.calls.filter(item => Array.isArray(item) && item[0] === 'email').length, 1);
  h.advance(60_001); await h.controller.requestEmail('a@example.test');
  assert.equal(h.calls.filter(item => Array.isArray(item) && item[0] === 'email').length, 2);
  h.controller.cancel(); await cancelled;
});

test('a resolved SDK reset alone cannot offer login until disconnection is observed', async () => {
  const h = harness({ reset: async () => h.calls.push('reset') });
  Object.assign(h.snapshot, { address: other, isConnected: true, providerReady: true, linkedAddress: address, linkStatus: 'linked' });
  const pending = h.controller.start(false); await tick();
  assert.equal(h.controller.state.phase, 'connecting'); assert.deepEqual(h.calls, ['reset']);
  h.snapshot.isConnected = false; h.notify(); await tick(); assert.equal(h.controller.state.phase, 'choosing');
  await h.controller.connectSocial('google'); assert.deepEqual(await pending, { connected: true });
});

test('public SDK feature updates retain the original native scaffold needed for signing and other screens', async () => {
  function method(path, name) {
    const source = ts.createSourceFile(path, readFileSync(new URL(path, import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true);
    let result;
    function visit(node) { if (ts.isMethodDeclaration(node) && node.name?.getText(source) === name) result = node.getText(source); ts.forEachChild(node, visit); }
    visit(source); assert.ok(result, `Installed SDK method ${name} missing`);
    return result.replace(/^async\s+/, 'async function ').replace(new RegExp(`^${name}\\(`), `function ${name}(`);
  }
  const provider = readFileSync(new URL('../components/reown/ReownProvider.jsx', import.meta.url), 'utf8');
  assert.match(provider, /appKitInstance\.updateFeatures\(\{ \.\.\.OptionsController\.state\.features, headless: true \}\)/);
  let local, loads = 0, appended = 0;
  const optionsController = { state: {}, setFeatures: features => { local = features; } };
  const client = { options: { features: { reownAuthentication: true, email: true, socials: ['google', 'apple'], onramp: false } }, remoteFeatures: { headless: true },
    loadModalComponents: async () => { loads++; } };
  const update = vm.runInNewContext(`(${method('../../node_modules/@reown/appkit/dist/esm/src/client/appkit-base-client.js', 'updateFeatures')})`, { OptionsController: optionsController });
  update.call(client, { ...client.options.features, headless: true });
  assert.equal(local.headless, true); assert.equal(local.reownAuthentication, true); assert.equal(client.options.features.headless, undefined);
  const inject = vm.runInNewContext(`let isInitialized=false; (${method('../../node_modules/@reown/appkit/dist/esm/src/client/appkit.js', 'injectModalUi')})`, {
    CoreHelperUtil: { isClient: () => true }, CoreConstantsUtil: { DEFAULT_FEATURES: { headless: false } }, OptionsController: optionsController,
    document: { querySelector: () => null, createElement: () => ({}), body: { insertAdjacentElement: () => appended++ } }, console,
  });
  await inject.call(client); assert.equal(loads, 1); assert.equal(appended, 1);
});
