import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { buildCognitoAuthorizeUrl, getRequiredCognitoConfig } from "@/lib/cognito";

export const runtime = "nodejs";

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const loginHint = normalizeEmailHint(
    requestUrl.searchParams.get("login_hint") || requestUrl.searchParams.get("email")
  );

  if ((requestUrl.searchParams.has("login_hint") || requestUrl.searchParams.has("email")) && !loginHint) {
    return NextResponse.redirect(new URL("/login?auth=invalid-email", requestUrl));
  }

  let config;
  try {
    config = getRequiredCognitoConfig(process.env);
  } catch (error) {
    return NextResponse.redirect(new URL(`/login?auth=${encodeURIComponent(error.message)}`, requestUrl));
  }

  const state = randomUUID();
  const nonce = randomUUID();
  const redirectUri = config.redirectUri || `${requestUrl.origin}/api/auth/cognito/callback`;
  const authorizeUrl = buildCognitoAuthorizeUrl({
    domain: config.domain,
    clientId: config.clientId,
    redirectUri,
    state,
    nonce,
    scopes: config.scopes,
    loginHint,
  });

  const response = NextResponse.redirect(authorizeUrl);
  setAuthCookie(response, "vp_cognito_state", state, requestUrl, 600);
  setAuthCookie(response, "vp_cognito_nonce", nonce, requestUrl, 600);
  return response;
}

function normalizeEmailHint(value) {
  const email = String(value || "").trim().toLowerCase();
  if (!email) return "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function setAuthCookie(response, name, value, requestUrl, maxAge) {
  response.cookies.set(name, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: requestUrl.protocol === "https:",
    path: "/",
    maxAge,
  });
}
