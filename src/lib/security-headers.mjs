// Deliberately independent of Next, environment variables and user input.
// Do not advertise a report-only policy without a same-origin reporting
// endpoint: browsers cannot deliver it and only emit misleading console noise.
export const DOCUMENT_CSP = "base-uri 'self'; object-src 'none'; frame-ancestors 'none'";
const productionHosts = new Set(['mindblisspower.com', 'admin.mindblisspower.com', 'app.mindblisspower.com',
  'mindbliss-portal-rewon.devfidubit.workers.dev']);

export function applySecurityHeaders(headers, request) {
  headers.set('Content-Security-Policy', DOCUMENT_CSP);
  headers.delete('Content-Security-Policy-Report-Only');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()');
  headers.delete('X-Powered-By');
  let url;
  try { url = new URL(request?.url); } catch { /* No HSTS for an unknown transport. */ }
  // Stage HSTS for one day on these exact production HTTPS hosts only. Never inherit
  // preload/includeSubDomains, nor trust client-supplied forwarded headers.
  headers.delete('Strict-Transport-Security');
  if (url?.protocol === 'https:' && !url.port && productionHosts.has(url.hostname)) {
    headers.set('Strict-Transport-Security', 'max-age=86400');
  }
  return headers;
}
