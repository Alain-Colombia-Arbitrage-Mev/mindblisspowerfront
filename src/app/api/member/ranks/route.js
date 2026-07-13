import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getCatalog } from "@/lib/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Carrera de rangos (mlm.rank) para el panel del miembro — catálogo cacheado 5 min. */
export async function GET() {
  const cookieStore = await cookies();
  if (!cookieStore.get("vp_id_token")?.value) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  try {
    const { ranks } = await getCatalog();
    return NextResponse.json({ ranks });
  } catch {
    return NextResponse.json({ error: "ranks-unavailable" }, { status: 503 });
  }
}
