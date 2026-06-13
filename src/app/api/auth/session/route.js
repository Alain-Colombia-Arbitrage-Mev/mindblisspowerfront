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
  if (email) {
    const { ok, data } = await callPayments(`/api/admin/check?email=${encodeURIComponent(email)}`);
    if (ok) isAdmin = Boolean(data.is_admin);
  }

  return NextResponse.json({
    authenticated,
    mode: "cognito",
    name: name || null,
    email: email || null,
    givenName: claims.given_name || null,
    isAdmin,
  });
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
