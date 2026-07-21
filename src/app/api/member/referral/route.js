import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { memberDb } from "@/lib/member-db";
import { verifiedEmailFromIdToken } from "@/lib/verify-id-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REF_BASE_URL = process.env.REFERRAL_BASE_URL || "https://app.mindblisspower.com";

/**
 * Código y link de referido del miembro autenticado.
 * Usa mlm.affiliate.invitation_link si existe; si es NULL (legacy sin link o
 * recolocado), deriva un código estable y único desde el affiliate.id — sin
 * escribir (el rol web es de solo lectura).
 */
export async function GET() {
  const cookieStore = await cookies();
  const idToken = cookieStore.get("vp_id_token")?.value;
  if (!idToken) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const email = await verifiedEmailFromIdToken(idToken);
  if (!email) {
    return NextResponse.json({ error: "session-invalid" }, { status: 401 });
  }

  let sql;
  try {
    sql = memberDb();
  } catch {
    return NextResponse.json({ error: "referral-unavailable" }, { status: 503 });
  }

  try {
    const rows = await sql`
      SELECT a.id, a.invitation_link
        FROM mlm.person p
        JOIN mlm.affiliate a ON a.person_id = p.id
       WHERE lower(p.email) = ${email}
       LIMIT 1`;

    if (rows.length === 0) {
      return NextResponse.json({ positioned: false }, { status: 200 });
    }

    const affiliate = rows[0];
    const code = affiliate.invitation_link || deriveCode(affiliate.id);
    const link = `${REF_BASE_URL}/register?ref=${encodeURIComponent(code)}`;

    return NextResponse.json({
      positioned: true,
      code,
      link,
      generated: !affiliate.invitation_link,
    });
  } catch (error) {
    console.error("member/referral query failed:", error.message);
    return NextResponse.json({ error: "referral-query-failed" }, { status: 502 });
  }
}

// Código canónico MP{affiliateID} en DECIMAL — DEBE coincidir con el que genera
// y persiste el backend (GetMemberContext) y con lo que resuelve
// ResolveSponsorByCode; de lo contrario el link compartido no resolvería.
function deriveCode(id) {
  return "MP" + String(id);
}
