import { betterAuthConfig, betterAuthCookies } from './better-auth-bridge.mjs';
import { profileSubjectHeader, profileSubjectFromHeader } from './member-profile.mjs';
import { coreFetch, runtimeEnvironment } from './cloudflare-runtime.mjs';
import { boundedServiceRequest } from './private-service-request.mjs';
import { RECHARGE_PACKAGE_ORIGIN, RECHARGE_PACKAGE_PATH, rechargePackageSnapshot } from './recharge-package-contract.mjs';

const reply = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } });
const unavailable = { error: 'recharge_package_unavailable' };

export async function handleRechargePackage(request, { env = runtimeEnvironment(), fetchImpl = coreFetch, serviceRequest = boundedServiceRequest } = {}) {
  const url = new URL(request.url);
  if (request.method !== 'GET') return reply({ error: 'method_not_allowed' }, 405);
  if (url.origin !== RECHARGE_PACKAGE_ORIGIN || env.AUTH_PUBLIC_ORIGIN !== RECHARGE_PACKAGE_ORIGIN || url.pathname !== RECHARGE_PACKAGE_PATH) {
    return reply({ error: 'not_found' }, 404);
  }
  if (url.search || url.hash || request.url.endsWith('?')) return reply({ error: 'invalid_request' }, 400);
  if (request.headers.has('x-vp-act-as')) return reply({ error: 'impersonation_read_only' }, 403);
  const cookie = betterAuthCookies(request.headers.get('cookie') || '');
  if (!/(?:^|;\s*)(?:__Secure-)?better-auth\.session_token=[^;\s,]+(?:;|$)/.test(cookie)) return reply({ error: 'unauthenticated' }, 401);
  const subject = profileSubjectFromHeader(request.headers.get('x-mindbliss-profile-subject'));
  if (!subject) return reply({ error: 'forbidden' }, 403);

  try {
    const response = await serviceRequest(`${betterAuthConfig(env)}${RECHARGE_PACKAGE_PATH}`, { method: 'GET', signal: request.signal,
      headers: { cookie, origin: RECHARGE_PACKAGE_ORIGIN, 'x-mindbliss-profile-subject': profileSubjectHeader(subject) } }, fetchImpl);
    if (!response.ok) return reply(unavailable, [400, 401, 403, 404, 409, 429, 503].includes(response.status) ? response.status : 502);
    const safe = rechargePackageSnapshot(response.data);
    return safe ? reply(safe) : reply(unavailable, 502);
  } catch { return reply(unavailable, 503); }
}
