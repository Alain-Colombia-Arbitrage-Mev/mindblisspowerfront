import { rawIdToken } from "@/lib/admin-bff";
import { NextResponse } from "next/server";

import { callPayments } from "@/lib/admin-bff";
import { clearCookie } from "@/lib/cognito-session";
import { verifyIdToken } from "@/lib/verify-id-token";
import { betterAuthEnabled, AuthServiceUnavailable } from "@/lib/better-auth-bridge.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SESSION_COOKIES = [
  "vp_access_token",
  "vp_id_token",
  "vp_refresh_token",
  "vp_otp_session",
  "vp_cognito_state",
  "vp_cognito_nonce",
  "vp_cognito_code_challenge",
];

export async function GET() {
  let idToken;
  try { idToken = await rawIdToken(); } catch (error) {
    if (!(error instanceof AuthServiceUnavailable)) throw error;
    return NextResponse.json({ error: 'authentication_unavailable' }, { status: 503, headers: { 'Cache-Control': 'private, no-store' } });
  }

  // Claims VERIFICADOS (firma + iss + aud + token_use + exp). Un id token
  // forjado ya no produce sesión: claims = {} ⇒ authenticated=false.
  const claims = (await verifyIdToken(idToken)) || {};
  const email = claims.email || null;
  const authenticated = Boolean(email);
  const tokenName =
    claims.name ||
    [claims.given_name, claims.family_name].filter(Boolean).join(" ") ||
    claims.nickname ||
    "";

  let realCode = "";
  let realName = "";
  if (email) {
    const ref = await callPayments(`/api/member/referral?email=${encodeURIComponent(email)}`);
    if (isSuspended(ref)) {
      return suspendedSessionResponse();
    }
    if (ref.ok) {
      if (ref.data.referral_code) realCode = ref.data.referral_code;
      if (ref.data.name) realName = ref.data.name;
    }
  }

  // Nombre: RDS (autoritativo para migrados) → token Cognito → parte local del email.
  const name = realName || tokenName || (email ? email.split("@")[0] : "");

  return NextResponse.json({
    authenticated,
    mode: betterAuthEnabled() ? "better-auth" : "cognito",
    name: name || null,
    email: email || null,
    // Opaque, verified identity for namespacing tab-local checkout intents only.
    // The checkout BFF still authorizes from its independently verified cookie.
    subject: authenticated && typeof claims.sub === "string" ? claims.sub : null,
    givenName: claims.given_name || null,
    // Código REAL del afiliado (invitation_link o MP{id} canónico del backend).
    // NUNCA inventamos un código: si el miembro aún no está colocado en el árbol
    // no tiene código resoluble, así que devolvemos null y la UI muestra un aviso.
    // (Un código inventado se ve válido pero no resuelve a ningún sponsor.)
    referralCode: realCode || null,
    isAdmin: false,
  });
}

function isSuspended(result) {
  return result?.status === 403 && result?.data?.error === "account_suspended";
}

function suspendedSessionResponse() {
  const response = NextResponse.json(
    { authenticated: false, mode: "cognito", error: "account_suspended" },
    { status: 403 }
  );
  for (const name of SESSION_COOKIES) clearCookie(response, name);
  return response;
}
