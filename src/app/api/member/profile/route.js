import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Perfil del miembro: GET carga los campos editables, POST guarda "Guardar cambios".
async function ctx() {
  const cookieStore = await cookies();
  const idToken = cookieStore.get("vp_id_token")?.value;
  if (!idToken) return { error: "unauthenticated", status: 401 };
  const id = identityFromIdToken(idToken);
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
    const resp = await fetch(`${c.base}/api/member/profile?email=${encodeURIComponent(c.id.email)}`, {
      headers: { "X-VP-Service-Token": c.token, "X-VP-Id-Token": c.idToken },
      cache: "no-store",
    });
    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch {
    return NextResponse.json({ error: "payments-unreachable" }, { status: 502 });
  }
}

export async function POST(request) {
  const c = await ctx();
  if (c.error) return NextResponse.json({ error: c.error }, { status: c.status });
  const body = await request.json().catch(() => ({}));
  try {
    const resp = await fetch(`${c.base}/api/member/profile`, {
      method: "POST",
      headers: { "content-type": "application/json", "X-VP-Service-Token": c.token, "X-VP-Id-Token": c.idToken },
      body: JSON.stringify({
        email: c.id.email,
        name: body.name,
        phone: body.phone,
        country: body.country,
        payout_wallet_usdc: body.payout_wallet_usdc,
      }),
      cache: "no-store",
    });
    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch {
    return NextResponse.json({ error: "payments-unreachable" }, { status: 502 });
  }
}

function identityFromIdToken(token) {
  try {
    const payload = JSON.parse(Buffer.from(String(token).split(".")[1], "base64url").toString("utf8"));
    if (payload.exp && payload.exp * 1000 < Date.now()) return { email: "" };
    return { email: String(payload.email || "").trim().toLowerCase() };
  } catch {
    return { email: "" };
  }
}
