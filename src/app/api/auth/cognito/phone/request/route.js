import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { authRateLimit } from "@/lib/auth-rate-limit";
import { authLogFields, logAuthEvent } from "@/lib/auth-observability";
import { requestPhoneVerification } from "@/lib/cognito-otp-policy";
import { getCognitoIdentityProviderConfig } from "@/lib/cognito";
import { callCognito, getCognitoErrorCode, mapCognitoError, mapCognitoStatus } from "@/lib/cognito-api";
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

  const verify = await requestPhoneVerification({
    call: callCognito,
    endpoint: config.endpoint,
    accessToken: c.accessToken,
    phone,
  });
  if (!verify.ok) {
    logAuthEvent("phone_verification_send_failed", authLogFields({ email: c.email, channel: "sms", status: mapCognitoStatus(verify.body), errorCode: getCognitoErrorCode(verify.body) }), "warn");
    return NextResponse.json(
      { error: mapCognitoError(verify.body, "No se pudo enviar el código SMS de verificación.") },
      { status: mapCognitoStatus(verify.body) }
    );
  }

  logAuthEvent("phone_verification_sent", authLogFields({ email: c.email, channel: "sms", status: 200, delivery: verify.body.CodeDeliveryDetails }));
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
