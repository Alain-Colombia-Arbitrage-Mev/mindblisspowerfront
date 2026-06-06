import { NextResponse } from "next/server";

import { buildCognitoPasswordAuthPayload, getCognitoIdentityProviderConfig } from "@/lib/cognito";
import {
  buildDemoUser,
  buildUserFromIdToken,
  setCognitoSessionCookies,
} from "@/lib/cognito-session";

export const runtime = "nodejs";

export async function POST(request) {
  const requestUrl = new URL(request.url);
  const body = await readJson(request);
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");

  if (!email || !password || password.length > 256) {
    return NextResponse.json({ error: "Ingresa email y contraseña válidos." }, { status: 400 });
  }

  let config;
  try {
    config = getCognitoIdentityProviderConfig(process.env);
  } catch (error) {
    if (!hasAnyCognitoRuntimeConfig(process.env)) {
      if (!isDemoCredentialAllowed(process.env, email, password)) {
        return NextResponse.json({ error: "Email o contraseña incorrectos." }, { status: 401 });
      }

      return NextResponse.json({
        ok: true,
        mode: "demo",
        redirectTo: "/dashboard/profile",
        user: buildDemoUser(email),
      });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const cognitoResponse = await callCognito({
    endpoint: config.endpoint,
    target: "AWSCognitoIdentityProviderService.InitiateAuth",
    payload: buildCognitoPasswordAuthPayload({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      username: email,
      password,
    }),
  });

  if (!cognitoResponse.ok) {
    return NextResponse.json(
      { error: mapCognitoAuthError(cognitoResponse.body) },
      { status: mapCognitoStatus(cognitoResponse.body) }
    );
  }

  if (cognitoResponse.body.ChallengeName) {
    return NextResponse.json(
      {
        error: mapChallengeMessage(cognitoResponse.body.ChallengeName),
        challenge: cognitoResponse.body.ChallengeName,
      },
      { status: 409 }
    );
  }

  const tokens = cognitoResponse.body.AuthenticationResult;
  if (!tokens?.AccessToken || !tokens?.IdToken) {
    return NextResponse.json({ error: "Cognito no devolvió una sesión válida." }, { status: 502 });
  }

  const response = NextResponse.json({
    ok: true,
    mode: "cognito",
    redirectTo: "/dashboard",
    user: buildUserFromIdToken(tokens.IdToken, email),
  });

  setCognitoSessionCookies(response, tokens, requestUrl);

  return response;
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

function hasAnyCognitoRuntimeConfig(env) {
  return Boolean(
    env.COGNITO_CLIENT_ID ||
      env.COGNITO_USER_POOL_ID ||
      env.COGNITO_IDENTITY_POOL_ID ||
      env.COGNITO_DOMAIN ||
      env.COGNITO_REGION
  );
}

function isDemoCredentialAllowed(env, email, password) {
  const demoEmail = normalizeEmail(env.DEMO_USER_EMAIL);
  const demoPassword = String(env.DEMO_USER_PASSWORD || "");

  if (!demoEmail || !demoPassword) return true;
  return email === demoEmail && password === demoPassword;
}

function getCognitoErrorCode(body) {
  const raw = body?.__type || body?.code || "";
  return String(raw).split("#").pop();
}

function mapCognitoStatus(body) {
  const code = getCognitoErrorCode(body);
  if (code === "UserNotConfirmedException") return 403;
  if (code === "PasswordResetRequiredException") return 403;
  if (code === "TooManyRequestsException" || code === "LimitExceededException") return 429;
  if (code === "InvalidParameterException") return 400;
  return 401;
}

function mapCognitoAuthError(body) {
  const code = getCognitoErrorCode(body);

  if (code === "UserNotConfirmedException") {
    return "La cuenta está creada, pero falta confirmar el email antes de iniciar sesión.";
  }

  if (code === "PasswordResetRequiredException") {
    return "Cognito requiere restablecer la contraseña antes de entrar.";
  }

  if (code === "TooManyRequestsException" || code === "LimitExceededException") {
    return "Demasiados intentos. Espera unos minutos antes de volver a intentar.";
  }

  if (code === "InvalidParameterException") {
    return "La configuración de Cognito no acepta este flujo de contraseña.";
  }

  return "Email o contraseña incorrectos.";
}

function mapChallengeMessage(challengeName) {
  if (challengeName === "NEW_PASSWORD_REQUIRED") {
    return "Cognito requiere crear una nueva contraseña antes de entrar.";
  }

  if (String(challengeName).includes("MFA") || String(challengeName).includes("OTP")) {
    return "La cuenta requiere verificación adicional. Completa el segundo factor en Cognito.";
  }

  return "Cognito requiere un paso adicional para completar el acceso.";
}
