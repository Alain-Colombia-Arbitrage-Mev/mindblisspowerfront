import test from "node:test";
import assert from "node:assert/strict";

import {
  buildNetworkLLMContext,
  buildReferralCode,
  summarizeNetworkMembers,
} from "./dashboardNetworkModel.js";

const members = [
  {
    id: "L1",
    name: "Ana Lider",
    binary_side: "left",
    status: "activo",
    rank: "Plata",
    activity_level: "alta",
    follow_up_priority: "alta",
    network_bonuses_historical: 1200,
    team_volume: 3400,
  },
  {
    id: "R1",
    name: "Bruno Builder",
    binary_side: "right",
    status: "activo",
    rank: "Bronce",
    activity_level: "media",
    follow_up_priority: "media",
    network_bonuses_historical: 500,
    team_volume: 1600,
  },
  {
    id: "R2",
    name: "Clara Pausa",
    binary_side: "right",
    status: "inactivo",
    rank: "Inicial",
    activity_level: "baja",
    follow_up_priority: "baja",
    network_bonuses_historical: 0,
    team_volume: 200,
  },
];

test("builds stable referral codes without unsafe characters", () => {
  const code = buildReferralCode({
    id: "USR-001",
    name: "Roberto Diaz",
    email: "roberto@example.com",
  });

  assert.match(code, /^VP-ROBERTO-DIAZ-\d{6}$/);
});

test("summarizes network activity, binary sides, rank mix and company fund", () => {
  const summary = summarizeNetworkMembers(members);

  assert.equal(summary.totalMembers, 3);
  assert.equal(summary.activeMembers, 2);
  assert.equal(summary.leftLeg.members, 1);
  assert.equal(summary.rightLeg.members, 2);
  assert.equal(summary.weakLeg.side, "left");
  assert.equal(summary.strongLeg.side, "right");
  assert.equal(summary.highPriorityMembers, 1);
  assert.equal(summary.rankMix.Plata, 1);
  assert.equal(summary.companyFundEstimate, 850);
});

test("builds a compact LLM context from network metrics", () => {
  const context = buildNetworkLLMContext({
    user: { name: "Roberto Diaz" },
    referralCode: "VP-ROBERTO-DIAZ-123456",
    network: summarizeNetworkMembers(members),
  });

  assert.equal(context.member, "Roberto Diaz");
  assert.equal(context.referralCode, "VP-ROBERTO-DIAZ-123456");
  assert.equal(context.network.totalMembers, 3);
  assert.equal(context.network.weakLeg, "left");
  assert.ok(context.analysisFocus.includes("derrame"));
});
