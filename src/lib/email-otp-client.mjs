// Browser-only request contracts. Authentication stays in HttpOnly cookies;
// neither session tokens nor service JWTs are returned or stored here.
import { authRetryAfterSeconds } from './auth-retry-after.mjs';
export function otpRequest(provider, action, email, code = '') {
  const normalizedEmail = String(email).trim().toLowerCase();
  if (normalizedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('invalid_email');
  }
  if (!['send', 'confirm'].includes(action)) throw new Error('invalid_action');
  if (provider === 'better-auth') {
    if (action === 'send') return { path: '/api/auth/email-otp/send-verification-otp', body: { email: normalizedEmail, type: 'sign-in' } };
    const otp = String(code).replace(/[\s-]+/g, '');
    if (!/^\d{6}$/.test(otp)) throw new Error('invalid_code');
    return { path: '/api/auth/sign-in/email-otp', body: { email: normalizedEmail, otp } };
  }
  if (provider !== 'cognito') throw new Error('authentication_unavailable');
  return { path: `/api/auth/cognito/code-login/${action === 'send' ? 'request' : 'confirm'}`,
    body: action === 'send' ? { email: normalizedEmail, channel: 'email' } : { email: normalizedEmail, code } };
}

export function otpFailureMessage(status, action, code = '') {
  if (status === 429) return action === 'send'
    ? 'Demasiados intentos de envío. Si ya recibiste un código, puedes usarlo aquí. Para pedir otro, espera a que termine el contador.'
    : 'Demasiados intentos de verificación. Espera a que termine el contador para volver a validar el código.';
  if (status >= 500) return 'El servicio de acceso no está disponible. Intenta más tarde.';
  if (action === 'confirm' && ['INVALID_OTP', 'OTP_EXPIRED'].includes(code)) {
    return 'Código inválido o expirado. Usa el código de acceso más reciente; si venció o agotó sus intentos, espera el contador antes de solicitar otro. El código de prueba 123456 sólo funciona en el entorno local de desarrollo.';
  }
  return action === 'confirm' ? 'Código inválido o expirado. Usa el código de acceso más reciente; si venció o agotó sus intentos, espera el contador antes de solicitar otro.' : 'No se pudo solicitar el código. Revisa el correo original y vuelve a intentarlo cuando termine el contador, si aparece.';
}

// Code redemption and requesting another email have independent budgets. Only
// a server 429 pauses redemption; preserve the code and never retry or resend.
export function otpConfirmationRetrySeconds(response, now = Date.now()) {
  return authRetryAfterSeconds(response.headers?.get('retry-after'), 60, now);
}

// Give the single delivery request room to finish; never automatically resend
// after a timeout. Exchanging a received code retains its shorter deadline.
export function otpTimeoutMs(action) {
  if (action === 'send') return 30000;
  if (action === 'confirm') return 12000;
  // Sign-in redeems the code and verifies the native session in the same request.
  if (action === 'sign-in-confirm') return 20000;
  throw new Error('invalid_action');
}

export const OTP_SEND_NOTICE = 'Si tu cuenta está habilitada, busca el código de acceso en tu correo y revisa también la carpeta de spam. Si no aparece, espera a que termine el contador antes de solicitar otro. No lo compartas.';

// A lost/failed acknowledgement does not prove that no message was sent. This
// never claims delivery, account existence or permission to enter the network.
export const OTP_SEND_UNCONFIRMED_NOTICE = 'No pudimos confirmar el envío. Revisa tu correo y spam. Si recibes el código, introdúcelo aquí.';
