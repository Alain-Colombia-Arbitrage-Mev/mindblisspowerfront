import { normalizeReferralCode, normalizeReferralEmail, normalizePlacementSide, referralForCheckout } from './referral-attribution.js';
import { browserRequestDeadline } from './browser-request-deadline.mjs';

const key = 'mp_ref_verified_visit.v1';
const ttl = 30 * 60 * 1000;
const scopes = new WeakMap();
const endpoint = '/api/member/referral-attribution';
const browserDefault = () => typeof window === 'undefined' ? undefined : window;
function syncState(browser) {
  const scope = browser && typeof browser === 'object' ? browser : globalThis;
  if (!scopes.has(scope)) scopes.set(scope, { reads: new Map(), writes: new Map(), revision: 0 });
  return scopes.get(scope);
}
function validResponse(body) {
  return body && typeof body === 'object' && !Array.isArray(body)
    && Object.keys(body).every(key => ['ok', 'ref', 'preferred_side', 'positioned'].includes(key))
    && body.ok === true && typeof body.positioned === 'boolean'
    && typeof body.ref === 'string' && normalizeReferralCode(body.ref) === body.ref
    && typeof body.preferred_side === 'string' && ['', 'L', 'R'].includes(body.preferred_side)
    && (!body.positioned || (!body.ref && !body.preferred_side)) && (body.ref || !body.preferred_side);
}
function store(browser, value) {
  try { browser?.sessionStorage?.setItem(key, JSON.stringify(value)); } catch { /* A denied store cannot block verified entry. */ }
}
function currentVisit(email, browser, now = Date.now()) {
  try {
    const raw = browser?.sessionStorage?.getItem(key);
    if (typeof raw !== 'string' || raw.length > 2048) return null;
    const value = JSON.parse(raw), normalized = normalizeReferralEmail(email);
    return normalized && value?.email === normalized && typeof value.id === 'string' && value.id.length <= 128
      && value.ref && normalizeReferralCode(value.ref) === value.ref && ['', 'L', 'R'].includes(value.preferred_side)
      && Number.isSafeInteger(value.createdAt) && value.createdAt <= now && now - value.createdAt <= ttl ? value : null;
  } catch { return null; }
}
function clearVisit(visit, browser) {
  if (currentVisit(visit.email, browser)?.id !== visit.id) return;
  try { browser?.sessionStorage?.removeItem(key); } catch { /* Keep the hint if storage is unavailable. */ }
}
const matches = (result, visit) => result.positioned || (result.ref === visit.ref && result.preferred_side === visit.preferred_side);

async function postVisit(visit, { browser = browserDefault(), fetchImpl = fetch } = {}) {
  const state = syncState(browser), { writes } = state;
  const flight = `${visit.email}:${visit.id}`;
  if (writes.has(flight)) return writes.get(flight);
  state.revision++;
  const completion = (async () => {
    const deadline = browserRequestDeadline(undefined, 5000);
    try {
      const response = await fetchImpl(endpoint, { method: 'POST', credentials: 'same-origin', cache: 'no-store', redirect: 'error',
        keepalive: true, signal: deadline.signal, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref: visit.ref, preferred_side: visit.preferred_side, expected_email: visit.email }) });
      const body = await response.json().catch(() => null);
      if (!response.ok || !validResponse(body) || !matches(body, visit)) return { ok: false };
      clearVisit(visit, browser);
      return body;
    } catch { return { ok: false }; }
    finally { deadline.dispose(); }
  })();
  writes.set(flight, completion);
  try { return await completion; } finally {
    if (writes.get(flight) === completion) { writes.delete(flight); state.revision++; }
  }
}

// Called only after verified proof plus the matching canonical session. This is
// not an outbox: mounts and GETs never replay old localStorage attribution.
export function beginVerifiedReferralSync(email, ref, preferredSide = '', options = {}) {
  const normalized = normalizeReferralEmail(email), code = normalizeReferralCode(ref);
  if (!normalized || !code) return Promise.resolve({ ok: false });
  const browser = options.browser || browserDefault();
  try {
    const visit = { id: globalThis.crypto.randomUUID(), email: normalized, ref: code,
      preferred_side: normalizePlacementSide(preferredSide), createdAt: Date.now() };
    store(browser, visit);
    return postVisit(visit, { ...options, browser });
  } catch { return Promise.resolve({ ok: false }); }
}

export function pendingVerifiedReferral(email, options = {}) {
  return currentVisit(email, options.browser || browserDefault(), options.now ?? Date.now());
}

export function browserReferralChoice(email, options = {}) {
  try {
    const browser = options.browser || browserDefault(), hint = referralForCheckout(email, browser?.localStorage);
    return hint.code ? hint : null;
  } catch { return null; }
}

// An old browser hint is a visible user choice, not a background write. The
// caller must first obtain a current canonical session and show the choice.
export function chooseBrowserReferral(email, hint, options = {}) {
  const owner = normalizeReferralEmail(email);
  return hint?.email === owner && owner && hint.code && normalizeReferralCode(hint.code) === hint.code
    && (!hint.side || ['L', 'R'].includes(hint.side))
    ? beginVerifiedReferralSync(owner, hint.code, hint.side || '', options) : Promise.resolve({ ok: false });
}

// Explicit user action only. A failed save never erases the original hint or
// silently claims that the server accepted it.
export function retryVerifiedReferral(email, options = {}) {
  const browser = options.browser || browserDefault(), visit = currentVisit(email, browser);
  return visit ? postVisit(visit, { ...options, browser }) : readVerifiedReferral(email, options);
}

export async function readVerifiedReferral(email, options = {}) {
  const normalized = normalizeReferralEmail(email);
  if (!normalized) return { ok: false };
  const browser = options.browser || browserDefault(), fetchImpl = options.fetchImpl || fetch;
  const state = syncState(browser), { reads } = state;
  if (reads.has(normalized)) return reads.get(normalized);
  const completion = (async () => {
    try {
      for (let attempt = 0; attempt < 2; attempt++) {
        // Observe an already-started write, never start/replay one from a GET.
        const pending = [...state.writes].filter(([flight]) => flight.startsWith(`${normalized}:`)).map(([, write]) => write);
        if (pending.length) await Promise.all(pending);
        const revision = state.revision, visitId = currentVisit(normalized, browser)?.id;
        const deadline = browserRequestDeadline(undefined, 8000);
        let response, body;
        try {
          response = await fetchImpl(endpoint, { credentials: 'same-origin', cache: 'no-store', redirect: 'error',
            signal: deadline.signal, headers: { 'X-VP-Expected-Email': normalized } });
          body = await response.json().catch(() => null);
        } finally { deadline.dispose(); }
        if (!response.ok || !validResponse(body)) return { ok: false };
        const visit = currentVisit(normalized, browser);
        // A late GET must not supersede a write that completed while it was
        // in flight, or clear the marker of a different verified visit.
        if (revision !== state.revision || visitId !== visit?.id) continue;
        if (visit && matches(body, visit)) clearVisit(visit, browser);
        return body;
      }
      return { ok: false };
    } catch { return { ok: false }; }
  })();
  reads.set(normalized, completion);
  try { return await completion; } finally { if (reads.get(normalized) === completion) reads.delete(normalized); }
}

export async function verifiedReferralForCheckout(email, options = {}) {
  const result = await readVerifiedReferral(email, options);
  if (!result.ok) return { ok: false, error: 'unavailable' };
  const visit = pendingVerifiedReferral(email, options);
  if (visit && !matches(result, visit)) return { ok: false, error: 'pending' };
  if (!result.positioned && !result.ref) {
    if (browserReferralChoice(email, options)) return { ok: false, error: 'unconfirmed' };
  }
  return { ok: true, code: result.ref, email: result.ref ? normalizeReferralEmail(email) : '', side: result.preferred_side };
}
