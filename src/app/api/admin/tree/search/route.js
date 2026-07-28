import { NextResponse } from "next/server";

import { requireAdminTree } from "../_guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Busca afiliados por handle (invitation_link), email o nombre y devuelve, para
 * cada coincidencia, su CADENA DE ANCESTROS (ids raíz→nodo) para que la UI
 * auto-expanda el árbol hasta él. Prioriza el match exacto de handle.
 */
export async function GET(request) {
  const { sql, error } = await requireAdminTree();
  if (error) return error;

  const q = (new URL(request.url).searchParams.get("q") || "").trim();
  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }
  const like = `%${q}%`;

  try {
    const matches = await sql`
      SELECT a.id,
             a.parent_id,
             a.position,
             COALESCE(a.invitation_link, '') AS handle,
             p.first_name || ' ' || p.last_name AS name,
             p.email::text AS email,
             p.status       AS person_status,
             p.blacklisted
        FROM mlm.affiliate a
        JOIN mlm.person p ON p.id = a.person_id
       WHERE a.invitation_link ILIKE ${like}
          OR p.email::text ILIKE ${like}
          OR (p.first_name || ' ' || p.last_name) ILIKE ${like}
       ORDER BY (lower(a.invitation_link) = lower(${q})) DESC,
                (a.invitation_link ILIKE ${q + "%"}) DESC,
                a.id
       LIMIT 20`;

    if (matches.length === 0) {
      return NextResponse.json({ results: [] });
    }

    const ids = matches.map((m) => Number(m.id));
    // Cadena de ancestros de cada match en UNA sola query recursiva subiendo por
    // parent_id (el árbol no tiene GiST; se recorre hacia arriba, es acotado).
    const paths = await sql`
      WITH RECURSIVE up AS (
        SELECT id, parent_id, id AS match_id, 0 AS d
          FROM mlm.affiliate
         WHERE id = ANY(${ids})
        UNION ALL
        SELECT a.id, a.parent_id, up.match_id, up.d + 1
          FROM mlm.affiliate a
          JOIN up ON a.id = up.parent_id
      )
      SELECT match_id, array_agg(id ORDER BY d DESC) AS path
        FROM up
       GROUP BY match_id`;

    const pathById = new Map(paths.map((r) => [String(r.match_id), r.path.map(String)]));

    const results = matches.map((m) => {
      const banned = m.blacklisted === true || m.person_status === "suspended" || m.person_status === "banned";
      return {
        id: String(m.id),
        handle: m.handle || "",
        name: (m.name || "").trim() || "—",
        email: m.email || "",
        side: m.position || null,
        banned,
        path: pathById.get(String(m.id)) || [String(m.id)],
      };
    });

    return NextResponse.json({ results });
  } catch (e) {
    console.error("admin/tree/search failed:", e.message);
    return NextResponse.json({ error: "tree-query-failed" }, { status: 502 });
  }
}
