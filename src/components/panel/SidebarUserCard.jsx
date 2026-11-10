import Link from "./IntentLink";
import { useI18n } from "@/i18n/LanguageProvider";

export default function SidebarUserCard({
  onNavigate,
  name: _name,
  email: _email,
}) {
  const { t } = useI18n();
  void [_name, _email];
  return (
    <Link
      href="/dashboard/support"
      onClick={onNavigate}
      className="vp-sidebar-account"
      title={t("nav.helpCenter")}
    >
      <span className="min-w-0 flex-1">
        <strong className="block truncate text-xs">{t("nav.personalAccount")}</strong>
        <span className="mt-1 block truncate text-xs" style={{ color: "var(--vp-link)" }}>{t("nav.helpCenter")}</span>
      </span>
    </Link>
  );
}
