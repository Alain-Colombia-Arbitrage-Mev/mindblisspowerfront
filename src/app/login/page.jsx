import Link from "next/link";
import AuthShell from "../_components/AuthShell";
import MagicLinkLoginForm from "./MagicLinkLoginForm";
import { betterAuthEnabled } from "@/lib/better-auth-bridge.mjs";
import { registrationLoginUrl, registrationUrl } from '../register/registration-model.mjs';

export const dynamic = "force-dynamic";

const sideKpis = [
  { value: "1", label: "comunidad" },
  { value: "24/7", label: "portal" },
  { value: "100%", label: "tuyo" },
];

export default async function LoginPage({ searchParams }) {
  const sp = (await searchParams) ?? {};
  const authState = sp.auth;
  const initialEmail = typeof sp.email === "string" ? sp.email : "";
  const initialRef = typeof sp.ref === "string" ? sp.ref : "";
  const initialSide = sp.side === "L" || sp.side === "R" ? sp.side : "";
  const emailOtpOnly = betterAuthEnabled();
  const initialMode = sp.mode === 'password' ? 'password' : 'code';
  const formContext = JSON.stringify([emailOtpOnly ? 'better-auth' : 'cognito', initialEmail, initialRef, initialSide, initialMode]);

  return (
    <AuthShell
      activePath="/login"
      loginHref={registrationLoginUrl(initialEmail, initialRef, initialSide)}
      registrationHref={registrationUrl(initialEmail, initialRef, initialSide)}
      eyebrow="Acceso"
      title="Tu equipo ya está adentro."
      description="Entra con un código a tu correo, sin recordar una contraseña. Si ya tienes contraseña de acceso, también puedes utilizarla."
      sideKpis={sideKpis}
      visualSrc="/mindbliss/mindbliss-02.avif"
      visualAlt="Equipo Mindbliss celebrando"
    >
      <div className="mb-5 sm:mb-7">
        <h2 className="auth-display text-2xl sm:text-3xl" style={{ color: "var(--vp-text)" }}>
          Iniciar sesión
        </h2>
        <p className="mt-2 text-sm leading-6" style={{ color: "var(--vp-muted)" }}>
          Recibe un código de 6 dígitos en tu correo. Si aún no tienes cuenta, te guiaremos al registro.
        </p>
      </div>

      <div
        className="min-w-0 rounded-xl p-4 sm:p-7"
        style={{
          background: "var(--vp-surface)",
          border: "1px solid var(--vp-border)",
          boxShadow: "var(--vp-shadow)",
        }}
      >
        <MagicLinkLoginForm key={formContext} authMode={emailOtpOnly ? "better-auth" : "cognito"} authState={authState} initialEmail={initialEmail} initialRef={initialRef} initialSide={initialSide} initialMode={initialMode} />

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 border-t pt-5 text-sm" style={{ borderColor: "var(--vp-border)" }}>
          <Link href={registrationUrl(initialEmail, initialRef, initialSide)} className="inline-flex min-h-11 items-center font-bold transition hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--vp-accent)]" style={{ color: "var(--vp-text-soft)" }}>
            Crear cuenta
          </Link>
          <span style={{ color: "var(--vp-border-strong)" }}>·</span>
          <Link href="/forgot-password" className="inline-flex min-h-11 items-center font-bold transition hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--vp-accent)]" style={{ color: "var(--vp-text-soft)" }}>
            {emailOtpOnly ? 'Crear o cambiar contraseña' : 'Recuperar contraseña'}
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
