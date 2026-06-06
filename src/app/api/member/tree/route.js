import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { memberDb } from "@/lib/member-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Posición y rango del miembro autenticado en el árbol binario.
 * Directiva árbol 2.0: se expone posición (padre/pierna/sponsor/profundidad)
 * y rango — NUNCA volumen (PV, carry, conteos por pierna).
 */
export async function GET() {
  const cookieStore = await cookies();
  const idToken = cookieStore.get("vp_id_token")?.value;

  if (!idToken) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const email = emailFromIdToken(idToken);
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
    const me = await sql`
      SELECT a.id,
             a.depth,
             a.position,
             a.status,
             p.first_name || ' ' || p.last_name AS full_name,
             r.code        AS rank_code,
             r.name_es     AS rank_name,
             r.display_order AS rank_order,
             sp.first_name || ' ' || sp.last_name AS sponsor_name,
             pp.first_name || ' ' || pp.last_name AS parent_name
        FROM mlm.person p
        JOIN mlm.affiliate a       ON a.person_id = p.id
        LEFT JOIN mlm.rank r       ON r.id = a.current_rank_id
        LEFT JOIN mlm.affiliate s  ON s.id = a.sponsor_id
        LEFT JOIN mlm.person sp    ON sp.id = s.person_id
        LEFT JOIN mlm.affiliate pa ON pa.id = a.parent_id
        LEFT JOIN mlm.person pp    ON pp.id = pa.person_id
       WHERE lower(p.email) = ${email}
       LIMIT 1`;

    if (me.length === 0) {
      return NextResponse.json({ positioned: false }, { status: 200 });
    }

    const root = me[0];

    // Subárbol descendente: 3 niveles bajo el miembro vía CTE recursivo por
    // parent_id (el árbol es profundo: sin GiST sobre path). Solo identidad,
    // pierna y rango — sin métricas de volumen.
    const descendants = await sql`
      WITH RECURSIVE sub AS (
        SELECT a.id, a.parent_id, a.position, a.status, a.current_rank_id, a.person_id, 1 AS level
          FROM mlm.affiliate a
         WHERE a.parent_id = ${root.id}
        UNION ALL
        SELECT a.id, a.parent_id, a.position, a.status, a.current_rank_id, a.person_id, sub.level + 1
          FROM mlm.affiliate a
          JOIN sub ON a.parent_id = sub.id
         WHERE sub.level < 3
      )
      SELECT d.id,
             d.parent_id,
             d.position,
             d.level,
             dp.first_name || ' ' || split_part(dp.last_name, ' ', 1) AS display_name,
             dr.code    AS rank_code,
             dr.name_es AS rank_name,
             d.status
        FROM sub d
        JOIN mlm.person dp    ON dp.id = d.person_id
        LEFT JOIN mlm.rank dr ON dr.id = d.current_rank_id
       ORDER BY d.level, d.position NULLS FIRST
       LIMIT 500`;

    return NextResponse.json({
      positioned: true,
      me: {
        affiliateId: String(root.id),
        name: root.full_name,
        depth: root.depth,
        side: root.position,
        status: root.status,
        rank: root.rank_code
          ? { code: root.rank_code, name: root.rank_name, order: root.rank_order }
          : null,
        sponsor: root.sponsor_name || null,
        parent: root.parent_name || null,
      },
      tree: descendants.map((d) => ({
        id: String(d.id),
        parentId: d.parent_id == null ? null : String(d.parent_id),
        side: d.position,
        level: Number(d.level),
        name: d.display_name,
        rank: d.rank_code ? { code: d.rank_code, name: d.rank_name } : null,
        status: d.status,
      })),
    });
  } catch (error) {
    console.error("member/tree query failed:", error.message);
    return NextResponse.json({ error: "tree-query-failed" }, { status: 502 });
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
