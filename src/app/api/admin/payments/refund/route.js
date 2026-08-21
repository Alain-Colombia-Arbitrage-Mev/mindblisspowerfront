import { NextResponse } from "next/server";

import { callPayments, sessionEmail } from "@/lib/admin-bff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  const email = await sessionEmail();
  if (!email) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const id = String(body?.id || "").trim();
  const reason = String(body?.reason || "").trim();
  const amountCents = Number(body?.amount_cents || 0);
  if (!id) return NextResponse.json({ error: "id_required" }, { status: 400 });
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    return NextResponse.json({ error: "invalid_amount" }, { status: 400 });
  }

  const { ok, status, data } = await callPayments(
    `/api/admin/payments/refund?email=${encodeURIComponent(email)}`,
    { method: "POST", body: { id, reason, amount_cents: amountCents } }
  );
  return NextResponse.json(data, { status: ok ? 200 : status });
}
