import { NextResponse } from "next/server";

import { isAdminEmail, sessionEmail, withdrawalsConfig } from "@/lib/admin-bff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Estado BMP de OTRO usuario (Inspector de usuario, solo admin).
 *
 * Llama a vp-withdrawals /api/payments/bmp-status?email=<target> con el token de
 * servicio SIN reenviar X-VP-Id-Token: resolveIdentity del Go compara el email
 * de la query contra el email verificado del token y fallaría con
 * identity_mismatch (el token es del admin, la query es del usuario objetivo).
 * La autorización de admin ya se aplicó aquí (fail-closed).
 */
export async function GET(request) {
  const email = await sessionEmail();
  if (!email) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (!(await isAdminEmail(email))) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const target = (new URL(request.url).searchParams.get("target_email") || "").trim();
  if (!target) return NextResponse.json({ error: "missing_target_email" }, { status: 400 });

  const { base, token } = withdrawalsConfig();
  if (!base || !token) return NextResponse.json({ error: "withdrawals-unconfigured" }, { status: 503 });

  try {
    const resp = await fetch(`${base}/api/payments/bmp-status?email=${encodeURIComponent(target)}`, {
      method: "GET",
      headers: { "X-VP-Service-Token": token },
      cache: "no-store",
    });
    const payload = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      return NextResponse.json({ error: payload.error || "bmp-status-failed" }, { status: resp.status });
    }
    return NextResponse.json(payload);
  } catch (e) {
    console.error("admin/user/bmp proxy failed:", e.message);
    return NextResponse.json({ error: "withdrawals-unreachable" }, { status: 502 });
  }
}
