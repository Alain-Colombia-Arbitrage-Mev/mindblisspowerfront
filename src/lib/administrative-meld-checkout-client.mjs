import { browserRequestDeadline } from './browser-request-deadline.mjs';
import { ADMINISTRATIVE_MELD_CHECKOUT_PATH as path, MELD_CHECKOUT_REFERENCE, meldCheckoutInput, meldCheckoutCapabilities,
  meldCheckoutAcknowledgement, meldCheckoutDestination, meldCheckoutStatus, meldCheckoutHistory } from './administrative-meld-checkout-contract.mjs';

async function request(target, init) {
  if (init.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  const deadline = browserRequestDeadline(init.signal, 25_000);
  try {
    const response = await fetch(target, { ...init, signal: deadline.signal, credentials: 'same-origin', cache: 'no-store', redirect: 'error' });
    const text = await response.text();
    if (text.length > 65536) throw Error('meld_checkout_unavailable');
    let value;
    try { value = JSON.parse(text); } catch { throw Error('meld_checkout_unavailable'); }
    if (!response.ok) throw Object.assign(Error(typeof value?.error === 'string' && /^[a-z0-9_]{1,80}$/.test(value.error) ? value.error : 'meld_checkout_unavailable'), { status: response.status });
    if (deadline.signal.aborted) throw new DOMException('Aborted', 'AbortError');
    return value;
  } finally { deadline.dispose(); }
}

/** Read-only feature discovery; it never mints a link or calls a provider. */
export async function readAdministrativeMeldCheckoutCapabilities({ signal = undefined } = {}) {
  const safe = meldCheckoutCapabilities(await request(`${path}/capabilities`, { method: 'GET', signal }));
  if (!safe) throw Error('meld_checkout_unavailable');
  return safe;
}

export async function createAdministrativeMeldCheckout(input, { signal = undefined } = {}) {
  const body = meldCheckoutInput(input);
  if (!body) throw Error('invalid_request');
  const safe = meldCheckoutAcknowledgement(await request(path, { method: 'POST', signal, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }));
  if (!safe || safe.checkoutReference !== body.requestId || safe.country !== body.country || safe.sourceCurrencyCode !== body.sourceCurrencyCode || safe.requestedAmount !== body.amount) throw Error('meld_checkout_unavailable');
  return safe;
}

/** The assigned address is an expected response value, never a browser request field. */
export async function startAdministrativeMeldCheckout(input, { expectedAddress = undefined, signal = undefined, createCheckout = createAdministrativeMeldCheckout, openCheckout = openMintedCheckout } = {}) {
  const expected = meldCheckoutDestination({ address: expectedAddress, asset: 'USDT', network: 'polygon', chainId: 137 }), body = meldCheckoutInput(input);
  if (!expected || !body) throw Error('invalid_request');
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  const safe = meldCheckoutAcknowledgement(await createCheckout(body, { signal }));
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  if (!safe || safe.checkoutReference !== body.requestId || safe.country !== body.country || safe.sourceCurrencyCode !== body.sourceCurrencyCode
    || safe.requestedAmount !== body.amount || safe.destination.address.toLowerCase() !== expected.address.toLowerCase()) throw Error('meld_checkout_unavailable');
  openCheckout(safe.checkoutUrl);
  return safe;
}

export async function readAdministrativeMeldCheckoutStatus(checkoutReference, { signal = undefined, expectedAddress = undefined } = {}) {
  if (typeof checkoutReference !== 'string' || checkoutReference.length !== 36 || !MELD_CHECKOUT_REFERENCE.test(checkoutReference)) throw Error('invalid_request');
  if (expectedAddress !== undefined && !meldCheckoutDestination({ address: expectedAddress, asset: 'USDT', network: 'polygon', chainId: 137 })) throw Error('invalid_request');
  const reference = checkoutReference.toLowerCase();
  const safe = meldCheckoutStatus(await request(`${path}/status?checkoutReference=${reference}`, { method: 'GET', signal }));
  if (!safe || safe.checkoutReference !== reference || (expectedAddress !== undefined && safe.destination.address.toLowerCase() !== String(expectedAddress).toLowerCase())) throw Error('meld_checkout_unavailable');
  return safe;
}

export async function readAdministrativeMeldCheckoutHistory({ signal = undefined, expectedAddress = undefined } = {}) {
  if (expectedAddress !== undefined && !meldCheckoutDestination({ address: expectedAddress, asset: 'USDT', network: 'polygon', chainId: 137 })) throw Error('invalid_request');
  const safe = meldCheckoutHistory(await request(`${path}/history`, { method: 'GET', signal }));
  if (!safe || (expectedAddress !== undefined && safe.records.some(record => record.destination.address.toLowerCase() !== String(expectedAddress).toLowerCase()))) throw Error('meld_checkout_unavailable');
  return safe;
}

function openMintedCheckout(url) {
  const popup = window.open(url, '_blank');
  if (popup) popup.opener = null;
  else window.location.assign(url);
}
