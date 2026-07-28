import { NextResponse } from "next/server";

import { requireAdminTree, shapeNode } from "../_guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Hijos directos de un nodo del árbol binario (≤2: pierna L y R). Carga
 * perezosa: la UI llama esto al expandir un nodo, no vuelca los 120k de golpe.
 */
export async function GET(request) {
  const { sql, error } = await requireAdminTree();
  if (error) return error;

  const parentId = Number(new URL(request.url).searchParams.get("parent_id"));
  if (!Number.isInteger(parentId) || parentId <= 0) {
    return NextResponse.json({ error: "bad_parent_id" }, { status: 400 });
  }

  try {
    const rows = await sql`
      SELECT a.id,
             a.parent_id,
             a.position,
             COALESCE(a.invitation_link, '') AS handle,
             p.first_name || ' ' || p.last_name AS name,
             p.email::text AS email,
             p.status       AS person_status,
             p.blacklisted,
             a.status       AS aff_status,
             r.code         AS rank_code,
             r.name_es      AS rank_name,
             EXISTS(SELECT 1 FROM mlm.affiliate c WHERE c.parent_id = a.id) AS has_children
        FROM mlm.affiliate a
        JOIN mlm.person p      ON p.id = a.person_id
        LEFT JOIN mlm.rank r   ON r.id = a.current_rank_id
       WHERE a.parent_id = ${parentId}
       ORDER BY a.position`;

    return NextResponse.json({ parentId: String(parentId), children: rows.map(shapeNode) });
  } catch (e) {
    console.error("admin/tree/children failed:", e.message);
    return NextResponse.json({ error: "tree-query-failed" }, { status: 502 });
  }
}
