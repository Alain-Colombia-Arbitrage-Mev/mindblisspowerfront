import assert from 'node:assert/strict';
import test from 'node:test';
import { handleCompanyPayment, handleCompanyPaymentJournal } from './company-payment-bff.mjs';
import { handlePolygonRelay } from './polygon-relay-bff.mjs';

const origin = 'https://app.mindblisspower.com';
const id = '11111111-1111-4111-8111-111111111111';
const env = { NODE_ENV: 'production', AUTH_PROVIDER: 'better-auth', AUTH_PUBLIC_ORIGIN: origin,
  AUTH_BFF_SHARED_SECRET: 's'.repeat(32), BETTER_AUTH_BACKEND_URL: 'https://auth.core.internal',
  PERSONAL_COMPANY_PAYMENTS_ENABLED: 'true', PERSONAL_POLYGON_RELAY_ENABLED: 'true' };
const entrypoints = [
  { path: 'company-payments/prepare', action: 'prepare', handle: handleCompanyPayment, unavailable: 'company_payment_unavailable',
    input: { requestId: id, amountAtomic: '1000000', chainId: 137 } },
  { path: 'company-payments/events', action: 'recordEvent', handle: handleCompanyPaymentJournal, unavailable: 'company_payment_unavailable',
    input: { eventId: '22222222-2222-4222-8222-222222222222', paymentId: id, event: 'wallet_prompt_opened' } },
  { path: 'polygon-relay/prepare', action: 'prepare', handle: handlePolygonRelay, unavailable: 'polygon_relay_unavailable',
    input: { requestId: id, amountAtomic: '1000000' } },
];
const flush = () => new Promise(resolve => setImmediate(resolve));
function headers(patch = {}) {
  return new Headers({ cookie: 'better-auth.session_token=synthetic', origin,
    'sec-fetch-site': 'same-origin', 'content-type': 'application/json', 'cf-connecting-ip': '198.51.100.10', ...patch });
}
function stalledRequest(entry, controller, patch = {}) {
  let resume;
  const counts = { readers: 0, reads: 0, cancels: 0, releases: 0 };
  const reader = {
    read() { counts.reads++; return new Promise(resolve => { resume = resolve; }); },
    cancel() { counts.cancels++; return new Promise(() => {}); },
    releaseLock() { counts.releases++; throw new Error('synthetic pending reader'); },
  };
  const request = { url: `${origin}/api/member/${entry.path}`, method: 'POST', headers: headers(patch), signal: controller.signal,
    body: { getReader() { counts.readers++; return reader; } } };
  return { request, counts, resume() { resume?.({ done: false, value: new TextEncoder().encode(JSON.stringify(entry.input)) }); } };
}
async function unavailableReply(response, error) {
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(response.headers.get('vary'), 'Cookie');
  assert.equal(response.headers.get('set-cookie'), null);
  assert.deepEqual(await response.json(), { error });
}

test('payment BFF cancellation settles even when body read and cancel hang, without a late payment or journal write', async () => {
  for (const entry of entrypoints) {
    const controller = new AbortController(), stalled = stalledRequest(entry, controller);
    let response, transports = 0;
    const operation = entry.handle(stalled.request, entry.action, { env,
      serviceRequest: async () => { transports++; assert.fail('an unread payment body reached transport'); } }).then(value => { response = value; });
    await flush(); assert.equal(stalled.counts.reads, 1); assert.equal(response, undefined);
    controller.abort(); await flush();
    assert.ok(response, `${entry.path} did not settle after abort`);
    await operation; await unavailableReply(response, entry.unavailable);
    assert.equal(stalled.counts.cancels, 1); assert.equal(stalled.counts.releases, 1); assert.equal(transports, 0);
    stalled.resume(); await flush(); await flush();
    assert.equal(transports, 0, 'a valid late JSON chunk must not resume a mutation');
  }
});

test('the existing eight-second payment body deadline settles a non-cooperative reader and cannot authorize a delayed write', async context => {
  let expire;
  context.mock.method(globalThis, 'setTimeout', (callback, duration) => {
    assert.equal(duration, 8000); expire = callback; return 1;
  });
  context.mock.method(globalThis, 'clearTimeout', () => {});
  for (const entry of entrypoints) {
    expire = undefined;
    const stalled = stalledRequest(entry, new AbortController());
    let response, transports = 0;
    const operation = entry.handle(stalled.request, entry.action, { env,
      serviceRequest: async () => { transports++; assert.fail('an expired payment body reached transport'); } }).then(value => { response = value; });
    await flush(); assert.equal(stalled.counts.reads, 1); assert.equal(typeof expire, 'function');
    expire(); await flush(); assert.ok(response, `${entry.path} did not settle at its deadline`);
    await operation; await unavailableReply(response, entry.unavailable);
    assert.equal(stalled.counts.cancels, 1); assert.equal(transports, 0);
    stalled.resume(); await flush(); await flush(); assert.equal(transports, 0);
  }
});

test('cancelled payment requests do not acquire a reader, and origin/session guards still reject before JSON ingestion', async () => {
  for (const entry of entrypoints) {
    for (const [patch, abort, status] of [[{}, true, 503], [{ cookie: '' }, false, 401], [{ origin: 'https://foreign.example' }, false, 403]]) {
      const controller = new AbortController(), stalled = stalledRequest(entry, controller, patch);
      if (abort) controller.abort();
      const response = await entry.handle(stalled.request, entry.action, { env,
        serviceRequest: async () => assert.fail('a rejected request reached private transport') });
      assert.equal(response.status, status); assert.equal(stalled.counts.readers, 0); assert.equal(stalled.counts.reads, 0);
      if (abort) await unavailableReply(response, entry.unavailable);
    }
  }
});
