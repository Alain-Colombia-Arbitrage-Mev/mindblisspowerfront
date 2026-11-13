import { companyPaymentHistory, companyPaymentInput, companyPaymentView } from './company-payment-contract.mjs';
import { FUNDING_UUID } from './wallet-funding-contract.mjs';
import { browserRequestDeadline } from './browser-request-deadline.mjs';
import { PERSONAL_COMPANY_PAYMENT } from './personal-company-payment-values.mjs';
import { companyPaymentEventInput, companyPaymentEventAck, companyPaymentEventPage, companyPaymentEventQuery } from './company-payment-events.mjs';

async function request(path, init) {
  const deadline = browserRequestDeadline(init.signal, 25_000);
  try {
    const response = await fetch(path, { ...init, signal: deadline.signal, credentials: 'same-origin', cache: 'no-store', redirect: 'error' });
    const raw = await response.text();
    if (deadline.signal.aborted) throw new DOMException('Aborted', 'AbortError');
    if (raw.length > 65536) throw new Error('company_payment_unavailable');
    let data;
    try { data = JSON.parse(raw); } catch { throw new Error('company_payment_unavailable'); }
    if (!response.ok) throw Object.assign(new Error(typeof data?.error === 'string' && /^(?:company_payment_[a-z_]+|unauthenticated|invalid_origin|invalid_request)$/.test(data.error) ? data.error : 'company_payment_unavailable'), { status: response.status });
    if (deadline.signal.aborted) throw new DOMException('Aborted', 'AbortError');
    return data;
  } finally { deadline.dispose(); }
}
/** @param {{ signal?: AbortSignal }} [options] */
export async function readCompanyPaymentHistory({ signal } = {}) {
  const data = companyPaymentHistory(await request('/api/member/company-payments/history', { method: 'GET', signal }));
  if (!data) throw new Error('company_payment_unavailable');
  return data;
}
/** @param {string} paymentId @param {{ signal?: AbortSignal }} [options] */
export async function readCompanyPaymentStatus(paymentId, { signal } = {}) {
  if (typeof paymentId !== 'string' || paymentId.length !== 36 || !FUNDING_UUID.test(paymentId) || paymentId !== paymentId.toLowerCase()) throw new Error('invalid_request');
  const data = companyPaymentView(await request(`/api/member/company-payments/status?paymentId=${paymentId}`, { method: 'GET', signal }));
  if (!data || data.paymentId !== paymentId) throw new Error('company_payment_unavailable');
  return data;
}
/** @param {string} action @param {object} input @param {{ signal?: AbortSignal }} [options] */
export async function writeCompanyPayment(action, input, { signal } = {}) {
  const body = companyPaymentInput(input, action);
  if (!body) throw new Error('invalid_request');
  const data = companyPaymentView(await request(`/api/member/company-payments/${action}`, { method: 'POST', signal,
    headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }));
  if (!data || data.paymentId !== ('requestId' in body ? body.requestId : body.paymentId)
    || (action === 'prepare' && (!('amountAtomic' in body) || data.amountAtomic !== body.amountAtomic || data.chainId !== (body.chainId ?? PERSONAL_COMPANY_PAYMENT.chainId)))
    || (action === 'submit' && data.transactionHash !== ('transactionHash' in body ? body.transactionHash : undefined))) throw new Error('company_payment_unavailable');
  if (action === 'abandon' && (data.status !== 'prepared' || data.abandonedAt === null)) throw new Error('company_payment_unavailable');
  return data;
}

/** Client observations never establish a transaction or financial outcome.
 * @param {object} input @param {{ signal?: AbortSignal, isActive?: () => boolean }} [options] */
export async function recordCompanyPaymentEvent(input, { signal, isActive = () => true } = {}) {
  const body = companyPaymentEventInput(input);
  if (!body) throw new Error('invalid_request');
  for (let attempt = 0; attempt < 2; attempt++) {
    if (signal?.aborted || !isActive()) throw new DOMException('Aborted', 'AbortError');
    try {
      const data = companyPaymentEventAck(await request('/api/member/company-payments/events', { method: 'POST', signal,
        headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }), body);
      if (signal?.aborted || !isActive()) throw new DOMException('Aborted', 'AbortError');
      if (!data) throw new Error('company_payment_invalid_event_ack');
      return data;
    } catch (error) {
      if (attempt || error?.name === 'AbortError' || [400, 401, 403, 404, 409, 413, 429].includes(error?.status)
        || !(error instanceof TypeError || error?.message === 'company_payment_unavailable') || !isActive()) throw error;
    }
  }
}

/** @param {{paymentId?: string, limit?: number, cursor?: string, signal?: AbortSignal}} [options] */
export async function readCompanyPaymentActivity({ paymentId, limit = 20, cursor, signal } = {}) {
  const params = new URLSearchParams();
  if (paymentId !== undefined) params.set('paymentId', paymentId);
  params.set('limit', String(limit));
  if (cursor !== undefined) params.set('cursor', cursor);
  const action = paymentId === undefined ? 'activity' : 'events';
  const parsed = companyPaymentEventQuery(`?${params}`, action);
  if (!parsed) throw new Error('invalid_request');
  const page = companyPaymentEventPage(await request(`/api/member/company-payments/${action}${parsed.query}`, { method: 'GET', signal }), parsed);
  if (!page) throw new Error('company_payment_unavailable');
  return page;
}
