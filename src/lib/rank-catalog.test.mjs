import assert from "node:assert/strict";
import test from "node:test";
import { invalidateRankCatalog, readRankCatalog } from "./rank-catalog.mjs";

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
    return Response.json({
      ranks: [{ code: "initial" }],
      email: "private@example.test",
      wallet: 999,
    });
  });
  const results = await Promise.all([readRankCatalog(), readRankCatalog()]);
  assert.equal(calls, 1);
  assert.deepEqual(results, [
    { ranks: [{ code: "initial" }] },
    { ranks: [{ code: "initial" }] },
  ]);
  await readRankCatalog({ force: true });
  assert.equal(calls, 2);
  invalidateRankCatalog();
  await readRankCatalog();
  assert.equal(calls, 3);
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
