import { NextResponse } from "next/server";

import { authRateLimit } from "@/lib/auth-rate-limit";
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
import { memberDb } from "@/lib/member-db";

export const runtime = "nodejs";

const CODE_CHALLENGE_COOKIE = "vp_cognito_code_challenge";
const CODE_CHALLENGE_MAX_AGE = 10 * 60;

export async function POST(request) {
  const requestUrl = new URL(request.url);
  const body = await request.json().catch(() => ({}));
  const email = normalizeEmail(body.email);

  if (!email) {
    return NextResponse.json({ error: "Ingresa un email válido. / Enter a valid email." }, { status: 400 });
  }

  // Envío de código por correo: rate limit por email + IP (preset "send").
  const limited = authRateLimit(request, { name: "code-login-request", preset: "send", email });
  if (limited) return limited;

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

  // Detecta usuarios nuevos ANTES de pedir el OTP: el passwordless de Cognito no
  // envía código a un usuario inexistente y, con PreventUserExistenceErrors
  // activo, no lo revela → el usuario espera un código que nunca llega. Si no
  // existe, lo enrutamos a registro (SignUp sí envía el código). null = no se
  // pudo verificar ⇒ seguimos con el OTP normal (fail-safe, no bloqueamos login).
  const exists = await userExistsInPool(email);
  if (exists === false) {
    // Miembro legacy: existe como afiliado ACTIVO en la DB (migrado desde el
    // sistema anterior) pero todavía NO tiene cuenta Cognito → nunca creó su
    // acceso digital. Le damos un mensaje específico que lo invita a activar su
    // acceso con ESE mismo correo (el registro/SignUp sí envía el código),
    // en vez del genérico "no encontramos cuenta" que lo deja confundido.
    const legacy = await isLegacyActiveAffiliate(email);
    return NextResponse.json(
      {
        error: legacy
          ? "Tu cuenta de miembro ya existe, pero aún no has creado tu acceso digital. " +
            "Crea tu acceso con este mismo correo y te enviaremos el código de activación. / " +
            "Your member account already exists, but you haven't created your digital access yet. " +
            "Create your access with this same email and we'll send you the activation code."
          : "No encontramos una cuenta con ese email. Crea tu cuenta para recibir el código. / " +
            "We couldn't find an account with that email. Create your account to receive the code.",
        needsRegister: true,
        legacy,
        email,
      },
      { status: 404 }
    );
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
    message: "Te enviamos un código por correo. Si no aparece en 1–2 min, revisa la carpeta de spam / correo no deseado.",
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
    return (
      "El login con código por email requiere activar ALLOW_USER_AUTH y Email OTP en Cognito. / " +
      "Email code login requires enabling ALLOW_USER_AUTH and Email OTP in Cognito."
    );
  }

  if (code === "UserNotConfirmedException") {
    return (
      "La cuenta aún no está confirmada. Revisa tu correo antes de iniciar sesión. / " +
      "The account is not confirmed yet. Check your email before signing in."
    );
  }

  return mapCognitoError(body, "No se pudo enviar el código de acceso. / The access code could not be sent.");
}

// userExistsInPool consulta al backend (vp-payments, que tiene el cliente admin
// de Cognito) si el email ya está en el pool. Devuelve true/false, o null si no
// se pudo verificar (servicio no configurado, error, o el backend no tiene el
// admin de Cognito) — en cuyo caso el caller NO bloquea el login. Gated por el
// service token; el rate limit de arriba ("send") acota el oráculo de enumeración.
async function userExistsInPool(email) {
  const base = process.env.VP_PAYMENTS_URL;
  const token = process.env.PAYMENTS_SERVICE_TOKEN;
  if (!base || !token) return null;
  try {
    const resp = await fetch(`${base}/api/auth/user-exists?email=${encodeURIComponent(email)}`, {
      headers: { "X-VP-Service-Token": token },
      cache: "no-store",
    });
    if (!resp.ok) return null;
    const data = await resp.json().catch(() => ({}));
    if (!data.checked) return null;
    return Boolean(data.exists);
  } catch {
    return null;
  }
}

// isLegacyActiveAffiliate: true si el email corresponde a un afiliado ACTIVO en
// la DB (miembro migrado) que aún NO tiene cuenta Cognito. Solo lectura (rol
// vp_web). Best-effort: cualquier fallo ⇒ false (cae al mensaje genérico).
async function isLegacyActiveAffiliate(email) {
  try {
    const sql = memberDb();
    const rows = await sql`
      SELECT 1
        FROM mlm.person p
        JOIN mlm.affiliate a ON a.person_id = p.id
       WHERE lower(p.email) = ${email} AND a.status = 'active'
       LIMIT 1`;
    return rows.length > 0;
  } catch {
    return false;
  }
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
