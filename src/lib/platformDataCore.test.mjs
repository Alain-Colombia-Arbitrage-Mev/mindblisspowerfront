import test from "node:test";
import assert from "node:assert/strict";

const originalLog = console.log;
console.log = () => {};
const { default: platformDataCore } = await import("./platformDataCore.js");
console.log = originalLog;

test("keeps canonical root rank and investment distribution valid", () => {
  const root = platformDataCore.getUserById("master-root-001");
  const distribution = platformDataCore.validateInvestmentDistribution();

  assert.equal(root.rank, "E. Corona");
  assert.equal(distribution.totalMembers, platformDataCore.memberships.length);
  assert.equal(distribution.isInRange, true);
  assert.ok(distribution.averageInvestment >= 3500);
  assert.ok(distribution.averageInvestment <= 7000);
});
