// Server transport only. No credentials, OTPs, sessions or JWTs are logged.
import { createHash, createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import { authSuccess } from './auth-response.mjs';
import { coreFetch, runtimeEnvironment } from './cloudflare-runtime.mjs';

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

export class AuthServiceUnavailable extends Error {
  constructor() { super('authentication_unavailable'); this.name = 'AuthServiceUnavailable'; }
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

const authCookie = /^(?:__Secure-)?better-auth\.(?:session_token|session_data|dont_remember)$/;
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

// Email delivery includes Container startup, PostgreSQL and the provider's 8s
// deadline. Keep other auth reads/canjes short; never retry a send on timeout.
const emailDeliveryPaths = new Set(['/sign-up/email', '/email-otp/send-verification-otp',
  '/send-verification-email', '/email-otp/request-password-reset']);
export const betterAuthTimeoutMs = path => emailDeliveryPaths.has(path) ? 20000 : 8000;

/** @param {string} path
 * @param {{cookie?: string, method?: string, body?: unknown, origin?: string, signal?: AbortSignal}} [options]
 */
export async function fetchBetterAuth(path, { cookie = "", method = "GET", body, origin, signal } = {},
  { env = runtimeEnvironment(), fetchImpl = coreFetch, clientIp = '' } = {}) {
  const base = betterAuthConfig(env);
  if (!/^\/[a-z0-9/-]+$/.test(path)) throw new Error("invalid_auth_path");
  if (!isIP(clientIp)) throw new Error('trusted_proxy_required');
  const serialized = body ? JSON.stringify(body) : '';
  const sessionCookie = betterAuthCookies(cookie);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const hash = value => createHash('sha256').update(value).digest('hex');
  const signature = createHmac('sha256', env.AUTH_BFF_SHARED_SECRET).update([method, `/api/auth${path}`, timestamp, clientIp, hash(sessionCookie), hash(serialized)].join('\n')).digest('hex');
  const deadline = AbortSignal.timeout(betterAuthTimeoutMs(path));
  return fetchImpl(`${base}/api/auth${path}`, {
    method, redirect: "manual", cache: "no-store",
    signal: signal ? AbortSignal.any([signal, deadline]) : deadline,
    headers: { cookie: sessionCookie, 'x-vp-auth-client-ip': clientIp, 'x-vp-auth-timestamp': timestamp, 'x-vp-auth-signature': signature,
      ...(origin ? { origin } : {}), ...(body ? { "content-type": "application/json" } : {}) },
    body: serialized || undefined,
  });
}

// Session-authorized JWT stays on the server. It is not a replacement browser cookie.
export async function betterAuthServiceToken(cookie, dependencies = {}) {
  if (!betterAuthCookies(cookie)) return "";
  try {
    const response = await fetchBetterAuth("/token", { cookie }, dependencies);
    if ([401, 403].includes(response.status)) return "";
    if (!response.ok) throw new AuthServiceUnavailable();
    const payload = await readAuthBody({ body: response.body, signal: AbortSignal.timeout(8000) });
    if (!payload || typeof payload.token !== 'string' || !payload.token || payload.token.length > 16000) throw new AuthServiceUnavailable();
    return payload.token;
  } catch { throw new AuthServiceUnavailable(); }
}

export const browserAuthPaths = new Set([
  "sign-in/email", "sign-in/email-otp", "sign-out",
  "email-otp/send-verification-otp", "email-otp/verify-email",
  "email-otp/request-password-reset", "email-otp/reset-password",
  "send-verification-email",
]);

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

export async function proxyBetterAuth(request, path, dependencies = {}) {
  const env = dependencies.env || runtimeEnvironment();
  if (!betterAuthEnabled(env)) return Response.json({ error: "better_auth_disabled" }, { status: 404 });
  if (request.method !== "POST" || !browserAuthPaths.has(path)) return Response.json({ error: "not_found" }, { status: 404 });
  const expectedOrigin = env.AUTH_PUBLIC_ORIGIN || new URL(request.url).origin;
  if (request.headers.get("origin") !== expectedOrigin) return Response.json({ error: "invalid_origin" }, { status: 403 });
  try {
    let body;
    try { body = await readAuthBody(request); } catch (error) {
      return Response.json({ error: error instanceof RangeError ? "request_too_large" : "invalid_json" }, { status: error instanceof RangeError ? 413 : 400 });
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return Response.json({ error: 'invalid_json' }, { status: 400 });
    const upstream = await fetchBetterAuth(`/${path}`, {
      method: "POST", body, origin: expectedOrigin, cookie: request.headers.get("cookie") || "", signal: request.signal,
    }, { ...dependencies, clientIp: trustedAuthClientIp(request.headers, env) });
    // Do not relay upstream diagnostics, raw session tokens or set-auth-jwt.
    const data = await readAuthBody({ body: upstream.body, signal: request.signal });
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('invalid_auth_response');
    const response = Response.json(upstream.ok ? authSuccess(path, data)
      : { error: "authentication_failed", code: /^[A-Z_]{1,80}$/.test(data.code) ? data.code : undefined },
      { status: upstream.ok ? 200 : upstream.status >= 400 ? upstream.status : 502,
        headers: { "Cache-Control": "private, no-store" } });
    for (const value of upstream.ok ? upstream.headers.getSetCookie() : []) {
      const cookie = browserAuthCookie(value, env.NODE_ENV === 'production');
      if (cookie) response.headers.append("set-cookie", cookie);
    }
    if (upstream.status === 429 && /^\d{1,5}$/.test(upstream.headers.get("retry-after") || "")) {
      response.headers.set("retry-after", upstream.headers.get("retry-after"));
    }
    return response;
  } catch { return Response.json({ error: "authentication_unavailable" }, { status: 503, headers: { "Cache-Control": "private, no-store" } }); }
}
