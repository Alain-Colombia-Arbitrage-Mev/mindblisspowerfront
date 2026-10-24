import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getCatalog } from "@/lib/catalog";
import { verifiedEmailFromIdToken } from "@/lib/verify-id-token";
import { memberReadLimit } from "@/lib/member-read-policy.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const privateHeaders = { "Cache-Control": "private, no-store" };

/** Carrera de rangos (mlm.rank) para el panel del miembro — catálogo cacheado 5 min. */
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("vp_id_token")?.value;
  if (!token) {
    return NextResponse.json(
      { error: "unauthenticated" },
      { status: 401, headers: privateHeaders },
    );
  }
  const email = await verifiedEmailFromIdToken(token);
  if (!email)
    return NextResponse.json(
      { error: "session-invalid" },
      { status: 401, headers: privateHeaders },
    );
  const limited = memberReadLimit(email, "ranks");
  if (limited) return limited;
  try {
    const { ranks } = await getCatalog();
    return NextResponse.json({ ranks }, { headers: privateHeaders });
  } catch {
    return NextResponse.json(
      { error: "ranks-unavailable" },
      { status: 503, headers: privateHeaders },
    );
  }
}
