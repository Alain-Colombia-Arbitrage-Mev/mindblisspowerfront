import { redirect } from "next/navigation";
import { sessionEmail } from "@/lib/admin-bff";

import DashboardShell from "./_components/DashboardShell";

export default async function DashboardLayout({ children }) {
  try {
    const email = await sessionEmail();
    if (!email) redirect("/login");
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    redirect("/login");
  }

  return <DashboardShell authMode="cognito">{children}</DashboardShell>;
}
