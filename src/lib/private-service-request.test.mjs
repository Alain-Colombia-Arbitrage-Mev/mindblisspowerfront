import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { boundedServiceRequest, PRIVATE_SERVICE_TIMEOUT_MS, PRIVATE_SERVICE_MAX_BYTES } from './private-service-request.mjs';

const target = 'https://payments.core.internal/api/synthetic';
const abortedFetch = (_url, { signal }) => new Promise((_resolve, reject) => {
  if (signal.aborted) reject(new Error('cancelled'));
  else signal.addEventListener('abort', () => reject(new Error('cancelled')), { once: true });
});

test('one private request preserves credentials and body, bounds the transport, and forbids cache/redirect fallback', async () => {
  let calls = 0;
  const body = JSON.stringify({ id: 1, action: 'synthetic' });
  const result = await boundedServiceRequest(target, { method: 'POST', body, headers: { 'X-VP-Id-Token': 'synthetic-only' } }, async (url, init) => {
    calls++;
    assert.equal(url, target); assert.equal(init.method, 'POST'); assert.equal(init.body, body);
    assert.equal(init.redirect, 'manual'); assert.equal(init.cache, 'no-store');
    assert.deepEqual(init.headers, { 'X-VP-Id-Token': 'synthetic-only' });
    assert.ok(init.signal instanceof AbortSignal); assert.equal(init.signal.aborted, false);
    return Response.json({ ok: true });
  });
  assert.deepEqual(result, { ok: true, status: 200, data: { ok: true } }); assert.equal(calls, 1);
});

test('a stalled transport stops at the fixed twenty-second deadline without retrying a mutation', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let calls = 0;
  const pending = boundedServiceRequest(target, { method: 'POST', body: '{}' }, (...args) => { calls++; return abortedFetch(...args); });
  await Promise.resolve();
  t.mock.timers.tick(PRIVATE_SERVICE_TIMEOUT_MS);
  await assert.rejects(pending); assert.equal(calls, 1); assert.equal(PRIVATE_SERVICE_TIMEOUT_MS, 20000);
});

test('an upstream ignoring AbortSignal cannot hold the caller and late rejection stays handled', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let calls = 0, fail;
  const pending = boundedServiceRequest(target, { method: 'POST', body: '{}' }, async () => {
    calls++; return new Promise((_resolve, reject) => { fail = reject; });
  });
  await Promise.resolve(); t.mock.timers.tick(PRIVATE_SERVICE_TIMEOUT_MS);
  await assert.rejects(pending); assert.equal(calls, 1);
  fail(new Error('synthetic late failure')); await Promise.resolve(); await Promise.resolve();
});

test('an uncooperative reader and cancellation sink cannot turn the local deadline into another stalled wait', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let cancelled = 0, release;
  const body = { getReader: () => ({ read: () => new Promise(() => {}), cancel: () => { cancelled++; return new Promise(() => {}); },
    releaseLock: () => { release = true; } }) };
  const pending = boundedServiceRequest(target, {}, async () => ({ ok: true, status: 200, body }));
  for (let count = 0; count < 8; count++) await Promise.resolve();
  t.mock.timers.tick(PRIVATE_SERVICE_TIMEOUT_MS); await assert.rejects(pending);
  assert.equal(cancelled, 1); assert.equal(release, true);
});

test('the same transport deadline also cancels a stalled response stream', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let cancelled = 0;
  const pending = boundedServiceRequest(target, {}, async () => new Response(new ReadableStream({ cancel() { cancelled++; } })));
  for (let count = 0; count < 8; count++) await Promise.resolve();
  t.mock.timers.tick(PRIVATE_SERVICE_TIMEOUT_MS);
  await assert.rejects(pending); assert.equal(cancelled, 1);
});

test('caller cancellation reaches transport and a previously cancelled caller cannot send at all', async () => {
  const controller = new AbortController(); let calls = 0;
  const pending = boundedServiceRequest(target, { signal: controller.signal }, (...args) => { calls++; return abortedFetch(...args); });
  await Promise.resolve();
  controller.abort(); await assert.rejects(pending); assert.equal(calls, 1);
  await assert.rejects(boundedServiceRequest(target, { signal: controller.signal }, () => assert.fail('cancelled caller sent a request')));
  const early = new AbortController();
  const notStarted = boundedServiceRequest(target, { signal: early.signal }, () => assert.fail('cancelled queued request sent a mutation'));
  early.abort(); await assert.rejects(notStarted);
});

test('actual body bytes are bounded and malformed/truncated JSON or UTF-8 never become a successful result', async () => {
  assert.equal(PRIVATE_SERVICE_MAX_BYTES, 4 * 1024 * 1024);
  for (const body of ['x'.repeat(PRIVATE_SERVICE_MAX_BYTES + 1), '{"ok":', new Uint8Array([255])]) {
    await assert.rejects(boundedServiceRequest(target, {}, async () => new Response(body, { headers: { 'Content-Length': '1' } })));
  }
  assert.deepEqual(await boundedServiceRequest(target, {}, async () => new Response(null, { status: 204 })), { ok: true, status: 204, data: {} });
  assert.deepEqual(await boundedServiceRequest(target, {}, async () => Response.json({ error: 'synthetic_denied' }, { status: 403 })),
    { ok: false, status: 403, data: { error: 'synthetic_denied' } });
});

test('success and failure release the timer and parent listener after body consumption', async t => {
  const schedule = globalThis.setTimeout, unschedule = globalThis.clearTimeout, timers = new Set();
  t.mock.method(globalThis, 'setTimeout', (...args) => { const timer = schedule(...args); timers.add(timer); return timer; });
  t.mock.method(globalThis, 'clearTimeout', timer => { timers.delete(timer); return unschedule(timer); });
  const controller = new AbortController(); let removals = 0;
  const remove = controller.signal.removeEventListener.bind(controller.signal);
  t.mock.method(controller.signal, 'removeEventListener', (...args) => { removals++; return remove(...args); });
  await boundedServiceRequest(target, { signal: controller.signal }, async () => Response.json({ ok: true }));
  assert.equal(timers.size, 0); assert.equal(removals, 1);
  await assert.rejects(boundedServiceRequest(target, { signal: controller.signal }, async () => { throw new Error('synthetic'); }));
  assert.equal(timers.size, 0); assert.equal(removals, 2);
});

test('payment and withdrawal BFFs both use the bounded request and preserve safe failure contracts', async () => {
  const source = readFileSync(new URL('./admin-bff.js', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const invocations = [], module = { exports: {} }, caller = new AbortController();
  let failure = false;
  const mocks = {
    'next/headers': { cookies: async () => ({ get: () => ({ value: 'synthetic-service-jwt' }) }) },
    './verify-id-token': { verifyIdToken: async () => null },
    './better-auth-bridge.mjs': { betterAuthEnabled: () => false },
    './cloudflare-runtime.mjs': { coreFetch: () => assert.fail('BFF bypassed bounded transport'), runtimeEnvironment: () => ({
      VP_PAYMENTS_URL: 'https://payments.core.internal', VP_WITHDRAWALS_URL: 'https://withdrawals.core.internal', PAYMENTS_SERVICE_TOKEN: 'synthetic-service-only',
    }) },
    './private-service-request.mjs': { boundedServiceRequest: async (url, init, transport) => {
      invocations.push({ url, init, transport });
      if (failure) throw new Error('private-upstream-detail');
      return { ok: true, status: 200, data: { synthetic: true } };
    } },
  };
  new Function('require', 'module', 'exports', code)(id => { assert.ok(Object.hasOwn(mocks, id), id); return mocks[id]; }, module, module.exports);
  for (const name of ['callPayments', 'callWithdrawals']) {
    assert.deepEqual(await module.exports[name]('/api/synthetic', { method: 'POST', body: { id: 1 }, signal: caller.signal }),
      { ok: true, status: 200, data: { synthetic: true } });
    const call = invocations.at(-1); assert.equal(call.init.signal, caller.signal);
    assert.equal(call.init.method, 'POST'); assert.deepEqual(JSON.parse(call.init.body), { id: 1 });
    assert.equal(call.init.headers['X-VP-Id-Token'], 'synthetic-service-jwt');
    assert.equal(call.init.headers['X-VP-Service-Token'], 'synthetic-service-only');
  }
  assert.equal(invocations.length, 2); failure = true;
  for (const name of ['callPayments', 'callWithdrawals']) {
    const result = await module.exports[name]('/api/synthetic'); assert.equal(result.status, 502);
    assert.doesNotMatch(JSON.stringify(result), /private-upstream-detail/);
  }
  assert.equal(invocations.length, 4, 'no mutation was retried');
});
