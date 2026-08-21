import { NextResponse } from "next/server";

import { callPayments, sessionEmail } from "@/lib/admin-bff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  const email = await sessionEmail();
  if (!email) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const chargeType = String(body?.charge_type || "").trim();
  const quantity = Number(body?.quantity || 0);
  const reason = String(body?.reason || "").trim();
  const occurredAt = String(body?.occurred_at || "").trim();
  if (!chargeType) return NextResponse.json({ error: "charge_type_required" }, { status: 400 });
  if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 10000) {
    return NextResponse.json({ error: "invalid_quantity" }, { status: 400 });
  }
  if (reason.length < 3 || reason.length > 500) {
    return NextResponse.json({ error: "reason_required" }, { status: 400 });
  }

  const { ok, status, data } = await callPayments(
    `/api/admin/operational-charges?email=${encodeURIComponent(email)}`,
    { method: "POST", body: { charge_type: chargeType, quantity, reason, occurred_at: occurredAt } },
  );
  return NextResponse.json(data, { status: ok ? 200 : status });
}
