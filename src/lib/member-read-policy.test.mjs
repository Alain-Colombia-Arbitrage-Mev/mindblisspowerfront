import assert from "node:assert/strict";
import test from "node:test";
import { createReadCapacity, memberReadLimit } from "./member-read-policy.mjs";
import { __resetRateLimit } from "./rate-limit.js";

test("verified member budgets are independent and tree reads return an actionable 429", async () => {
  __resetRateLimit();
  for (let index = 0; index < 30; index++)
    assert.equal(memberReadLimit("Member@example.test", "tree"), null);
  const blocked = memberReadLimit("member@example.test", "tree");
  assert.equal(blocked.status, 429);
  assert.equal(blocked.headers.get("cache-control"), "private, no-store");
  assert.ok(Number(blocked.headers.get("retry-after")) > 0);
  assert.equal((await blocked.json()).error, "rate_limited");
  assert.equal(memberReadLimit("member@example.test", "position"), null);
  for (let index = 0; index < 1100; index++)
    assert.equal(memberReadLimit(`member${index}@example.test`, "tree"), null);
});

test("anonymous reads do not obtain a member budget", () => {
  assert.equal(memberReadLimit(null, "tree").status, 401);
});

test("direct Postgres read admission has no unbounded queue and releases slots on failure", async () => {
  const run = createReadCapacity(2);
  let release;
  const held = new Promise((resolve) => {
    release = resolve;
  });
  const first = run(async () => {
    await held;
    return Response.json({ first: true });
  });
  const second = run(async () => {
    await held;
    throw new Error("db unavailable");
  });
  const rejected = assert.rejects(second, /db unavailable/);
  const busy = await Promise.all(
    Array.from({ length: 1100 }, () =>
      run(() => {
        throw new Error("must not execute");
      }),
    ),
  );
  assert.equal(
    busy.every((response) => response.status === 503),
    true,
  );
  release();
  assert.equal((await first).headers.get("cache-control"), "private, no-store");
  await rejected;
  assert.equal(
    (await run(() => Response.json({ recovered: true }))).status,
    200,
  );
});
