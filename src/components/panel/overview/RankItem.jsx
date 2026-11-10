import { Gem, Medal } from "lucide-react";

const RANK_STYLES = {
  diamond: { icon: Gem, color: "var(--vp-info)", bg: "var(--vp-info-muted)", border: "var(--vp-info-border)" },
  emerald: { icon: Gem, color: "var(--vp-success)", bg: "var(--vp-success-muted)", border: "var(--vp-success-border)" },
  sapphire: { icon: Gem, color: "var(--vp-link)", bg: "var(--vp-accent-muted)", border: "var(--vp-accent-border)" },
  gold: { icon: Medal, color: "var(--vp-amber)", bg: "var(--vp-amber-muted)", border: "var(--vp-amber-border)" },
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
