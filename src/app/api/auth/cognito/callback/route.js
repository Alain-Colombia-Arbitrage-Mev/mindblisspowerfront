import { NextResponse } from "next/server";

import {
  buildClientSecretAuthorization,
  buildTokenRequestBody,
  getRequiredCognitoConfig,
} from "@/lib/cognito";
import { originUrl, resolveOrigin } from "@/lib/request-origin";

export const runtime = "nodejs";

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const error = requestUrl.searchParams.get("error");
  const expectedState = request.cookies.get("vp_cognito_state")?.value;

  if (error) {
    return redirectToLogin(request, error);
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectToLogin(request, "invalid-state");
  }

  let config;
  try {
    config = getRequiredCognitoConfig(process.env);
  } catch (configError) {
    return redirectToLogin(request, configError.message);
  }

  const redirectUri = config.redirectUri || `${resolveOrigin(request)}/api/auth/cognito/callback`;
  const tokenEndpoint = new URL("/oauth2/token", config.domain);
  const tokenResponse = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      ...buildClientSecretAuthorization(config.clientId, config.clientSecret),
    },
    body: buildTokenRequestBody({
      code,
      clientId: config.clientId,
      redirectUri,
    }),
  });

  if (!tokenResponse.ok) {
    return redirectToLogin(request, "token-exchange-failed");
  }

  const tokens = await tokenResponse.json();
  const response = NextResponse.redirect(originUrl(request, "/dashboard"));
  const accessMaxAge = Number(tokens.expires_in || 3600);

  setSessionCookie(response, "vp_access_token", tokens.access_token, requestUrl, accessMaxAge);
  setSessionCookie(response, "vp_id_token", tokens.id_token, requestUrl, accessMaxAge);

  if (tokens.refresh_token) {
    setSessionCookie(response, "vp_refresh_token", tokens.refresh_token, requestUrl, 60 * 60 * 24 * 30);
  }

  clearCookie(response, "vp_cognito_state");
  clearCookie(response, "vp_cognito_nonce");
  return response;
}

function redirectToLogin(request, reason) {
  const response = NextResponse.redirect(originUrl(request, `/login?auth=${encodeURIComponent(reason)}`));
  clearCookie(response, "vp_cognito_state");
  clearCookie(response, "vp_cognito_nonce");
  return response;
}

function setSessionCookie(response, name, value, requestUrl, maxAge) {
  if (!value) return;

  response.cookies.set(name, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: requestUrl.protocol === "https:",
    path: "/",
    maxAge,
  });
}

function clearCookie(response, name) {
  response.cookies.set(name, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
