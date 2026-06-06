import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const authenticated = Boolean(cookieStore.get("vp_id_token")?.value || cookieStore.get("vp_access_token")?.value);

  return NextResponse.json({
    authenticated,
    mode: "cognito",
  });
}
