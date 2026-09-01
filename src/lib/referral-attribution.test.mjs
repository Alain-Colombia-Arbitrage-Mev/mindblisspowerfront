import assert from "node:assert/strict";
import test from "node:test";

import {
  bindReferralCodeToEmail,
  bindReferralToEmail,
  captureReferralFromUrl,
  referralForCheckout,
} from "./referral-attribution.js";

class MemoryStorage {
  constructor(seed = {}) {
    this.data = new Map(Object.entries(seed));
  }
  getItem(key) {
    return this.data.has(key) ? this.data.get(key) : null;
  }
  setItem(key, value) {
    this.data.set(key, String(value));
  }
  removeItem(key) {
    this.data.delete(key);
  }
}

const now = Date.parse("2026-08-30T00:00:00Z");

test("binds a referral code to the registration email before checkout", () => {
  const storage = new MemoryStorage();
  captureReferralFromUrl("?ref=martinezl14", storage, now);
  bindReferralToEmail("NEWUSER@Example.com", storage, now);

  assert.deepEqual(referralForCheckout("newuser@example.com", storage, now), {
    code: "martinezl14",
    email: "newuser@example.com",
  });
});

test("binds the explicit registration referral instead of a stale global ref", () => {
  const storage = new MemoryStorage({
    mp_ref_context: JSON.stringify({
      code: "old-cache-code",
      createdAt: new Date(now).toISOString(),
    }),
    mp_ref: "old-cache-code",
  });

  bindReferralCodeToEmail("buyer@example.com", "current-form-code", storage, now);

  assert.deepEqual(referralForCheckout("buyer@example.com", storage, now), {
    code: "current-form-code",
    email: "buyer@example.com",
  });
});

test("does not send a legacy global mp_ref without email binding", () => {
  const storage = new MemoryStorage({ mp_ref: "yaniel22" });

  assert.deepEqual(referralForCheckout("buyer@example.com", storage, now), {
    code: "",
    email: "",
  });
});

test("does not reuse a referral bound to another email", () => {
  const storage = new MemoryStorage({
    mp_ref_context: JSON.stringify({
      code: "yaniel22",
      email: "first@example.com",
      createdAt: new Date(now).toISOString(),
    }),
  });

  assert.deepEqual(referralForCheckout("second@example.com", storage, now), {
    code: "",
    email: "",
  });
});

test("does not rebind a referral already bound to another email", () => {
  const storage = new MemoryStorage({
    mp_ref_context: JSON.stringify({
      code: "yaniel22",
      email: "first@example.com",
      createdAt: new Date(now).toISOString(),
    }),
  });

  bindReferralToEmail("second@example.com", storage, now);

  assert.deepEqual(referralForCheckout("second@example.com", storage, now), {
    code: "",
    email: "",
  });
});

test("allows a matching registration draft to carry the referral", () => {
  const storage = new MemoryStorage({
    mp_registration_draft: JSON.stringify({
      email: "draft@example.com",
      referralCode: "MP79295",
      createdAt: new Date(now).toISOString(),
    }),
  });

  assert.deepEqual(referralForCheckout("draft@example.com", storage, now), {
    code: "MP79295",
    email: "draft@example.com",
  });
});

test("a new referral link does not inherit an older bound email", () => {
  const storage = new MemoryStorage({
    mp_ref_context: JSON.stringify({
      code: "old-code",
      email: "first@example.com",
      createdAt: new Date(now).toISOString(),
    }),
  });

  captureReferralFromUrl("?ref=new-code", storage, now);

  assert.deepEqual(referralForCheckout("first@example.com", storage, now), {
    code: "",
    email: "",
  });
});
