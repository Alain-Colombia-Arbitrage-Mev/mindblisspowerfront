// Presentation only. Monetary totals, calendar-month eligibility and lock dates
// are supplied by the owner-scoped backend, never calculated in the browser.
const amountPattern = /^(0|[1-9]\d{0,23})(?:\.(\d{1,4}))?$/;
const knownAmount = value => typeof value === 'string' && amountPattern.test(value);
const knownTime = value => typeof value === 'string'
  && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
  && Number.isFinite(Date.parse(value));
const commissionAmounts = ['pending_usd', 'available_usd', 'funding_held_usd', 'credited_usd', 'paid_external_usd'];
const membershipAmounts = ['principal_locked_usd', 'principal_available_usd', 'roi_locked_usd', 'roi_available_usd'];

export function nowpaymentsBalanceView(value) {
  if (!value || value.read_model_status !== 'operational' || value.withdrawals_enabled !== false
      || !commissionAmounts.every(key => knownAmount(value.commissions?.[key]))
      || !membershipAmounts.every(key => knownAmount(value.membership?.[key]))
      || !Array.isArray(value.commissions?.items) || !Array.isArray(value.membership?.items)
      || !value.commissions.items.every(item => item && typeof item.status === 'string' && knownTime(item.generated_at) && knownTime(item.available_at)
        && ['amount_usd', 'credited_usd', 'funding_held_usd', 'cap_excluded_usd'].every(key => knownAmount(item[key])))
      || !value.membership.items.every(item => item && typeof item.eligibility === 'string' && knownTime(item.started_at) && knownTime(item.lock_until)
        && ['principal_usd', 'roi_locked_usd', 'roi_available_usd'].every(key => knownAmount(item[key])))) {
    return { status: 'unavailable' };
  }
  return { status: 'operational', commissions: value.commissions, membership: value.membership };
}

export function nowpaymentsMoney(value) {
  if (!knownAmount(value)) return 'No disponible';
  const [whole, decimals = ''] = value.split('.');
  let fraction = decimals.padEnd(2, '0');
  while (fraction.length > 2 && fraction.endsWith('0')) fraction = fraction.slice(0, -1);
  return `$${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fraction} USD`;
}

export function nowpaymentsDate(value) {
  return knownTime(value) ? new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Bogota',
  }).format(new Date(value)) : 'Fecha no disponible';
}

export function nowpaymentsCommissionStatus(status) {
  const labels = new Map(Object.entries({ pending_maturity: 'Pendiente de vencimiento', pending: 'Pendiente de liberación',
    available: 'Vencida, sujeta a validación', funding_held: 'Retenida por financiación',
    risk_review: 'Retenida por revisión de seguridad', security_blocked: 'Bloqueada por seguridad',
    cap_excluded: 'Excluida por límite del plan' }));
  return labels.get(status) || 'En revisión';
}

export function nowpaymentsMembershipStatus(status) {
  const labels = new Map(Object.entries({ locked: 'Capital bloqueado', available: 'Capital vencido, elegible para solicitud',
    eligible: 'Capital vencido, elegible para solicitud', risk_review: 'En revisión de seguridad',
    security_blocked: 'Bloqueada por seguridad', closed: 'CD cerrado, sujeto a revisión' }));
  return labels.get(status) || 'Elegibilidad en revisión';
}
