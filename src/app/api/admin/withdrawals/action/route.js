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
  const action = String(body?.action || "");
  if (!Number.isInteger(id) || id <= 0 || !["approve", "reject", "pay", "cancel"].includes(action)) {
    return NextResponse.json({ error: "invalid-action" }, { status: 400 });
  }

  const { ok, status, data } = await callPayments("/api/admin/withdrawals/action", {
    method: "POST",
    body: { email, id, action },
  });
  return NextResponse.json(data, { status: ok ? 200 : status });
}
