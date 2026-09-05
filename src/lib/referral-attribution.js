const ATTRIBUTION_KEY = "mp_ref_context";
const LEGACY_REF_KEY = "mp_ref";
const DRAFT_KEYS = ["mp_registration_draft", "vp_registration_draft"];
const ATTRIBUTION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function normalizeReferralCode(value) {
  return String(value || "").trim().slice(0, 64);
}

export function normalizePlacementSide(value) {
  const side = String(value || "").trim().toUpperCase();
  return side === "L" || side === "R" ? side : "";
}

export function normalizeReferralEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

export function captureReferralFromUrl(search, storage = browserStorage(), now = Date.now()) {
  const params = new URLSearchParams(String(search || "").replace(/^\?/, ""));
  const code = normalizeReferralCode(params.get("ref"));
  if (!code || !storage) return null;

  const email = normalizeReferralEmail(params.get("email"));
  const side = normalizePlacementSide(params.get("side"));
  const attribution = {
    code,
    side,
    email: email || null,
    source: "url",
    createdAt: new Date(now).toISOString(),
  };

  writeJson(storage, ATTRIBUTION_KEY, attribution);
  safeSet(storage, LEGACY_REF_KEY, code);
  return attribution;
}

export function bindReferralToEmail(email, storage = browserStorage(), now = Date.now()) {
  const normalizedEmail = normalizeReferralEmail(email);
  if (!normalizedEmail || !storage) return null;

  const current = validAttribution(readJson(storage, ATTRIBUTION_KEY), now);
  const draft = findDraftReferral(storage, normalizedEmail, now);
  const currentEmail = normalizeReferralEmail(current?.email);
  const currentMatches = current?.code && (!currentEmail || currentEmail === normalizedEmail);
  const source = currentMatches ? current : draft;
  const code = normalizeReferralCode(source?.code);
  if (!code) return null;

  const attribution = {
    code,
    side: normalizePlacementSide(source?.side),
    email: normalizedEmail,
    source: source?.source || "registration",
    createdAt: source?.createdAt || new Date(now).toISOString(),
    boundAt: new Date(now).toISOString(),
  };
  writeJson(storage, ATTRIBUTION_KEY, attribution);
  safeSet(storage, LEGACY_REF_KEY, code);
  return attribution;
}

export function bindReferralCodeToEmail(email, code, storage = browserStorage(), now = Date.now(), source = "registration") {
  const normalizedEmail = normalizeReferralEmail(email);
  const normalizedCode = normalizeReferralCode(code);
  if (!normalizedEmail || !normalizedCode || !storage) return null;

  const current = validAttribution(readJson(storage, ATTRIBUTION_KEY), now);
  const inheritedSide = current?.code === normalizedCode ? normalizePlacementSide(current.side) : "";
  const attribution = {
    code: normalizedCode,
    side: inheritedSide,
    email: normalizedEmail,
    source: String(source || "registration").slice(0, 48),
    createdAt: new Date(now).toISOString(),
    boundAt: new Date(now).toISOString(),
  };
  writeJson(storage, ATTRIBUTION_KEY, attribution);
  safeSet(storage, LEGACY_REF_KEY, normalizedCode);
  return attribution;
}

export function referralForCheckout(email, storage = browserStorage(), now = Date.now()) {
  const normalizedEmail = normalizeReferralEmail(email);
  if (!normalizedEmail || !storage) {
    return { code: "", email: "" };
  }

  const draft = findDraftReferral(storage, normalizedEmail, now);
  if (draft?.code) {
    return withPlacementSide(draft.code, normalizedEmail, draft.side);
  }

  const attribution = validAttribution(readJson(storage, ATTRIBUTION_KEY), now);
  if (attribution?.code && normalizeReferralEmail(attribution.email) === normalizedEmail) {
    return withPlacementSide(normalizeReferralCode(attribution.code), normalizedEmail, attribution.side);
  }

  clearUnmatchedReferral(storage);
  return { code: "", email: "" };
}

function findDraftReferral(storage, email, now) {
  for (const key of DRAFT_KEYS) {
    const draft = readJson(storage, key);
    if (normalizeReferralEmail(draft.email) !== email) continue;
    const code = normalizeReferralCode(draft.referralCode || draft.ref);
    if (!code) continue;
    const createdAt = Date.parse(draft.createdAt || "");
    if (Number.isFinite(createdAt) && now - createdAt > ATTRIBUTION_TTL_MS) continue;
    return {
      code,
      side: normalizePlacementSide(draft.preferredSide || draft.side),
      source: "registration_draft",
      createdAt: draft.createdAt,
    };
  }
  return null;
}

function validAttribution(value, now) {
  const code = normalizeReferralCode(value?.code);
  if (!code) return null;
  const createdAt = Date.parse(value.createdAt || "");
  if (Number.isFinite(createdAt) && now - createdAt > ATTRIBUTION_TTL_MS) return null;
  return { ...value, code, side: normalizePlacementSide(value?.side) };
}

function withPlacementSide(code, email, side) {
  const normalizedSide = normalizePlacementSide(side);
  return normalizedSide ? { code, email, side: normalizedSide } : { code, email };
}

function clearUnmatchedReferral(storage) {
  safeRemove(storage, ATTRIBUTION_KEY);
  safeRemove(storage, LEGACY_REF_KEY);
}

function readJson(storage, key) {
  try {
    return JSON.parse(storage.getItem(key) || "{}");
  } catch {
    return {};
  }
}

function writeJson(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore storage failures */
  }
}

function safeSet(storage, key, value) {
  try {
    storage.setItem(key, value);
  } catch {
    /* ignore storage failures */
  }
}

function safeRemove(storage, key) {
  try {
    storage.removeItem(key);
  } catch {
    /* ignore storage failures */
  }
}

function browserStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
