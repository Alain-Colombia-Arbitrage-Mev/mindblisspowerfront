// Signup is independent of the disabled legacy provider and financial services.
import { betterAuthEnabled, fetchBetterAuth, readAuthBody, trustedAuthClientIp } from './better-auth-bridge.mjs';
import { runtimeEnvironment } from './cloudflare-runtime.mjs';
import { registrationContact } from './registration-contacts.mjs';

const headers = { 'Cache-Control': 'private, no-store' };
const emailValue = value => typeof value === 'string' ? value.trim().toLowerCase() : '';
const validEmail = value => value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const reply = (body, status = 200, extra = {}) => Response.json(body, { status, headers: { ...headers, ...extra } });

function registrationInput(body) {
  const email = emailValue(body.email);
  const name = typeof body.fullName === 'string' ? body.fullName.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!validEmail(email)) return { error: 'Ingresa un correo válido.', field: 'email' };
  if (name.length < 2 || name.length > 120 || /[\u0000-\u001f\u007f]/.test(name)) return { error: 'Escribe tu nombre completo (2 a 120 caracteres).', field: 'fullName' };
  if (password.length < 12 || password.length > 128) return { error: 'Usa una contraseña de 12 a 128 caracteres.', field: 'password' };
  if (body.acceptsPrivacy !== true) return { error: 'Debes aceptar la política de privacidad para continuar.', field: 'acceptsPrivacy' };
  const referral = typeof body.referralCode === 'string' ? body.referralCode.trim() : '';
  const side = typeof body.preferredSide === 'string' ? body.preferredSide.trim().toUpperCase() : '';
  if (referral.length > 64 || /[\u0000-\u0020\u007f]/.test(referral)) return { error: 'Revisa el código de referido.', field: 'referralCode' };
  if (side && !['L', 'R'].includes(side)) return { error: 'Revisa la preferencia de lado.', field: 'preferredSide' };
  const contacts = {};
  for (const field of ['contactPhone', 'contactWhatsapp']) {
    try {
      const number = registrationContact(body[field]);
      if (number) contacts[field] = number;
    } catch {
      return { error: 'Revisa el número de contacto y su código de país.', field };
    }
  }
  return { email, name, password, referral, contacts };
}

async function upstreamResult(upstream) {
  // A deadline covers the body too; a stalled JSON stream cannot hold a Worker.
  const payload = await readAuthBody({ body: upstream.body, signal: AbortSignal.timeout(8000) });
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('invalid_auth_response');
  return payload;
}

function upstreamError(upstream, payload) {
  const code = typeof payload.code === 'string' && /^[A-Z_]{1,80}$/.test(payload.code) ? payload.code : '';
  if (upstream.status === 429) {
    const raw = upstream.headers.get('retry-after');
    const retryAfter = /^\d{1,5}$/.test(raw || '') ? Math.max(1, Number(raw)) : 300;
    return reply({ error: 'Espera antes de solicitar otro código. Revisa también spam y promociones.', retryAfter, code: 'RATE_LIMITED' }, 429, { 'Retry-After': String(retryAfter) });
  }
  if (/USER_ALREADY_EXISTS|EMAIL_ALREADY_EXISTS/.test(code)) return reply({
    error: 'No se pudo crear una cuenta nueva con este correo. Puedes iniciar sesión o verificar un registro pendiente.',
    code: 'ACCOUNT_EXISTS', accountExists: true, needsLogin: true,
  }, 409);
  if (code === 'REGISTRATION_NOT_ALLOWED') return reply({ error: 'No es posible completar este registro. Contacta al soporte para revisar tu acceso.', code }, 403);
  if (upstream.status >= 500 || upstream.status < 400) return reply({ error: 'El registro no está disponible temporalmente. Intenta de nuevo.', code: 'REGISTRATION_UNAVAILABLE' }, 503);
  return reply({ error: 'No se pudo completar la solicitud. Revisa los datos o solicita un código nuevo cuando termine la espera.', code: code || 'REGISTRATION_FAILED' }, upstream.status);
}

/** Narrow same-origin BFF. Never accepts role/person IDs or returns a token. */
export async function handleRegistration(request, action = 'register', dependencies = {}) {
  const env = dependencies.env || runtimeEnvironment();
  if (!betterAuthEnabled(env) || !['register', 'confirm'].includes(action) || request.method !== 'POST') return reply({ error: 'not_found' }, 404);
  const origin = env.AUTH_PUBLIC_ORIGIN || new URL(request.url).origin;
  if (request.headers.get('origin') !== origin) return reply({ error: 'invalid_origin' }, 403);
  let body;
  try {
    body = await readAuthBody(request);
    if (!body || typeof body !== 'object' || Array.isArray(body)) return reply({ error: 'invalid_json' }, 400);
  } catch (error) { return reply({ error: error instanceof RangeError ? 'request_too_large' : 'invalid_json' }, error instanceof RangeError ? 413 : 400); }
  try {
    const transport = { ...dependencies, env, clientIp: trustedAuthClientIp(request.headers, env) };
    if (action === 'register') {
      const input = registrationInput(body);
      if (input.error) return reply(input, 400);
      // The backend performs its authoritative read-only blacklist check before
      // creating auth.user. Referral hints do not grant a sponsor or tree node.
      const upstream = await fetchBetterAuth('/sign-up/email', { method: 'POST', origin, signal: request.signal,
        body: { name: input.name, email: input.email, password: input.password, ...input.contacts },
      }, transport);
      const data = await upstreamResult(upstream);
      if (!upstream.ok) return upstreamError(upstream, data);
      if (!data.user || typeof data.user.id !== 'string' || emailValue(data.user.email) !== input.email
          || data.user.emailVerified !== false || data.token) throw new Error('unexpected_signup_result');
      return reply({ ok: true, mode: 'better-auth', email: input.email, userConfirmed: false,
        requiresConfirmation: true, resendAfter: 300, referralReviewRequired: Boolean(input.referral),
        delivery: { DeliveryMedium: 'EMAIL', Destination: input.email.replace(/^(.)(.*)(@.*)$/, '$1***$3') } }, 201);
    }
    const email = emailValue(body.email);
    if (!validEmail(email)) return reply({ error: 'Ingresa un correo válido.', field: 'email' }, 400);
    if (body.resend !== undefined && typeof body.resend !== 'boolean') return reply({ error: 'invalid_request' }, 400);
    const resend = body.resend === true;
    const code = typeof body.code === 'string' ? body.code.replace(/[\s-]+/g, '') : '';
    if (!resend && !/^\d{6}$/.test(code)) return reply({ error: 'Ingresa el código de seis dígitos recibido por correo.', field: 'code' }, 400);
    const upstream = await fetchBetterAuth(resend ? '/email-otp/send-verification-otp' : '/email-otp/verify-email', {
      method: 'POST', origin, signal: request.signal,
      body: resend ? { email, type: 'email-verification' } : { email, otp: code },
    }, transport);
    const data = await upstreamResult(upstream);
    if (!upstream.ok) return upstreamError(upstream, data);
    if (resend) {
      if (data.success !== true) throw new Error('invalid_resend_response');
      return reply({ ok: true, mode: 'better-auth', resendAfter: 300 });
    }
    if (data.status !== true || data.token) throw new Error('invalid_verification_response');
    // Verification deliberately does not authenticate or claim a legacy node.
    return reply({ ok: true, mode: 'better-auth', userConfirmed: true, needsLogin: true,
      redirectTo: `/login?email=${encodeURIComponent(email)}&registered=1` });
  } catch { return reply({ error: 'El registro no está disponible temporalmente. Intenta de nuevo.', code: 'REGISTRATION_UNAVAILABLE' }, 503); }
}
