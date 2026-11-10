"use client";

import { useI18n } from "@/i18n/LanguageProvider";

export const NETWORK_TABS = [
  { id: "tree", label: "networkPage.tabTree" }, { id: "generation", label: "networkPage.tabGeneration" }, { id: "rank", label: "networkPage.tabRank" }, { id: "list", label: "networkPage.tabList" },
];

export default function NetworkTabs({ active, onChange }) {
  const { t } = useI18n();
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
                    background: "var(--vp-action)",
                    color: "var(--vp-on-action)",
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
            {t(tab.label)}
          </button>
        );
      })}
    </div>
  );
}
