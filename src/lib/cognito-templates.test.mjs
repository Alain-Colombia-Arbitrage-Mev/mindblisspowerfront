import test from "node:test";
import assert from "node:assert/strict";
import { handler } from "../../infra/cognito-custom-message/index.mjs";

test("signup and password reset messages have distinct subjects and preserve the Cognito code placeholder", async () => {
  const makeEvent = (triggerSource) => ({ triggerSource, request: { codeParameter: "{####}", userAttributes: { locale: "es" } } });
  const signup = await handler(makeEvent("CustomMessage_SignUp"));
  const reset = await handler(makeEvent("CustomMessage_ForgotPassword"));
  assert.notEqual(signup.response.emailSubject, reset.response.emailSubject);
  assert.ok(signup.response.emailMessage.includes("{####}"));
  assert.ok(reset.response.emailMessage.includes("{####}"));
  assert.ok(signup.response.smsMessage.length < 160);
  assert.match(signup.response.smsMessage, /^[\x20-\x7E]+$/);
});

test("Cognito invitations retain both required placeholders", async () => {
  const event = await handler({ triggerSource: "CustomMessage_AdminCreateUser", request: { codeParameter: "{####}", usernameParameter: "{username}" } });
  for (const value of [event.response.emailMessage, event.response.smsMessage]) {
    assert.ok(value.includes("{username}"));
    assert.ok(value.includes("{####}"));
  }
});

test("English locale is respected and unrelated triggers are left intact", async () => {
  const event = await handler({ triggerSource: "CustomMessage_SignUp", request: { userAttributes: { locale: "en-US" } } });
  assert.match(event.response.emailSubject, /Confirm your account/);
  const unrelated = { triggerSource: "PreSignUp_SignUp" };
  assert.equal(await handler(unrelated), unrelated);
});
