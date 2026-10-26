// Browser-only request contracts. Authentication stays in HttpOnly cookies;
// neither session tokens nor service JWTs are returned or stored here.
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

export function otpFailureMessage(status, action) {
  if (status === 429) return 'Demasiados intentos. Espera un momento antes de volver a intentar.';
  if (status >= 500) return 'El servicio de acceso no está disponible. Intenta más tarde.';
  return action === 'confirm' ? 'Código inválido o expirado. Revisa el último correo recibido.' : 'No se pudo solicitar el código. Intenta de nuevo.';
}

export const OTP_SEND_NOTICE = 'Si tu cuenta está habilitada, recibirás un código por correo. Revisa también la carpeta de spam.';
