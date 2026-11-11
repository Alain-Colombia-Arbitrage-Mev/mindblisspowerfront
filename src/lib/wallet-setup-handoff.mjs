const key = 'mindbliss:wallet-setup-after-auth:v1';
const pendingKey = 'mindbliss:wallet-setup-pending:v1';
const lifetimeMs = 120_000;
const fields = ['createdAt', 'email', 'version'];
const pendingFields = ['createdAt', 'email', 'subject', 'version'];

/** @typedef {{sessionStorage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>}} SetupBrowser */
/** @param {unknown} value */
function emailFor(value) {
  if (typeof value !== 'string') return '';
  const email = value.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}
/** @param {unknown} value */
const validTime = value => typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
/** @param {unknown} session */
function identityFor(session) {
  if (!session || typeof session !== 'object' || Array.isArray(session)) return null;
  try {
    const identity = /** @type {{email?: unknown, subject?: unknown}} */ (session);
    const email = emailFor(identity.email), subject = identity.subject;
    return email && typeof subject === 'string' && subject && subject.length <= 256
      && subject === subject.trim() && !/[\u0000-\u001f\u007f]/.test(subject) ? { email, subject } : null;
  } catch { return null; }
}
const requestFor = (identity, createdAt) => Object.freeze({ ...identity,
  ownerKey: JSON.stringify([identity.subject, identity.email]), createdAt });
function parseHint(raw, expectedFields, now) {
  if (typeof raw !== 'string' || raw.length > 1024 || !validTime(now)) return null;
  const hint = JSON.parse(raw);
  return hint && typeof hint === 'object' && !Array.isArray(hint)
    && Object.keys(hint).sort().join(',') === expectedFields.join(',') && hint.version === 1
    && emailFor(hint.email) === hint.email && validTime(hint.createdAt)
    && hint.createdAt <= now && now - hint.createdAt < lifetimeMs ? hint : null;
}
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
    storage.removeItem(pendingKey);
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
  const identity = identityFor(session);
  if (!identity) return null;
  const storage = storageFor(browser);
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    if (raw === null) return null;
    storage.removeItem(key);
    if (storage.getItem(key) !== null) return null;
    const hint = parseHint(raw, fields, now);
    if (!hint || hint.email !== identity.email) return null;
    // Only a pending UI intention survives reload. Its expiry is inherited from
    // the original OTP handoff, and every mount must recheck the server binding.
    try { storage.setItem(pendingKey, JSON.stringify({ version: 1, ...identity, createdAt: hint.createdAt })); }
    catch { /* Storage failures must not prevent this authenticated UI handoff. */ }
    return requestFor(identity, hint.createdAt);
  } catch { return null; }
}

/** Resume unfinished setup in this tab, never extend its original lifetime.
 * This is not authentication or wallet ownership; the caller still needs a
 * complete authenticated projection and an authoritative unlinked response.
 * @param {unknown} session
 * @param {SetupBrowser | null} [browser]
 * @param {number} [now]
 */
export function resumeWalletSetupAfterAuth(session, browser = undefined, now = Date.now()) {
  const identity = identityFor(session), storage = storageFor(browser);
  if (!identity || !storage) return null;
  try {
    const raw = storage.getItem(pendingKey);
    if (raw === null) return null;
    let hint;
    try { hint = parseHint(raw, pendingFields, now); } catch { /* Invalid UI records are discarded below. */ }
    if (!hint || hint.email !== identity.email || hint.subject !== identity.subject) {
      storage.removeItem(pendingKey); return null;
    }
    return requestFor(identity, hint.createdAt);
  } catch { return null; }
}

/** Finish only the matching pending generation; stale owners/completions cannot
 * dismiss a newer user's setup. No credential or wallet state is changed.
 * @param {{ownerKey?: string, createdAt?: number} | null} request
 * @param {SetupBrowser | null} [browser]
 */
export function clearWalletSetupAfterAuth(request, browser = undefined) {
  const storage = storageFor(browser);
  if (!request || !storage) return false;
  try {
    const raw = storage.getItem(pendingKey);
    if (typeof raw !== 'string' || raw.length > 1024) return false;
    const hint = JSON.parse(raw), identity = identityFor(hint);
    if (!identity || Object.keys(hint).sort().join(',') !== pendingFields.join(',') || hint.version !== 1
      || !validTime(hint.createdAt) || hint.createdAt !== request.createdAt
      || JSON.stringify([identity.subject, identity.email]) !== request.ownerKey) return false;
    storage.removeItem(pendingKey);
    return storage.getItem(pendingKey) === null;
  } catch { return false; }
}
