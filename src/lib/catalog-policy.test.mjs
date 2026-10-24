import assert from "node:assert/strict";
import test from "node:test";
import { presetRules } from "./rate-limit-presets.mjs";
import { rateLimit, __resetRateLimit } from "./rate-limit.js";

test("catalog invalidation is limited per verified admin without consuming OTP budgets", () => {
  __resetRateLimit();
  const rules = (email) =>
    presetRules({
      name: "catalog-revalidate",
      preset: "catalog",
      ip: "shared",
      email,
    });
  assert.equal(rules("admin@example.test").length, 1);
  for (let index = 0; index < 5; index++)
    assert.equal(rateLimit(rules("admin@example.test"), 100_000).allowed, true);
  assert.equal(rateLimit(rules("admin@example.test"), 100_001).allowed, false);
  assert.equal(rateLimit(rules("other@example.test"), 100_001).allowed, true);
  assert.equal(rateLimit(rules("admin@example.test"), 160_000).allowed, true);
});
