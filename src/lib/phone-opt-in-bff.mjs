// A narrow same-origin bridge for optional SMS verification. The backend owns
// session checks, consent persistence, challenges and the final phone binding.
import { betterAuthCookies, betterAuthEnabled, fetchBetterAuth, readAuthBody, trustedAuthClientIp } from './better-auth-bridge.mjs';
import { runtimeEnvironment } from './cloudflare-runtime.mjs';

export const SMS_CONSENT_VERSION = 'sms-auth-v1';
const validPhone = value => typeof value === 'string' && /^\+[1-9][0-9]{7,14}$/.test(value);
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const response = (body, status = 200, extra = {}) => Response.json(body, {
  status, headers: { 'Cache-Control': 'private, no-store', ...extra },
});
const paths = new Set(['phone-number/opt-in', 'phone-number/send-otp', 'phone-number/verify', 'phone-number/revoke-consent']);

function inputFor(path, body) {
  if (!record(body)) throw new TypeError('invalid_request');
  if (path === 'phone-number/revoke-consent') return {};
  if (!validPhone(body.phoneNumber)) throw new TypeError('invalid_phone');
  if (path === 'phone-number/send-otp') {
    if (body.consent !== true || body.consentVersion !== SMS_CONSENT_VERSION) throw new TypeError('sms_consent_required');
    return { phoneNumber: body.phoneNumber, consent: true, consentVersion: SMS_CONSENT_VERSION };
  }
  if (typeof body.code !== 'string' || !/^\d{6}$/.test(body.code)
      || body.updatePhoneNumber !== true || body.disableSession !== true) throw new TypeError('invalid_verification');
  return { phoneNumber: body.phoneNumber, code: body.code, updatePhoneNumber: true, disableSession: true };
}

function project(path, data) {
  if (!record(data) || data.error || data.code) throw new Error('invalid_auth_response');
  if (path === 'phone-number/opt-in') {
    if (typeof data.available !== 'boolean' || typeof data.optedIn !== 'boolean'
        || typeof data.phoneNumberVerified !== 'boolean' || data.consentVersion !== SMS_CONSENT_VERSION
        || !(data.phoneNumber === null || validPhone(data.phoneNumber))
        || (data.phoneNumberVerified && !validPhone(data.phoneNumber))) throw new Error('invalid_auth_response');
    return { available: data.available, consentVersion: data.consentVersion, optedIn: data.optedIn,
      phoneNumber: data.phoneNumber, phoneNumberVerified: data.phoneNumberVerified };
  }
  if (data.ok !== true) throw new Error('invalid_auth_response');
  if (path === 'phone-number/send-otp') {
    if (!Number.isSafeInteger(data.resendAfter) || data.resendAfter < 60 || data.resendAfter > 3600) throw new Error('invalid_auth_response');
    return { ok: true, resendAfter: data.resendAfter };
  }
  if (path === 'phone-number/verify') {
    if (data.phoneNumberVerified !== true || data.optedIn !== true) throw new Error('invalid_auth_response');
    return { ok: true, phoneNumberVerified: true, optedIn: true };
  }
  if (data.optedIn !== false) throw new Error('invalid_auth_response');
  return { ok: true, optedIn: false };
}

export async function proxyPhoneOptIn(request, path, dependencies = {}) {
  const env = dependencies.env || runtimeEnvironment();
  if (!betterAuthEnabled(env) || !paths.has(path)
      || request.method !== (path === 'phone-number/opt-in' ? 'GET' : 'POST')) return response({ error: 'not_found' }, 404);
  const origin = env.AUTH_PUBLIC_ORIGIN || new URL(request.url).origin;
  if ((request.method === 'POST' && request.headers.get('origin') !== origin)
      || request.headers.get('sec-fetch-site') === 'cross-site') return response({ error: 'invalid_origin' }, 403);
  const cookie = request.headers.get('cookie') || '';
  if (!betterAuthCookies(cookie)) return response({ error: 'authentication_required' }, 401);
  let body;
  if (request.method === 'POST') {
    try { body = inputFor(path, await readAuthBody(request)); }
    catch (error) {
      return response({ error: error instanceof TypeError ? error.message : error instanceof RangeError ? 'request_too_large' : 'invalid_json' },
        error instanceof RangeError ? 413 : 400);
    }
  }
  try {
    const upstream = await fetchBetterAuth('/' + path, {
      method: request.method, origin, cookie, body, signal: request.signal,
    }, { ...dependencies, env, clientIp: trustedAuthClientIp(request.headers, env) });
    const data = await readAuthBody({ body: upstream.body, signal: request.signal });
    if (!upstream.ok) {
      const status = [400, 401, 403, 404, 409, 429].includes(upstream.status) ? upstream.status : 503;
      const raw = upstream.headers.get('retry-after');
      const retryAfter = /^\d{1,5}$/.test(raw || '') ? Math.max(1, Number(raw)) : 60;
      return response({ error: status === 401 ? 'authentication_required' : status === 404 ? 'sms_unavailable'
        : status === 429 ? 'rate_limited' : status >= 500 ? 'authentication_unavailable' : 'phone_verification_failed',
      ...(status === 429 ? { retryAfter } : {}) }, status, status === 429 ? { 'Retry-After': String(retryAfter) } : {});
    }
    // Never relay a token, JWT header, role, session cookie or internal error.
    return response(project(path, data));
  } catch { return response({ error: 'authentication_unavailable' }, 503); }
}
