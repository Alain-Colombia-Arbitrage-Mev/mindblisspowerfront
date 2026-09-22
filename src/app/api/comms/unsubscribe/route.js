import { NextResponse } from "next/server";

import { authRateLimit } from "@/lib/auth-rate-limit";
import { extractToken } from "./token.mjs";

export const runtime = "nodejs";

// UNAVAILABLE: el backend está caído o los comunicados no están habilitados en
// la instancia que atendió. NO es culpa del enlace: devolver 400 "Enlace
// inválido" hacía que la persona abandonara creyendo que su baja no se podía
// procesar nunca. Un 503 invita a reintentar y deja rastro en las métricas.
const UNAVAILABLE = "No disponible en este momento. Intenta más tarde o escríbenos a soporte@mindblisspower.com.";

async function unsubscribe(request, token) {
  // Preset propio (no "send"): la baja no manda correo y se concentra en picos
  // tras cada comunicado. Ver src/lib/rate-limit-presets.mjs.
  const limited = authRateLimit(request, { name: "unsubscribe", preset: "unsubscribe", email: token.slice(0, 32) });
  if (limited) return limited;
  const base = process.env.VP_PAYMENTS_URL;
  const svc = process.env.PAYMENTS_SERVICE_TOKEN;
  if (!base || !svc) return NextResponse.json({ error: UNAVAILABLE }, { status: 503 });
  const resp = await fetch(`${base}/api/comms/unsubscribe`, {
    method: "POST",
    headers: { "content-type": "application/json", "X-VP-Service-Token": svc },
    body: JSON.stringify({ token }),
    cache: "no-store",
  }).catch(() => null);
  if (!resp) return NextResponse.json({ error: UNAVAILABLE }, { status: 503 });
  const data = await resp.json().catch(() => ({}));
  if (resp.status === 410) return NextResponse.json({ error: "El enlace expiró. Escríbenos a soporte@mindblisspower.com." }, { status: 410 });
  if (resp.status === 503) return NextResponse.json({ error: UNAVAILABLE }, { status: 503 });
  if (!resp.ok) return NextResponse.json({ error: "Enlace inválido." }, { status: 400 });
  return NextResponse.json({ ok: true, ...data });
}

// POST /api/comms/unsubscribe — JSON {token} (botón de la página) o
// form-urlencoded List-Unsubscribe=One-Click con ?t= (Gmail/Yahoo).
export async function POST(request) {
  const url = new URL(request.url);
  let body = null;
  const ct = request.headers.get("content-type") || "";
  if (ct.includes("application/json")) body = await request.json().catch(() => null);
  const token = extractToken({ t: url.searchParams.get("t") }, body);
  if (!token) return NextResponse.json({ error: "Enlace inválido." }, { status: 400 });
  return unsubscribe(request, token);
}
