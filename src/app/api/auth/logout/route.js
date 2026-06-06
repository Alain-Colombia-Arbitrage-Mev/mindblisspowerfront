import { NextResponse } from "next/server";

import { originUrl } from "@/lib/request-origin";

export const runtime = "nodejs";

export async function GET(request) {
  const response = NextResponse.redirect(originUrl(request, "/login"));
  [
    "vp_access_token",
    "vp_id_token",
    "vp_refresh_token",
    "vp_otp_session",
    "vp_cognito_state",
    "vp_cognito_nonce",
    "vp_cognito_code_challenge",
  ].forEach((name) => {
    response.cookies.set(name, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  });
  return response;
}
