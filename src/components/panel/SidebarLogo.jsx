import Link from "next/link";

export default function SidebarLogo({ onNavigate }) {
  return (
    <div className="vp-sidebar-brand">
      <Link href="/dashboard" className="flex items-center gap-3 no-underline" onClick={onNavigate} aria-label="Mindbliss Power, resumen">
        <img src="/mindbliss/mindbliss-symbol.png" alt="" width={34} height={34} />
        <span className="flex flex-col">
          <span className="text-lg font-bold leading-none" style={{ color: "var(--vp-text)" }}>
            Mindbliss
          </span>
          <span
            className="mt-1 text-[11px] font-semibold uppercase leading-none"
            style={{ color: "var(--vp-accent)", letterSpacing: 0 }}
          >
            Power
          </span>
        </span>
      </Link>
    </div>
  );
}
