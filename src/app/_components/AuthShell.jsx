import Link from "next/link";
import { Headphones, Layers3, Network } from "lucide-react";

import ThemeToggle from "./ThemeToggle";
import AuthSupportWidget from "./AuthSupportWidget";

const benefits = [
  { icon: Layers3, label: "Consulta tus membresías" },
  { icon: Network, label: "Explora tu red de conexiones" },
  { icon: Headphones, label: "Encuentra ayuda cuando la necesites" },
];

const capabilities = [
  ["Cuenta", "Tu espacio personal"],
  ["Comunidad", "Red y membresías"],
  ["Soporte", "Canales de ayuda"],
];

export default function AuthShell({
  title = "Tu comunidad.\nTu próximo paso.",
  description = "Gestiona tu cuenta, consulta tus membresías y explora tu red desde un mismo espacio.",
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

        <div className="auth-identity-copy">
          <h1>{title}</h1>
          <p>{description}</p>
        </div>

        <div className="auth-benefits" aria-label="Todo tu espacio Mindbliss">
          {benefits.map(({ icon: Icon, label }) => (
            <div key={label}>
              <span><Icon size={16} aria-hidden="true" /></span>
              <p>{label}</p>
            </div>
          ))}
        </div>

        <div className="auth-capabilities">
          {capabilities.map(([name, copy]) => (
            <div key={name}><strong>{name}</strong><span>{copy}</span></div>
          ))}
        </div>
      </aside>

      <section className="auth-access-area">
        <header className="auth-access-tools">
          <AuthSupportWidget initialEmail={supportEmail} variant="header" />
          <ThemeToggle />
        </header>

        <div className="auth-content">
          <div className={`auth-form-panel auth-form-panel--${shellLayout}`}>{children}</div>
        </div>

        <p className="auth-legal">© 2026 Mindbliss · Privacidad · Términos · Soporte</p>
      </section>

      <AuthSupportWidget initialEmail={supportEmail} />
    </main>
  );
}
