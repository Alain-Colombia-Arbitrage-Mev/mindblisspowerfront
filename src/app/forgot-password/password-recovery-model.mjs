export const PASSWORD_RECOVERY_RESEND_SECONDS = 300;
export const PASSWORD_RECOVERY_NOTICE = 'Si el correo corresponde a una cuenta habilitada, recibirás un código para crear o cambiar tu contraseña. Revisa también spam o correo no deseado.';
export const PASSWORD_RECOVERY_UNCONFIRMED = 'No pudimos confirmar el envío. Si recibes un código, introdúcelo aquí. No enviaremos otro automáticamente; espera antes de solicitarlo de nuevo.';

export function passwordRecoveryEmail(value) {
  if (typeof value !== 'string') return '';
  const email = value.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

export function passwordRecoveryErrors({ email, otp = '', password = '', confirmPassword = '' }, action = 'confirm') {
  /** @type {Record<string, string>} */
  const errors = {};
  if (!passwordRecoveryEmail(email)) errors.email = 'Ingresa el correo original de tu cuenta.';
  if (action === 'confirm') {
    if (typeof otp !== 'string' || !/^[0-9]{6}$/.test(otp)) errors.otp = 'Ingresa los 6 dígitos del código recibido por correo.';
    if (typeof password !== 'string' || password.length < 12 || password.length > 128) errors.password = 'Usa una contraseña de entre 12 y 128 caracteres.';
    if (confirmPassword !== password) errors.confirmPassword = 'Las contraseñas no coinciden.';
  }
  return errors;
}

export function passwordRecoveryRequest(action, input) {
  if (!['request', 'confirm'].includes(action) || Object.keys(passwordRecoveryErrors(input, action)).length) throw new Error('invalid_password_recovery');
  const email = passwordRecoveryEmail(input.email);
  return action === 'request'
    ? { path: '/api/auth/email-otp/request-password-reset', body: { email } }
    : { path: '/api/auth/email-otp/reset-password', body: { email, otp: input.otp, password: input.password } };
}

// An acknowledgement is specific to the called endpoint. It proves neither a
// public account lookup nor a session, network binding or changed email.
export function passwordRecoveryAcknowledged(payload) {
  return payload !== null && typeof payload === 'object' && !Array.isArray(payload)
    && Object.keys(payload).length === 1 && Object.hasOwn(payload, 'ok') && payload.ok === true;
}

export function passwordRecoveryRetrySeconds(response, payload = {}) {
  const supplied = Number(response.headers?.get('retry-after') || payload?.retryAfter || payload?.retryAfterSec);
  return Number.isFinite(supplied) && supplied > 0
    ? Math.max(PASSWORD_RECOVERY_RESEND_SECONDS, Math.min(86400, Math.ceil(supplied)))
    : PASSWORD_RECOVERY_RESEND_SECONDS;
}

// A rate-limited code redemption is independent of the resend budget. A user
// may redeem a received code while resend is cooling down, but must honor a
// separate server 429 without losing their code or submitting automatically.
export function passwordRecoveryConfirmationRetrySeconds(response, payload = {}, now = Date.now()) {
  const header = response.headers?.get('retry-after');
  const value = header || payload?.retryAfter || payload?.retryAfterSec;
  const supplied = Number(value);
  const seconds = Number.isFinite(supplied) ? supplied : header ? (Date.parse(header) - now) / 1000 : NaN;
  return Number.isFinite(seconds) && seconds > 0 ? Math.min(86400, Math.ceil(seconds)) : 60;
}

export function passwordRecoveryFailure(status, action = 'confirm') {
  if (status === 429) return 'Demasiados intentos. Espera antes de volver a intentarlo.';
  if (status >= 500) return action === 'confirm'
    ? 'No pudimos confirmar el cambio. Prueba iniciar sesión con la nueva contraseña antes de repetir la solicitud.'
    : PASSWORD_RECOVERY_UNCONFIRMED;
  return action === 'confirm'
    ? 'No pudimos cambiar la contraseña. Revisa el código y los datos. Si el problema continúa, contacta al soporte sin compartir el código.'
    : 'No pudimos solicitar la recuperación. Revisa el correo e inténtalo de nuevo.';
}
