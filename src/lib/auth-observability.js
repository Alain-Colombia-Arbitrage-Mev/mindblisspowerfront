import { createHash } from "node:crypto";

export function authLogFields({ email, channel, delivery, status, reason, errorCode, extra = {} } = {}) {
  return pruneEmpty({
    email_hash: hashEmail(email),
    email_domain: emailDomain(email),
    channel,
    status,
    reason,
    error_code: errorCode,
    delivery_medium: delivery?.DeliveryMedium || delivery?.deliveryMedium || "",
    has_delivery_destination: Boolean(delivery?.Destination || delivery?.destination),
    ...extra,
  });
}

export function logAuthEvent(event, fields = {}, level = "info") {
  const method = level === "warn" || level === "error" ? level : "info";
  console[method](`[auth:${event}] ${JSON.stringify(pruneEmpty(fields))}`);
}

function hashEmail(email) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) return "";
  return createHash("sha256").update(normalized).digest("hex").slice(0, 16);
}

function emailDomain(email) {
  const normalized = String(email || "").trim().toLowerCase();
  const at = normalized.lastIndexOf("@");
  return at > 0 ? normalized.slice(at + 1) : "";
}

function pruneEmpty(input) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== "" && value !== null && value !== undefined)
  );
}
