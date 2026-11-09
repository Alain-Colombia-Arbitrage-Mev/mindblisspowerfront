import Link from "./IntentLink";

export default function SidebarUserCard({
  onNavigate,
  name: _name,
  email: _email,
}) {
  void [_name, _email];
  return (
    <Link
      href="/dashboard/support"
      onClick={onNavigate}
      className="vp-sidebar-account"
      title="Centro de ayuda y soporte"
    >
      <span className="min-w-0 flex-1">
        <strong className="block truncate text-xs">Cuenta personal</strong>
        <span className="mt-1 block truncate text-xs" style={{ color: "var(--vp-link)" }}>Centro de ayuda y soporte</span>
      </span>
    </Link>
  );
}
