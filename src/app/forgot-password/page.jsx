import Link from "next/link";
import AuthShell from "../_components/AuthShell";
import MagicLinkLoginForm from "../login/MagicLinkLoginForm";

const sideKpis = [
  { value: "1", label: "cuenta" },
  { value: "10m", label: "código" },
  { value: "100%", label: "privado" },
];

export default function ForgotPasswordPage({ searchParams }) {
  const authState = searchParams?.auth;
  const initialEmail = typeof searchParams?.email === "string" ? searchParams.email : "";

  return (
    <AuthShell
      activePath="/forgot-password"
      eyebrow="Recuperación"
      title="Recupera el acceso a tu cuenta."
      description="Recibe un código por correo y define una nueva contraseña desde la experiencia propia de Mindbliss Power."
      sideKpis={sideKpis}
      visualSrc="/mindbliss/mindbliss-01.avif"
      visualAlt="Comunidad Mindbliss Power"
      visualPosition="center"
    >
      <div className="mb-7">
        <h2 className="auth-display text-3xl" style={{ color: "var(--vp-text)" }}>
          Recuperar contraseña
        </h2>
        <p className="mt-2 text-sm leading-6" style={{ color: "var(--vp-muted)" }}>
          Te enviaremos un código para crear una nueva contraseña.
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
        <MagicLinkLoginForm authState={authState} initialEmail={initialEmail} initialMode="reset" />

        <div className="mt-6 border-t pt-5 text-center text-sm" style={{ borderColor: "var(--vp-border)" }}>
          <Link href="/login" className="font-bold transition hover:opacity-80" style={{ color: "var(--vp-accent)" }}>
            Volver al login
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
