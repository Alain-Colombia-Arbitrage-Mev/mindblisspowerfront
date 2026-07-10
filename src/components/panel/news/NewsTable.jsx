"use client";

import { Plus } from "lucide-react";
import NewsTableRow from "./NewsTableRow";

const HEADERS = [
  { label: "No.", className: "w-12 text-left" },
  { label: "Title", className: "text-left" },
  { label: "Expiration date", className: "w-32 text-center" },
  { label: "Pin new", className: "w-24 text-center" },
  { label: "Read conf. required", className: "w-40 text-center" },
  { label: "Show daily", className: "w-28 text-center" },
  { label: "Actions", className: "w-24 text-right" },
];

export default function NewsTable({ items, selectedNo, onSelect, onCreate, onDelete, onEdit }) {
  return (
    <section
      className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl"
      style={{ background: "var(--vp-surface)", border: "1px solid var(--vp-border)" }}
    >
      <div
        className="flex items-center justify-between border-b px-4 py-3"
        style={{ borderColor: "var(--vp-border)", background: "rgba(10, 10, 10, 0.5)" }}
      >
        <span className="text-xs font-medium" style={{ color: "var(--vp-muted)" }}>
          Number of news: <strong style={{ color: "var(--vp-text)" }}>{items.length}</strong>
        </span>
        <button
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold"
          style={{ background: "var(--vp-accent)", border: 0, color: "#000000", cursor: "pointer" }}
          type="button"
          onClick={onCreate}
        >
          <Plus size={13} />
          Create New
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr style={{ background: "var(--vp-surface-raised)" }}>
              {HEADERS.map((header) => (
                <th
                  key={header.label}
                  className={`border-b px-4 py-3.5 text-[11px] font-semibold uppercase ${header.className}`}
                  style={{ borderColor: "var(--vp-border)", color: "var(--vp-muted)", letterSpacing: "0.05em" }}
                >
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <NewsTableRow
                key={item.no}
                item={item}
                highlighted={item.no === selectedNo}
                onSelect={onSelect}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
