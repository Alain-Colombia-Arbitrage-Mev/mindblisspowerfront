import { browserRequestDeadline } from './browser-request-deadline.mjs';
import { ADMINISTRATIVE_SIGNING_PATH as signing, ADMINISTRATIVE_TRANSFERS_PATH as transfers, administrativeAddress,
  administrativeSignerCapabilities, administrativeSignerStatus, administrativeSignerChallenge, administrativeSignerVerification,
  administrativeTransferInput, administrativeTransferDraft, administrativeTransferHistory, administrativeTransferSnapshot } from './administrative-signing-contract.mjs';

async function request(path, { signal = undefined, body = undefined } = {}) {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  const deadline = browserRequestDeadline(signal, 25_000);
  try {
    const response = await fetch(path, { method: body === undefined ? 'GET' : 'POST', ...(body === undefined ? {} : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
      signal: deadline.signal, credentials: 'same-origin', cache: 'no-store', redirect: 'error' });
    const text = await response.text();
    if (deadline.signal.aborted) throw new DOMException('Aborted', 'AbortError');
    if (text.length > 131072) throw Error('administrative_signing_unavailable');
    let value; try { value = JSON.parse(text); } catch { throw Error('administrative_signing_unavailable'); }
    if (!response.ok) throw Object.assign(Error(typeof value?.error === 'string' && /^[a-z0-9_]{1,80}$/.test(value.error) ? value.error : 'administrative_signing_unavailable'), { status: response.status });
    return value;
  } finally { deadline.dispose(); }
}
const check = value => { if (!value) throw Error('administrative_signing_unavailable'); return value; };
const expected = (value, address) => check(value && administrativeAddress(address) && value.assignedAddress === address.toLowerCase() ? value : null);

export async function readAdministrativeSignerCapabilities({ signal = undefined } = {}) {
  return check(administrativeSignerCapabilities(await request(`${signing}/capabilities`, { signal })));
}
export async function readAdministrativeSignerStatus(expectedAddress, { signal = undefined } = {}) {
  if (!administrativeAddress(expectedAddress)) throw Error('invalid_request');
  return expected(administrativeSignerStatus(await request(`${signing}/status`, { signal })), expectedAddress);
}
export async function createAdministrativeSignerChallenge(expectedAddress, { signal = undefined } = {}) {
  if (!administrativeAddress(expectedAddress)) throw Error('invalid_request');
  return check(administrativeSignerChallenge(await request(`${signing}/challenge`, { signal, body: {} }), expectedAddress));
}
export async function verifyAdministrativeSigner(input, expectedAddress, { signal = undefined } = {}) {
  const body = administrativeSignerVerification(input);
  if (!body || !administrativeAddress(expectedAddress)) throw Error('invalid_request');
  const safe = expected(administrativeSignerStatus(await request(`${signing}/verify`, { signal, body })), expectedAddress);
  if (!safe.verified) throw Error('administrative_signature_invalid');
  return safe;
}

export async function verifyAdministrativeDraftHash(draft) {
  const snapshot = administrativeTransferSnapshot(draft);
  if (!snapshot) return false;
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(snapshot));
  return Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, '0')).join('') === draft.preparationHash;
}

export async function prepareAdministrativeTransfer(input, expectedAddress, { signal = undefined } = {}) {
  const body = administrativeTransferInput(input);
  if (!body || !administrativeAddress(expectedAddress) || body.recipient === expectedAddress.toLowerCase()) throw Error('invalid_request');
  const safe = check(administrativeTransferDraft(await request(`${transfers}/prepare`, { signal, body })));
  if (safe.draftReference !== body.requestId || safe.source.address !== expectedAddress.toLowerCase() || safe.recipient !== body.recipient
    || safe.amount !== body.amount || !await verifyAdministrativeDraftHash(safe)) throw Error('administrative_signing_unavailable');
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  return safe;
}
export async function readAdministrativeTransferHistory(expectedAddress, { signal = undefined } = {}) {
  if (!administrativeAddress(expectedAddress)) throw Error('invalid_request');
  const safe = check(administrativeTransferHistory(await request(`${transfers}/history`, { signal })));
  if (safe.records.some(record => record.source.address !== expectedAddress.toLowerCase()) || !(await Promise.all(safe.records.map(verifyAdministrativeDraftHash))).every(Boolean)) throw Error('administrative_signing_unavailable');
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  return safe;
}
