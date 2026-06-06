import test from "node:test";
import assert from "node:assert/strict";

import { buildMemberValidationRecords } from "./memberValidationRecords.js";

const core = {
  users: [
    {
      id: "root",
      name: "Embajador Corona",
      email: "root@example.com",
      phone: "+57000000000",
      rank: "E. Corona",
      investment: 25000,
    },
    {
      id: "member-1",
      name: "Ana Red",
      email: "ana@example.com",
      phone: "+57000000001",
      rank: "Oro",
    },
  ],
  network_nodes: [
    { id: "node-root", user_id: "root", binary_side: "root", depth: 0 },
    { id: "node-member-1", user_id: "member-1", upline_id: "root", binary_side: "left", depth: 1 },
  ],
  memberships: [
    { user_id: "member-1", amount: 5000, plan: "Basic" },
  ],
  getUserById(userId) {
    return this.users.find((user) => user.id === userId);
  },
  getMembershipsForUser(userId) {
    return this.memberships.filter((membership) => membership.user_id === userId);
  },
};

test("builds validation records from network nodes, users and memberships", () => {
  const records = buildMemberValidationRecords(core, "root", [
    { id: "node-member-1", user_id: "member-1", upline_id: "root", binary_side: "left", depth: 1 },
  ]);

  assert.equal(records.length, 2);
  assert.equal(records[0].id, "root");
  assert.equal(records[0].rank, "E. Corona");
  assert.equal(records[0].investment_amount, 25000);
  assert.equal(records[1].id, "member-1");
  assert.equal(records[1].full_name, "Ana Red");
  assert.equal(records[1].investment_amount, 5000);
  assert.equal(records[1].binary_side, "left");
});
