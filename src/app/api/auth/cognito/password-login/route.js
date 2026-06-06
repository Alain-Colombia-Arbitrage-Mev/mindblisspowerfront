import { NextResponse } from "next/server";

import {
  buildCognitoChallengeResponsePayload,
  buildCognitoPasswordAuthPayload,
  buildCognitoPasswordChoiceStartPayload,
  getCognitoIdentityProviderConfig,
} from "@/lib/cognito";
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

  const cognitoResponse = await initiatePasswordAuth({
    endpoint: config.endpoint,
    config,
    email,
    password,
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

async function initiatePasswordAuth({ endpoint, config, email, password }) {
  const passwordAuthResponse = await callCognito({
    endpoint,
    target: "AWSCognitoIdentityProviderService.InitiateAuth",
    payload: buildCognitoPasswordAuthPayload({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      username: email,
      password,
    }),
  });

  if (passwordAuthResponse.ok) {
    if (passwordAuthResponse.body.AuthenticationResult) {
      return passwordAuthResponse;
    }

    return resolvePasswordChallenge({
      endpoint,
      config,
      email,
      password,
      body: passwordAuthResponse.body,
    });
  }

  if (getCognitoErrorCode(passwordAuthResponse.body) !== "InvalidParameterException") {
    return passwordAuthResponse;
  }

  const choiceResponse = await callCognito({
    endpoint,
    target: "AWSCognitoIdentityProviderService.InitiateAuth",
    payload: buildCognitoPasswordChoiceStartPayload({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      username: email,
    }),
  });

  if (!choiceResponse.ok || choiceResponse.body.AuthenticationResult) {
    return choiceResponse;
  }

  return resolvePasswordChallenge({
    endpoint,
    config,
    email,
    password,
    body: choiceResponse.body,
  });
}

async function resolvePasswordChallenge({ endpoint, config, email, password, body }) {
  if (body.ChallengeName === "PASSWORD") {
    const response = await callCognito({
      endpoint,
      target: "AWSCognitoIdentityProviderService.RespondToAuthChallenge",
      payload: buildCognitoChallengeResponsePayload({
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        username: email,
        session: body.Session,
        challengeName: "PASSWORD",
        responses: { PASSWORD: password },
      }),
    });

    return resolvePostPasswordChallengeResponse({
      endpoint,
      config,
      email,
      password,
      response,
    });
  }

  if (body.ChallengeName === "SELECT_CHALLENGE" && hasAvailableChallenge(body, "PASSWORD")) {
    const response = await callCognito({
      endpoint,
      target: "AWSCognitoIdentityProviderService.RespondToAuthChallenge",
      payload: buildCognitoChallengeResponsePayload({
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        username: email,
        session: body.Session,
        challengeName: "SELECT_CHALLENGE",
        responses: {
          ANSWER: "PASSWORD",
          PASSWORD: password,
        },
      }),
    });

    return resolvePostPasswordChallengeResponse({
      endpoint,
      config,
      email,
      password,
      response,
    });
  }

  if (body.ChallengeName === "NEW_PASSWORD_REQUIRED") {
    return resolveNewPasswordRequired({
      endpoint,
      config,
      email,
      password,
      body,
    });
  }

  return {
    ok: true,
    status: 200,
    body,
  };
}

async function resolvePostPasswordChallengeResponse({ endpoint, config, email, password, response }) {
  if (!response.ok || response.body.AuthenticationResult || response.body.ChallengeName !== "NEW_PASSWORD_REQUIRED") {
    return response;
  }

  return resolveNewPasswordRequired({
    endpoint,
    config,
    email,
    password,
    body: response.body,
  });
}

async function resolveNewPasswordRequired({ endpoint, config, email, password, body }) {
  return callCognito({
    endpoint,
    target: "AWSCognitoIdentityProviderService.RespondToAuthChallenge",
    payload: buildCognitoChallengeResponsePayload({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      username: email,
      session: body.Session,
      challengeName: "NEW_PASSWORD_REQUIRED",
      responses: {
        NEW_PASSWORD: password,
        ...buildRequiredAttributeResponses(body, email),
      },
    }),
  });
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

function hasAvailableChallenge(body, expectedChallenge) {
  const challenges = [
    ...(Array.isArray(body.AvailableChallenges) ? body.AvailableChallenges : []),
    String(body.ChallengeParameters?.AvailableChallenges || ""),
  ]
    .join(",")
    .split(",")
    .map((challenge) => challenge.trim());

  return challenges.includes(expectedChallenge);
}

function buildRequiredAttributeResponses(body, email) {
  const requiredAttributes = parseRequiredAttributes(body.ChallengeParameters?.requiredAttributes);
  if (requiredAttributes.length === 0) return {};

  const existingAttributes = parseJsonMap(body.ChallengeParameters?.userAttributes);
  const responses = {};

  requiredAttributes.forEach((attribute) => {
    if (existingAttributes[attribute]) return;

    responses[`userAttributes.${attribute}`] = getRequiredAttributeFallback(attribute, email);
  });

  return responses;
}

function parseRequiredAttributes(value) {
  try {
    const parsed = JSON.parse(String(value || "[]"));
    return Array.isArray(parsed)
      ? parsed.map((attribute) => String(attribute).trim()).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

function parseJsonMap(value) {
  try {
    const parsed = JSON.parse(String(value || "{}"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function getRequiredAttributeFallback(attribute, email) {
  if (attribute === "email") return email;
  if (attribute === "name") return "Miembro Mindbliss";
  if (attribute === "given_name") return "Miembro";
  if (attribute === "family_name") return "Mindbliss";
  if (attribute === "preferred_username") return email.split("@")[0];
  if (attribute === "locale") return "es";
  if (attribute === "zoneinfo") return "America/Bogota";
  if (attribute === "birthdate") return "1990-01-01";
  if (attribute === "gender") return "unspecified";
  if (attribute === "address") return "-";
  if (attribute === "updated_at") return String(Math.floor(Date.now() / 1000));
  return "-";
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
