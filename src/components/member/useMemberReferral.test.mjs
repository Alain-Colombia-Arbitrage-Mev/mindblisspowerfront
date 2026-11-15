import assert from 'node:assert/strict';
import test from 'node:test';
import { registrationViewHarness } from '../../app/register/registration-view-test-harness.mjs';
import { memberSessionOwnerKey } from '../../lib/member-session-boundary.mjs';
const A = { subject: 'owner-A', email: 'same@example.test' }, B = { subject: 'owner-B', email: A.email };
const data = code => ({ positioned: false, code, link: `https://app.mindblisspower.com/register?ref=${code}` });
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const flush = () => new Promise(resolve => setImmediate(resolve));
function fixture(t) {
  let owner = A, cached = null, clears = 0;
  const calls = [], signals = new Set();
  const subscribe = callback => { signals.add(callback); return () => signals.delete(callback); };
  const h = registrationViewHarness('../../components/member/useMemberReferral.jsx', {
    '@/lib/member-session-context': { useMemberSession: () => owner }, '@/lib/member-session-boundary.mjs': { memberSessionOwnerKey },
    '@/lib/member-referral-client.mjs': { cachedMemberReferral: () => cached,
      clearMemberReferralCache: () => { cached = null; clears++; }, readMemberReferral: (session, options) => { const wait = deferred(); calls.push({ session, options, wait }); return wait.promise; } },
    '@/lib/member-logout-sync.mjs': { subscribeMemberLogout: subscribe }, '@/lib/member-session-sync.mjs': { subscribeMemberSessionReplacement: subscribe },
  });
  t.after(() => h.unmount());
  return { h, calls, setOwner: value => { owner = value; }, setCached: value => { cached = value; }, retire: () => { for (const callback of [...signals]) callback(); }, get clears() { return clears; } };
}
test('mount performs one owner-bound read, preserves a ready link through transient refresh failure and never retries automatically', async t => {
  const f = fixture(t); f.h.render(); assert.equal(f.calls.length, 1); assert.deepEqual(f.calls[0].session, A);
  f.calls[0].wait.resolve(data('A')); await flush(); assert.equal(f.h.render().data.code, 'A');
  const refresh = f.h.render().refresh(); assert.equal(f.calls.length, 2); assert.equal(f.h.render().data.code, 'A');
  f.calls[1].wait.reject(Object.assign(Error('temporary'), { status: 503 })); await refresh;
  assert.equal(f.h.render().data.code, 'A'); assert.equal(f.h.render().error.status, 503); assert.equal(f.calls.length, 2);
});
test('changed subject with the same email immediately masks old data and ignores a late old read', async t => {
  const f = fixture(t), oldScope = f.h.render().canShare; const old = f.calls[0]; assert.equal(oldScope(), true);
  f.setOwner(B); assert.equal(f.h.render().data, null); assert.equal(old.options.signal.aborted, true); assert.equal(f.calls.length, 2);
  assert.equal(oldScope(), false, 'captured sharing handlers cannot use the previous owner');
  old.wait.resolve(data('A')); await flush(); assert.equal(f.h.render().data, null);
  f.calls[1].wait.resolve(data('B')); await flush(); assert.equal(f.h.render().data.code, 'B');
});
test('authorization errors remove the displayed code, while logout cancels and retires captured refresh handlers', async t => {
  const f = fixture(t); f.h.render(); f.calls[0].wait.resolve(data('A')); await flush(); const captured = f.h.render().refresh;
  const action = captured(); f.calls[1].wait.reject(Object.assign(Error('denied'), { status: 409 })); await action; assert.equal(f.h.render().data, null);
  f.retire(); assert.ok(f.clears > 0); assert.equal(f.h.render().data, null); await captured(); assert.equal(f.calls.length, 2);
  assert.equal(f.h.render().canShare(), false);
});
test('an unmounted read cannot publish or dispatch a captured refresh', async t => {
  const f = fixture(t), value = f.h.render(); f.h.unmount(); f.calls[0].wait.resolve(data('A')); await flush(); await value.refresh(); assert.equal(f.calls.length, 1);
});
