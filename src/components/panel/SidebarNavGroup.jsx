"use client";

import Link from "./IntentLink";
import { useId, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { matchesRoute } from "@/lib/member-navigation.mjs";

export default function SidebarNavGroup({ icon: Icon, label, items, pathname, onNavigate }) {
  const isChildActive = (item) =>
    item.exact ? pathname === item.href : matchesRoute(pathname, item.href);
  const groupActive = items.some(isChildActive);
  const [open, setOpen] = useState(null);
  const expanded = open ?? groupActive;
  const id = useId();

  return (
    <div>
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={id}
        className="vp-sidebar-link vp-sidebar-group"
        data-active={groupActive}
        onClick={() => setOpen(!expanded)}
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
        <div id={id} className="vp-sidebar-children">
          {items.map((item) => {
            const active = isChildActive(item);
            return (
              <Link key={item.href} href={item.href} onClick={onNavigate} className="vp-sidebar-link" aria-current={active ? "page" : undefined}>
                <span
                  className="text-[13px]"
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
