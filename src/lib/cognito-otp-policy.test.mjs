import assert from "node:assert/strict";
import test from "node:test";

import { buildUnconfirmedLoginTransition, otpChallengeUsername, phoneOtpIssue, requestPhoneVerification } from "./cognito-otp-policy.js";

test("unconfirmed login defers the only resend to the confirmation page", () => {
  const transition = buildUnconfirmedLoginTransition("member@example.com");

  assert.equal(transition.needsConfirm, true);
  assert.equal(transition.confirmationCodeSent, false);
  assert.equal(transition.delivery, null);
  assert.equal(transition.email, "member@example.com");
});

test("saved unverified phone can be proved by Cognito SMS OTP", () => {
  assert.equal(phoneOtpIssue({ phoneLinked: true, phoneVerified: false }), null);
  assert.equal(phoneOtpIssue({ phoneLinked: null }), null);
  assert.equal(phoneOtpIssue({ phoneLinked: false }).reason, "phone_not_linked");
});

test("challenge continuation uses the canonical username, not an email alias", () => {
  assert.equal(otpChallengeUsername({ ChallengeParameters: { USERNAME: "mp_saved" } }, "old@example.com"), "mp_saved");
  assert.equal(otpChallengeUsername({ ChallengeParameters: { USER_ID_FOR_SRP: "mp_srp" } }, "old@example.com"), "mp_srp");
  assert.equal(otpChallengeUsername({}, "member@example.com"), "member@example.com");
});

test("attribute update delivery is reused without replacing the first SMS code", async () => {
  const calls = [];
  const delivery = { AttributeName: "phone_number", DeliveryMedium: "SMS", Destination: "***1234" };
  const result = await requestPhoneVerification({
    endpoint: "https://example.test", accessToken: "test-token", phone: "+573001231234",
    call: async (args) => {
      calls.push(args);
      return { ok: true, body: { CodeDeliveryDetailsList: [delivery] } };
    },
  });
  assert.equal(calls.length, 1);
  assert.deepEqual(result.body.CodeDeliveryDetails, delivery);
});

test("explicit verification is requested only when updating did not send an SMS", async () => {
  const calls = [];
  const result = await requestPhoneVerification({
    endpoint: "https://example.test", accessToken: "test-token", phone: "+573001231234",
    call: async ({ target }) => {
      calls.push(target);
      return { ok: true, body: target === "UpdateUserAttributes" ? {} : { CodeDeliveryDetails: { DeliveryMedium: "SMS" } } };
    },
  });
  assert.deepEqual(calls, ["UpdateUserAttributes", "GetUserAttributeVerificationCode"]);
  assert.equal(result.body.CodeDeliveryDetails.DeliveryMedium, "SMS");
});

test("failed attribute update must not send a verification code for the previous phone", async () => {
  let calls = 0;
  const failure = { ok: false, body: { __type: "NotAuthorizedException" } };
  const result = await requestPhoneVerification({ call: async () => { calls++; return failure; } });
  assert.equal(calls, 1);
  assert.equal(result, failure);
});
