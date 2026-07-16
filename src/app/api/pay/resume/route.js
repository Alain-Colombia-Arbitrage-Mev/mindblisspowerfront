import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Link público de "reanudar pago" (desde el correo de carrito abandonado).
 * vp-payments valida el token HMAC, regenera la sesión de Stripe para ese
 * carrito y devuelve la URL; aquí redirigimos (303) al checkout. No requiere
 * login: la seguridad es el token infalsificable de la URL.
 */
export async function GET(request) {
  const t = new URL(request.url).searchParams.get("t") || "";
  const base = process.env.VP_PAYMENTS_URL;
  const token = process.env.PAYMENTS_SERVICE_TOKEN;
  const fallback = new URL("/dashboard/packages", request.url);

  if (!t || !base || !token) {
    return NextResponse.redirect(fallback, 303);
  }
  try {
    const resp = await fetch(`${base}/api/payments/resume?t=${encodeURIComponent(t)}`, {
      headers: { "X-VP-Service-Token": token },
      cache: "no-store",
    });
    const data = await resp.json().catch(() => null);
    if (resp.ok && data?.url) {
      return NextResponse.redirect(data.url, 303);
    }
  } catch {
    // cae al fallback
  }
  return NextResponse.redirect(fallback, 303);
}
