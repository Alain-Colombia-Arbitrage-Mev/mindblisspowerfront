import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { dashboardMessages } from "./dashboard-messages.js";
import { messages } from "./messages.js";
import { portalMessages } from "./portal-messages.js";
import { normalizeLocale, translateMessage } from "./translate.mjs";

function leafKeys(value, prefix = "") {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof child === "string" ? [path] : leafKeys(child, path);
  }).sort();
}

test("Spanish, English, Arabic and Chinese expose the same translation contract", () => {
  for (const [name, catalog] of Object.entries({ messages, dashboardMessages, portalMessages })) {
    const expected = leafKeys(catalog.es);
    for (const locale of ["en", "ar", "zh"]) {
      assert.deepEqual(leafKeys(catalog[locale]), expected, `${name}.${locale}`);
    }
  }
});

test("the translator normalizes browser locales, interpolates values and falls back safely", () => {
  assert.equal(normalizeLocale("ar-SA"), "ar");
  assert.equal(normalizeLocale("zh_CN"), "zh");
  assert.equal(normalizeLocale("unknown"), "es");
  assert.equal(translateMessage("en-US", "referralCard.code", { code: "ABC-1" }), "Code: ABC-1");
  assert.equal(translateMessage("ar", "missing.translation"), "missing.translation");
});

test("the language control remains available in the shared header and the custom desktop overview toolbar", () => {
  const header = readFileSync(new URL("../components/panel/PanelHeader.jsx", import.meta.url), "utf8");
  const overview = readFileSync(new URL("../components/panel/overview/OverviewDashboard.jsx", import.meta.url), "utf8");
  assert.match(header, /<LanguageSwitcher\s+compact/);
  assert.match(overview, /<LanguageSwitcher\s+compact/);
});
