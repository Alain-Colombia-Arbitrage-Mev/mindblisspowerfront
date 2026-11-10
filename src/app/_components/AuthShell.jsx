import Link from "next/link";

import ThemeToggle from "./ThemeToggle";
import AuthSupportWidget from "./AuthSupportWidget";
import LanguageSwitcher from "@/i18n/LanguageSwitcher";
import { AuthIdentityCopy, AuthLegal } from "./AuthLocalizedContent";

export default function AuthShell({
  title = undefined,
  description = undefined,
  children,
  visualSrc = "/mindbliss/mindbliss-auth-background.png",
  visualAlt = "Arquitectura urbana de Mindbliss",
  activePath: _activePath = undefined,
  loginHref: _loginHref = undefined,
  registrationHref: _registrationHref = undefined,
  eyebrow: _eyebrow = undefined,
  sideKpis: _sideKpis = undefined,
  visualPosition: _visualPosition = undefined,
  layout = "default",
  supportEmail = "",
}) {
  void [_activePath, _loginHref, _registrationHref, _eyebrow, _sideKpis, _visualPosition];
  const shellLayout = ["default", "compact", "long"].includes(layout) ? layout : "default";
  return (
    <main className={`auth-shell auth-shell--${shellLayout}`}>
      <aside className="auth-identity" aria-label="Mindbliss Power">
        <img src={visualSrc} alt={visualAlt} loading="eager" decoding="async" />
        <div className="auth-identity-scrim" aria-hidden="true" />

        <Link className="auth-wordmark" href="/">Mindbliss</Link>

        <AuthIdentityCopy title={title} description={description} />
      </aside>

      <section className="auth-access-area">
        <header className="auth-access-tools">
          <AuthSupportWidget initialEmail={supportEmail} variant="header" />
          <LanguageSwitcher compact />
          <ThemeToggle />
        </header>

        <div className="auth-content">
          <div className={`auth-form-panel auth-form-panel--${shellLayout}`}>{children}</div>
        </div>

        <AuthLegal />
      </section>

      <AuthSupportWidget initialEmail={supportEmail} />
    </main>
  );
}
