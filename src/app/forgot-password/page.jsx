import Link from "next/link";
import AuthShell from "../_components/AuthShell";
import MagicLinkLoginForm from "../login/MagicLinkLoginForm";
import BetterAuthPasswordRecovery from './BetterAuthPasswordRecovery';
import { betterAuthEnabled } from "@/lib/better-auth-bridge.mjs";

export const dynamic = "force-dynamic";

const sideKpis = [
  { value: "1", label: "cuenta" },
  { value: "10m", label: "código" },
  { value: "100%", label: "privado" },
];

export default async function ForgotPasswordPage({ searchParams }) {
  const params = await searchParams;
  const authState = params?.auth;
  const initialEmail = typeof params?.email === "string" ? params.email : "";
  const useBetterAuth = betterAuthEnabled();

  return (
    <AuthShell
      activePath="/forgot-password"
      eyebrow="Recuperación"
      title="Recupera el acceso a tu cuenta."
      description="Recibe un código por correo y define una nueva contraseña desde la experiencia propia de Mindbliss Power."
      sideKpis={useBetterAuth ? sideKpis.map(item => item.label === 'código' ? { ...item, value: '5m' } : item) : sideKpis}
      visualSrc="/mindbliss/mindbliss-01.avif"
      visualAlt="Comunidad Mindbliss Power"
      visualPosition="center"
    >
      <div className="mb-7">
        <h2 className="auth-display text-3xl" style={{ color: "var(--vp-text)" }}>
          {useBetterAuth ? 'Crear o cambiar contraseña' : 'Recuperar contraseña'}
        </h2>
        <p className="mt-2 text-sm leading-6" style={{ color: "var(--vp-muted)" }}>
          {useBetterAuth ? 'Comprueba tu correo con un código para definir una contraseña de acceso.' : 'Te enviaremos un código para crear una nueva contraseña.'}
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
        {useBetterAuth ? <BetterAuthPasswordRecovery initialEmail={initialEmail} />
          : <MagicLinkLoginForm authState={authState} initialEmail={initialEmail} initialMode="reset" />}

        <div className="mt-6 border-t pt-5 text-center text-sm" style={{ borderColor: "var(--vp-border)" }}>
          <Link href="/login" className="font-bold transition hover:opacity-80" style={{ color: "var(--vp-accent)" }}>
            Volver al login
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
