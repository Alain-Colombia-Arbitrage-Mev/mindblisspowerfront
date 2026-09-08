export function buildUnconfirmedLoginTransition(email) {
  return {
    needsConfirm: true,
    email,
    confirmationCodeSent: false,
    error:
      "Tu cuenta aún no está confirmada. Te llevaremos a confirmarla y enviaremos un solo código nuevo. / " +
      "Your account isn't confirmed yet. We'll take you to confirmation and send one new code.",
    delivery: null,
  };
}

export function otpChallengeUsername(body, fallback) {
  return body?.ChallengeParameters?.USERNAME || body?.ChallengeParameters?.USER_ID_FOR_SRP || fallback;
}

export function phoneOtpIssue({ phoneLinked }) {
  // Cognito verifies a saved, unverified number after a successful SMS_OTP.
  if (phoneLinked !== false) return null;
  return {
    error: "Tu cuenta no tiene un teléfono vinculado. Ingresa con tu correo o contraseña para añadirlo, o solicita ayuda.",
    needsPhoneLink: true,
    reason: "phone_not_linked",
  };
}

export async function requestPhoneVerification({ call, endpoint, accessToken, phone }) {
  const update = await call({
    endpoint,
    target: "UpdateUserAttributes",
    payload: { AccessToken: accessToken, UserAttributes: [{ Name: "phone_number", Value: phone }] },
  });
  if (!update.ok) return update;
  const delivery = update.body.CodeDeliveryDetailsList?.find((item) => item.AttributeName === "phone_number");
  if (delivery) return { ok: true, status: 200, body: { CodeDeliveryDetails: delivery } };
  return call({
    endpoint,
    target: "GetUserAttributeVerificationCode",
    payload: { AccessToken: accessToken, AttributeName: "phone_number" },
  });
}
