import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Resumen de pagos + posición + comisiones del miembro autenticado.
 * Valida la sesión Cognito y delega al servicio Go vp-payments.
 */
export async function GET() {
  const cookieStore = await cookies();
  const idToken = cookieStore.get("vp_id_token")?.value;
  if (!idToken) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const email = emailFromIdToken(idToken);
  if (!email) return NextResponse.json({ error: "session-invalid" }, { status: 401 });

  const base = process.env.VP_PAYMENTS_URL;
  const token = process.env.PAYMENTS_SERVICE_TOKEN;
  if (!base || !token) return NextResponse.json({ error: "payments-unconfigured" }, { status: 503 });

  try {
    const resp = await fetch(`${base}/api/payments/me?email=${encodeURIComponent(email)}`, {
      headers: { "X-VP-Service-Token": token },
      cache: "no-store",
    });
    const payload = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      return NextResponse.json({ error: payload.error || "summary-failed" }, { status: resp.status });
    }
    return NextResponse.json(payload);
  } catch (error) {
    console.error("payments/me proxy failed:", error.message);
    return NextResponse.json({ error: "payments-unreachable" }, { status: 502 });
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
