import AdministrativeWalletFundingPage from "../_components/executive-pages/AdministrativeWalletFundingPage";
import { runtimeEnvironment } from "@/lib/cloudflare-runtime.mjs";

export const dynamic = "force-dynamic";

export default function AdministrativeWalletPage() {
  const environment = runtimeEnvironment().ADMINISTRATIVE_ONRAMP_ENVIRONMENT === "sandbox" ? "sandbox" : "production";
  return <AdministrativeWalletFundingPage environment={environment} />;
}
