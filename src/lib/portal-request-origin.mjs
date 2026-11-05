export const REWON_PUBLIC_ORIGIN = 'https://app.mindblisspower.com';
export const REWON_TEMPORARY_ORIGIN = 'https://mindbliss-portal-rewon.devfidubit.workers.dev';

// Deployment configuration grants one exact alias to rewon only. Browser
// headers, other workers.dev names and main can never expand this capability.
// Return an isolated environment: AUTH_PUBLIC_ORIGIN belongs to this request,
// while the JWT issuer, audience, keys, secrets and bindings stay unchanged.
export function portalRequestEnvironment(request, env) {
  let url;
  try { url = new URL(request.url); } catch { return null; }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
  if (url.origin === env.AUTH_PUBLIC_ORIGIN) return env;
  if (env.AUTH_PUBLIC_ORIGIN !== REWON_PUBLIC_ORIGIN
    || env.AUTH_ALTERNATE_ORIGIN !== REWON_TEMPORARY_ORIGIN
    || url.origin !== REWON_TEMPORARY_ORIGIN) return null;
  return { ...env, AUTH_PUBLIC_ORIGIN: REWON_TEMPORARY_ORIGIN };
}
