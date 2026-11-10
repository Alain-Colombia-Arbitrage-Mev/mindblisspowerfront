import { FinanceDashboardPage } from "../_components/executive-pages/FinanceDashboardPage";
import { runtimeEnvironment } from "@/lib/cloudflare-runtime.mjs";

export const dynamic = "force-dynamic";

export default function PaymentsPage() {
  const administrativeEnvironment = runtimeEnvironment().ADMINISTRATIVE_ONRAMP_ENVIRONMENT === "sandbox" ? "sandbox" : "production";
  return <FinanceDashboardPage administrativeEnvironment={administrativeEnvironment} />;
}
