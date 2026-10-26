// Synthetic local-only fixture. Not referenced by the deploy configuration.
import worker from './cloudflare-worker.mjs';
let privateCalls = 0;
const syntheticEnv = {
  CLOUDFLARE_DEPLOYMENT_READY: 'true', MEMBER_DB_PROVIDER: 'hyperdrive', MEMBER_DB_QUERY_CACHE_DISABLED: 'true',
  HYPERDRIVE_MEMBER_FRESH: { connectionString: 'postgres://synthetic:synthetic@127.0.0.1:9/synthetic' },
  CORE_API: { async fetch(url, options) {
    privateCalls++;
    if (url.endsWith('/email-otp/send-verification-otp')) {
      const body = JSON.parse(options.body);
      if (body.type !== 'sign-in' || body.email !== 'fixture@example.test') throw new Error('invalid_synthetic_contract');
      return Response.json({ success: true });
    }
    if (url.endsWith('/sign-in/email-otp')) {
      const body = JSON.parse(options.body);
      if (body.otp !== '001234') throw new Error('invalid_synthetic_contract');
      return Response.json({ token: 'must-not-leak', user: { id: 'synthetic', email: body.email } }, {
        headers: { 'set-cookie': '__Secure-better-auth.session_token=synthetic; Secure; HttpOnly; Path=/' },
      });
    }
    return Response.json({ error: 'unauthenticated' }, { status: 401 });
  } },
  AUTH_PROVIDER: 'better-auth', AUTH_PUBLIC_ORIGIN: 'https://app.mindblisspower.com',
  AUTH_BFF_SHARED_SECRET: 'synthetic-private-context-not-a-real-secret-longer-than-32',
  BETTER_AUTH_BACKEND_URL: 'https://auth.core.internal',
};
export default {
  async fetch(request, env, ctx) {
    const incoming = new URL(request.url);
    if (incoming.pathname === '/__synthetic_metrics') return Response.json({ privateCalls });
    const headers = new Headers(request.headers);
    headers.delete('x-forwarded-host');
    const input = new Request(`https://app.mindblisspower.com${incoming.pathname}${incoming.search}`, { method: request.method, headers, body: request.body });
    return worker.fetch(input, { ...env, ...syntheticEnv,
      ...(incoming.pathname.startsWith('/__disabled/') ? { CLOUDFLARE_DEPLOYMENT_READY: 'false' } : {}),
    }, ctx);
  },
};
