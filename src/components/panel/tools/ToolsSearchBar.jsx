"use client";

import { Filter, Search } from "lucide-react";

export default function ToolsSearchBar({ search, onSearchChange, filterField, onFilterChange, fields }) {
  return (
    <div
      className="flex flex-col items-center justify-between gap-4 rounded-xl border p-4 md:flex-row"
      style={{ background: "var(--vp-surface)", borderColor: "var(--vp-border)" }}
    >
      <label className="relative w-full md:w-96">
        <Search
          size={13}
          style={{ color: "var(--vp-subtle)", position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}
        />
        <input
          aria-label="Buscar en la tabla actual"
          className="w-full rounded-xl border py-2.5 pl-10 pr-4 text-xs outline-none"
          placeholder="Buscar en la tabla actual..."
          style={{ background: "var(--vp-bg)", borderColor: "var(--vp-border)", color: "var(--vp-text)" }}
          type="text"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>
      <div className="flex w-full items-center justify-end gap-3 md:w-auto">
        <span className="flex items-center gap-1.5 whitespace-nowrap text-xs font-medium" style={{ color: "var(--vp-subtle)" }}>
          <Filter size={11} />
          Filtrar por:
        </span>
        <select
          aria-label="Filtrar por campo"
          className="min-w-[140px] rounded-xl border px-3 py-2.5 text-xs outline-none"
          style={{ background: "var(--vp-bg)", borderColor: "var(--vp-border)", color: "var(--vp-text-soft)" }}
          value={filterField}
          onChange={(event) => onFilterChange(event.target.value)}
        >
          <option value="all">Todos los campos</option>
          {fields.map((field) => (
            <option key={field.key} value={field.key}>
              {field.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
