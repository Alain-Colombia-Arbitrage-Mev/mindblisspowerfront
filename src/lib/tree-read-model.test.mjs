import assert from "node:assert/strict";
import test from "node:test";
import { buildBinaryTreeIndex, childCoverage, childSlotState, loadedChildCounts, treeRefreshFailure } from "./tree-read-model.mjs";

test("partial child responses do not turn an occupied slot into a free slot", () => {
  const counts = loadedChildCounts([{ id: "2", parent_id: "1" }]);
  const parent = childCoverage("1", 2, counts);
  assert.equal(childSlotState(parent, null), "unloaded");
  assert.equal(childSlotState(parent, { id: "2" }), "occupied");
  assert.equal(childSlotState(childCoverage("1", 1, counts), null), "available");
});

test("an unavailable child still occupies its original side", () => {
  const node = { id: "2", parentId: "1", side: "L", unavailable: true };
  const index = buildBinaryTreeIndex([node, { id: "3", parentId: "2", side: "R" }]);
  assert.equal(index.bySide.get("1").L, node);
  assert.equal(index.bySide.get("1").R, undefined);
  assert.equal(index.countDescendants("1"), 2);
});

test("coverage counts unique child identities and fails closed for unknown counts", () => {
  const counts = loadedChildCounts([{ id: "2", parent_id: "1" }, { id: "2", parent_id: "1" }]);
  assert.equal(counts.get("1"), 1);
  for (const count of [null, undefined, -1, 3, "invalid", "", false]) {
    assert.equal(childCoverage("1", count, counts).childrenComplete, false);
  }
  assert.deepEqual(childCoverage("2", 0, counts), { hasChildren: false, childrenComplete: true });
});

test("duplicate positions are reported instead of assigning the extra user to another side", () => {
  const index = buildBinaryTreeIndex([{ id: "2", parentId: "1", side: "L" }, { id: "3", parentId: "1", side: "L" }]);
  assert.deepEqual(index.issues, [{ parentId: "1", side: "L" }]);
  assert.equal(index.bySide.get("1").R, undefined);
});

test("iterative descendant counts tolerate cycles and deep networks", () => {
  const cyclic = buildBinaryTreeIndex([{ id: "1", parentId: "2", side: "R" }, { id: "2", parentId: "1", side: "L" }]);
  assert.equal(cyclic.countDescendants("1"), 1);
  assert.equal(cyclic.countDescendants("2"), 1);
  const deep = buildBinaryTreeIndex(Array.from({ length: 5000 }, (_, i) => ({ id: String(i + 2), parentId: String(i + 1), side: "L" })));
  assert.equal(deep.countDescendants("1"), 5000);
  assert.equal(deep.countDescendants("5001"), 0);
});

test("a right-only child never moves to the empty left slot", () => {
  const index = buildBinaryTreeIndex([{ id: 2, parentId: 1, side: "right" }]);
  assert.equal(index.bySide.get("1").L, undefined);
  assert.equal(index.bySide.get("1").R.id, 2);
});

test("authorization failures discard the entire previous private tree", () => {
  for (const status of [401, 403]) {
    const result = treeRefreshFailure({ data: { tree: [1] }, summary: {}, referral: {}, syncing: true }, status, "account_suspended");
    assert.equal(result.data, null);
    assert.equal(result.summary, null);
    assert.equal(result.referral, null);
    assert.equal(result.syncing, false);
    assert.equal(result.error, "account_suspended");
  }
});

test("temporary refresh failures retain a visibly stale read, not silent success", () => {
  const previous = { data: { tree: [1] }, summary: {}, referral: {}, syncing: true };
  const result = treeRefreshFailure(previous, 503, "server_busy");
  assert.equal(result.data, previous.data);
  assert.match(result.refreshError, /última lectura/);
  assert.equal(result.syncing, false);
  assert.equal(treeRefreshFailure({ data: null }, 502, "unavailable").error, "unavailable");
});
