import assert from "node:assert/strict";
import test from "node:test";
import { callCognito, mapCognitoStatus } from "./cognito-api.js";

test("Cognito network and malformed-response failures do not retry OTP sends", async (t) => {
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => { calls++; throw new Error("network"); });
  const response = await callCognito({ endpoint: "https://example.test", target: "SignUp", payload: {} });
  assert.equal(calls, 1);
  assert.equal(response.ok, false);
  assert.equal(mapCognitoStatus(response.body), 503);
});

test("an invalid JSON success response cannot be mistaken for a delivered code", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response("gateway error", { status: 200 }));
  const response = await callCognito({ endpoint: "https://example.test", target: "InitiateAuth", payload: {} });
  assert.equal(response.ok, false);
});

test("Cognito request is bounded, uncached and preserves delivery errors", async (t) => {
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    assert.equal(options.headers["X-Amz-Target"], "AWSCognitoIdentityProviderService.ResendConfirmationCode");
    assert.equal(options.cache, "no-store");
    assert.ok(options.signal instanceof AbortSignal);
    return Response.json({ __type: "CodeDeliveryFailureException" }, { status: 400 });
  });
  const response = await callCognito({ endpoint: "https://example.test", target: "ResendConfirmationCode", payload: {} });
  assert.equal(response.ok, false);
  assert.equal(response.body.__type, "CodeDeliveryFailureException");
});
