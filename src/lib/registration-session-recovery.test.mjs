import assert from 'node:assert/strict';
import test from 'node:test';
import { recoverRegistrationSession, registrationSessionRecoveryEligible, registrationVerifiedWithoutSession } from './registration-session-recovery.mjs';

const email = 'member@example.test';
const identity = { authenticated: true, mode: 'better-auth', email, subject: 'synthetic-owner', name: 'Member', isAdmin: false };
const json = value => Response.json(value);

test('only the exact BFF verified-without-session acknowledgement retires an already consumed registration form', () => {
  const body = { code: 'REGISTRATION_SESSION_UNAVAILABLE', error: 'Verified but access unavailable', emailVerified: true, needsLogin: true };
  assert.equal(registrationVerifiedWithoutSession(503, body), true);
  for (const status of [200, 201, 400, 401, 403, 409, 429, 500, 502, 504]) assert.equal(registrationVerifiedWithoutSession(status, body), false);
  for (const payload of [null, [], {}, { ...body, code: 'REGISTRATION_UNAVAILABLE' }, { ...body, emailVerified: 'true' },
    { ...body, needsLogin: false }, { ...body, error: '' }, { ...body, error: null }, { ...body, error: 'x'.repeat(513) },
    { ...body, ok: true }, { ...body, sessionEstablished: true }, { ...body, userConfirmed: true }, { ...body, email }]) {
    assert.equal(registrationVerifiedWithoutSession(503, payload), false);
  }
});

test('only ambiguous acknowledgement statuses and possibly consumed OTP errors can start a recovery read', () => {
  for (const status of [200, 201, 202, 204, 299, 500, 502, 503, 504, 599]) assert.equal(registrationSessionRecoveryEligible(status), true);
  for (const status of [400, 403, 422]) {
    assert.equal(registrationSessionRecoveryEligible(status, 'INVALID_OTP'), true);
    for (const code of ['OTP_EXPIRED', 'TOO_MANY_ATTEMPTS', 'INVALID_EMAIL', 'PRIVATE_DETAIL', null]) assert.equal(registrationSessionRecoveryEligible(status, code), false);
  }
  for (const status of [0, 199, 300, 307, 400, 401, 403, 404, 409, 422, 429, 499, 600, '503', true, null, NaN, Infinity]) {
    assert.equal(registrationSessionRecoveryEligible(status), false);
  }
  assert.equal(registrationSessionRecoveryEligible(429, 'INVALID_OTP'), false);
});

test('recovery reads exactly the current browser access projection and returns no token, privilege or ownership claim', async () => {
  const calls = [];
  const result = await recoverRegistrationSession(' MEMBER@EXAMPLE.TEST ', { fetchImpl: async (path, options) => {
    calls.push(path); assert.equal(path, '/api/auth/session?view=access');
    assert.equal(options.method, 'GET'); assert.equal(options.cache, 'no-store'); assert.equal(options.credentials, 'same-origin');
    assert.equal(options.redirect, 'error'); assert.deepEqual(options.headers, { Accept: 'application/json' });
    assert.equal(options.body, undefined); assert.equal(options.signal.aborted, false);
    return json({ ...identity, email: ' MEMBER@example.test ', token: 'synthetic-unused-field', role: 'synthetic-unused-role' });
  } });
  assert.deepEqual(result, { email, subject: identity.subject }); assert.equal(Object.isFrozen(result), true);
  assert.equal(calls.length, 1); assert.doesNotMatch(JSON.stringify(result), /token|role|authenticated|wallet|verified/);
});

test('anonymous, denied, expired, throttled and unavailable server sessions cannot recover registration', async () => {
  for (const status of [201, 202, 204, 301, 307, 400, 401, 403, 404, 422, 429, 500, 503]) {
    let calls = 0;
    const response = status === 204 ? new Response(null, { status }) : Response.json(identity, { status });
    assert.equal(await recoverRegistrationSession(email, { fetchImpl: async () => { calls++; return response; } }), null);
    assert.equal(calls, 1, 'a definitive server rejection cannot retry or send an OTP');
  }
  const expired = { authenticated: false, mode: 'better-auth', email: null, subject: null };
  assert.equal(await recoverRegistrationSession(email, { fetchImpl: async () => json(expired) }), null);
});

test('only the same verified projection owner is accepted; absent subject, legacy auth and misleading errors fail closed', async () => {
  const invalid = [null, [], {}, { ...identity, authenticated: false }, { ...identity, authenticated: 'true' },
    { ...identity, mode: 'cognito' }, { ...identity, mode: 'BETTER-AUTH' }, { ...identity, email: 'another@example.test' },
    { ...identity, email: null }, { ...identity, subject: null }, { ...identity, subject: '' },
    { ...identity, subject: ' owner' }, { ...identity, subject: 'owner\n' }, { ...identity, subject: 'x'.repeat(257) },
    { ...identity, error: '' }, { ...identity, error: false }, { ...identity, code: 'INVALID_OTP' },
    { ...identity, code: null }];
  for (const payload of invalid) assert.equal(await recoverRegistrationSession(email, { fetchImpl: async () => json(payload) }), null);
});

test('a redirect, non-JSON body, malformed UTF-8 or expanded payload cannot become a current session proof', async () => {
  const redirected = json(identity); Object.defineProperty(redirected, 'redirected', { value: true });
  const responses = [redirected, new Response(JSON.stringify(identity), { headers: { 'content-type': 'text/plain' } }),
    new Response('not JSON', { headers: { 'content-type': 'application/json' } }),
    new Response(new Uint8Array([0xff]), { headers: { 'content-type': 'application/json' } }),
    json({ ...identity, padding: 'x'.repeat(40_000) })];
  for (const response of responses) assert.equal(await recoverRegistrationSession(email, { fetchImpl: async () => response }), null);
});

test('invalid recipients and already-aborted views make no request', async () => {
  const controller = new AbortController(); controller.abort();
  const fetchImpl = () => assert.fail('invalid or cancelled view performed a session request');
  for (const input of [null, undefined, {}, [], '', 'bad-email', `${'a'.repeat(255)}@example.test`]) {
    assert.equal(await recoverRegistrationSession(input, { fetchImpl }), null);
  }
  assert.equal(await recoverRegistrationSession(email, { fetchImpl, signal: controller.signal }), null);
});

test('external cancellation bounds a non-cooperative fetch and ignores its later successful response', async () => {
  const controller = new AbortController(); let release, started, calls = 0;
  const begun = new Promise(resolve => { started = resolve; });
  const pending = recoverRegistrationSession(email, { signal: controller.signal, fetchImpl: (_path, options) => {
    calls++; assert.equal(options.signal.aborted, false); started(); return new Promise(resolve => { release = resolve; });
  } });
  await begun; controller.abort(); assert.equal(await pending, null);
  release(json(identity)); await Promise.resolve(); await Promise.resolve(); assert.equal(calls, 1);
});

test('the deadline includes a transport that never resolves, without retrying the GET', async () => {
  let calls = 0, requestSignal;
  const result = await recoverRegistrationSession(email, { timeoutMs: 5, fetchImpl: (_path, options) => {
    calls++; requestSignal = options.signal; return new Promise(() => {});
  } });
  assert.equal(result, null); assert.equal(calls, 1); assert.equal(requestSignal.aborted, true);
});

test('body read and non-cooperative cancellation cannot hold recovery past its deadline', async () => {
  let cancelled = 0, released = 0;
  const response = { status: 200, redirected: false, headers: new Headers({ 'content-type': 'application/json' }), body: {
    getReader: () => ({ read: () => new Promise(() => {}), cancel: () => { cancelled++; return new Promise(() => {}); }, releaseLock: () => { released++; } }),
  } };
  assert.equal(await recoverRegistrationSession(email, { timeoutMs: 5, fetchImpl: async () => response }), null);
  assert.ok(cancelled >= 1); assert.equal(released, 1);
});

test('callers cannot disable or expand the bounded recovery deadline', async () => {
  for (const timeoutMs of [0, -1, 8_001, Infinity, NaN]) {
    await assert.rejects(recoverRegistrationSession(email, { timeoutMs, fetchImpl: () => assert.fail('invalid deadline fetched') }), /invalid_registration_recovery_deadline/);
  }
});
