import { NextResponse } from "next/server";

import { callPayments, isAdminEmail, sessionEmail } from "@/lib/admin-bff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Mini resumen del subárbol de un afiliado para el Inspector de usuario:
 * root + hijos directos L/R con conteos denormalizados (vp-payments).
 */
export async function GET(request) {
  const email = await sessionEmail();
  if (!email) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (!(await isAdminEmail(email))) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const affiliateId = Number(new URL(request.url).searchParams.get("affiliate_id"));
  if (!Number.isInteger(affiliateId) || affiliateId <= 0) {
    return NextResponse.json({ error: "missing_affiliate_id" }, { status: 400 });
  }

  const { ok, status, data } = await callPayments(
    `/api/admin/user/branch-tree?email=${encodeURIComponent(email)}&affiliate_id=${affiliateId}`,
  );
  return NextResponse.json(data, { status: ok ? 200 : status });
}
