import { createLocalJWKSet, jwtVerify } from 'jose';
import { coreFetch, runtimeEnvironment } from './cloudflare-runtime.mjs';
import { publicJwksCache, publicJwksConfiguration, publicJwksJson, PUBLIC_JWKS_TTL_MS } from './public-jwks-cache.mjs';

async function boundedJwksBody(response) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('auth_keys_unavailable');
  const chunks = []; let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > 65536) { await reader.cancel(); throw new Error('auth_keys_too_large'); }
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
  const uri = new URL(env.BETTER_AUTH_JWKS_URL || "");
  if (!issuer || !audience || uri.username || uri.password || uri.hash || uri.search
    || (uri.protocol !== "https:" && !(env.NODE_ENV !== "production" && ["127.0.0.1", "localhost", "[::1]"].includes(uri.hostname) && uri.protocol === "http:"))) {
    throw new Error("better_auth_verifier_configuration_invalid");
  }
  const configuration = publicJwksConfiguration(env, uri.href);
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
      if (forceRefresh && !publicKeyCache.beginRefresh(configuration)) throw new Error('auth_keys_refresh_limited');
      const ticket = publicKeyCache.beginFetch();
      const response = await fetchImpl(uri.href, { redirect: 'manual', cache: 'no-store', signal: AbortSignal.timeout(8000) });
      if (!response.ok) {
        await response.body?.cancel().catch(() => {});
        throw new Error('auth_keys_unavailable');
      }
      install(publicKeyCache.write(configuration, await boundedJwksBody(response), ticket));
    })().finally(() => { pending = undefined; });
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
        if (seeded) throw new Error('auth_keys_expired');
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
      if (!validBetterAuthClaims(payload)) throw new Error('invalid_auth_identity');
      return payload;
    },
  };
}
