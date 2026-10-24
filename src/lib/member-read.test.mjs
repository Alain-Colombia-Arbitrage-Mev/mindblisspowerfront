import assert from "node:assert/strict";
import test from "node:test";
import { readMemberJson, readMemberParts, validMemberTree, validMemberSummary, validMemberReferral } from "./member-read.mjs";

const me = { affiliateId: "101" };
const child = { id: "102", parentId: "101", side: "L", rootSide: "L", level: 1, unavailable: true };
const summary = { wallet_balance_usd: "0", available_for_withdrawal_usd: "0", commission_available_usd: "0", commission_maturing_usd: "0", active_packages: 0, payments: [] };
const read = (data, validate) => readMemberJson("/test", { validate, fetchImpl: async () => Response.json(data) });

test("confirmed unpositioned members and a positioned root without children are valid", async () => {
  assert.deepEqual(await read({ positioned: false }, validMemberTree), { positioned: false });
  assert.equal(validMemberTree({ positioned: true, me, tree: [] }), true);
  assert.equal(validMemberTree({ positioned: true, me, tree: [child] }), true);
});
for (const payload of [{}, { positioned: true }, { positioned: true, me, tree: null }, { positioned: true, me, tree: [null] }, { positioned: true, me, tree: [{ ...child, side: null }] }]) test(`invalid tree cannot become an unpositioned account: ${JSON.stringify(payload)}`, async () => {
  await assert.rejects(read(payload, validMemberTree), error => error.status === 502);
});
test("real zeros are accepted but incomplete summary fields do not become zeros", () => {
  assert.equal(validMemberSummary(summary), true);
  for (const value of [null, "", "invalid", Infinity]) assert.equal(validMemberSummary({ ...summary, wallet_balance_usd: value }), false);
  assert.equal(validMemberSummary({}), false);
});
test("referral failures cannot pretend that activation is pending", async () => {
  assert.equal(validMemberReferral({ positioned: false }), true);
  assert.equal(validMemberReferral({ positioned: true, code: "MP101", links: { left: "https://example.test/?side=L", right: "https://example.test/?side=R" } }), true);
  for (const payload of [{}, { positioned: true }, { positioned: true, code: "MP101", link: "javascript:alert(1)" }]) await assert.rejects(read(payload, validMemberReferral), error => error.status === 502);
});
for (const status of [401, 403, 429, 500, 502, 503]) test(`member read preserves HTTP ${status} without exposing private messages`, async () => {
  await assert.rejects(readMemberJson("/test", { validate: validMemberTree, fetchImpl: async () => Response.json({ error: "postgres://private" }, { status, headers: { "retry-after": "30" } }) }), error => {
    assert.equal(error.status, status);
    assert.ok(!error.message.includes("private"));
    assert.equal(error.retryAfterMs, 30_000);
    return true;
  });
});
test("hung reads terminate with a timeout", async () => {
  await assert.rejects(readMemberJson("/test", { timeoutMs: 5, validate: validMemberTree, fetchImpl: (_, { signal }) => new Promise((_, reject) => signal.addEventListener("abort", () => reject(signal.reason))) }), error => error.status === 504);
});
test("a valid tree is published while payments remain pending", async () => {
  let finishWallet;
  const published = [];
  const done = readMemberParts({ tree: { url: "/tree", validate: validMemberTree }, summary: { url: "/summary", validate: validMemberSummary } }, {
    fetchImpl: async url => url === "/tree" ? Response.json({ positioned: true, me, tree: [child] }) : new Promise(resolve => { finishWallet = () => resolve(Response.json(summary)); }),
    onPart: (key, result) => { published.push(key); if (key === "tree") { assert.equal(result.data.tree[0].parentId, "101"); finishWallet(); } },
  });
  await done;
  assert.deepEqual(published, ["tree", "summary"]);
});
test("optional failures do not discard the successful tree", async () => {
  const results = await readMemberParts({ tree: { url: "/tree", validate: validMemberTree }, referral: { url: "/referral", validate: validMemberReferral } }, {
    fetchImpl: async url => url === "/tree" ? Response.json({ positioned: true, me, tree: [child] }) : Response.json({}, { status: 503 }), onPart: () => {},
  });
  assert.equal(results.tree.data.tree[0].unavailable, true);
  assert.equal(results.referral.error.status, 503);
});
test("authorization denial cancels other parts and no later private result is published", async () => {
  const published = [];
  await readMemberParts({ summary: { url: "/summary", validate: validMemberSummary }, tree: { url: "/tree", validate: validMemberTree } }, {
    fetchImpl: async (url, { signal }) => url === "/summary" ? Response.json({}, { status: 401 }) : new Promise((_, reject) => signal.addEventListener("abort", () => reject(signal.reason))),
    onPart: (key, result) => published.push([key, result.error?.status]),
  });
  assert.deepEqual(published, [["summary", 401]]);
});
test("cancelled views publish no data or retry error", async () => {
  const controller = new AbortController();
  controller.abort();
  let published = false;
  await readMemberParts({ tree: { url: "/tree", validate: validMemberTree } }, { signal: controller.signal,
    fetchImpl: async (_, { signal }) => { throw signal.reason; }, onPart: () => { published = true; } });
  assert.equal(published, false);
});
