import { rawIdToken } from "@/lib/admin-bff";
import { betterAuthEnabled, AuthServiceUnavailable, AuthAccessRestricted } from "@/lib/better-auth-bridge.mjs";
import { redirect } from "next/navigation";

import { verifyIdTokenForSession } from "@/lib/verify-id-token";

import AuthShell from "../_components/AuthShell";
import DashboardShell from "./_components/DashboardShell";

/**
 * Presentation gate, not a substitute for each API's owner/permission checks.
 * Better Auth obtains a fresh canonical-bound JWT from the native session;
 * both providers still require verified signatures and claims before the shell.
 *
 * Do not turn a key/service outage into an anonymous login loop. Keep Next's
 * throwing redirect OUTSIDE the verification catches, and never render private
 * children or pass claims to the static unavailability projection.
 */
export default async function DashboardLayout({ children }) {
  let token;
  try {
    token = await rawIdToken({ strictAccess: true });
  } catch (error) {
    if (error instanceof AuthAccessRestricted) return <AuthHandoffUnavailable reference="MBP-LOGIN-ACCESS" restricted />;
    if (!(error instanceof AuthServiceUnavailable)) throw error;
    console.warn(JSON.stringify({ event: 'auth_handoff_unavailable', stage: 'service_token' }));
    return <AuthHandoffUnavailable reference="MBP-LOGIN-SERVICE" />;
  }

  // An anonymous/expired native session is a normal login destination, not a
  // failed verified handoff. A canonical denial is handled above, separately.
  if (!token) redirect('/login');

  let claims;
  try {
    claims = await verifyIdTokenForSession(token);
  } catch (error) {
    if (!(error instanceof AuthServiceUnavailable)) throw error;
    console.warn(JSON.stringify({ event: 'auth_handoff_unavailable', stage: 'verification' }));
    return <AuthHandoffUnavailable reference="MBP-LOGIN-VERIFY" />;
  }

  if (!claims) {
    redirect(betterAuthEnabled() ? "/login?auth=session-not-established" : "/login");
  }

  return <DashboardShell authMode={betterAuthEnabled() ? "better-auth" : "cognito"}>{children}</DashboardShell>;
}

function AuthHandoffUnavailable({ reference, restricted = false }) {
  return (
    <AuthShell
      activePath="/login"
      eyebrow="Acceso seguro"
      title={restricted ? 'Revisemos el acceso de tu cuenta.' : 'Volvamos a comprobar tu acceso.'}
      description={restricted ? 'El correo está verificado, pero el acceso a la cuenta requiere revisión. Conserva tu correo y contacta al soporte.'
        : 'El servicio de acceso no está disponible en este momento. Puedes volver a intentar abrir el panel sin cambiar tu cuenta.'}
    >
      <section role="alert" className="space-y-5 rounded-xl border border-[var(--vp-border)] bg-[var(--vp-surface)] p-6 text-[var(--vp-text)] sm:p-7">
        <h2 className="auth-display text-2xl">{restricted ? 'Tu cuenta necesita revisión de acceso' : 'No pudimos comprobar tu sesión'}</h2>
        <p className="text-sm leading-6 text-[var(--vp-muted)]">
          {restricted ? 'Soporte debe revisar la vinculación o las restricciones de tu cuenta. Repetir el código no cambia esos permisos. No cambies tu correo ni crees otra cuenta.'
            : 'Reintenta esta comprobación. No necesitas cambiar tu correo ni crear otra cuenta.'}
        </p>
        <p className="text-xs text-[var(--vp-muted)]">Referencia de soporte: <code>{reference}</code></p>
        <div className="flex flex-col gap-3 text-sm font-bold">
          <a href="/dashboard" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--vp-accent)] px-4 text-[var(--vp-bg)] transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--vp-accent)]">
            Reintentar abrir el panel
          </a>
          <a href="/login" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--vp-border)] px-4 transition hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--vp-accent)]">
            Volver al acceso
          </a>
        </div>
      </section>
    </AuthShell>
  );
}
