import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateMindblissOnrampFee,
  MINDBLISS_ONRAMP_FEE_PERCENT,
} from "./personal-wallet.mjs";

test("the transparent Mindbliss partner fee is one percent", () => {
  assert.equal(MINDBLISS_ONRAMP_FEE_PERCENT, 1);
  assert.equal(calculateMindblissOnrampFee(50), 0.5);
  assert.equal(calculateMindblissOnrampFee(100), 1);
  assert.equal(calculateMindblissOnrampFee(2500), 25);
  assert.equal(calculateMindblissOnrampFee("20.25"), 0.2);
  assert.equal(calculateMindblissOnrampFee("invalid"), null);
});
