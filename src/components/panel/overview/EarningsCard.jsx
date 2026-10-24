import { Coins, Users, Wallet } from "lucide-react";
import StatRow from "./StatRow";

export default function EarningsCard({ total = "$0.00", wallet = "$0.00", directNetwork = 0, networkReady = true }) {
  const [dollars, cents = "00"] = String(total).split(".");

  return (
    <section
      className="relative flex flex-col overflow-hidden rounded-3xl p-6"
      style={{ background: "var(--vp-surface)", border: "1px solid var(--vp-border)" }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p
            className="m-0 text-xs font-medium uppercase"
            style={{ color: "var(--vp-muted)", letterSpacing: 0 }}
          >
            Saldo de billetera
          </p>
          <p className="vp-overview-balance m-0 mt-2">
            {dollars}{total === "—" ? "" : `.${cents}`}
          </p>
        </div>
        <span
          className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "rgba(250, 204, 21, 0.1)", border: "1px solid rgba(250, 204, 21, 0.2)" }}
        >
          <Coins size={22} style={{ color: "var(--vp-accent)" }} />
        </span>
      </div>

      <div className="mt-auto flex flex-col gap-4 pt-6">
        <StatRow icon={Wallet} label="Disponible para retiro" value={wallet} />
        <StatRow icon={Users} label="Conexiones de primer nivel" value={networkReady ? directNetwork : "—"} />
      </div>
    </section>
  );
}
