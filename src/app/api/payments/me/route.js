import { coreFetch } from '@/lib/cloudflare-runtime.mjs';
import { rawIdToken, idTokenHeader } from "@/lib/admin-bff";
import { NextResponse } from "next/server";

import { verifiedEmailFromIdTokenForSession as verifiedEmailFromIdToken } from "@/lib/verify-id-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const privateHeaders = { "Cache-Control": "private, no-store", Vary: "Cookie" };
const safeErrors = new Set(["invalid_id_token", "id_token_required", "identity_mismatch", "account_suspended",
  "authentication_unavailable", "rate_limited", "too_many_requests", "internal"]);

/**
 * Resumen de pagos + posición + comisiones del miembro autenticado.
 * Verifica la sesión y delega al servicio Go, que vuelve a verificar el mismo JWT.
 */
export async function GET(request) {
  let idToken, email;
  try {
    idToken = await rawIdToken();
    if (idToken) email = await verifiedEmailFromIdToken(idToken);
  } catch {
    return NextResponse.json({ error: "authentication_unavailable" }, {
      status: 503, headers: privateHeaders,
    });
  }
  if (!idToken)
    return NextResponse.json({ error: "unauthenticated" }, { status: 401, headers: privateHeaders });

  if (!email)
    return NextResponse.json({ error: "session-invalid" }, { status: 401, headers: privateHeaders });

  const base = process.env.VP_PAYMENTS_URL;
  const token = process.env.PAYMENTS_SERVICE_TOKEN;
  if (!base || !token)
    return NextResponse.json(
      { error: "payments-unconfigured" },
      { status: 503, headers: privateHeaders },
    );

  try {
    const requestUrl = new URL(request.url);
    const fresh = requestUrl.searchParams.get("fresh") === "1";
    const upstreamUrl = `${base}/api/payments/me?email=${encodeURIComponent(email)}${fresh ? "&fresh=1" : ""}`;
    const resp = await coreFetch(upstreamUrl, {
      headers: { "X-VP-Service-Token": token, ...(await idTokenHeader(idToken)) },
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(20_000)]),
    });
    if (resp.status === 401) {
      // This request already passed local session and JWT verification. A
      // rejected service handoff cannot establish that the browser signed out.
      await resp.body?.cancel().catch(() => {});
      return NextResponse.json({ error: "authentication_unavailable" }, {
        status: 503, headers: privateHeaders,
      });
    }
    const payload = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      const retry = Number(
        payload.retryAfterSec || resp.headers.get("retry-after"),
      );
      const retryAfterSec =
        [429, 503].includes(resp.status) && Number.isFinite(retry) && retry > 0
          ? Math.ceil(Math.min(retry, 86400))
          : 0;
      return NextResponse.json(
        {
          error: safeErrors.has(payload?.error) ? payload.error : "summary-failed",
          ...(retryAfterSec ? { retryAfterSec } : {}),
        },
        {
          status: resp.status,
          headers: {
            ...privateHeaders,
            ...(retryAfterSec ? { "Retry-After": String(retryAfterSec) } : {}),
          },
        },
      );
    }
    return NextResponse.json(payload, {
      headers: privateHeaders,
    });
  } catch {
    return NextResponse.json(
      { error: "payments-unreachable" },
      { status: 502, headers: privateHeaders },
    );
  }
}
