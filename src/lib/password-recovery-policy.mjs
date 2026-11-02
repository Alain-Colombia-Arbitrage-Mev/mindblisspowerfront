export const passwordRecoveryPaths = new Set(['email-otp/request-password-reset', 'email-otp/reset-password']);
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);

// This protocol deliberately has no account-existence/password-status query.
// A single email-owned reset can create a credential or replace an existing one.
export function passwordRecoveryInput(path, value) {
  if (!passwordRecoveryPaths.has(path) || !record(value)) return { error: 'INVALID_RECOVERY_REQUEST' };
  const email = typeof value.email === 'string' ? value.email.trim().toLowerCase() : '';
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'INVALID_EMAIL' };
  if (path === 'email-otp/request-password-reset') return { body: { email } };
  if (typeof value.otp !== 'string' || !/^\d{6}$/.test(value.otp)) return { error: 'INVALID_OTP' };
  if (typeof value.password !== 'string' || value.password.length < 12 || value.password.length > 128) return { error: 'INVALID_PASSWORD' };
  // Password bytes are never trimmed or normalized; caller-selected identities,
  // purposes, email changes, privileges and redirect targets are discarded.
  return { body: { email, otp: value.otp, password: value.password } };
}

export function passwordRecoveryAcknowledged(value) {
  return record(value) && value.success === true && Object.keys(value).length === 1;
}

const safeErrors = new Set(['INVALID_EMAIL', 'INVALID_OTP', 'OTP_EXPIRED', 'TOO_MANY_ATTEMPTS',
  'PASSWORD_TOO_SHORT', 'PASSWORD_TOO_LONG', 'INVALID_PASSWORD', 'INVALID_RECOVERY_REQUEST', 'TOO_MANY_REQUESTS']);
export function passwordRecoveryError(value) {
  return record(value) && safeErrors.has(value.code) ? value.code : 'PASSWORD_RECOVERY_FAILED';
}
