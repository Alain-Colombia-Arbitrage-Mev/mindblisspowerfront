import { customerDomainDecision } from './domain-routing.js';
import { memberMutationError } from './member-mutation-policy.mjs';

export function cloudflarePortalRequest(request) {
  const url = new URL(request.url);
  const headers = new Headers(request.headers);
  // Override untrusted proxy hints at the edge before route helpers see them.
  headers.set('host', url.host);
  headers.set('x-forwarded-host', url.host);
  headers.set('x-forwarded-proto', url.protocol.slice(0, -1));
  return new Request(request, { headers });
}

// Same matcher as src/proxy.js. Only the isolated Workers build omits that file.
export function portalProxyMatches(pathname) {
  return /^\/api\/(?:member|payments|network|admin)(?:\/|$)/.test(pathname)
    || /^\/dashboard\/(?:admin|command-center|ai|ai-analysis)(?:\/|$)/.test(pathname);
}

export function cloudflarePortalGuard(request, env) {
  const url = new URL(request.url);
  // A cutover must not leave the legacy provider's more-specific routes live.
  let decodedPath = url.pathname;
  try { for (let index = 0; index < 2; index++) decodedPath = decodeURIComponent(decodedPath); } catch {
    return Response.json({ error: 'invalid_path' }, { status: 400, headers: { 'Cache-Control': 'private, no-store' } });
  }
  if (env.AUTH_PROVIDER === 'better-auth' && /^\/api\/auth\/cognito(?:\/|$)/.test(decodedPath)) {
    return Response.json({ error: 'not_found' }, { status: 404, headers: { 'Cache-Control': 'private, no-store' } });
  }
  if (!portalProxyMatches(url.pathname)) return null;
  const mutation = memberMutationError(request, env);
  if (mutation) return Response.json({ error: mutation.error }, { status: mutation.status, headers: { 'Cache-Control': 'private, no-store' } });
  // Cloudflare terminates TLS: never trust a browser-supplied forwarded host.
  const decision = customerDomainDecision({ host: url.host, pathname: url.pathname });
  if (decision.type === 'notFound') return Response.json({ error: 'not_found' }, { status: 404 });
  if (decision.type === 'redirect') return Response.redirect(decision.location, 308);
  return null;
}
