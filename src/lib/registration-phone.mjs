// This proof is NOT a sign-in session. It is sent only to registration and
// consumed by the auth service, bound to email + verified phone, once.
import { runtimeEnvironment } from './cloudflare-runtime.mjs';

export const REGISTRATION_SMS_CONSENT = 'registration-phone-v1';
export const validRegistrationPhone = value => typeof value === 'string' && /^\+[1-9][0-9]{7,14}$/.test(value);
export const validRegistrationProof = value => typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value);
export const registrationSmsRequired = (env = runtimeEnvironment()) => env.BETTER_AUTH_REGISTRATION_SMS_REQUIRED === 'true';
export const registrationPhoneCookieName = secure => secure ? '__Secure-vp_registration_phone' : 'vp_registration_phone';

export function registrationPhoneProofCookie(proof, secure, clear = false) {
  if (!clear && !validRegistrationProof(proof)) throw new Error('invalid_registration_phone_proof');
  return `${registrationPhoneCookieName(secure)}=${clear ? '' : proof}; Path=/api/auth/register; HttpOnly; SameSite=Strict; Max-Age=${clear ? 0 : 300}${secure ? '; Secure' : ''}`;
}

export function registrationPhoneProof(value = '', secure = true) {
  if (typeof value !== 'string' || value.length > 16000 || /[\r\n]/.test(value)) return '';
  const name = registrationPhoneCookieName(secure);
  const matches = value.split(';').map(part => part.trim()).filter(part => part.startsWith(`${name}=`));
  // Ambiguous cookies must not select an attacker-controlled first/last value.
  if (matches.length !== 1) return '';
  const proof = matches[0].slice(name.length + 1);
  return validRegistrationProof(proof) ? proof : '';
}
