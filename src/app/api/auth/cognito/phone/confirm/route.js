import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { authRateLimit } from "@/lib/auth-rate-limit";
import { getCognitoIdentityProviderConfig } from "@/lib/cognito";
import { callCognito, getCognitoErrorCode, mapCognitoError, mapCognitoStatus } from "@/lib/cognito-api";
import { verifyIdToken } from "@/lib/verify-id-token";

export const runtime = "nodejs";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const code = String(body.code || "").replace(/[\s-]+/g, "").trim();
  if (!/^\d{4,8}$/.test(code)) {
    return NextResponse.json({ error: "Ingresa el código SMS que recibiste." }, { status: 400 });
  }

  const c = await authContext();
  if (c.error) return NextResponse.json({ error: c.error }, { status: c.status });

  const limited = authRateLimit(request, { name: "phone-verify-confirm", preset: "verify", email: c.email });
  if (limited) return limited;

  let config;
  try {
    config = getCognitoIdentityProviderConfig(process.env);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const response = await callCognito({
    endpoint: config.endpoint,
    target: "VerifyUserAttribute",
    payload: {
      AccessToken: c.accessToken,
      AttributeName: "phone_number",
      Code: code,
    },
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: mapPhoneVerifyError(response.body) },
      { status: mapCognitoStatus(response.body) }
    );
  }

  return NextResponse.json({ ok: true, message: "Teléfono validado. Ya puedes usar SMS como canal alterno de acceso." });
}

async function authContext() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("vp_access_token")?.value;
  const idToken = cookieStore.get("vp_id_token")?.value;
  if (!accessToken || !idToken) return { error: "unauthenticated", status: 401 };
  const claims = await verifyIdToken(idToken);
  if (!claims?.email) return { error: "session-invalid", status: 401 };
  return { accessToken, email: String(claims.email).toLowerCase() };
}

function mapPhoneVerifyError(body) {
  const code = getCognitoErrorCode(body);
  if (code === "CodeMismatchException") return "El código SMS no es válido.";
  if (code === "ExpiredCodeException") return "El código SMS expiró. Solicita uno nuevo.";
  return mapCognitoError(body, "No se pudo validar el teléfono.");
}
