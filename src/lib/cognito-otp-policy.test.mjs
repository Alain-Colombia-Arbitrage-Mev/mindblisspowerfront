import assert from "node:assert/strict";
import test from "node:test";

import { buildUnconfirmedLoginTransition } from "./cognito-otp-policy.js";

test("unconfirmed login defers the only resend to the confirmation page", () => {
  const transition = buildUnconfirmedLoginTransition("member@example.com");

  assert.equal(transition.needsConfirm, true);
  assert.equal(transition.confirmationCodeSent, false);
  assert.equal(transition.delivery, null);
  assert.equal(transition.email, "member@example.com");
});
