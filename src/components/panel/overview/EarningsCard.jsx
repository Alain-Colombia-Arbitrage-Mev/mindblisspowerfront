import Link from "next/link";
import { ArrowUpRight, Network, Plus, Wallet } from "lucide-react";
import StatRow from "./StatRow";

export default function EarningsCard({ total = "Pendiente de cálculo", wallet = "Pendiente de cálculo", directNetwork = 0, networkReady = true, historical = false }) {
  return (
    <section
      className="mb-wallet-card relative flex flex-col overflow-hidden rounded-3xl p-6"
      style={{ background: "var(--vp-surface)", border: "1px solid var(--vp-border)" }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="m-0 text-sm font-bold" style={{ color: "var(--vp-text)" }}>Mi wallet</p>
          <p className="m-0 mt-1 text-[11px]" style={{ color: "var(--vp-muted)" }}>
            {historical ? "Histórico Stripe, en revisión" : "Saldo disponible"}
          </p>
          <p className="vp-overview-balance m-0 mt-2">
            {total}
          </p>
        </div>
        <span className="executive-status info">USDC</span>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <StatRow icon={Wallet} label="Disponible para retiro" value={wallet} />
        <StatRow icon={Network} label="Conexiones de primer nivel" value={networkReady ? directNetwork : "—"} />
      </div>

      <div className="mt-auto grid grid-cols-3 gap-2 pt-5">
        <Link className="executive-button primary px-2" href="/dashboard/withdrawals"><Plus size={14} />Recargar</Link>
        <Link className="executive-button px-2" href="/dashboard/network"><Network size={14} />Mi red</Link>
        <Link className="executive-button px-2" href="/dashboard/withdrawals">Abrir<ArrowUpRight size={14} /></Link>
      </div>
    </section>
  );
}
