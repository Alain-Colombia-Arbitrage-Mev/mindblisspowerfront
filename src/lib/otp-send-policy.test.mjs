import assert from "node:assert/strict";
import test from "node:test";
import { otpSendRules } from "./otp-send-policy.js";
import { rateLimit, __resetRateLimit } from "./rate-limit.js";

test("resending or switching channels cannot replace a code within 45 seconds", () => {
  __resetRateLimit();
  const email = "member@example.com";
  assert.equal(rateLimit(otpSendRules(email), 100_000).allowed, true);
  assert.deepEqual(rateLimit(otpSendRules(email), 100_001), { allowed: false, retryAfterSec: 45 });
  assert.equal(rateLimit(otpSendRules("other@example.com"), 100_001).allowed, true);
  assert.equal(rateLimit(otpSendRules(email), 145_000).allowed, true);
});

test("hourly send cap survives repeated cooldowns and does not count blocked sends", () => {
  __resetRateLimit();
  for (let i = 0; i < 12; i++) {
    assert.equal(rateLimit(otpSendRules("member@example.com"), 100_000 + i * 45_000).allowed, true);
  }
  const blocked = rateLimit(otpSendRules("member@example.com"), 640_000);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterSec, 3060);
  assert.equal(rateLimit(otpSendRules("member@example.com"), 3_700_000).allowed, true);
});
