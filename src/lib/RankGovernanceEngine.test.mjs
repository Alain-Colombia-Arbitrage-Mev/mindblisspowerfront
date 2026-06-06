import test from "node:test";
import assert from "node:assert/strict";

import RankGovernanceEngine from "./RankGovernanceEngine.js";

test("validates canonical records that use name and investment aliases", () => {
  const validation = RankGovernanceEngine.validateNetwork([
    {
      id: "root",
      name: "Embajador Corona",
      email: "root@example.com",
      phone: "+57000000000",
      rank: "E. Corona",
      investment: 5000,
    },
    {
      id: "member-1",
      name: "Ana Red",
      email: "ana@example.com",
      phone: "+57000000001",
      rank: "Oro",
      investment_amount: 5000,
    },
    {
      id: "member-2",
      full_name: "Bruno Red",
      email: "bruno@example.com",
      phone: "+57000000002",
      rank: "Plata",
      amount: 5000,
    },
  ], "root");

  assert.equal(validation.validMembers, 3);
  assert.equal(validation.invalidMembers.length, 0);
  assert.equal(validation.averageInvestment, 5000);
  assert.equal(validation.rootLeaderValid, true);
  assert.equal(validation.errors.length, 0);
});
