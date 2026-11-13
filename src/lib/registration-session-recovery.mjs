import { browserRequestDeadline } from './browser-request-deadline.mjs';

const normalizeEmail = value => typeof value === 'string' ? value.trim().toLowerCase() : '';
const validEmail = value => value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const validSubject = value => typeof value === 'string' && value.length > 0 && value.length <= 256
  && value === value.trim() && !/[\u0000-\u001f\u007f]/.test(value);

/** A lost acknowledgement or a consumed code may follow a completed signup.
 * A recovery read never validates that code or requests another one. */
export function registrationSessionRecoveryEligible(status, code) {
  return Number.isInteger(status) && ((status >= 200 && status < 300)
    || (status >= 500 && status < 600)
    || ([400, 403, 422].includes(status) && code === 'INVALID_OTP'));
}

/** Only the BFF's closed native-verified-but-no-session result may retire the
 * consumed registration form. It never authenticates or opens the dashboard. */
export function registrationVerifiedWithoutSession(status, payload) {
  return status === 503 && payload !== null && typeof payload === 'object' && !Array.isArray(payload)
    && Object.keys(payload).sort().join(',') === 'code,emailVerified,error,needsLogin'
    && payload.code === 'REGISTRATION_SESSION_UNAVAILABLE' && payload.emailVerified === true && payload.needsLogin === true
    && typeof payload.error === 'string' && payload.error.length > 0 && payload.error.length <= 512;
}

/** Reconcile only the CURRENT browser's already authenticated account. The
 * endpoint checks native session/JWT expiry and canonical member access; this
 * helper never looks up an email, grants access, mints a session or stores a
 * credential. One deadline covers fetch and bounded body reads, including a
 * non-cooperative transport that ignores AbortSignal.
 * @param {unknown} expectedEmail
 * @param {{fetchImpl?: typeof fetch, signal?: AbortSignal, timeoutMs?: number}} [options]
 */
export async function recoverRegistrationSession(expectedEmail, { fetchImpl = fetch, signal, timeoutMs = 8_000 } = {}) {
  const email = normalizeEmail(expectedEmail);
  if (!validEmail(email) || signal?.aborted) return null;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > 8_000) throw new TypeError('invalid_registration_recovery_deadline');
  const deadline = browserRequestDeadline(signal, timeoutMs);
  /** @type {ReadableStreamDefaultReader<Uint8Array> | undefined} */
  let reader;
  /** @type {Response | undefined} */
  let response;
  let rejectAbort;
  const cancelBody = () => {
    try { void (reader ? reader.cancel() : response?.body?.cancel())?.catch(() => {}); } catch { /* Cleanup cannot delay recovery. */ }
  };
  const aborted = () => {
    cancelBody();
    rejectAbort?.(new DOMException('Registration recovery cancelled', 'AbortError'));
  };
  const cancellation = new Promise((_resolve, reject) => { rejectAbort = reject; });
  deadline.signal.addEventListener('abort', aborted, { once: true });
  if (deadline.signal.aborted) aborted();
  const read = async () => {
    if (deadline.signal.aborted) return null;
    response = await fetchImpl('/api/auth/session?view=access', {
      method: 'GET', credentials: 'same-origin', cache: 'no-store', redirect: 'error', signal: deadline.signal,
      headers: { Accept: 'application/json' },
    });
    if (deadline.signal.aborted) { cancelBody(); return null; }
    if (response.status !== 200 || response.redirected
      || !/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type') || '')) return null;
    reader = response.body?.getReader();
    if (!reader) return null;
    const decoder = new TextDecoder('utf-8', { fatal: true });
    let raw = '', bytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (deadline.signal.aborted) return null;
      if (done) break;
      if (!(value instanceof Uint8Array) || (bytes += value.byteLength) > 32_768) return null;
      raw += decoder.decode(value, { stream: true });
    }
    raw += decoder.decode();
    const identity = JSON.parse(raw);
    if (!identity || typeof identity !== 'object' || Array.isArray(identity)
      || Object.hasOwn(identity, 'error') || Object.hasOwn(identity, 'code')
      || identity.authenticated !== true || identity.mode !== 'better-auth'
      || normalizeEmail(identity.email) !== email || !validSubject(identity.subject)
      || deadline.signal.aborted) return null;
    return Object.freeze({ email, subject: identity.subject });
  };
  try { return await Promise.race([read(), cancellation]); }
  catch { return null; }
  finally {
    deadline.dispose(); deadline.signal.removeEventListener('abort', aborted);
    cancelBody();
    try { reader?.releaseLock(); } catch { /* A non-cooperative body may still hold its reader. */ }
  }
}
