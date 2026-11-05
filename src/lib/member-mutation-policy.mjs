import { hasSameOrigin } from './request-origin.js';
import { normalizedApplicationPath } from './domain-routing.js';

// Cookie-authorized member/payment mutations need an exact origin, including
// against a different subdomain of the same site. JSON alone is not CSRF proof.
export function memberMutationError(request, env = process.env) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return null;
  const path = normalizedApplicationPath(new URL(request.url).pathname);
  if (path === null) return { error: 'invalid_path', status: 400 };
  if (!/^\/api\/(?:member|payments|network|admin)(?:\/|$)/i.test(path)) return null;
  const origin = request.headers.get('origin');
  const exact = env.AUTH_PUBLIC_ORIGIN ? origin === env.AUTH_PUBLIC_ORIGIN : hasSameOrigin(request);
  const site = request.headers.get('sec-fetch-site');
  if (!exact || (site && site !== 'same-origin')) return { error: 'invalid_origin', status: 403 };
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || '')) return { error: 'json_required', status: 415 };
  return null;
}
