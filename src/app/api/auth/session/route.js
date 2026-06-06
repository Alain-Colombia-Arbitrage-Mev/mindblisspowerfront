import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const cognitoConfigured = Boolean(process.env.COGNITO_DOMAIN && process.env.COGNITO_CLIENT_ID);
  const authenticated = Boolean(cookieStore.get("vp_id_token") || cookieStore.get("vp_access_token"));

  return NextResponse.json({
    authenticated: cognitoConfigured ? authenticated : true,
    mode: cognitoConfigured ? "cognito" : "demo",
  });
}
