import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { handleReferralAttribution, REFERRAL_UPSTREAM_TIMEOUT_MS } from './referral-attribution-bff.mjs';

const env = { AUTH_PUBLIC_ORIGIN: 'https://portal.example.test', PAYMENTS_SERVICE_TOKEN: 'synthetic-private-service' };
const claims = { sub: 'synthetic-member-subject', email: ' MEMBER@example.test ', email_verified: true };
const identity = async () => ({ token: 'synthetic-verified-jwt', claims });
const body = { ref: 'OpaqueSponsor', preferred_side: '', expected_email: 'member@example.test' };
const answer = { ok: true, ref: body.ref, preferred_side: body.preferred_side, positioned: false };
function request(method = 'POST', input = body, headers = {}, suffix = '') {
  return new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/member/referral-attribution${suffix}`, { method,
    headers: { origin: env.AUTH_PUBLIC_ORIGIN, 'content-type': 'application/json', 'X-VP-Expected-Email': body.expected_email, ...headers },
    ...(method === 'GET' ? {} : { body: JSON.stringify(input) }),
  });
}
const never = async () => assert.fail('invalid or unauthenticated request reached the core');
const run = (req = request(), overrides = {}) => handleReferralAttribution(req, {
  env, identity, fetchImpl: async () => Response.json(answer), observe: () => {}, ...overrides,
});
function privateResponse(response) {
  assert.equal(response.headers.get('cache-control'), 'private, no-store, max-age=0');
  assert.equal(response.headers.get('vary'), 'Cookie');
  assert.equal(response.headers.get('set-cookie'), null);
}

test('referral preference mutations require exact same-origin JSON before identity or transport', async () => {
  for (const headers of [{ origin: 'https://admin.example.test' }, { origin: 'null' }, { 'sec-fetch-site': 'same-site' },
    { 'sec-fetch-site': 'cross-site' }, { 'content-type': 'text/plain' }]) {
    const response = await run(request('POST', body, headers), { identity: never, fetchImpl: never });
    assert.ok([403, 415].includes(response.status)); privateResponse(response);
  }
  const missingOrigin = request(); missingOrigin.headers.delete('origin');
  assert.equal((await run(missingOrigin, { identity: never, fetchImpl: never })).status, 403);
});

test('both methods require independently verified email and stable subject, never browser owner or privilege claims', async () => {
  for (const method of ['GET', 'POST']) {
    for (const value of [null, { token: '', claims }, { token: 'x', claims: null },
      { token: 'x', claims: { ...claims, sub: '' } }, { token: 'x', claims: { ...claims, sub: 'x'.repeat(257) } },
      { token: 'x', claims: { ...claims, email_verified: false } }, { token: 'x', claims: { ...claims, email: 'invalid' } }]) {
      const response = await run(request(method), { identity: async () => value, fetchImpl: never });
      assert.equal(response.status, 401); privateResponse(response);
    }
    const unavailable = await run(request(method), { identity: async () => { throw new Error('private-auth-diagnostic'); }, fetchImpl: never });
    assert.equal(unavailable.status, 503); assert.doesNotMatch(await unavailable.text(), /private-auth/);
  }
});

test('post validates bounded code and side and rejects unknown owner, node, amount and privilege fields', async () => {
  for (const input of [null, [], {}, { ...body, ref: '' }, { ...body, ref: 'x'.repeat(65) }, { ...body, ref: 'Sponsor A' },
    { ...body, ref: 'Sponsor\u007f' }, { ...body, preferred_side: 'ROOT' }, { ...body, preferred_side: 'r' },
    { ...body, expected_email: '' }, { ...body, expected_email: [] }, { ...body, email: 'attacker@example.test' },
    { ...body, person_id: 1 }, { ...body, affiliate_id: 1 }, { ...body, amount: 1 }, { ...body, is_admin: true }]) {
    const response = await run(request('POST', input), { fetchImpl: never });
    assert.equal(response.status, 400); privateResponse(response);
  }
  assert.equal((await run(request('POST', { ...body, padding: 'x'.repeat(3000) }), { fetchImpl: never })).status, 413);
  const malformed = new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/member/referral-attribution`, { method: 'POST',
    headers: { origin: env.AUTH_PUBLIC_ORIGIN, 'content-type': 'application/json' }, body: '{' });
  assert.equal((await run(malformed, { fetchImpl: never })).status, 400);
});

test('stale-cookie equality guards cannot write or read a hint for another signed-in account', async () => {
  for (const method of ['GET', 'POST']) {
    const changed = await run(request(method), { identity: async () => ({ token: 'verified-other',
      claims: { ...claims, sub: 'other-subject', email: 'other@example.test' } }), fetchImpl: never });
    assert.equal(changed.status, 409); assert.deepEqual(await changed.json(), { error: 'referral_session_changed' });
  }
  const missingGuard = request('GET'); missingGuard.headers.delete('X-VP-Expected-Email');
  assert.equal((await run(missingGuard, { fetchImpl: never })).status, 409);
});

test('owner-only post forwards verified email and sponsor while forcing automatic placement', async () => {
  const response = await run(request(), { fetchImpl: async (url, options) => {
    assert.equal(url, 'https://payments.core.internal/api/payments/referral-attribution');
    assert.equal(options.method, 'POST'); assert.equal(options.cache, 'no-store'); assert.equal(options.redirect, 'manual');
    assert.equal(options.headers['X-VP-Service-Token'], env.PAYMENTS_SERVICE_TOKEN);
    assert.equal(options.headers['X-VP-Id-Token'], 'synthetic-verified-jwt');
    assert.deepEqual(JSON.parse(options.body), { email: 'member@example.test', ref: 'OpaqueSponsor', preferred_side: '' });
    assert.doesNotMatch(options.body, /expected_email|sub|person_id|role|amount/);
    return Response.json(answer,
      { headers: { 'set-cookie': 'private-cookie', location: 'https://untrusted.test' } });
  } });
  assert.equal(response.status, 200); privateResponse(response);
  assert.deepEqual(await response.json(), answer);
});

test('get derives its only query parameter from verified claims, never from a browser email selector', async () => {
  const response = await run(request('GET'), { fetchImpl: async (url, options) => {
    assert.equal(url, 'https://payments.core.internal/api/payments/referral-attribution?email=member%40example.test');
    assert.equal(options.method, 'GET'); assert.equal(options.body, undefined);
    assert.equal(options.headers['X-VP-Id-Token'], 'synthetic-verified-jwt');
    return Response.json(answer);
  } });
  assert.equal(response.status, 200); assert.deepEqual(await response.json(), answer);
  for (const method of ['GET', 'POST']) {
    assert.equal((await run(request(method, body, {}, '?email=other%40example.test'), { identity: never, fetchImpl: never })).status, 400);
  }
});

test('no preference and an immutable positioned member are explicit empty contracts, never permission to move a node', async () => {
  for (const positioned of [false, true]) {
    const value = { ok: true, ref: '', preferred_side: '', positioned };
    const response = await run(request('GET'), { fetchImpl: async () => Response.json(value) });
    assert.deepEqual(await response.json(), value);
  }
  for (const value of [{ ...answer, positioned: true }, { ...answer, ref: '', preferred_side: 'R' }, { ...answer, positioned: 'false' },
    { ...answer, ok: false }, { ...answer, ref: null }, { ...answer, preferred_side: undefined },
    { ...answer, error: 'private-error' }, { ...answer, code: 'INVALID_REFERRAL' }, { ...answer, person_id: 123 }]) {
    const response = await run(request('GET'), { fetchImpl: async () => Response.json(value) });
    assert.equal(response.status, 503); assert.deepEqual(await response.json(), { error: 'referral_unavailable' });
  }
});

test('upstream failures, HTML redirects, oversized bodies and provider details remain generic and private', async () => {
  for (const status of [301, 400, 401, 403, 404, 409, 422, 429, 500, 503]) {
    const response = await run(request('GET'), { fetchImpl: async () => Response.json({ error: 'private-provider-details' }, { status }) });
    assert.equal(response.status, [400, 401, 403, 404, 409, 422, 429].includes(status) ? status : 503);
    assert.deepEqual(await response.json(), { error: 'referral_unavailable' }); privateResponse(response);
  }
  for (const value of [new Response('private-html'), Response.json({ ...answer, padding: 'x'.repeat(3000) })]) {
    const response = await run(request('GET'), { fetchImpl: async () => value });
    assert.equal(response.status, 503); assert.doesNotMatch(await response.text(), /private-html|padding/);
  }
  const missing = await run(request(), { env: { ...env, PAYMENTS_SERVICE_TOKEN: '' }, fetchImpl: never });
  assert.equal(missing.status, 503);
  const failed = await run(request(), { fetchImpl: async () => { throw new Error('private-transport'); } });
  assert.equal(failed.status, 503); assert.doesNotMatch(await failed.text(), /private-transport/);
});

test('caller cancellation ends the local wait even when transport ignores its signal, with no replay', async () => {
  const caller = new AbortController();
  const req = new Request(request(), { signal: caller.signal });
  let release, signal, calls = 0;
  const pending = run(req, { fetchImpl: async (_url, options) => {
    calls++;
    signal = options.signal;
    return new Promise(resolve => { release = resolve; });
  } });
  while (!release) await Promise.resolve();
  caller.abort(); assert.equal(signal.aborted, true);
  const response = await pending;
  assert.equal(response.status, 503); privateResponse(response);
  release(Response.json(answer));
  assert.equal(calls, 1);
});

test('mounted subject equality prevents stale same-email views from reading a replacement identity', async () => {
  for (const method of ['GET', 'POST']) {
    const header = { 'x-mindbliss-referral-subject': encodeURIComponent(claims.sub) };
    assert.equal((await run(request(method, body, header))).status, 200);
    const changed = await run(request(method, body, header), { identity: async () => ({ token: 'verified-other',
      claims: { ...claims, sub: 'replacement-subject' } }), fetchImpl: never });
    assert.equal(changed.status, 409);
    assert.deepEqual(await changed.json(), { error: 'referral_session_changed' });
    for (const invalid of ['', '%', '%73ynthetic-member-subject', 'other-subject']) {
      assert.equal((await run(request(method, body, { 'x-mindbliss-referral-subject': invalid }), { fetchImpl: never })).status, 409);
    }
  }
});

test('one slow startup response can complete after the former eight-second limit without another request', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let calls = 0;
  const pending = run(request('GET'), { fetchImpl: () => {
    calls++;
    return new Promise(resolve => setTimeout(() => resolve(Response.json(answer)), 9000));
  } });
  while (!calls) await Promise.resolve();
  t.mock.timers.tick(9000);
  assert.deepEqual(await (await pending).json(), answer);
  assert.equal(calls, 1);
});

test('the twenty-second deadline also ends a faulty stalled body and records no private context', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let reading = false, calls = 0;
  const events = [];
  const pending = run(request('GET'), { observe: event => events.push(event), fetchImpl: async () => {
    calls++;
    return { status: 200, headers: new Headers({ 'content-type': 'application/json' }), body: { getReader: () => ({
      read: () => { reading = true; return new Promise(() => {}); }, cancel: () => new Promise(() => {}), releaseLock() {},
    }) } };
  } });
  while (!reading) await Promise.resolve();
  assert.equal(REFERRAL_UPSTREAM_TIMEOUT_MS, 20000);
  t.mock.timers.tick(REFERRAL_UPSTREAM_TIMEOUT_MS);
  const response = await pending;
  assert.equal(response.status, 503); assert.equal(calls, 1);
  assert.deepEqual(events, [{ event: 'referral_attribution_failure', method: 'GET', stage: 'cancelled', status: 503 }]);
  assert.doesNotMatch(JSON.stringify(events), /example|subject|Sponsor|jwt|cookie/i);
});

test('diagnostics expose only fixed stages and status and cannot turn failed identity into access', async () => {
  const events = [];
  const response = await run(request('GET'), { observe: event => { events.push(event); throw new Error('observer-down'); },
    identity: async () => { throw new Error('private-cookie-private-email-private-token'); }, fetchImpl: never });
  assert.equal(response.status, 503);
  assert.deepEqual(events, [{ event: 'referral_attribution_failure', method: 'GET', stage: 'identity', status: 503 }]);
  assert.doesNotMatch(await response.text(), /private-|observer-down/);
});

test('upstream authentication diagnostics allow only fixed error codes and keep the public response generic', async () => {
  for (const reason of ['invalid_id_token', 'unauthorized', 'private-email-private-token']) {
    const events = [];
    const response = await run(request('GET'), { observe: event => events.push(event),
      fetchImpl: async () => Response.json({ error: reason, email: 'private@example.invalid' }, { status: 401 }) });
    assert.deepEqual(await response.json(), { error: 'referral_unavailable' });
    assert.deepEqual(events, [{ event: 'referral_attribution_failure', method: 'GET', stage: 'upstream', status: 401,
      ...(reason === 'invalid_id_token' || reason === 'unauthorized' ? { reason } : {}) }]);
    assert.doesNotMatch(JSON.stringify(events), /private-|example/);
  }
});

test('a private identity failure hint is allowlisted in telemetry and never forwarded to the browser', async () => {
  for (const reason of ['jwt_keys_unavailable', 'identity_storage_unavailable', 'private-user-private-token']) {
    const events = [];
    const response = await run(request('GET'), { observe: event => events.push(event), fetchImpl: async () =>
      Response.json({ error: 'invalid_id_token' }, { status: 401, headers: { 'x-mindbliss-identity-reason': reason } }) });
    assert.equal(response.headers.get('x-mindbliss-identity-reason'), null);
    assert.deepEqual(await response.json(), { error: 'referral_unavailable' });
    assert.equal(events[0].reason, reason.startsWith('private-') ? 'invalid_id_token' : reason);
    assert.doesNotMatch(JSON.stringify(events), /private-user|private-token/);
  }
});

test('the real route uses the existing JWT verifier and private core binding with no direct database or public transport', () => {
  const source = readFileSync(new URL('../app/api/member/referral-attribution/route.js', import.meta.url), 'utf8');
  assert.match(source, /rawIdToken\(\)/); assert.match(source, /claims: await verifyIdToken\(token\)/);
  assert.match(source, /fetchImpl: coreFetch/); assert.match(source, /dynamic = 'force-dynamic'/);
  assert.match(source, /export const GET = handle/); assert.match(source, /export const POST = handle/);
  assert.doesNotMatch(source, /memberDb|fetch\(|decodeJwt|atob|SERVICE_TOKEN\s*=/);
});
