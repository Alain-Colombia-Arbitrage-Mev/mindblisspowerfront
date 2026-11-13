const object = value => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const profileFields = ['first_name', 'last_name', 'phone', 'country', 'payout_wallet_usdc'];
const fieldLimits = { name: 240, first_name: 120, last_name: 120, phone: 32, country: 120, payout_wallet_usdc: 42 };
const readonlyFields = { sponsor_name: 480, sponsor_referral_code: 128, referral_code: 128 };
// ASCII controls are rejected as hostile profile input, not interpreted as syntax.
// eslint-disable-next-line no-control-regex
const profileControls = /[\u0000-\u001f\u007f]/;

/** A stale-view fence only. Authorization always uses the native session user. */
export function profileSubjectHeader(subject) {
  if (typeof subject !== 'string' || !subject || subject.length > 255 || subject !== subject.trim() || profileControls.test(subject)) return '';
  try { const encoded = encodeURIComponent(subject); return encoded.length <= 1024 ? encoded : ''; } catch { return ''; }
}

export function profileSubjectFromHeader(encoded) {
  if (typeof encoded !== 'string' || !encoded || encoded.length > 1024) return '';
  try { const subject = decodeURIComponent(encoded); return profileSubjectHeader(subject) === encoded ? subject : ''; } catch { return ''; }
}

// Preserve field presence: sending only a legal name must never clear the wallet.
export function memberProfilePatch(body) {
  if (!object(body) || body.error) return null;
  const patch = {};
  for (const [key, maximum] of Object.entries(fieldLimits)) {
    if (!Object.hasOwn(body, key)) continue;
    if (typeof body[key] !== 'string' || body[key].length > maximum || profileControls.test(body[key])) return null;
    patch[key] = body[key].trim();
  }
  if (!Object.keys(patch).length) return null;
  if (patch.payout_wallet_usdc && !/^0x[a-fA-F0-9]{40}$/.test(patch.payout_wallet_usdc)) return null;
  return patch;
}

export function validMemberProfile(data) {
  return object(data) && !data.error && profileFields.every(key => typeof data[key] === 'string')
    && Object.entries(readonlyFields).every(([key, limit]) => !Object.hasOwn(data, key) || (typeof data[key] === 'string' && data[key].length <= limit));
}

export function validNativeMemberProfile(data) {
  return validMemberProfile(data) && Object.keys(readonlyFields).every(key => typeof data[key] === 'string')
    && Object.entries({ first_name: 240, last_name: 240, phone: 64, country: 120, payout_wallet_usdc: 128 }).every(([key, limit]) => data[key].length <= limit);
}

export function validMemberProfileUpdate(data) {
  return object(data) && !data.error && data.ok === true && validMemberProfile(data.profile);
}

const cleanName = value => value.normalize('NFC').trim().replace(/\s+/g, ' ');

/** Only self-declared contact fields; identity and wallet fields are never writable here. */
export function nativeMemberProfilePatch(body) {
  if (!object(body) || !Object.hasOwn(body, 'name') || !Object.hasOwn(body, 'phone')
    || Object.keys(body).some(key => !['name', 'phone', 'country'].includes(key)) || typeof body.name !== 'string' || typeof body.phone !== 'string') return null;
  const name = cleanName(body.name), phone = body.phone.trim();
  if (!name || name.length > 160 || !/^[\p{L}\p{M} .’'-]+$/u.test(name) || !/\p{L}/u.test(name) || profileControls.test(body.name)
    || (phone !== '' && !/^\+[1-9][0-9]{6,14}$/.test(phone))) return null;
  /** @type {{name: string, phone: string, country?: string}} */
  const patch = { name, phone };
  if (Object.hasOwn(body, 'country')) {
    if (typeof body.country !== 'string' || !/^(?:[A-Z]{2})?$/.test(body.country)) return null;
    patch.country = body.country;
  }
  return patch;
}

/** A successful HTTP response must acknowledge the fields actually submitted. */
export function memberProfileUpdateMatches(data, requested) {
  const patch = memberProfilePatch(requested);
  if (!validMemberProfileUpdate(data) || !patch) return false;
  const saved = data.profile;
  for (const [key, value] of Object.entries(patch)) {
    if (key === 'name') {
      if (!Object.hasOwn(patch, 'first_name') && !Object.hasOwn(patch, 'last_name')
        && cleanName([saved.first_name, saved.last_name].filter(Boolean).join(' ')) !== cleanName(value)) return false;
    } else if (key === 'payout_wallet_usdc') {
      if (saved[key].toLowerCase() !== value.toLowerCase()) return false;
    } else if (saved[key] !== value) return false;
  }
  return true;
}

// Bound both the incoming patch and the upstream JSON; do not accept truncated
// JSON as a successful write. A deadline cancels a stalled body, too.
export async function readMemberProfileJson(body, signal, limit = 16384) {
  const reader = body?.getReader();
  if (!reader) throw new Error('invalid_json');
  const cancel = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener('abort', cancel, { once: true });
  try {
    if (signal.aborted) { await reader.cancel().catch(() => {}); throw new Error('request_cancelled'); }
    const chunks = []; let total = 0;
    while (true) {
      if (signal.aborted) throw new Error('request_cancelled');
      const { value, done } = await reader.read();
      if (signal.aborted) throw new Error('request_cancelled');
      if (done) break;
      total += value.byteLength;
      if (total > limit) { await reader.cancel(); throw new RangeError('body_too_large'); }
      chunks.push(value);
    }
    const data = new Uint8Array(total); let offset = 0;
    for (const chunk of chunks) { data.set(chunk, offset); offset += chunk.byteLength; }
    const parsed = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(data));
    if (!object(parsed)) throw new Error('invalid_json');
    return parsed;
  } finally { signal.removeEventListener('abort', cancel); reader.releaseLock(); }
}
