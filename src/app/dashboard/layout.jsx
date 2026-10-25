import { rawIdToken } from "@/lib/admin-bff";
import { betterAuthEnabled } from "@/lib/better-auth-bridge.mjs";
import { redirect } from "next/navigation";

import { verifyIdToken } from "@/lib/verify-id-token";

import DashboardShell from "./_components/DashboardShell";

/**
 * Gate de miembro para /dashboard: exige un id token de Cognito VERIFICADO
 * (firma JWKS + iss + aud + token_use + exp), no sólo bien formado.
 *
 * Antes bastaba con un JWT decodificable — y `!payload.exp` lo daba por válido,
 * así que un token forjado sin `exp` pasaba el gate para siempre. Cada ruta API
 * verifica su propia sesión igualmente; esto es defensa en profundidad + UX.
 * Las secciones admin tienen además su gate de admin (assertAdminOrRedirect).
 */
export default async function DashboardLayout({ children }) {
  const claims = await verifyIdToken(await rawIdToken());

  if (!claims) {
    redirect("/login");
  }

  return <DashboardShell authMode={betterAuthEnabled() ? "better-auth" : "cognito"}>{children}</DashboardShell>;
}
