import { ArrowUpRight, Wallet } from "lucide-react";

import Link from "./IntentLink";
import { useI18n } from "@/i18n/LanguageProvider";

export default function SidebarWalletCard({ onNavigate }) {
  const { t } = useI18n();
  return (
    <Link href="/dashboard/withdrawals" onClick={onNavigate} className="vp-sidebar-wallet">
      <span className="vp-sidebar-wallet-label">{t("nav.myWallet")}</span>
      <strong>— USDC</strong>
      <span className="vp-sidebar-wallet-action">
        <Wallet size={15} aria-hidden="true" />
        {t("nav.openWallet")}
        <ArrowUpRight size={14} aria-hidden="true" />
      </span>
    </Link>
  );
}
