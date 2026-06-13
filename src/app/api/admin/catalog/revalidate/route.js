import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { callPayments, sessionEmail } from "@/lib/admin-bff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST → invalida el cache del catálogo (packs+ranks). Solo admin.
export async function POST() {
  const email = await sessionEmail();
  if (!email) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { ok, data } = await callPayments(`/api/admin/check?email=${encodeURIComponent(email)}`);
  if (!ok || !data?.is_admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  revalidateTag("catalog");
  return NextResponse.json({ revalidated: true, tag: "catalog" });
}
