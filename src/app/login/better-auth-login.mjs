export function betterAuthPasswordRequest(email, password) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (normalizedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) throw new Error('invalid_email');
  if (typeof password !== 'string' || password.length < 1 || password.length > 128) throw new Error('invalid_password');
  return { path: '/api/auth/sign-in/email', body: { email: normalizedEmail, password } };
}

export function betterAuthPasswordFailure(status, code = '') {
  if (status === 429) return 'Demasiados intentos. Espera antes de volver a entrar.';
  if (status >= 500) return 'El servicio de acceso no está disponible. Intenta más tarde.';
  if (code === 'EMAIL_NOT_VERIFIED') return 'Verifica tu correo de registro antes de entrar con contraseña.';
  return 'El correo o la contraseña no son correctos. Revisa tus datos o usa un código de acceso.';
}

// This flag is projected by the same-origin BFF only after validating Better
// Auth's verified-user/session-token contract. Sending a code is not proof.
export function verifiedEmailSignIn(payload, expectedEmail) {
  const email = typeof expectedEmail === 'string' ? expectedEmail.trim().toLowerCase() : '';
  return Boolean(email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    && payload && !Array.isArray(payload) && payload.ok === true && !payload.error && !payload.code
    && payload.user && typeof payload.user.id === 'string' && payload.user.id.trim().length > 0 && payload.user.id.length <= 128
    && payload.user.emailVerified === true && typeof payload.user.email === 'string'
    && payload.user.email.trim().toLowerCase() === email);
}

// Email ownership is not an approved member binding. Both sign-in methods must
// consult the canonical session endpoint, never sign-in response fields.
export async function betterAuthAccess(fetchImpl = fetch, expectedEmail = '') {
  try {
    const response = await fetchImpl('/api/auth/session', {
      credentials: 'same-origin', cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(12000),
    });
    const identity = await response.json().catch(() => ({}));
    if (!response.ok) return { ready: false, error: 'El servicio de autorización no está disponible. Intenta más tarde.' };
    if (identity.authenticated === true && identity.mode === 'better-auth') {
      if (expectedEmail && (typeof identity.email !== 'string'
          || identity.email.trim().toLowerCase() !== expectedEmail.trim().toLowerCase())) {
        return { ready: false, error: 'La sesión actual no corresponde al correo verificado. Usa el acceso para comprobar tu cuenta.' };
      }
      return { ready: true };
    }
    return { ready: false, notice: 'Tu correo está verificado. El acceso a tu cuenta de la red requiere revisión de identidad y aprobación de vinculación antes de continuar.' };
  } catch {
    return { ready: false, error: 'No pudimos comprobar tu acceso a la red. Revisa tu conexión e inténtalo otra vez.' };
  }
}
