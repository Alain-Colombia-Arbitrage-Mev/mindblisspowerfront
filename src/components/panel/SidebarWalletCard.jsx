import { ArrowUpRight, CreditCard, Wallet } from "lucide-react";

import Link from "./IntentLink";
import { useI18n } from "@/i18n/LanguageProvider";

export default function SidebarWalletCard({ onNavigate }) {
  const { t } = useI18n();
  return (
    <section className="vp-sidebar-wallet" aria-label={t("nav.personalWallet")}>
      <div className="vp-sidebar-wallet-heading">
        <span>
          <span className="vp-sidebar-wallet-label">{t("nav.personalWallet")}</span>
          <strong>— USDC</strong>
        </span>
        <Wallet size={18} aria-hidden="true" />
      </div>
      <div className="vp-sidebar-wallet-actions">
        <Link href="/dashboard/payments#personal-wallet" onClick={onNavigate} className="vp-sidebar-wallet-action">
          {t("nav.openWallet")}
          <ArrowUpRight size={13} aria-hidden="true" />
        </Link>
        <Link href="/dashboard/payments#wallet-topup" onClick={onNavigate} className="vp-sidebar-wallet-action primary">
          <CreditCard size={14} aria-hidden="true" />
          {t("nav.buyCrypto")}
        </Link>
      </div>
    </section>
  );
}
