import { createExpiringResource } from "./expiring-resource.mjs";

async function loadRanks() {
  const response = await fetch("/api/member/ranks", {
    cache: "no-store",
    credentials: "same-origin",
  });
  if (!response.ok) throw new Error(`rank-catalog-${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data?.ranks) || data.error)
    throw new Error("rank-catalog-invalid");
  return { ranks: data.ranks };
}

// Only the non-personal rank catalog is retained, never a member's rank or wallet.
const catalog = createExpiringResource(loadRanks, { ttlMs: 60_000 });
export function readRankCatalog(options = {}) {
  return typeof window === "undefined" ? loadRanks() : catalog.read(options);
}

export function invalidateRankCatalog() {
  catalog.invalidate();
}
