// Shared presentation policy only. Provider credentials never belong here.
export const STRIPE_CHECKOUT_PAUSED_NOTICE = 'Los nuevos pagos con Stripe están suspendidos temporalmente.';
export const NOWPAYMENTS_MEMBERSHIPS_PAUSED_NOTICE = 'Las compras de membresías con NOWPayments aún no están habilitadas. No se ha iniciado un cobro desde esta solicitud.';

// Only an exact server-owned runtime flag may permit a new Stripe charge.
// Missing, malformed and public/browser flags all fail closed.
export function stripeCheckoutEnabled(env) {
  return env?.STRIPE_CHECKOUT_ENABLED === 'true';
}

// Independent admission control: enabling crypto membership checkout never
// enables Stripe, withdrawals, commissions or other financial mutations.
export function nowpaymentsMembershipsEnabled(env) {
  return env?.NOWPAYMENTS_MEMBERSHIPS_ENABLED === 'true';
}

export function checkoutProvider(value) {
  return value === undefined ? 'stripe' : ['stripe', 'nowpayments'].includes(value) ? value : null;
}

/** Accept hosted checkout pages, never a generic provider domain/open redirect. */
export function hostedCheckoutURL(value, provider, environment = 'production') {
  if (typeof value !== 'string' || value.length > 4096 || value !== value.trim()
      || /[\u0000-\u0020\u007f\\]/.test(value)) return null;
  let url;
  try { url = new URL(value); } catch { return null; }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
  if (provider === 'stripe') {
    // Stripe puts opaque checkout state in a fragment on its hosted page.
    if (url.hostname !== 'checkout.stripe.com' || url.search
        || !/^\/c\/pay\/cs_(?:live|test)_[A-Za-z0-9]+$/.test(url.pathname)) return null;
    return url.href;
  }
  if (provider !== 'nowpayments' || !['production', 'sandbox'].includes(environment)) return null;
  const host = environment === 'sandbox' ? 'sandbox.nowpayments.io' : 'nowpayments.io';
  if (url.hostname !== host || !['/payment', '/payment/'].includes(url.pathname) || url.hash) return null;
  const keys = [...url.searchParams.keys()];
  if (keys.some(key => !['iid', 'source'].includes(key)) || keys.filter(key => key === 'iid').length !== 1
      || keys.filter(key => key === 'source').length > 1 || !/^[1-9]\d{0,79}$/.test(url.searchParams.get('iid') || '')
      || (url.searchParams.has('source') && !/^[A-Za-z0-9_-]{1,80}$/.test(url.searchParams.get('source') || ''))) return null;
  return url.href;
}

export function checkoutErrorMessage(code, provider = 'stripe') {
  if (code === 'stripe_checkout_disabled') return STRIPE_CHECKOUT_PAUSED_NOTICE;
  if (code === 'nowpayments_checkout_disabled') return NOWPAYMENTS_MEMBERSHIPS_PAUSED_NOTICE;
  if (code === 'authentication-unavailable') return 'No pudimos comprobar tu sesión porque el servicio de acceso no está disponible. Vuelve a iniciar sesión antes de pagar.';
  if (code === 'nowpayments_checkout_unavailable') return 'El servicio de pagos no está disponible para iniciar esta compra. No se ha iniciado un cobro desde esta solicitud. Contacta al soporte.';
  if (['payments-unreachable', 'invalid-checkout-response', 'upstream_unavailable'].includes(code)) {
    return 'No pudimos confirmar el inicio del pago. No vuelvas a pagar todavía; revisa tu historial o contacta al soporte antes de volver a intentarlo.';
  }
  if (['unauthenticated', 'session-invalid', 'invalid_id_token'].includes(code)) return 'Tu sesión expiró. Vuelve a iniciar sesión antes de pagar.';
  if (code === 'buyer_not_found') return 'Tu cuenta aún no está registrada en la red.';
  if (code === 'invalid_referral_code') return 'El enlace de referido no es válido o ya no está activo. Solicita un enlace nuevo antes de pagar.';
  if (['tree_relocation_required', 'checkout_identity_review_required'].includes(code)) return 'Tu cuenta requiere revisión de identidad, sponsor y árbol antes de comprar. Contacta al soporte.';
  if (['nowpayments-review-required', 'nowpayments_review_required', 'checkout_pending_review', 'membership_payment_pending_review'].includes(code)) return 'Hay una compra pendiente de revisión. No vuelvas a pagar hasta que soporte confirme su estado.';
  if (['service_read_only', 'stripe_recovery_financial_review_required', 'financial_mutations_unavailable', 'core_unavailable',
    'payments-unconfigured', 'nowpayments-unavailable', 'nowpayments_unavailable', 'financial_services_unavailable',
    'core_not_ready', 'financial_review_required', 'membership_eligibility_unavailable', 'nowpayments_financial_configuration_unavailable', 'stripe_unavailable'].includes(code)) {
    return provider === 'nowpayments'
      ? 'Los pagos con NOWPayments aún no están habilitados. No se ha iniciado un cobro desde esta solicitud.'
      : 'Los pagos no están habilitados temporalmente. No se ha iniciado un cobro desde esta solicitud.';
  }
  if (code === 'account_suspended') return 'Esta cuenta tiene el acceso a compras restringido. Contacta al soporte.';
  if (code === 'membership_already_active') return 'Ya tienes esta membresía activa. No necesitas pagarla otra vez.';
  if (code === 'membership_purchase_already_processed') return 'Esta intención de compra ya fue procesada. Revisa el historial. Para comprar otra membresía, inicia una compra nueva de forma explícita.';
  if (code === 'invalid_purchase_request_id') return 'No pudimos identificar esta intención de compra. Revisa el historial antes de iniciar una nueva.';
  return 'No pudimos confirmar el inicio del pago. Revisa tu historial o contacta al soporte antes de volver a intentarlo.';
}

// Technical references are public enums, never arbitrary provider messages,
// exception strings, tokens, request bodies, email addresses or SQL details.
const publicErrorReferences = new Set([
  'authentication-unavailable', 'unauthenticated', 'session-invalid', 'invalid_id_token',
  'buyer_not_found', 'invalid_referral_code', 'invalid_preferred_side', 'tree_relocation_required',
  'checkout_identity_review_required', 'stripe_recovery_financial_review_required', 'financial_mutations_unavailable',
  'service_read_only', 'core_unavailable', 'financial_services_unavailable', 'account_suspended',
  'membership_already_active', 'membership_purchase_already_processed', 'invalid_purchase_request_id', 'package_not_found', 'nowpayments-unavailable', 'nowpayments_unavailable',
  'nowpayments-review-required', 'nowpayments_review_required', 'checkout_pending_review', 'membership_payment_pending_review',
  'core_not_ready', 'financial_review_required', 'membership_eligibility_unavailable', 'nowpayments_financial_configuration_unavailable',
  'stripe_unavailable', 'stripe_checkout_disabled', 'nowpayments_checkout_disabled', 'nowpayments_checkout_unavailable',
  'payments-unconfigured', 'payments-unreachable', 'upstream_unavailable', 'invalid-checkout-response', 'checkout-failed',
  'invalid-provider', 'invalid-package', 'invalid-json', 'invalid_origin', 'json_required', 'request_too_large', 'method_not_allowed',
]);

export function checkoutErrorNotice(code, provider = 'stripe') {
  const reference = publicErrorReferences.has(code) ? code : 'checkout_unknown';
  return `${checkoutErrorMessage(code, provider)} Referencia: ${reference}.`;
}
