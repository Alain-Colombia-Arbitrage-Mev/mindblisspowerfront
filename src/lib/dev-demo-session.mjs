import { createHmac, timingSafeEqual } from 'node:crypto';

const DEMO_ISSUER = 'mindbliss-local-demo';
const DEMO_AUDIENCE = 'mindbliss-local-frontend';
const DEMO_TTL_SECONDS = 60 * 60;

function demoEnabled(env = process.env) {
  return env.NODE_ENV !== 'production' && env.AUTH_PROVIDER !== 'better-auth';
}

function signingKey(env = process.env) {
  return String(env.DEV_DEMO_SESSION_SECRET || 'mindbliss-local-demo-session-v1');
}

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function signature(input, env) {
  return createHmac('sha256', signingKey(env)).update(input).digest('base64url');
}

/** Issue a short-lived token only for the unconfigured local Cognito demo. */
export function issueDevDemoIdToken(email, env = process.env, now = Date.now()) {
  if (!demoEnabled(env)) throw new Error('demo_session_disabled');
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (normalizedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('invalid_demo_email');
  }
  const iat = Math.floor(now / 1000);
  const header = encode({ alg: 'HS256', typ: 'JWT' });
  const payload = encode({
    iss: DEMO_ISSUER,
    aud: DEMO_AUDIENCE,
    token_use: 'id',
    sub: `demo:${normalizedEmail}`,
    email: normalizedEmail,
    email_verified: true,
    name: 'Miembro Mindbliss',
    iat,
    exp: iat + DEMO_TTL_SECONDS,
  });
  const input = `${header}.${payload}`;
  return `${input}.${signature(input, env)}`;
}

/** Verify local demo proof before it reaches the normal Cognito verifier. */
export function verifyDevDemoIdToken(token, env = process.env, now = Date.now()) {
  if (!demoEnabled(env) || typeof token !== 'string' || token.length > 4096) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const input = `${parts[0]}.${parts[1]}`;
  const expected = Buffer.from(signature(input, env));
  const received = Buffer.from(parts[2]);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;

  try {
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    const current = Math.floor(now / 1000);
    const email = String(claims.email || '').trim().toLowerCase();
    if (header.alg !== 'HS256' || header.typ !== 'JWT'
      || claims.iss !== DEMO_ISSUER || claims.aud !== DEMO_AUDIENCE || claims.token_use !== 'id'
      || typeof claims.sub !== 'string' || claims.sub !== `demo:${email}`
      || claims.email_verified !== true || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      || typeof claims.iat !== 'number' || typeof claims.exp !== 'number'
      || claims.iat > current + 30 || claims.exp <= current || claims.exp - claims.iat !== DEMO_TTL_SECONDS) return null;
    return { ...claims, email };
  } catch {
    return null;
  }
}

