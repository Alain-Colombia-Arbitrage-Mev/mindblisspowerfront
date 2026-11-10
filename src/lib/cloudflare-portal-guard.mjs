import { customerDomainDecision, normalizedApplicationPath } from './domain-routing.js';
import { memberMutationError } from './member-mutation-policy.mjs';
import { applySecurityHeaders } from './security-headers.mjs';
import { walletPortalNotFound, walletPortalRequestAllowed } from './wallet-portal-policy.mjs';

// Public, uploaded assets are served before this Worker. Every response which
// reaches application code (including errors and static-looking API paths) must
// stay out of browser/shared caches. Do not rely on an upstream default header.
export function privateCloudflareResponse(response, request) {
  const headers = applySecurityHeaders(new Headers(response.headers), request);
  headers.set('Cache-Control', 'private, no-store');
  headers.set('CDN-Cache-Control', 'no-store');
  headers.set('Cloudflare-CDN-Cache-Control', 'no-store');
  headers.delete('Surrogate-Control');
  headers.delete('Expires');
  headers.delete('Cache-Tag');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

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
  const path = normalizedApplicationPath(pathname);
  return path === null || /^\/api\/(?:member|payments|network|admin)(?:\/|$)/i.test(path)
    || /^\/dashboard\/(?:admin|command-center|ai|ai-analysis)(?:\/|$)/.test(path);
}

export function cloudflarePortalGuard(request, env) {
  const url = new URL(request.url);
  if (!walletPortalRequestAllowed(url)) return walletPortalNotFound();
  // A cutover must not leave the legacy provider's more-specific routes live.
  const decodedPath = normalizedApplicationPath(url.pathname);
  if (decodedPath === null) {
    return Response.json({ error: 'invalid_path' }, { status: 400, headers: { 'Cache-Control': 'private, no-store' } });
  }
  if (env.AUTH_PROVIDER === 'better-auth' && /^\/api\/auth\/cognito(?:\/|$)/.test(decodedPath)) {
    return Response.json({ error: 'not_found' }, { status: 404, headers: { 'Cache-Control': 'private, no-store' } });
  }
  if (!portalProxyMatches(url.pathname)) return null;
  // Cloudflare terminates TLS: never trust a browser-supplied forwarded host.
  const decision = customerDomainDecision({ host: url.host, pathname: url.pathname });
  if (decision.type === 'notFound') return Response.json({ error: 'not_found' }, { status: 404 });
  if (decision.type === 'redirect') return Response.redirect(decision.location, 308);
  const mutation = memberMutationError(request, env);
  if (mutation) return Response.json({ error: mutation.error }, { status: mutation.status, headers: { 'Cache-Control': 'private, no-store' } });
  return null;
}
