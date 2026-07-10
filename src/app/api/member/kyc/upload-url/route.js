import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Pide a vp-payments una URL presignada de PUT para subir un documento KYC.
 * El navegador sube el archivo directo a S3; el binario nunca pasa por aquí.
 */
export async function POST(request) {
  const cookieStore = await cookies();
  const idToken = cookieStore.get("vp_id_token")?.value;
  if (!idToken) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const email = emailFromIdToken(idToken);
  if (!email) return NextResponse.json({ error: "session-invalid" }, { status: 401 });

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid-json" }, { status: 400 }); }

  const docType = String(body?.doc_type ?? "").trim();
  const fileName = String(body?.file_name ?? "").trim();
  const mime = String(body?.mime ?? "").trim();
  const size = Number(body?.size ?? 0);
  if (!docType || !fileName || !mime || !Number.isFinite(size) || size <= 0) {
    return NextResponse.json({ error: "missing-fields" }, { status: 400 });
  }

  const base = process.env.VP_PAYMENTS_URL;
  const token = process.env.PAYMENTS_SERVICE_TOKEN;
  if (!base || !token) return NextResponse.json({ error: "payments-unconfigured" }, { status: 503 });

  try {
    const resp = await fetch(`${base}/api/member/kyc/upload-url`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-VP-Service-Token": token,
        "X-VP-Id-Token": idToken,
      },
      body: JSON.stringify({ email, doc_type: docType, file_name: fileName, mime, size }),
      cache: "no-store",
    });
    const payload = await resp.json().catch(() => ({}));
    if (!resp.ok) return NextResponse.json({ error: payload.error || "kyc-upload-failed" }, { status: resp.status });
    return NextResponse.json(payload);
  } catch (error) {
    console.error("kyc/upload-url proxy failed:", error.message);
    return NextResponse.json({ error: "payments-unreachable" }, { status: 502 });
  }
}

function emailFromIdToken(token) {
  try {
    const payload = JSON.parse(Buffer.from(String(token).split(".")[1], "base64url").toString("utf8"));
    if (payload.exp && payload.exp * 1000 < Date.now()) return "";
    return String(payload.email || "").trim().toLowerCase();
  } catch {
    return "";
  }
}
