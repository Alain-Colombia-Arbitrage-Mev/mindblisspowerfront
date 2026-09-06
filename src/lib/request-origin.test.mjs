import assert from "node:assert/strict";
import test from "node:test";

import { hasSameOrigin, resolveOrigin } from "./request-origin.js";

function request(headers = {}, url = "http://127.0.0.1:3000/api/member/onboarding") {
  return { url, headers: new Headers(headers) };
}

test("resolveOrigin honors the public reverse-proxy origin", () => {
  const req = request({ "x-forwarded-host": "app.mindblisspower.com", "x-forwarded-proto": "https" });
  assert.equal(resolveOrigin(req), "https://app.mindblisspower.com");
});

test("hasSameOrigin accepts the customer app origin", () => {
  const req = request({
    origin: "https://app.mindblisspower.com",
    "x-forwarded-host": "app.mindblisspower.com",
    "x-forwarded-proto": "https",
  });
  assert.equal(hasSameOrigin(req), true);
});

test("hasSameOrigin rejects cross-site and missing origins", () => {
  const proxy = { "x-forwarded-host": "app.mindblisspower.com", "x-forwarded-proto": "https" };
  assert.equal(hasSameOrigin(request({ ...proxy, origin: "https://evil.example" })), false);
  assert.equal(hasSameOrigin(request(proxy)), false);
});

test("hasSameOrigin accepts local HTTP development without a forwarded protocol", () => {
  const req = request({ origin: "http://localhost:3000", host: "localhost:3000" }, "http://localhost:3000/api/member/onboarding");
  assert.equal(hasSameOrigin(req), true);
});
