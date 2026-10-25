import assert from "node:assert/strict";
import test from "node:test";
import { readCheckoutActivation, startCheckoutPolling } from "./checkout-read.mjs";

const summary = { wallet_balance_usd: "0", available_for_withdrawal_usd: "0", commission_available_usd: "0", commission_maturing_usd: "0", active_packages: 0, payments: [] };
const flush = () => new Promise(resolve => setImmediate(resolve));

test("waiting for activation reads only the fresh summary, then validates placement after activation", async () => {
  const calls = [];
  let active = false;
  const fetchImpl = async url => {
    calls.push(url);
    return Response.json(url.includes("payments/me") ? { ...summary, active_packages: active ? 1 : 0 } : { positioned: true, me: { affiliateId: "1" }, tree: [] });
  };
  assert.equal((await readCheckoutActivation({ fetchImpl })).active, false);
  assert.deepEqual(calls, ["/api/payments/me?fresh=1"]);
  active = true;
  const result = await readCheckoutActivation({ fetchImpl });
  assert.equal(result.active && result.positioned, true);
  assert.deepEqual(calls.slice(1), ["/api/payments/me?fresh=1", "/api/member/tree?view=position"]);
});

test("invalid or denied summary never starts a tree read", async () => {
  for (const status of [200, 401, 403]) {
    let calls = 0;
    await assert.rejects(readCheckoutActivation({ fetchImpl: async () => { calls++; return Response.json({}, { status }); } }));
    assert.equal(calls, 1);
  }
});

function fakeTimers() {
  const jobs = new Map();
  let next = 0;
  return {
    jobs,
    setTimeout(fn, delay) { const id = ++next; jobs.set(id, { fn, delay }); return id; },
    clearTimeout(id) { jobs.delete(id); },
    async tick() {
      const [id, job] = [...jobs.entries()].sort((a, b) => a[1].delay - b[1].delay)[0];
      jobs.delete(id);
      await job.fn();
    },
  };
}

test("slow reads never overlap and polling stops exactly at the configured limit", async () => {
  const timers = fakeTimers();
  let finish;
  let calls = 0;
  const observed = [];
  const cancel = startCheckoutPolling({
    timers, maxAttempts: 3,
    read: async () => { calls++; return new Promise(resolve => { finish = resolve; }); },
    onResult: (_, state) => { observed.push(state); },
  });
  assert.equal(calls, 1);
  assert.equal(timers.jobs.size, 1); // Only the overall deadline; no second read.
  finish({});
  await flush();
  assert.equal(timers.jobs.size, 2);
  const second = timers.tick();
  assert.equal(calls, 2);
  assert.equal(timers.jobs.size, 1);
  finish({});
  await second;
  const third = timers.tick();
  finish({});
  await third;
  assert.equal(calls, 3);
  assert.equal(timers.jobs.size, 0);
  assert.equal(observed.at(-1).exhausted, true);
  cancel();
});

test("unmount aborts a pending read and suppresses later state updates", async () => {
  const timers = fakeTimers();
  let signal, finish;
  let published = 0;
  const cancel = startCheckoutPolling({
    timers,
    read: ({ signal: readSignal }) => { signal = readSignal; return new Promise(resolve => { finish = resolve; }); },
    onResult: () => { published++; }, onError: () => { published++; },
  });
  cancel();
  assert.equal(signal.aborted, true);
  finish({});
  await flush();
  assert.equal(published, 0);
  assert.equal(timers.jobs.size, 0);
});

test("successful activation stops polling; authorization denial stops retries", async () => {
  for (const denied of [false, true]) {
    const timers = fakeTimers();
    let calls = 0;
    startCheckoutPolling({
      timers,
      read: async () => { calls++; if (denied) throw Object.assign(new Error("denied"), { status: 403 }); return {}; },
      onResult: () => true,
      onError: (_, state) => assert.equal(state.exhausted, true),
    });
    await flush();
    assert.equal(calls, 1);
    assert.equal(timers.jobs.size, 0);
  }
});

test("429 respects the retry-after backoff instead of polling every three seconds", async () => {
  const timers = fakeTimers();
  const cancel = startCheckoutPolling({
    timers, read: async () => { throw Object.assign(new Error("busy"), { status: 429, retryAfterMs: 30_000 }); }, onResult: () => false,
  });
  await flush();
  assert.equal(Math.min(...[...timers.jobs.values()].map(job => job.delay)), 30_000);
  cancel();
  assert.equal(timers.jobs.size, 0);
});

test("overall deadline aborts a hung request and ends the checking state", async () => {
  const timers = fakeTimers();
  let signal;
  let exhausted = false;
  const cancel = startCheckoutPolling({
    timers, maxDurationMs: 36_000,
    read: ({ signal: readSignal }) => { signal = readSignal; return new Promise(() => {}); },
    onResult: () => assert.fail("hung read cannot complete"),
    onError: (_, state) => { exhausted = state.exhausted; },
  });
  await timers.tick();
  assert.equal(signal.aborted, true);
  assert.equal(exhausted, true);
  assert.equal(timers.jobs.size, 0);
  cancel();
});
