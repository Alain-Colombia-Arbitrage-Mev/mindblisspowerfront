import { memberSessionOwnerKey } from './member-session-boundary.mjs';
import { profileSubjectHeader } from './member-profile.mjs';
import { readMemberJson, validMemberReferral } from './member-read.mjs';
import { referralLinkCode } from './referral-links.mjs';

const entries = new Map(), lifetime = 30_000, maximumOwners = 128;
export function cachedMemberReferral(owner) { return entries.get(memberSessionOwnerKey(owner))?.data || null; }

export function clearMemberReferralCache() {
  for (const entry of entries.values()) entry.controller?.abort();
  entries.clear();
}

export function invalidateMemberReferral(owner) {
  const entry = entries.get(memberSessionOwnerKey(owner));
  if (entry) entry.at = 0;
}

/** A permanent server-issued code is cached only for its canonical subject/email.
 * In-flight reads coalesce; a failed read never becomes a successful cache entry.
 * This resource never writes attribution or creates an invitation from a hint.
 * @param {{subject?: string, email?: string}} owner
 * @param {{refresh?: boolean, signal?: AbortSignal, fetchImpl?: typeof fetch}} [options]
 */
export async function readMemberReferral(owner, { refresh = false, signal, fetchImpl = globalThis.fetch } = {}) {
  const key = memberSessionOwnerKey(owner), subject = profileSubjectHeader(owner?.subject);
  if (!key || !subject) throw Object.assign(new Error('referral_owner_required'), { status: 401 });
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  let entry = entries.get(key);
  if (!entry) {
    entry = { data: null, at: 0, pending: null, controller: null };
    entries.set(key, entry);
    if (entries.size > maximumOwners) {
      const oldest = entries.keys().next().value;
      entries.get(oldest)?.controller?.abort(); entries.delete(oldest);
    }
  }
  if (!refresh && entry.data && Date.now() - entry.at < lifetime) return entry.data;
  if (!entry.pending) {
    const controller = entry.controller = new AbortController();
    const current = entry;
    current.pending = readMemberJson('/api/member/referral', { signal: controller.signal, timeoutMs: 25_000,
      validate: data => validMemberReferral(data) && Boolean(referralLinkCode(data.code)),
      fetchImpl: (url, init) => fetchImpl(url, { ...init, credentials: 'same-origin', redirect: 'error', headers: { 'x-mindbliss-referral-subject': subject } }) })
      .then(data => {
        if (controller.signal.aborted || entries.get(key) !== current) throw new DOMException('Aborted', 'AbortError');
        if (!controller.signal.aborted && entries.get(key) === current) { current.data = data; current.at = Date.now(); }
        return data;
      }).catch(error => {
        if ([401, 403, 409].includes(error?.status) && entries.get(key) === current) entries.delete(key);
        throw error;
      }).finally(() => { if (current.controller === controller) { current.pending = null; current.controller = null; } });
  }
  // One component leaving does not abort the same owner's shared read. Its own
  // listener is cancelled immediately; logout/replacement cancels the resource.
  if (!signal) return entry.pending;
  const pending = entry.pending;
  return new Promise((resolve, reject) => {
    const abort = () => { signal.removeEventListener('abort', abort); reject(new DOMException('Aborted', 'AbortError')); };
    signal.addEventListener('abort', abort, { once: true });
    pending.then(value => { signal.removeEventListener('abort', abort); if (!signal.aborted) resolve(value); },
      error => { signal.removeEventListener('abort', abort); if (!signal.aborted) reject(error); });
    if (signal.aborted) abort();
  });
}
