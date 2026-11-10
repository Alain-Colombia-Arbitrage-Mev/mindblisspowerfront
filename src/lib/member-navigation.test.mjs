import assert from "node:assert/strict";
import test from "node:test";
import { matchesRoute, memberPageFor, memberPageKeysFor } from "./member-navigation.mjs";

test("member pages have Spanish titles for overview, payments and nested messages", () => {
  assert.equal(memberPageFor("/dashboard").title, "Resumen");
  assert.equal(memberPageFor("/dashboard/payments").title, "Billetera");
  assert.equal(memberPageKeysFor("/dashboard/wallet-personal").title, "pages.account");
  assert.equal(memberPageKeysFor("/dashboard/wallet-administrative").title, "nav.administrativeWallet");
  assert.equal(
    memberPageFor("/dashboard/communications/news").title,
    "Noticias",
  );
  assert.equal(
    memberPageFor("/dashboard/communications/news/123").section,
    "Comunidad",
  );
});

test("navigation matches path segments, not unrelated prefix collisions", () => {
  assert.equal(matchesRoute("/dashboard/team/42", "/dashboard/team"), true);
  assert.equal(matchesRoute("/dashboard/team-pro", "/dashboard/team"), false);
  assert.equal(matchesRoute("/dashboard/ranks", "/dashboard/rank"), false);
  assert.equal(memberPageFor("/dashboard/ranks").title, "Rangos");
});
