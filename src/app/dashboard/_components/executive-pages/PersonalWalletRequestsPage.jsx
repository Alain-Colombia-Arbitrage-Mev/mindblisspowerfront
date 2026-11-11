"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/LanguageProvider";
import { FUNDING_UUID } from "@/lib/wallet-funding-contract.mjs";
import WalletFundingHistory from "./WalletFundingHistory";
import WalletFundingStatus from "./WalletFundingStatus";
import { WalletFundingScreen } from "./WalletFundingUI";

/** Native session-owned reads only; request history never needs a wallet SDK,
 * provider registration or an administrative sandbox connection. */
export default function PersonalWalletRequestsPage() {
  const { t } = useI18n();
  const [selectedReference, setSelectedReference] = useState("");
  const [focusKey, setFocusKey] = useState(0);
  function selectRequest(reference) {
    if (typeof reference !== "string" || !FUNDING_UUID.test(reference)) return;
    setSelectedReference(reference);
    setFocusKey(value => value + 1);
  }
  return <WalletFundingScreen title={t("funding.history")} subtitle={t("funding.personalEnvironment")}>
    <section className="executive-panel">
      <WalletFundingHistory walletKind="personal" refreshKey={0} onSelectRequest={selectRequest} showHeading={false} />
    </section>
    {selectedReference ? <WalletFundingStatus walletKind="personal" checkoutReference={selectedReference} focusKey={focusKey} /> : null}
  </WalletFundingScreen>;
}
