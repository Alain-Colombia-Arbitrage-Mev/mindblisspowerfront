const object = value => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const profileFields = ['first_name', 'last_name', 'phone', 'country', 'payout_wallet_usdc'];
const fieldLimits = { name: 240, first_name: 120, last_name: 120, phone: 32, country: 120, payout_wallet_usdc: 42 };

// Preserve field presence: sending only a legal name must never clear the wallet.
export function memberProfilePatch(body) {
  if (!object(body) || body.error) return null;
  const patch = {};
  for (const [key, maximum] of Object.entries(fieldLimits)) {
    if (!Object.hasOwn(body, key)) continue;
    if (typeof body[key] !== 'string' || body[key].length > maximum || /[\u0000-\u001f\u007f]/.test(body[key])) return null;
    patch[key] = body[key].trim();
  }
  if (!Object.keys(patch).length) return null;
  if (patch.payout_wallet_usdc && !/^0x[a-fA-F0-9]{40}$/.test(patch.payout_wallet_usdc)) return null;
  return patch;
}

export function validMemberProfile(data) {
  return object(data) && !data.error && profileFields.every(key => typeof data[key] === 'string');
}

export function validMemberProfileUpdate(data) {
  return object(data) && !data.error && data.ok === true && validMemberProfile(data.profile);
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
