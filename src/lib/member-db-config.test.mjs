import test from "node:test";
import assert from "node:assert/strict";
import { memberDbOptions } from "./member-db-config.js";

test("RDS validates certificate with mounted CA and bounded connections", () => {
  const options = memberDbOptions({ MEMBER_DB_SSL: "verify-full", MEMBER_DB_CA_FILE: "/run/db-ca/server-ca.pem" }, file => {
    assert.equal(file, "/run/db-ca/server-ca.pem");
    return "synthetic-ca";
  });
  assert.deepEqual(options.ssl, { rejectUnauthorized: true, ca: "synthetic-ca" });
  assert.equal(options.max, 4);
});
test("keeps local and legacy configuration explicit", () => {
  assert.equal(memberDbOptions({ MEMBER_DB_SSL: "disable" }).ssl, false);
  assert.equal(memberDbOptions({}).ssl, "require");
  assert.equal(memberDbOptions({ MEMBER_DB_SSL: "verify-full", MEMBER_DB_PGBOUNCER: "true" }).prepare, false);
});
test("rejects insecure CA configuration and unknown modes", () => {
  assert.throws(() => memberDbOptions({ MEMBER_DB_CA_FILE: "/ca" }), /verify-full/);
  assert.throws(() => memberDbOptions({ MEMBER_DB_SSL: "verify-ca" }), /MEMBER_DB_SSL/);
});

test("App Platform inline CA verifies the server and rejects mixed sources", () => {
  const env = { MEMBER_DB_SSL: "verify-full", MEMBER_DB_CA_PEM: "synthetic-ca" };
  assert.deepEqual(memberDbOptions(env).ssl, { rejectUnauthorized: true, ca: "synthetic-ca" });
  assert.throws(() => memberDbOptions({ ...env, MEMBER_DB_CA_FILE: "/ca" }), /not both/);
  assert.throws(() => memberDbOptions({ ...env, MEMBER_DB_SSL: "require" }), /verify-full/);
});
