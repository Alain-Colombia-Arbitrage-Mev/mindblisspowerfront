import { coreFetch } from './cloudflare-runtime.mjs';
export async function cognitoUserStatus(email, env = process.env) {
  const unknown = { exists: null, confirmed: true, enabled: true };
  const base = env.VP_PAYMENTS_URL;
  const token = env.PAYMENTS_SERVICE_TOKEN;
  if (!base || !token) return unknown;
  try {
    const response = await coreFetch(`${base}/api/auth/user-exists?email=${encodeURIComponent(email)}`, {
      headers: { "X-VP-Service-Token": token },
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return unknown;
    const data = await response.json();
    if (!data.checked) return unknown;
    return {
      exists: Boolean(data.exists),
      confirmed: data.confirmed === undefined ? true : Boolean(data.confirmed),
      enabled: data.enabled === undefined ? true : Boolean(data.enabled),
      status: String(data.status || ""),
      phoneLinked: data.phone_linked === undefined ? null : Boolean(data.phone_linked),
      phoneVerified: data.phone_verified === undefined ? null : Boolean(data.phone_verified),
    };
  } catch {
    return unknown;
  }
}
