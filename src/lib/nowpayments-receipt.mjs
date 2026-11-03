export function nowpaymentsOrderId(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value)
    && value !== '00000000-0000-0000-0000-000000000000' ? value : '';
}

// Only the authenticated, owner-scoped status API may supply this evidence.
// Browser return parameters, IPN acknowledgement and membership state cannot.
export function nowpaymentsReceiptStatus(value, orderId) {
  if (!nowpaymentsOrderId(orderId) || !value || typeof value !== 'object' || Array.isArray(value) || value.error
      || value.provider !== 'nowpayments' || value.order_id !== orderId
      || !['not_activated', 'review_required', 'awaiting_payment', 'activated', 'risk_review', 'security_blocked'].includes(value.fulfillment_status)
      || !['pending', 'completed', 'under_review'].includes(value.state)
      || !['payment_confirmed', 'signature_validated', 'provider_verified', 'persisted'].every(key => typeof value[key] === 'boolean')
      || value.payment_confirmed !== (value.state === 'completed')
      || (value.state === 'completed' && (!value.signature_validated || !value.provider_verified || !value.persisted))
      || (value.fulfillment_status === 'activated' && value.state !== 'completed')
      || (['risk_review', 'security_blocked'].includes(value.fulfillment_status) && value.state !== 'under_review')) return null;
  return { provider: 'nowpayments', order_id: orderId, state: value.state, payment_confirmed: value.payment_confirmed,
    signature_validated: value.signature_validated, provider_verified: value.provider_verified, persisted: value.persisted,
    fulfillment_status: value.fulfillment_status };
}

export const completedNOWPaymentsReceipt = (value, orderId) => nowpaymentsReceiptStatus(value, orderId)?.state === 'completed';
export const activatedNOWPaymentsMembership = (value, orderId) => nowpaymentsReceiptStatus(value, orderId)?.fulfillment_status === 'activated';

/** @param {string} orderId
 * @param {{signal?: AbortSignal, fetchImpl?: typeof fetch}} [options] */
export async function readNOWPaymentsReceipt(orderId, { signal, fetchImpl = fetch } = {}) {
  if (!nowpaymentsOrderId(orderId)) throw Object.assign(new Error('Invalid order'), { status: 400 });
  const response = await fetchImpl(`/api/payments/nowpayments/status?order_id=${orderId}`, {
    credentials: 'same-origin', cache: 'no-store', redirect: 'error', signal: AbortSignal.any([...(signal ? [signal] : []), AbortSignal.timeout(10000)]),
  });
  if (!response.ok) {
    void response.body?.cancel().catch(() => {});
    const retry = Number(response.headers.get('retry-after'));
    throw Object.assign(new Error('Payment confirmation unavailable'), { status: response.status,
      retryAfterMs: Number.isFinite(retry) && retry > 0 ? Math.min(retry * 1000, 60000) : 0 });
  }
  const value = await response.json().catch(() => null);
  const receipt = nowpaymentsReceiptStatus(value, orderId);
  if (!receipt) throw Object.assign(new Error('Invalid payment confirmation'), { status: 502 });
  return receipt;
}

/** Bounded, non-overlapping polling; focus never bypasses backoff or deadline. */
export function startNOWPaymentsReceiptPolling({ orderId, onResult, onStop = (_reason = '') => {},
  read = readNOWPaymentsReceipt, timers = globalThis, now = () => Date.now(),
  documentRef = globalThis.document, windowRef = globalThis.window, maxAttempts = 20, maxDurationMs = 180000 }) {
  if (!nowpaymentsOrderId(orderId) || !Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 30
      || !Number.isFinite(maxDurationMs) || maxDurationMs <= 0 || maxDurationMs > 300000) throw new Error('Invalid receipt polling bounds');
  let stopped = false, attempts = 0, timer, inflight, nextAllowed = 0;
  let focused = documentRef?.hasFocus?.() !== false;
  const active = () => focused && documentRef?.visibilityState !== 'hidden';
  const clear = () => { if (timer !== undefined) timers.clearTimeout(timer); timer = undefined; };
  function stop(reason) {
    if (stopped) return;
    stopped = true; clear(); timers.clearTimeout(deadline); inflight?.abort();
    documentRef?.removeEventListener('visibilitychange', changed);
    windowRef?.removeEventListener('focus', focus); windowRef?.removeEventListener('blur', blur);
    onStop(reason);
  }
  function schedule() {
    if (!stopped && active() && !inflight && timer === undefined) timer = timers.setTimeout(check, Math.max(0, nextAllowed - now()));
  }
  async function check() {
    timer = undefined;
    if (stopped || !active() || inflight) return;
    const controller = new AbortController(); inflight = controller; attempts++;
    let terminal = '';
    nextAllowed = now() + Math.min(15000, 2000 * 2 ** (attempts - 1));
    try {
      const receipt = nowpaymentsReceiptStatus(await read(orderId, { signal: controller.signal }), orderId);
      if (stopped || controller.signal.aborted) return;
      if (!receipt) throw Object.assign(new Error('Invalid payment confirmation'), { status: 502 });
      onResult(receipt);
      // Receipt verification can precede its durable membership job. Keep the
      // same bounded poll until activation or a terminal review is observed.
      if (receipt.state !== 'pending' && !(receipt.state === 'completed' && receipt.fulfillment_status === 'awaiting_payment')) terminal = receipt.state;
    } catch (error) {
      if (stopped || controller.signal.aborted) return;
      if ([400, 401, 403, 404].includes(error?.status)) terminal = 'unavailable';
      nextAllowed = Math.max(nextAllowed, now() + Math.min(Number(error?.retryAfterMs) || 0, 60000));
    } finally {
      if (inflight === controller) inflight = null;
      if (!stopped) {
        if (terminal || attempts >= maxAttempts) stop(terminal || 'exhausted');
        else schedule();
      }
    }
  }
  function changed() { if (!active()) { clear(); inflight?.abort(); } else schedule(); }
  function focus() { focused = true; changed(); }
  function blur() { focused = false; changed(); }
  const deadline = timers.setTimeout(() => stop('exhausted'), maxDurationMs);
  documentRef?.addEventListener('visibilitychange', changed);
  windowRef?.addEventListener('focus', focus); windowRef?.addEventListener('blur', blur);
  schedule();
  return () => stop('cancelled');
}
