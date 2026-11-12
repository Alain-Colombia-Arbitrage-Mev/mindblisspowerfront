"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/LanguageProvider";
import { FUNDING_UUID } from "@/lib/wallet-funding-contract.mjs";
import { useMemberSession } from "@/lib/member-session-context";
import { personalWalletBalanceSessionKey } from "@/lib/personal-wallet-balance-store.mjs";
import WalletFundingHistory from "./WalletFundingHistory";
import WalletFundingStatus from "./WalletFundingStatus";
import { WalletFundingScreen } from "./WalletFundingUI";

/** Native session-owned reads only; request history never needs a wallet SDK,
 * provider registration or an administrative sandbox connection. */
export default function PersonalWalletRequestsPage() {
  const { t } = useI18n();
  const owner = personalWalletBalanceSessionKey(useMemberSession());
  const epoch = useRef({ owner, generation: 0 }), mounted = useRef(false);
  if (epoch.current.owner !== owner) epoch.current = { owner, generation: epoch.current.generation + 1 };
  const generation = epoch.current.generation;
  const [selection, setSelection] = useState({ generation: -1, reference: "", focusKey: 0 });
  const selectedReference = owner && selection.generation === generation ? selection.reference : "";
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  function selectRequest(reference) {
    if (!mounted.current || !owner || epoch.current.generation !== generation || typeof reference !== "string" || !FUNDING_UUID.test(reference)) return;
    setSelection(current => ({ generation, reference, focusKey: current.generation === generation ? current.focusKey + 1 : 1 }));
  }
  return <WalletFundingScreen title={t("funding.history")} subtitle={t("funding.personalEnvironment")}>
    <section className="executive-panel">
      <WalletFundingHistory walletKind="personal" refreshKey={0} onSelectRequest={selectRequest} showHeading={false} />
    </section>
    {selectedReference ? <WalletFundingStatus walletKind="personal" checkoutReference={selectedReference} focusKey={selection.focusKey} /> : null}
  </WalletFundingScreen>;
}
