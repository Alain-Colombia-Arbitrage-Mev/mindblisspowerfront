import { createExpiringResource } from "./expiring-resource.mjs";

export const RANK_CATALOG_TTL_MS = 300_000;

const nonnegativeAmount = value =>
  (typeof value === "number" && Number.isFinite(value) && value >= 0)
  || (typeof value === "string" && value.length <= 40 && /^\d+(?:\.\d+)?$/.test(value)
    && Number.isFinite(Number(value)));

// Allowlist every row as well as the envelope: no current member rank, wallet,
// email, permissions or arbitrary nested response fields enter the browser TTL.
function sanitizedRanks(data) {
  if (!Array.isArray(data?.ranks) || data.ranks.length > 1000 || data.error)
    throw new Error("rank-catalog-invalid");
  return data.ranks.map(rank => {
    if (!rank || typeof rank !== "object" || Array.isArray(rank)
      || typeof rank.code !== "string" || !rank.code.trim() || rank.code.length > 100
      || typeof rank.name_es !== "string" || !rank.name_es.trim() || rank.name_es.length > 200
      || !nonnegativeAmount(rank.required_points) || !nonnegativeAmount(rank.bonus_amount_usd))
      throw new Error("rank-catalog-invalid");
    return {
      code: rank.code,
      name_es: rank.name_es,
      required_points: rank.required_points,
      bonus_amount_usd: rank.bonus_amount_usd,
    };
  });
}

async function loadRanks() {
  const response = await fetch("/api/member/ranks", {
    cache: "no-store",
    credentials: "same-origin",
    redirect: "error",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`rank-catalog-${response.status}`);
  const data = await response.json();
  return { ranks: sanitizedRanks(data) };
}

// Only the non-personal rank catalog is retained, never a member's rank or wallet.
// A private browser-memory display cache only: checkout pricing and member data
// still require fresh authoritative reads. Nothing is persisted or CDN-cached.
const catalog = createExpiringResource(loadRanks, {
  ttlMs: RANK_CATALOG_TTL_MS,
  now: () => Date.now(),
});
export function readRankCatalog(options = {}) {
  return typeof window === "undefined" ? loadRanks() : catalog.read(options);
}

export function invalidateRankCatalog() {
  catalog.invalidate();
}
