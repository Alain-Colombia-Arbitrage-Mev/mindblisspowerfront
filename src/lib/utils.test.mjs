import assert from "node:assert/strict";
import test from "node:test";
import { cn, isIframe } from "./utils.js";

test("shared class names can be imported during SSR without a browser global", () => {
  assert.equal(isIframe, false);
  assert.equal(cn("p-2", false && "hidden", "p-4"), "p-4");
});
