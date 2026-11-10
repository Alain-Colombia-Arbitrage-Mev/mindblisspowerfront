import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const src = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("community controls keep accessible touch targets", async () => {
  const css = await readFile(path.join(src, "index.css"), "utf8");
  assert.match(css, /\.mb-community-branch-switch button\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css, /\.mb-community-tools :is\(a, button\)\s*\{[^}]*min-height:\s*44px/s);
});
