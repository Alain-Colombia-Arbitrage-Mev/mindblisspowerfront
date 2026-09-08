import assert from "node:assert/strict";
import test from "node:test";
import { cognitoUserStatus } from "./cognito-user-status.js";

const env = { VP_PAYMENTS_URL: "https://backend.test", PAYMENTS_SERVICE_TOKEN: "test-service-token" };

test("unavailable status service does not classify an existing member as missing", async (t) => {
  t.mock.method(globalThis, "fetch", async () => { throw new Error("offline"); });
  assert.equal((await cognitoUserStatus("member@example.com", env)).exists, null);
});

test("unconfirmed and unverified contact states survive the status lookup", async (t) => {
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    assert.equal(options.cache, "no-store");
    assert.equal(options.headers["X-VP-Service-Token"], env.PAYMENTS_SERVICE_TOKEN);
    return Response.json({ checked: true, exists: true, enabled: true, confirmed: false, status: "UNCONFIRMED", phone_linked: true, phone_verified: false });
  });
  const status = await cognitoUserStatus("member@example.com", env);
  assert.equal(status.confirmed, false);
  assert.equal(status.phoneVerified, false);
  assert.equal(status.phoneLinked, true);
});
