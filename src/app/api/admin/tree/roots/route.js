import { NextResponse } from "next/server";

import { requireAdminTree, shapeNode } from "../_guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Raíces del árbol (parent_id IS NULL): la empresa (afiliado 1) primero y luego
 * las raíces aisladas (baneados re-enraizados). Es la cima de "toda la red".
 */
export async function GET() {
  const { sql, error } = await requireAdminTree();
  if (error) return error;

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
       WHERE a.parent_id IS NULL
       ORDER BY (a.id = 1) DESC, p.blacklisted, a.id`;

    return NextResponse.json({ roots: rows.map(shapeNode) });
  } catch (e) {
    console.error("admin/tree/roots failed:", e.message);
    return NextResponse.json({ error: "tree-query-failed" }, { status: 502 });
  }
}
