// Validate the installed Better Auth contracts before confirming an operation.
// Provider/session tokens are deliberately omitted from the public projection.
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const bounded = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
const email = value => bounded(value, 254) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export function authSuccess(path, data) {
  if (!record(data) || data.error || data.code) throw new Error('invalid_auth_response');
  if (['sign-in/email', 'sign-in/email-otp'].includes(path)) {
    if (!record(data.user) || !bounded(data.user.id, 128) || !email(data.user.email)
        || data.user.emailVerified !== true || !bounded(data.token, 16000)
        || (data.user.name != null && (typeof data.user.name !== 'string' || data.user.name.length > 512))) {
      throw new Error('invalid_auth_response');
    }
    return { ok: true, user: { id: data.user.id, email: data.user.email, name: data.user.name ?? null } };
  }
  if (['sign-out', 'email-otp/send-verification-otp', 'email-otp/request-password-reset', 'email-otp/reset-password'].includes(path)) {
    if (data.success !== true) throw new Error('invalid_auth_response');
    return { ok: true };
  }
  if (['send-verification-email', 'email-otp/verify-email'].includes(path)) {
    if (data.status !== true) throw new Error('invalid_auth_response');
    return { ok: true };
  }
  throw new Error('invalid_auth_path');
}
