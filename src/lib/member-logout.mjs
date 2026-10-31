const unavailable = 'No pudimos confirmar el cierre de sesión. Intenta de nuevo.';
let pending = null;
/** @type {Array<['localStorage' | 'sessionStorage', string[]]>} */
const memberStorageKeys = [
  ['localStorage', ['user_auth', 'user_id', 'user_status', 'onboarding_step', 'user_data', 'user_role', 'vp_onboarding', 'vicion_session']],
  ['sessionStorage', ['vicion_session']],
];

// These are presentation caches from the previous member UI, never proof of a
// Better Auth session. Do not clear unrelated admin, saved-account or theme data.
export function clearMemberBrowserState(browser = globalThis.window) {
  for (const [storage, keys] of memberStorageKeys) {
    for (const key of keys) {
      try { browser?.[storage]?.removeItem(key); } catch { /* Storage may be unavailable; the hard navigation still discards memory. */ }
    }
  }
}

async function confirmation(response, signal) {
  if (response.status !== 200 || !/^application\/json(?:;|$)/i.test(response.headers.get('content-type') || '')) {
    void response.body?.cancel().catch(() => {});
    throw new Error(unavailable);
  }
  const reader = response.body?.getReader();
  if (!reader) throw new Error(unavailable);
  const chunks = [];let bytes = 0;
  const abort = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener('abort', abort, { once: true });
  try {
    if (signal.aborted) throw new Error(unavailable);
    while (true) {
      const { done, value } = await reader.read();
      if (signal.aborted) throw new Error(unavailable);
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 1024) { await reader.cancel(); throw new Error(unavailable); }
      chunks.push(value);
    }
    const body = new Uint8Array(bytes);let offset = 0;
    for (const chunk of chunks) { body.set(chunk, offset);offset += chunk.byteLength; }
    const value = JSON.parse(new TextDecoder().decode(body));
    if (!value || value.ok !== true || Object.keys(value).length !== 1) throw new Error(unavailable);
  } finally { signal.removeEventListener('abort', abort);reader.releaseLock(); }
}

/** One same-origin POST for all mounted shell buttons; never retry a mutation.
 * @param {{fetchImpl?: typeof fetch, clearCaches?: () => void, navigate?: (path: string) => void}} [options] */
export function logoutMember({ fetchImpl = globalThis.fetch, clearCaches = clearMemberBrowserState,
  navigate = path => globalThis.window.location.replace(path) } = {}) {
  if (pending) return pending;
  pending = (async () => {
    const signal = AbortSignal.timeout(12000);
    const response = await fetchImpl('/api/auth/logout', {
      method: 'POST', credentials: 'same-origin', cache: 'no-store', redirect: 'error', signal,
      headers: { 'content-type': 'application/json' }, body: '{}',
    });
    await confirmation(response, signal);
    // Cookie revocation is owned by the server. Only a validated acknowledgement
    // permits clearing local presentation data and replacing the whole document,
    // which also discards the Router Cache and mounted member resources.
    try { clearCaches(); } catch { /* An optional local cache cannot prevent leaving a revoked session. */ }
    navigate('/login');
  })().catch(() => { throw new Error(unavailable); }).finally(() => { pending = null; });
  return pending;
}
