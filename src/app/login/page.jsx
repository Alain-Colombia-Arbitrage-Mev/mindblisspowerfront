import Link from "next/link";
import AuthShell from "../_components/AuthShell";
import MagicLinkLoginForm from "./MagicLinkLoginForm";
import { betterAuthEnabled } from "@/lib/better-auth-bridge.mjs";

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

  return (
    <AuthShell
      activePath="/login"
      eyebrow="Acceso"
      title="Tu equipo ya está adentro."
      description="Entra con código al correo o contraseña y retoma tu actividad donde la dejaste."
      sideKpis={sideKpis}
      visualSrc="/mindbliss/mindbliss-02.avif"
      visualAlt="Equipo Mindbliss celebrando"
    >
      <div className="mb-7">
        <h2 className="auth-display text-3xl" style={{ color: "var(--vp-text)" }}>
          Iniciar sesión
        </h2>
        <p className="mt-2 text-sm leading-6" style={{ color: "var(--vp-muted)" }}>
          Usa tu correo para recibir un código de acceso o entra con tu contraseña.
        </p>
      </div>

      <div
        className="rounded-xl p-6 sm:p-7"
        style={{
          background: "var(--vp-surface)",
          border: "1px solid var(--vp-border)",
          boxShadow: "var(--vp-shadow)",
        }}
      >
        <MagicLinkLoginForm authMode={emailOtpOnly ? "better-auth" : "cognito"} authState={authState} initialEmail={initialEmail} initialRef={initialRef} initialSide={initialSide} initialMode={initialMode} />

        <div className="mt-6 flex items-center justify-center gap-3 border-t pt-5 text-sm" style={{ borderColor: "var(--vp-border)" }}>
          <Link href={initialRef ? `/register?ref=${encodeURIComponent(initialRef)}${initialSide ? `&side=${initialSide}` : ""}` : "/register"} className="font-bold transition hover:opacity-80" style={{ color: "var(--vp-text-soft)" }}>
            Crear cuenta
          </Link>
          {!emailOtpOnly && <><span style={{ color: "var(--vp-border-strong)" }}>·</span>
          <Link href="/forgot-password" className="font-bold transition hover:opacity-80" style={{ color: "var(--vp-text-soft)" }}>
            Recuperar contraseña
          </Link></>}
        </div>
        {emailOtpOnly ? <p className="mt-4 text-center text-sm leading-6 text-[var(--vp-muted)]">¿Ya entraste y tu cuenta sigue en revisión? Puedes <Link href="/account/security" className="inline-flex min-h-11 items-center text-[var(--vp-text)] underline">gestionar tu validación SMS opcional</Link> sin modificar tu vinculación con la red.</p> : null}
      </div>
    </AuthShell>
  );
}
