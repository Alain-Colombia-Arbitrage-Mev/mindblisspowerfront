import { NextResponse } from "next/server";

import { originUrl } from "@/lib/request-origin";

export const runtime = "nodejs";

/**
 * Entrada legacy del hosted-UI. Mindbliss usa UI propia para todo el flujo
 * (login por código, contraseña, registro, recuperación), así que esta ruta
 * solo reencamina a /login propio — nunca abre el hosted UI de Cognito.
 */
export async function GET(request) {
  const url = new URL(request.url);
  const loginHint = normalizeEmailHint(url.searchParams.get("login_hint") || url.searchParams.get("email"));

  if ((url.searchParams.has("login_hint") || url.searchParams.has("email")) && !loginHint) {
    return NextResponse.redirect(originUrl(request, "/login?auth=invalid-email"));
  }

  const loginUrl = originUrl(request, "/login");
  loginUrl.searchParams.set("auth", "use-designed-login");
  if (loginHint) loginUrl.searchParams.set("email", loginHint);

  return NextResponse.redirect(loginUrl);
}

function normalizeEmailHint(value) {
  const email = String(value || "").trim().toLowerCase();
  if (!email) return "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}
