/**
 * Server-side helper for direct calls to the Cognito IDP API
 * (x-amz-json-1.1 protocol, no SDK dependency).
 */

export async function callCognito({ endpoint, target, payload }) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": `AWSCognitoIdentityProviderService.${target}`,
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, body };
}

export function getCognitoErrorCode(body) {
  const raw = body?.__type || body?.code || "";
  return String(raw).split("#").pop();
}

export function mapCognitoStatus(body) {
  const code = getCognitoErrorCode(body);
  if (code === "UsernameExistsException") return 409;
  if (code === "UserNotFoundException") return 404;
  if (
    code === "InvalidPasswordException" ||
    code === "InvalidParameterException" ||
    code === "CodeMismatchException" ||
    code === "ExpiredCodeException"
  ) {
    return 400;
  }
  if (code === "NotAuthorizedException") return 401;
  if (code === "TooManyRequestsException" || code === "LimitExceededException") return 429;
  return 502;
}

// Mensajes bilingües (ES / EN). Bilingual messages (ES / EN).
const ERROR_MESSAGES = {
  UsernameExistsException: "Ya existe una cuenta con ese email. / An account with that email already exists.",
  UserNotFoundException: "No existe una cuenta con ese email. / No account exists with that email.",
  UserNotConfirmedException:
    "La cuenta aún no está confirmada. Revisa tu correo. / The account is not confirmed yet. Check your email.",
  InvalidPasswordException:
    "La contraseña no cumple la política de seguridad. / The password does not meet the security policy.",
  InvalidParameterException:
    "Cognito rechazó uno de los datos enviados. / Cognito rejected one of the submitted values.",
  CodeMismatchException: "El código no es válido. / The code is not valid.",
  ExpiredCodeException: "El código expiró. Solicita uno nuevo. / The code expired. Request a new one.",
  NotAuthorizedException: "Credenciales inválidas. / Invalid credentials.",
  TooManyRequestsException: "Demasiados intentos. Espera unos minutos. / Too many attempts. Wait a few minutes.",
  LimitExceededException: "Demasiados intentos. Espera unos minutos. / Too many attempts. Wait a few minutes.",
};

export function mapCognitoError(
  body,
  fallback = "No se pudo completar la operación. / The operation could not be completed."
) {
  return ERROR_MESSAGES[getCognitoErrorCode(body)] || fallback;
}

export function normalizeEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}
