import { hostedCheckoutURL } from './checkout-policy.mjs';
import { nowpaymentsOrderId } from './nowpayments-receipt.mjs';

const money = value => typeof value === 'string' && /^(?:0|[1-9]\d{0,11})\.\d{2}$/.test(value);
const time = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value));
const paymentStates = new Set(['awaiting_payment', 'processing', 'completed', 'under_review', 'invoice_unknown', 'cancelled_local']);
const fulfillmentStates = new Set(['awaiting_payment', 'activated', 'not_activated']);

/** Project only owner-facing fields. An invalid/partial list is never an empty history. */
export function nowpaymentsPurchases(value) {
  if (value?.provider !== 'nowpayments' || value.purpose !== 'membership' || !Array.isArray(value.purchases)
      || value.purchases.length > 100 || typeof value.has_more !== 'boolean') return null;
  const seen = new Set(), purchases = [];
  for (const item of value.purchases) {
    if (!item || !nowpaymentsOrderId(item.order_id) || seen.has(item.order_id)
        || !Number.isSafeInteger(item.package_id) || item.package_id <= 0
        || typeof item.package_name !== 'string' || !item.package_name.trim() || item.package_name.length > 200
        || /[\u0000-\u001f\u007f]/.test(item.package_name)
        || !money(item.total_usd) || BigInt(item.total_usd.replace('.', '')) <= 0n || !money(item.fee_usd)
        || BigInt(item.fee_usd.replace('.', '')) > BigInt(item.total_usd.replace('.', ''))
        || !time(item.created_at) || !time(item.updated_at) || !paymentStates.has(item.payment_status)
        || !fulfillmentStates.has(item.fulfillment_status) || typeof item.can_resume !== 'boolean' || typeof item.can_cancel !== 'boolean'
        || !(item.cancelled_at === null || time(item.cancelled_at))
        || (item.fulfillment_status === 'activated' && (item.payment_status !== 'completed' || item.can_resume || item.can_cancel))
        || (item.payment_status !== 'awaiting_payment' && item.can_resume)
        || (item.payment_status === 'cancelled_local' && (item.can_cancel || item.can_resume || item.cancelled_at === null))) return null;
    seen.add(item.order_id);
    purchases.push(Object.fromEntries(['order_id', 'package_id', 'package_name', 'total_usd', 'fee_usd', 'created_at', 'updated_at',
      'payment_status', 'fulfillment_status', 'can_resume', 'can_cancel', 'cancelled_at'].map(key => [key, item[key]])));
  }
  return { provider: 'nowpayments', purpose: 'membership', purchases, has_more: value.has_more };
}

export function nowpaymentsResume(value, orderId, environment = 'production') {
  const url = hostedCheckoutURL(value?.url, 'nowpayments', environment);
  if (!nowpaymentsOrderId(orderId) || value?.order_id !== orderId || value.provider !== 'nowpayments'
      || value.fulfillment_status !== 'awaiting_payment' || value.reused !== true || !url
      || !money(value.total_usd) || BigInt(value.total_usd.replace('.', '')) <= 0n || !money(value.fee_usd)
      || BigInt(value.fee_usd.replace('.', '')) > BigInt(value.total_usd.replace('.', ''))) return null;
  return { url, order_id: orderId, provider: 'nowpayments', total_usd: value.total_usd, fee_usd: value.fee_usd,
    fulfillment_status: 'awaiting_payment', reused: true };
}

export function nowpaymentsCancellation(value, orderId) {
  return nowpaymentsOrderId(orderId) && value?.order_id === orderId && value.state === 'cancelled_local'
    && value.provider_invoice_revoked === false && value.late_payment_policy === 'review_required'
    ? { order_id: orderId, state: 'cancelled_local', provider_invoice_revoked: false, late_payment_policy: 'review_required' } : null;
}

const labels = new Map(Object.entries({ awaiting_payment: 'Pendiente de pago', processing: 'Pago en proceso',
  completed: 'Pago confirmado', under_review: 'En revisión', invoice_unknown: 'Factura pendiente de comprobación', cancelled_local: 'Intención cancelada localmente' }));
export const nowpaymentsPurchaseLabel = item => item?.fulfillment_status === 'activated' && item?.payment_status === 'completed'
  ? 'Membresía activada' : labels.get(item?.payment_status) || 'Estado no disponible';

export function nowpaymentsPurchaseError(code) {
  if (['unauthenticated', 'invalid_id_token'].includes(code)) return 'Tu sesión no está disponible. Vuelve a iniciar sesión.';
  if (code === 'purchase_not_found') return 'No pudimos encontrar esta compra en tu cuenta.';
  if (code === 'purchase_cannot_cancel') return 'No se puede cancelar esta intención en su estado actual. Actualiza el historial; si pagaste, no vuelvas a pagar.';
  if (code === 'purchase_cannot_resume') return 'No se puede continuar esta factura en su estado actual. Actualiza el historial antes de pagar.';
  return 'No pudimos confirmar el resultado. Actualiza el historial antes de repetir la acción; no crees ni pagues otra factura hasta comprobar el estado.';
}

const path = '/api/payments/nowpayments/purchases';
/** @param {string} action
 * @param {string} orderId
 * @param {{signal?: AbortSignal, fetchImpl?: typeof fetch}} [options] */
async function transport(action, orderId, { signal, fetchImpl = fetch } = {}) {
  if (action && !nowpaymentsOrderId(orderId)) throw new Error('invalid_order');
  const response = await fetchImpl(`${path}${action ? `/${action}` : ''}`, {
    method: action ? 'POST' : 'GET', credentials: 'same-origin', cache: 'no-store', redirect: 'error',
    signal: AbortSignal.any([...(signal ? [signal] : []), AbortSignal.timeout(12000)]),
    ...(action ? { headers: { 'content-type': 'application/json' }, body: JSON.stringify({ order_id: orderId }) } : {}),
  });
  const value = await response.json().catch(() => null);
  if (!response.ok) throw Object.assign(new Error('Purchase request unavailable'), { code: typeof value?.error === 'string' ? value.error : '', status: response.status });
  const projected = action === 'cancel' ? nowpaymentsCancellation(value, orderId)
    : action === 'resume' ? nowpaymentsResume(value, orderId, value?.checkout_environment || 'production') : nowpaymentsPurchases(value);
  if (!projected) throw new Error('Invalid purchase response');
  return projected;
}
export const readNOWPaymentsPurchases = options => transport('', '', options);
export const resumeNOWPaymentsPurchase = (orderId, options) => transport('resume', orderId, options);
export const cancelNOWPaymentsPurchase = (orderId, options) => transport('cancel', orderId, options);
