import { NextResponse } from "next/server";

import { isAdminEmail, sessionEmail } from "@/lib/admin-bff";
import { memberDb } from "@/lib/member-db";

/**
 * Guard compartido de los endpoints del árbol completo (solo admin).
 * Devuelve { sql } si el llamador es admin, o { error } con un NextResponse
 * listo para retornar. Fail-closed: cualquier fallo ⇒ 401/403.
 *
 * Reusa memberDb() (rol read-only vp_web→app_read) — estos endpoints son de
 * solo lectura del árbol; ninguna mutación pasa por aquí.
 */
export async function requireAdminTree() {
  const email = await sessionEmail();
  if (!email) {
    return { error: NextResponse.json({ error: "unauthenticated" }, { status: 401 }) };
  }
  if (!(await isAdminEmail(email))) {
    return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  let sql;
  try {
    sql = memberDb();
  } catch {
    return { error: NextResponse.json({ error: "tree-unavailable" }, { status: 503 }) };
  }
  return { sql };
}

// Normaliza una fila de afiliado del árbol a la forma que consume la UI.
// "Baneado" = persona en lista negra o suspendida/baneada; el árbol lo pinta
// distinto. handle sale de invitation_link (identificador público del referido).
export function shapeNode(row) {
  const inactiveStatuses = new Set(["suspended", "banned", "deleted"]);
  const banned = row.blacklisted === true
    || row.listed_by_blacklist === true
    || inactiveStatuses.has(row.person_status)
    || inactiveStatuses.has(row.aff_status);
  return {
    id: String(row.id),
    parentId: row.parent_id == null ? null : String(row.parent_id),
    side: row.position || null,
    handle: banned ? "" : row.handle || "",
    name: banned ? "Not Available" : (row.name || "").trim() || "—",
    email: banned ? "" : row.email || "",
    status: banned ? "unavailable" : row.person_status || row.aff_status || "",
    banned,
    rank: row.rank_code ? { code: row.rank_code, name: row.rank_name } : null,
    hasChildren: row.has_children === true,
  };
}
