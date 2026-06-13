import { NextResponse } from "next/server";

import { callPayments, sessionEmail } from "@/lib/admin-bff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const email = await sessionEmail();
  if (!email) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const sp = new URL(request.url).searchParams;
  const q = sp.get("q") || "";
  const limit = sp.get("limit") || "25";
  const offset = sp.get("offset") || "0";

  const { ok, status, data } = await callPayments(
    `/api/admin/users?email=${encodeURIComponent(email)}&q=${encodeURIComponent(q)}&limit=${encodeURIComponent(limit)}&offset=${encodeURIComponent(offset)}`
  );
  return NextResponse.json(data, { status: ok ? 200 : status });
}
