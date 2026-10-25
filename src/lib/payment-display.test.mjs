import assert from "node:assert/strict";
import test from "node:test";
import { formatPaymentDate, formatPaymentMoney, knownMoney, withdrawalTerms } from "./payment-display.mjs";

test("unknown, missing and invalid amounts are never formatted as zero", () => {
  for (const value of [null, undefined, "", "   ", false, true, "invalid", Infinity, NaN]) {
    assert.equal(knownMoney(value), false);
    assert.equal(formatPaymentMoney(value), "Pendiente de cálculo");
  }
  assert.equal(formatPaymentMoney(0), "$0.00");
  assert.equal(formatPaymentMoney("1234.56"), "$1,234.56");
});

test("unknown or locked balances cannot enable withdrawal", () => {
  for (const value of [null, undefined, "", "invalid"]) assert.equal(withdrawalTerms({ available_for_withdrawal_usd: value }).allowed, false);
  assert.equal(withdrawalTerms({ available_for_withdrawal_usd: "100" }).allowed, true);
  assert.equal(withdrawalTerms({ available_for_withdrawal_usd: "100", payout_locked: true }).allowed, false);
  assert.equal(withdrawalTerms({ available_for_withdrawal_usd: "99.99" }).allowed, false);
  assert.equal(withdrawalTerms({ min_withdrawal_usd: null }).min, 100);
});

test("invalid payment dates do not expose Invalid Date", () => {
  for (const value of [null, "", "invalid"]) assert.equal(formatPaymentDate(value), "—");
});
