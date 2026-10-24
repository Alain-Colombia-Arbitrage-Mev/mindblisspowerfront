import { ArrowUp } from "lucide-react";

export default function StatRow({ icon: Icon, label, value, trendUp = false }) {
  return (
    <div
      className="vp-stat-row flex items-center justify-between rounded-2xl p-4"
    >
      <span className="flex items-center gap-3">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{ background: "var(--vp-surface)" }}
        >
          <Icon size={14} style={{ color: "var(--vp-accent)" }} />
        </span>
        <span className="text-sm font-medium" style={{ color: "var(--vp-muted)" }}>
          {label}
        </span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="text-lg font-semibold" style={{ color: "var(--vp-text)" }}>
          {value}
        </span>
        {trendUp ? <ArrowUp size={11} style={{ color: "#22c55e" }} /> : null}
      </span>
    </div>
  );
}
