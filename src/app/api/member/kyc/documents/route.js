import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { verifiedEmailFromIdToken } from "@/lib/verify-id-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Lista los documentos KYC del miembro + su kyc_status global. */
export async function GET() {
  const cookieStore = await cookies();
  const idToken = cookieStore.get("vp_id_token")?.value;
  if (!idToken) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const email = await verifiedEmailFromIdToken(idToken);
  if (!email) return NextResponse.json({ error: "session-invalid" }, { status: 401 });

  const base = process.env.VP_PAYMENTS_URL;
  const token = process.env.PAYMENTS_SERVICE_TOKEN;
  if (!base || !token) return NextResponse.json({ error: "payments-unconfigured" }, { status: 503 });

  try {
    const resp = await fetch(`${base}/api/member/kyc/documents?email=${encodeURIComponent(email)}`, {
      headers: { "X-VP-Service-Token": token, "X-VP-Id-Token": idToken },
      cache: "no-store",
    });
    const payload = await resp.json().catch(() => ({}));
    if (!resp.ok) return NextResponse.json({ error: payload.error || "kyc-list-failed" }, { status: resp.status });
    return NextResponse.json(payload);
  } catch (error) {
    console.error("kyc/documents proxy failed:", error.message);
    return NextResponse.json({ error: "payments-unreachable" }, { status: 502 });
  }
}
