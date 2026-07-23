import { NextResponse } from "next/server";

import { callPayments, sessionEmail } from "@/lib/admin-bff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const email = await sessionEmail();
  if (!email) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const chk = await callPayments(`/api/admin/check?email=${encodeURIComponent(email)}`);
  if (!chk.ok || !chk.data?.is_admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { ok, status, data } = await callPayments(`/api/admin/summary?email=${encodeURIComponent(email)}`);
  return NextResponse.json(data, { status: ok ? 200 : status });
}
