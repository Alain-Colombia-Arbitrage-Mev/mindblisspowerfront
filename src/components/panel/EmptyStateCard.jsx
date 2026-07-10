export default function EmptyStateCard({ icon: Icon, title, description }) {
  return (
    <div
      className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-3xl p-8"
      style={{ background: "var(--vp-surface)", border: "1px solid var(--vp-border)" }}
    >
      <span
        className="flex h-24 w-24 items-center justify-center rounded-full"
        style={{ background: "var(--vp-bg)", border: "1px solid var(--vp-border)" }}
      >
        <Icon size={40} style={{ color: "var(--vp-accent)" }} />
      </span>
      <p className="m-0 mt-6 text-lg font-medium" style={{ color: "var(--vp-text)" }}>
        {title}
      </p>
      <p className="m-0 mt-2 max-w-xs text-center text-sm font-light" style={{ color: "var(--vp-muted)" }}>
        {description}
      </p>
    </div>
  );
}
