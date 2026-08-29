import { NextResponse } from "next/server";

import { authRateLimit } from "@/lib/auth-rate-limit";
import { authLogFields, logAuthEvent } from "@/lib/auth-observability";
import { buildCognitoSecretHash, getCognitoIdentityProviderConfig } from "@/lib/cognito";
import { callCognito, mapCognitoError, mapCognitoStatus, normalizeEmail, getCognitoErrorCode } from "@/lib/cognito-api";

export const runtime = "nodejs";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const email = normalizeEmail(body.email);

  if (!email) {
    return NextResponse.json({ error: "Ingresa un email válido. / Enter a valid email." }, { status: 400 });
  }

  // Envío de correo de recuperación: rate limit por email + IP (preset "send").
  const limited = authRateLimit(request, { name: "forgot-password", preset: "send", email });
  if (limited) return limited;

  let config;
  try {
    config = getCognitoIdentityProviderConfig(process.env);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const payload = { ClientId: config.clientId, Username: email };
  if (config.clientSecret) {
    payload.SecretHash = buildCognitoSecretHash({
      username: email,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
    });
  }

  const response = await callCognito({
    endpoint: config.endpoint,
    target: "ForgotPassword",
    payload,
  });

  // No revelar si el usuario existe (PreventUserExistenceErrors puede variar).
  if (!response.ok && getCognitoErrorCode(response.body) === "UserNotFoundException") {
    logAuthEvent("password_reset_request_hidden_missing_user", authLogFields({ email, status: 200, reason: "hidden_missing_user" }));
    return NextResponse.json({ ok: true, delivery: null });
  }

  if (!response.ok) {
    logAuthEvent(
      "password_reset_request_failed",
      authLogFields({
        email,
        status: mapCognitoStatus(response.body),
        reason: getCognitoErrorCode(response.body) === "CodeDeliveryFailureException" ? "email_delivery_failed" : "cognito_error",
        errorCode: getCognitoErrorCode(response.body),
      }),
      "warn"
    );
    return NextResponse.json(
      { error: mapCognitoError(response.body, "No se pudo iniciar la recuperación.") },
      { status: mapCognitoStatus(response.body) }
    );
  }

  logAuthEvent(
    "password_reset_code_sent",
    authLogFields({ email, status: 200, reason: "sent", delivery: response.body.CodeDeliveryDetails || null })
  );
  return NextResponse.json({ ok: true, delivery: response.body.CodeDeliveryDetails || null });
}
