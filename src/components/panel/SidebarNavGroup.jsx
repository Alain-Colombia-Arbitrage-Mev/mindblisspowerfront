"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function SidebarNavGroup({ icon: Icon, label, items, pathname, onNavigate }) {
  const isChildActive = (item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);
  const groupActive = items.some(isChildActive);
  const [open, setOpen] = useState(groupActive);
  const expanded = open || groupActive;

  return (
    <div>
      <button
        type="button"
        aria-expanded={expanded}
        className="flex h-12 w-full cursor-pointer items-center justify-between rounded-lg px-4"
        style={{
          background: groupActive
            ? "linear-gradient(90deg, rgba(250, 204, 21, 0.1), rgba(250, 204, 21, 0))"
            : "transparent",
          border: 0,
          borderLeft: `2px solid ${groupActive ? "var(--vp-accent)" : "transparent"}`,
        }}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="flex items-center">
          <span className="flex w-7 shrink-0 items-center">
            <Icon size={18} style={{ color: groupActive ? "var(--vp-accent)" : "var(--vp-muted)" }} />
          </span>
          <span className="text-sm font-medium" style={{ color: groupActive ? "var(--vp-text)" : "var(--vp-muted)" }}>
            {label}
          </span>
        </span>
        {expanded ? (
          <ChevronUp size={12} style={{ color: groupActive ? "var(--vp-accent)" : "var(--vp-muted)" }} />
        ) : (
          <ChevronDown size={12} style={{ color: "var(--vp-muted)" }} />
        )}
      </button>

      {expanded ? (
        <div className="ml-3 mt-1 flex flex-col gap-1 pl-2.5" style={{ borderLeft: "1px solid var(--vp-border)" }}>
          {items.map((item) => {
            const active = isChildActive(item);
            return (
              <Link key={item.href} href={item.href} onClick={onNavigate} className="block no-underline">
                <span
                  className="block rounded-lg px-3 py-2 text-[13px]"
                  style={{
                    background: active ? "rgba(250, 204, 21, 0.1)" : "transparent",
                    color: active ? "var(--vp-accent)" : "var(--vp-muted)",
                  }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
