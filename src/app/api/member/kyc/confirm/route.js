import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { verifiedEmailFromIdToken } from "@/lib/verify-id-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Confirma en vp-payments que el documento KYC ya se subió a S3; el documento
 * pasa a in_review y mlm.person.kyc_status se actualiza.
 */
export async function POST(request) {
  const cookieStore = await cookies();
  const idToken = cookieStore.get("vp_id_token")?.value;
  if (!idToken) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const email = await verifiedEmailFromIdToken(idToken);
  if (!email) return NextResponse.json({ error: "session-invalid" }, { status: 401 });

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid-json" }, { status: 400 }); }
  const documentId = Number(body?.document_id ?? 0);
  if (!Number.isInteger(documentId) || documentId <= 0) {
    return NextResponse.json({ error: "missing-fields" }, { status: 400 });
  }

  const base = process.env.VP_PAYMENTS_URL;
  const token = process.env.PAYMENTS_SERVICE_TOKEN;
  if (!base || !token) return NextResponse.json({ error: "payments-unconfigured" }, { status: 503 });

  try {
    const resp = await fetch(`${base}/api/member/kyc/confirm`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-VP-Service-Token": token,
        "X-VP-Id-Token": idToken,
      },
      body: JSON.stringify({ email, document_id: documentId }),
      cache: "no-store",
    });
    const payload = await resp.json().catch(() => ({}));
    if (!resp.ok) return NextResponse.json({ error: payload.error || "kyc-confirm-failed" }, { status: resp.status });
    return NextResponse.json(payload);
  } catch (error) {
    console.error("kyc/confirm proxy failed:", error.message);
    return NextResponse.json({ error: "payments-unreachable" }, { status: 502 });
  }
}
