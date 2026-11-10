const ATTRIBUTION_KEY = "mp_ref_context";
const LEGACY_REF_KEY = "mp_ref";
const DRAFT_KEYS = ["mp_registration_draft", "vp_registration_draft"];
const BINDINGS_KEY = 'mp_ref_bindings.v1';
const MAX_BINDINGS = 20;
const ATTRIBUTION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function normalizeReferralCode(value) {
  if (typeof value !== 'string') return '';
  const code = value.trim();
  return code.length <= 64 && !/[\u0000-\u0020\u007f]/.test(code) ? code : '';
}

export function normalizePlacementSide(value) {
  // Placement is never a browser decision. The backend chooses the available
  // weak-leg slot atomically when the membership is activated.
  void value;
  return "";
}

export function normalizeReferralEmail(value) {
  const email = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

export function captureReferralFromUrl(search, storage = browserStorage(), now = Date.now()) {
  const params = new URLSearchParams(String(search || "").replace(/^\?/, ""));
  const code = normalizeReferralCode(params.get("ref"));
  if (!code || !storage) return null;

  const email = normalizeReferralEmail(params.get("email"));
  const attribution = {
    code,
    side: "",
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
  const source = currentMatches ? current : readBindings(storage, now).find(item => item.email === normalizedEmail) || draft;
  const code = normalizeReferralCode(source?.code);
  if (!code) return null;

  const attribution = {
    code,
    side: "",
    email: normalizedEmail,
    source: source?.source || "registration",
    createdAt: source?.createdAt || new Date(now).toISOString(),
    boundAt: new Date(now).toISOString(),
  };
  writeJson(storage, ATTRIBUTION_KEY, attribution);
  writeBinding(storage, attribution, now);
  safeSet(storage, LEGACY_REF_KEY, code);
  return attribution;
}

export function bindReferralCodeToEmail(email, code, storage = browserStorage(), now = Date.now(), source = "registration", preferredSide = undefined) {
  const normalizedEmail = normalizeReferralEmail(email);
  const normalizedCode = normalizeReferralCode(code);
  if (!normalizedEmail || !normalizedCode || !storage) return null;

  void preferredSide;
  const attribution = {
    code: normalizedCode,
    side: "",
    email: normalizedEmail,
    source: String(source || "registration").slice(0, 48),
    createdAt: new Date(now).toISOString(),
    boundAt: new Date(now).toISOString(),
  };
  writeJson(storage, ATTRIBUTION_KEY, attribution);
  writeBinding(storage, attribution, now);
  safeSet(storage, LEGACY_REF_KEY, normalizedCode);
  return attribution;
}

export function referralForCheckout(email, storage = browserStorage(), now = Date.now()) {
  const normalizedEmail = normalizeReferralEmail(email);
  if (!normalizedEmail || !storage) {
    return { code: "", email: "" };
  }

  const binding = readBindings(storage, now).find(item => item.email === normalizedEmail);
  if (binding) return { code: binding.code, email: normalizedEmail };

  const attribution = validAttribution(readJson(storage, ATTRIBUTION_KEY), now);
  if (attribution?.code && normalizeReferralEmail(attribution.email) === normalizedEmail) {
    return { code: normalizeReferralCode(attribution.code), email: normalizedEmail };
  }

  const draft = findDraftReferral(storage, normalizedEmail, now);
  if (draft?.code) return { code: draft.code, email: normalizedEmail };

  // Looking up A must not erase an independent hint that belongs to B.
  return { code: "", email: "" };
}

function findDraftReferral(storage, email, now) {
  for (const key of DRAFT_KEYS) {
    const draft = readJson(storage, key);
    if (normalizeReferralEmail(draft.email) !== email) continue;
    const code = normalizeReferralCode(draft.referralCode || draft.ref);
    if (!code) continue;
    const createdAt = Date.parse(draft.createdAt || "");
    if (!Number.isFinite(createdAt) || createdAt > now || now - createdAt > ATTRIBUTION_TTL_MS) continue;
    return {
      code,
      side: "",
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
  if (!Number.isFinite(createdAt) || createdAt > now || now - createdAt > ATTRIBUTION_TTL_MS) return null;
  return { code, side: "", email: normalizeReferralEmail(value?.email) || null,
    source: typeof value?.source === 'string' ? value.source.slice(0, 48) : 'registration',
    createdAt: new Date(createdAt).toISOString() };
}

function readBindings(storage, now) {
  const stored = readJson(storage, BINDINGS_KEY);
  if (!Array.isArray(stored) || stored.length > MAX_BINDINGS) return [];
  return stored.map(value => validAttribution(value, now)).filter(value => value?.email);
}

function writeBinding(storage, attribution, now) {
  if (!normalizeReferralEmail(attribution.email)) return;
  const retained = readBindings(storage, now).filter(item => item.email !== attribution.email);
  writeJson(storage, BINDINGS_KEY, [attribution, ...retained].slice(0, MAX_BINDINGS));
}

function readJson(storage, key) {
  try {
    const raw = storage.getItem(key);
    return typeof raw === 'string' && raw.length <= 16384 ? JSON.parse(raw) : {};
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

function browserStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
