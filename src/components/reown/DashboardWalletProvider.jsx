"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/LanguageProvider";
import { useMemberSession } from "@/lib/member-session-context";
import { personalWalletBalanceSessionKey } from "@/lib/personal-wallet-balance-store.mjs";

const WalletProvider = dynamic(() => import("./ReownProvider"), { ssr: false, loading: WalletLoading });

function WalletLoading() {
  const { t } = useI18n();
  return <p className="executive-panel" role="status">{t("walletPage.checking")}</p>;
}

/** Keep one owner-bound provider alive after its first use. Ordinary dashboard
 * visits do not load AppKit, and route changes cannot tear down an unlocked wallet. */
export default function DashboardWalletProvider({ children }) {
  const pathname = usePathname();
  const owner = personalWalletBalanceSessionKey(useMemberSession());
  const walletRoute = typeof pathname === "string" && (pathname === "/dashboard/wallet-personal" || pathname.startsWith("/dashboard/wallet-personal/") || pathname === "/dashboard/packages");
  const [activatedOwner, setActivatedOwner] = useState("");
  const activate = Boolean(owner) && (walletRoute || activatedOwner === owner);
  useEffect(() => { if (activate) setActivatedOwner(owner); }, [activate, owner]);

  if (!activate) return walletRoute && !owner ? <WalletLoading /> : children;
  return <WalletProvider key={owner}>{children}</WalletProvider>;
}
