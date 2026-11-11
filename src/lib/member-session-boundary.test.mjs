import assert from 'node:assert/strict';
import test from 'node:test';
import { checkMemberSessionOwner, memberSessionOwnerKey } from './member-session-boundary.mjs';

const owner = { subject: 'synthetic-member', email: 'member@example.test' };
const identity = { ...owner, authenticated: true, mode: 'better-auth' };

test('owner keys normalize email but require a complete bounded subject and email', () => {
  assert.equal(memberSessionOwnerKey({ ...owner, email: ' MEMBER@EXAMPLE.TEST ' }), JSON.stringify([owner.subject, owner.email]));
  for (const input of [null, undefined, {}, [], { ...owner, subject: '' }, { ...owner, subject: ' member' },
    { ...owner, subject: 'member\n' }, { ...owner, subject: 'x'.repeat(257) }, { ...owner, email: null },
    { ...owner, email: 'invalid' }, { ...owner, email: `${'x'.repeat(255)}@example.test` }]) {
    assert.equal(memberSessionOwnerKey(input), '');
  }
});

test('one fixed same-origin GET checks both owner identifiers without returning credentials or retrying', async () => {
  const calls = [];
  assert.equal(await checkMemberSessionOwner(owner, { fetchImpl: async (path, init) => {
    calls.push(path);
    assert.equal(path, '/api/auth/session?view=access');
    assert.equal(init.method, 'GET'); assert.equal(init.credentials, 'same-origin');
    assert.equal(init.cache, 'no-store'); assert.equal(init.redirect, 'error');
    assert.deepEqual(init.headers, { Accept: 'application/json' }); assert.equal(init.body, undefined);
    assert.equal(init.signal.aborted, false);
    return Response.json({ ...identity, email: ' MEMBER@example.test ', token: 'synthetic-ignored-token', role: 'synthetic-ignored-role' });
  } }), 'same-owner');
  assert.equal(calls.length, 1);
  for (const changed of [{ ...identity, email: 'different@example.test' }, { ...identity, subject: 'different-member' }]) {
    assert.equal(await checkMemberSessionOwner(owner, { fetchImpl: async () => Response.json(changed) }), 'changed-owner');
  }
});

test('anonymous and denied sessions retire the private document; outages and throttling never authorize it', async () => {
  for (const [status, expected] of [[401, 'signed-out'], [403, 'signed-out'], [201, 'unavailable'], [204, 'unavailable'],
    [302, 'unavailable'], [400, 'unavailable'], [404, 'unavailable'], [429, 'unavailable'], [500, 'unavailable'], [503, 'unavailable']]) {
    let calls = 0;
    const result = await checkMemberSessionOwner(owner, { fetchImpl: async () => {
      calls++; return status === 204 ? new Response(null, { status }) : Response.json(identity, { status });
    } });
    assert.equal(result, expected); assert.equal(calls, 1);
  }
  assert.equal(await checkMemberSessionOwner(owner, { fetchImpl: async () => Response.json({ authenticated: false }) }), 'signed-out');
});

test('the explicitly chosen authentication mode must match the canonical projection', async () => {
  assert.equal(await checkMemberSessionOwner(owner, { mode: 'cognito', fetchImpl: async () => Response.json({ ...identity, mode: 'cognito' }) }), 'same-owner');
  assert.equal(await checkMemberSessionOwner(owner, { mode: 'cognito', fetchImpl: async () => Response.json(identity) }), 'unavailable');
  assert.equal(await checkMemberSessionOwner(owner, { fetchImpl: async () => Response.json({ ...identity, mode: 'cognito' }) }), 'unavailable');
});

test('malformed, misleading and incomplete projections fail closed', async () => {
  for (const data of [null, [], {}, { ...identity, authenticated: 'true' }, { ...identity, mode: null },
    { ...identity, subject: null }, { ...identity, subject: ' member' }, { ...identity, email: null },
    { ...identity, error: '' }, { ...identity, error: false }, { ...identity, code: null }]) {
    assert.equal(await checkMemberSessionOwner(owner, { fetchImpl: async () => Response.json(data) }), 'unavailable');
  }
  const redirected = Response.json(identity); Object.defineProperty(redirected, 'redirected', { value: true });
  for (const response of [redirected, new Response(JSON.stringify(identity), { headers: { 'content-type': 'text/plain' } }),
    new Response('{', { headers: { 'content-type': 'application/json' } }),
    new Response(new Uint8Array([0xff]), { headers: { 'content-type': 'application/json' } }),
    Response.json({ ...identity, padding: 'x'.repeat(40_000) })]) {
    assert.equal(await checkMemberSessionOwner(owner, { fetchImpl: async () => response }), 'unavailable');
  }
});

test('invalid input, unsupported modes and pre-cancellation make no request', async () => {
  const fetchImpl = () => assert.fail('invalid or cancelled owner reached transport');
  for (const input of [null, undefined, {}, { ...owner, subject: '' }]) {
    assert.equal(await checkMemberSessionOwner(input, { fetchImpl }), 'signed-out');
  }
  assert.equal(await checkMemberSessionOwner(owner, { mode: 'unsupported', fetchImpl }), 'signed-out');
  const controller = new AbortController(); controller.abort();
  assert.equal(await checkMemberSessionOwner(owner, { signal: controller.signal, fetchImpl }), 'cancelled');
});

test('external cancellation ends a non-cooperative fetch once and discards its late success', async () => {
  const controller = new AbortController(); let release, requestSignal, calls = 0;
  const pending = checkMemberSessionOwner(owner, { signal: controller.signal, fetchImpl: (_path, init) => {
    calls++; requestSignal = init.signal; return new Promise(resolve => { release = resolve; });
  } });
  controller.abort(); assert.equal(await pending, 'cancelled'); assert.equal(requestSignal.aborted, true);
  release(Response.json(identity)); await Promise.resolve(); await Promise.resolve(); assert.equal(calls, 1);
});

test('the bounded deadline covers a transport that ignores AbortSignal and never resolves', async () => {
  let calls = 0, requestSignal;
  assert.equal(await checkMemberSessionOwner(owner, { timeoutMs: 5, fetchImpl: (_path, init) => {
    calls++; requestSignal = init.signal; return new Promise(() => {});
  } }), 'unavailable');
  assert.equal(calls, 1); assert.equal(requestSignal.aborted, true);
});

test('body reads and a stuck cancel operation cannot extend the deadline', async () => {
  let cancelled = 0, released = 0;
  const response = { status: 200, redirected: false, headers: new Headers({ 'content-type': 'application/json' }), body: {
    getReader: () => ({ read: () => new Promise(() => {}), cancel: () => { cancelled++; return new Promise(() => {}); }, releaseLock: () => { released++; } }),
  } };
  assert.equal(await checkMemberSessionOwner(owner, { timeoutMs: 5, fetchImpl: async () => response }), 'unavailable');
  assert.ok(cancelled >= 1); assert.equal(released, 1);
});

test('network failure cannot retry or mint a session, and callers cannot expand the deadline', async () => {
  let calls = 0;
  assert.equal(await checkMemberSessionOwner(owner, { fetchImpl: async () => { calls++; throw new TypeError('synthetic offline'); } }), 'unavailable');
  assert.equal(calls, 1);
  for (const timeoutMs of [0, -1, 8_001, Infinity, NaN]) {
    await assert.rejects(checkMemberSessionOwner(owner, { timeoutMs, fetchImpl: () => assert.fail('invalid deadline fetched') }), /invalid_session_check_deadline/);
  }
});
