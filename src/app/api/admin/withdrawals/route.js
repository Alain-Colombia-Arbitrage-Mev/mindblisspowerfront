import { NextResponse } from "next/server";

import { callWithdrawals, sessionEmail } from "@/lib/admin-bff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const email = await sessionEmail();
  if (!email) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const sp = new URL(request.url).searchParams;
  const status = sp.get("status") || "";
  const limit = sp.get("limit") || "25";
  const offset = sp.get("offset") || "0";

  const { ok, status: code, data } = await callWithdrawals(
    `/api/admin/withdrawals?email=${encodeURIComponent(email)}&status=${encodeURIComponent(status)}&limit=${encodeURIComponent(limit)}&offset=${encodeURIComponent(offset)}`
  );
  return NextResponse.json(data, { status: ok ? 200 : code });
}
