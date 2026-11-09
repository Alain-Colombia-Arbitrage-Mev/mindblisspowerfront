import Link from "./IntentLink";

export default function SidebarLogo({ onNavigate }) {
  return (
    <div className="vp-sidebar-brand">
      <Link href="/dashboard" className="vp-sidebar-wordmark" onClick={onNavigate} aria-label="Mindbliss Power, resumen">
        <strong>Mindbliss</strong>
        <span>POWER</span>
      </Link>
    </div>
  );
}
