import assert from "node:assert/strict";
import test from "node:test";

import { adminUrl, customerDomainDecision, normalizeHost } from "./domain-routing.js";

test("normalizes host names with ports", () => {
  assert.equal(normalizeHost("APP.MINDBLISSPOWER.COM:443"), "app.mindblisspower.com");
});

test("keeps member routes on the customer app", () => {
  assert.deepEqual(
    customerDomainDecision({ host: "app.mindblisspower.com", pathname: "/dashboard/network" }),
    { type: "pass" },
  );
});

test("hides admin APIs on the customer app", () => {
  assert.deepEqual(
    customerDomainDecision({ host: "app.mindblisspower.com", pathname: "/api/admin/summary" }),
    { type: "notFound" },
  );
  assert.deepEqual(
    customerDomainDecision({ host: "98.83.116.99.sslip.io", pathname: "/api/admin/summary" }),
    { type: "notFound" },
  );
});

test("redirects admin pages to the admin app", () => {
  assert.deepEqual(
    customerDomainDecision({ host: "app.mindblisspower.com", pathname: "/dashboard/admin" }),
    { type: "redirect", location: adminUrl("/dashboard") },
  );
  assert.deepEqual(
    customerDomainDecision({ host: "app.mindblisspower.com", pathname: "/dashboard/command-center" }),
    { type: "redirect", location: adminUrl("/dashboard/centro-de-mando") },
  );
});

test("does not affect local development hosts", () => {
  assert.deepEqual(
    customerDomainDecision({ host: "localhost:3000", pathname: "/api/admin/summary" }),
    { type: "pass" },
  );
});
