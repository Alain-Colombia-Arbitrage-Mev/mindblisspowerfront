import { createHash } from "node:crypto";
import { rateLimit } from "./rate-limit.js";

export const MEMBER_READ_LIMITS = Object.freeze({
  position: 120,
  tree: 30,
  ranks: 60,
});

function busyResponse(status, error, retryAfterSec) {
  return Response.json(
    { error, retryAfterSec },
    {
      status,
      headers: {
        "Cache-Control": "private, no-store",
        "Retry-After": String(retryAfterSec),
      },
    },
  );
}

// Identity must come from JWT verification, never from query params or an IP.
export function memberReadLimit(email, scope) {
  if (!email) return busyResponse(401, "unauthenticated", 1);
  const limit = MEMBER_READ_LIMITS[scope];
  if (!limit) throw new Error("Unknown member read scope");
  const identity = createHash("sha256")
    .update(email.trim().toLowerCase())
    .digest("hex");
  const result = rateLimit([
    { key: `member-read:${identity}:all`, limit: 180, windowMs: 60_000 },
    { key: `member-read:${identity}:${scope}`, limit, windowMs: 60_000 },
  ]);
  return result.allowed
    ? null
    : busyResponse(429, "rate_limited", result.retryAfterSec);
}

export function createReadCapacity(limit) {
  if (!Number.isInteger(limit) || limit < 1)
    throw new Error("Invalid read capacity");
  let active = 0;
  return async function run(load) {
    if (active >= limit) return busyResponse(503, "server_busy", 2);
    active++;
    try {
      const response = await load();
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    } finally {
      active--;
    }
  };
}

const configured = Number(process.env.MEMBER_TREE_MAX_CONCURRENT || 32);
export const withMemberTreeCapacity = createReadCapacity(
  Number.isInteger(configured) && configured >= 1 && configured <= 128
    ? configured
    : 32,
);
