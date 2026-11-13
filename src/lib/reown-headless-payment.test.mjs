import assert from 'node:assert/strict';
import test from 'node:test';
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

test('an explicit canonical activation resumes its retained frame session without reset, OTP or proof', async () => {
  for (const prepare of [false, true]) {
    const h = harness({ restore: async (_scope, expected) => { assert.equal(expected, address); h.calls.push('resume'); h.connected(); return true; } });
    Object.assign(h.snapshot, { linkedAddress: address, linkStatus: 'linked' });
    assert.deepEqual(h.calls, [], 'mount and observation do not resume authentication');
    assert.deepEqual(await h.controller.start(prepare), prepare ? { linked: true, address } : { connected: true });
    assert.deepEqual(h.calls, ['resume']); assert.equal(h.controller.state.phase, 'idle');
  }
});

test('a frame resume acknowledgement waits for the real canonical SDK account and signing provider', async () => {
  const h = harness({ restore: async () => { h.calls.push('resume'); return true; } });
  Object.assign(h.snapshot, { linkedAddress: address, linkStatus: 'linked' });
  const pending = h.controller.start(true); await tick();
  assert.equal(h.controller.state.phase, 'connecting'); assert.deepEqual(h.calls, ['resume']);
  Object.assign(h.snapshot, { address, isConnected: true, providerReady: false }); h.notify(); await tick();
  assert.equal(h.controller.state.phase, 'connecting'); h.snapshot.providerReady = true; h.notify();
  assert.deepEqual(await pending, { linked: true, address }); assert.deepEqual(h.calls, ['resume']);
});

test('only a canonically bound disconnected wallet probes a frame; an absent session offers the existing chooser', async () => {
  for (const mode of ['unlinked', 'foreign-connected', 'bound-absent']) {
    const h = harness({ restore: async () => { h.calls.push('resume'); return false; } });
    if (mode !== 'unlinked') Object.assign(h.snapshot, { linkedAddress: address, linkStatus: 'linked' });
    if (mode === 'foreign-connected') Object.assign(h.snapshot, { address: other, isConnected: true, providerReady: true });
    const pending = h.controller.start(false), aborted = assert.rejects(pending, { name: 'AbortError' }); await tick();
    assert.equal(h.controller.state.phase, 'choosing');
    assert.deepEqual(h.calls, mode === 'bound-absent' ? ['resume', 'reset', 'wallets'] : ['reset', 'wallets']);
    h.controller.cancel(); await aborted;
  }
});

test('frame infrastructure errors and the existing deadline do not destructively reset a possibly live session', async t => {
  const failed = harness({ restore: async () => { failed.calls.push('resume'); throw new Error('frame unavailable'); } });
  Object.assign(failed.snapshot, { linkedAddress: address, linkStatus: 'linked' });
  await assert.rejects(failed.controller.start(false), { message: 'frame unavailable' });
  assert.deepEqual(failed.calls, ['resume']); assert.equal(failed.controller.state.phase, 'error');
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const late = deferred(), h = harness({ timeoutMs: 5000, restore: () => { h.calls.push('resume'); return late.promise; } });
  Object.assign(h.snapshot, { linkedAddress: address, linkStatus: 'linked' });
  const pending = h.controller.start(true), rejected = assert.rejects(pending, { name: 'TimeoutError' });
  await tick(); t.mock.timers.tick(5001); await rejected;
  late.resolve(true); h.connected(); await tick();
  assert.equal(h.controller.state.error, 'timeout'); assert.deepEqual(h.calls, ['resume']); t.mock.timers.reset();
});

test('a frame resume cannot cross binding, account, owner or parent-operation boundaries', async () => {
  for (const boundary of ['binding', 'address', 'owner', 'parent']) {
    const late = deferred(), parent = new AbortController();
    const h = harness({ restore: () => { h.calls.push('resume'); return late.promise; } });
    Object.assign(h.snapshot, { linkedAddress: address, linkStatus: 'linked' });
    const pending = h.controller.start(true, { signal: parent.signal });
    const rejected = assert.rejects(pending, boundary === 'binding' || boundary === 'address'
      ? { message: 'wallet_address_mismatch' } : { name: 'AbortError' });
    await tick();
    if (boundary === 'binding') h.snapshot.linkedAddress = other;
    if (boundary === 'address') h.snapshot.address = other;
    if (boundary === 'owner') { h.snapshot.owner = 'B'; h.snapshot.generation++; h.notify(); }
    if (boundary === 'parent') parent.abort();
    late.resolve(true); await rejected; assert.deepEqual(h.calls, ['resume']);
    if (boundary === 'parent') assert.equal(h.controller.state.phase, 'idle');
  }
});

test('an owner ABA before the first activation microtask cannot invoke a newer service for an older restore or reset', async () => {
  for (const linked of [false, true]) {
    const h = harness({ restore: async () => { h.calls.push('resume'); return true; } });
    if (linked) Object.assign(h.snapshot, { linkedAddress: address, linkStatus: 'linked' });
    const pending = h.controller.start(true), rejected = assert.rejects(pending, { name: 'AbortError' });
    h.snapshot.owner = 'B'; h.snapshot.generation++;
    h.snapshot.owner = 'A'; h.snapshot.generation++;
    await rejected; assert.deepEqual(h.calls, [], linked ? 'stale resume cannot touch the new frame' : 'stale reset cannot disconnect the new session');
  }
});

test('a canonical connected account waits for its late provider without resetting or asking to authenticate again', async () => {
  for (const prepare of [false, true]) {
    const h = harness();
    Object.assign(h.snapshot, { linkedAddress: address, linkStatus: 'linked', address, isConnected: true, providerReady: false });
    const pending = h.controller.start(prepare); await tick();
    assert.equal(h.controller.state.phase, 'connecting'); assert.deepEqual(h.calls, []);
    h.snapshot.providerReady = true; h.notify();
    assert.deepEqual(await pending, prepare ? { linked: true, address } : { connected: true });
    assert.equal(h.controller.state.phase, 'idle'); assert.deepEqual(h.calls, []);
    assert.ok(h.states.every(state => state.phase !== 'choosing' && state.phase !== 'verifying'));
  }
});

test('waiting for a restored provider uses the existing deadline and a later ready session can be reused without authentication', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const h = harness({ timeoutMs: 5000 });
  Object.assign(h.snapshot, { linkedAddress: address, linkStatus: 'linked', address, isConnected: true, providerReady: false });
  const pending = h.controller.start(false), rejected = assert.rejects(pending, { name: 'TimeoutError' });
  await tick(); t.mock.timers.tick(5001); await rejected;
  assert.deepEqual(h.calls, []); assert.equal(h.snapshot.isConnected, true);
  assert.equal(h.controller.state.error, 'timeout');
  h.snapshot.providerReady = true; h.notify();
  assert.deepEqual(await h.controller.start(false), { connected: true }); assert.deepEqual(h.calls, []);
  t.mock.timers.reset();
});

test('cancel or a parent abort stops a provider wait and its late provider cannot revive activation', async () => {
  for (const viaParent of [false, true]) {
    const h = harness(), parent = new AbortController();
    Object.assign(h.snapshot, { linkedAddress: address, linkStatus: 'linked', address, isConnected: true, providerReady: false });
    const pending = h.controller.start(true, { signal: parent.signal }), rejected = assert.rejects(pending, { name: 'AbortError' });
    await tick(); if (viaParent) parent.abort(); else h.controller.cancel(); await rejected;
    h.snapshot.providerReady = true; h.notify(); await tick();
    assert.deepEqual(h.calls.filter(call => call !== 'cleanup'), []);
    assert.ok(h.states.every(state => state.phase !== 'choosing' && state.phase !== 'verifying'));
  }
});

test('a provider wait loses authority across owner A to B to A without resetting either session', async () => {
  const h = harness();
  Object.assign(h.snapshot, { linkedAddress: address, linkStatus: 'linked', address, isConnected: true, providerReady: false });
  const pending = h.controller.start(true), rejected = assert.rejects(pending, { name: 'AbortError' }); await tick();
  h.snapshot.owner = 'B'; h.snapshot.generation++; h.notify(); h.snapshot.owner = 'A'; h.snapshot.generation++; h.notify();
  await rejected; h.snapshot.providerReady = true; h.notify(); await tick();
  assert.deepEqual(h.calls, []);
  assert.deepEqual(await h.controller.start(false), { connected: true }); assert.deepEqual(h.calls, []);
});

test('a changed bound address, SDK address, binding or connection fails a provider wait before any authentication or ownership proof', async () => {
  for (const patch of [{ linkedAddress: other }, { address: other }, { linkStatus: 'unlinked' }, { isConnected: false }]) {
    const h = harness();
    Object.assign(h.snapshot, { linkedAddress: address, linkStatus: 'linked', address, isConnected: true, providerReady: false });
    const pending = h.controller.start(true), rejected = assert.rejects(pending, { message: 'wallet_address_mismatch' }); await tick();
    Object.assign(h.snapshot, patch, { providerReady: true }); h.notify(); await rejected;
    assert.deepEqual(h.calls, []); assert.equal(h.controller.state.error, 'mismatch');
    assert.ok(h.states.every(state => state.phase !== 'choosing' && state.phase !== 'verifying'));
  }
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

test('leaving the payment route clears a parent-cancelled activation for the same owner without altering its canonical wallet', async t => {
  const parent = new AbortController(), h = harness(); t.after(() => h.controller.cancel());
  Object.assign(h.snapshot, { linkedAddress: address, linkStatus: 'linked' });
  const pending = h.controller.start(false, { signal: parent.signal }), rejected = assert.rejects(pending, { name: 'AbortError' });
  await tick(); assert.equal(h.controller.state.phase, 'choosing'); parent.abort(); await rejected;
  assert.equal(h.controller.state.phase, 'idle'); assert.equal(h.controller.state.error, ''); assert.equal(h.controller.state.email, '');
  assert.equal(h.snapshot.linkedAddress, address); assert.equal(h.snapshot.linkStatus, 'linked');
  const next = h.controller.start(false); await tick(); assert.equal(h.controller.state.phase, 'choosing');
  await h.controller.connectSocial('google'); assert.deepEqual(await next, { connected: true });
  assert.equal(h.calls.filter(call => Array.isArray(call) && call[0] === 'email').length, 0);
  assert.ok(!h.calls.includes('link'));
});

test('an old parent abort and late OTP result cannot close or advance a newer activation', async t => {
  const emailResponse = deferred(), parent = new AbortController();
  const h = harness({ requestEmail: async () => emailResponse.promise }); t.after(() => h.controller.cancel());
  const old = h.controller.start(true, { signal: parent.signal }), stopped = assert.rejects(old, { name: 'AbortError' });
  await tick(); const email = h.controller.requestEmail('a@example.test'), rejected = assert.rejects(email, { name: 'AbortError' }); await tick();
  parent.abort(); const nextStart = h.states.length, next = h.controller.start(true);
  await stopped; await rejected; await tick();
  assert.equal(h.controller.state.phase, 'choosing');
  assert.ok(h.states.slice(nextStart).every(state => state.phase !== 'idle'));
  emailResponse.resolve({ action: 'VERIFY_OTP' }); await tick();
  assert.equal(h.controller.state.phase, 'choosing'); assert.ok(!h.calls.includes('link'));
  await h.controller.connectSocial('google'); assert.deepEqual(await next, { linked: true, address });
  assert.equal(h.calls.filter(call => call === 'link').length, 1);
});

test('route cancellation preserves the manual email resend cooldown without replaying an OTP', async t => {
  const parent = new AbortController(), h = harness(); t.after(() => h.controller.cancel());
  const old = h.controller.start(true, { signal: parent.signal }), stopped = assert.rejects(old, { name: 'AbortError' }); await tick();
  await h.controller.requestEmail('a@example.test'); parent.abort(); await stopped;
  assert.equal(h.controller.state.phase, 'idle');
  const next = h.controller.start(true), cancelled = assert.rejects(next, { name: 'AbortError' }); await tick();
  await h.controller.requestEmail('a@example.test');
  assert.equal(h.calls.filter(call => Array.isArray(call) && call[0] === 'email').length, 1);
  h.advance(60_001); await h.controller.requestEmail('a@example.test');
  assert.equal(h.calls.filter(call => Array.isArray(call) && call[0] === 'email').length, 2);
  h.controller.cancel(); await cancelled;
});

test('an SDK AbortError without a cancelled operation remains an actionable terminal error', async t => {
  const h = harness({ reset: async () => { throw Object.assign(new Error('SDK rejected restoration'), { name: 'AbortError' }); } });
  t.after(() => h.controller.cancel());
  await assert.rejects(h.controller.start(false), { name: 'AbortError' });
  assert.equal(h.controller.state.phase, 'error'); assert.equal(h.controller.state.error, 'cancelled');
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
