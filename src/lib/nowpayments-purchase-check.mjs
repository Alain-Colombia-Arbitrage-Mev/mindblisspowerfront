import { nowpaymentsReceiptStatus } from './nowpayments-receipt.mjs';

/** A fresh server read is not a live provider lookup or a client payment claim. */
export function nowpaymentsPurchaseCheck(value, orderId) {
  const receipt = nowpaymentsReceiptStatus(value, orderId);
  if (!receipt) return null;
  if (receipt.fulfillment_status === 'activated') return {
    title: 'Membresía activada', tone: 'active', blockPayment: true, activated: true,
    description: 'El servidor confirma la activación de esta membresía. No es una confirmación de rendimientos cobrados ni retiros.',
  };
  if (receipt.state === 'completed') return {
    title: 'Pago confirmado · activación pendiente', tone: 'confirmed', blockPayment: true, activated: false,
    description: 'Pago recibido y verificado. La membresía aún no figura activada; no vuelvas a pagar y revisa su estado o contacta al soporte.',
  };
  if (receipt.state === 'under_review') return {
    title: 'Compra en revisión', tone: 'review', blockPayment: true, activated: false,
    description: 'Esta compra está en revisión. No vuelvas a pagar; contacta al soporte. Si cancelaste la intención localmente, no uses los enlaces de la factura anterior.',
  };
  return {
    title: 'Pendiente de confirmación', tone: 'pending', blockPayment: false, activated: false,
    description: 'El servidor todavía no confirma el pago de esta compra. Si ya enviaste los fondos, no vuelvas a pagar. La confirmación de la red o de NOWPayments puede tardar; consulta otra vez más tarde.',
  };
}

export function nowpaymentsPurchaseCheckError(failure) {
  if ([401, 403].includes(failure?.status)) return {
    title: 'Sesión no disponible', description: 'Vuelve a iniciar sesión para consultar esta compra. No vuelvas a pagar sin comprobar su estado.',
  };
  if (failure?.status === 404) return {
    title: 'No pudimos consultar esta compra', description: 'No pudimos consultar esta compra en tu cuenta. Actualiza el historial o contacta al soporte con la referencia. Esto no confirma si el pago se realizó.',
  };
  if (failure?.status === 429) return {
    title: 'Demasiadas consultas', description: 'Espera unos segundos antes de volver a consultar. No vuelvas a pagar: este límite no indica el estado del pago.',
  };
  if (['TimeoutError', 'AbortError'].includes(failure?.name)) return {
    title: 'La consulta tardó demasiado', description: 'No recibimos una respuesta a tiempo. Puedes volver a consultar; no repitas el pago por este error.',
  };
  return {
    title: 'Estado temporalmente no disponible', description: 'No pudimos consultar el estado del pago. Intenta de nuevo más tarde o contacta al soporte con la referencia. No vuelvas a pagar sin comprobarlo.',
  };
}
