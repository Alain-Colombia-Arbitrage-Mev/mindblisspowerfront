import assert from 'node:assert/strict';
import test from 'node:test';
import { cachedMemberReferral, clearMemberReferralCache, readMemberReferral } from './member-referral-client.mjs';
import { profileSubjectHeader } from './member-profile.mjs';

const A = { subject: 'owner-A', email: 'member@example.test' }, B = { subject: 'owner-B', email: A.email };
const response = (code = 'MP-A') => ({ positioned: false, code, link: `https://app.mindblisspower.com/register?ref=${code}`,
  placement: 'automatic', generated: false, metrics: { total: 0, active: 0, pending: 0 }, referrals: [] });
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
test.beforeEach(clearMemberReferralCache); test.afterEach(clearMemberReferralCache);

test('unpositioned members read one permanent own-link request across concurrent consumers and navigation', async () => {
  const wait = deferred(), calls = [];
  const fetchImpl = async (url, init) => { calls.push({ url, init }); return wait.promise; };
  const first = readMemberReferral(A, { fetchImpl }), second = readMemberReferral(A, { fetchImpl });
  assert.equal(calls.length, 1); assert.equal(calls[0].url, '/api/member/referral');
  assert.equal(calls[0].init.headers['x-mindbliss-referral-subject'], profileSubjectHeader(A.subject));
  assert.equal(calls[0].init.credentials, 'same-origin'); assert.equal(calls[0].init.redirect, 'error');
  wait.resolve(Response.json(response())); assert.deepEqual(await first, response()); assert.deepEqual(await second, response());
  assert.deepEqual(await readMemberReferral(A, { fetchImpl }), response()); assert.equal(calls.length, 1);
});

test('cache and in-flight requests remain separate for different subjects even with the same email', async () => {
  const calls = [];
  const fetchImpl = async (_url, init) => { const subject = init.headers['x-mindbliss-referral-subject']; calls.push(subject); return Response.json(response(subject)); };
  await Promise.all([readMemberReferral(A, { fetchImpl }), readMemberReferral(B, { fetchImpl })]);
  assert.deepEqual(calls.sort(), [profileSubjectHeader(A.subject), profileSubjectHeader(B.subject)].sort());
  assert.notEqual(cachedMemberReferral(A).code, cachedMemberReferral(B).code);
  await assert.rejects(readMemberReferral({ email: A.email }, { fetchImpl }), error => error.status === 401); assert.equal(calls.length, 2);
});

test('transient refresh failures retain only a known same-owner code; authorization failure clears it', async () => {
  await readMemberReferral(A, { fetchImpl: async () => Response.json(response()) });
  let calls = 0;
  await assert.rejects(readMemberReferral(A, { refresh: true, fetchImpl: async () => { calls++; return Response.json({ error: 'unavailable' }, { status: 503 }); } }));
  assert.equal(calls, 1, 'no automatic retries'); assert.equal(cachedMemberReferral(A).code, 'MP-A'); assert.equal(cachedMemberReferral(B), null);
  await assert.rejects(readMemberReferral(A, { refresh: true, fetchImpl: async () => Response.json({}, { status: 403 }) }));
  assert.equal(cachedMemberReferral(A), null);
});

test('a missing or malformed code never replaces a known permanent link or becomes cached success', async () => {
  await readMemberReferral(A, { fetchImpl: async () => Response.json(response()) });
  for (const data of [{ positioned: false, code: null, link: null }, { ...response(), code: 'bad code' }, { ...response(), link: 'javascript:alert(1)' }]) {
    await assert.rejects(readMemberReferral(A, { refresh: true, fetchImpl: async () => Response.json(data) }));
    assert.equal(cachedMemberReferral(A).code, 'MP-A');
  }
});

test('one consumer aborts independently; logout/replacement cancels and rejects late cache writes', async () => {
  const wait = deferred(), controller = new AbortController(); let signal, calls = 0;
  const fetchImpl = async (_url, init) => { calls++; signal = init.signal; return wait.promise; };
  const first = readMemberReferral(A, { signal: controller.signal, fetchImpl }), second = readMemberReferral(A, { fetchImpl });
  controller.abort(); await assert.rejects(first, error => error.name === 'AbortError'); assert.equal(signal.aborted, false);
  clearMemberReferralCache(); assert.equal(signal.aborted, true); wait.resolve(Response.json(response()));
  await assert.rejects(second); assert.equal(cachedMemberReferral(A), null); assert.equal(calls, 1);
});
