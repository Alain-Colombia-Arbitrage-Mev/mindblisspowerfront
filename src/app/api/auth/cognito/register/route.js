import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

import { authRateLimit } from "@/lib/auth-rate-limit";
import { buildCognitoSignUpPayload, getCognitoIdentityProviderConfig } from "@/lib/cognito";

export const runtime = "nodejs";

export async function POST(request) {
  // Rate limit por IP: acota abuso del endpoint (oráculo de lista negra) y
  // registros masivos. Rate limit per IP: caps blacklist-oracle abuse and mass
  // sign-ups.
  const limited = authRateLimit(request, { name: "register", preset: "register" });
  if (limited) return limited;

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

  // Lista negra: estos usuarios no pueden registrarse (ban por email/teléfono/
  // nombre). Se consulta a vp-payments ANTES de crear el usuario en Cognito.
  // Fail-open: si el servicio no responde, NO bloqueamos el registro legítimo
  // (el barrido posterior captura cualquier colado); solo bloqueamos ante un
  // "blacklisted:true" explícito.
  if (await isBlacklisted({ email, phone, fullName, birthDate })) {
    return NextResponse.json(
      {
        error:
          "Has sido baneado de MindblissPower. El registro no puede continuar. / " +
          "You have been banned from MindblissPower. Registration cannot continue.",
        blacklisted: true,
      },
      { status: 403 }
    );
  }

  let config;
  try {
    config = getCognitoIdentityProviderConfig(process.env);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // El pool usa email como ALIAS: el username no puede tener formato de email.
  // DETERMINÍSTICO por email (no aleatorio): así un reintento de registro reusa
  // el MISMO usuario Cognito en vez de crear huérfanos. Si el usuario ya existe
  // y NO está confirmado, Cognito reenvía el código (último válido); si está
  // confirmado, devuelve UsernameExistsException → "ya existe una cuenta".
  const username = `mp_${createHash("sha256").update(email).digest("hex").slice(0, 40)}`;

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
    // `updated_at` es Required en el pool y Cognito SÍ exige enviarlo en el
    // SignUp (verificado 2026-07-13: omitirlo produce InvalidParameterException
    // "aws:cognito:system.updated_at is required" y rechaza TODOS los registros).
    // Formato estándar OIDC: epoch en segundos, como string. (sub sí es auto.)
    { Name: "updated_at", Value: String(Math.floor(Date.now() / 1000)) },
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

// isBlacklisted consulta a vp-payments si el candidato está en la lista negra.
// Fail-open ante cualquier fallo (infra/config): devuelve false para no bloquear
// registros legítimos por un problema transitorio.
async function isBlacklisted({ email, phone, fullName, birthDate }) {
  const base = process.env.VP_PAYMENTS_URL;
  const token = process.env.PAYMENTS_SERVICE_TOKEN;
  if (!base || !token) return false;
  try {
    const resp = await fetch(`${base}/api/registration/precheck`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-VP-Service-Token": token },
      body: JSON.stringify({ email, phone, name: fullName, birth_date: birthDate }),
      cache: "no-store",
    });
    if (!resp.ok) return false;
    const data = await resp.json().catch(() => ({}));
    return Boolean(data.blacklisted);
  } catch {
    return false;
  }
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
  if (!fullName) return "El nombre es requerido. / Name is required.";
  if (!email) return "Ingresa un email válido. / Enter a valid email.";
  if (password.length < 8) {
    return "La contraseña debe tener mínimo 8 caracteres. / Password must be at least 8 characters.";
  }
  if (password.length > 256) return "La contraseña es demasiado larga. / Password is too long.";
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
    return "Ya existe una cuenta con ese email. / An account with that email already exists.";
  }

  if (code === "InvalidPasswordException") {
    return (
      "La contraseña no cumple la política configurada en Cognito. / " +
      "The password does not meet the policy configured in Cognito."
    );
  }

  if (code === "InvalidParameterException") {
    return (
      "Cognito rechazó uno de los datos enviados. Revisa la configuración de atributos del app client. / " +
      "Cognito rejected one of the submitted values. Check the app client attribute configuration."
    );
  }

  if (code === "TooManyRequestsException" || code === "LimitExceededException") {
    return (
      "Demasiados intentos. Espera unos minutos antes de volver a intentar. / " +
      "Too many attempts. Wait a few minutes before trying again."
    );
  }

  return "No se pudo crear la cuenta en Cognito. / The account could not be created in Cognito.";
}
