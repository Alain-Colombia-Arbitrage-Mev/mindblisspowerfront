// server-only — este módulo usa next/headers y aws-jwt-verify (vía
// ./verify-id-token). No importar desde componentes cliente.
import { cookies } from "next/headers";

import { verifyIdToken } from "./verify-id-token";

/** Id token crudo de la cookie de sesión (sin verificar), o "". */
export async function rawIdToken() {
  const store = await cookies();
  return store.get("vp_id_token")?.value || "";
}

/**
 * Email autenticado o null.
 *
 * El id token se verifica de verdad (firma JWKS + iss + aud + token_use + exp).
 * Fail-closed: cualquier fallo ⇒ null. NO se confía en el payload decodificado.
 */
export async function sessionEmail() {
  const token = await rawIdToken();
  if (!token) return null;
  const claims = await verifyIdToken(token);
  return claims ? claims.email : null;
}

// Capa 2 (defensa en profundidad): reenviamos el id token CRUDO al backend Go
// en X-VP-Id-Token para que re-verifique la identidad por su cuenta (JWKS) en
// lugar de confiar en el `email` que declara el BFF. Requiere que vp-payments /
// vp-withdrawals tengan COGNITO_USER_POOL_ID (o COGNITO_ISSUER) + COGNITO_CLIENT_ID
// del MISMO pool/cliente; si no, el backend responde 401 invalid_id_token.
// VP_FORWARD_ID_TOKEN=0 desactiva el reenvío (kill-switch de emergencia).
function forwardIdTokenEnabled() {
  return process.env.VP_FORWARD_ID_TOKEN !== "0";
}

export async function idTokenHeader() {
  if (!forwardIdTokenEnabled()) return {};
  try {
    const raw = await rawIdToken();
    return raw ? { "X-VP-Id-Token": raw } : {};
  } catch {
    return {};
  }
}

/** Config del servicio de pagos (Go). */
export function paymentsConfig() {
  return { base: process.env.VP_PAYMENTS_URL, token: process.env.PAYMENTS_SERVICE_TOKEN };
}

/** Llama al servicio Go con el token de servicio. */
export async function callPayments(path, { method = "GET", body } = {}) {
  const { base, token } = paymentsConfig();
  if (!base || !token) return { ok: false, status: 503, data: { error: "payments-unconfigured" } };
  const idHeader = await idTokenHeader();
  try {
    const resp = await fetch(`${base}${path}`, {
      method,
      headers: { "X-VP-Service-Token": token, ...idHeader, ...(body ? { "content-type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    const data = await resp.json().catch(() => ({}));
    return { ok: resp.ok, status: resp.status, data };
  } catch {
    return { ok: false, status: 502, data: { error: "payments-unreachable" } };
  }
}

/** Config del servicio de retiros (Go, vp-withdrawals). Reusa el service token. */
export function withdrawalsConfig() {
  return { base: process.env.VP_WITHDRAWALS_URL, token: process.env.PAYMENTS_SERVICE_TOKEN };
}

/** Llama a vp-withdrawals con el token de servicio (retiros + BMP). */
export async function callWithdrawals(path, { method = "GET", body } = {}) {
  const { base, token } = withdrawalsConfig();
  if (!base || !token) return { ok: false, status: 503, data: { error: "withdrawals-unconfigured" } };
  const idHeader = await idTokenHeader();
  try {
    const resp = await fetch(`${base}${path}`, {
      method,
      headers: { "X-VP-Service-Token": token, ...idHeader, ...(body ? { "content-type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    const data = await resp.json().catch(() => ({}));
    return { ok: resp.ok, status: resp.status, data };
  } catch {
    return { ok: false, status: 502, data: { error: "withdrawals-unreachable" } };
  }
}

/** Verifica si el email corresponde a un admin (fail-closed: cualquier error → false). */
export async function isAdminEmail(email) {
  if (!email) return false;
  try {
    const result = await callPayments(`/api/admin/check?email=${encodeURIComponent(email)}`);
    return Boolean(result.ok && result.data?.is_admin);
  } catch {
    return false;
  }
}
