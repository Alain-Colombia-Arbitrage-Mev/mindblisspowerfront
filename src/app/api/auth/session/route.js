import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { callPayments } from "@/lib/admin-bff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const idToken = cookieStore.get("vp_id_token")?.value;
  const authenticated = Boolean(idToken || cookieStore.get("vp_access_token")?.value);

  const claims = decodeJwt(idToken);
  const email = claims.email ? String(claims.email).toLowerCase() : null;
  const name =
    claims.name ||
    [claims.given_name, claims.family_name].filter(Boolean).join(" ") ||
    claims.nickname ||
    (email ? email.split("@")[0] : "");

  let isAdmin = false;
  let realCode = "";
  if (email) {
    const [adm, ref] = await Promise.all([
      callPayments(`/api/admin/check?email=${encodeURIComponent(email)}`),
      callPayments(`/api/member/referral?email=${encodeURIComponent(email)}`),
    ]);
    if (adm.ok) isAdmin = Boolean(adm.data.is_admin);
    if (ref.ok && ref.data.referral_code) realCode = ref.data.referral_code;
  }

  return NextResponse.json({
    authenticated,
    mode: "cognito",
    name: name || null,
    email: email || null,
    givenName: claims.given_name || null,
    // Código REAL del afiliado (invitation_link); si aún no tiene (no colocado),
    // se muestra uno derivado estable por usuario.
    referralCode: realCode || referralCode(claims.sub || email || ""),
    isAdmin,
  });
}

// Código de referido único y estable por usuario (derivado del sub de Cognito).
// Determinista → siempre el mismo para el mismo usuario, distinto entre usuarios.
function referralCode(seed) {
  if (!seed) return null;
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const code = (h >>> 0).toString(36).toUpperCase().padStart(7, "0").slice(-7);
  return `MP${code}`;
}

function decodeJwt(token) {
  if (!token) return {};
  try {
    const payload = JSON.parse(Buffer.from(String(token).split(".")[1], "base64url").toString("utf8"));
    if (payload.exp && payload.exp * 1000 < Date.now()) return {};
    return payload;
  } catch {
    return {};
  }
}
