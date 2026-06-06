import { NextResponse } from "next/server";

import { buildCognitoSecretHash, getCognitoIdentityProviderConfig } from "@/lib/cognito";
import { callCognito, mapCognitoError, mapCognitoStatus, normalizeEmail } from "@/lib/cognito-api";

export const runtime = "nodejs";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const email = normalizeEmail(body.email);
  const code = String(body.code || "").trim();
  const password = String(body.password || "");

  if (!email) {
    return NextResponse.json({ error: "Ingresa un email válido." }, { status: 400 });
  }
  if (!/^\d{4,8}$/.test(code)) {
    return NextResponse.json({ error: "Ingresa el código que recibiste por correo." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "La contraseña debe tener mínimo 8 caracteres." }, { status: 400 });
  }

  let config;
  try {
    config = getCognitoIdentityProviderConfig(process.env);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const payload = {
    ClientId: config.clientId,
    Username: email,
    ConfirmationCode: code,
    Password: password,
  };
  if (config.clientSecret) {
    payload.SecretHash = buildCognitoSecretHash({
      username: email,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
    });
  }

  const response = await callCognito({
    endpoint: config.endpoint,
    target: "ConfirmForgotPassword",
    payload,
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: mapCognitoError(response.body, "No se pudo restablecer la contraseña.") },
      { status: mapCognitoStatus(response.body) }
    );
  }

  return NextResponse.json({ ok: true });
}
