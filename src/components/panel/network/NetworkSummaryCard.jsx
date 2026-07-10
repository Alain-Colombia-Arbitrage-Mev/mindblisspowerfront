function MetricBox({ label, value, tone = "default", span }) {
  const colors = {
    default: "var(--vp-text)",
    accent: "var(--vp-accent)",
    positive: "#4ade80",
  };
  return (
    <div
      className={`rounded-lg border p-2 text-center ${span === 2 ? "col-span-2" : ""}`}
      style={{ background: "var(--vp-bg)", borderColor: "var(--vp-border)" }}
    >
      <span className="block text-[9px] font-medium" style={{ color: "var(--vp-muted)" }}>
        {label}
      </span>
      <span className="text-xs font-bold" style={{ color: colors[tone] ?? colors.default }}>
        {value}
      </span>
    </div>
  );
}

export default function NetworkSummaryCard({ memberName, leftCount, rightCount, metrics }) {
  return (
    <section
      className="flex flex-col justify-between rounded-2xl border p-5"
      style={{ background: "var(--vp-surface)", borderColor: "var(--vp-border)" }}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="truncate text-xs font-bold" style={{ color: "var(--vp-text)" }}>
          {memberName}{" "}
          <span className="font-light" style={{ color: "var(--vp-muted)" }}>
            {leftCount}L - {rightCount}R
          </span>
        </span>
        <span
          className="shrink-0 rounded border px-2 py-0.5 text-[10px]"
          style={{ color: "var(--vp-muted)", background: "rgba(0,0,0,0.4)", borderColor: "var(--vp-border)" }}
        >
          Resumen General
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {metrics.map((metric) => (
          <MetricBox key={metric.label} {...metric} />
        ))}
      </div>
    </section>
  );
}
