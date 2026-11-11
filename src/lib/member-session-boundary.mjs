import { browserRequestDeadline } from './browser-request-deadline.mjs';

const email = value => typeof value === 'string' ? value.trim().toLowerCase() : '';
const subject = value => typeof value === 'string' && value.length > 0 && value.length <= 256
  && value === value.trim() && !/[\u0000-\u001f\u007f]/.test(value);

export function memberSessionOwnerKey(owner) {
  const recipient = email(owner?.email);
  return recipient.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient) && subject(owner?.subject)
    ? JSON.stringify([owner.subject, recipient]) : '';
}

/** One bounded, same-origin access proof for a restored private document.
 * A changed owner must load a new document; an outage never reveals old data.
 * @param {{email: string, subject: string}} owner
 * @param {{mode?: string, fetchImpl?: typeof fetch, signal?: AbortSignal, timeoutMs?: number}} [options]
 */
export async function checkMemberSessionOwner(owner, { mode = 'better-auth', fetchImpl = fetch, signal, timeoutMs = 8_000 } = {}) {
  const expected = memberSessionOwnerKey(owner);
  if (!expected || !['better-auth', 'cognito'].includes(mode)) return 'signed-out';
  if (signal?.aborted) return 'cancelled';
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > 8_000) throw new TypeError('invalid_session_check_deadline');
  const deadline = browserRequestDeadline(signal, timeoutMs);
  /** @type {ReadableStreamDefaultReader<Uint8Array> | undefined} */
  let reader;
  let response, rejectAbort;
  const cancel = () => { try { void (reader ? reader.cancel() : response?.body?.cancel())?.catch(() => {}); } catch { /* best effort */ } };
  const abort = () => { cancel(); rejectAbort?.(new DOMException('Session check cancelled', 'AbortError')); };
  const cancellation = new Promise((_resolve, reject) => { rejectAbort = reject; });
  deadline.signal.addEventListener('abort', abort, { once: true });
  if (deadline.signal.aborted) abort();
  const read = async () => {
    response = await fetchImpl('/api/auth/session?view=access', { method: 'GET', credentials: 'same-origin', cache: 'no-store',
      redirect: 'error', signal: deadline.signal, headers: { Accept: 'application/json' } });
    if (deadline.signal.aborted) { cancel(); return 'cancelled'; }
    if ([401, 403].includes(response.status)) return 'signed-out';
    if (response.status !== 200 || response.redirected
      || !/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type') || '')) return 'unavailable';
    reader = response.body?.getReader();
    if (!reader) return 'unavailable';
    const decoder = new TextDecoder('utf-8', { fatal: true });
    let raw = '', bytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (deadline.signal.aborted) return 'cancelled';
      if (done) break;
      if (!(value instanceof Uint8Array) || (bytes += value.byteLength) > 32_768) return 'unavailable';
      raw += decoder.decode(value, { stream: true });
    }
    raw += decoder.decode();
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || Array.isArray(data)) return 'unavailable';
    if (data.authenticated === false) return 'signed-out';
    if (data.authenticated !== true || data.mode !== mode || Object.hasOwn(data, 'error') || Object.hasOwn(data, 'code')) return 'unavailable';
    const actual = memberSessionOwnerKey(data);
    if (!actual) return 'unavailable';
    return actual === expected ? 'same-owner' : 'changed-owner';
  };
  try { return await Promise.race([read(), cancellation]); }
  catch { return signal?.aborted ? 'cancelled' : 'unavailable'; }
  finally {
    deadline.dispose(); deadline.signal.removeEventListener('abort', abort); cancel();
    try { reader?.releaseLock(); } catch { /* Non-cooperative readers cannot delay the UI. */ }
  }
}
