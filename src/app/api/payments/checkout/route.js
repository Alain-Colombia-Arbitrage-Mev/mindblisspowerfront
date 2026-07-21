import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { idTokenHeader } from "@/lib/admin-bff";
import { verifyIdToken } from "@/lib/verify-id-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * BFF de checkout: valida la sesión Cognito, extrae el email del id token y
 * delega al servicio Go cmd/vp-payments (autenticado por token de servicio).
 * El servicio Go crea la sesión de Stripe Checkout y devuelve la URL.
 */
export async function POST(request) {
  const cookieStore = await cookies();
  const idToken = cookieStore.get("vp_id_token")?.value;
  if (!idToken) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const claims = await claimsFromIdToken(idToken);
  const email = claims.email;
  if (!email) {
    return NextResponse.json({ error: "session-invalid" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid-json" }, { status: 400 });
  }
  const packageId = Number(body?.package_id);
  if (!Number.isInteger(packageId) || packageId <= 0) {
    return NextResponse.json({ error: "invalid-package" }, { status: 400 });
  }
  const ref = String(body?.ref || "").trim().slice(0, 64);

  const base = process.env.VP_PAYMENTS_URL;
  const token = process.env.PAYMENTS_SERVICE_TOKEN;
  if (!base || !token) {
    return NextResponse.json({ error: "payments-unconfigured" }, { status: 503 });
  }

  try {
    const resp = await fetch(`${base}/api/payments/checkout`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-VP-Service-Token": token,
        ...(await idTokenHeader()),
      },
      body: JSON.stringify({ email, package_id: packageId, ref, name: claims.name, phone: claims.phone }),
      cache: "no-store",
    });
    const payload = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      return NextResponse.json({ error: payload.error || "checkout-failed" }, { status: resp.status });
    }
    return NextResponse.json({ url: payload.url, total_usd: payload.total_usd, fee_usd: payload.fee_usd });
  } catch (error) {
    console.error("payments/checkout proxy failed:", error.message);
    return NextResponse.json({ error: "payments-unreachable" }, { status: 502 });
  }
}

async function claimsFromIdToken(token) {
  const payload = await verifyIdToken(token);
  if (!payload) return { email: "" };
  return {
    email: payload.email,
    name: String(payload.name || "").trim(),
    phone: String(payload.phone_number || "").trim(),
  };
}
