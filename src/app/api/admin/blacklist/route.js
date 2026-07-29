import { NextResponse } from "next/server";

import { callPayments, isAdminEmail, sessionEmail } from "@/lib/admin-bff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * BFF de lista negra (solo admin, fail-closed). POST agrega (banear): además de
 * insertar en mlm.blacklist, el backend suspende la cuenta viva y deshabilita el
 * login en Cognito. Requiere email o teléfono (o nombre+fecha de nacimiento).
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

  const payload = {
    fullname: String(body?.fullname || "").trim(),
    email: String(body?.email || "").trim().toLowerCase(),
    phone: String(body?.phone || "").trim(),
    birthdate: String(body?.birthdate || "").trim(),
    motive: String(body?.motive || "").trim(),
  };
  if (!payload.email && !payload.phone && !(payload.fullname && payload.birthdate)) {
    return NextResponse.json({ error: "need_email_phone_or_name_birth" }, { status: 400 });
  }

  const { ok, status, data } = await callPayments(
    `/api/admin/blacklist?email=${encodeURIComponent(email)}`,
    { method: "POST", body: payload },
  );
  return NextResponse.json(data, { status: ok ? 200 : status });
}
