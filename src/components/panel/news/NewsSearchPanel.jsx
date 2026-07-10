"use client";

import { Calendar, Search } from "lucide-react";

function TextField({ placeholder, ...props }) {
  return (
    <input
      className="h-[38px] w-full rounded-lg px-4 text-sm outline-none"
      placeholder={placeholder}
      style={{ background: "var(--vp-bg)", border: "1px solid var(--vp-border)", color: "var(--vp-text)" }}
      type="text"
      {...props}
    />
  );
}

function DateField({ ...props }) {
  return (
    <label
      className="flex h-[38px] w-full items-center justify-between gap-2 rounded-lg px-4"
      style={{ background: "var(--vp-bg)", border: "1px solid var(--vp-border)" }}
    >
      <input
        className="w-full bg-transparent text-sm outline-none"
        placeholder="dd/mm/yyyy"
        style={{ color: "var(--vp-text)" }}
        type="text"
        {...props}
      />
      <Calendar size={13} style={{ color: "var(--vp-muted)", flexShrink: 0 }} />
    </label>
  );
}

export default function NewsSearchPanel({ onSearch, onRestore }) {
  return (
    <section
      className="flex flex-col gap-4 rounded-2xl p-6"
      style={{ background: "var(--vp-surface)", border: "1px solid var(--vp-border)" }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2">
          <Search size={14} style={{ color: "var(--vp-accent)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--vp-text)" }}>
            Buscar Noticias
          </span>
        </span>
        <span className="flex items-center gap-2">
          <button
            className="rounded-lg px-4 py-2 text-xs font-medium"
            style={{ background: "transparent", border: "1px solid var(--vp-border)", color: "var(--vp-muted)", cursor: "pointer" }}
            type="button"
            onClick={onRestore}
          >
            Restore
          </button>
          <button
            className="rounded-lg px-4 py-2 text-xs font-semibold"
            style={{ background: "var(--vp-accent)", border: 0, color: "#000000", cursor: "pointer" }}
            type="button"
            onClick={onSearch}
          >
            Search
          </button>
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <TextField aria-label="Título" placeholder="Title" />
        <TextField aria-label="Mensaje" placeholder="Message" />
        <TextField aria-label="Video URL" placeholder="Video URL" />
        <div className="flex gap-2">
          <DateField aria-label="Fecha desde" />
          <DateField aria-label="Fecha hasta" />
        </div>
      </div>
    </section>
  );
}
