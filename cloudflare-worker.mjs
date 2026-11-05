// Generated locally by OpenNext; the existing Next.js/Docker entrypoints remain intact.
import handler from './.open-next/worker.js';
import { cloudflareReadiness, runCloudflareRequest } from './src/lib/cloudflare-runtime.mjs';
import { cloudflarePortalGuard, cloudflarePortalRequest, privateCloudflareResponse } from './src/lib/cloudflare-portal-guard.mjs';
import { handleResendWebhook, resendWebhookNamespace } from './src/lib/resend-webhook.mjs';
import { portalRequestEnvironment } from './src/lib/portal-request-origin.mjs';

export default {
  async fetch(request, env, ctx) {
    if (!cloudflareReadiness(env)) return privateCloudflareResponse(Response.json({ error: 'deployment_not_ready' }, {
      status: 503, headers: { 'Cache-Control': 'private, no-store' },
    }), request);
    const requestEnv = portalRequestEnvironment(request, env);
    if (!requestEnv) return privateCloudflareResponse(Response.json({ error: 'invalid_host' }, { status: 421, headers: { 'Cache-Control': 'private, no-store' } }), request);
    if (resendWebhookNamespace(new URL(request.url).pathname)) {
      return privateCloudflareResponse(await handleResendWebhook(request, { env: requestEnv }), request);
    }
    request = cloudflarePortalRequest(request);
    const blocked = cloudflarePortalGuard(request, requestEnv);
    if (blocked) return privateCloudflareResponse(blocked, request);
    return privateCloudflareResponse(await runCloudflareRequest(request, requestEnv, ctx, handler.fetch), request);
  },
};
