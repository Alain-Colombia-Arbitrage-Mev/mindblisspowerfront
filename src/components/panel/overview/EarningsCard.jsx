import { Coins, Users, Wallet } from "lucide-react";
import StatRow from "./StatRow";

export default function EarningsCard({ total = "$0.00", wallet = "$0.00", directNetwork = 0 }) {
  const [dollars, cents = "00"] = String(total).split(".");

  return (
    <section
      className="relative flex flex-col overflow-hidden rounded-3xl p-6"
      style={{ background: "var(--vp-surface)", border: "1px solid var(--vp-border)" }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -top-8 right-0 h-32 w-32 rounded-full"
        style={{ background: "var(--vp-accent)", opacity: 0.06, filter: "blur(40px)" }}
      />

      <div className="flex items-start justify-between">
        <div>
          <p
            className="m-0 text-xs font-medium uppercase"
            style={{ color: "var(--vp-muted)", letterSpacing: "0.08em" }}
          >
            Ganancias Totales
          </p>
          <p className="m-0 mt-1.5 flex items-end gap-0.5">
            <span className="text-[38px] font-light leading-none" style={{ color: "var(--vp-text)" }}>
              {dollars}.
            </span>
            <span className="text-xl font-light leading-none" style={{ color: "var(--vp-muted)" }}>
              {cents}
            </span>
          </p>
        </div>
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: "rgba(250, 204, 21, 0.1)", border: "1px solid rgba(250, 204, 21, 0.2)" }}
        >
          <Coins size={22} style={{ color: "var(--vp-accent)" }} />
        </span>
      </div>

      <div className="mt-auto flex flex-col gap-4 pt-6">
        <StatRow icon={Wallet} label="Billetera Actual" value={wallet} />
        <StatRow icon={Users} label="Mi Red Directa" value={directNetwork} trendUp={directNetwork > 0} />
      </div>
    </section>
  );
}
