import test from "node:test";
import assert from "node:assert/strict";

import { authLogFields } from "./auth-observability.js";

test("authLogFields redacts email and keeps domain for OTP diagnostics", () => {
  const fields = authLogFields({
    email: "Miembro@Example.COM",
    channel: "email",
    delivery: { DeliveryMedium: "EMAIL", Destination: "m***@e***" },
    status: 200,
    reason: "sent",
  });

  assert.equal(fields.email_domain, "example.com");
  assert.equal(fields.channel, "email");
  assert.equal(fields.delivery_medium, "EMAIL");
  assert.equal(fields.has_delivery_destination, true);
  assert.equal(fields.email_hash.length, 16);
  assert.equal(JSON.stringify(fields).includes("Miembro"), false);
});
