import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const loginHint = normalizeEmailHint(
    requestUrl.searchParams.get("login_hint") || requestUrl.searchParams.get("email")
  );

  if ((requestUrl.searchParams.has("login_hint") || requestUrl.searchParams.has("email")) && !loginHint) {
    return NextResponse.redirect(new URL("/login?auth=invalid-email", requestUrl));
  }

  const loginUrl = new URL("/login", requestUrl);
  loginUrl.searchParams.set("auth", "use-designed-login");
  if (loginHint) loginUrl.searchParams.set("email", loginHint);

  return NextResponse.redirect(loginUrl);
}

function normalizeEmailHint(value) {
  const email = String(value || "").trim().toLowerCase();
  if (!email) return "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}
