const key = 'mindbliss:wallet-setup-after-auth:v1';
const lifetimeMs = 120_000;
const fields = ['createdAt', 'email', 'version'];

/** @typedef {{sessionStorage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>}} SetupBrowser */
/** @param {unknown} value */
function emailFor(value) {
  if (typeof value !== 'string') return '';
  const email = value.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}
/** @param {unknown} value */
const validTime = value => typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
/** @param {SetupBrowser | null | undefined} browser */
function storageFor(browser) {
  try {
    const target = browser === undefined ? typeof window === 'undefined' ? null : window : browser;
    const storage = target?.sessionStorage;
    return storage && ['getItem', 'setItem', 'removeItem'].every(name => typeof storage[name] === 'function') ? storage : null;
  } catch { return null; }
}

/**
 * Short-lived same-tab UI intent, written only after canonical authentication.
 * Never a credential, wallet address, signature or ownership proof.
 * @param {unknown} email
 * @param {SetupBrowser | null} [browser]
 * @param {number} [now]
 */
export function rememberWalletSetupAfterAuth(email, browser = undefined, now = Date.now()) {
  const storage = storageFor(browser);
  if (!storage) return false;
  try {
    storage.removeItem(key);
    const normalized = emailFor(email);
    if (!normalized || !validTime(now)) return false;
    const raw = JSON.stringify({ version: 1, email: normalized, createdAt: now });
    storage.setItem(key, raw);
    return storage.getItem(key) === raw;
  } catch { return false; }
}

/**
 * Match an authenticated dashboard projection before consuming this UI intent.
 * Missing session data leaves it untouched. Initialized reads remove it first.
 * @param {unknown} session
 * @param {SetupBrowser | null} [browser]
 * @param {number} [now]
 */
export function consumeWalletSetupAfterAuth(session, browser = undefined, now = Date.now()) {
  if (!session || typeof session !== 'object' || Array.isArray(session)) return null;
  let email, subject;
  try {
    const identity = /** @type {{email?: unknown, subject?: unknown}} */ (session);
    email = emailFor(identity.email); subject = identity.subject;
    if (!email || typeof subject !== 'string' || !subject || subject.length > 256
      || subject !== subject.trim() || /[\u0000-\u001f\u007f]/.test(subject)) return null;
  } catch { return null; }
  const storage = storageFor(browser);
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    if (raw === null) return null;
    storage.removeItem(key);
    if (storage.getItem(key) !== null) return null;
    if (typeof raw !== 'string' || raw.length > 1024 || !validTime(now)) return null;
    const hint = JSON.parse(raw);
    if (!hint || typeof hint !== 'object' || Array.isArray(hint)
      || Object.keys(hint).sort().join(',') !== fields.join(',') || hint.version !== 1
      || hint.email !== email || emailFor(hint.email) !== hint.email || !validTime(hint.createdAt)
      || hint.createdAt > now || now - hint.createdAt >= lifetimeMs) return null;
    return Object.freeze({ email, subject, ownerKey: JSON.stringify([subject, email]) });
  } catch { return null; }
}
