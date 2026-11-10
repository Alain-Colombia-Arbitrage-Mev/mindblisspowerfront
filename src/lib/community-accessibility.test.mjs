import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const src = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("community controls keep accessible touch targets without manual branch selection", async () => {
  const css = await readFile(path.join(src, "index.css"), "utf8");
  assert.match(css, /\.mb-community-tools :is\(a, button\)\s*\{[^}]*min-height:\s*44px/s);
  const source = await readFile(path.join(src, "app", "dashboard", "_components", "executive-pages", "CommunityInviteCard.jsx"), "utf8");
  assert.doesNotMatch(source, /branch-switch|community\.left|community\.right|setSide/);
  assert.match(source, /referralLinkFrom/);
});
