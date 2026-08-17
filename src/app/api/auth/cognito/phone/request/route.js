import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { authRateLimit } from "@/lib/auth-rate-limit";
import { getCognitoIdentityProviderConfig } from "@/lib/cognito";
import { callCognito, mapCognitoError, mapCognitoStatus } from "@/lib/cognito-api";
import { verifyIdToken } from "@/lib/verify-id-token";

export const runtime = "nodejs";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const phone = normalizeE164Phone(body.phone);
  if (!phone) {
    return NextResponse.json({ error: "Ingresa el teléfono en formato internacional, por ejemplo +573001234567." }, { status: 400 });
  }

  const c = await authContext();
  if (c.error) return NextResponse.json({ error: c.error }, { status: c.status });

  const limited = authRateLimit(request, { name: "phone-verify-request", preset: "send", email: c.email });
  if (limited) return limited;

  let config;
  try {
    config = getCognitoIdentityProviderConfig(process.env);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const update = await callCognito({
    endpoint: config.endpoint,
    target: "UpdateUserAttributes",
    payload: {
      AccessToken: c.accessToken,
      UserAttributes: [{ Name: "phone_number", Value: phone }],
    },
  });
  if (!update.ok) {
    return NextResponse.json(
      { error: mapCognitoError(update.body, "No se pudo vincular el teléfono en Cognito.") },
      { status: mapCognitoStatus(update.body) }
    );
  }

  const verify = await callCognito({
    endpoint: config.endpoint,
    target: "GetUserAttributeVerificationCode",
    payload: { AccessToken: c.accessToken, AttributeName: "phone_number" },
  });
  if (!verify.ok) {
    return NextResponse.json(
      { error: mapCognitoError(verify.body, "No se pudo enviar el código SMS de verificación.") },
      { status: mapCognitoStatus(verify.body) }
    );
  }

  return NextResponse.json({
    ok: true,
    phone,
    delivery: verify.body.CodeDeliveryDetails || null,
    message: "Te enviamos un código SMS para validar tu teléfono.",
  });
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

function normalizeE164Phone(value) {
  const raw = String(value || "").trim();
  if (!raw.startsWith("+")) return "";
  const phone = `+${raw.slice(1).replace(/\D/g, "")}`;
  return /^\+[1-9]\d{7,14}$/.test(phone) ? phone : "";
}
