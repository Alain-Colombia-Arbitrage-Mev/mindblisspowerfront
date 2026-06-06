import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import DashboardShell from "./_components/DashboardShell";

const cognitoConfigured = Boolean(process.env.COGNITO_DOMAIN && process.env.COGNITO_CLIENT_ID);

export default async function DashboardLayout({ children }) {
  const cookieStore = await cookies();
  const hasSession = Boolean(cookieStore.get("vp_id_token") || cookieStore.get("vp_access_token"));

  if (cognitoConfigured && !hasSession) {
    redirect("/login");
  }

  return <DashboardShell authMode={cognitoConfigured ? "cognito" : "demo"}>{children}</DashboardShell>;
}
