import assert from "node:assert/strict";
import test from "node:test";
import { createSingleFlight } from "./single-flight.mjs";

test("1100 concurrent cold-catalog readers share one load and isolated results", async () => {
  let calls = 0;
  const resource = createSingleFlight(async () => {
    calls++;
    return { ranks: [{ code: "initial" }] };
  });
  const results = await Promise.all(
    Array.from({ length: 1100 }, () => resource.read()),
  );
  assert.equal(calls, 1);
  results[0].ranks[0].code = "changed";
  assert.equal(results[1].ranks[0].code, "initial");
  await resource.read();
  assert.equal(calls, 2, "completed responses are not retained here");
});

test("single flight failures are not cached", async () => {
  let calls = 0;
  const resource = createSingleFlight(async () => {
    if (++calls === 1) throw new Error("database unavailable");
    return {};
  });
  await assert.rejects(resource.read(), /database unavailable/);
  assert.deepEqual(await resource.read(), {});
});

test("invalidation starts a new load without an old completion clearing it", async () => {
  const resolvers = [];
  const resource = createSingleFlight(
    () => new Promise((resolve) => resolvers.push(resolve)),
  );
  const old = resource.read();
  await Promise.resolve();
  resource.invalidate();
  const fresh = resource.read();
  await Promise.resolve();
  resolvers[0]({ version: 1 });
  await Promise.resolve();
  const concurrent = resource.read();
  assert.equal(resolvers.length, 2);
  resolvers[1]({ version: 2 });
  assert.deepEqual(await fresh, { version: 2 });
  assert.deepEqual(await concurrent, { version: 2 });
  assert.deepEqual(
    await old,
    { version: 2 },
    "old callers cannot backfill stale data after invalidation",
  );
});

test("an invalidated failing load follows the fresh generation instead of publishing its error", async () => {
  let rejectOld,
    calls = 0;
  const resource = createSingleFlight(() =>
    ++calls === 1
      ? new Promise((resolve, reject) => {
          rejectOld = reject;
        })
      : { version: 2 },
  );
  const old = resource.read();
  await Promise.resolve();
  resource.invalidate();
  rejectOld(new Error("old connection failed"));
  assert.deepEqual(await old, { version: 2 });
});
