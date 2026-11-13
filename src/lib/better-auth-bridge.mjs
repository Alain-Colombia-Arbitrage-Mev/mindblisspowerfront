// Server transport only. No credentials, OTPs, sessions or JWTs are logged.
import { createHash, createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import { authSuccess } from './auth-response.mjs';
import { passwordRecoveryPaths, passwordRecoveryInput, passwordRecoveryAcknowledged, passwordRecoveryError } from './password-recovery-policy.mjs';
import { coreFetch, runtimeEnvironment } from './cloudflare-runtime.mjs';
import { authRetryAfterSeconds } from './auth-retry-after.mjs';

export function trustedAuthClientIp(headers, env = runtimeEnvironment()) {
  const header = env.AUTH_CLIENT_IP_HEADER || 'cf-connecting-ip';
  if (!['cf-connecting-ip', 'x-real-ip'].includes(header)) throw new Error('trusted_proxy_required');
  const ip = headers.get(header) || '';
  if (isIP(ip)) return ip;
  if (env.NODE_ENV !== 'production') return '127.0.0.1';
  throw new Error('trusted_proxy_required');
}
export function betterAuthEnabled(env = runtimeEnvironment()) {
  return env.AUTH_PROVIDER === "better-auth";
}

const supportedSocialProviders = new Set(['google', 'apple']);

export function betterAuthSocialProviders(env = runtimeEnvironment()) {
  if (!betterAuthEnabled(env)) return [];
  const configured = String(env.AUTH_SOCIAL_PROVIDERS || '').split(',')
    .map(provider => provider.trim().toLowerCase()).filter(provider => supportedSocialProviders.has(provider));
  return [...new Set(configured)];
}

export function betterAuthSocialProviderEnabled(provider, env = runtimeEnvironment()) {
  return supportedSocialProviders.has(provider) && betterAuthSocialProviders(env).includes(provider);
}

export class AuthServiceUnavailable extends Error {
  constructor() { super('authentication_unavailable'); this.name = 'AuthServiceUnavailable'; }
}

// A native session may be valid while its canonical member binding is denied.
// This is not a missing cookie or permission to enter the private dashboard.
export class AuthAccessRestricted extends Error {
  constructor() { super('account_access_restricted'); this.name = 'AuthAccessRestricted'; }
}

export function betterAuthConfig(env = runtimeEnvironment()) {
  if (!betterAuthEnabled(env)) throw new Error("better_auth_disabled");
  if ((env.AUTH_BFF_SHARED_SECRET || '').length < 32) throw new Error('auth_proxy_secret_required');
  const base = new URL(env.BETTER_AUTH_BACKEND_URL || "");
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(base.hostname);
  if (base.username || base.password || base.search || base.hash || base.pathname !== "/"
      || (base.protocol !== "https:" && !(env.NODE_ENV !== "production" && local && base.protocol === "http:"))) {
    throw new Error("better_auth_configuration_invalid");
  }
  return base.origin;
}

const authCookie = /^(?:__Secure-)?better-auth\.(?:session_token|session_data|dont_remember|state|oauth_state)$/;
export function betterAuthCookies(value = "") {
  if (/[\r\n]/.test(value)) return "";
  return value.split(";").map(part => part.trim()).filter(part => authCookie.test(part.split("=")[0])).join("; ");
}

export function browserAuthCookie(value, secure = false) {
  if (/[\r\n]/.test(value) || !authCookie.test(value.split("=")[0])) return null;
  const parts = value.split(";").filter((part, i) => i === 0 || !/^\s*(?:domain|path)=/i.test(part));
  // Host-only cookie: the auth service cannot grant cookies to another domain.
  return `${parts.join(";")}; Path=/; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`;
}

export async function readAuthBody(request) {
  const reader = request.body?.getReader();
  if (!reader) return {};
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(8000)]);
  const aborted = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener('abort', aborted, { once: true });
  try {
  if (signal.aborted) { aborted(); throw new DOMException('Request cancelled', 'AbortError'); }
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (signal.aborted) throw new DOMException('Request cancelled', 'AbortError');
    if (done) break;
    total += value.byteLength;
    if (total > 32768) { await reader.cancel(); throw new RangeError("body_too_large"); }
    chunks.push(value);
  }
  const combined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { combined.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder().decode(combined));
  } finally { signal.removeEventListener('abort', aborted); reader.releaseLock(); }
}

// A WAF can return HTML (or malformed JSON) with HTTP 429. Its status and wait
// remain authoritative, but none of its body or cookies may reach the browser.
export async function readAuthUpstreamBody(upstream, signal) {
  const limited = upstream.status === 429;
  if (limited && !/^application\/json(?:\s*;|$)/i.test(upstream.headers.get('content-type') || '')) {
    try { void upstream.body?.cancel().catch(() => {}); } catch { /* best effort, never await an untrusted body */ }
    return {};
  }
  try {
    const data = await readAuthBody({ body: upstream.body, signal: signal || AbortSignal.timeout(8000) });
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('invalid_auth_response');
    return data;
  } catch (error) {
    if (limited) return {};
    throw error;
  }
}

// Email delivery and registration verification include Container startup and
// PostgreSQL work. Verification's transaction can exceed the short read budget:
// aborting it at 8s can discard a session after its OTP has already been consumed.
// Keep reads and sign-in exchanges short; never retry a mutation on timeout.
const emailDeliveryPaths = new Set(['/sign-up/email', '/email-otp/send-verification-otp',
  '/send-verification-email', '/email-otp/request-password-reset']);
export const betterAuthTimeoutMs = path => emailDeliveryPaths.has(path) || path === '/email-otp/verify-email' ? 20000 : 8000;

/** @param {string} path
 * @param {{cookie?: string, method?: string, body?: unknown, origin?: string, signal?: AbortSignal, query?: string}} [options]
 */
export async function fetchBetterAuth(path, { cookie = "", method = "GET", body, origin, signal, query = '' } = {},
  { env = runtimeEnvironment(), fetchImpl = coreFetch, clientIp = '' } = {}) {
  const base = betterAuthConfig(env);
  if (!/^\/[a-z0-9/-]+$/.test(path)) throw new Error("invalid_auth_path");
  if (query && (!query.startsWith('?') || query.length > 8192 || /[\r\n#]/.test(query))) throw new Error('invalid_auth_query');
  if (!isIP(clientIp)) throw new Error('trusted_proxy_required');
  const serialized = body ? JSON.stringify(body) : '';
  const sessionCookie = betterAuthCookies(cookie);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const hash = value => createHash('sha256').update(value).digest('hex');
  const signature = createHmac('sha256', env.AUTH_BFF_SHARED_SECRET).update([method, `/api/auth${path}`, timestamp, clientIp, hash(sessionCookie), hash(serialized)].join('\n')).digest('hex');
  const deadline = AbortSignal.timeout(betterAuthTimeoutMs(path));
  return fetchImpl(`${base}/api/auth${path}${query}`, {
    method, redirect: "manual", cache: "no-store",
    signal: signal ? AbortSignal.any([signal, deadline]) : deadline,
    headers: { cookie: sessionCookie, 'x-vp-auth-client-ip': clientIp, 'x-vp-auth-timestamp': timestamp, 'x-vp-auth-signature': signature,
      ...(origin ? { origin } : {}), ...(body ? { "content-type": "application/json" } : {}) },
    body: serialized || undefined,
  });
}

async function confirmCanonicalAccessDenial(response) {
  if (!/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type') || '')) throw new AuthServiceUnavailable();
  const denial = await readAuthBody({ body: response.body, signal: AbortSignal.timeout(8000) });
  if (denial?.code !== 'AUTH_IDENTITY_REVIEW_REQUIRED') throw new AuthServiceUnavailable();
}

async function confirmMissingNativeSession(cookie, dependencies) {
  // Native token middleware can swallow a session-storage failure into401.
  // Its direct session endpoint preserves that error. Only native200/null is
  // confirmed absence; a non-null session does not authorize a service JWT.
  // This is one bounded read of the same cookie, never a token/send retry.
  const response = await fetchBetterAuth('/get-session', { cookie }, dependencies);
  if (response.status !== 200 || !/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type') || '')) {
    throw new AuthServiceUnavailable();
  }
  if (await readAuthBody({ body: response.body, signal: AbortSignal.timeout(8000) }) !== null) throw new AuthServiceUnavailable();
}

// Session-authorized JWT stays on the server. It is not a replacement browser cookie.
export async function betterAuthServiceToken(cookie, dependencies = {}) {
  if (!betterAuthCookies(cookie).split(';').some(part => /^(?:__Secure-)?better-auth\.session_token=[^;\s,]+$/.test(part.trim()))) return "";
  let stage = 'transport';
  /** @type {number | 'unavailable'} */
  let status = 'unavailable';
  const observe = () => {
    // Only fixed stages and bounded HTTP integers leave this request. Logging
    // must never expose token/context data or change the existing auth result.
    try { console.warn(JSON.stringify({ event: 'auth_service_token', stage, status })); } catch { /* best effort */ }
  };
  try {
    const response = await fetchBetterAuth("/token", { cookie }, dependencies);
    if ([401, 403].includes(response.status)) {
      stage = 'endpoint'; status = response.status;
      if (response.status === 401 && dependencies.strictAccess === true) await confirmMissingNativeSession(cookie, dependencies);
      if (response.status === 403 && dependencies.strictAccess === true) {
        await confirmCanonicalAccessDenial(response);
        throw new AuthAccessRestricted();
      }
      observe();
      return "";
    }
    if (!response.ok) {
      stage = 'endpoint';
      status = Number.isInteger(response.status) && response.status >= 100 && response.status <= 599 ? response.status : 'unavailable';
      throw new AuthServiceUnavailable();
    }
    stage = 'response';
    const payload = await readAuthBody({ body: response.body, signal: AbortSignal.timeout(8000) });
    if (!payload || typeof payload.token !== 'string' || !payload.token || payload.token.length > 16000) throw new AuthServiceUnavailable();
    return payload.token;
  } catch (error) {
    if (error?.name === 'AbortError' || error?.name === 'TimeoutError') { stage = 'transport'; status = 'unavailable'; }
    observe();
    if (error instanceof AuthAccessRestricted) throw error;
    throw new AuthServiceUnavailable();
  }
}

export const browserAuthPaths = new Set([
  "sign-in/email", "sign-in/email-otp", "sign-out",
  "email-otp/send-verification-otp", "email-otp/verify-email",
  "email-otp/request-password-reset", "email-otp/reset-password",
  "send-verification-email",
]);

const socialAuthorizationOrigins = {
  google: 'https://accounts.google.com',
  apple: 'https://appleid.apple.com',
};

function validSocialAuthorizationURL(provider, value) {
  try {
    const url = new URL(value);
    return !url.username && !url.password && !url.hash
      && url.origin === socialAuthorizationOrigins[provider]
      && (provider !== 'apple' || url.pathname === '/auth/authorize')
      && (provider !== 'google' || url.pathname.startsWith('/o/oauth2/'));
  } catch { return false; }
}

function socialFailureRedirect(origin) {
  return new URL('/login?auth=social-failed', origin).toString();
}

function authSetCookies(upstream, env) {
  const issued = upstream.headers.getSetCookie();
  if (issued.length > 8) throw new Error('invalid_social_cookies');
  return issued.map(value => browserAuthCookie(value, env.NODE_ENV === 'production')).filter(Boolean);
}

export async function proxyBetterAuthSocialStart(request, dependencies = {}) {
  const env = dependencies.env || runtimeEnvironment();
  const headers = { 'Cache-Control': 'private, no-store' };
  if (!betterAuthEnabled(env) || request.method !== 'POST') return Response.json({ error: 'not_found' }, { status: 404, headers });
  const expectedOrigin = env.AUTH_PUBLIC_ORIGIN || new URL(request.url).origin;
  if (request.headers.get('origin') !== expectedOrigin
    || new URL(request.url).search || request.headers.has('content-encoding')
    || !/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || '')) {
    return Response.json({ error: 'invalid_social_request' }, { status: 400, headers });
  }
  try {
    const body = await readAuthBody(request);
    const keys = body && typeof body === 'object' && !Array.isArray(body) ? Object.keys(body) : [];
    const provider = keys.length === 1 && keys[0] === 'provider' && typeof body.provider === 'string'
      ? body.provider.trim().toLowerCase() : '';
    if (!betterAuthSocialProviderEnabled(provider, env)) {
      return Response.json({ error: 'provider_unavailable' }, { status: 404, headers });
    }
    const transport = { ...dependencies, clientIp: trustedAuthClientIp(request.headers, env) };
    const upstream = await fetchBetterAuth('/sign-in/social', {
      method: 'POST', origin: expectedOrigin, cookie: request.headers.get('cookie') || '', signal: request.signal,
      body: {
        provider,
        callbackURL: new URL('/dashboard', expectedOrigin).toString(),
        errorCallbackURL: socialFailureRedirect(expectedOrigin),
        disableRedirect: true,
      },
    }, transport);
    const data = await readAuthUpstreamBody(upstream, request.signal);
    if (upstream.status !== 200 || !/^application\/json(?:\s*;|$)/i.test(upstream.headers.get('content-type') || '')
      || data?.redirect !== false || !validSocialAuthorizationURL(provider, data?.url)) {
      throw new Error('invalid_social_start');
    }
    const response = Response.json({ url: data.url }, { headers });
    for (const cookie of authSetCookies(upstream, env)) {
      if (/better-auth\.(?:state|oauth_state)=/.test(cookie)) response.headers.append('set-cookie', cookie);
    }
    return response;
  } catch {
    return Response.json({ error: 'authentication_unavailable' }, { status: 503, headers });
  }
}

export async function proxyBetterAuthKeys(request, dependencies = {}) {
  const env = dependencies.env || runtimeEnvironment();
  if (!betterAuthEnabled(env)) return Response.json({ error: 'not_found' }, { status: 404 });
  try {
    const upstream = await fetchBetterAuth('/jwks', {}, { ...dependencies, clientIp: trustedAuthClientIp(request.headers, env) });
    const data = await readAuthBody({ body: upstream.body, signal: request.signal });
    if (!upstream.ok || !Array.isArray(data.keys) || data.keys.length < 1 || data.keys.length > 32) throw new Error('invalid_keys');
    const keys = data.keys.map(key => {
      if (key.kty !== 'RSA' || key.alg !== 'RS256' || typeof key.kid !== 'string' || key.kid.length > 255
        || !/^[A-Za-z0-9_-]{32,1024}$/.test(key.n) || !/^[A-Za-z0-9_-]{2,16}$/.test(key.e)) throw new Error('invalid_keys');
      return { kty: 'RSA', alg: 'RS256', use: 'sig', kid: key.kid, n: key.n, e: key.e };
    });
    return Response.json({ keys }, { headers: { 'Cache-Control': 'public, max-age=60' } });
  } catch { return Response.json({ error: 'authentication_unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } }); }
}

async function confirmedSignInCookies(upstream, data, verified, request, origin, transport, env) {
  if (upstream.status !== 200 || !/^application\/json(?:\s*;|$)/i.test(upstream.headers.get('content-type') || '')) {
    throw new Error('invalid_sign_in_response');
  }
  const issued = upstream.headers.getSetCookie();
  if (issued.length > 8) throw new Error('invalid_sign_in_cookies');
  const cookies = issued.map(value => browserAuthCookie(value, env.NODE_ENV === 'production')).filter(Boolean);
  const sessions = cookies.filter(value => /^(?:__Secure-)?better-auth\.session_token=[^;\s,]+;/.test(value));
  if (sessions.length !== 1) throw new Error('missing_sign_in_session');
  const maxAges = [...sessions[0].matchAll(/(?:^|;)\s*max-age=([^;]+)/ig)];
  const expiries = [...sessions[0].matchAll(/(?:^|;)\s*expires=([^;]+)/ig)];
  if (maxAges.length > 1 || expiries.length > 1
    || (maxAges.length && (!/^\d+$/.test(maxAges[0][1]) || !Number.isSafeInteger(Number(maxAges[0][1])) || Number(maxAges[0][1]) <= 0))
    || (!maxAges.length && expiries.length && !(Date.parse(expiries[0][1]) > Date.now()))) {
    throw new Error('expired_sign_in_cookie');
  }
  // Prove only the just-issued native session. An old browser/session_data
  // cookie, a verified-mailbox flag or a service JWT cannot replace this proof.
  const cookie = betterAuthCookies(sessions[0].split(';')[0]);
  const canonical = await fetchBetterAuth('/get-session', { cookie, origin, signal: request.signal }, transport);
  const identity = await readAuthBody({ body: canonical.body, signal: request.signal });
  if (canonical.status !== 200 || !/^application\/json(?:\s*;|$)/i.test(canonical.headers.get('content-type') || '')
    || !identity || typeof identity !== 'object' || Array.isArray(identity) || identity.error || identity.code
    || !identity.session || typeof identity.session !== 'object' || Array.isArray(identity.session)
    || typeof identity.session.id !== 'string' || !identity.session.id.trim() || identity.session.id.length > 128
    || identity.session.userId !== verified.id || identity.session.token !== data.token
    || typeof identity.session.expiresAt !== 'string' || identity.session.expiresAt.length > 64
    || !(Date.parse(identity.session.expiresAt) > Date.now())
    || !identity.user || typeof identity.user !== 'object' || Array.isArray(identity.user)
    || identity.user.id !== verified.id || typeof identity.user.email !== 'string'
    || identity.user.email.trim().toLowerCase() !== verified.email.trim().toLowerCase()
    || identity.user.emailVerified !== true || request.signal.aborted) {
    throw new Error('invalid_sign_in_session');
  }
  return cookies;
}

const socialCallbackFields = new Set(['code', 'error', 'device_id', 'error_description', 'state', 'user']);

function validatedSocialCallbackSearch(value) {
  if (typeof value !== 'string' || value.length > 8192 || /[\r\n#]/.test(value)) throw new Error('invalid_social_callback');
  const params = new URLSearchParams(value.startsWith('?') ? value.slice(1) : value);
  for (const key of params.keys()) {
    if (!socialCallbackFields.has(key) || params.getAll(key).length !== 1) throw new Error('invalid_social_callback');
  }
  if (!params.get('state') || (!params.get('code') && !params.get('error'))) throw new Error('invalid_social_callback');
  return params.toString();
}

async function readSocialCallbackForm(request) {
  const reader = request.body?.getReader();
  if (!reader) return '';
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > 16384) { await reader.cancel(); throw new RangeError('body_too_large'); }
      chunks.push(value);
    }
    const combined = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) { combined.set(chunk, offset); offset += chunk.byteLength; }
    return new TextDecoder().decode(combined);
  } finally { reader.releaseLock(); }
}

async function confirmedSocialSignInCookies(upstream, request, origin, transport, env) {
  const cookies = authSetCookies(upstream, env);
  const sessions = cookies.filter(value => /^(?:__Secure-)?better-auth\.session_token=[^;\s,]+;/.test(value));
  if (sessions.length !== 1) throw new Error('missing_social_session');
  const maxAges = [...sessions[0].matchAll(/(?:^|;)\s*max-age=([^;]+)/ig)];
  const expiries = [...sessions[0].matchAll(/(?:^|;)\s*expires=([^;]+)/ig)];
  if (maxAges.length > 1 || expiries.length > 1
    || (maxAges.length && (!/^\d+$/.test(maxAges[0][1]) || !Number.isSafeInteger(Number(maxAges[0][1])) || Number(maxAges[0][1]) <= 0))
    || (!maxAges.length && expiries.length && !(Date.parse(expiries[0][1]) > Date.now()))) {
    throw new Error('expired_social_cookie');
  }
  const sessionCookie = betterAuthCookies(sessions[0].split(';')[0]);
  const canonical = await fetchBetterAuth('/get-session', { cookie: sessionCookie, origin, signal: request.signal }, transport);
  const identity = await readAuthBody({ body: canonical.body, signal: request.signal });
  if (canonical.status !== 200 || !/^application\/json(?:\s*;|$)/i.test(canonical.headers.get('content-type') || '')
    || !identity || typeof identity !== 'object' || Array.isArray(identity) || identity.error || identity.code
    || !identity.session || typeof identity.session !== 'object' || Array.isArray(identity.session)
    || typeof identity.session.id !== 'string' || !identity.session.id.trim() || identity.session.id.length > 128
    || typeof identity.session.userId !== 'string' || identity.session.userId !== identity.user?.id
    || typeof identity.session.expiresAt !== 'string' || identity.session.expiresAt.length > 64
    || !(Date.parse(identity.session.expiresAt) > Date.now())
    || !identity.user || typeof identity.user !== 'object' || Array.isArray(identity.user)
    || typeof identity.user.email !== 'string' || !identity.user.email.trim() || identity.user.emailVerified !== true
    || request.signal.aborted) throw new Error('invalid_social_session');
  return cookies;
}

export async function proxyBetterAuthSocialCallback(request, provider, dependencies = {}) {
  const env = dependencies.env || runtimeEnvironment();
  const expectedOrigin = env.AUTH_PUBLIC_ORIGIN || new URL(request.url).origin;
  const failure = socialFailureRedirect(expectedOrigin);
  const redirect = (location = failure, status = 302, cookies = []) => {
    const response = new Response(null, { status, headers: { location, 'Cache-Control': 'private, no-store' } });
    for (const cookie of cookies) response.headers.append('set-cookie', cookie);
    return response;
  };
  if (!betterAuthEnabled(env) || !betterAuthSocialProviderEnabled(provider, env)) return redirect();
  try {
    if (request.method === 'POST') {
      if (!/^application\/x-www-form-urlencoded(?:\s*;|$)/i.test(request.headers.get('content-type') || '')) return redirect();
      const search = validatedSocialCallbackSearch(await readSocialCallbackForm(request));
      return redirect(new URL(`/api/auth/callback/${provider}?${search}`, expectedOrigin).toString(), 303);
    }
    if (request.method !== 'GET') return redirect();
    const search = validatedSocialCallbackSearch(new URL(request.url).search);
    const transport = { ...dependencies, clientIp: trustedAuthClientIp(request.headers, env) };
    const upstream = await fetchBetterAuth(`/callback/${provider}`, {
      method: 'GET', origin: expectedOrigin, cookie: request.headers.get('cookie') || '', signal: request.signal, query: `?${search}`,
    }, transport);
    if (![302, 303].includes(upstream.status)) throw new Error('invalid_social_callback_response');
    let target;
    try { target = new URL(upstream.headers.get('location') || '', expectedOrigin); } catch { throw new Error('invalid_social_redirect'); }
    if (target.origin !== expectedOrigin || target.pathname !== '/dashboard' || target.search || target.hash
      || target.username || target.password) throw new Error('invalid_social_redirect');
    const cookies = await confirmedSocialSignInCookies(upstream, request, expectedOrigin, transport, env);
    return redirect(target.toString(), 302, cookies);
  } catch { return redirect(); }
}

export async function proxyBetterAuth(request, path, dependencies = {}) {
  const env = dependencies.env || runtimeEnvironment();
  const recovery = passwordRecoveryPaths.has(path);
  const recoveryHeaders = { 'Cache-Control': 'private, no-store' };
  if (!betterAuthEnabled(env)) return Response.json({ error: "better_auth_disabled" }, { status: 404 });
  if (request.method !== "POST" || !browserAuthPaths.has(path)) return Response.json({ error: "not_found" }, { status: 404 });
  const expectedOrigin = env.AUTH_PUBLIC_ORIGIN || new URL(request.url).origin;
  if (request.headers.get("origin") !== expectedOrigin) return Response.json({ error: "invalid_origin" }, { status: 403, ...(recovery ? { headers: recoveryHeaders } : {}) });
  if (recovery && (new URL(request.url).search || request.headers.has('content-encoding')
    || !/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || ''))) {
    return Response.json({ error: 'invalid_recovery_request' }, { status: 400, headers: recoveryHeaders });
  }
  try {
    let body;
    try { body = await readAuthBody(request); } catch (error) {
      return Response.json({ error: error instanceof RangeError ? "request_too_large" : "invalid_json" }, { status: error instanceof RangeError ? 413 : 400, ...(recovery ? { headers: recoveryHeaders } : {}) });
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return Response.json({ error: 'invalid_json' }, { status: 400, ...(recovery ? { headers: recoveryHeaders } : {}) });
    if (recovery) {
      const prepared = passwordRecoveryInput(path, body);
      if (prepared.error) return Response.json({ error: 'invalid_recovery_request', code: prepared.error }, { status: 400, headers: recoveryHeaders });
      body = prepared.body;
    }
    const transport = { ...dependencies, clientIp: trustedAuthClientIp(request.headers, env) };
    const upstream = await fetchBetterAuth(`/${path}`, {
      method: "POST", body, origin: expectedOrigin, cookie: recovery ? '' : request.headers.get("cookie") || "", signal: request.signal,
    }, transport);
    // Do not relay upstream diagnostics, raw session tokens or set-auth-jwt.
    const data = await readAuthUpstreamBody(upstream, request.signal);
    if (upstream.status === 429) {
      return Response.json({ error: 'authentication_failed', code: recovery ? passwordRecoveryError(data)
        : /^[A-Z_]{1,80}$/.test(data.code) ? data.code : undefined }, {
        status: 429, headers: { ...recoveryHeaders,
          'Retry-After': String(authRetryAfterSeconds(upstream.headers.get('retry-after'), emailDeliveryPaths.has(`/${path}`) ? 300 : 60)) },
      });
    }
    if (recovery) {
      if (!/^application\/json(?:\s*;|$)/i.test(upstream.headers.get('content-type') || '')
        || upstream.status < 200 || upstream.status >= 500 || (upstream.ok && (upstream.status !== 200 || !passwordRecoveryAcknowledged(data)))) throw new Error('invalid_auth_response');
      const response = Response.json(upstream.ok ? { ok: true } : { error: 'authentication_failed', code: passwordRecoveryError(data) },
        { status: upstream.ok ? 200 : [400, 401, 403, 404, 422, 429].includes(upstream.status) ? upstream.status : 503, headers: recoveryHeaders });
      // Recovery is not sign-in. Never install even a valid-looking auth cookie,
      // expose tokens or reflect account-existence hints from an upstream error.
      return response;
    }
    const result = upstream.ok ? authSuccess(path, data)
      : { error: "authentication_failed", code: /^[A-Z_]{1,80}$/.test(data.code) ? data.code : undefined };
    let cookies = [];
    if (upstream.ok && ['sign-in/email', 'sign-in/email-otp'].includes(path)) {
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      if (!email || result.user.email.trim().toLowerCase() !== email) throw new Error('invalid_sign_in_owner');
      cookies = await confirmedSignInCookies(upstream, data, result.user, request, expectedOrigin, transport, env);
    } else if (upstream.ok) {
      cookies = upstream.headers.getSetCookie().map(value => browserAuthCookie(value, env.NODE_ENV === 'production')).filter(Boolean);
    }
    const response = Response.json(result,
      { status: upstream.ok ? 200 : upstream.status >= 400 ? upstream.status : 502,
        headers: { "Cache-Control": "private, no-store" } });
    for (const cookie of cookies) response.headers.append("set-cookie", cookie);
    if (upstream.status === 503 && data.code === 'AUTH_EMAIL_DELIVERY_UNAVAILABLE') {
      response.headers.set('retry-after', String(Math.max(300, authRetryAfterSeconds(upstream.headers.get('retry-after')))));
    }
    return response;
  } catch { return Response.json({ error: "authentication_unavailable" }, { status: 503, headers: { "Cache-Control": "private, no-store" } }); }
}
