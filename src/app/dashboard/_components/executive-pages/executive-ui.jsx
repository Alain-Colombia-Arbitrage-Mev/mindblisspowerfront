import { Activity, Search } from "lucide-react";

function PageHeader({ eyebrow, title, subtitle, action = null }) {
  return (
    <div className="executive-page-header">
      <div>
        <p className="executive-eyebrow">{eyebrow}</p>
        <h1 className="executive-title">{title}</h1>
        {subtitle && <p className="executive-subtitle">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function IconCircle({ icon: Icon, tone = "accent" }) {
  const toneStyles = {
    accent: { background: "var(--vp-accent-muted)", border: "var(--vp-accent-border)", color: "var(--vp-accent)" },
    success: { background: "var(--vp-accent-muted)", border: "var(--vp-accent-border)", color: "var(--vp-accent)" },
    info: { background: "var(--vp-surface-raised)", border: "var(--vp-border)", color: "var(--vp-muted)" },
    warning: { background: "var(--vp-accent-muted)", border: "var(--vp-accent-border)", color: "var(--vp-accent)" },
    danger: { background: "var(--vp-danger-muted)", border: "var(--vp-danger-border)", color: "var(--vp-danger)" },
    muted: { background: "var(--vp-surface-raised)", border: "var(--vp-border)", color: "var(--vp-muted)" },
  };
  const styles = toneStyles[tone] ?? toneStyles.accent;

  return (
    <span
      className="flex h-10 w-10 items-center justify-center rounded-full"
      style={{ background: styles.background, border: `1px solid ${styles.border}`, color: styles.color }}
    >
      <Icon size={18} />
    </span>
  );
}

function MetricCard({ label, value, detail, icon, tone }) {
  return (
    <div className="executive-card">
      <div className="mb-5 flex items-start justify-between gap-4">
        <p className="executive-card-label">{label}</p>
        <IconCircle icon={icon} tone={tone} />
      </div>
      <p className="executive-card-value">{value}</p>
      <p className="mt-3 text-sm" style={{ color: "var(--vp-muted)" }}>
        {detail}
      </p>
    </div>
  );
}

function StatusPill({ children, tone = "warning" }) {
  return <span className={`executive-status ${tone}`}>{children}</span>;
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase" style={{ color: "var(--vp-muted)", letterSpacing: "0.1em" }}>
        {label}
      </span>
      {children}
    </label>
  );
}

function CalendarLikeIcon(props) {
  return <Activity {...props} />;
}

function ExecutiveModulePage({ config, extra = null }) {
  return (
    <section className="executive-page">
      <div className="executive-container">
        <PageHeader
          eyebrow={config.eyebrow}
          title={config.title}
          subtitle={config.subtitle}
          action={
            config.action && (
              <a className="executive-button primary" href={config.action.href}>
                <config.action.icon size={16} />
                {config.action.label}
              </a>
            )
          }
        />

        {extra}

        <div className="executive-grid metrics mb-6">
          {config.metrics.map((item) => (
            <MetricCard key={item.label} {...item} />
          ))}
        </div>

        <div className="executive-grid three mb-6">
          {config.cards.map((card) => (
            <article key={card.title} className="executive-card">
              <div className="mb-5 flex items-start justify-between gap-4">
                <IconCircle icon={card.icon} tone="accent" />
                <StatusPill tone={statusTone(card.status)}>{card.status}</StatusPill>
              </div>
              <h2 className="m-0 text-xl font-bold" style={{ color: "var(--vp-text)" }}>
                {card.title}
              </h2>
              <p className="mt-3 text-sm leading-7" style={{ color: "var(--vp-muted)" }}>
                {card.text}
              </p>
            </article>
          ))}
        </div>

        <div className="executive-panel">
          <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <h2 className="executive-section-title mb-0">
              <config.tableIcon size={18} style={{ color: "var(--vp-accent)" }} />
              {config.tableTitle}
            </h2>
            <div className="relative w-full md:w-72">
              <Search size={15} style={{ color: "var(--vp-muted)", left: 13, position: "absolute", top: "50%", transform: "translateY(-50%)" }} />
              <input className="executive-input leading-icon" placeholder="Buscar..." type="search" />
            </div>
          </div>
          <ExecutiveTable columns={config.columns} rows={config.rows} />
        </div>
      </div>
    </section>
  );
}

function ExecutiveTable({ columns, rows }) {
  return (
    <div className="executive-table-wrap">
      <table className="executive-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row[0]}-${index}`}>
              {row.map((cell, cellIndex) => (
                <td key={`${row[0]}-${cellIndex}`}>
                  {cellIndex === row.length - 1 ? <StatusPill tone={statusTone(String(cell))}>{cell}</StatusPill> : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function statusTone(status) {
  const value = String(status).toLowerCase();
  if (value.includes("activo") || value.includes("complet") || value.includes("listo") || value.includes("disponible") || value.includes("usar")) return "success";
  if (value.includes("pendiente") || value.includes("pausada") || value.includes("revision") || value.includes("proximo") || value.includes("sin ejecutar")) return "warning";
  if (value.includes("alto") || value.includes("alta")) return "danger";
  return "info";
}

export { PageHeader, IconCircle, MetricCard, StatusPill, Field, CalendarLikeIcon, ExecutiveModulePage, ExecutiveTable, statusTone };
