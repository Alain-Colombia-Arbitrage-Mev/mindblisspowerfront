import { assertAdminOrRedirect } from "@/lib/require-admin";

import DashboardShell from "./_components/DashboardShell";

export default async function DashboardLayout({ children }) {
  await assertAdminOrRedirect();

  return <DashboardShell authMode="cognito">{children}</DashboardShell>;
}
