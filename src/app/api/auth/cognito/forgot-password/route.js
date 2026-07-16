import { NextResponse } from "next/server";

import { authRateLimit } from "@/lib/auth-rate-limit";
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
    return NextResponse.json({ ok: true, delivery: null });
  }

  if (!response.ok) {
    return NextResponse.json(
      { error: mapCognitoError(response.body, "No se pudo iniciar la recuperación.") },
      { status: mapCognitoStatus(response.body) }
    );
  }

  return NextResponse.json({ ok: true, delivery: response.body.CodeDeliveryDetails || null });
}
