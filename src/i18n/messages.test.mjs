import assert from "node:assert/strict";
import test from "node:test";

import { LOCALE_OPTIONS, messages, SUPPORTED_LOCALES } from "./messages.js";

function keysAt(value, prefix = "") {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof child === "string" ? [path] : keysAt(child, path);
  }).sort();
}

test("all supported Mindbliss locales expose the same translation contract", () => {
  assert.deepEqual(SUPPORTED_LOCALES, ["es", "en", "ar", "zh"]);
  const expected = keysAt(messages.es);
  for (const locale of SUPPORTED_LOCALES) {
    assert.deepEqual(keysAt(messages[locale]), expected, `${locale} has a missing or extra message`);
    for (const value of Object.values(messages[locale])) assert.ok(value && typeof value === "object");
  }
});

test("Arabic is the only RTL locale and every locale has a visible selector label", () => {
  assert.deepEqual(LOCALE_OPTIONS.map(({ code, dir }) => [code, dir]), [
    ["es", "ltr"], ["en", "ltr"], ["ar", "rtl"], ["zh", "ltr"],
  ]);
  for (const option of LOCALE_OPTIONS) {
    assert.ok(option.label.trim());
    assert.ok(option.short.trim());
  }
});
