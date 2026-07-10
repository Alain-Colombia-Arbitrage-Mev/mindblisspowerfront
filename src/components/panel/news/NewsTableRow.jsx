"use client";

import { Check, Pen, Trash2, X } from "lucide-react";

function BoolCell({ value }) {
  return value ? (
    <Check size={14} style={{ color: "#22c55e" }} />
  ) : (
    <X size={14} style={{ color: "#dc2626" }} />
  );
}

export default function NewsTableRow({ item, highlighted, onSelect, onDelete, onEdit }) {
  return (
    <tr
      className="cursor-pointer border-b"
      style={{
        borderColor: "var(--vp-border)",
        background: highlighted ? "rgba(250, 204, 21, 0.05)" : "transparent",
      }}
      onClick={() => onSelect?.(item)}
    >
      <td className="px-4 py-3.5 text-xs" style={{ color: "var(--vp-muted)" }}>
        {item.no}
      </td>
      <td
        className="px-4 py-3.5 text-sm font-medium"
        style={{ color: highlighted ? "var(--vp-accent)" : "var(--vp-text)" }}
      >
        {item.title}
      </td>
      <td className="px-4 py-3.5 text-center text-xs" style={{ color: "var(--vp-muted)" }}>
        {item.expiration}
      </td>
      <td className="px-4 py-3.5 text-center">
        <span className="inline-flex justify-center">
          <BoolCell value={item.pinned} />
        </span>
      </td>
      <td className="px-4 py-3.5 text-center">
        <span className="inline-flex justify-center">
          <BoolCell value={item.readConfirmation} />
        </span>
      </td>
      <td className="px-4 py-3.5 text-center">
        <span className="inline-flex justify-center">
          <BoolCell value={item.showDaily} />
        </span>
      </td>
      <td className="px-4 py-3.5">
        <span className="flex items-center justify-end gap-3">
          <button
            aria-label="Eliminar noticia"
            style={{ background: "transparent", border: 0, cursor: "pointer", padding: 0 }}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDelete?.(item);
            }}
          >
            <Trash2 size={14} style={{ color: "var(--vp-muted)" }} />
          </button>
          <button
            aria-label="Editar noticia"
            style={{ background: "transparent", border: 0, cursor: "pointer", padding: 0 }}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onEdit?.(item);
            }}
          >
            <Pen size={14} style={{ color: "var(--vp-muted)" }} />
          </button>
        </span>
      </td>
    </tr>
  );
}
