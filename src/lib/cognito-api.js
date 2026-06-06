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

const ERROR_MESSAGES = {
  UsernameExistsException: "Ya existe una cuenta con ese email.",
  UserNotFoundException: "No existe una cuenta con ese email.",
  UserNotConfirmedException: "La cuenta aún no está confirmada. Revisa tu correo.",
  InvalidPasswordException: "La contraseña no cumple la política de seguridad.",
  InvalidParameterException: "Cognito rechazó uno de los datos enviados.",
  CodeMismatchException: "El código no es válido.",
  ExpiredCodeException: "El código expiró. Solicita uno nuevo.",
  NotAuthorizedException: "Credenciales inválidas.",
  TooManyRequestsException: "Demasiados intentos. Espera unos minutos.",
  LimitExceededException: "Demasiados intentos. Espera unos minutos.",
};

export function mapCognitoError(body, fallback = "No se pudo completar la operación.") {
  return ERROR_MESSAGES[getCognitoErrorCode(body)] || fallback;
}

export function normalizeEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}
