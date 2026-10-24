import Link from "next/link";

export default function SidebarNavItem({
  icon: Icon,
  label,
  href,
  active,
  onNavigate,
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="vp-sidebar-link"
      aria-current={active ? "page" : undefined}
    >
      <Icon size={18} aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}
