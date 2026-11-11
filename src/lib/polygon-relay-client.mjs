import { FUNDING_UUID } from './wallet-funding-contract.mjs';
import { polygonRelayInput, polygonRelayView, polygonRelayHistory, polygonRelayCapabilities } from './polygon-relay-contract.mjs';
import { browserRequestDeadline } from './browser-request-deadline.mjs';

/** @overload @param {'capabilities'} action @param {any} input @param {{signal?: AbortSignal, fetchImpl?: typeof fetch}} [options] @returns {Promise<ReturnType<typeof polygonRelayCapabilities>>} */
/** @overload @param {'history'} action @param {any} input @param {{signal?: AbortSignal, fetchImpl?: typeof fetch}} [options] @returns {Promise<ReturnType<typeof polygonRelayHistory>>} */
/** @overload @param {string} action @param {any} input @param {{signal?: AbortSignal, fetchImpl?: typeof fetch}} [options] @returns {Promise<ReturnType<typeof polygonRelayView>>} */
/** @param {string} action @param {any} input @param {{signal?: AbortSignal, fetchImpl?: typeof fetch}} [options] */
async function request(action, input, { signal, fetchImpl = fetch } = {}) {
  const reading = ['capabilities', 'status', 'history'].includes(action), body = reading ? null : polygonRelayInput(action, input);
  if ((!reading && !body) || (action === 'status' && (!FUNDING_UUID.test(input?.paymentId) || input.paymentId !== input.paymentId.toLowerCase()))) throw new Error('invalid_request');
  const deadline = browserRequestDeadline(signal, 25_000);
  try {
    const response = await fetchImpl(`/api/member/polygon-relay/${action}${action === 'status' ? `?paymentId=${input.paymentId}` : ''}`, {
      method: reading ? 'GET' : 'POST', signal: deadline.signal, credentials: 'same-origin', cache: 'no-store', redirect: 'error',
      ...(body ? { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : {}) });
    const raw = await response.text();
    if (deadline.signal.aborted) throw new DOMException('Aborted', 'AbortError');
    if (raw.length > 131072) throw new Error('polygon_relay_unavailable');
    let data;
    try { data = JSON.parse(raw); } catch { throw new Error('polygon_relay_unavailable'); }
    if (!response.ok) throw Object.assign(new Error(typeof data?.error === 'string' && /^(?:polygon_relay_[a-z_]+|unauthenticated|invalid_origin|invalid_request)$/.test(data.error) ? data.error : 'polygon_relay_unavailable'), { status: response.status });
    const safe = action === 'capabilities' ? polygonRelayCapabilities(data) : action === 'history' ? polygonRelayHistory(data) : polygonRelayView(data);
    if (!safe || (!['capabilities', 'history'].includes(action) && (!('paymentId' in safe) || safe.paymentId !== (input.paymentId || input.requestId)))
      || (action === 'prepare' && (!('amountAtomic' in safe) || safe.amountAtomic !== body.amountAtomic || !('typedData' in safe) || (safe.status === 'prepared' && !safe.typedData)))) throw new Error('polygon_relay_unavailable');
    if (action === 'abandon' && (!('status' in safe) || safe.status !== 'expired' || safe.failureReason !== 'preparation_abandoned')) throw new Error('polygon_relay_unavailable');
    return safe;
  } finally { deadline.dispose(); }
}
/** @param {{signal?: AbortSignal, fetchImpl?: typeof fetch}} [options] */
export const readPolygonRelayCapabilities = (options = {}) => request('capabilities', null, options);
/** @param {{signal?: AbortSignal, fetchImpl?: typeof fetch}} [options] */
export const readPolygonRelayHistory = (options = {}) => request('history', null, options);
/** @param {string} paymentId @param {{signal?: AbortSignal, fetchImpl?: typeof fetch}} [options] */
export const readPolygonRelayStatus = (paymentId, options = {}) => request('status', { paymentId }, options);
/** @param {string} action @param {object} input @param {{signal?: AbortSignal, fetchImpl?: typeof fetch}} [options] */
export function writePolygonRelay(action, input, options = {}) {
  if (!['prepare', 'authorize', 'submit', 'verify', 'abandon'].includes(action)) return Promise.reject(new Error('invalid_request'));
  return request(action, input, options);
}
