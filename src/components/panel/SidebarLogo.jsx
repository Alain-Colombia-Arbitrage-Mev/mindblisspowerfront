import Link from "next/link";
import { Zap } from "lucide-react";

export default function SidebarLogo({ onNavigate }) {
  return (
    <div className="flex h-24 shrink-0 items-center justify-center px-6">
      <Link href="/dashboard" className="flex items-center gap-3 no-underline" onClick={onNavigate}>
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: "linear-gradient(135deg, var(--vp-accent), #ca8a04)" }}
        >
          <Zap size={22} style={{ color: "#000000" }} fill="#000000" />
        </span>
        <span className="flex flex-col">
          <span className="text-xl font-bold leading-none" style={{ color: "var(--vp-text)" }}>
            Mindbliss
          </span>
          <span
            className="mt-1 text-[11px] font-semibold uppercase leading-none"
            style={{ color: "var(--vp-accent)", letterSpacing: "0.2em" }}
          >
            Power
          </span>
        </span>
      </Link>
    </div>
  );
}
