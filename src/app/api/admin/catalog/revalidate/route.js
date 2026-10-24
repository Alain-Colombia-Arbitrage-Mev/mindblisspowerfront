import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { callPayments, sessionEmail } from "@/lib/admin-bff";
import { invalidateCatalogLoad } from "@/lib/catalog";
import { hasSameOrigin } from "@/lib/request-origin";
import { authRateLimit } from "@/lib/auth-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST → invalida el cache del catálogo (packs+ranks). Solo admin.
export async function POST(request) {
  if (!hasSameOrigin(request))
    return NextResponse.json({ error: "forbidden_origin" }, { status: 403 });
  const email = await sessionEmail();
  if (!email)
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const limited = authRateLimit(request, {
    name: "catalog-revalidate",
    preset: "catalog",
    email,
  });
  if (limited) return limited;
  const { ok, data } = await callPayments(
    `/api/admin/check?email=${encodeURIComponent(email)}`,
  );
  if (!ok || !data?.is_admin)
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  invalidateCatalogLoad();
  revalidateTag("catalog", { expire: 0 });
  return NextResponse.json({ revalidated: true, tag: "catalog" });
}
