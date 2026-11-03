// Only validated PUBLIC JSON and numeric cache metadata may outlive a request.
// Never put a resolver, CryptoKey, promise, binding, token, cookie or claims here.
export const PUBLIC_JWKS_TTL_MS = 60_000;
const MAX_CONFIGURATIONS = 8;
const MAX_JWKS_BYTES = 65_536;
const REFRESH_COOLDOWN_MS = 30_000;
const encoder = new TextEncoder();

export function publicJwksJson(value) {
  const raw = JSON.stringify(value);
  if (typeof raw !== 'string' || encoder.encode(raw).byteLength > MAX_JWKS_BYTES) throw new Error('auth_keys_invalid');
  const jwks = JSON.parse(raw);
  if (!jwks || typeof jwks !== 'object' || Array.isArray(jwks)
    || Object.keys(jwks).some(field => field !== 'keys')
    || !Array.isArray(jwks.keys) || !jwks.keys.length || jwks.keys.length > 32) throw new Error('auth_keys_invalid');
  const ids = new Set();
  const fields = new Set(['kty', 'n', 'e', 'kid', 'alg', 'use', 'key_ops', 'ext']);
  for (const key of jwks.keys) {
    if (!key || typeof key !== 'object' || Array.isArray(key)
      || Object.keys(key).some(field => !fields.has(field))
      || key.kty !== 'RSA' || (key.alg !== undefined && key.alg !== 'RS256')
      || (key.use !== undefined && key.use !== 'sig')
      || (key.ext !== undefined && typeof key.ext !== 'boolean')
      || (key.key_ops !== undefined && (!Array.isArray(key.key_ops) || key.key_ops.length !== 1 || key.key_ops[0] !== 'verify'))
      || (key.kid !== undefined && (typeof key.kid !== 'string' || !key.kid.length || key.kid.length > 256 || ids.has(key.kid)))) {
      throw new Error('auth_keys_invalid');
    }
    const modulus = publicInteger(key.n, 256, 1024);
    const exponent = publicInteger(key.e, 1, 4);
    // At least 2048 bits, unsigned/minimal integers and an odd public exponent.
    if (modulus.charCodeAt(0) < 128) throw new Error('auth_keys_invalid');
    let e = 0;
    for (let i = 0; i < exponent.length; i++) e = e * 256 + exponent.charCodeAt(i);
    if (e < 3 || e % 2 !== 1) throw new Error('auth_keys_invalid');
    if (key.kid !== undefined) ids.add(key.kid);
  }
  return JSON.stringify(jwks);
}

function publicInteger(value, minBytes, maxBytes) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value)
    || value.length > Math.ceil(maxBytes * 4 / 3) || value.length % 4 === 1) throw new Error('auth_keys_invalid');
  const bytes = atob(value.replace(/-/g, '+').replace(/_/g, '/'));
  if (bytes.length < minBytes || bytes.length > maxBytes || bytes.charCodeAt(0) === 0
    || btoa(bytes).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_') !== value) throw new Error('auth_keys_invalid');
  return bytes;
}

export function publicJwksConfiguration(env, uri) {
  // Every item is public configuration, never a secret or a request-derived ID.
  const values = [env.BETTER_AUTH_JWT_ISSUER, env.BETTER_AUTH_JWT_AUDIENCE, uri,
    env.NODE_ENV || '', env.AUTH_PUBLIC_ORIGIN || '', env.BETTER_AUTH_BACKEND_URL || '',
    env.AUTH_PROVIDER || '', env.CORE_ENV || '', env.CLOUDFLARE_ENV || ''];
  if (values.some(value => typeof value !== 'string' || value.length > 2048)) throw new Error('auth_keys_configuration_invalid');
  return JSON.stringify(values);
}

export function createPublicJwksCache({ now = Date.now, state = { entries: new Map(), version: 0 } } = {}) {
  const entries = state.entries;
  function existing(key) {
    const entry = entries.get(key);
    const time = now();
    // Clock rollback must not extend the lifetime of public keys either.
    if (entry && (time < entry.startedAt || time >= entry.expiresAt)) { entries.delete(key); return null; }
    return entry || null;
  }
  function snapshot(entry) {
    return entry ? { jwks: JSON.parse(entry.json), expiresAt: entry.expiresAt, version: entry.version } : null;
  }
  return {
    read(key) {
      const entry = existing(key);
      if (entry) { entries.delete(key); entries.set(key, entry); }
      return snapshot(entry);
    },
    beginFetch() { return { version: ++state.version, startedAt: now() }; },
    beginRefresh(key) {
      const entry = existing(key);
      if (!entry || now() < entry.refreshAfter) return false;
      // This numeric lease bounds random-kid refreshes; failures are never cached.
      entry.refreshAfter = now() + REFRESH_COOLDOWN_MS;
      return true;
    },
    write(key, value, ticket) {
      const json = publicJwksJson(value);
      const previous = existing(key);
      if (previous && previous.version > ticket.version) return snapshot(previous);
      const expiresAt = ticket.startedAt + PUBLIC_JWKS_TTL_MS;
      if (now() < ticket.startedAt || now() >= expiresAt) throw new Error('auth_keys_expired');
      for (const old of entries.keys()) existing(old);
      const entry = { json, startedAt: ticket.startedAt, expiresAt, version: ticket.version,
        refreshAfter: previous?.refreshAfter || 0 };
      entries.delete(key);
      while (entries.size >= MAX_CONFIGURATIONS) entries.delete(entries.keys().next().value);
      entries.set(key, entry);
      return snapshot(entry);
    },
  };
}

// Next/OpenNext can load this module in multiple server bundles. The carrier
// contains only the snapshot Map and a numeric sequence, never this API object.
const stateKey = Symbol.for('mindbliss.public-jwks-cache.v1');
const publicState = globalThis[stateKey] ??= { entries: new Map(), version: 0 };
export const publicJwksCache = createPublicJwksCache({ state: publicState });
