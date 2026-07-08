import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import DashboardShell from "./_components/DashboardShell";

/**
 * Gate de miembro para /dashboard: exige una sesión Cognito con un JWT
 * bien formado y NO expirado (id o access token). No basta la mera presencia
 * de la cookie. La frontera de seguridad real de los datos es el backend
 * (requireAdmin + service token en vp-payments); esto es defensa en profundidad
 * + UX. Endurecimiento pendiente (app-wide): verificar la FIRMA del JWT contra
 * el JWKS de Cognito (jose / aws-jwt-verify).
 * Las secciones admin (ai-analysis, admin, command-center) tienen además su
 * propio gate de admin (assertAdminOrRedirect).
 */
function jwtValid(token) {
  if (!token) return false;
  try {
    const payload = JSON.parse(
      Buffer.from(String(token).split(".")[1], "base64url").toString("utf8")
    );
    return !payload.exp || payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export default async function DashboardLayout({ children }) {
  const cookieStore = await cookies();
  const authed =
    jwtValid(cookieStore.get("vp_id_token")?.value) ||
    jwtValid(cookieStore.get("vp_access_token")?.value);

  if (!authed) {
    redirect("/login");
  }

  return <DashboardShell authMode="cognito">{children}</DashboardShell>;
}
