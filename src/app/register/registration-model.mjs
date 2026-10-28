export const REGISTRATION_RESEND_SECONDS = 300;

export function registrationEmail(value) {
  if (typeof value !== 'string') return '';
  const email = value.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

export function registrationErrors(form) {
  /** @type {Record<string, string>} */
  const errors = {};
  const name = String(form.fullName || '').trim();
  if (name.length < 2 || name.length > 120 || /[\u0000-\u001f\u007f]/.test(name)) errors.fullName = 'Ingresa tu nombre completo (entre 2 y 120 caracteres, sin saltos de línea).';
  if (!registrationEmail(form.email)) errors.email = 'Ingresa un correo electrónico válido.';
  if (typeof form.password !== 'string' || form.password.length < 12 || form.password.length > 128) {
    errors.password = 'Usa una contraseña de entre 12 y 128 caracteres.';
  }
  if (form.confirmPassword !== form.password) errors.confirmPassword = 'Las contraseñas no coinciden.';
  if (form.acceptsPrivacy !== true) errors.acceptsPrivacy = 'Debes autorizar el tratamiento de tus datos para registrarte.';
  return errors;
}

export function registrationAcknowledged(action, payload, email = '') {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload) || payload.error || payload.ok !== true || payload.mode !== 'better-auth') return false;
  if (action === 'register') return payload.email === registrationEmail(email) && payload.userConfirmed === false && payload.requiresConfirmation === true;
  if (action === 'confirm') return payload.userConfirmed === true && payload.needsLogin === true;
  if (action === 'resend') return Number.isSafeInteger(payload.resendAfter) && payload.resendAfter >= REGISTRATION_RESEND_SECONDS;
  return false;
}

// This is a recoverable failure, never an accepted send or verified account.
// A generic 503, guessed account email or HTTP 200 cannot select this state.
export function registrationPendingDelivery(status, payload, email) {
  const expectedEmail = registrationEmail(email);
  return status === 503 && Boolean(expectedEmail)
    && payload !== null && typeof payload === 'object' && !Array.isArray(payload)
    && payload.code === 'EMAIL_DELIVERY_UNAVAILABLE' && payload.registrationPending === true
    && payload.requiresConfirmation === true && payload.email === expectedEmail;
}

export function registrationHints(search) {
  const params = new URLSearchParams(search);
  const referralCode = String(params.get('ref') || '').trim().slice(0, 64);
  const side = String(params.get('side') || '').toUpperCase();
  return {
    email: registrationEmail(params.get('email')),
    referralCode,
    preferredSide: referralCode && ['L', 'R'].includes(side) ? side : '',
    resume: params.get('resume') === '1',
  };
}

// Retry-After may be longer than our resend budget, but never shorten it.
export function registrationRetrySeconds(response, payload = {}) {
  const supplied = Number(response.headers?.get('retry-after') || payload.retryAfterSec || payload.retryAfter || payload.resendAfter);
  return Number.isFinite(supplied) && supplied > 0
    ? Math.max(REGISTRATION_RESEND_SECONDS, Math.min(86400, Math.ceil(supplied)))
    : REGISTRATION_RESEND_SECONDS;
}

export function registrationFailure(status, action = 'register', code = '') {
  if (status === 429) return 'Has realizado varios intentos. Espera antes de solicitar otro código.';
  if (status >= 500) return 'El servicio de registro no está disponible en este momento. Intenta más tarde.';
  if (action === 'confirm') return 'El código no es válido o ha vencido. Revísalo o solicita otro cuando termine la espera.';
  if (code === 'PASSWORD_TOO_SHORT' || code === 'PASSWORD_TOO_LONG') return 'Usa una contraseña de entre 12 y 128 caracteres.';
  if (action === 'resend') return 'No pudimos solicitar el código. Revisa el correo e inténtalo de nuevo.';
  return 'No pudimos completar el registro. Revisa los datos o entra si ya tienes una cuenta.';
}

export function registrationLoginUrl(email, referralCode = '', preferredSide = '') {
  const params = new URLSearchParams();
  params.set('mode', 'password');
  const normalizedEmail = registrationEmail(email);
  if (normalizedEmail) params.set('email', normalizedEmail);
  if (referralCode) {
    params.set('ref', String(referralCode).slice(0, 64));
    if (['L', 'R'].includes(preferredSide)) params.set('side', preferredSide);
  }
  return `/login${params.size ? `?${params}` : ''}`;
}

export function registrationUrl(email, referralCode = '', preferredSide = '', resume = false) {
  const params = new URLSearchParams();
  const normalizedEmail = registrationEmail(email);
  if (normalizedEmail) params.set('email', normalizedEmail);
  const referral = typeof referralCode === 'string' ? referralCode.trim().slice(0, 64) : '';
  if (referral && !/[\u0000-\u0020\u007f]/.test(referral)) {
    params.set('ref', referral);
    if (['L', 'R'].includes(preferredSide)) params.set('side', preferredSide);
  }
  if (resume) params.set('resume', '1');
  return `/register${params.size ? `?${params}` : ''}`;
}
