import Link from "next/link";
import { ArrowRight, History, WalletCards } from "lucide-react";
import { useI18n } from "@/i18n/LanguageProvider";

export default function OverviewDiscoveryCard() {
  const { t } = useI18n();
  return (
    <div className="mb-overview-discovery" aria-label={t("overview.subtitle")}>
      <section className="executive-card mb-buy-crypto-card">
        <div className="mb-discovery-top"><span><WalletCards size={20} aria-hidden="true" /></span><b>{t("overview.buyCryptoTag")}</b></div>
        <div>
          <h2>{t("overview.buyCrypto")}</h2>
          <p>{t("overview.buyCryptoCopy")}</p>
        </div>
        <Link className="executive-button primary" href="/dashboard/wallet-personal">
          {t("overview.createAndBuy")} <ArrowRight size={14} />
        </Link>
      </section>

      <section className="executive-card mb-plans-discovery-card">
        <div className="mb-plans-discovery-title"><History size={18} aria-hidden="true" /><span>{t("nav.wallet")}</span></div>
        <h2>{t("funding.history")}</h2>
        <p>{t("funding.personalHistoryCopy")}</p>
        <Link className="executive-button" href="/dashboard/wallet-personal/requests">
          {t("funding.viewStatus")} <ArrowRight size={14} />
        </Link>
      </section>
    </div>
  );
}
