import { coreFetch, runtimeEnvironment } from '@/lib/cloudflare-runtime.mjs';
import { rawIdToken } from "@/lib/admin-bff";
import { NextResponse } from "next/server";

import { verifyIdToken } from "@/lib/verify-id-token";
import { memberMutationError } from '@/lib/member-mutation-policy.mjs';
import { memberProfilePatch, validMemberProfile, validMemberProfileUpdate, readMemberProfileJson } from '@/lib/member-profile.mjs';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Perfil del miembro: GET carga los campos editables, POST guarda "Guardar cambios".
async function ctx() {
  try {
    const idToken = await rawIdToken();
    if (!idToken) return { error: "unauthenticated", status: 401 };
    const id = await identityFromIdToken(idToken);
    if (!id.email) return { error: "session-invalid", status: 401 };
    const env = runtimeEnvironment();
    const base = env.VP_PAYMENTS_URL;
    const token = env.PAYMENTS_SERVICE_TOKEN;
    if (!base || !token) return { error: "payments-unconfigured", status: 503 };
    return { idToken, id, base, token };
  } catch { return { error: 'authentication_unavailable', status: 503 }; }
}

const responseHeaders = { 'Cache-Control': 'private, no-store' };
const reply = (body, status = 200) => NextResponse.json(body, { status, headers: responseHeaders });
const safeErrors = new Set(['account_suspended', 'invalid_wallet', 'person_not_found', 'invalid_id_token',
  'core_not_ready', 'financial_review_required', 'financial_mutations_unavailable', 'service_read_only']);
const upstreamFailure = (response, data) => reply({ error: safeErrors.has(data?.error) ? data.error : 'profile-unavailable' },
  [400, 401, 403, 404, 409, 422, 429, 503].includes(response.status) ? response.status : 502);

export async function GET(request) {
  const c = await ctx();
  if (c.error) return reply({ error: c.error }, c.status);
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(12000)]);
  try {
    const resp = await coreFetch(`${c.base}/api/member/profile?email=${encodeURIComponent(c.id.email)}`, {
      headers: { "X-VP-Service-Token": c.token, "X-VP-Id-Token": c.idToken },
      cache: "no-store",
      redirect: 'manual', signal,
    });
    const data = await readMemberProfileJson(resp.body, signal);
    if (!resp.ok) return upstreamFailure(resp, data);
    return validMemberProfile(data) ? reply(data) : reply({ error: 'invalid-profile-response' }, 502);
  } catch {
    return reply({ error: "payments-unreachable" }, 502);
  }
}

export async function POST(request) {
  const invalidOrigin = memberMutationError(request, runtimeEnvironment());
  if (invalidOrigin) return reply({ error: invalidOrigin.error }, invalidOrigin.status);
  const c = await ctx();
  if (c.error) return reply({ error: c.error }, c.status);
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(12000)]);
  let body;
  try { body = memberProfilePatch(await readMemberProfileJson(request.body, signal)); }
  catch (error) { return reply({ error: error instanceof RangeError ? 'request_too_large' : 'invalid-json' }, error instanceof RangeError ? 413 : 400); }
  if (!body) return reply({ error: 'invalid-profile-fields' }, 400);
  try {
    const resp = await coreFetch(`${c.base}/api/member/profile`, {
      method: "POST",
      headers: { "content-type": "application/json", "X-VP-Service-Token": c.token, "X-VP-Id-Token": c.idToken },
      body: JSON.stringify({ ...body, email: c.id.email }),
      cache: "no-store",
      redirect: 'manual', signal,
    });
    const data = await readMemberProfileJson(resp.body, signal);
    if (!resp.ok) return upstreamFailure(resp, data);
    return validMemberProfileUpdate(data) ? reply(data) : reply({ error: 'profile-outcome-unconfirmed' }, 502);
  } catch {
    return reply({ error: "profile-outcome-unconfirmed" }, 502);
  }
}

async function identityFromIdToken(token) {
  const payload = await verifyIdToken(token);
  return { email: payload ? payload.email : "" };
}
