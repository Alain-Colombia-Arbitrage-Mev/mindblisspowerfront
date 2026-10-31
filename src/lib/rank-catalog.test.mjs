import assert from "node:assert/strict";
import test from "node:test";
import { invalidateRankCatalog, readRankCatalog, RANK_CATALOG_TTL_MS } from "./rank-catalog.mjs";
import { createExpiringResource } from "./expiring-resource.mjs";

const rank = () => ({ code: "initial", name_es: "Inicial", required_points: "0", bonus_amount_usd: "0.00" });

function mockBrowser(t, fetcher) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {},
  });
  t.mock.method(globalThis, "fetch", fetcher);
  invalidateRankCatalog();
  t.after(() => {
    invalidateRankCatalog();
    if (descriptor) Object.defineProperty(globalThis, "window", descriptor);
    else delete globalThis.window;
  });
}

test("catalog coalesces browser reads without retaining personal response fields", async (t) => {
  let calls = 0;
  mockBrowser(t, async (url, options) => {
    calls++;
    assert.equal(url, "/api/member/ranks");
    assert.equal(options.cache, "no-store");
    assert.equal(options.credentials, "same-origin");
    assert.equal(options.redirect, "error");
    assert.ok(options.signal instanceof AbortSignal);
    return Response.json({
      ranks: [{ ...rank(), email: "private@example.test", wallet: 999, member: { id: "private" } }],
      email: "private@example.test",
      wallet: 999,
    });
  });
  const results = await Promise.all([readRankCatalog(), readRankCatalog()]);
  assert.equal(calls, 1);
  assert.deepEqual(results, [
    { ranks: [rank()] },
    { ranks: [rank()] },
  ]);
  await readRankCatalog({ force: true });
  assert.equal(calls, 2);
  invalidateRankCatalog();
  await readRankCatalog();
  assert.equal(calls, 3);
});

test("five visits within five minutes use one GET; expiry reads fresh without caching personal fields", async (t) => {
  let calls = 0;
  let previousPolicyCalls = 0;
  let time = 100;
  const previousPolicy = createExpiringResource(() => { previousPolicyCalls++; return { ranks: [rank()] }; }, {
    ttlMs: 60_000, now: () => time,
  });
  t.mock.method(Date, "now", () => time);
  mockBrowser(t, async () => {
    calls++;
    return Response.json({ ranks: [rank()], email: "ignored@example.test" });
  });
  assert.equal(RANK_CATALOG_TTL_MS, 300_000);
  for (const offset of [0, 60_000, 120_000, 180_000, 299_999]) {
    time = 100 + offset;
    await previousPolicy.read();
    const result = await readRankCatalog();
    assert.deepEqual(result, { ranks: [rank()] });
    result.ranks[0].name_es = "caller mutation";
  }
  assert.equal(calls, 1, "five mounted visits make one API call, not five");
  assert.equal(previousPolicyCalls, 5, "the former one-minute TTL made five calls for this same workload");
  time = 300_100;
  assert.deepEqual(await readRankCatalog(), { ranks: [rank()] });
  assert.equal(calls, 2, "the first visit at expiry reads current catalog");
});

test("concurrent explicit refreshes make one additional GET and replace the display catalog", async (t) => {
  let calls = 0;
  let release;
  const refreshed = new Promise(resolve => { release = resolve; });
  mockBrowser(t, async () => {
    calls++;
    return calls === 1 ? Response.json({ ranks: [rank()] }) : refreshed;
  });
  await readRankCatalog();
  const refreshes = [readRankCatalog({ force: true }), readRankCatalog({ force: true }), readRankCatalog()];
  await Promise.resolve();
  assert.equal(calls, 2);
  release(Response.json({ ranks: [{ ...rank(), name_es: "Actualizado" }] }));
  for (const result of await Promise.all(refreshes)) assert.equal(result.ranks[0].name_es, "Actualizado");
  assert.equal(calls, 2);
});

test("malformed catalog rows are rejected and never retained", async (t) => {
  const invalidRows = [
    null, [], {}, { ...rank(), code: "" }, { ...rank(), name_es: "" },
    { ...rank(), required_points: -1 }, { ...rank(), bonus_amount_usd: "NaN" },
    { ...rank(), required_points: { wallet: 100 } },
  ];
  let calls = 0;
  mockBrowser(t, async () => Response.json({ ranks: calls < invalidRows.length ? [invalidRows[calls++]] : [rank()] }));
  for (const _invalid of invalidRows) await assert.rejects(readRankCatalog(), /invalid/);
  assert.deepEqual(await readRankCatalog(), { ranks: [rank()] });
  assert.equal(calls, invalidRows.length);
});

test("catalog does not cache denied, failed, or invalid responses", async (t) => {
  const responses = [
    new Response(null, { status: 403 }),
    new Response(null, { status: 500 }),
    Response.json({ ranks: null }),
    Response.json({ ranks: [], error: "unauthorized" }),
    Response.json({ ranks: [] }),
  ];
  let calls = 0;
  mockBrowser(t, async () => responses[calls++]);
  await assert.rejects(readRankCatalog(), /403/);
  await assert.rejects(readRankCatalog(), /500/);
  await assert.rejects(readRankCatalog(), /invalid/);
  await assert.rejects(readRankCatalog(), /invalid/);
  assert.deepEqual(await readRankCatalog(), { ranks: [] });
  assert.equal(calls, 5);
});

test("server-side calls bypass the browser catalog cache", async (t) => {
  assert.equal(typeof window, "undefined");
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    calls++;
    return Response.json({ ranks: [] });
  });
  await readRankCatalog();
  await readRankCatalog();
  assert.equal(calls, 2);
});
