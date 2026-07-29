import { NextResponse } from "next/server";

import { callPayments, isAdminEmail, sessionEmail } from "@/lib/admin-bff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * BFF de desbaneo (solo admin, fail-closed). POST {email} borra todas las
 * coincidencias de la lista negra (o {id} una fila) y rehabilita la cuenta viva
 * (mlm.person + Cognito) en el backend.
 */
export async function POST(request) {
  const email = await sessionEmail();
  if (!email) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (!(await isAdminEmail(email))) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const id = Number(body?.id) || 0;
  const targetEmail = String(body?.email || "").trim().toLowerCase();
  if (id <= 0 && !targetEmail) {
    return NextResponse.json({ error: "need_id_or_email" }, { status: 400 });
  }

  const { ok, status, data } = await callPayments(
    `/api/admin/blacklist/remove?email=${encodeURIComponent(email)}`,
    { method: "POST", body: id > 0 ? { id } : { email: targetEmail } },
  );
  return NextResponse.json(data, { status: ok ? 200 : status });
}
