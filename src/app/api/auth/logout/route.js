import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const response = NextResponse.redirect(new URL("/login", requestUrl));
  [
    "vp_access_token",
    "vp_id_token",
    "vp_refresh_token",
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
