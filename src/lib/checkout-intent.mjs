const prefix = 'vp:checkout-intent:v1:production:NOW:';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function keyFor(subject, packageId) {
  if (typeof subject !== 'string' || !/^[A-Za-z0-9_-]{8,128}$/.test(subject)
      || !['string', 'number'].includes(typeof packageId) || !Number.isSafeInteger(Number(packageId))
      || !/^[1-9]\d{0,15}$/.test(String(packageId))) throw new Error('checkout_intent_unavailable');
  return `${prefix}${encodeURIComponent(subject)}:${packageId}`;
}

// A tab keeps only an opaque request UUID, never credentials, contact data or
// payment URLs. An uncertain request must survive reloads without becoming a
// second invoice; only an explicit new-purchase action may discard it.
export function readCheckoutIntent(storage, subject, packageId) {
  const value = storage.getItem(keyFor(subject, packageId));
  if (value === null) return null;
  if (!uuid.test(value)) throw new Error('checkout_intent_unavailable');
  return value;
}

export function getOrCreateCheckoutIntent(storage, subject, packageId, randomUUID) {
  const existing = readCheckoutIntent(storage, subject, packageId);
  if (existing) return existing;
  const value = randomUUID();
  if (typeof value !== 'string' || !uuid.test(value)) throw new Error('checkout_intent_unavailable');
  storage.setItem(keyFor(subject, packageId), value);
  if (readCheckoutIntent(storage, subject, packageId) !== value) throw new Error('checkout_intent_unavailable');
  return value;
}

export function clearCheckoutIntent(storage, subject, packageId) {
  storage.removeItem(keyFor(subject, packageId));
  if (readCheckoutIntent(storage, subject, packageId) !== null) throw new Error('checkout_intent_unavailable');
}
