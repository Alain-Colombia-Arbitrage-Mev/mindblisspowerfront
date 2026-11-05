import { coreFetch } from '@/lib/cloudflare-runtime.mjs';
import { rawIdToken } from "@/lib/admin-bff";
import { NextResponse } from "next/server";

import { verifiedEmailFromIdTokenForSession as verifiedEmailFromIdToken } from "@/lib/verify-id-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const privateHeaders = { "Cache-Control": "private, no-store", Vary: "Cookie" };

/** Lista los documentos KYC del miembro + su kyc_status global. */
export async function GET() {
  let idToken, email;
  try {
    idToken = await rawIdToken();
    if (!idToken) return NextResponse.json({ error: "unauthenticated" }, { status: 401, headers: privateHeaders });
    email = await verifiedEmailFromIdToken(idToken);
    if (!email) return NextResponse.json({ error: "session-invalid" }, { status: 401, headers: privateHeaders });
  } catch {
    return NextResponse.json({ error: "authentication_unavailable" }, { status: 503, headers: privateHeaders });
  }

  const base = process.env.VP_PAYMENTS_URL;
  const token = process.env.PAYMENTS_SERVICE_TOKEN;
  if (!base || !token) return NextResponse.json({ error: "payments-unconfigured" }, { status: 503 });

  try {
    const resp = await coreFetch(`${base}/api/member/kyc/documents?email=${encodeURIComponent(email)}`, {
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
