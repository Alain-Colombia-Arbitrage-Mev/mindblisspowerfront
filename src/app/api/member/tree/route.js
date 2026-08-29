import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { memberDb } from "@/lib/member-db";
import { verifiedEmailFromIdToken } from "@/lib/verify-id-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Posición y rango del miembro autenticado en el árbol binario.
 * Directiva árbol 2.0: se expone posición, sponsor, profundidad, rango,
 * puntos propios de carrera y estado operativo. No se exponen PV/carry/saldos
 * de otros miembros.
 */
export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const depthLimit = parseDepth(params.get("depth"));
  const rowLimit = parseLimit(params.get("limit"), depthLimit === 0 ? 2000 : 1000);
  const queryLimit = rowLimit + 1;
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
    return NextResponse.json({ error: "tree-unavailable" }, { status: 503 });
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

    const me = await sql`
      SELECT a.id,
             a.parent_id,
             a.sponsor_id,
             a.depth,
             a.position,
             a.status,
             p.first_name || ' ' || p.last_name AS full_name,
             r.code        AS rank_code,
             r.name_es     AS rank_name,
             r.display_order AS rank_order,
             sp.first_name || ' ' || sp.last_name AS sponsor_name,
             pp.first_name || ' ' || pp.last_name AS parent_name,
             EXISTS (
               SELECT 1
                 FROM mlm.affiliate_package ap
                WHERE ap.affiliate_id = a.id
                  AND ap.status = 'active'
             ) AS active_package
        FROM mlm.person p
        JOIN mlm.affiliate a       ON a.person_id = p.id
        LEFT JOIN mlm.rank r       ON r.id = a.current_rank_id
        LEFT JOIN mlm.affiliate s  ON s.id = a.sponsor_id
        LEFT JOIN mlm.person sp    ON sp.id = s.person_id
        LEFT JOIN mlm.affiliate pa ON pa.id = a.parent_id
        LEFT JOIN mlm.person pp    ON pp.id = pa.person_id
       WHERE lower(p.email) = ${email}
         AND a.status = 'active'
         AND p.status = 'active'
         AND NOT COALESCE(p.blacklisted, false)
         AND NOT EXISTS (
           SELECT 1
             FROM mlm.blacklist b
            WHERE (b.email_norm IS NOT NULL AND b.email_norm = mlm.norm_email(p.email))
               OR (b.phone_last10 IS NOT NULL AND b.phone_last10 = mlm.norm_phone10(p.phone_number))
               OR (b.name_norm IS NOT NULL
                   AND b.name_norm = mlm.norm_name(p.first_name || ' ' || p.last_name)
                   AND (b.birthdate IS NULL OR (p.birthday IS NOT NULL AND b.birthdate = p.birthday)))
         )
       LIMIT 1`;

    if (me.length === 0) {
      return NextResponse.json({ positioned: false }, { status: 200 });
    }

    const root = me[0];

    let rankProgress = null;
    try {
      const progress = await sql`
        SELECT points_left_eff::text,
               points_right_eff::text,
               points_qualifying::text,
               next_rank_code,
               next_rank_points::text,
               next_rank_bonus_usd::text,
               pct_to_next_rank::text
          FROM mlm.v_rank_progress
         WHERE affiliate_id = ${root.id}
         LIMIT 1`;
      if (progress.length > 0) {
        const row = progress[0];
        rankProgress = {
          leftPoints: row.points_left_eff || "0",
          rightPoints: row.points_right_eff || "0",
          qualifyingPoints: row.points_qualifying || "0",
          nextRank: row.next_rank_code
            ? {
                code: row.next_rank_code,
                requiredPoints: row.next_rank_points || "0",
                bonusUsd: row.next_rank_bonus_usd || "0",
                progressPct: row.pct_to_next_rank || "0",
              }
            : null,
        };
      }
    } catch (error) {
      console.warn("member/tree rank progress unavailable:", error.message);
    }

    // Subárbol descendente configurable bajo el miembro vía CTE recursivo por
    // parent_id (el árbol es profundo: sin GiST sobre path). Se incluye rootSide
    // para que los conteos izquierda/derecha sean correctos a cualquier nivel.
    const descendants = await sql`
      WITH RECURSIVE sub AS (
        SELECT a.id,
               a.parent_id,
               a.position,
               a.position AS root_side,
               a.status,
               a.current_rank_id,
               a.person_id,
               a.sponsor_id,
               1 AS level,
               ARRAY[a.id]::bigint[] AS path_ids
          FROM mlm.affiliate a
          JOIN mlm.person p ON p.id = a.person_id
         WHERE a.parent_id = ${root.id}
           AND a.status = 'active'
           AND p.status = 'active'
           AND NOT COALESCE(p.blacklisted, false)
           AND NOT EXISTS (
             SELECT 1
               FROM mlm.blacklist b
              WHERE (b.email_norm IS NOT NULL AND b.email_norm = mlm.norm_email(p.email))
                 OR (b.phone_last10 IS NOT NULL AND b.phone_last10 = mlm.norm_phone10(p.phone_number))
                 OR (b.name_norm IS NOT NULL
                     AND b.name_norm = mlm.norm_name(p.first_name || ' ' || p.last_name)
                     AND (b.birthdate IS NULL OR (p.birthday IS NOT NULL AND b.birthdate = p.birthday)))
           )
        UNION ALL
        SELECT a.id,
               a.parent_id,
               a.position,
               sub.root_side,
               a.status,
               a.current_rank_id,
               a.person_id,
               a.sponsor_id,
               sub.level + 1,
               sub.path_ids || a.id
          FROM mlm.affiliate a
          JOIN sub ON a.parent_id = sub.id
          JOIN mlm.person p ON p.id = a.person_id
         WHERE (${depthLimit} = 0 OR sub.level < ${depthLimit})
           AND NOT (a.id = ANY(sub.path_ids))
           AND a.status = 'active'
           AND p.status = 'active'
           AND NOT COALESCE(p.blacklisted, false)
           AND NOT EXISTS (
             SELECT 1
               FROM mlm.blacklist b
              WHERE (b.email_norm IS NOT NULL AND b.email_norm = mlm.norm_email(p.email))
                 OR (b.phone_last10 IS NOT NULL AND b.phone_last10 = mlm.norm_phone10(p.phone_number))
                 OR (b.name_norm IS NOT NULL
                     AND b.name_norm = mlm.norm_name(p.first_name || ' ' || p.last_name)
                     AND (b.birthdate IS NULL OR (p.birthday IS NOT NULL AND b.birthdate = p.birthday)))
           )
      )
      SELECT d.id,
             d.parent_id,
             d.position,
             d.root_side,
             d.level,
             dp.first_name || ' ' || split_part(dp.last_name, ' ', 1) AS display_name,
             dr.code    AS rank_code,
             dr.name_es AS rank_name,
             d.status,
             EXISTS (
               SELECT 1
                 FROM mlm.affiliate_package ap
                WHERE ap.affiliate_id = d.id
                  AND ap.status = 'active'
             ) AS active_package,
             sp.first_name || ' ' || split_part(sp.last_name, ' ', 1) AS sponsor_name
        FROM sub d
        JOIN mlm.person dp    ON dp.id = d.person_id
        LEFT JOIN mlm.rank dr ON dr.id = d.current_rank_id
        LEFT JOIN mlm.affiliate sa ON sa.id = d.sponsor_id
        LEFT JOIN mlm.person sp ON sp.id = sa.person_id
       ORDER BY d.level, d.parent_id NULLS FIRST, d.position NULLS FIRST, d.id
       LIMIT ${queryLimit}`;

    const visibleDescendants = descendants.slice(0, rowLimit);

    return NextResponse.json({
      positioned: true,
      me: {
        affiliateId: String(root.id),
        name: root.full_name,
        parentId: root.parent_id == null ? null : String(root.parent_id),
        sponsorId: root.sponsor_id == null ? null : String(root.sponsor_id),
        depth: root.depth,
        side: root.position,
        status: root.status,
        activePackage: Boolean(root.active_package),
        rank: root.rank_code
          ? { code: root.rank_code, name: root.rank_name, order: root.rank_order }
          : null,
        sponsor: root.sponsor_name || null,
        parent: root.parent_name || null,
        rankProgress,
      },
      tree: visibleDescendants.map((d) => ({
        id: String(d.id),
        parentId: d.parent_id == null ? null : String(d.parent_id),
        side: d.position,
        rootSide: d.root_side,
        level: Number(d.level),
        name: d.display_name,
        rank: d.rank_code ? { code: d.rank_code, name: d.rank_name } : null,
        status: d.status,
        activePackage: Boolean(d.active_package),
        sponsor: d.sponsor_name || null,
      })),
      meta: {
        depth: depthLimit === 0 ? "all" : depthLimit,
        limit: rowLimit,
        returned: visibleDescendants.length,
        truncated: descendants.length > rowLimit,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("member/tree query failed:", error.message);
    return NextResponse.json({ error: "tree-query-failed" }, { status: 502 });
  }
}

function parseDepth(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (["all", "full", "complete", "completo", "completa"].includes(raw)) return 0;
  if (!raw) return 8;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) return 8;
  return Math.min(parsed, 16);
}

function parseLimit(value, fallback) {
  const parsed = Number(String(value || "").trim());
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return Math.min(Math.max(parsed, 50), 2500);
}
