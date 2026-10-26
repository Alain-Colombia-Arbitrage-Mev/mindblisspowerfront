// Generated locally by OpenNext; the existing Next.js/Docker entrypoints remain intact.
import handler from './.open-next/worker.js';
import { cloudflareReadiness, runCloudflareRequest } from './src/lib/cloudflare-runtime.mjs';
import { cloudflarePortalGuard, cloudflarePortalRequest } from './src/lib/cloudflare-portal-guard.mjs';

export default {
  async fetch(request, env, ctx) {
    if (!cloudflareReadiness(env)) return Response.json({ error: 'deployment_not_ready' }, {
      status: 503, headers: { 'Cache-Control': 'private, no-store' },
    });
    if (new URL(request.url).origin !== env.AUTH_PUBLIC_ORIGIN) return Response.json({ error: 'invalid_host' }, { status: 421, headers: { 'Cache-Control': 'private, no-store' } });
    request = cloudflarePortalRequest(request);
    const blocked = cloudflarePortalGuard(request, env);
    if (blocked) return blocked;
    return runCloudflareRequest(request, env, ctx, handler.fetch);
  },
};
