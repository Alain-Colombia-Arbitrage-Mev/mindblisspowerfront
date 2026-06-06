import Link from "next/link";
import AuthShell from "../_components/AuthShell";
import MagicLinkLoginForm from "./MagicLinkLoginForm";

const sideKpis = [
  { value: "1", label: "comunidad" },
  { value: "24/7", label: "portal" },
  { value: "100%", label: "tuyo" },
];

export default function LoginPage({ searchParams }) {
  const authState = searchParams?.auth;
  const initialEmail = typeof searchParams?.email === "string" ? searchParams.email : "";

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
          Usa tu email para recibir un código de acceso o entra con contraseña.
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
        <MagicLinkLoginForm authState={authState} initialEmail={initialEmail} />

        <div className="mt-6 flex items-center justify-center gap-3 border-t pt-5 text-sm" style={{ borderColor: "var(--vp-border)" }}>
          <Link href="/register" className="font-bold transition hover:opacity-80" style={{ color: "var(--vp-text-soft)" }}>
            Crear cuenta
          </Link>
          <span style={{ color: "var(--vp-border-strong)" }}>·</span>
          <Link href="/forgot-password" className="font-bold transition hover:opacity-80" style={{ color: "var(--vp-text-soft)" }}>
            Recuperar contraseña
          </Link>
          <span style={{ color: "var(--vp-border-strong)" }}>·</span>
          <Link href="/onboarding" className="font-bold transition hover:opacity-80" style={{ color: "var(--vp-accent)" }}>
            Completar perfil
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
