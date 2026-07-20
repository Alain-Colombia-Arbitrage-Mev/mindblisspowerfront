import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Estado de verificación BMP del miembro autenticado. Lo sirve vp-withdrawals
 * (candado de retiros): devuelve can_withdraw + block_reason para que la UI
 * explique por qué un retiro está bloqueado (cuenta BMP incompleta, etc.).
 */
export async function GET() {
  const cookieStore = await cookies();
  const idToken = cookieStore.get("vp_id_token")?.value;
  if (!idToken) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const email = emailFromIdToken(idToken);
  if (!email) return NextResponse.json({ error: "session-invalid" }, { status: 401 });

  const base = process.env.VP_WITHDRAWALS_URL;
  const token = process.env.PAYMENTS_SERVICE_TOKEN;
  if (!base || !token) return NextResponse.json({ error: "withdrawals-unconfigured" }, { status: 503 });

  try {
    const resp = await fetch(`${base}/api/payments/bmp-status?email=${encodeURIComponent(email)}`, {
      method: "GET",
      headers: { "X-VP-Service-Token": token },
      cache: "no-store",
    });
    const payload = await resp.json().catch(() => ({}));
    if (!resp.ok) return NextResponse.json({ error: payload.error || "bmp-status-failed" }, { status: resp.status });
    return NextResponse.json(payload);
  } catch (error) {
    console.error("payments/bmp-status proxy failed:", error.message);
    return NextResponse.json({ error: "withdrawals-unreachable" }, { status: 502 });
  }
}

function emailFromIdToken(token) {
  try {
    const payload = JSON.parse(Buffer.from(String(token).split(".")[1], "base64url").toString("utf8"));
    if (payload.exp && payload.exp * 1000 < Date.now()) return "";
    return String(payload.email || "").trim().toLowerCase();
  } catch {
    return "";
  }
}
