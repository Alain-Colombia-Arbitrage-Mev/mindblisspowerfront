"use client";

export const NETWORK_TABS = [
  { id: "tree", label: "Árbol Binario" },
  { id: "generation", label: "Generación" },
  { id: "rank", label: "Por Rango" },
  { id: "list", label: "Lista Operativa" },
];

export default function NetworkTabs({ active, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b pb-1" style={{ borderColor: "var(--vp-border)" }}>
      {NETWORK_TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            className="rounded-lg px-4 py-2 text-xs"
            style={
              isActive
                ? {
                    background: "var(--vp-accent)",
                    color: "#000000",
                    border: 0,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 0 15px rgba(250, 204, 21, 0.3)",
                  }
                : { background: "transparent", color: "var(--vp-muted)", border: 0, fontWeight: 500, cursor: "pointer" }
            }
            type="button"
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
