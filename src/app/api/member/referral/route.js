import { rawIdToken } from "@/lib/admin-bff";
import { NextResponse } from "next/server";

import { memberDb } from "@/lib/member-db";
import { verifiedEmailFromIdTokenForSession as verifiedEmailFromIdToken } from "@/lib/verify-id-token";
import { AuthServiceUnavailable } from "@/lib/better-auth-bridge.mjs";
import { runtimeEnvironment } from '@/lib/cloudflare-runtime.mjs';
import { buildReferralLink, referralPublicOrigin } from '@/lib/referral-links.mjs';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function referralResponse(body, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store, max-age=0', Vary: 'Cookie' } });
}

/**
 * Código y link de referido del miembro autenticado.
 * Usa mlm.affiliate.invitation_link si existe; si es NULL (legacy sin link o
 * recolocado), deriva un código estable y único desde el affiliate.id — sin
 * escribir (el rol web es de solo lectura).
 */
export async function GET() {
  let idToken, email;
  try {
    idToken = await rawIdToken();
    if (idToken) email = await verifiedEmailFromIdToken(idToken);
  } catch (error) {
    if (error instanceof AuthServiceUnavailable) return referralResponse({ error: 'authentication_unavailable' }, 503);
    return referralResponse({ error: 'referral-unavailable' }, 503);
  }
  if (!idToken) {
    return referralResponse({ error: "unauthenticated" }, 401);
  }

  if (!email) {
    return referralResponse({ error: "session-invalid" }, 401);
  }

  let sql;
  try {
    sql = memberDb();
  } catch {
    return referralResponse({ error: "referral-unavailable" }, 503);
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
        return referralResponse({ error: "account_suspended", positioned: false }, 403);
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
      return referralResponse({
        positioned: false,
        code: null,
        link: null,
        metrics: { total: 0, active: 0, pending: 0 },
        referrals: [],
      });
    }

    const affiliate = rows[0];
    const code = affiliate.invitation_link || deriveCode(affiliate.id);
    const link = buildReferralLink(code, referralPublicOrigin(runtimeEnvironment()));
    if (!link) throw new Error('invalid_referral_code');
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

    return referralResponse({
      positioned: true,
      code,
      link,
      placement: 'automatic',
      generated: !affiliate.invitation_link,
      metrics: {
        total: normalizedReferrals.length,
        active,
        pending: Math.max(0, normalizedReferrals.length - active),
      },
      referrals: normalizedReferrals,
    });
  } catch {
    console.error("member/referral query failed");
    return referralResponse({ error: "referral-query-failed" }, 502);
  }
}

// Código canónico MP{affiliateID} en DECIMAL — DEBE coincidir con el que genera
// y persiste el backend (GetMemberContext) y con lo que resuelve
// ResolveSponsorByCode; de lo contrario el link compartido no resolvería.
function deriveCode(id) {
  return "MP" + String(id);
}
