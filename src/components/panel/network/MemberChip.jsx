function initialsOf(name) {
  return (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function MemberChip({ name, detail, active }) {
  return (
    <div
      className="flex items-center gap-2.5 rounded-xl border p-2 transition-transform duration-200 hover:-translate-y-0.5"
      style={{ background: "var(--vp-surface-raised)", borderColor: "var(--vp-border)" }}
    >
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
        style={{ background: active ? "#22c55e" : "var(--vp-accent)", color: "#000000" }}
      >
        {initialsOf(name)}
      </span>
      <div className="min-w-0">
        <p className="m-0 truncate text-xs font-semibold" style={{ color: "var(--vp-text)" }}>
          {name}
        </p>
        {detail ? (
          <p className="m-0 text-[9px] font-medium" style={{ color: "var(--vp-muted)" }}>
            {detail}
          </p>
        ) : null}
      </div>
    </div>
  );
}
