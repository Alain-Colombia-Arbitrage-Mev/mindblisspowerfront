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
    const access = await sql`
      SELECT p.status::text AS status,
             COALESCE(p.blacklisted, false) AS blacklisted,
             EXISTS (
               SELECT 1
                 FROM mlm.blacklist b
                WHERE (b.email_norm IS NOT NULL AND b.email_norm = mlm.norm_email(p.email))
                   OR (b.phone_last10 IS NOT NULL AND b.phone_last10 = mlm.norm_phone10(p.phone_number))
                   OR (b.name_norm IS NOT NULL
                       AND b.name_norm = mlm.norm_name(p.first_name || ' ' || p.last_name)
                       AND (b.birthdate IS NULL OR (p.birthday IS NOT NULL AND b.birthdate = p.birthday)))
             ) AS listed_by_blacklist
        FROM mlm.person p
       WHERE lower(p.email) = ${email}
       LIMIT 1`;

    if (access.length > 0) {
      const row = access[0];
      if (row.blacklisted || row.listed_by_blacklist || ["suspended", "banned", "deleted"].includes(row.status)) {
        return NextResponse.json({ error: "account_suspended", positioned: false }, { status: 403 });
      }
    }

    const rows = await sql`
      SELECT a.id, a.invitation_link
        FROM mlm.person p
        JOIN mlm.affiliate a ON a.person_id = p.id
       WHERE lower(p.email) = ${email}
         AND p.status = 'active'
         AND a.status = 'active'
         AND NOT COALESCE(p.blacklisted, false)
       LIMIT 1`;

    if (rows.length === 0) {
      return NextResponse.json({
        positioned: false,
        code: null,
        link: null,
        metrics: { total: 0, active: 0, pending: 0 },
        referrals: [],
      }, { status: 200 });
    }

    const affiliate = rows[0];
    const code = affiliate.invitation_link || deriveCode(affiliate.id);
    const linkLeft = `${REF_BASE_URL}/register?ref=${encodeURIComponent(code)}&side=L`;
    const linkRight = `${REF_BASE_URL}/register?ref=${encodeURIComponent(code)}&side=R`;
    const referrals = await sql`
      SELECT child.id,
             trim(rp.first_name || ' ' || split_part(rp.last_name, ' ', 1)) AS display_name,
             child.created_at,
             EXISTS (
               SELECT 1
                 FROM mlm.affiliate_package ap
                WHERE ap.affiliate_id = child.id
                  AND ap.status = 'active'
             ) AS active_package
        FROM mlm.affiliate child
        JOIN mlm.person rp ON rp.id = child.person_id
       WHERE child.sponsor_id = ${affiliate.id}
         AND child.status = 'active'
         AND rp.status = 'active'
         AND NOT COALESCE(rp.blacklisted, false)
         AND NOT EXISTS (
           SELECT 1
             FROM mlm.blacklist b
            WHERE (b.email_norm IS NOT NULL AND b.email_norm = mlm.norm_email(rp.email))
               OR (b.phone_last10 IS NOT NULL AND b.phone_last10 = mlm.norm_phone10(rp.phone_number))
               OR (b.name_norm IS NOT NULL
                   AND b.name_norm = mlm.norm_name(rp.first_name || ' ' || rp.last_name)
                   AND (b.birthdate IS NULL OR (rp.birthday IS NOT NULL AND b.birthdate = rp.birthday)))
         )
       ORDER BY child.created_at DESC
       LIMIT 50`;

    const normalizedReferrals = referrals.map((ref) => ({
      id: String(ref.id),
      name: ref.display_name || "Miembro",
      status: ref.active_package ? "activo" : "registrado",
      date: ref.created_at,
    }));
    const active = normalizedReferrals.filter((ref) => ref.status === "activo").length;

    return NextResponse.json({
      positioned: true,
      code,
      // `link` remains for older clients; new UI uses the explicit pair.
      link: linkLeft,
      link_left: linkLeft,
      link_right: linkRight,
      links: { left: linkLeft, right: linkRight },
      generated: !affiliate.invitation_link,
      metrics: {
        total: normalizedReferrals.length,
        active,
        pending: Math.max(0, normalizedReferrals.length - active),
      },
      referrals: normalizedReferrals,
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
