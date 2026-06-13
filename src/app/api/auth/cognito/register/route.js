import { randomUUID } from "node:crypto";
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
  const birthDate = normalizeBirthDate(body.birthDate);
  const city = String(body.city || "").trim();
  const country = String(body.country || "").trim();

  const validationError = validateInput({ email, password, fullName });
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  let config;
  try {
    config = getCognitoIdentityProviderConfig(process.env);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // El pool usa email como ALIAS: el username no puede tener formato de email.
  const username = `mp_${randomUUID().replaceAll("-", "")}`;

  // El pool marca como required casi todos los atributos estándar (inmutable
  // post-creación), así que se completan todos con datos del formulario o
  // valores neutros.
  const nameParts = fullName.split(/\s+/);
  const givenName = nameParts[0];
  const familyName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : givenName;

  const attributes = [
    { Name: "email", Value: email },
    { Name: "name", Value: fullName },
    { Name: "given_name", Value: givenName },
    { Name: "family_name", Value: familyName },
    { Name: "middle_name", Value: nameParts[1] || givenName },
    { Name: "nickname", Value: givenName },
    { Name: "preferred_username", Value: username },
    { Name: "profile", Value: "member" },
    { Name: "picture", Value: "https://app.mindblisspower.com/avatar.png" },
    { Name: "website", Value: "https://mindblisspower.com" },
    { Name: "gender", Value: "unspecified" },
    { Name: "birthdate", Value: birthDate },
    { Name: "zoneinfo", Value: "America/Bogota" },
    { Name: "locale", Value: preferredLanguage || "es" },
    { Name: "address", Value: city || country ? `${city}${city && country ? ", " : ""}${country}` : "-" },
    // NOTA: `updated_at` es Required en el pool PERO Cognito no permite escribirlo
    // (es un atributo gestionado). Enviarlo causa InvalidParameterException. Cognito
    // lo auto-rellena, así que NO se incluye aquí. (sub también es auto.)
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
      username,
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
      username,
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

function normalizeBirthDate(value) {
  const date = String(value || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "1990-01-01";
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
