import { NextResponse } from "next/server";

import { callPayments, sessionEmail } from "@/lib/admin-bff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  const email = await sessionEmail();
  if (!email) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid-json" }, { status: 400 });
  }
  const id = Number(body?.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "invalid-id" }, { status: 400 });
  }
  const { ok, status, data } = await callPayments("/api/admin/plan/decide", {
    method: "POST",
    body: { email, id, approve: Boolean(body?.approve), reason: String(body?.reason || "") },
  });
  return NextResponse.json(data, { status: ok ? 200 : status });
}
