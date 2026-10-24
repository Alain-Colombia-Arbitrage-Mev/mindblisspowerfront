import assert from "node:assert/strict";
import test from "node:test";
import { createExpiringResource } from "./expiring-resource.mjs";

function deferred() {
  let resolve, reject;
  const promise = new Promise((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
}

test("five reads share one request before TTL, with isolated result objects", async () => {
  let calls = 0,
    time = 100;
  const resource = createExpiringResource(
    async () => {
      calls++;
      return { ranks: [{ name: "Initial" }] };
    },
    { ttlMs: 60_000, now: () => time },
  );
  const [first, second] = await Promise.all([resource.read(), resource.read()]);
  first.ranks[0].name = "changed";
  assert.equal(second.ranks[0].name, "Initial");
  await resource.read();
  await resource.read();
  await resource.read();
  assert.equal(calls, 1);
  time += 60_000;
  await resource.read();
  assert.equal(calls, 2);
});

test("TTL starts on completion and expired values are never served after a failure", async () => {
  let time = 100,
    calls = 0;
  const initial = deferred();
  const resource = createExpiringResource(
    () => {
      calls++;
      return calls === 1
        ? initial.promise
        : Promise.reject(new Error("offline"));
    },
    { ttlMs: 100, now: () => time },
  );
  const request = resource.read();
  time = 1000;
  initial.resolve({ ranks: [] });
  await request;
  time = 1099;
  await resource.read();
  assert.equal(calls, 1);
  time = 1100;
  await assert.rejects(resource.read(), /offline/);
  await assert.rejects(resource.read(), /offline/);
  assert.equal(calls, 3);
});

test("errors are not cached and another attempt can recover", async () => {
  let calls = 0;
  const resource = createExpiringResource(
    () => (++calls === 1 ? Promise.reject(new Error("403")) : { ranks: [] }),
    { ttlMs: 100 },
  );
  await assert.rejects(resource.read(), /403/);
  assert.deepEqual(await resource.read(), { ranks: [] });
  assert.equal(calls, 2);
});

test("forced refresh and invalidation cannot be overwritten by an older pending load", async () => {
  const old = deferred();
  let calls = 0;
  const resource = createExpiringResource(
    () => (++calls === 1 ? old.promise : { version: calls }),
    { ttlMs: 1000 },
  );
  const pending = resource.read();
  await Promise.resolve();
  assert.deepEqual(await resource.read({ force: true }), { version: 2 });
  old.resolve({ version: 1 });
  await pending;
  assert.deepEqual(await resource.read(), { version: 2 });
  resource.invalidate();
  assert.deepEqual(await resource.read(), { version: 3 });
});

test("separate resources never share cached data", async () => {
  const a = createExpiringResource(() => ({ scope: "a" }), { ttlMs: 1000 });
  const b = createExpiringResource(() => ({ scope: "b" }), { ttlMs: 1000 });
  assert.deepEqual(await a.read(), { scope: "a" });
  assert.deepEqual(await b.read(), { scope: "b" });
});

test("invalidation during a pending load cannot restore the discarded cache", async () => {
  const old = deferred();
  let calls = 0;
  const resource = createExpiringResource(
    () => ++calls === 1 ? old.promise : { version: calls },
    { ttlMs: 1000 },
  );
  const pending = resource.read();
  await Promise.resolve();
  resource.invalidate();
  assert.deepEqual(await resource.read(), { version: 2 });
  old.resolve({ version: 1 });
  await pending;
  assert.deepEqual(await resource.read(), { version: 2 });
});
