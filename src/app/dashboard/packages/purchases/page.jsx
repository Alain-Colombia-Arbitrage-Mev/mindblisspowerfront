import { MemberSummaryProvider } from "@/hooks/useMemberSummary";
import LocalizedText from "@/i18n/LocalizedText";
import MyPaymentsPanel from "../MyPaymentsPanel";

export default function PurchaseHistoryPage() {
  return (
    <section className="executive-page">
      <div className="executive-container">
        <div className="executive-page-header">
          <LocalizedText as="h1" id="walletPage.history" className="executive-title" />
        </div>
        <MemberSummaryProvider fresh>
          <MyPaymentsPanel />
        </MemberSummaryProvider>
      </div>
    </section>
  );
}
