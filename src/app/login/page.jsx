import AuthShell from "../_components/AuthShell";
import MagicLinkLoginForm from "./MagicLinkLoginForm";
import { LoginAccountLinks, LoginHeading } from "./LoginLocalizedCopy";
import { betterAuthEnabled, betterAuthSocialProviders } from "@/lib/better-auth-bridge.mjs";
import { registrationLoginUrl, registrationUrl } from '../register/registration-model.mjs';

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }) {
  const sp = (await searchParams) ?? {};
  const authState = sp.auth;
  const initialEmail = typeof sp.email === "string" ? sp.email : "";
  const initialRef = typeof sp.ref === "string" ? sp.ref : "";
  const initialSide = sp.side === "L" || sp.side === "R" ? sp.side : "";
  const emailOtpOnly = betterAuthEnabled();
  const enabledSocialProviders = emailOtpOnly ? betterAuthSocialProviders() : [];
  // Email OTP is the primary rewon sign-in. Password remains available only
  // when the user explicitly asks for it, including after a recovery flow.
  const initialMode = sp.mode === 'password' ? 'password' : 'code';
  const formContext = JSON.stringify([emailOtpOnly ? 'better-auth' : 'cognito', initialEmail, initialRef, initialSide, initialMode]);

  return (
    <AuthShell
      activePath="/login"
      loginHref={registrationLoginUrl(initialEmail, initialRef, initialSide)}
      registrationHref={registrationUrl(initialEmail, initialRef, initialSide)}
      visualSrc="/mindbliss/mindbliss-auth-background.png"
      visualAlt="Arquitectura urbana de Mindbliss"
      supportEmail={initialEmail}
    >
      <LoginHeading />

      <div id="ayuda-de-acceso" className="auth-login-form">
        <MagicLinkLoginForm key={formContext} authMode={emailOtpOnly ? "better-auth" : "cognito"} authState={authState} initialEmail={initialEmail} initialRef={initialRef} initialSide={initialSide} initialMode={initialMode} enabledSocialProviders={enabledSocialProviders} />

        <LoginAccountLinks registrationHref={registrationUrl(initialEmail, initialRef, initialSide)} emailOtpOnly={emailOtpOnly} />
      </div>
    </AuthShell>
  );
}
