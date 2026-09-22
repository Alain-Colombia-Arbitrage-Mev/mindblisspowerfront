import test from "node:test";
import assert from "node:assert/strict";

test("token extraction accepts query and form body", async () => {
  const { extractToken } = await import("./token.mjs");
  assert.equal(extractToken({ t: "abc" }, null), "abc");
  assert.equal(extractToken({}, { token: "xyz" }), "xyz");
  assert.equal(extractToken({ t: "a b" }, null), "");           // espacios no válidos
  assert.equal(extractToken({ t: "x".repeat(600) }, null), ""); // demasiado largo
});
