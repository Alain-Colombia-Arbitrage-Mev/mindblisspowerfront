import assert from "node:assert/strict";
import test from "node:test";
import { matchesRoute, memberPageFor, memberPageKeysFor } from "./member-navigation.mjs";

test("administrative navigation preserves overview, wallet and profile titles", () => {
  assert.equal(memberPageFor("/dashboard").title, "Resumen");
  assert.equal(memberPageFor("/dashboard/payments").title, "Billetera");
  assert.equal(memberPageKeysFor("/dashboard/wallet-administrative").title, "nav.administrativeWallet");
  assert.equal(memberPageKeysFor("/dashboard/profile").title, "pages.profile");
});

test("hidden community and personal wallet routes never advertise a page or community section", () => {
  for (const path of ["/dashboard/packages", "/dashboard/referrals", "/dashboard/network", "/dashboard/team", "/dashboard/team-pro", "/dashboard/rank", "/dashboard/ranks",
    "/dashboard/communications", "/dashboard/communications/news/123", "/dashboard/communications/testimonials", "/dashboard/wallet-personal",
    "/dashboard/wallet-personal/requests", "/dashboard/wallet-personal/pay"]) {
    assert.deepEqual(memberPageFor(path), { title: "Mi cuenta", section: "Mindbliss Power" }, path);
    assert.deepEqual(memberPageKeysFor(path), { title: "pages.account", section: "pages.product" }, path);
  }
});

test("navigation matches whole path segments without activating unrelated wallet or profile prefixes", () => {
  assert.equal(matchesRoute("/dashboard/profile/security", "/dashboard/profile"), true);
  assert.equal(matchesRoute("/dashboard/profile-other", "/dashboard/profile"), false);
  assert.equal(matchesRoute("/dashboard/wallet-administrative", "/dashboard/wallet"), false);
});
