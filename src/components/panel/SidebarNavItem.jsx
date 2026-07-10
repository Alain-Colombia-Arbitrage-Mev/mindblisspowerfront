import Link from "next/link";

export default function SidebarNavItem({ icon: Icon, label, href, active, onNavigate }) {
  return (
    <Link href={href} onClick={onNavigate} className="block no-underline">
      <div
        className="flex h-12 items-center rounded-lg px-4"
        style={{
          background: active ? "linear-gradient(90deg, rgba(250, 204, 21, 0.1), rgba(250, 204, 21, 0))" : "transparent",
          borderLeft: `2px solid ${active ? "var(--vp-accent)" : "transparent"}`,
        }}
      >
        <span className="flex w-7 shrink-0 items-center">
          <Icon size={18} style={{ color: active ? "var(--vp-accent)" : "var(--vp-muted)" }} />
        </span>
        <span className="text-sm font-medium" style={{ color: active ? "var(--vp-text)" : "var(--vp-muted)" }}>
          {label}
        </span>
      </div>
    </Link>
  );
}
