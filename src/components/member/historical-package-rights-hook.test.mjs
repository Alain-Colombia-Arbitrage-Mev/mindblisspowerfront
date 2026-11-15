import assert from 'node:assert/strict';
import test from 'node:test';
import { registrationViewHarness } from '../../app/register/registration-view-test-harness.mjs';

const ownerA = { subject: 'synthetic-owner-a', email: 'shared@example.test' };
const ownerB = { ...ownerA, subject: 'synthetic-owner-b' };
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
function fixture(t, read = async subject => ({ marker: subject, activeCount: 1 })) {
  const calls = [], signals = { logout: new Set(), replacement: new Set() };
  const subscribe = type => callback => { signals[type].add(callback); return () => signals[type].delete(callback); };
  const h = registrationViewHarness('../../components/member/useHistoricalPackageRights.jsx', {
    '@/lib/historical-package-rights-client.mjs': { readHistoricalPackageRights: (subject, options) => { calls.push({ subject, options }); return read(subject, options); } },
    '@/lib/member-logout-sync.mjs': { subscribeMemberLogout: subscribe('logout') },
    '@/lib/member-session-sync.mjs': { subscribeMemberSessionReplacement: subscribe('replacement') },
  });
  let session = ownerA, result;
  const render = (owner = session) => { session = owner; result = h.render(owner); return result; };
  const settle = async () => { for (let i = 0; i < 4; i++) { await new Promise(resolve => setImmediate(resolve)); render(); } return result; };
  t.after(() => h.unmount());
  return { calls, render, settle, unmount: () => h.unmount(), replay: () => h.replayEffects(),
    signal(type) { for (const callback of signals[type]) callback(); }, get result() { return result; }, signals };
}

test('historical rights read once for the mounted native owner, with no email selector or automatic repeats', async t => {
  const h = fixture(t); assert.equal(h.render().data, null); await h.settle();
  assert.equal(h.calls.length, 1); assert.equal(h.calls[0].subject, ownerA.subject);
  assert.deepEqual(Object.keys(h.calls[0].options), ['signal']);
  assert.equal(h.result.data.marker, ownerA.subject); assert.equal(h.result.loading, false);
  for (let i = 0; i < 10; i++) h.render(); await h.settle(); assert.equal(h.calls.length, 1);
  const withoutOwner = h.render({ email: ownerA.email }); assert.equal(withoutOwner.visible, false); assert.equal(withoutOwner.data, null);
  await h.settle(); assert.equal(h.calls.length, 1);
});

test('a same-email replacement owner immediately hides old rights and aborts/ignores its late response', async t => {
  const a = deferred(), b = deferred();
  const h = fixture(t, subject => subject === ownerA.subject ? a.promise : b.promise);
  h.render(); const captured = h.result.refresh;
  const replacement = h.render(ownerB); assert.equal(replacement.data, null);
  assert.equal(h.calls[0].options.signal.aborted, true); assert.equal(h.calls.length, 2);
  captured(); assert.equal(h.calls.length, 2, 'An old account callback cannot dispatch a new read');
  a.resolve({ marker: 'owner-a-private-right' }); await h.settle(); assert.equal(h.result.data, null);
  b.resolve({ marker: ownerB.subject }); await h.settle(); assert.equal(h.result.data.marker, ownerB.subject);
  assert.equal(h.calls.length, 2);
});

test('refresh clears a revocable old grant, permits one request at a time and never retries a failed read', async t => {
  const failure = deferred(); let count = 0;
  const h = fixture(t, async () => ++count === 1 ? { activeCount: 1 } : failure.promise);
  h.render(); await h.settle(); assert.equal(h.result.data.activeCount, 1);
  const refresh = h.result.refresh; refresh(); refresh(); h.render();
  assert.equal(h.calls.length, 2); assert.equal(h.result.data, null); assert.equal(h.result.loading, true);
  failure.reject(Object.assign(Error('member_package_rights_unavailable'), { status: 503 })); await h.settle();
  assert.equal(h.result.data, null); assert.equal(h.result.error, 'unavailable'); assert.equal(h.result.canRefresh, true);
  await h.settle(); assert.equal(h.calls.length, 2);
});

test('owner mismatch retires the view and prevents a captured or fresh refresh from using the new cookie', async t => {
  const h = fixture(t, async () => { throw Object.assign(Error('member_package_rights_owner_changed'), { status: 409 }); });
  h.render(); const old = h.result.refresh; await h.settle();
  assert.equal(h.result.data, null); assert.equal(h.result.canRefresh, false);
  old(); h.result.refresh(); await h.settle(); assert.equal(h.calls.length, 1);
});

for (const type of ['logout', 'replacement']) test(`${type} clears published rights and suppresses late results without a new request`, async t => {
  const pending = deferred(); let count = 0;
  const h = fixture(t, async () => ++count === 1 ? { activeCount: 1 } : pending.promise);
  h.render(); await h.settle(); const captured = h.result.refresh; captured(); h.render();
  h.signal(type); h.render(); assert.equal(h.result.data, null); assert.equal(h.result.canRefresh, false);
  assert.equal(h.calls[1].options.signal.aborted, true);
  pending.resolve({ activeCount: 999 }); await h.settle(); captured(); h.result.refresh();
  assert.equal(h.calls.length, 2); assert.equal(h.result.data, null);
});

test('unmount aborts the pending request, removes subscriptions and makes captured callbacks inert', async t => {
  const pending = deferred(), h = fixture(t, () => pending.promise);
  h.render(); const captured = h.result.refresh; h.unmount();
  assert.equal(h.calls[0].options.signal.aborted, true);
  assert.equal(h.signals.logout.size, 0); assert.equal(h.signals.replacement.size, 0);
  captured(); pending.resolve({ activeCount: 1 }); await new Promise(resolve => setImmediate(resolve));
  assert.equal(h.calls.length, 1);
});

test('StrictMode effect restoration retires its first read without permanently disabling the restored view', async t => {
  const first = deferred(); let count = 0;
  const h = fixture(t, () => ++count === 1 ? first.promise : Promise.resolve({ activeCount: 0 }));
  h.render(); h.replay(); assert.equal(h.calls[0].options.signal.aborted, true);
  first.resolve({ activeCount: 1 }); await h.settle();
  assert.equal(h.calls.length, 2); assert.equal(h.result.data.activeCount, 0); assert.equal(h.result.canRefresh, true);
});

test('a disabled deployment stays out of the UI without claiming access or retrying', async t => {
  const h = fixture(t, async () => { throw Object.assign(Error('member_package_rights_unconfigured'), { status: 503 }); });
  h.render(); await h.settle(); assert.equal(h.result.visible, false); assert.equal(h.result.data, null);
  await h.settle(); assert.equal(h.calls.length, 1);
});
