import Link from "next/link";
import { ArrowRight, BadgeDollarSign, WalletCards } from "lucide-react";
import { useI18n } from "@/i18n/LanguageProvider";

export default function OverviewDiscoveryCard() {
  const { t } = useI18n();
  return (
    <div className="mb-overview-discovery" aria-label={t("overview.subtitle")}>
      <section className="executive-card mb-buy-crypto-card">
        <div className="mb-discovery-top"><span><WalletCards size={20} aria-hidden="true" /></span><b>{t("overview.buyCryptoTag")}</b></div>
        <div>
          <h2>{t("walletPage.administrativeWalletLabel")}</h2>
          <p>{t("funding.administrativeDestination")}</p>
        </div>
        <Link className="executive-button primary" href="/dashboard/wallet-administrative">
          {t("walletPage.addFundsAction")} <ArrowRight size={14} />
        </Link>
      </section>

      <section className="executive-card mb-plans-discovery-card">
        <div className="mb-plans-discovery-title"><BadgeDollarSign size={18} aria-hidden="true" /><span>{t("overview.exploreMemberships")}</span></div>
        <h2>{t("overview.plansFrom")}</h2>
        <p>{t("overview.compareCopy")}</p>
        <Link className="executive-button" href="/dashboard/packages">
          {t("overview.compare")} <ArrowRight size={14} />
        </Link>
      </section>
    </div>
  );
}
