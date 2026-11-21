import { betterAuthConfig, betterAuthCookies } from './better-auth-bridge.mjs';
import { coreFetch, runtimeEnvironment } from './cloudflare-runtime.mjs';
import { profileSubjectFromHeader, profileSubjectHeader } from './member-profile.mjs';
import { PAGAR_COMMISSIONS_PATH, pagarCommissionsSnapshot, pagarCommissionWeek } from './pagar-commissions-contract.mjs';
import { REWON_PUBLIC_ORIGIN } from './portal-request-origin.mjs';
import { boundedServiceRequest } from './private-service-request.mjs';

const appHost = new URL(REWON_PUBLIC_ORIGIN).host;
const reply = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } });
const unavailable = { error: 'pagar_commissions_unavailable' };

export function isPagarCommissionsHost(host, env = runtimeEnvironment()) {
  return host === appHost && env.AUTH_PUBLIC_ORIGIN === REWON_PUBLIC_ORIGIN && env.AUTH_PROVIDER === 'better-auth';
}

export async function handlePagarCommissions(request, { env = runtimeEnvironment(), fetchImpl = coreFetch } = {}) {
  const url = new URL(request.url);
  if (request.method !== 'GET') return reply({ error: 'method_not_allowed' }, 405);
  if (url.origin !== REWON_PUBLIC_ORIGIN || !isPagarCommissionsHost(url.host, env) || url.pathname !== PAGAR_COMMISSIONS_PATH) {
    return reply({ error: 'not_found' }, 404);
  }
  const before = /^\?before=([0-9]{4}-[0-9]{2}-[0-9]{2})$/.exec(url.search)?.[1] ?? null;
  if (url.hash || request.url.endsWith('?') || (url.search && !pagarCommissionWeek(before))) {
    return reply({ error: 'invalid_request' }, 400);
  }
  if (request.headers.has('x-vp-act-as')) return reply({ error: 'impersonation_read_only' }, 403);
  const cookie = betterAuthCookies(request.headers.get('cookie') || '');
  if (!/(?:^|;\s*)(?:__Secure-)?better-auth\.session_token=[^;\s,]+(?:;|$)/.test(cookie)) return reply({ error: 'unauthenticated' }, 401);
  const subject = profileSubjectFromHeader(request.headers.get('x-mindbliss-profile-subject'));
  if (!subject) return reply({ error: 'forbidden' }, 403);

  try {
    const response = await boundedServiceRequest(`${betterAuthConfig(env)}${PAGAR_COMMISSIONS_PATH}${url.search}`, {
      method: 'GET', signal: request.signal,
      headers: { cookie, origin: REWON_PUBLIC_ORIGIN, 'x-mindbliss-profile-subject': profileSubjectHeader(subject) },
    }, fetchImpl);
    if (!response.ok) return reply(unavailable, [400, 401, 403, 404, 409, 429, 503].includes(response.status) ? response.status : 502);
    const projection = pagarCommissionsSnapshot(response.data, before);
    return projection ? reply(projection) : reply(unavailable, 502);
  } catch { return reply(unavailable, 503); }
}
