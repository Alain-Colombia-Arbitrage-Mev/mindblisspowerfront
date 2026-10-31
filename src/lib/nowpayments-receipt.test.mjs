import assert from 'node:assert/strict';
import test from 'node:test';
import { nowpaymentsOrderId, nowpaymentsReceiptStatus, completedNOWPaymentsReceipt, readNOWPaymentsReceipt, startNOWPaymentsReceiptPolling } from './nowpayments-receipt.mjs';

const orderId = 'a02f5a55-5fa3-4239-845b-ac6b699110ee';
const complete = { provider: 'nowpayments', order_id: orderId, state: 'completed', payment_confirmed: true,
  signature_validated: true, provider_verified: true, persisted: true, fulfillment_status: 'not_activated' };
const pending = { ...complete, state: 'pending', payment_confirmed: false, signature_validated: false, provider_verified: false, persisted: false };
const flush = () => new Promise(resolve => setImmediate(resolve));
function clock() {
  let time = 0, id = 0; const jobs = new Map();
  return { jobs, now: () => time, setTimeout(fn, delay) { jobs.set(++id, { fn, at: time + delay }); return id; }, clearTimeout(key) { jobs.delete(key); },
    async tick() { const [key, job] = [...jobs.entries()].sort((a, b) => a[1].at - b[1].at)[0]; jobs.delete(key); time = job.at; return job.fn(); } };
}
function browser() {
  const documentRef = new EventTarget(), windowRef = new EventTarget();
  documentRef.visibilityState = 'visible'; documentRef.hasFocus = () => true;
  return { documentRef, windowRef };
}

test('completion requires exact own-order persisted signed provider proof, never return URL flags or capture acknowledgement', async () => {
  assert.equal(completedNOWPaymentsReceipt(complete, orderId), true);
  for (const value of [pending, { ...pending, state: 'under_review' }, { ...complete, persisted: false }, { ...complete, signature_validated: false },
    { ...complete, provider_verified: false }, { ...complete, payment_confirmed: 'true' }, { ...complete, provider: 'stripe' },
    { ...complete, fulfillment_status: 'activated' }, { ...complete, order_id: '00000000-0000-4000-8000-000000000001' },
    { received: true, mode: 'capture_only', state: 'captured', fulfillment_status: 'not_activated' }, { paid: '1', status: 'finished' }]) {
    assert.equal(completedNOWPaymentsReceipt(value, orderId), false);
  }
  assert.equal(nowpaymentsOrderId(orderId.toUpperCase()), '');
  assert.equal(nowpaymentsReceiptStatus(null, orderId), null);
  let calls = 0;
  assert.deepEqual(await readNOWPaymentsReceipt(orderId, { fetchImpl: async (url, options) => {
    calls++; assert.equal(url, `/api/payments/nowpayments/status?order_id=${orderId}`);
    assert.equal(options.cache, 'no-store'); assert.equal(options.credentials, 'same-origin'); assert.equal(options.redirect, 'error');
    return Response.json(complete);
  } }), complete);
  assert.equal(calls, 1);
});

test('polling has no overlap, exponential backoff and stops at completed or under-review terminal states', async () => {
  for (const final of [complete, { ...pending, state: 'under_review' }]) {
    const timers = clock(), observed = []; let calls = 0, finish;
    const stop = startNOWPaymentsReceiptPolling({ orderId, timers, now: timers.now, ...browser(),
      read: async () => { calls++; return calls === 1 ? new Promise(resolve => { finish = resolve; }) : final; }, onResult: value => observed.push(value) });
    const first = timers.tick(); assert.equal(calls, 1); assert.equal(timers.jobs.size, 1, 'only deadline while a request is in flight');
    finish(pending); await first;
    assert.equal(Math.min(...[...timers.jobs.values()].map(job => job.at)), 2000);
    await timers.tick(); assert.equal(calls, 2); assert.equal(timers.jobs.size, 0); assert.equal(observed.at(-1).state, final.state);
    stop();
  }
});

test('hidden tabs and blur pause/abort reads; focus resumes without bypassing backoff or publishing an aborted result', async () => {
  const timers = clock(), page = browser(); let calls = 0, signal, finish, published = 0;
  const stop = startNOWPaymentsReceiptPolling({ orderId, timers, now: timers.now, ...page,
    read: async (_id, options) => { calls++; signal = options.signal; return new Promise(resolve => { finish = resolve; }); }, onResult: () => { published++; } });
  page.windowRef.dispatchEvent(new Event('blur')); assert.equal(timers.jobs.size, 1);
  page.windowRef.dispatchEvent(new Event('focus'));
  const read = timers.tick(); assert.equal(calls, 1);
  page.documentRef.visibilityState = 'hidden'; page.documentRef.dispatchEvent(new Event('visibilitychange'));
  assert.equal(signal.aborted, true); finish(complete); await read; assert.equal(published, 0);
  page.documentRef.visibilityState = 'visible'; page.documentRef.dispatchEvent(new Event('visibilitychange'));
  assert.equal(Math.min(...[...timers.jobs.values()].map(job => job.at)), 2000);
  assert.equal(calls, 1);
  stop(); assert.equal(timers.jobs.size, 0);
});

test('denied/unknown ownership stops; 429 respects cooldown; deadlines, limits and cleanup suppress late updates', async () => {
  for (const status of [400, 401, 403, 404]) {
    const timers = clock(); let reason;
    startNOWPaymentsReceiptPolling({ orderId, timers, now: timers.now, ...browser(), read: async () => { throw Object.assign(new Error('unavailable'), { status }); },
      onResult: () => assert.fail('denial published a receipt'), onStop: value => { reason = value; } });
    await timers.tick(); assert.equal(reason, 'unavailable'); assert.equal(timers.jobs.size, 0);
  }
  const timers = clock();
  const stop = startNOWPaymentsReceiptPolling({ orderId, timers, now: timers.now, ...browser(), read: async () => { throw Object.assign(new Error('busy'), { status: 429, retryAfterMs: 30000 }); }, onResult() {} });
  await timers.tick(); assert.equal(Math.min(...[...timers.jobs.values()].map(job => job.at)), 30000); stop();
  const hung = clock(); let signal, finish, published = 0, reason;
  startNOWPaymentsReceiptPolling({ orderId, timers: hung, now: hung.now, ...browser(), maxDurationMs: 10000,
    read: async (_id, options) => { signal = options.signal; return new Promise(resolve => { finish = resolve; }); }, onResult: () => { published++; }, onStop: value => { reason = value; } });
  const first = hung.tick(); await hung.tick(); assert.equal(signal.aborted, true); assert.equal(reason, 'exhausted');
  finish(complete); await first; await flush(); assert.equal(published, 0);
  const limited = clock(); let calls = 0;
  startNOWPaymentsReceiptPolling({ orderId, timers: limited, now: limited.now, ...browser(), maxAttempts: 2, read: async () => { calls++; return pending; }, onResult() {} });
  await limited.tick(); await limited.tick(); assert.equal(calls, 2); assert.equal(limited.jobs.size, 0);
});
