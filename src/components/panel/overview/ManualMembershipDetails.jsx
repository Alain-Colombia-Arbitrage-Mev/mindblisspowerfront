import { useI18n } from "@/i18n/LanguageProvider";
import { nowpaymentsBalanceView, nowpaymentsMoney } from "@/lib/nowpayments-balances.mjs";

const roiLabels = {
  locked: "overview.manualRoiActive",
  eligible: "overview.manualRoiMatured",
  risk_review: "overview.manualRoiReview",
  closed: "overview.manualRoiClosed",
};

export function readManualMembershipItems(policy) {
  if (policy?.provider !== "manual") return [];
  const view = nowpaymentsBalanceView(policy);
  if (view.status !== "operational") return [];
  return view.membership.items.filter(item =>
    typeof item.pv === "string" && /^(?:0|[1-9]\d{0,15})$/.test(item.pv)
    && Object.hasOwn(roiLabels, item.eligibility));
}

export default function ManualMembershipDetails({ items }) {
  const { t, locale } = useI18n();
  if (items.length === 0) return null;
  const pvFormat = new Intl.NumberFormat(locale);
  return (
    <ul className="mb-manual-memberships" aria-label={t("overview.manualPackages")}>
      {items.map((item, index) => (
        <li key={item.started_at + "-" + index}>
          <strong>{nowpaymentsMoney(item.principal_usd)}</strong>
          <span>{pvFormat.format(BigInt(item.pv))} PV</span>
          <span>{t(roiLabels[item.eligibility])}</span>
        </li>
      ))}
    </ul>
  );
}
