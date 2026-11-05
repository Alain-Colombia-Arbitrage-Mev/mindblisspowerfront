import { rawIdToken } from "@/lib/admin-bff";
import { NextResponse } from "next/server";

import { getRankCatalog } from "@/lib/catalog";
import { verifiedEmailFromIdTokenForSession as verifiedEmailFromIdToken } from "@/lib/verify-id-token";
import { memberReadLimit } from "@/lib/member-read-policy.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const privateHeaders = { "Cache-Control": "private, no-store", Vary: "Cookie" };

/** Carrera de rangos (mlm.rank) para el panel del miembro — catálogo cacheado 5 min. */
export async function GET() {
  let email;
  try {
    const token = await rawIdToken();
    if (!token) {
      return NextResponse.json(
        { error: "unauthenticated" },
        { status: 401, headers: privateHeaders },
      );
    }
    email = await verifiedEmailFromIdToken(token);
    if (!email)
      return NextResponse.json(
        { error: "session-invalid" },
        { status: 401, headers: privateHeaders },
      );
  } catch {
    return NextResponse.json(
      { error: "authentication_unavailable" },
      { status: 503, headers: privateHeaders },
    );
  }
  const limited = memberReadLimit(email, "ranks");
  if (limited) return limited;
  try {
    const { ranks } = await getRankCatalog();
    return NextResponse.json({ ranks }, { headers: privateHeaders });
  } catch {
    return NextResponse.json(
      { error: "ranks-unavailable" },
      { status: 503, headers: privateHeaders },
    );
  }
}
