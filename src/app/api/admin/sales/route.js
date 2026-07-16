import { NextResponse } from "next/server";

import { callPayments, sessionEmail } from "@/lib/admin-bff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Reporte de ventas por membresía (producto PACK MINDBLISS) para el panel admin. */
export async function GET(request) {
  const email = await sessionEmail();
  if (!email) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const days = Number(new URL(request.url).searchParams.get("days")) || 30;
  const { ok, status, data } = await callPayments(
    `/api/admin/sales/report?email=${encodeURIComponent(email)}&days=${days}`,
  );
  return NextResponse.json(data, { status: ok ? 200 : status });
}
