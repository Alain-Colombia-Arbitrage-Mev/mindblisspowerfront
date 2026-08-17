import { NextResponse } from "next/server";

import { authRateLimit } from "@/lib/auth-rate-limit";
import { buildCognitoChallengeResponsePayload, getCognitoIdentityProviderConfig } from "@/lib/cognito";
import { callCognito, getCognitoErrorCode, mapCognitoError, mapCognitoStatus, normalizeEmail } from "@/lib/cognito-api";
import {
  buildDemoUser,
  buildUserFromIdToken,
  clearCookie,
  setCognitoSessionCookies,
} from "@/lib/cognito-session";

export const runtime = "nodejs";

const CODE_CHALLENGE_COOKIE = "vp_cognito_code_challenge";

export async function POST(request) {
  const requestUrl = new URL(request.url);
  const body = await request.json().catch(() => ({}));
  const email = normalizeEmail(body.email);
  const code = normalizeOtpCode(body.code);

  if (!email) {
    return NextResponse.json({ error: "Ingresa un email válido. / Enter a valid email." }, { status: 400 });
  }

  // Verificación de código de acceso: rate limit anti fuerza-bruta (IP + email).
  const limited = authRateLimit(request, { name: "code-login-confirm", preset: "verify", email });
  if (limited) return limited;

  if (!/^[a-zA-Z0-9]{4,12}$/.test(code)) {
    return NextResponse.json(
      { error: "Ingresa el código que recibiste por correo. / Enter the code you received by email." },
      { status: 400 }
    );
  }

  const challenge = readCodeChallenge(request);
  if (!challenge || challenge.email !== email) {
    return NextResponse.json(
      {
        error: "La sesión del código expiró. Solicita un código nuevo para continuar. / The code session expired. Request a new code to continue.",
        needsNewCode: true,
      },
      { status: 409 }
    );
  }

  if (challenge.mode === "demo") {
    if (code !== challenge.code) {
      return NextResponse.json({ error: "El código no es válido. / The code is not valid." }, { status: 400 });
    }

    const response = NextResponse.json({
      ok: true,
      mode: "demo",
      redirectTo: "/dashboard/profile",
      user: buildDemoUser(email),
    });
    clearCookie(response, CODE_CHALLENGE_COOKIE);
    return response;
  }

  let config;
  try {
    config = getCognitoIdentityProviderConfig(process.env);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // El canal (EMAIL_OTP | SMS_OTP) viene en la cookie del challenge que fijó el
  // request. Cada uno usa su propia clave de respuesta.
  const challengeName = challenge.challengeName === "SMS_OTP" ? "SMS_OTP" : "EMAIL_OTP";
  const responseKey = challengeName === "SMS_OTP" ? "SMS_OTP_CODE" : "EMAIL_OTP_CODE";

  const cognitoResponse = await callCognito({
    endpoint: config.endpoint,
    target: "RespondToAuthChallenge",
    payload: buildCognitoChallengeResponsePayload({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      username: email,
      session: challenge.session,
      challengeName,
      responses: { [responseKey]: code },
    }),
  });

  if (!cognitoResponse.ok) {
    const mapped = mapEmailOtpConfirmError(cognitoResponse.body);
    const response = NextResponse.json(mapped.body, { status: mapped.status });
    if (mapped.clearChallenge) clearCookie(response, CODE_CHALLENGE_COOKIE);
    return response;
  }

  if (cognitoResponse.body.ChallengeName) {
    return NextResponse.json(
      {
        error:
          `Cognito requiere un paso adicional: ${cognitoResponse.body.ChallengeName}. / ` +
          `Cognito requires an additional step: ${cognitoResponse.body.ChallengeName}.`,
      },
      { status: 409 }
    );
  }

  const tokens = cognitoResponse.body.AuthenticationResult;
  if (!tokens?.AccessToken || !tokens?.IdToken) {
    return NextResponse.json(
      { error: "Cognito no devolvió una sesión válida. / Cognito did not return a valid session." },
      { status: 502 }
    );
  }

  const response = NextResponse.json({
    ok: true,
    mode: "cognito",
    redirectTo: "/dashboard",
    user: buildUserFromIdToken(tokens.IdToken, email),
  });
  setCognitoSessionCookies(response, tokens, requestUrl);
  clearCookie(response, CODE_CHALLENGE_COOKIE);
  return response;
}

function readCodeChallenge(request) {
  const value = request.cookies.get(CODE_CHALLENGE_COOKIE)?.value;
  if (!value) return null;

  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function mapEmailOtpConfirmError(body) {
  const code = getCognitoErrorCode(body);

  if (code === "CodeMismatchException") {
    return {
      status: 400,
      body: { error: "El código no es válido. / The code is not valid." },
    };
  }

  if (code === "NotAuthorizedException") {
    const message = String(body?.message || "");
    if (/session|expired/i.test(message)) {
      return expiredChallengeResponse();
    }
    return {
      status: 400,
      body: { error: "El código no es válido. / The code is not valid." },
    };
  }

  if (code === "ExpiredCodeException") {
    return expiredChallengeResponse();
  }

  if (code === "InvalidParameterException") {
    const message = String(body?.message || "");
    if (/session|challenge/i.test(message)) {
      return expiredChallengeResponse();
    }
  }

  return {
    status: mapCognitoStatus(body),
    body: { error: mapCognitoError(body, "No se pudo validar el código. / The code could not be validated.") },
  };
}

function expiredChallengeResponse() {
  return {
    status: 409,
    clearChallenge: true,
    body: {
      error: "El código expiró o fue reemplazado por uno nuevo. Solicita otro código. / The code expired or was replaced by a new one. Request another code.",
      needsNewCode: true,
    },
  };
}

function normalizeOtpCode(value) {
  return String(value || "").replace(/[\s-]+/g, "").trim();
}
