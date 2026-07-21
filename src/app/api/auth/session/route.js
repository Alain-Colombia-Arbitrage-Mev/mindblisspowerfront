import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { callPayments } from "@/lib/admin-bff";
import { verifyIdToken } from "@/lib/verify-id-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const idToken = cookieStore.get("vp_id_token")?.value;

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

  let isAdmin = false;
  let realCode = "";
  let realName = "";
  if (email) {
    const [adm, ref] = await Promise.all([
      callPayments(`/api/admin/check?email=${encodeURIComponent(email)}`),
      callPayments(`/api/member/referral?email=${encodeURIComponent(email)}`),
    ]);
    if (adm.ok) isAdmin = Boolean(adm.data.is_admin);
    if (ref.ok) {
      if (ref.data.referral_code) realCode = ref.data.referral_code;
      if (ref.data.name) realName = ref.data.name;
    }
  }

  // Nombre: RDS (autoritativo para migrados) → token Cognito → parte local del email.
  const name = realName || tokenName || (email ? email.split("@")[0] : "");

  return NextResponse.json({
    authenticated,
    mode: "cognito",
    name: name || null,
    email: email || null,
    givenName: claims.given_name || null,
    // Código REAL del afiliado (invitation_link o MP{id} canónico del backend).
    // NUNCA inventamos un código: si el miembro aún no está colocado en el árbol
    // no tiene código resoluble, así que devolvemos null y la UI muestra un aviso.
    // (Un código inventado se ve válido pero no resuelve a ningún sponsor.)
    referralCode: realCode || null,
    isAdmin,
  });
}
