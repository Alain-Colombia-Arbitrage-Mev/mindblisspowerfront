import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function productionSources(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await productionSources(target));
    } else if (/\.(?:js|jsx|mjs)$/.test(entry.name) && !entry.name.endsWith(".test.mjs")) {
      files.push(target);
    }
  }
  return files;
}

test("production code contains no browser-controlled admin bypass", async () => {
  const sources = await productionSources(root);
  const forbidden = /force-override|_admin_force_bypass|FORCE MODE|Force admin access bypass/;

  for (const file of sources) {
    const source = await readFile(file, "utf8");
    assert.doesNotMatch(source, forbidden, path.relative(root, file));
  }
});

test("the admin page remains behind the server-side admin layout", async () => {
  const layout = await readFile(path.join(root, "app", "dashboard", "admin", "layout.jsx"), "utf8");
  assert.match(layout, /assertAdminOrRedirect/);
  assert.match(layout, /await\s+assertAdminOrRedirect\(\)/);
});
