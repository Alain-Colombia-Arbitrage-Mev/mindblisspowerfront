import { NextResponse } from "next/server";

import { buildCognitoLogoutUrl, getRequiredCognitoConfig } from "@/lib/cognito";

export const runtime = "nodejs";

export async function GET(request) {
  const requestUrl = new URL(request.url);
  let target = new URL("/login", requestUrl).toString();

  try {
    const config = getRequiredCognitoConfig(process.env);
    const logoutUri = config.logoutUri || target;
    target = buildCognitoLogoutUrl({
      domain: config.domain,
      clientId: config.clientId,
      logoutUri,
    });
  } catch {
    target = new URL("/login", requestUrl).toString();
  }

  const response = NextResponse.redirect(target);
  ["vp_access_token", "vp_id_token", "vp_refresh_token", "vp_cognito_state", "vp_cognito_nonce"].forEach((name) => {
    response.cookies.set(name, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  });
  return response;
}
