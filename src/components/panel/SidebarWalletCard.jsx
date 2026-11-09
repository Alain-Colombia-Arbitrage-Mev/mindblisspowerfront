import { ArrowUpRight, Wallet } from "lucide-react";

import Link from "./IntentLink";

export default function SidebarWalletCard({ onNavigate }) {
  return (
    <Link href="/dashboard/withdrawals" onClick={onNavigate} className="vp-sidebar-wallet">
      <span className="vp-sidebar-wallet-label">Mi wallet</span>
      <strong>— USDC</strong>
      <span className="vp-sidebar-wallet-action">
        <Wallet size={15} aria-hidden="true" />
        Abrir wallet
        <ArrowUpRight size={14} aria-hidden="true" />
      </span>
    </Link>
  );
}
