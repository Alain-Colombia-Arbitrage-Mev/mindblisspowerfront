import { ArrowUpRight, Plus } from "lucide-react";
import { useI18n } from "@/i18n/LanguageProvider";

export default function EarningsCard({ total = "—", ready = false, historical = false, preview = false, onRecharge }) {
  const { t } = useI18n();
  return (
    <section className="mb-wallet-card">
      <div className="mb-wallet-heading">
        <h2>{t("overview.wallet")}</h2>
        <span>{preview ? t("overview.demo") : historical ? t("overview.underReview") : ready ? t("overview.active") : t("overview.uncreated")}</span>
      </div>
      <div>
        <p className="mb-wallet-label">{t("overview.totalBalance")}</p>
        <div className="mb-wallet-balance"><strong>{total}</strong><span>USDC</span></div>
      </div>
      <p className="mb-wallet-copy">{preview ? t("overview.demoCopy") : t("overview.emptyWalletCopy")}</p>
      <div className="mb-wallet-actions">
        <button className="executive-button primary" type="button" onClick={() => onRecharge?.("methods")}><Plus size={14} />{t("overview.topUp")}</button>
        <button className="executive-button" type="button" onClick={() => onRecharge?.("welcome")}>{t("overview.howItWorks")}<ArrowUpRight size={14} /></button>
      </div>
    </section>
  );
}
