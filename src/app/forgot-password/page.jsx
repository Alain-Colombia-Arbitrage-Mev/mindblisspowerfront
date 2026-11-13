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
      visualSrc="/mindbliss/mindbliss-auth-background.png"
      visualAlt="Mindbliss Power"
      visualPosition="center"
      layout="compact"
      supportEmail={initialEmail}
    >
      <div className="auth-form-heading">
        <h2>
          {useBetterAuth ? 'Crear o cambiar contraseña' : 'Recuperar contraseña'}
        </h2>
        <p>
          {useBetterAuth ? 'Comprueba tu correo con un código para definir una contraseña de acceso.' : 'Te enviaremos un código para crear una nueva contraseña.'}
        </p>
      </div>

      <div className="auth-recovery-form">
        {useBetterAuth ? <BetterAuthPasswordRecovery initialEmail={initialEmail} />
          : <MagicLinkLoginForm authState={authState} initialEmail={initialEmail} initialMode="reset" />}

        {useBetterAuth ? <div className="auth-recovery-back">
          <Link href="/login" className="inline-flex min-h-11 items-center font-bold transition hover:opacity-80" style={{ color: "var(--vp-accent)" }}>
            Volver a iniciar sesión
          </Link>
        </div> : null}
      </div>
    </AuthShell>
  );
}
