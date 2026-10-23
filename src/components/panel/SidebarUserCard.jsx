import Link from "next/link";
import { ChevronRight } from "lucide-react";

function initialsOf(name) {
  const parts = (name || "Mi cuenta").trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function SidebarUserCard({
  name,
  email,
  role = "Miembro",
  onNavigate,
}) {
  return (
    <Link
      href="/dashboard/profile"
      onClick={onNavigate}
      className="vp-sidebar-account"
      title={email || name || "Mi perfil"}
    >
      <span className="vp-sidebar-avatar" aria-hidden="true">
        {initialsOf(name)}
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block truncate text-sm">
          {name || "Mi cuenta"}
        </strong>
        <span
          className="block truncate text-xs"
          style={{ color: "var(--vp-muted)" }}
        >
          {email || role}
        </span>
      </span>
      <ChevronRight size={15} aria-hidden="true" />
    </Link>
  );
}
