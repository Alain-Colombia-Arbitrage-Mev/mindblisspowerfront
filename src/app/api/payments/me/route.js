import { coreFetch } from '@/lib/cloudflare-runtime.mjs';
import { rawIdToken } from "@/lib/admin-bff";
import { NextResponse } from "next/server";

import { idTokenHeader } from "@/lib/admin-bff";
import { verifiedEmailFromIdToken } from "@/lib/verify-id-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Resumen de pagos + posición + comisiones del miembro autenticado.
 * Valida la sesión Cognito y delega al servicio Go vp-payments.
 */
export async function GET(request) {
  const idToken = await rawIdToken();
  if (!idToken)
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const email = await verifiedEmailFromIdToken(idToken);
  if (!email)
    return NextResponse.json({ error: "session-invalid" }, { status: 401 });

  const base = process.env.VP_PAYMENTS_URL;
  const token = process.env.PAYMENTS_SERVICE_TOKEN;
  if (!base || !token)
    return NextResponse.json(
      { error: "payments-unconfigured" },
      { status: 503 },
    );

  try {
    const requestUrl = new URL(request.url);
    const fresh = requestUrl.searchParams.get("fresh") === "1";
    const upstreamUrl = `${base}/api/payments/me?email=${encodeURIComponent(email)}${fresh ? "&fresh=1" : ""}`;
    const resp = await coreFetch(upstreamUrl, {
      headers: { "X-VP-Service-Token": token, ...(await idTokenHeader()) },
      cache: "no-store",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(20_000)]),
    });
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
          error: payload.error || "summary-failed",
          ...(retryAfterSec ? { retryAfterSec } : {}),
        },
        {
          status: resp.status,
          headers: {
            "Cache-Control": "private, no-store",
            ...(retryAfterSec ? { "Retry-After": String(retryAfterSec) } : {}),
          },
        },
      );
    }
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("payments/me proxy failed:", error.message);
    return NextResponse.json(
      { error: "payments-unreachable" },
      { status: 502 },
    );
  }
}
