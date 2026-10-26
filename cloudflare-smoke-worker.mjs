// Synthetic local-only fixture. Not referenced by the deploy configuration.
import worker from './cloudflare-worker.mjs';
import { createHash, createHmac } from 'node:crypto';
let privateCalls = 0;
const secret = 'synthetic-private-context-not-a-real-secret-longer-than-32';
const issuer = 'https://portal.example.test';
const audience = 'member-services';
const sessionCookie = '__Secure-better-auth.session_token=synthetic.value%2Bencoded';
const modes = new Map([[sessionCookie, 'member'],
  ['__Secure-better-auth.session_token=synthetic-tampered', 'tampered'],
  ['__Secure-better-auth.session_token=synthetic-wrong-audience', 'wrong-audience']]);
const metrics = { tokens: 0, jwks: 0, verifiedReferrals: 0, sensitiveJwksHeaders: 0 };
const encoder = new TextEncoder();
const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
let pair;
const keys = () => pair ??= crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);

async function signedJwt(mode) {
  const now = Math.floor(Date.now() / 1000);
  const claims = { sub: 'synthetic-member', email: 'fixture@example.test', email_verified: true, authVerified: true,
    person_public_id: '00000000-0000-4000-8000-000000000001', iat: now, exp: now + 300, iss: issuer,
    aud: mode === 'wrong-audience' ? 'other-service' : audience };
  const header = encode({ alg: 'RS256', kid: 'synthetic-real-rsa', typ: 'JWT' });
  const input = `${header}.${encode(claims)}`;
  const signature = Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', (await keys()).privateKey, encoder.encode(input))).toString('base64url');
  return mode === 'tampered' ? `${header}.${encode({ ...claims, email: 'altered@example.test' })}.${signature}` : `${input}.${signature}`;
}

async function validForwardedIdentity(token) {
  try {
    const [header, body, signature] = token.split('.');
    const claims = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (claims.iss !== issuer || claims.aud !== audience || claims.email !== 'fixture@example.test'
      || claims.exp <= Math.floor(Date.now() / 1000) || claims.email_verified !== true || claims.authVerified !== true) return false;
    return await crypto.subtle.verify('RSASSA-PKCS1-v1_5', (await keys()).publicKey,
      Buffer.from(signature, 'base64url'), encoder.encode(`${header}.${body}`));
  } catch { return false; }
}

const syntheticEnv = {
  CLOUDFLARE_DEPLOYMENT_READY: 'true', MEMBER_DB_PROVIDER: 'hyperdrive', MEMBER_DB_QUERY_CACHE_DISABLED: 'true',
  HYPERDRIVE_MEMBER_FRESH: { connectionString: 'postgres://synthetic:synthetic@127.0.0.1:9/synthetic' },
  CORE_API: { async fetch(url, options) {
    privateCalls++;
    const target = new URL(url);
    const headers = new Headers(options.headers);
    if (target.hostname === 'auth.core.internal' && target.pathname === '/api/auth/token') {
      metrics.tokens++;
      const cookie = headers.get('cookie') || '';
      const mode = modes.get(cookie);
      const timestamp = headers.get('x-vp-auth-timestamp') || '';
      const ip = headers.get('x-vp-auth-client-ip') || '';
      const hash = value => createHash('sha256').update(value).digest('hex');
      const signature = createHmac('sha256', secret).update(['GET', '/api/auth/token', timestamp, ip, hash(cookie), hash('')].join('\n')).digest('hex');
      if (!mode || ip !== '192.0.2.10' || Math.abs(Number(timestamp) - Date.now() / 1000) > 30
        || headers.get('x-vp-auth-signature') !== signature) return Response.json({ error: 'synthetic-session-rejected' }, { status: 401 });
      return Response.json({ token: await signedJwt(mode) });
    }
    if (target.hostname === 'auth.core.internal' && target.pathname === '/api/auth/jwks') {
      metrics.jwks++;
      if (headers.has('cookie') || headers.has('x-vp-id-token')) metrics.sensitiveJwksHeaders++;
      const jwk = await crypto.subtle.exportKey('jwk', (await keys()).publicKey);
      return Response.json({ keys: [{ ...jwk, alg: 'RS256', kid: 'synthetic-real-rsa' }] });
    }
    if (target.hostname === 'auth.core.internal' && target.pathname === '/api/auth/phone-number/opt-in') {
      if (headers.get('cookie') !== sessionCookie) return Response.json({ error: 'unauthenticated' }, { status: 401 });
      return Response.json({ available: false, consentVersion: 'sms-auth-v1', optedIn: false, phoneNumber: null, phoneNumberVerified: false });
    }
    if (target.hostname === 'payments.core.internal' && target.pathname === '/api/member/referral') {
      if (headers.get('x-vp-service-token') !== 'synthetic-service-only'
        || !await validForwardedIdentity(headers.get('x-vp-id-token') || '')) return Response.json({ error: 'synthetic-identity-rejected' }, { status: 401 });
      metrics.verifiedReferrals++;
      return Response.json({ referral_code: 'SYNTHETIC-MEMBER', name: 'Synthetic Member' });
    }
    if (url.endsWith('/sign-up/email')) {
      const body = JSON.parse(options.body);
      if (body.name !== 'Synthetic Registration' || body.email !== 'signup@example.test'
        || typeof body.password !== 'string' || body.password.length < 12) throw new Error('invalid_synthetic_registration');
      return Response.json({ token: null, user: { id: 'synthetic-signup', email: body.email, emailVerified: false } });
    }
    if (url.endsWith('/email-otp/verify-email')) {
      const body = JSON.parse(options.body);
      if (body.email !== 'signup@example.test' || body.otp !== '001234') return Response.json({ code: 'INVALID_OTP' }, { status: 400 });
      return Response.json({ status: true, token: null, user: { id: 'synthetic-signup', email: body.email, emailVerified: true } });
    }
    if (url.endsWith('/email-otp/send-verification-otp')) {
      const body = JSON.parse(options.body);
      if (!((body.type === 'sign-in' && body.email === 'fixture@example.test')
        || (body.type === 'email-verification' && body.email === 'signup@example.test'))) throw new Error('invalid_synthetic_contract');
      return Response.json({ success: true });
    }
    if (url.endsWith('/sign-in/email-otp') || url.endsWith('/sign-in/email')) {
      const body = JSON.parse(options.body);
      const valid = url.endsWith('/sign-in/email-otp') ? body.otp === '001234'
        : body.email === 'fixture@example.test' && body.password === 'Synthetic-Password-123';
      if (!valid) throw new Error('invalid_synthetic_contract');
      return Response.json({ token: 'must-not-leak', user: { id: 'synthetic', email: body.email, emailVerified: true } }, {
        headers: { 'set-cookie': `${sessionCookie}; Secure; HttpOnly; Path=/` },
      });
    }
    return Response.json({ error: 'unauthenticated' }, { status: 401 });
  } },
  AUTH_PROVIDER: 'better-auth', AUTH_PUBLIC_ORIGIN: 'https://app.mindblisspower.com',
  AUTH_BFF_SHARED_SECRET: secret,
  BETTER_AUTH_BACKEND_URL: 'https://auth.core.internal',
  BETTER_AUTH_JWT_ISSUER: issuer, BETTER_AUTH_JWT_AUDIENCE: audience,
  BETTER_AUTH_JWKS_URL: 'https://auth.core.internal/api/auth/jwks',
  VP_PAYMENTS_URL: 'https://payments.core.internal', PAYMENTS_SERVICE_TOKEN: 'synthetic-service-only',
};
export default {
  async fetch(request, env, ctx) {
    const incoming = new URL(request.url);
    if (incoming.pathname === '/__synthetic_metrics') return Response.json({ privateCalls, ...metrics });
    const headers = new Headers(request.headers);
    headers.delete('x-forwarded-host');
    const input = new Request(`https://app.mindblisspower.com${incoming.pathname}${incoming.search}`, { method: request.method, headers, body: request.body });
    return worker.fetch(input, { ...env, ...syntheticEnv,
      ...(incoming.pathname.startsWith('/__disabled/') ? { CLOUDFLARE_DEPLOYMENT_READY: 'false' } : {}),
    }, ctx);
  },
};
