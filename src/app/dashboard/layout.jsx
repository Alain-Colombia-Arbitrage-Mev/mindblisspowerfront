import { cookies } from "next/headers";
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
  const cookieStore = await cookies();
  const claims = await verifyIdToken(cookieStore.get("vp_id_token")?.value);

  if (!claims) {
    redirect("/login");
  }

  return <DashboardShell authMode="cognito">{children}</DashboardShell>;
}
