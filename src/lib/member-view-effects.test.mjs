import test from 'node:test';
import assert from 'node:assert/strict';
import { createClipboardFeedback, createLatestViewRequest } from './member-view-effects.mjs';

function deferred() {
  let resolve, reject;
  const promise = new Promise((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}

test('refresh cancels the previous referral request and only the newest result can update the view', async () => {
  const first = deferred(), second = deferred(), signals = [], values = [], events = [];
  const request = createLatestViewRequest(signal => { signals.push(signal); return signals.length === 1 ? first.promise : second.promise; }, {
    onStart: () => events.push('start'), onValue: value => values.push(value),
    onError: () => assert.fail('old error published'), onSettled: () => events.push('settled'),
  });
  const old = request.run(), current = request.run();
  assert.equal(signals[0].aborted, true);
  second.resolve({ code: 'new' }); await current;
  first.resolve({ code: 'old' }); await old;
  assert.deepEqual(values, [{ code: 'new' }]);
  assert.deepEqual(events, ['start', 'start', 'settled']);
});

test('unmount aborts a referral refresh and suppresses later data/error/spinner updates', async () => {
  const pending = deferred(), events = []; let signal;
  const request = createLatestViewRequest(value => { signal = value; return pending.promise; }, {
    onStart: () => events.push('start'), onValue: () => events.push('value'),
    onError: () => events.push('error'), onSettled: () => events.push('settled'),
  });
  const result = request.run(); request.dispose();
  pending.reject(new Error('offline')); await result; await request.run();
  assert.equal(signal.aborted, true); assert.deepEqual(events, ['start']);
});

test('a failed current referral request exits loading and can recover on retry', async () => {
  const events = []; let calls = 0;
  const request = createLatestViewRequest(() => ++calls === 1 ? Promise.reject(new Error('offline')) : { code: 'recovered' }, {
    onStart: () => events.push('loading'), onValue: value => events.push(value.code),
    onError: () => events.push('error'), onSettled: () => events.push('settled'),
  });
  await request.run(); await request.run();
  assert.deepEqual(events, ['loading', 'error', 'settled', 'loading', 'recovered', 'settled']);
});

test('denied or unsupported clipboard never claims success and provides a manual-copy recovery', async () => {
  for (const clipboard of [{}, { writeText: async () => { throw new Error('private-permission-detail'); } }]) {
    const changes = [];
    await createClipboardFeedback(value => changes.push(value)).copy('real-code', 'code', clipboard);
    assert.equal(changes.at(-1).copied, ''); assert.equal(changes.at(-1).pending, '');
    assert.match(changes.at(-1).error, /manualmente/);
    assert.doesNotMatch(changes.at(-1).error, /private-permission-detail/);
  }
});

test('clipboard empty input is rejected without writing', async () => {
  const changes = [];
  await createClipboardFeedback(value => changes.push(value)).copy(' ', 'code', { writeText: () => assert.fail('empty code written') });
  assert.equal(changes.at(-1).copied, ''); assert.ok(changes.at(-1).error);
});

test('a slow older clipboard action cannot replace a newer branch confirmation', async () => {
  const first = deferred(), changes = []; let calls = 0;
  const feedback = createClipboardFeedback(value => changes.push(value), { schedule: () => 1, cancel: () => {} });
  const clipboard = { writeText: () => ++calls === 1 ? first.promise : Promise.resolve() };
  const old = feedback.copy('left-link', 'left', clipboard);
  await feedback.copy('right-link', 'right', clipboard);
  first.resolve(); await old;
  assert.equal(changes.at(-1).copied, 'right');
});

test('old feedback timers and unmounted clipboard promises cannot update the view', async () => {
  const changes = [], timers = [], cancelled = [];
  const feedback = createClipboardFeedback(value => changes.push(value), {
    schedule: callback => { timers.push(callback); return timers.length; }, cancel: id => cancelled.push(id),
  });
  const clipboard = { writeText: async () => {} };
  await feedback.copy('left-link', 'left', clipboard); await feedback.copy('right-link', 'right', clipboard);
  timers[0](); assert.equal(changes.at(-1).copied, 'right');
  const pending = deferred();
  const result = feedback.copy('new-link', 'left', { writeText: () => pending.promise });
  const count = changes.length; feedback.dispose(); pending.resolve(); await result;
  timers[1](); assert.equal(changes.length, count); assert.ok(cancelled.includes(1)); assert.ok(cancelled.includes(2));
});
