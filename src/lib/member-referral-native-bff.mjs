import { createHash, createHmac } from 'node:crypto';
import { betterAuthConfig, betterAuthCookies, trustedAuthClientIp } from './better-auth-bridge.mjs';
import { coreFetch, runtimeEnvironment } from './cloudflare-runtime.mjs';
import { boundedServiceRequest } from './private-service-request.mjs';
import { profileSubjectFromHeader, profileSubjectHeader } from './member-profile.mjs';
import { buildReferralLink, referralLinkCode, referralPublicOrigin } from './referral-links.mjs';
import { memberMutationError } from './member-mutation-policy.mjs';
import { readBoundedRequestJson } from './bounded-request-json.mjs';

const origin = 'https://app.mindblisspower.com', path = '/api/member/referral';
const reply = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store, max-age=0', Vary: 'Cookie' } });
// Already-open documents accept exactly the original four fields. A response
// capability changes presentation only; native ownership/immutability never do.
const attributionReply = (request, body) => reply(request.headers.get('x-mindbliss-referral-contract') === 'v2' ? body
  : { ok: body.ok, ref: body.ref, preferred_side: body.preferred_side, positioned: body.positioned });
// Reject control characters in text received over the private JSON boundary.
// eslint-disable-next-line no-control-regex
const text = (value, maximum) => typeof value === 'string' && value.length <= maximum && !/[\u0000-\u001f\u007f]/.test(value);
const count = value => Number.isSafeInteger(value) && value >= 0 && value <= 1_000_000_000;
const safeErrors = new Set(['unauthenticated', 'invalid_origin', 'invalid_auth_proxy', 'member_referral_unconfigured', 'member_referral_unavailable',
  'member_referral_forbidden', 'member_referral_owner_changed', 'member_referral_not_found', 'member_referral_rate_limited', 'member_referral_invalid_request', 'member_referral_invalid_code']);
const upstreamFailure = result => reply({ error: safeErrors.has(result.data?.error) ? result.data.error : 'member_referral_unavailable' },
  [400, 401, 403, 404, 409, 429, 503].includes(result.status) ? result.status : 502);

export function nativeMemberReferral(value, publicOrigin = origin) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || typeof value.positioned !== 'boolean'
    || !referralLinkCode(value.code) || referralLinkCode(value.code) !== value.code || typeof value.generated !== 'boolean'
    || value.placement !== 'automatic' || !text(value.name, 480) || !text(value.sponsor_name, 480)
    || !text(value.sponsor_referral_code, 64) || !['unassigned', 'existing_affiliate', 'referral', 'company'].includes(value.attribution_source)
    || !value.metrics || !['total', 'active', 'pending'].every(key => count(value.metrics[key]))
    || value.metrics.active + value.metrics.pending !== value.metrics.total
    || !Array.isArray(value.referrals) || value.referrals.length > 50
    || value.referrals.some(item => !item || !text(item.id, 128) || !item.id || !text(item.name, 480)
      || !['activo', 'registrado'].includes(item.status) || typeof item.date !== 'string' || item.date.length > 64 || !Number.isFinite(Date.parse(item.date)))) return null;
  const displayedActive = value.referrals.filter(item => item.status === 'activo').length;
  if (value.metrics.total < value.referrals.length || value.metrics.active < displayedActive
    || value.metrics.pending < value.referrals.length - displayedActive) return null;
  return { positioned: value.positioned, code: value.code, link: buildReferralLink(value.code, publicOrigin), name: value.name,
    placement: 'automatic', generated: value.generated, metrics: { total: value.metrics.total, active: value.metrics.active, pending: value.metrics.pending },
    referrals: value.referrals.map(item => ({ id: item.id, name: item.name, status: item.status, date: item.date })),
    sponsor_name: value.sponsor_name, sponsor_referral_code: value.sponsor_referral_code, attribution_source: value.attribution_source };
}

/** Native session ownership; the supplied subject is a mismatch fence only. */
export async function handleNativeMemberReferral(request, { env = runtimeEnvironment(), fetchImpl = coreFetch, serviceRequest = boundedServiceRequest } = {}) {
  const url = new URL(request.url);
  if (request.method !== 'GET') return reply({ error: 'method_not_allowed' }, 405);
  if (url.origin !== origin || env.AUTH_PUBLIC_ORIGIN !== origin || url.pathname !== path) return reply({ error: 'not_found' }, 404);
  if (url.search || url.hash) return reply({ error: 'member_referral_invalid_request' }, 400);
  if (request.headers.has('x-vp-act-as')) return reply({ error: 'impersonation_read_only' }, 403);
  const cookie = betterAuthCookies(request.headers.get('cookie') || ''), subject = profileSubjectFromHeader(request.headers.get('x-mindbliss-referral-subject'));
  if (!/(?:^|;\s*)(?:__Secure-)?better-auth\.session_token=[^;\s,]+(?:;|$)/.test(cookie)) return reply({ error: 'unauthenticated' }, 401);
  if (!subject) return reply({ error: 'member_referral_forbidden' }, 403);
  try {
    const result = await serviceRequest(`${betterAuthConfig(env)}${path}`, { method: 'GET', headers: { cookie, origin,
      'x-mindbliss-referral-subject': profileSubjectHeader(subject) }, signal: request.signal }, fetchImpl);
    if (!result.ok) return upstreamFailure(result);
    const safe = nativeMemberReferral(result.data, referralPublicOrigin(env));
    return safe ? reply(safe) : reply({ error: 'member_referral_unavailable' }, 502);
  } catch { return reply({ error: 'member_referral_unavailable' }, 503); }
}

/** Read the canonical sponsor or capture one explicit post-auth choice. Never a tree move. */
export async function handleNativeReferralAttribution(request, { env = runtimeEnvironment(), fetchImpl = coreFetch, serviceRequest = boundedServiceRequest } = {}) {
  const url = new URL(request.url), mutation = request.method === 'POST', target = '/api/member/referral-attribution';
  if (!['GET', 'POST'].includes(request.method)) return reply({ error: 'method_not_allowed' }, 405);
  if (url.origin !== origin || env.AUTH_PUBLIC_ORIGIN !== origin || url.pathname !== target) return reply({ error: 'not_found' }, 404);
  if (url.search || url.hash) return reply({ error: 'member_referral_invalid_request' }, 400);
  if (request.headers.has('x-vp-act-as')) return reply({ error: 'impersonation_read_only' }, 403);
  const cookie = betterAuthCookies(request.headers.get('cookie') || ''), subject = profileSubjectFromHeader(request.headers.get('x-mindbliss-referral-subject'));
  if (!/(?:^|;\s*)(?:__Secure-)?better-auth\.session_token=[^;\s,]+(?:;|$)/.test(cookie)) return reply({ error: 'unauthenticated' }, 401);
  if (!subject) return reply({ error: 'member_referral_forbidden' }, 403);
  let body;
  if (mutation) {
    const denied = memberMutationError(request, env); if (denied) return reply({ error: denied.error }, denied.status);
    try {
      const input = await readBoundedRequestJson(request, { maxBytes: 2048 });
      if (!input || typeof input !== 'object' || Array.isArray(input) || !Object.hasOwn(input, 'ref')
        || Object.keys(input).some(key => !['ref', 'preferred_side', 'expected_email'].includes(key))
        || typeof input.ref !== 'string' || (input.ref !== '' && referralLinkCode(input.ref) !== input.ref)
        || (Object.hasOwn(input, 'preferred_side') && input.preferred_side !== '')
        || (Object.hasOwn(input, 'expected_email') && (typeof input.expected_email !== 'string' || input.expected_email.length > 254
          || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.expected_email)))) return reply({ error: 'member_referral_invalid_request' }, 400);
      body = { ref: input.ref };
    } catch { return reply({ error: 'member_referral_invalid_request' }, 400); }
  }
  try {
    const nativePath = mutation ? target : path, method = mutation ? 'POST' : 'GET';
    const headers = { cookie, origin, 'x-mindbliss-referral-subject': profileSubjectHeader(subject) }, serialized = body ? JSON.stringify(body) : '';
    if (mutation) {
      const timestamp = String(Math.floor(Date.now() / 1000)), ip = trustedAuthClientIp(request.headers, env), hash = value => createHash('sha256').update(value).digest('hex');
      headers['content-type'] = 'application/json'; headers['x-vp-auth-client-ip'] = ip; headers['x-vp-auth-timestamp'] = timestamp;
      headers['x-vp-auth-signature'] = createHmac('sha256', env.AUTH_BFF_SHARED_SECRET).update([method, nativePath, timestamp, ip, hash(cookie), hash(serialized)].join('\n')).digest('hex');
    }
    const result = await serviceRequest(`${betterAuthConfig(env)}${nativePath}`, { method, headers, ...(body ? { body: serialized } : {}), signal: request.signal }, fetchImpl);
    if (!result.ok) return upstreamFailure(result);
    if (!mutation) {
      const safe = nativeMemberReferral(result.data, referralPublicOrigin(env));
      if (!safe || !['unassigned', 'existing_affiliate', 'referral', 'company'].includes(safe.attribution_source)) return reply({ error: 'member_referral_unavailable' }, 502);
      return attributionReply(request, { ok: true, ref: safe.positioned ? '' : safe.sponsor_referral_code, preferred_side: '', positioned: safe.positioned,
        immutable: safe.attribution_source !== 'unassigned' });
    }
    const value = result.data;
    if (!value || value.ok !== true || typeof value.positioned !== 'boolean' || value.preferred_side !== '' || value.immutable !== true
      || typeof value.ref !== 'string' || (value.ref !== '' && referralLinkCode(value.ref) !== value.ref)
      || (value.positioned && value.ref)) return reply({ error: 'member_referral_unavailable' }, 502);
    return attributionReply(request, { ok: true, ref: value.ref, preferred_side: '', positioned: value.positioned, immutable: true });
  } catch { return reply({ error: 'member_referral_unavailable' }, 503); }
}
