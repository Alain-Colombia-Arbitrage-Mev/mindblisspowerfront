import { referralLinkCode } from '../../lib/referral-links.mjs';

export const REGISTRATION_RESEND_SECONDS = 300;
// Registration confirmation includes native OTP verification and a separate
// private session proof. Login's shorter OTP exchange deadline is unchanged.
export function registrationTimeoutMs(action) {
  if (action === 'send') return 30000;
  if (action === 'confirm') return 20000;
  throw new Error('invalid_registration_action');
}
const REGISTRATION_PREFILL_KEY = 'mindbliss.registration-prefill.v1';
const REGISTRATION_PREFILL_TTL_MS = 5 * 60 * 1000;

// Only sign-in OTP requests and password sign-in use this explicit server
// decision. An invalid code, denied permission or outage is never a new account.
export function registrationRequired(status, payload) {
  return status === 400 && payload !== null && typeof payload === 'object'
    && !Array.isArray(payload) && payload.code === 'REGISTRATION_REQUIRED' && payload.ok !== true;
}

// This one-shot email is a convenience hint, never an identity or consent. Keep
// it out of the URL/history and do not fall back to persistent localStorage.
export function registrationRedirect(email, referralCode = '', preferredSide = '', browser = undefined, now = Date.now()) {
  try {
    const storage = browser?.sessionStorage;
    storage?.removeItem(REGISTRATION_PREFILL_KEY);
    const normalizedEmail = registrationEmail(email);
    if (normalizedEmail) storage?.setItem(REGISTRATION_PREFILL_KEY, JSON.stringify({ email: normalizedEmail, createdAt: now }));
  } catch { /* A blocked storage area must not prevent registration. */ }
  const destination = new URL(registrationUrl('', referralCode, preferredSide), 'https://registration.invalid');
  destination.searchParams.set('reason', 'registration-required');
  return `${destination.pathname}${destination.search}`;
}

export function consumeRegistrationPrefill(browser = undefined, now = Date.now()) {
  try {
    const storage = browser?.sessionStorage;
    const raw = storage?.getItem(REGISTRATION_PREFILL_KEY);
    storage?.removeItem(REGISTRATION_PREFILL_KEY);
    if (typeof raw !== 'string' || raw.length > 1024) return '';
    const hint = JSON.parse(raw);
    if (!hint || typeof hint !== 'object' || Array.isArray(hint) || !Number.isSafeInteger(hint.createdAt)
      || hint.createdAt > now || now - hint.createdAt > REGISTRATION_PREFILL_TTL_MS) return '';
    return registrationEmail(hint.email);
  } catch { return ''; }
}

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
  if (form.acceptsPrivacy !== true) errors.acceptsPrivacy = 'Debes autorizar el tratamiento de tus datos para registrarte.';
  return errors;
}

export function registrationAcknowledged(action, payload, email = '') {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload) || payload.error || payload.ok !== true || payload.mode !== 'better-auth') return false;
  if (action === 'register') return payload.email === registrationEmail(email) && payload.userConfirmed === false && payload.requiresConfirmation === true;
  if (action === 'confirm') return payload.userConfirmed === true && payload.needsLogin === false && payload.sessionEstablished === true
    && Object.keys(payload).length === 5 && ['ok', 'mode', 'userConfirmed', 'needsLogin', 'sessionEstablished'].every(key => Object.hasOwn(payload, key));
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
  const referralCode = referralLinkCode(params.get('ref'));
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
  if (status >= 500 && action === 'confirm') return 'No pudimos confirmar el resultado de la verificación. Si el código ya fue utilizado, abre «Entrar de forma segura» y solicita un código de acceso. No reintentaremos automáticamente.';
  if (status >= 500) return 'El servicio de registro no está disponible en este momento. Intenta más tarde.';
  if (status === 409 && action === 'register' && code === 'ACCOUNT_EXISTS') return 'Ya existe un acceso con este correo. Usa «Entrar de forma segura» para iniciar sesión o crear/restablecer tu contraseña. Si dejaste un registro pendiente, usa «Ya solicité mi registro: verificar correo». No se enviará otro código automáticamente.';
  if (action === 'confirm') return 'El código no es válido o ha vencido. Revísalo o solicita otro cuando termine la espera.';
  if (action === 'resend') return 'No pudimos solicitar el código. Revisa el correo e inténtalo de nuevo.';
  return 'No pudimos completar el registro. Revisa los datos o entra si ya tienes una cuenta.';
}

export function registrationLoginUrl(email, referralCode = '', preferredSide = '') {
  const params = new URLSearchParams();
  params.set('mode', 'code');
  const normalizedEmail = registrationEmail(email);
  if (normalizedEmail) params.set('email', normalizedEmail);
  const referral = referralLinkCode(referralCode);
  if (referral) {
    params.set('ref', referral);
    if (['L', 'R'].includes(preferredSide)) params.set('side', preferredSide);
  }
  return `/login${params.size ? `?${params}` : ''}`;
}

export function registrationUrl(email, referralCode = '', preferredSide = '', resume = false) {
  const params = new URLSearchParams();
  const normalizedEmail = registrationEmail(email);
  if (normalizedEmail) params.set('email', normalizedEmail);
  const referral = referralLinkCode(referralCode);
  if (referral) {
    params.set('ref', referral);
    if (['L', 'R'].includes(preferredSide)) params.set('side', preferredSide);
  }
  if (resume) params.set('resume', '1');
  return `/register${params.size ? `?${params}` : ''}`;
}
