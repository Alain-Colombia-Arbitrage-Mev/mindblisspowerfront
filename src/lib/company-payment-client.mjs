import { companyPaymentHistory, companyPaymentInput, companyPaymentView } from './company-payment-contract.mjs';
import { FUNDING_UUID } from './wallet-funding-contract.mjs';
import { browserRequestDeadline } from './browser-request-deadline.mjs';
import { PERSONAL_COMPANY_PAYMENT } from './personal-company-payment-values.mjs';

async function request(path, init) {
  const deadline = browserRequestDeadline(init.signal, 25_000);
  try {
    const response = await fetch(path, { ...init, signal: deadline.signal, credentials: 'same-origin', cache: 'no-store', redirect: 'error' });
    const raw = await response.text();
    if (deadline.signal.aborted) throw new DOMException('Aborted', 'AbortError');
    if (raw.length > 65536) throw new Error('company_payment_unavailable');
    let data;
    try { data = JSON.parse(raw); } catch { throw new Error('company_payment_unavailable'); }
    if (!response.ok) throw new Error(typeof data?.error === 'string' && /^(?:company_payment_[a-z_]+|unauthenticated|invalid_origin|invalid_request)$/.test(data.error) ? data.error : 'company_payment_unavailable');
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
