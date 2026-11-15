import { betterAuthConfig, betterAuthCookies } from './better-auth-bridge.mjs';
import { profileSubjectHeader, profileSubjectFromHeader } from './member-profile.mjs';
import { coreFetch, runtimeEnvironment } from './cloudflare-runtime.mjs';
import { boundedServiceRequest } from './private-service-request.mjs';
import { historicalPackageRights } from './historical-package-rights-contract.mjs';

const origin = 'https://app.mindblisspower.com', path = '/api/member/package-rights';
const reply = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } });
const errors = new Set(['unauthenticated', 'invalid_origin', 'member_package_rights_unconfigured', 'member_package_rights_unavailable',
  'member_package_rights_forbidden', 'member_package_rights_owner_changed', 'member_package_rights_invalid_request', 'member_package_rights_rate_limited']);

export async function handleHistoricalPackageRights(request, { env = runtimeEnvironment(), fetchImpl = coreFetch, serviceRequest = boundedServiceRequest } = {}) {
  const url = new URL(request.url);
  if (request.method !== 'GET') return reply({ error: 'method_not_allowed' }, 405);
  if (url.origin !== origin || env.AUTH_PUBLIC_ORIGIN !== origin || url.pathname !== path) return reply({ error: 'not_found' }, 404);
  if (url.search || url.hash || request.url.endsWith('?')) return reply({ error: 'member_package_rights_invalid_request' }, 400);
  if (request.headers.has('x-vp-act-as')) return reply({ error: 'impersonation_read_only' }, 403);
  const cookie = betterAuthCookies(request.headers.get('cookie') || ''), subject = profileSubjectFromHeader(request.headers.get('x-mindbliss-profile-subject'));
  if (!/(?:^|;\s*)(?:__Secure-)?better-auth\.session_token=[^;\s,]+(?:;|$)/.test(cookie)) return reply({ error: 'unauthenticated' }, 401);
  if (!subject) return reply({ error: 'member_package_rights_forbidden' }, 403);
  try {
    const response = await serviceRequest(`${betterAuthConfig(env)}${path}`, { method: 'GET', signal: request.signal,
      headers: { cookie, origin, 'x-mindbliss-profile-subject': profileSubjectHeader(subject) } }, fetchImpl);
    if (!response.ok) return reply({ error: errors.has(response.data?.error) ? response.data.error : 'member_package_rights_unavailable' },
      [400, 401, 403, 404, 409, 429, 503].includes(response.status) ? response.status : 502);
    const safe = historicalPackageRights(response.data);
    return safe ? reply(safe) : reply({ error: 'member_package_rights_unavailable' }, 502);
  } catch { return reply({ error: 'member_package_rights_unavailable' }, 503); }
}
