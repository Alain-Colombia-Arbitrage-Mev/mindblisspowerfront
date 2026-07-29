import { NextResponse } from "next/server";

import { callPayments, isAdminEmail, sessionEmail } from "@/lib/admin-bff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * BFF del Inspector de usuario (solo admin, fail-closed).
 *   GET    → ficha completa (person_id o target_email; person_id precede)
 *   PUT    → editar identidad (first_name/last_name/new_email/phone)
 *   DELETE → soft-delete (solo super_admin en el backend, confirm="DELETE")
 * El backend Go (vp-payments) re-verifica identidad vía X-VP-Id-Token.
 */
async function requireAdmin() {
  const email = await sessionEmail();
  if (!email) return { error: NextResponse.json({ error: "unauthenticated" }, { status: 401 }) };
  if (!(await isAdminEmail(email))) return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  return { email };
}

export async function GET(request) {
  const { email, error } = await requireAdmin();
  if (error) return error;

  const url = new URL(request.url);
  const personId = (url.searchParams.get("person_id") || "").trim();
  const targetEmail = (url.searchParams.get("target_email") || "").trim();
  if (!personId && !targetEmail) {
    return NextResponse.json({ error: "missing_person_id_or_email" }, { status: 400 });
  }

  const qs = new URLSearchParams({ email });
  if (personId) qs.set("person_id", personId);
  if (targetEmail) qs.set("target_email", targetEmail);

  const { ok, status, data } = await callPayments(`/api/admin/user?${qs.toString()}`);
  return NextResponse.json(data, { status: ok ? 200 : status });
}

export async function PUT(request) {
  const { email, error } = await requireAdmin();
  if (error) return error;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const personId = Number(body?.person_id);
  if (!Number.isInteger(personId) || personId <= 0) {
    return NextResponse.json({ error: "missing_person_id" }, { status: 400 });
  }

  const payload = { email, person_id: personId };
  for (const f of ["first_name", "last_name", "new_email", "phone"]) {
    if (typeof body?.[f] === "string" && body[f].trim() !== "") payload[f] = body[f].trim();
  }

  const { ok, status, data } = await callPayments("/api/admin/user", { method: "PUT", body: payload });
  return NextResponse.json(data, { status: ok ? 200 : status });
}

export async function DELETE(request) {
  const { email, error } = await requireAdmin();
  if (error) return error;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const personId = Number(body?.person_id);
  if (!Number.isInteger(personId) || personId <= 0) {
    return NextResponse.json({ error: "missing_person_id" }, { status: 400 });
  }

  const { ok, status, data } = await callPayments("/api/admin/user", {
    method: "DELETE",
    body: { email, person_id: personId, confirm: String(body?.confirm || "") },
  });
  return NextResponse.json(data, { status: ok ? 200 : status });
}
