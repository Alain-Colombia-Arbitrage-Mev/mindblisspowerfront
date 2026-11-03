import test from "node:test";
import assert from "node:assert/strict";
import { createMemberSummaryResource } from "./member-summary-resource.mjs";

const summary = { wallet_balance_usd: "0", available_for_withdrawal_usd: "0", commission_available_usd: "0", commission_maturing_usd: "0", active_packages: 1, payments: [] };
const tick = () => new Promise(resolve => setImmediate(resolve));
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };

test("mounted payment consumers share one validated GET and the same snapshot", async () => {
  let calls = 0;
  const response = deferred();
  const resource = createMemberSummaryResource({ fresh: true, read: async (url, options) => {
    calls++; assert.equal(url, "/api/payments/me?fresh=1"); assert.equal(options.validate(summary), true);
    return response.promise;
  } });
  let notifications = 0;
  const unsubscribe = resource.subscribe(() => { notifications++; });
  const panel = resource.load();
  const gate = resource.load();
  assert.equal(panel, gate);
  await tick(); assert.equal(calls, 1);
  response.resolve(summary); await panel;
  assert.deepEqual(resource.getSnapshot(), { loading: false, error: "", data: summary });
  assert.equal(notifications, 2);
  unsubscribe(); resource.cancel();
});

test("refresh after a confirmed mutation cancels the older read and cannot be overwritten", async () => {
  const responses = [deferred(), deferred()];
  const signals = [];
  const resource = createMemberSummaryResource({ read: (_, { signal }) => {
    const index = signals.length; signals.push(signal); return responses[index].promise;
  } });
  const old = resource.load(); await tick();
  const fresh = resource.refresh(); await tick();
  assert.equal(signals[0].aborted, true); assert.equal(signals.length, 2);
  const updated = { ...summary, active_packages: 2 };
  responses[1].resolve(updated); await fresh;
  responses[0].resolve(summary); await old;
  assert.equal(resource.getSnapshot().data.active_packages, 2);
  resource.cancel();
});

test("unmount clears private state, aborts the request and ignores a late response", async () => {
  const response = deferred(); let signal;
  const resource = createMemberSummaryResource({ read: (_, options) => { signal = options.signal; return response.promise; } });
  const pending = resource.load(); await tick(); resource.cancel();
  assert.equal(signal.aborted, true);
  response.resolve(summary); await pending;
  assert.equal(resource.getSnapshot().data, null);
});

test("separate page instances never share private responses or transport failures", async () => {
  let calls = 0;
  const read = async () => { calls++; throw new Error("Servicio no disponible"); };
  const first = createMemberSummaryResource({ read });
  const second = createMemberSummaryResource({ read });
  await Promise.all([first.load(), second.load()]);
  assert.equal(calls, 2);
  assert.deepEqual(first.getSnapshot(), { loading: false, error: "Servicio no disponible", data: null });
  await first.load(); assert.equal(calls, 3);
  first.cancel(); second.cancel();
});
