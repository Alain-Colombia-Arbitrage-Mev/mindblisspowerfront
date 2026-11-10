import { dashboardMessages } from "./dashboard-messages.js";
import { messages, SUPPORTED_LOCALES } from "./messages.js";
import { portalMessages } from "./portal-messages.js";

export function normalizeLocale(value) {
  const candidate = String(value || "").toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LOCALES.includes(candidate) ? candidate : "es";
}

function valueAt(dictionary, key) {
  let value = dictionary;
  for (const part of String(key || "").split(".")) value = value?.[part];
  return typeof value === "string" ? value : null;
}

export function translateMessage(locale, key, variables = undefined) {
  const activeLocale = normalizeLocale(locale);
  let value = valueAt(portalMessages[activeLocale], key)
    ?? valueAt(dashboardMessages[activeLocale], key)
    ?? valueAt(messages[activeLocale], key)
    ?? valueAt(portalMessages.es, key)
    ?? valueAt(dashboardMessages.es, key)
    ?? valueAt(messages.es, key)
    ?? key;

  if (variables) {
    for (const [name, replacement] of Object.entries(variables)) {
      value = value.replaceAll(`{${name}}`, String(replacement));
    }
  }
  return value;
}
