import { cookies } from "next/headers";

/** Email autenticado (del id token Cognito) o null. */
export async function sessionEmail() {
  const store = await cookies();
  const token = store.get("vp_id_token")?.value;
  if (!token) return null;
  try {
    const payload = JSON.parse(Buffer.from(String(token).split(".")[1], "base64url").toString("utf8"));
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return String(payload.email || "").trim().toLowerCase() || null;
  } catch {
    return null;
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
  try {
    const resp = await fetch(`${base}${path}`, {
      method,
      headers: { "X-VP-Service-Token": token, ...(body ? { "content-type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    const data = await resp.json().catch(() => ({}));
    return { ok: resp.ok, status: resp.status, data };
  } catch {
    return { ok: false, status: 502, data: { error: "payments-unreachable" } };
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
