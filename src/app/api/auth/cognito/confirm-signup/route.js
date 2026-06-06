import { NextResponse } from "next/server";

import { buildCognitoSecretHash, getCognitoIdentityProviderConfig } from "@/lib/cognito";
import { callCognito, mapCognitoError, mapCognitoStatus, normalizeEmail } from "@/lib/cognito-api";

export const runtime = "nodejs";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const email = normalizeEmail(body.email);
  const code = String(body.code || "").trim();
  const resend = Boolean(body.resend);
  // Antes de confirmar, el alias por email aún no existe: usar el username real.
  const rawUsername = String(body.username || "").trim();
  const username = /^[\w.-]{1,128}$/.test(rawUsername) ? rawUsername : email;

  if (!username) {
    return NextResponse.json({ error: "Ingresa un email válido." }, { status: 400 });
  }

  let config;
  try {
    config = getCognitoIdentityProviderConfig(process.env);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const basePayload = { ClientId: config.clientId, Username: username };
  if (config.clientSecret) {
    basePayload.SecretHash = buildCognitoSecretHash({
      username,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
    });
  }

  if (resend) {
    const response = await callCognito({
      endpoint: config.endpoint,
      target: "ResendConfirmationCode",
      payload: basePayload,
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: mapCognitoError(response.body, "No se pudo reenviar el código.") },
        { status: mapCognitoStatus(response.body) }
      );
    }

    return NextResponse.json({ ok: true, delivery: response.body.CodeDeliveryDetails || null });
  }

  if (!/^\d{4,8}$/.test(code)) {
    return NextResponse.json({ error: "Ingresa el código que recibiste por correo." }, { status: 400 });
  }

  const response = await callCognito({
    endpoint: config.endpoint,
    target: "ConfirmSignUp",
    payload: { ...basePayload, ConfirmationCode: code },
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: mapCognitoError(response.body, "No se pudo confirmar la cuenta.") },
      { status: mapCognitoStatus(response.body) }
    );
  }

  return NextResponse.json({ ok: true });
}
