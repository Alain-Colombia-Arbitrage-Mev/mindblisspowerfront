import { createHash, createHmac } from 'node:crypto';
import { betterAuthConfig, betterAuthCookies, trustedAuthClientIp } from './better-auth-bridge.mjs';
import { coreFetch, runtimeEnvironment } from './cloudflare-runtime.mjs';
import { memberMutationError } from './member-mutation-policy.mjs';
import { boundedServiceRequest } from './private-service-request.mjs';
import { readBoundedRequestJson } from './bounded-request-json.mjs';
import { nativeMemberProfilePatch, validNativeMemberProfile, memberProfileUpdateMatches, profileSubjectFromHeader, profileSubjectHeader } from './member-profile.mjs';

const path = '/api/member/profile', origin = 'https://app.mindblisspower.com';
const reply = (value, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } });
const errors = new Set(['member_profile_unconfigured', 'member_profile_unavailable', 'member_profile_outcome_unconfirmed', 'member_profile_invalid_request', 'member_profile_forbidden',
  'member_profile_not_found', 'member_profile_rate_limited', 'member_profile_owner_changed', 'unauthenticated', 'invalid_origin', 'impersonation_read_only', 'invalid_proxy_context', 'invalid_auth_proxy', 'json_required', 'request_too_large']);

/** Native contact-only capability; the legacy financial service stays read-only. */
export async function handleNativeMemberProfile(request, { env = runtimeEnvironment(), fetchImpl = coreFetch, serviceRequest = boundedServiceRequest } = {}) {
  const url = new URL(request.url), method = request.method;
  if (!['GET', 'POST'].includes(method)) return reply({ error: 'method_not_allowed' }, 405);
  if (url.origin !== origin || env.AUTH_PUBLIC_ORIGIN !== origin || url.pathname !== path) return reply({ error: 'not_found' }, 404);
  if (url.search || url.hash) return reply({ error: 'member_profile_invalid_request' }, 400);
  if (request.headers.has('x-vp-act-as')) return reply({ error: 'impersonation_read_only' }, 403);
  const cookie = betterAuthCookies(request.headers.get('cookie') || '');
  if (!/(?:^|;\s*)(?:__Secure-)?better-auth\.session_token=[^;\s,]+(?:;|$)/.test(cookie)) return reply({ error: 'unauthenticated' }, 401);
  const subject = profileSubjectFromHeader(request.headers.get('x-mindbliss-profile-subject'));
  if (!subject) return reply({ error: 'member_profile_forbidden' }, 403);
  let body;
  if (method === 'POST') {
    const denied = memberMutationError(request, env);
    if (denied) return reply({ error: denied.error }, denied.status);
    try { body = nativeMemberProfilePatch(await readBoundedRequestJson(request, { maxBytes: 4096 })); }
    catch (failure) { return reply({ error: failure?.message === 'request_too_large' ? 'request_too_large' : 'member_profile_invalid_request' }, failure?.message === 'request_too_large' ? 413 : 400); }
    if (!body) return reply({ error: 'member_profile_invalid_request' }, 400);
  }
  try {
    const headers = { cookie, origin, 'x-mindbliss-profile-subject': profileSubjectHeader(subject) }, serialized = body ? JSON.stringify(body) : '';
    if (body) {
      const timestamp = String(Math.floor(Date.now() / 1000)), ip = trustedAuthClientIp(request.headers, env), hash = value => createHash('sha256').update(value).digest('hex');
      headers['content-type'] = 'application/json'; headers['x-vp-auth-client-ip'] = ip; headers['x-vp-auth-timestamp'] = timestamp;
      headers['x-vp-auth-signature'] = createHmac('sha256', env.AUTH_BFF_SHARED_SECRET).update([method, path, timestamp, ip, hash(cookie), hash(serialized)].join('\n')).digest('hex');
    }
    const response = await serviceRequest(`${betterAuthConfig(env)}${path}`, { method, headers, ...(body ? { body: serialized } : {}), signal: request.signal }, fetchImpl);
    if (!response.ok) return reply({ error: errors.has(response.data?.error) ? response.data.error : 'member_profile_unavailable' }, [400, 401, 403, 404, 409, 413, 415, 429, 503].includes(response.status) ? response.status : 502);
    const profile = body ? response.data?.profile : response.data;
    if (!validNativeMemberProfile(profile) || (body && !memberProfileUpdateMatches(response.data, body))) return reply({ error: 'member_profile_outcome_unconfirmed' }, 502);
    const safe = { first_name: profile.first_name, last_name: profile.last_name, phone: profile.phone, country: profile.country, payout_wallet_usdc: profile.payout_wallet_usdc,
      sponsor_name: profile.sponsor_name, sponsor_referral_code: profile.sponsor_referral_code, referral_code: profile.referral_code };
    return reply(body ? { ok: true, profile: safe } : safe);
  } catch { return reply({ error: 'member_profile_unavailable' }, 503); }
}
