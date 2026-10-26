import { betterAuthEnabled, fetchBetterAuth, readAuthBody, trustedAuthClientIp } from './better-auth-bridge.mjs';
import { runtimeEnvironment } from './cloudflare-runtime.mjs';
import { REGISTRATION_SMS_CONSENT, registrationSmsRequired, registrationPhoneProofCookie,
  validRegistrationPhone, validRegistrationProof } from './registration-phone.mjs';

const reply = (body, status = 200, extra = {}) => Response.json(body, {
  status, headers: { 'Cache-Control': 'private, no-store', ...extra },
});
const emailValue = value => typeof value === 'string' ? value.trim().toLowerCase() : '';
const validEmail = value => value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const validFlow = value => typeof value === 'string' && /^[A-Za-z0-9_-]{22,80}$/.test(value);

/** Exact-purpose, same-origin BFF. No login, account discovery or SMS fallback. */
export async function handleRegistrationPhone(request, action, dependencies = {}) {
  const env = dependencies.env || runtimeEnvironment();
  if (!betterAuthEnabled(env) || !registrationSmsRequired(env) || request.method !== 'POST'
    || !['send', 'verify'].includes(action)) return reply({ error: 'not_found' }, 404);
  const origin = env.AUTH_PUBLIC_ORIGIN || new URL(request.url).origin;
  if (request.headers.get('origin') !== origin) return reply({ error: 'invalid_origin' }, 403);
  const secure = new URL(origin).protocol === 'https:';
  let body;
  try {
    body = await readAuthBody(request);
    if (!body || typeof body !== 'object' || Array.isArray(body)) return reply({ error: 'invalid_request' }, 400);
  } catch (error) { return reply({ error: error instanceof RangeError ? 'request_too_large' : 'invalid_request' }, error instanceof RangeError ? 413 : 400); }
  const email = emailValue(body.email);
  const phoneNumber = body.phoneNumber;
  if (!validEmail(email) || !validRegistrationPhone(phoneNumber)) return reply({ error: 'invalid_registration_phone' }, 400);
  if (action === 'send' && (body.consent !== true || body.consentVersion !== REGISTRATION_SMS_CONSENT)) {
    return reply({ error: 'registration_sms_consent_required' }, 400);
  }
  if (action === 'verify' && (!validFlow(body.flowId) || typeof body.code !== 'string' || !/^\d{6}$/.test(body.code))) {
    return reply({ error: 'invalid_registration_code' }, 400);
  }
  try {
    // Never forward browser cookies, user IDs, verified flags or provider URLs.
    const upstream = await fetchBetterAuth(`/registration/phone/${action}`, { method: 'POST', origin, signal: request.signal,
      body: action === 'send' ? { email, phoneNumber, consent: true, consentVersion: REGISTRATION_SMS_CONSENT }
        : { email, phoneNumber, flowId: body.flowId, code: body.code },
    }, { ...dependencies, env, clientIp: trustedAuthClientIp(request.headers, env) });
    const payload = await readAuthBody({ body: upstream.body, signal: request.signal });
    if (!upstream.ok) {
      if (upstream.status === 429) {
        const raw = upstream.headers.get('retry-after');
        const retryAfter = /^\d{1,5}$/.test(raw || '') ? Math.max(60, Number(raw)) : 60;
        return reply({ error: 'registration_sms_rate_limited', retryAfter }, 429, { 'Retry-After': String(retryAfter) });
      }
      return reply({ error: upstream.status >= 500 || upstream.status < 400 ? 'registration_sms_unavailable' : 'registration_sms_failed' },
        upstream.status >= 500 || upstream.status < 400 ? 503 : upstream.status);
    }
    if (!payload || typeof payload !== 'object' || Array.isArray(payload) || payload.error || payload.ok !== true
      || payload.token || payload.session || payload.authenticated) throw new Error('invalid_registration_phone_ack');
    if (action === 'send') {
      if (!validFlow(payload.flowId) || payload.resendAfter !== 60 || payload.expiresIn !== 300) throw new Error('invalid_registration_phone_ack');
      return reply({ ok: true, flowId: payload.flowId, resendAfter: 60, expiresIn: 300 }, 200,
        { 'Set-Cookie': registrationPhoneProofCookie('', secure, true) });
    }
    if (payload.verified !== true || payload.purpose !== 'registration' || payload.email !== email
      || payload.phoneNumber !== phoneNumber || !validRegistrationProof(payload.proof)) throw new Error('invalid_registration_phone_ack');
    return reply({ ok: true, verified: true, purpose: 'registration', email, phoneNumber }, 200,
      { 'Set-Cookie': registrationPhoneProofCookie(payload.proof, secure) });
  } catch {
    return reply({ error: 'registration_sms_unavailable' }, 503);
  }
}
