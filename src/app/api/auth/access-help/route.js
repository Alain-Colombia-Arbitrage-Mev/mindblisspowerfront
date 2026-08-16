import { NextResponse } from "next/server";

import { authRateLimit } from "@/lib/auth-rate-limit";
import { normalizeEmail } from "@/lib/cognito-api";

export const runtime = "nodejs";

// POST /api/auth/access-help — solicitud de ayuda de acceso desde el login cuando
// el usuario NO recibe el código por ningún canal (email/SMS). Crea un ticket de
// soporte vía vp-payments (service token) para que un asesor valide identidad y le
// dé acceso. Es PÚBLICO (el usuario no tiene sesión); rate-limited por email + IP.
export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const email = normalizeEmail(body.email);
  if (!email) {
    return NextResponse.json({ error: "Ingresa un email válido. / Enter a valid email." }, { status: 400 });
  }

  const limited = authRateLimit(request, { name: "access-help", preset: "send", email });
  if (limited) return limited;

  const base = process.env.VP_PAYMENTS_URL;
  const token = process.env.PAYMENTS_SERVICE_TOKEN;
  if (!base || !token) {
    return NextResponse.json({ error: "Soporte no disponible en este momento." }, { status: 503 });
  }

  try {
    const resp = await fetch(`${base}/api/support/access-help`, {
      method: "POST",
      headers: { "content-type": "application/json", "X-VP-Service-Token": token },
      body: JSON.stringify({
        email,
        phone: String(body.phone || "").trim(),
        note: String(body.note || "").trim(),
      }),
      cache: "no-store",
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      return NextResponse.json({ error: "No se pudo registrar tu solicitud. Intenta de nuevo." }, { status: resp.status });
    }
    return NextResponse.json({ ok: true, id: data.id ?? null });
  } catch {
    return NextResponse.json({ error: "No se pudo registrar tu solicitud. Intenta de nuevo." }, { status: 502 });
  }
}
