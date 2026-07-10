import { Calendar, Package } from "lucide-react";

function initialsOf(name) {
  return (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function SignupItem({ signup }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-4">
        <div className="relative h-12 w-12 shrink-0">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold"
            style={{ background: "linear-gradient(45deg, #1f2937, #374151)", color: "var(--vp-text)" }}
          >
            {initialsOf(signup.name)}
          </span>
          <span
            className="absolute bottom-0 right-0 h-3 w-3 rounded-full"
            style={{ background: "var(--vp-accent)", border: "2px solid var(--vp-surface)" }}
          />
        </div>
        <div className="min-w-0">
          <p className="m-0 truncate text-sm font-semibold" style={{ color: "var(--vp-text)" }}>
            {signup.name}
          </p>
          <p className="m-0 mt-1 flex items-center gap-1.5 text-[11px] font-light" style={{ color: "var(--vp-muted)" }}>
            <Calendar size={11} />
            {signup.date}
          </p>
        </div>
      </div>
      <span
        className="flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5"
        style={{ background: "var(--vp-bg)", border: "1px solid var(--vp-border)" }}
      >
        <Package size={12} style={{ color: signup.active ? "var(--vp-accent)" : "#6b7280" }} />
        <span
          className="text-xs font-semibold"
          style={{ color: signup.active ? "var(--vp-text)" : "var(--vp-muted)" }}
        >
          {signup.pack}
        </span>
      </span>
    </div>
  );
}
