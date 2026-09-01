import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

import { authRateLimit } from "@/lib/auth-rate-limit";
import { authLogFields, logAuthEvent } from "@/lib/auth-observability";
import { buildCognitoSecretHash, getCognitoIdentityProviderConfig } from "@/lib/cognito";
import { callCognito, getCognitoErrorCode, mapCognitoError, mapCognitoStatus, normalizeEmail } from "@/lib/cognito-api";

export const runtime = "nodejs";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const email = normalizeEmail(body.email);
  const code = String(body.code || "").replace(/[\s-]+/g, "").trim();
  const resend = Boolean(body.resend);
  const referralCode = normalizeReferralCode(body.referralCode || body.referral_code || body.ref);
  // Antes de confirmar, el alias por email aún no existe: usar el username real.
  // Si el front no lo trae (p.ej. link de reactivación "reanudar registro"), se
  // deriva igual que en el registro: determinístico por email.
  const rawUsername = String(body.username || "").trim();
  const derivedUsername = email
    ? `mp_${createHash("sha256").update(email).digest("hex").slice(0, 40)}`
    : "";
  const username = /^[\w.-]{1,128}$/.test(rawUsername) ? rawUsername : derivedUsername;

  if (!username) {
    return NextResponse.json({ error: "Ingresa un email válido. / Enter a valid email." }, { status: 400 });
  }

  // Reenviar código = envío de correo (preset "send"); confirmar = verificación
  // de código (preset "verify", anti fuerza-bruta). Rate limit por IP + email.
  const limited = authRateLimit(request, {
    name: resend ? "confirm-signup-resend" : "confirm-signup-verify",
    preset: resend ? "send" : "verify",
    email,
  });
  if (limited) return limited;

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
      // Cuenta ya confirmada (p.ej. link de reactivación clicado tarde): no es
      // un error real — el front manda al login.
      if (/already\s+confirmed/i.test(String(response.body?.message || ""))) {
        logAuthEvent(
          "signup_confirmation_resend_already_confirmed",
          authLogFields({ email, status: 200, reason: "already_confirmed" })
        );
        return NextResponse.json({ ok: true, alreadyConfirmed: true });
      }
      logAuthEvent(
        "signup_confirmation_resend_failed",
        authLogFields({
          email,
          status: mapCognitoStatus(response.body),
          reason: getCognitoErrorCode(response.body) === "CodeDeliveryFailureException" ? "email_delivery_failed" : "cognito_error",
          errorCode: getCognitoErrorCode(response.body),
        }),
        "warn"
      );
      return NextResponse.json(
        { error: mapCognitoError(response.body, "No se pudo reenviar el código.") },
        { status: mapCognitoStatus(response.body) }
      );
    }

    logAuthEvent(
      "signup_confirmation_resent",
      authLogFields({ email, status: 200, reason: "sent", delivery: response.body.CodeDeliveryDetails || null })
    );
    return NextResponse.json({ ok: true, delivery: response.body.CodeDeliveryDetails || null });
  }

  if (!/^\d{4,8}$/.test(code)) {
    return NextResponse.json(
      { error: "Ingresa el código que recibiste por correo. / Enter the code you received by email." },
      { status: 400 }
    );
  }

  const response = await callCognito({
    endpoint: config.endpoint,
    target: "ConfirmSignUp",
    payload: { ...basePayload, ConfirmationCode: code },
  });

  if (!response.ok) {
    logAuthEvent(
      "signup_confirmation_failed",
      authLogFields({
        email,
        status: mapCognitoStatus(response.body),
        reason: getCognitoErrorCode(response.body) || "cognito_error",
        errorCode: getCognitoErrorCode(response.body),
      }),
      "warn"
    );
    return NextResponse.json(
      { error: mapCognitoError(response.body, "No se pudo confirmar la cuenta.") },
      { status: mapCognitoStatus(response.body) }
    );
  }

  logAuthEvent("signup_confirmation_success", authLogFields({ email, status: 200 }));

  // Notifica el registro al feed del panel admin (evento member.registered).
  // Best-effort: un fallo aquí JAMÁS afecta la confirmación del usuario.
  await notifyRegistration(email, String(body.name || "").trim(), referralCode);

  return NextResponse.json({ ok: true });
}

async function notifyRegistration(email, name, referralCode) {
  const base = process.env.VP_PAYMENTS_URL;
  const token = process.env.PAYMENTS_SERVICE_TOKEN;
  if (!base || !token || !email) return;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 1500);
    await fetch(`${base}/api/events/registration`, {
      method: "POST",
      headers: { "content-type": "application/json", "X-VP-Service-Token": token },
      body: JSON.stringify({ email, name, referral_code: referralCode }),
      signal: ctrl.signal,
      cache: "no-store",
    });
    clearTimeout(timer);
  } catch {
    /* best-effort */
  }
}

function normalizeReferralCode(value) {
  return String(value || "").trim().slice(0, 64);
}
