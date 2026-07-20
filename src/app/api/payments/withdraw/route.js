import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Solicitud de retiro de comisiones. Valida sesión Cognito y delega al servicio
 * Go (que valida mínimo $100 + saldo disponible y crea mlm.withdrawal_request).
 */
export async function POST(request) {
  const cookieStore = await cookies();
  const idToken = cookieStore.get("vp_id_token")?.value;
  if (!idToken) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const email = emailFromIdToken(idToken);
  if (!email) return NextResponse.json({ error: "session-invalid" }, { status: 401 });

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid-json" }, { status: 400 }); }
  const amount = String(body?.amount ?? "").trim();
  const bankInfo = String(body?.bank_info ?? "").trim();
  if (!amount || bankInfo.length < 6) {
    return NextResponse.json({ error: "missing-fields" }, { status: 400 });
  }

  // El retiro lo sirve vp-withdrawals (candado BMP + débito contable), NO
  // vp-payments. Comparte el mismo service token (una sola credencial para ambos
  // servicios en localhost).
  const base = process.env.VP_WITHDRAWALS_URL;
  const token = process.env.PAYMENTS_SERVICE_TOKEN;
  if (!base || !token) return NextResponse.json({ error: "withdrawals-unconfigured" }, { status: 503 });

  try {
    const resp = await fetch(`${base}/api/payments/withdraw`, {
      method: "POST",
      headers: { "content-type": "application/json", "X-VP-Service-Token": token },
      body: JSON.stringify({ email, amount, bank_info: bankInfo }),
      cache: "no-store",
    });
    const payload = await resp.json().catch(() => ({}));
    if (!resp.ok) return NextResponse.json({ error: payload.error || "withdraw-failed" }, { status: resp.status });
    return NextResponse.json(payload);
  } catch (error) {
    console.error("payments/withdraw proxy failed:", error.message);
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
