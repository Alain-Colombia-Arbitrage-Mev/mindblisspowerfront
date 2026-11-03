import assert from "node:assert/strict";
import test from "node:test";

import {
  bindReferralCodeToEmail,
  bindReferralToEmail,
  captureReferralFromUrl,
  normalizeReferralCode,
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

test("keeps the requested binary side bound to the same registration email", () => {
  const storage = new MemoryStorage();
  captureReferralFromUrl("?ref=martinezl14&side=L", storage, now);
  bindReferralToEmail("left@example.com", storage, now);

  assert.deepEqual(referralForCheckout("left@example.com", storage, now), {
    code: "martinezl14",
    email: "left@example.com",
    side: "L",
  });
});

test("rejects an unknown binary side instead of forwarding it", () => {
  const storage = new MemoryStorage();
  captureReferralFromUrl("?ref=martinezl14&side=center", storage, now);
  bindReferralToEmail("buyer@example.com", storage, now);

  assert.deepEqual(referralForCheckout("buyer@example.com", storage, now), {
    code: "martinezl14",
    email: "buyer@example.com",
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

test('registration retains an explicit right branch even before visiting login and replaces an older side for the same opaque code', () => {
  const storage = new MemoryStorage();
  bindReferralCodeToEmail('member@example.test', 'MixedCaseHandle', storage, now, 'registration', 'L');
  bindReferralCodeToEmail('member@example.test', 'MixedCaseHandle', storage, now, 'registration', 'R');
  assert.deepEqual(referralForCheckout(' MEMBER@EXAMPLE.TEST ', storage, now), {
    code: 'MixedCaseHandle', email: 'member@example.test', side: 'R',
  });
});

test('independent tabs bind their own explicit sponsor and branch even after another tab captures a different link', () => {
  const storage = new MemoryStorage();
  const firstTab = captureReferralFromUrl('?ref=FirstSponsor&side=R', storage, now);
  const secondTab = captureReferralFromUrl('?ref=SecondSponsor&side=L', storage, now + 1);
  bindReferralCodeToEmail('first@example.test', firstTab.code, storage, now + 2, 'login', firstTab.side);
  bindReferralCodeToEmail('second@example.test', secondTab.code, storage, now + 3, 'login', secondTab.side);
  assert.deepEqual(referralForCheckout('first@example.test', storage, now + 4), {
    code: 'FirstSponsor', email: 'first@example.test', side: 'R',
  });
  assert.deepEqual(referralForCheckout('second@example.test', storage, now + 4), {
    code: 'SecondSponsor', email: 'second@example.test', side: 'L',
  });
  assert.deepEqual(referralForCheckout('unrelated@example.test', storage, now + 4), { code: '', email: '' });
});

test('a newer explicit registration hint wins over a stale legacy draft without changing the draft or any other mailbox', () => {
  const oldDraft = JSON.stringify({ email: 'member@example.test', referralCode: 'OldSponsor', preferredSide: 'L', createdAt: new Date(now).toISOString() });
  const storage = new MemoryStorage({ mp_registration_draft: oldDraft });
  bindReferralCodeToEmail('member@example.test', 'NewSponsor', storage, now, 'registration', 'R');
  bindReferralCodeToEmail('other@example.test', 'OtherSponsor', storage, now, 'registration', 'L');
  assert.deepEqual(referralForCheckout('member@example.test', storage, now), { code: 'NewSponsor', email: 'member@example.test', side: 'R' });
  assert.deepEqual(referralForCheckout('unknown@example.test', storage, now), { code: '', email: '' });
  assert.deepEqual(referralForCheckout('other@example.test', storage, now), { code: 'OtherSponsor', email: 'other@example.test', side: 'L' });
  assert.equal(storage.getItem('mp_registration_draft'), oldDraft);
});

test('expired, malformed or future-dated browser hints cannot bypass the thirty-day retention window', () => {
  for (const createdAt of [undefined, 'invalid-date', new Date(now + 1).toISOString(), new Date(now - 30 * 86400_000 - 1).toISOString()]) {
    for (const key of ['mp_ref_context', 'mp_registration_draft']) {
      const storage = new MemoryStorage({ [key]: JSON.stringify({ code: 'BadHint', referralCode: 'BadHint', email: 'member@example.test', createdAt }) });
      assert.deepEqual(referralForCheckout('member@example.test', storage, now), { code: '', email: '' });
    }
  }
  const storage = new MemoryStorage();
  bindReferralCodeToEmail('member@example.test', 'ValidHint', storage, now, 'registration', 'R');
  assert.equal(referralForCheckout('member@example.test', storage, now + 30 * 86400_000).code, 'ValidHint');
  assert.deepEqual(referralForCheckout('member@example.test', storage, now + 30 * 86400_000 + 1), { code: '', email: '' });
});

test('mailbox-scoped hint retention is bounded and oversized or non-string storage never becomes an attribution', () => {
  const storage = new MemoryStorage();
  for (let i = 0; i < 25; i++) bindReferralCodeToEmail(`member${i}@example.test`, `Opaque${i}`, storage, now, 'registration', 'R');
  assert.equal(JSON.parse(storage.getItem('mp_ref_bindings.v1')).length, 20);
  assert.deepEqual(referralForCheckout('member0@example.test', storage, now), { code: '', email: '' });
  assert.equal(referralForCheckout('member24@example.test', storage, now).code, 'Opaque24');
  for (const value of ['a'.repeat(16385), { code: 'NotJson' }, null]) {
    const bad = { getItem: () => value, removeItem() {}, setItem() {} };
    assert.deepEqual(referralForCheckout('member@example.test', bad, now), { code: '', email: '' });
  }
  for (const code of ['a'.repeat(65), 'has whitespace', '\u0000control', 123, {}]) assert.equal(normalizeReferralCode(code), '');
});
