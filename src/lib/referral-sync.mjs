import { normalizeReferralCode, normalizeReferralEmail, normalizePlacementSide, referralForCheckout } from './referral-attribution.js';
import { browserRequestDeadline } from './browser-request-deadline.mjs';

const key = 'mp_ref_verified_visit.v1';
const ttl = 30 * 60 * 1000;
const scopes = new WeakMap();
const endpoint = '/api/member/referral-attribution';
// The BFF verifies identity before its own 8s referral-upstream window.
// Allow /token headers + body (8s each), JWKS load + one key-rotation refresh
// (8s each), the referral upstream (8s), and 5s for browser/BFF delivery.
// This is an outer bound only; all server deadlines remain unchanged.
export const REFERRAL_REQUEST_TIMEOUT_MS = 45000;
const browserDefault = () => typeof window === 'undefined' ? undefined : window;
function syncState(browser) {
  const scope = browser && typeof browser === 'object' ? browser : globalThis;
  if (!scopes.has(scope)) scopes.set(scope, { reads: new Map(), writes: new Map(), owners: new Map(), visits: new Map(), revision: 0 });
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
  // An unavailable browser store cannot turn a failed choice into an empty,
  // apparently confirmed attribution. This memory is an owner-scoped hint only.
  const { visits } = syncState(browser);
  visits.set(value.email, value);
  try {
    if (!browser?.sessionStorage?.setItem) throw new Error('storage_unavailable');
    browser.sessionStorage.setItem(key, JSON.stringify(value));
  } catch { /* The owner-scoped memory above remains available in this context. */ }
}
function validVisit(value, email, now) {
  return value?.email === email && typeof value.id === 'string' && value.id.length <= 128
    && value.ref && normalizeReferralCode(value.ref) === value.ref && ['', 'L', 'R'].includes(value.preferred_side)
    && (value.confirmed === undefined || typeof value.confirmed === 'boolean')
    && Number.isSafeInteger(value.createdAt) && value.createdAt <= now && now - value.createdAt <= ttl;
}
function latestVisit(email, browser, now = Date.now()) {
  const normalized = normalizeReferralEmail(email);
  if (!normalized) return null;
  let value;
  try {
    const raw = browser?.sessionStorage?.getItem(key);
    if (typeof raw === 'string' && raw.length <= 2048) value = JSON.parse(raw);
  } catch { /* Use only this context's unexpired verified-choice hint below. */ }
  const remembered = syncState(browser).visits.get(normalized);
  // A quota failure may leave a readable but older stored record, even in the
  // same millisecond. Prefer the latest known choice in that context; a valid,
  // strictly newer stored choice still wins. Equal-time conflicts fail closed
  // against the local choice instead of selecting an arbitrary random UUID.
  if (validVisit(remembered, normalized, now)
      && (!validVisit(value, normalized, now) || value.createdAt <= remembered.createdAt)) return remembered;
  return validVisit(value, normalized, now) ? value : null;
}
function currentVisit(email, browser, now = Date.now()) {
  const visit = latestVisit(email, browser, now);
  return visit && visit.confirmed !== true ? visit : null;
}
function clearVisit(visit, browser) {
  if (latestVisit(visit.email, browser)?.id !== visit.id) return;
  // Retain the last explicit choice briefly, even after its exact ACK. An
  // aborted older request may still finish on the server; a later GET that
  // disagrees must block checkout, not silently accept that older choice.
  const confirmed = { ...visit, confirmed: true };
  syncState(browser).visits.set(visit.email, confirmed);
  try {
    const raw = browser?.sessionStorage?.getItem(key);
    const stored = typeof raw === 'string' && raw.length <= 2048 ? JSON.parse(raw) : null;
    // The single stored slot may now belong to another owner or choice.
    // Confirm this context's ACK without replacing that newer stored marker.
    if (stored?.email === visit.email && stored?.id === visit.id)
      browser.sessionStorage.setItem(key, JSON.stringify(confirmed));
  } catch { /* An exact ACK still confirms memory; unknown storage is untouched. */ }
}
const matches = (result, visit) => result.positioned || result.ref === visit.ref;

async function postVisit(visit, { browser = browserDefault(), fetchImpl = fetch } = {}) {
  const state = syncState(browser), { writes, owners } = state;
  const flight = `${visit.email}:${visit.id}`;
  if (writes.has(flight)) return writes.get(flight);
  state.revision++;
  const send = async () => {
    const deadline = browserRequestDeadline(undefined, REFERRAL_REQUEST_TIMEOUT_MS);
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
  };
  // Only one save for this owner may be in flight in this browser context.
  // Queue explicit newer choices; reads never create or replay a save.
  const previous = owners.get(visit.email);
  const completion = previous ? previous.then(send) : send();
  writes.set(flight, completion);
  owners.set(visit.email, completion);
  try { return await completion; } finally {
    if (writes.get(flight) === completion) { writes.delete(flight); state.revision++; }
    if (owners.get(visit.email) === completion) owners.delete(visit.email);
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
        const deadline = browserRequestDeadline(undefined, REFERRAL_REQUEST_TIMEOUT_MS);
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
        const choice = latestVisit(normalized, browser);
        if (choice && !matches(body, choice)) {
          // A GET must never overwrite another document's stored choice. Keep
          // the discrepancy pending only in this context; a later document
          // independently compares its retained short-lived choice again.
          state.visits.set(normalized, { ...choice, confirmed: false });
        }
        else if (choice) clearVisit(choice, browser);
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
  return { ok: true, code: result.ref, email: result.ref ? normalizeReferralEmail(email) : '' };
}
