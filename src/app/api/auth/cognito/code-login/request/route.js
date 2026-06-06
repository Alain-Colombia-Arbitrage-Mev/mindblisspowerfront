import { NextResponse } from "next/server";

import {
  buildCognitoChallengeResponsePayload,
  buildCognitoEmailOtpStartPayload,
  getCognitoIdentityProviderConfig,
} from "@/lib/cognito";
import { callCognito, getCognitoErrorCode, mapCognitoError, mapCognitoStatus, normalizeEmail } from "@/lib/cognito-api";
import {
  buildUserFromIdToken,
  setCognitoSessionCookies,
  setSessionCookie,
} from "@/lib/cognito-session";

export const runtime = "nodejs";

const CODE_CHALLENGE_COOKIE = "vp_cognito_code_challenge";
const CODE_CHALLENGE_MAX_AGE = 10 * 60;

export async function POST(request) {
  const requestUrl = new URL(request.url);
  const body = await request.json().catch(() => ({}));
  const email = normalizeEmail(body.email);

  if (!email) {
    return NextResponse.json({ error: "Ingresa un email válido." }, { status: 400 });
  }

  let config;
  try {
    config = getCognitoIdentityProviderConfig(process.env);
  } catch (error) {
    if (!hasAnyCognitoRuntimeConfig(process.env)) {
      if (!isDemoEmailAllowed(process.env, email)) {
        return NextResponse.json({ error: "No existe una cuenta demo con ese email." }, { status: 404 });
      }

      const response = NextResponse.json({
        ok: true,
        mode: "demo",
        message: "Modo demo: usa el código 123456 para entrar.",
        delivery: { Destination: maskEmail(email), DeliveryMedium: "EMAIL" },
      });
      setCodeChallengeCookie(response, requestUrl, { email, mode: "demo", code: "123456" });
      return response;
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const startResponse = await callCognito({
    endpoint: config.endpoint,
    target: "InitiateAuth",
    payload: buildCognitoEmailOtpStartPayload({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      username: email,
    }),
  });

  if (!startResponse.ok) {
    return NextResponse.json(
      { error: mapEmailOtpError(startResponse.body) },
      { status: mapCognitoStatus(startResponse.body) }
    );
  }

  const challengeResponse = await resolveEmailOtpChallenge({
    endpoint: config.endpoint,
    config,
    email,
    body: startResponse.body,
  });

  if (!challengeResponse.ok) {
    return NextResponse.json(
      { error: challengeResponse.error },
      { status: challengeResponse.status || 400 }
    );
  }

  if (challengeResponse.tokens) {
    const response = NextResponse.json({
      ok: true,
      mode: "cognito",
      redirectTo: "/dashboard",
      user: buildUserFromIdToken(challengeResponse.tokens.IdToken, email),
    });
    setCognitoSessionCookies(response, challengeResponse.tokens, requestUrl);
    return response;
  }

  const response = NextResponse.json({
    ok: true,
    mode: "cognito",
    challenge: "EMAIL_OTP",
    message: "Te enviamos un código por correo. Escríbelo para entrar.",
    delivery: challengeResponse.delivery,
  });
  setCodeChallengeCookie(response, requestUrl, {
    email,
    mode: "cognito",
    challengeName: "EMAIL_OTP",
    session: challengeResponse.session,
  });
  return response;
}

async function resolveEmailOtpChallenge({ endpoint, config, email, body }) {
  if (body.AuthenticationResult) {
    return { ok: true, tokens: body.AuthenticationResult };
  }

  if (body.ChallengeName === "EMAIL_OTP") {
    return {
      ok: true,
      session: body.Session,
      delivery: normalizeDelivery(body.ChallengeParameters),
    };
  }

  if (body.ChallengeName === "SELECT_CHALLENGE") {
    if (!hasEmailOtpChallenge(body)) {
      return {
        ok: false,
        status: 409,
        error: "El usuario o el pool no tiene EMAIL_OTP habilitado. Activa ALLOW_USER_AUTH y Email OTP en Cognito.",
      };
    }

    const selectResponse = await callCognito({
      endpoint,
      target: "RespondToAuthChallenge",
      payload: buildCognitoChallengeResponsePayload({
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        username: email,
        session: body.Session,
        challengeName: "SELECT_CHALLENGE",
        responses: { ANSWER: "EMAIL_OTP" },
      }),
    });

    if (!selectResponse.ok) {
      return {
        ok: false,
        status: mapCognitoStatus(selectResponse.body),
        error: mapEmailOtpError(selectResponse.body),
      };
    }

    if (selectResponse.body.AuthenticationResult) {
      return { ok: true, tokens: selectResponse.body.AuthenticationResult };
    }

    if (selectResponse.body.ChallengeName === "EMAIL_OTP") {
      return {
        ok: true,
        session: selectResponse.body.Session,
        delivery: normalizeDelivery(selectResponse.body.ChallengeParameters),
      };
    }

    return {
      ok: false,
      status: 409,
      error: `Cognito devolvió un desafío no soportado: ${selectResponse.body.ChallengeName || "desconocido"}.`,
    };
  }

  return {
    ok: false,
    status: 409,
    error: `Cognito devolvió un desafío no soportado: ${body.ChallengeName || "desconocido"}.`,
  };
}

function setCodeChallengeCookie(response, requestUrl, challenge) {
  const value = Buffer.from(JSON.stringify(challenge)).toString("base64url");
  setSessionCookie(response, CODE_CHALLENGE_COOKIE, value, requestUrl, CODE_CHALLENGE_MAX_AGE);
}

function hasEmailOtpChallenge(body) {
  const challenges = [
    ...(Array.isArray(body.AvailableChallenges) ? body.AvailableChallenges : []),
    String(body.ChallengeParameters?.AvailableChallenges || ""),
  ]
    .join(",")
    .split(",")
    .map((challenge) => challenge.trim());

  return challenges.includes("EMAIL_OTP");
}

function normalizeDelivery(challengeParameters = {}) {
  return {
    Destination: challengeParameters.CODE_DELIVERY_DESTINATION || challengeParameters.email || "",
    DeliveryMedium: "EMAIL",
  };
}

function mapEmailOtpError(body) {
  const code = getCognitoErrorCode(body);

  if (code === "InvalidParameterException" || code === "InvalidLambdaResponseException") {
    return "El login con código por email requiere activar ALLOW_USER_AUTH y Email OTP en Cognito.";
  }

  if (code === "UserNotConfirmedException") {
    return "La cuenta aún no está confirmada. Revisa tu correo antes de iniciar sesión.";
  }

  return mapCognitoError(body, "No se pudo enviar el código de acceso.");
}

function maskEmail(email) {
  const [name, domain] = email.split("@");
  return `${name.slice(0, 2)}***@${domain}`;
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

function isDemoEmailAllowed(env, email) {
  const demoEmail = normalizeEmail(env.DEMO_USER_EMAIL);
  return !demoEmail || email === demoEmail;
}
