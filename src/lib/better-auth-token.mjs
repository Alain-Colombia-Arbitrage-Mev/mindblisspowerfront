import { createLocalJWKSet, jwtVerify } from 'jose';
import { coreFetch, runtimeEnvironment } from './cloudflare-runtime.mjs';
import { publicJwksCache, publicJwksConfiguration, publicJwksJson, PUBLIC_JWKS_TTL_MS } from './public-jwks-cache.mjs';

const diagnosticPhases = new Set(['configuration', 'jwks', 'token', 'claims', 'verification']);
const invalidTokenCodes = new Set(['ERR_JWT_EXPIRED', 'ERR_JWT_INVALID', 'ERR_JWS_INVALID',
  'ERR_JWS_SIGNATURE_VERIFICATION_FAILED', 'ERR_JOSE_ALG_NOT_ALLOWED', 'ERR_JWKS_NO_MATCHING_KEY',
  'ERR_JWT_CLAIM_VALIDATION_FAILED']);

export class AuthVerificationUnavailable extends Error {
  constructor(phase, message = 'auth_verification_unavailable') {
    super(message);
    this.name = 'AuthVerificationUnavailable';
    this.phase = diagnosticPhases.has(phase) ? phase : 'verification';
  }
}

// Never return error messages, claims, identifiers or key material to logging.
export function authVerificationDiagnostic(error) {
  if (error instanceof AuthVerificationUnavailable) return {
    phase: diagnosticPhases.has(error.phase) ? error.phase : 'verification', status: 'unavailable',
  };
  // JOSE checks these claims after validating the trusted key's signature.
  // A service-issued token rejected for issuer/audience is not manual review.
  if (error?.code === 'ERR_JWT_CLAIM_VALIDATION_FAILED' && ['iss', 'aud'].includes(error.claim)) {
    return { phase: 'claims', status: 'unavailable' };
  }
  if (error?.code === 'AUTH_INVALID_IDENTITY') return { phase: 'claims', status: 'invalid' };
  return invalidTokenCodes.has(error?.code)
    ? { phase: 'token', status: 'invalid' } : { phase: 'verification', status: 'unavailable' };
}

async function boundedJwksBody(response) {
  const reader = response.body?.getReader();
  if (!reader) throw new AuthVerificationUnavailable('jwks', 'auth_keys_unavailable');
  const chunks = []; let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > 65536) { await reader.cancel(); throw new AuthVerificationUnavailable('jwks', 'auth_keys_too_large'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(total); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
}

export function validBetterAuthClaims(payload, now = Math.floor(Date.now() / 1000)) {
  return Boolean(payload && typeof payload.sub === "string" && payload.sub.trim()
    && typeof payload.person_public_id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payload.person_public_id)
    && payload.email_verified === true && payload.authVerified === true
    && typeof payload.email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)
    && Number.isInteger(payload.iat) && Number.isInteger(payload.exp)
    && payload.iat <= now + 30 && payload.exp > now && payload.exp > payload.iat && payload.exp - payload.iat <= 300);
}

export function createBetterAuthVerifier(env = runtimeEnvironment(), { fetchImpl = coreFetch, publicKeyCache = publicJwksCache, now = Date.now } = {}) {
  const issuer = env.BETTER_AUTH_JWT_ISSUER;
  const audience = env.BETTER_AUTH_JWT_AUDIENCE;
  let uri, configuration;
  try {
    uri = new URL(env.BETTER_AUTH_JWKS_URL || "");
    if (!issuer || !audience || uri.username || uri.password || uri.hash || uri.search
      || (uri.protocol !== "https:" && !(env.NODE_ENV !== "production" && ["127.0.0.1", "localhost", "[::1]"].includes(uri.hostname) && uri.protocol === "http:"))) {
      throw new AuthVerificationUnavailable('configuration', 'better_auth_verifier_configuration_invalid');
    }
    configuration = publicJwksConfiguration(env, uri.href);
  } catch { throw new AuthVerificationUnavailable('configuration', 'better_auth_verifier_configuration_invalid'); }
  // Resolvers, imported CryptoKeys, HTTP promises and bindings stay LOCAL to
  // this verifier/request. Only bounded public JSON crosses request boundaries.
  let keys;
  let keysExpireAt = 0;
  let loadedVersion;
  let pending;
  let seeded = false;
  function install(snapshot) {
    keys = createLocalJWKSet(snapshot.jwks);
    keysExpireAt = snapshot.expiresAt;
    loadedVersion = snapshot.version;
  }
  async function loadKeys(forceRefresh = false) {
    if (!pending) pending = (async () => {
      const cached = publicKeyCache.read(configuration);
      if (cached && (!forceRefresh || cached.version !== loadedVersion)) { install(cached); return; }
      if (forceRefresh && !publicKeyCache.beginRefresh(configuration)) throw new AuthVerificationUnavailable('jwks', 'auth_keys_refresh_limited');
      const ticket = publicKeyCache.beginFetch();
      const response = await fetchImpl(uri.href, { redirect: 'manual', cache: 'no-store', signal: AbortSignal.timeout(8000) });
      if (!response.ok) {
        await response.body?.cancel().catch(() => {});
        throw new AuthVerificationUnavailable('jwks', 'auth_keys_unavailable');
      }
      install(publicKeyCache.write(configuration, await boundedJwksBody(response), ticket));
    })().catch(error => {
      if (error instanceof AuthVerificationUnavailable) throw error;
      throw new AuthVerificationUnavailable('jwks');
    }).finally(() => { pending = undefined; });
    return pending;
  }
  return {
    // Explicit injection is for isolated signature tests; it never seeds the
    // shared cache or disables expiry and cannot enable a network fallback.
    cacheJwks(jwks) {
      install({ jwks: JSON.parse(publicJwksJson(jwks)), expiresAt: now() + PUBLIC_JWKS_TTL_MS });
      seeded = true;
    },
    async verify(token) {
      if (!keys || now() >= keysExpireAt) {
        if (seeded) throw new AuthVerificationUnavailable('jwks', 'auth_keys_expired');
        await loadKeys();
      }
      let refreshed = false;
      const resolver = async (header, flattened) => {
        try { return await keys(header, flattened); }
        catch (error) {
          if (seeded || refreshed || error?.code !== 'ERR_JWKS_NO_MATCHING_KEY') throw error;
          refreshed = true;
          await loadKeys(true);
          return keys(header, flattened);
        }
      };
      const { payload } = await jwtVerify(token, resolver, { issuer, audience, algorithms: ['RS256'], requiredClaims: ['sub', 'iat', 'exp'] });
      if (!validBetterAuthClaims(payload)) throw Object.assign(new Error('invalid_auth_identity'), { code: 'AUTH_INVALID_IDENTITY' });
      return payload;
    },
  };
}
