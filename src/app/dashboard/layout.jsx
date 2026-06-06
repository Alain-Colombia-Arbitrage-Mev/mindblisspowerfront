import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import DashboardShell from "./_components/DashboardShell";

export default async function DashboardLayout({ children }) {
  const cookieStore = await cookies();
  const hasSession = Boolean(cookieStore.get("vp_id_token")?.value || cookieStore.get("vp_access_token")?.value);

  if (!hasSession) {
    redirect("/login");
  }

  return <DashboardShell authMode="cognito">{children}</DashboardShell>;
}
