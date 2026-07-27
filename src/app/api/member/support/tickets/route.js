import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { verifyIdToken } from "@/lib/verify-id-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Soporte del miembro: GET lista SUS tickets. El backend deriva/verifica el email
// del id token (resolveIdentity) y filtra por él; aquí solo reenviamos la sesión.
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

export async function GET() {
  const c = await ctx();
  if (c.error) return NextResponse.json({ error: c.error }, { status: c.status });
  try {
    const resp = await fetch(`${c.base}/api/support/tickets`, {
      method: "GET",
      headers: { "X-VP-Service-Token": c.token, "X-VP-Id-Token": c.idToken },
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
