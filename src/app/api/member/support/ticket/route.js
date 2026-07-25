import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { verifyIdToken } from "@/lib/verify-id-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Soporte del miembro: POST crea un ticket. El backend deriva/verifica el email
// del id token (resolveIdentity), aquí solo reenviamos subject + body.
async function ctx() {
  const cookieStore = await cookies();
  const idToken = cookieStore.get("vp_id_token")?.value;
  if (!idToken) return { error: "unauthenticated", status: 401 };
  const id = await identityFromIdToken(idToken);
  if (!id.email) return { error: "session-invalid", status: 401 };
  const base = process.env.VP_PAYMENTS_URL;
  const token = process.env.PAYMENTS_SERVICE_TOKEN;
  if (!base || !token) return { error: "payments-unconfigured", status: 503 };
  return { idToken, id, base, token };
}

export async function POST(request) {
  const c = await ctx();
  if (c.error) return NextResponse.json({ error: c.error }, { status: c.status });
  const body = await request.json().catch(() => ({}));
  const subject = (body.subject || "").trim();
  const message = (body.body || "").trim();
  if (!subject || !message) {
    return NextResponse.json({ error: "invalid_ticket" }, { status: 400 });
  }
  try {
    const resp = await fetch(`${c.base}/api/support/ticket`, {
      method: "POST",
      headers: { "content-type": "application/json", "X-VP-Service-Token": c.token, "X-VP-Id-Token": c.idToken },
      body: JSON.stringify({
        email: c.id.email,
        subject,
        body: message,
      }),
      cache: "no-store",
    });
    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch {
    return NextResponse.json({ error: "payments-unreachable" }, { status: 502 });
  }
}

async function identityFromIdToken(token) {
  const payload = await verifyIdToken(token);
  return { email: payload ? payload.email : "" };
}
