import { NextResponse } from "next/server";

import { buildCognitoSignUpPayload, getCognitoIdentityProviderConfig } from "@/lib/cognito";

export const runtime = "nodejs";

export async function POST(request) {
  const body = await readJson(request);
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");
  const fullName = String(body.fullName || "").trim();
  const phone = normalizePhone(body.phone);
  const preferredLanguage = String(body.preferredLanguage || "es").trim().toLowerCase();

  const validationError = validateInput({ email, password, fullName });
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  let config;
  try {
    config = getCognitoIdentityProviderConfig(process.env);
  } catch (error) {
    if (!process.env.COGNITO_DOMAIN && !process.env.COGNITO_CLIENT_ID) {
      return NextResponse.json({
        ok: true,
        mode: "demo",
        userConfirmed: true,
      });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const attributes = [
    { Name: "email", Value: email },
    { Name: "name", Value: fullName },
    { Name: "locale", Value: preferredLanguage },
  ];

  if (phone) {
    attributes.push({ Name: "phone_number", Value: phone });
  }

  const cognitoResponse = await callCognito({
    endpoint: config.endpoint,
    target: "AWSCognitoIdentityProviderService.SignUp",
    payload: buildCognitoSignUpPayload({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      username: email,
      password,
      attributes,
    }),
  });

  if (!cognitoResponse.ok) {
    return NextResponse.json(
      { error: mapCognitoSignUpError(cognitoResponse.body) },
      { status: mapCognitoStatus(cognitoResponse.body) }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      mode: "cognito",
      userConfirmed: Boolean(cognitoResponse.body.UserConfirmed),
      delivery: cognitoResponse.body.CodeDeliveryDetails || null,
      userSub: cognitoResponse.body.UserSub || null,
    },
    { status: 201 }
  );
}

async function callCognito({ endpoint, target, payload }) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": target,
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, body };
}

function readJson(request) {
  return request.json().catch(() => ({}));
}

function normalizeEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function normalizePhone(value) {
  const phone = String(value || "").trim();
  return /^\+[1-9]\d{7,14}$/.test(phone) ? phone : "";
}

function validateInput({ email, password, fullName }) {
  if (!fullName) return "El nombre es requerido.";
  if (!email) return "Ingresa un email válido.";
  if (password.length < 8) return "La contraseña debe tener mínimo 8 caracteres.";
  if (password.length > 256) return "La contraseña es demasiado larga.";
  return "";
}

function getCognitoErrorCode(body) {
  const raw = body?.__type || body?.code || "";
  return String(raw).split("#").pop();
}

function mapCognitoStatus(body) {
  const code = getCognitoErrorCode(body);
  if (code === "UsernameExistsException") return 409;
  if (code === "InvalidPasswordException" || code === "InvalidParameterException") return 400;
  if (code === "TooManyRequestsException" || code === "LimitExceededException") return 429;
  return 502;
}

function mapCognitoSignUpError(body) {
  const code = getCognitoErrorCode(body);

  if (code === "UsernameExistsException") {
    return "Ya existe una cuenta con ese email.";
  }

  if (code === "InvalidPasswordException") {
    return "La contraseña no cumple la política configurada en Cognito.";
  }

  if (code === "InvalidParameterException") {
    return "Cognito rechazó uno de los datos enviados. Revisa la configuración de atributos del app client.";
  }

  if (code === "TooManyRequestsException" || code === "LimitExceededException") {
    return "Demasiados intentos. Espera unos minutos antes de volver a intentar.";
  }

  return "No se pudo crear la cuenta en Cognito.";
}
