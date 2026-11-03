import assert from 'node:assert/strict';
import test from 'node:test';
import { browserRequestDeadline } from './browser-request-deadline.mjs';

function clock(t) {
  const scheduled = new Map(), cleared = [];
  let next = 0;
  t.mock.method(globalThis, 'setTimeout', (callback, milliseconds) => {
    const id = ++next;
    scheduled.set(id, { callback, milliseconds });
    return id;
  });
  t.mock.method(globalThis, 'clearTimeout', id => { cleared.push(id); scheduled.delete(id); });
  return { scheduled, cleared, fire() {
    const [id, entry] = scheduled.entries().next().value;
    scheduled.delete(id);
    entry.callback();
  } };
}

test('request deadline works without AbortSignal.any or timeout and keeps the original duration', t => {
  const timers = clock(t);
  const any = Object.getOwnPropertyDescriptor(AbortSignal, 'any');
  const timeout = Object.getOwnPropertyDescriptor(AbortSignal, 'timeout');
  try {
    Object.defineProperty(AbortSignal, 'any', { configurable: true, value: undefined });
    Object.defineProperty(AbortSignal, 'timeout', { configurable: true, value: undefined });
    const request = browserRequestDeadline(undefined, 12000);
    assert.equal(request.signal.aborted, false);
    assert.equal([...timers.scheduled.values()][0].milliseconds, 12000);
    timers.fire();
    assert.equal(request.signal.aborted, true);
    assert.equal(request.signal.reason.name, 'TimeoutError');
    request.dispose();
    assert.equal(timers.cleared.length, 1);
  } finally {
    Object.defineProperty(AbortSignal, 'any', any);
    Object.defineProperty(AbortSignal, 'timeout', timeout);
  }
});

test('an already cancelled caller never starts a timer and preserves its reason', t => {
  const timers = clock(t), parent = new AbortController(), reason = new Error('synthetic cancellation');
  parent.abort(reason);
  const request = browserRequestDeadline(parent.signal, 30000);
  assert.equal(request.signal.aborted, true);
  assert.equal(request.signal.reason, reason);
  assert.equal(timers.scheduled.size, 0);
  request.dispose();
});

test('caller cancellation aborts the fetch signal and removes both deadline resources exactly once', t => {
  const timers = clock(t), parent = new AbortController();
  const remove = parent.signal.removeEventListener.bind(parent.signal), removed = [];
  t.mock.method(parent.signal, 'removeEventListener', (...args) => { removed.push(args); return remove(...args); });
  const request = browserRequestDeadline(parent.signal, 20000), reason = new Error('synthetic owner cancelled');
  parent.abort(reason);
  assert.equal(request.signal.aborted, true);
  assert.equal(request.signal.reason, reason);
  assert.equal(timers.scheduled.size, 0);
  assert.equal(removed.length, 1);
  assert.equal(removed[0][0], 'abort');
  request.dispose();
  assert.equal(removed.length, 1);
  assert.equal(timers.cleared.length, 1);
});

test('success disposal releases the timer and listener without cancelling a completed request', t => {
  const timers = clock(t), parent = new AbortController();
  const request = browserRequestDeadline(parent.signal, 8000);
  request.dispose(); request.dispose();
  parent.abort();
  assert.equal(request.signal.aborted, false);
  assert.equal(timers.scheduled.size, 0);
  assert.equal(timers.cleared.length, 1);
});

test('cancellation remains compatible with older signal objects without a reason property', t => {
  const timers = clock(t), parent = new EventTarget();
  parent.aborted = false;
  const request = browserRequestDeadline(parent, 5000);
  parent.aborted = true; parent.dispatchEvent(new Event('abort'));
  assert.equal(request.signal.aborted, true);
  assert.equal(request.signal.reason.name, 'AbortError');
  assert.equal(timers.scheduled.size, 0);
});

test('invalid deadlines cannot silently become unbounded or overflow the timer', () => {
  for (const value of [-1, Infinity, NaN, 2147483648, '12000']) {
    assert.throws(() => browserRequestDeadline(undefined, value), /invalid_request_deadline/);
  }
});
