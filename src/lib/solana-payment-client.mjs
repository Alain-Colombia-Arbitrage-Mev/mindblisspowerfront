import { SOLANA_UUID, solanaPaymentInput, solanaPaymentView, solanaPaymentHistory, solanaBalanceView, solanaCapabilitiesView } from './solana-wallet-contract.mjs';
import { browserRequestDeadline } from './browser-request-deadline.mjs';

/** One delivery only. A timeout after submit is an unknown outcome, never permission to resend. */
/** @overload @param {'capabilities'} action @param {any} input @param {{signal?: AbortSignal, fetchImpl?: typeof fetch}} [options] @returns {Promise<ReturnType<typeof solanaCapabilitiesView>>} */
/** @overload @param {'balance'} action @param {any} input @param {{signal?: AbortSignal, fetchImpl?: typeof fetch}} [options] @returns {Promise<ReturnType<typeof solanaBalanceView>>} */
/** @overload @param {'history'} action @param {any} input @param {{signal?: AbortSignal, fetchImpl?: typeof fetch}} [options] @returns {Promise<ReturnType<typeof solanaPaymentHistory>>} */
/** @overload @param {string} action @param {any} input @param {{signal?: AbortSignal, fetchImpl?: typeof fetch}} [options] @returns {Promise<ReturnType<typeof solanaPaymentView>>} */
/** @param {string} action @param {any} input @param {{signal?: AbortSignal, fetchImpl?: typeof fetch}} [options] */
async function request(action, input, { signal, fetchImpl = fetch } = {}) {
  const reading = ['capabilities', 'balance', 'status', 'history'].includes(action);
  const body = reading ? null : solanaPaymentInput(action, input);
  if ((!reading && !body) || (action === 'status' && !SOLANA_UUID.test(input?.paymentId))) throw new Error('invalid_request');
  const deadline = browserRequestDeadline(signal, 25_000);
  try {
    const response = await fetchImpl(`/api/member/solana-payments/${action}${action === 'status' ? `?paymentId=${input.paymentId}` : ''}`, {
      method: reading ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store', redirect: 'error', signal: deadline.signal,
      ...(body ? { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : {}) });
    const raw = await response.text();
    if (deadline.signal.aborted) throw new DOMException('Aborted', 'AbortError');
    if (raw.length > 131072) throw new Error('solana_payment_unavailable');
    let value;
    try { value = JSON.parse(raw); } catch { throw new Error('solana_payment_unavailable'); }
    if (!response.ok) throw Object.assign(new Error(typeof value?.error === 'string' && /^(?:solana_payment_[a-z_]+|unauthenticated|invalid_origin|invalid_request)$/.test(value.error) ? value.error : 'solana_payment_unavailable'), { status: response.status });
    const safe = action === 'balance' ? solanaBalanceView(value) : action === 'capabilities' ? solanaCapabilitiesView(value) : action === 'history' ? solanaPaymentHistory(value) : solanaPaymentView(value);
    if (!safe || (!['balance', 'history', 'capabilities'].includes(action) && (!('paymentId' in safe) || safe.paymentId !== (input.paymentId || input.requestId)))
      || (action === 'prepare' && (!('amountAtomic' in safe) || safe.amountAtomic !== body.amountAtomic || !('transactionBase64' in safe) || (safe.status === 'prepared' && !safe.transactionBase64)))) throw new Error('solana_payment_unavailable');
    return safe;
  } finally { deadline.dispose(); }
}
/** @param {{signal?: AbortSignal, fetchImpl?: typeof fetch}} [options] */
export const readSolanaBalance = (options = {}) => request('balance', null, options);
/** @param {{signal?: AbortSignal, fetchImpl?: typeof fetch}} [options] */
export const readSolanaCapabilities = (options = {}) => request('capabilities', null, options);
/** @param {{signal?: AbortSignal, fetchImpl?: typeof fetch}} [options] */
export const readSolanaPayments = (options = {}) => request('history', null, options);
/** @param {string} paymentId @param {{signal?: AbortSignal, fetchImpl?: typeof fetch}} [options] */
export const readSolanaPayment = (paymentId, options = {}) => request('status', { paymentId }, options);
/** @param {string} action @param {object} input @param {{signal?: AbortSignal, fetchImpl?: typeof fetch}} [options] */
export function writeSolanaPayment(action, input, options = {}) {
  if (!['prepare', 'submit', 'verify'].includes(action)) return Promise.reject(new Error('invalid_request'));
  return request(action, input, options);
}
