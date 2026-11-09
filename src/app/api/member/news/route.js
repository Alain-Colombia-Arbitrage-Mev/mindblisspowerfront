import { coreFetch } from '@/lib/cloudflare-runtime.mjs';
import { rawIdToken } from "@/lib/admin-bff";
import { NextResponse } from "next/server";

import { verifyIdTokenForSession as verifyIdToken } from "@/lib/verify-id-token";
import { AuthServiceUnavailable } from "@/lib/better-auth-bridge.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Comunicados/news del miembro servidos desde el backend (support.news).
// Reemplaza el array hardcodeado (que incluía datos bancarios OBSOLETOS: el
// negocio cobra SOLO por Stripe). Espeja el patrón de member/profile.
async function ctx() {
  try {
    const idToken = await rawIdToken();
    if (!idToken) return { error: "unauthenticated", status: 401 };
    const payload = await verifyIdToken(idToken);
    if (!payload?.email) return { error: "session-invalid", status: 401 };
    const base = process.env.VP_PAYMENTS_URL;
    const token = process.env.PAYMENTS_SERVICE_TOKEN;
    if (!base || !token) return { error: "payments-unconfigured", status: 503 };
    return { idToken, email: payload.email, base, token };
  } catch (error) {
    if (!(error instanceof AuthServiceUnavailable)) throw error;
    return { error: 'authentication_unavailable', status: 503 };
  }
}

const reply = (body, status = 200) => NextResponse.json(body, {
  status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' },
});

export async function GET() {
  const c = await ctx();
  if (c.error) return reply({ error: c.error }, c.status);
  try {
    const resp = await coreFetch(`${c.base}/api/member/news`, {
      headers: { "X-VP-Service-Token": c.token, "X-VP-Id-Token": c.idToken },
      cache: "no-store",
    });
    const data = await resp.json().catch(() => ({}));
    return reply(data, resp.status);
  } catch {
    return reply({ error: "payments-unreachable" }, 502);
  }
}
