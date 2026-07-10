import { Gem, Medal } from "lucide-react";

const RANK_STYLES = {
  diamond: { icon: Gem, color: "#60a5fa", bg: "rgba(59, 130, 246, 0.1)", border: "rgba(59, 130, 246, 0.3)" },
  emerald: { icon: Gem, color: "#34d399", bg: "rgba(34, 197, 94, 0.1)", border: "rgba(34, 197, 94, 0.3)" },
  sapphire: { icon: Gem, color: "#3b82f6", bg: "rgba(37, 99, 235, 0.1)", border: "rgba(37, 99, 235, 0.3)" },
  gold: { icon: Medal, color: "#facc15", bg: "rgba(250, 204, 21, 0.1)", border: "rgba(250, 204, 21, 0.3)" },
};

export default function RankItem({ rank }) {
  const style = RANK_STYLES[rank.tier] ?? RANK_STYLES.gold;
  const Icon = style.icon;

  return (
    <div className="flex items-center gap-4 rounded-xl p-4">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        style={{ background: style.bg, border: `1px solid ${style.border}` }}
      >
        <Icon size={16} style={{ color: style.color }} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="m-0 truncate text-sm font-semibold" style={{ color: "var(--vp-text)" }}>
          {rank.name}
        </p>
        <p className="m-0 mt-0.5 truncate text-[11px]" style={{ color: "var(--vp-muted)" }}>
          {rank.username}
        </p>
      </div>
      <span className="shrink-0 text-xs font-medium" style={{ color: "var(--vp-text)" }}>
        #{rank.position}
      </span>
    </div>
  );
}
