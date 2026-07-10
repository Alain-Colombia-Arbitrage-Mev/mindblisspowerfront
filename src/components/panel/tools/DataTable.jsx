"use client";

import { Pen, Trash2 } from "lucide-react";

const BADGE_TONES = {
  green: { color: "#4ade80", background: "rgba(34, 197, 94, 0.1)", border: "transparent" },
  blue: { color: "#60a5fa", background: "rgba(59, 130, 246, 0.1)", border: "transparent" },
  amber: { color: "#fbbf24", background: "rgba(245, 158, 11, 0.2)", border: "rgba(245, 158, 11, 0.3)" },
  gray: { color: "var(--vp-text-soft)", background: "var(--vp-surface-raised)", border: "transparent" },
};

function Cell({ column, value }) {
  if (value == null) return <span style={{ color: "var(--vp-subtle)" }}>—</span>;

  switch (column.type) {
    case "mono":
      return (
        <span className="font-mono" style={{ color: "var(--vp-subtle)" }}>
          {value}
        </span>
      );
    case "strong":
      return <span className="font-medium" style={{ color: "var(--vp-text)" }}>{value}</span>;
    case "accent":
      return <span className="font-semibold" style={{ color: "var(--vp-accent)" }}>{value}</span>;
    case "avatar":
      return (
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold"
          style={{ background: "var(--vp-surface-raised)", color: "var(--vp-text)" }}
        >
          {value}
        </span>
      );
    case "badge": {
      const tone = BADGE_TONES[value.tone] ?? BADGE_TONES.gray;
      return (
        <span
          className="rounded px-2 py-0.5 text-[10px]"
          style={{ color: tone.color, background: tone.background, border: `1px solid ${tone.border}` }}
        >
          {value.label}
        </span>
      );
    }
    default:
      return <span style={{ color: "var(--vp-text-soft)" }}>{value}</span>;
  }
}

export default function DataTable({ title, columns, rows, minWidth = 800, onEdit, onDelete }) {
  return (
    <section
      className="overflow-hidden rounded-2xl border"
      style={{ background: "var(--vp-surface)", borderColor: "var(--vp-border)" }}
    >
      {title ? (
        <div className="border-b p-6" style={{ borderColor: "var(--vp-border)" }}>
          <h3 className="m-0 text-sm font-semibold" style={{ color: "var(--vp-text)" }}>
            {title}
          </h3>
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left" style={{ minWidth }}>
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th
                  key={column.key}
                  className="border-b px-6 py-4 text-[11px] font-semibold uppercase"
                  style={{
                    borderColor: "var(--vp-border)",
                    color: index === 0 ? "var(--vp-accent)" : "var(--vp-subtle)",
                    letterSpacing: "0.05em",
                  }}
                >
                  {column.label}
                </th>
              ))}
              <th
                className="border-b px-6 py-4 text-right text-[11px] font-semibold uppercase"
                style={{ borderColor: "var(--vp-border)", color: "var(--vp-subtle)", letterSpacing: "0.05em" }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b" style={{ borderColor: "var(--vp-border)" }}>
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-3.5 text-xs">
                    <Cell column={column} value={row[column.key]} />
                  </td>
                ))}
                <td className="whitespace-nowrap px-6 py-3.5 text-right">
                  <span className="inline-flex items-center gap-3">
                    <button
                      aria-label="Editar"
                      style={{ background: "transparent", border: 0, cursor: "pointer", padding: 0 }}
                      type="button"
                      onClick={() => onEdit?.(row)}
                    >
                      <Pen size={12} style={{ color: "var(--vp-muted)" }} />
                    </button>
                    <button
                      aria-label="Eliminar"
                      style={{ background: "transparent", border: 0, cursor: "pointer", padding: 0 }}
                      type="button"
                      onClick={() => onDelete?.(row)}
                    >
                      <Trash2 size={12} style={{ color: "var(--vp-muted)" }} />
                    </button>
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td className="px-6 py-8 text-center text-xs" colSpan={columns.length + 1} style={{ color: "var(--vp-subtle)" }}>
                  Sin resultados para la búsqueda actual.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
