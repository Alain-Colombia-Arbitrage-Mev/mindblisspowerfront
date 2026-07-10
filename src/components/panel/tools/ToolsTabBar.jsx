"use client";

export default function ToolsTabBar({ tabs, active, onChange }) {
  return (
    <div
      className="flex max-w-full overflow-x-auto rounded-xl border p-1"
      style={{ background: "var(--vp-surface)", borderColor: "var(--vp-border)", scrollbarWidth: "none" }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            className="whitespace-nowrap rounded-lg px-4 py-2 text-xs font-medium"
            style={
              isActive
                ? { background: "var(--vp-accent)", color: "#000000", border: 0, fontWeight: 600, cursor: "pointer" }
                : { background: "transparent", color: "var(--vp-muted)", border: 0, cursor: "pointer" }
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
