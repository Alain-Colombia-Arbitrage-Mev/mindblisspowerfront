"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  LifeBuoy,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { isMicrosoftEmail, suggestEmailFix, useResendCooldown } from "@/lib/useResendCooldown";
import { checkPassword, isValidPassword } from "@/lib/password";
import { bindReferralCodeToEmail, captureReferralFromUrl, normalizePlacementSide, normalizeReferralCode } from "@/lib/referral-attribution";
import { otpRequest, otpFailureMessage, otpTimeoutMs, otpConfirmationRetrySeconds, OTP_SEND_NOTICE, OTP_SEND_UNCONFIRMED_NOTICE } from "@/lib/email-otp-client.mjs";
import BetterAuthPasswordLogin from './BetterAuthPasswordLogin';
import SocialLoginButtons from './SocialLoginButtons';
import { verifiedEmailSignIn, betterAuthAccess } from './better-auth-login.mjs';
import { registrationRequired, registrationRedirect, registrationRetrySeconds, registrationUrl } from '../register/registration-model.mjs';
import { beginVerifiedReferralSync } from '@/lib/referral-sync.mjs';
import { browserRequestDeadline } from '@/lib/browser-request-deadline.mjs';

const AUTH_STATE_MESSAGES = {
  "session-not-established": {
    tone: "info",
    text: "El servidor no pudo confirmar una sesión con acceso. Vuelve a entrar con el mismo correo. Si se repite, contacta al soporte con la referencia MBP-LOGIN-SESSION.",
  },
  "invalid-email": {
    tone: "danger",
    text: "Ingresa un email válido para continuar.",
  },
  "use-designed-login": {
    tone: "info",
    text: "Usa esta pantalla para entrar de manera segura, sin abrir ventanas externas.",
  },
  "password-required": {
    tone: "info",
    text: "Usa tu contraseña o solicita un código de acceso por correo.",
  },
  "invalid-state": {
    tone: "danger",
    text: "La sesión de acceso expiró. Solicita un nuevo código.",
  },
  "token-exchange-failed": {
    tone: "danger",
    text: "No se pudo completar la sesión. Intenta de nuevo.",
  },
  "social-failed": {
    tone: "info",
    text: "No pudimos completar el acceso con esa cuenta. Intenta de nuevo o entra con tu correo.",
  },
};

export default function MagicLinkLoginForm({ authState, initialEmail = "", initialMode = "code", initialRef = "", initialSide = "", authMode = "cognito", enabledSocialProviders = [] }) {
  const emailOtpOnly = authMode === "better-auth";
  const [mode, setMode] = useState(() => emailOtpOnly ? initialMode === 'password' ? 'password' : 'code' : normalizeMode(initialMode));
  const [codeStep, setCodeStep] = useState("request");
  const [email, setEmail] = useState(initialEmail);
  const [referralCode, setReferralCode] = useState(() => normalizeReferralCode(initialRef));
  const [preferredSide, setPreferredSide] = useState(() => normalizePlacementSide(initialSide));
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginCode, setLoginCode] = useState("");
  const [codeRecipient, setCodeRecipient] = useState("");
  const otpSubmittingRef = useRef(false);
  const otpRequestRef = useRef(null);
  const mountedRef = useRef(false);
  const verifiedLoginRef = useRef(null);
  const dashboardNavigationRef = useRef(false);
  const dashboardAccessRef = useRef(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [accessHelpPhone, setAccessHelpPhone] = useState("");
  const [accessHelpReason, setAccessHelpReason] = useState("");
  const [showAccessFallback, setShowAccessFallback] = useState(false);
  const [loadingAction, setLoadingAction] = useState("");
  const [resetStep, setResetStep] = useState("request");
  const [resetCode, setResetCode] = useState("");
  const [verifiedLogin, setVerifiedLogin] = useState(null);
  const [checkingAccess, setCheckingAccess] = useState(false);
  const verifiedTitle = useRef(null);
  const codeCooldown = useResendCooldown(emailOtpOnly ? 300 : 45, `${authMode}:sign-in:${(codeStep === 'confirm' ? codeRecipient : email).trim().toLowerCase()}`);
  const confirmationCooldown = useResendCooldown(60, `${authMode}:sign-in-confirm:${codeRecipient.trim().toLowerCase()}`);
  const resetCooldown = useResendCooldown(45);

  const authMessage = getAuthStateMessage(authState);
  const isLoading = Boolean(loadingAction);
  const verifiedEmail = verifiedLogin?.email;

  useEffect(() => {
    const attribution = captureReferralFromUrl(window.location.search);
    if (attribution?.code) {
      setReferralCode(attribution.code);
      setPreferredSide(normalizePlacementSide(attribution.side));
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      verifiedLoginRef.current = null;
      dashboardAccessRef.current?.abort();
      dashboardAccessRef.current = null;
      otpRequestRef.current?.abort();
      otpRequestRef.current = null;
      otpSubmittingRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (verifiedEmail) verifiedTitle.current?.focus();
  }, [verifiedEmail]);

  function showVerifiedLogin(verifiedEmail) {
    if (!mountedRef.current || dashboardNavigationRef.current || verifiedLoginRef.current) return;
    setError('');
    setNotice('');
    setLoginCode('');
    const verified = { email: verifiedEmail };
    verifiedLoginRef.current = verified;
    setVerifiedLogin(verified);
    return enterVerifiedDashboard(verified);
  }

  async function enterVerifiedDashboard(verified) {
    if (!mountedRef.current || dashboardNavigationRef.current || dashboardAccessRef.current || verifiedLoginRef.current !== verified) return;
    const controller = new AbortController();
    dashboardAccessRef.current = controller;
    setCheckingAccess(true);
    try {
      // The POST proved the native session server-side. This single GET proves
      // that this browser also returned its cookie, for the same verified owner.
      // It never replaces the dashboard/API gates or the direct fallback link.
      const access = await betterAuthAccess(fetch, verified.email, { signal: controller.signal });
      if (!mountedRef.current || controller.signal.aborted || dashboardAccessRef.current !== controller || verifiedLoginRef.current !== verified) return;
      if (!access.ready) {
        setError(access.error || '');
        setNotice(access.notice || '');
        return;
      }
      // Optional browser storage/referral sync must not strand a valid sign-in.
      try {
        rememberReferralForEmail(verified.email);
        if (referralCode) void beginVerifiedReferralSync(verified.email, referralCode, preferredSide);
      } catch { /* The server independently authorizes referral persistence. */ }
      dashboardNavigationRef.current = true;
      window.location.replace('/dashboard');
    } catch {
      if (mountedRef.current && !controller.signal.aborted && dashboardAccessRef.current === controller) {
        setError('Tu correo está verificado. Abre el panel con el enlace de abajo para continuar.');
      }
    } finally {
      if (dashboardAccessRef.current === controller) {
        dashboardAccessRef.current = null;
        setCheckingAccess(false);
      }
    }
  }

  function normalizeEmail() {
    return email.trim().toLowerCase();
  }

  function validateEmail() {
    const normalizedEmail = normalizeEmail();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Ingresa un email válido.");
      return "";
    }
    return normalizedEmail;
  }

  function rememberReferralForEmail(normalizedEmail) {
    if (!referralCode) return;
    bindReferralCodeToEmail(normalizedEmail, referralCode, undefined, undefined, 'login', preferredSide);
  }

  function continueToRegistration(normalizedEmail) {
    setPassword('');
    setLoginCode('');
    setCodeRecipient('');
    setCodeStep('request');
    setNotice('Completa tu registro y verifica tu correo para continuar.');
    window.location.assign(registrationRedirect(normalizedEmail, referralCode, preferredSide, window));
  }

  function authPathWithReferral(path, normalizedEmail, extraParams = {}) {
    const params = new URLSearchParams(extraParams);
    if (normalizedEmail) params.set("email", normalizedEmail);
    if (referralCode) params.set("ref", referralCode);
    const query = params.toString();
    return query ? `${path}?${query}` : path;
  }

  function switchMode(nextMode) {
    if (isLoading || (emailOtpOnly && !['code', 'password'].includes(nextMode))) return;
    setMode(nextMode);
    setPassword('');
    setError("");
    setNotice("");

    if (nextMode === "code") {
      setCodeStep("request");
      setLoginCode("");
      setShowAccessFallback(false);
    }

    if (nextMode === "reset") {
      setResetStep("request");
      setResetCode("");
    }
  }

  async function requestLoginCode(event, { resend = false } = {}) {
    event?.preventDefault();
    if (otpSubmittingRef.current || isLoading || codeCooldown.active) return;
    setError("");
    setNotice("");
    // A resend belongs to the displayed challenge, never a hidden/edited email.
    const normalizedEmail = resend ? codeRecipient : validateEmail();
    if (!normalizedEmail) return;
    rememberReferralForEmail(normalizedEmail);
    if (!resend) setShowAccessFallback(false);

    otpSubmittingRef.current = true;
    const controller = new AbortController();
    otpRequestRef.current = controller;
    setLoadingAction('code-request');
    const deadline = browserRequestDeadline(controller.signal, otpTimeoutMs('send'));
    try {
      const contract = emailOtpOnly ? otpRequest(authMode, 'send', normalizedEmail) : {
        path: "/api/auth/cognito/code-login/request", body: { email: normalizedEmail, channel: 'email' },
      };
      const response = await fetch(contract.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin", cache: "no-store", redirect: "error",
        signal: deadline.signal,
        body: JSON.stringify(contract.body),
      });
      const payload = await response.json().catch(() => ({}));
      if (controller.signal.aborted || otpRequestRef.current !== controller) return;

      if (emailOtpOnly) {
        if (registrationRequired(response.status, payload)) {
          continueToRegistration(normalizedEmail);
          return;
        }
        if (!response.ok || payload.ok !== true) {
          if (response.status === 429 || response.status >= 500 || response.ok) {
            // The previous/current attempt may already have produced a code.
            // Keep a place to enter it without retrying or claiming a delivery.
            setCodeStep("confirm");
            setCodeRecipient(normalizedEmail);
            if (!resend) setLoginCode("");
            codeCooldown.start(registrationRetrySeconds(response, payload));
            setError(response.status === 429
              ? `${otpFailureMessage(429, 'send')} ${OTP_SEND_UNCONFIRMED_NOTICE}`
              : OTP_SEND_UNCONFIRMED_NOTICE);
          } else setError(otpFailureMessage(response.status, 'send'));
          return;
        }
        setCodeStep("confirm");
        setCodeRecipient(normalizedEmail);
        setLoginCode("");
        codeCooldown.start(registrationRetrySeconds(response, payload));
        setNotice(OTP_SEND_NOTICE);
        return;
      }

      // Usuario nuevo (no está en el pool): el OTP nunca le llegaría. Lo llevamos
      // a crear cuenta con el email precargado (el registro sí envía el código).
      if (payload.needsRegister) {
        setShowAccessFallback(false);
        setNotice("No tienes una cuenta con ese email. Te llevamos a crear una…");
        window.location.assign(authPathWithReferral("/register", normalizedEmail));
        return;
      }

      // Cuenta sin confirmar: la reenviamos al paso de confirmar (resume=1), que
      // ya reenvió el código de confirmación.
      if (payload.needsConfirm) {
        setShowAccessFallback(false);
        setNotice("Tu cuenta aún no está confirmada. Te llevamos a confirmarla…");
        window.location.assign(authPathWithReferral("/register", normalizedEmail, { resume: "1" }));
        return;
      }

      if (!response.ok || !payload.ok) {
        if (response.status === 429) codeCooldown.start(payload.retryAfterSec || 60);
        if (payload.accessBlocked) {
          setShowAccessFallback(false);
          setError(payload.error || "Tu cuenta no puede recibir códigos de acceso en este momento.");
          return;
        }
        setAccessHelpReason(payload.reason || "email_code_not_received");
        setShowAccessFallback(true);
        setError(payload.error || "No se pudo enviar el código de acceso.");
        return;
      }

      if (payload.user) {
        persistLocalUser(payload.user);
        window.location.assign(payload.redirectTo || "/dashboard");
        return;
      }

      setCodeStep("confirm");
      setCodeRecipient(normalizedEmail);
      setShowAccessFallback(true);
      setLoginCode("");
      codeCooldown.start();
      setNotice(
        payload.message ||
          (resend
            ? `Te reenviamos el código a ${normalizedEmail}. Revisa tu correo (y spam).`
            : "Te enviamos un código por correo. Si no aparece en 1–2 min, revisa la carpeta de spam."),
      );
    } catch {
      if (controller.signal.aborted || otpRequestRef.current !== controller) return;
      if (emailOtpOnly) {
        setCodeStep("confirm");
        setCodeRecipient(normalizedEmail);
        if (!resend) setLoginCode("");
        codeCooldown.start(300);
        setError(OTP_SEND_UNCONFIRMED_NOTICE);
      } else {
        setAccessHelpReason("auth_service_unavailable");
        setShowAccessFallback(true);
        setError("No se pudo conectar con el servicio de acceso.");
      }
    } finally {
      deadline.dispose();
      if (otpRequestRef.current === controller) {
        otpRequestRef.current = null;
        otpSubmittingRef.current = false;
        if (!controller.signal.aborted) setLoadingAction("");
      }
    }
  }

  // Último recurso: si el código no llega por ningún canal, el usuario NO queda
  // atascado — abre un ticket de ayuda de acceso para que un asesor lo valide.
  async function requestAccessHelp() {
    setError("");
    setNotice("");
    const normalizedEmail = validateEmail();
    if (!normalizedEmail) return;
    rememberReferralForEmail(normalizedEmail);

    setLoadingAction("access-help");
    try {
      const response = await fetch("/api/auth/access-help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          phone: accessHelpPhone,
          reason: accessHelpReason,
          note: "Solicitud desde el login: no recibe el código.",
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.ok) {
        setError(payload.error || "No se pudo registrar tu solicitud. Intenta de nuevo.");
        return;
      }
      setNotice(
        "Listo. Registramos tu solicitud y un asesor te va a contactar para validar tu acceso. No necesitas hacer nada más por ahora.",
      );
    } catch {
      setError("No se pudo conectar con el servicio de acceso.");
    } finally {
      setLoadingAction("");
    }
  }

  function renderAccessFallback() {
    if (emailOtpOnly) return null;
    return (
      <div className="space-y-2 border-t pt-3" style={{ borderColor: "var(--vp-border)" }}>
        <div
          className="space-y-2 rounded-lg p-3"
          style={{
            background: "var(--vp-surface-raised)",
            border: "1px solid var(--vp-accent, #ffc700)",
          }}
        >
          <label className="block text-[11px] font-black uppercase" htmlFor="access-help-phone" style={{ color: "var(--vp-muted)" }}>
            Teléfono actual para soporte
          </label>
          <input
            id="access-help-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={accessHelpPhone}
            onChange={(event) => setAccessHelpPhone(normalizeAccessHelpPhone(event.target.value))}
            placeholder="+57 300 123 4567"
            className="min-h-11 w-full rounded-lg px-3 text-sm font-semibold outline-none"
            style={{
              color: "var(--vp-text)",
              background: "var(--vp-surface-raised)",
              border: "1px solid var(--vp-border)",
            }}
          />
          <button
            type="button"
            disabled={isLoading}
            onClick={requestAccessHelp}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-center text-xs font-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              color: "var(--vp-on-accent)",
              background: "var(--vp-accent, #ffc700)",
              border: "1px solid var(--vp-accent, #ffc700)",
            }}
          >
            {loadingAction === "access-help" ? <Loader2 className="animate-spin" size={15} /> : <LifeBuoy size={15} />}
            {loadingAction === "access-help" ? "Registrando solicitud…" : "Sigo sin recibir el código — solicitar ayuda"}
          </button>
        </div>
      </div>
    );
  }

  async function confirmLoginCode(event) {
    event.preventDefault();
    if (otpSubmittingRef.current || isLoading || (emailOtpOnly && confirmationCooldown.active)) return;
    setError("");
    setNotice("");
    const normalizedEmail = codeRecipient;
    if (!normalizedEmail) return;
    rememberReferralForEmail(normalizedEmail);

    const code = loginCode.replace(/[\s-]+/g, "").trim();
    if (!(emailOtpOnly ? /^\d{6}$/ : /^[a-zA-Z0-9]{4,12}$/).test(code)) {
      setError("Ingresa el código que recibiste por correo.");
      return;
    }

    otpSubmittingRef.current = true;
    const controller = new AbortController();
    otpRequestRef.current = controller;
    setLoadingAction("code-confirm");
    const deadline = browserRequestDeadline(controller.signal, otpTimeoutMs('confirm'));
    try {
      const contract = emailOtpOnly ? otpRequest(authMode, 'confirm', normalizedEmail, code) : {
        path: "/api/auth/cognito/code-login/confirm", body: { email: normalizedEmail, code },
      };
      const response = await fetch(contract.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin", cache: "no-store", redirect: "error",
        signal: deadline.signal,
        body: JSON.stringify(contract.body),
      });
      const payload = await response.json().catch(() => ({}));
      if (controller.signal.aborted || otpRequestRef.current !== controller) return;

      if (emailOtpOnly) {
        if (!response.ok || !verifiedEmailSignIn(payload, normalizedEmail)) {
          if (response.status === 429) confirmationCooldown.start(otpConfirmationRetrySeconds(response));
          setError(otpFailureMessage(response.ok ? 502 : response.status, 'confirm', payload?.code));
          return;
        }
        // Fresh native proof permits the handoff, not network permissions.
        await showVerifiedLogin(normalizedEmail);
        return;
      }

      if (!response.ok || !payload.ok) {
        if (payload.needsNewCode) {
          setLoginCode("");
          setCodeStep("request");
          setNotice(payload.error || "El código anterior expiró o fue reemplazado. Solicita uno nuevo para continuar.");
          return;
        }
        setError(payload.error || "No se pudo validar el código.");
        return;
      }

      persistLocalUser(payload.user);
      window.location.assign(payload.redirectTo || "/dashboard");
    } catch {
      if (!controller.signal.aborted && otpRequestRef.current === controller) setError("No se pudo conectar con el servicio de acceso.");
    } finally {
      deadline.dispose();
      if (otpRequestRef.current === controller) {
        otpRequestRef.current = null;
        otpSubmittingRef.current = false;
        if (!controller.signal.aborted) setLoadingAction("");
      }
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    const normalizedEmail = validateEmail();
    if (!normalizedEmail) return;
    rememberReferralForEmail(normalizedEmail);

    if (!password) {
      setError("Ingresa tu contraseña.");
      return;
    }

    setLoadingAction("password");
    try {
      const response = await fetch("/api/auth/cognito/password-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.ok) {
        if (payload.needsConfirm) {
          window.location.assign(authPathWithReferral("/register", normalizedEmail, { resume: "1" }));
          return;
        }
        setError(payload.error || "No se pudo iniciar sesión.");
        return;
      }

      persistLocalUser(payload.user);
      window.location.assign(payload.redirectTo || "/dashboard");
    } catch {
      setError("No se pudo conectar con el servicio de acceso.");
    } finally {
      setLoadingAction("");
    }
  }

  async function requestPasswordResetCode(event, { resend = false } = {}) {
    event?.preventDefault();
    if (otpSubmittingRef.current || isLoading || resetCooldown.active) return;
    setError("");
    setNotice("");
    const normalizedEmail = validateEmail();
    if (!normalizedEmail) return;

    otpSubmittingRef.current = true;
    setLoadingAction("reset-request");
    try {
      const response = await fetch("/api/auth/cognito/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.ok) {
        if (response.status === 429) resetCooldown.start(payload.retryAfterSec || 60);
        if (payload.needsConfirm) {
          window.location.assign(authPathWithReferral("/register", normalizedEmail, { resume: "1" }));
          return;
        }
        setError(payload.error || "No se pudo iniciar la recuperación.");
        return;
      }

      setResetStep("confirm");
      resetCooldown.start();
      setNotice(
        resend
          ? `Te reenviamos el código a ${normalizedEmail}. Revisa tu correo (y spam).`
          : "Te enviamos un código por correo (revisa también spam). Ingresa el código y tu nueva contraseña.",
      );
    } catch {
      setError("No se pudo conectar con el servicio de acceso.");
    } finally {
      otpSubmittingRef.current = false;
      setLoadingAction("");
    }
  }

  async function handleResetSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    const normalizedEmail = validateEmail();
    if (!normalizedEmail) return;

    if (!resetCode.trim()) {
      setError("Ingresa el código que recibiste por correo.");
      return;
    }
    if (!isValidPassword(password)) {
      setError("La nueva contraseña no cumple todos los requisitos (revisa la lista bajo el campo).");
      return;
    }

    setLoadingAction("reset-confirm");
    try {
      const response = await fetch("/api/auth/cognito/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, code: resetCode.trim(), password }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.ok) {
        setError(payload.error || "No se pudo restablecer la contraseña.");
        return;
      }

      setMode("password");
      setResetStep("request");
      setResetCode("");
      setPassword("");
      setNotice("Contraseña actualizada. Inicia sesión con tu nueva contraseña.");
    } catch {
      setError("No se pudo conectar con el servicio de acceso.");
    } finally {
      setLoadingAction("");
    }
  }

  if (verifiedLogin) {
    return (
      <div className="space-y-4" aria-busy={isLoading || checkingAccess}>
        <Message tone="info">
          <h2 ref={verifiedTitle} tabIndex={-1} className="text-base font-bold">Correo verificado correctamente</h2>
          <p className="mt-2 break-words font-normal">Confirmamos el correo {verifiedLogin.email}. Puedes continuar sin repetir este paso.</p>
        </Message>
        {error ? <Message tone="info">{error}</Message> : null}
        {notice ? <Message tone="info">{notice}</Message> : null}
        <p className="text-sm leading-6" style={{ color: "var(--vp-muted)" }}>
          {checkingAccess ? 'Comprobando la sesión de este navegador…' : 'El servidor comprobará tu sesión y tu acceso a la red al abrir el panel.'}
        </p>
        <p className="text-sm leading-6" style={{ color: "var(--vp-muted)" }}>Si no se abre automáticamente, usa «Continuar al panel». No necesitas registrarte de nuevo ni cambiar tu correo; esto no modifica tu cuenta ni tu posición en la red.</p>
        <a href="/dashboard" className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[var(--vp-accent)] bg-[var(--vp-accent)] px-4 py-3 text-center text-base font-bold text-[var(--vp-shell)] transition hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--vp-accent)]">
          <ArrowRight size={16} aria-hidden="true" />Continuar al panel
        </a>
        <a href="/login" className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[var(--vp-border)] bg-[var(--vp-surface-raised)] px-3 text-center text-xs font-black text-[var(--vp-text-soft)] transition hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--vp-accent)]">
          <ArrowLeft size={15} aria-hidden="true" />Volver al acceso
        </a>
      </div>
    );
  }

  return (
    <div className="auth-login-stack space-y-4">
      {(authMessage || error) && (
        <Message tone={error ? "danger" : authMessage.tone}>
          {error || authMessage.text}
        </Message>
      )}

      {notice && !error && <Message tone="info">{notice}</Message>}

      <SocialLoginButtons enabledProviders={enabledSocialProviders} />

      {(mode === "code" || mode === "password") && (
        <div
          aria-label="Método de inicio de sesión"
          className="auth-mode-switcher grid grid-cols-2 gap-1 rounded-lg p-1"
          style={{ background: "var(--vp-surface-raised)", border: "1px solid var(--vp-border)" }}
        >
          <ModeButton disabled={isLoading} active={mode === "code"} onClick={() => switchMode("code")}>
            Código
          </ModeButton>
          <ModeButton disabled={isLoading} active={mode === "password"} onClick={() => switchMode("password")}>
            Contraseña
          </ModeButton>
        </div>
      )}

      {mode === "code" ? (
        codeStep === "request" ? (
          <form className="auth-code-form space-y-4" onSubmit={requestLoginCode}>
            <p className="auth-code-intro text-sm leading-6" style={{ color: "var(--vp-muted)" }}>
              {emailOtpOnly ? 'Usa el correo original de tu cuenta. Puedes entrar con un código, aunque no tengas contraseña.' : 'Recibe un código en tu correo para entrar a tu cuenta.'}
            </p>
            <EmailField email={email} readOnly={isLoading} setEmail={setEmail} onClearError={() => setError("")} />

            <PrimaryButton disabled={isLoading || codeCooldown.active} loading={loadingAction === "code-request"} icon={<ShieldCheck size={16} />}>
              {codeCooldown.active ? codeCooldown.label : "Enviar código"}
            </PrimaryButton>

            {emailOtpOnly ? <details className="auth-code-help rounded-lg border border-[var(--vp-border)] px-3">
              <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold" style={{ color: 'var(--vp-text)' }}>Límites y ayuda para entrar</summary>
              <p className="pb-3 text-sm leading-6" style={{ color: 'var(--vp-muted)' }}>El código de acceso tiene 6 dígitos, vence en 5 minutos y permite hasta 3 intentos. Es distinto del código de registro o recuperación. Por seguridad, espera al menos 5 minutos entre envíos al mismo correo y respeta el contador. No compartas el código.</p>
              <p className="pb-3 text-sm leading-6" style={{ color: 'var(--vp-muted)' }}>En iPhone, vuelve a esta misma pestaña después de leer el correo. Si abriste el portal dentro de WhatsApp u otra aplicación, ábrelo en Safari antes de solicitar el código; las sesiones no se comparten entre navegadores.</p>
            </details> : null}

            <p className="auth-code-registration-note text-center text-xs" style={{ color: "var(--vp-muted)" }}>
              ¿Primera vez? Necesitas una cuenta para recibir el código.
            </p>
            <div className="auth-code-registration-action">
              <SecondaryButton
                disabled={isLoading}
                onClick={() =>
                  window.location.assign(registrationUrl(email, referralCode, preferredSide))
                }
                icon={<UserPlus size={15} />}
              >
                Crear cuenta nueva
              </SecondaryButton>
            </div>
            {emailOtpOnly ? <a className="auth-code-recovery-link" href="/forgot-password">Crear o cambiar contraseña</a> : null}
            {showAccessFallback && renderAccessFallback()}
          </form>
        ) : (
          <form className="space-y-4" onSubmit={confirmLoginCode}>
            <EmailField email={codeRecipient} readOnly setEmail={setEmail} onClearError={() => setError("")} />
            <CodeField
              id="login-code"
              label="Código de acceso"
              value={loginCode}
              codeLength={emailOtpOnly ? 6 : 12}
              helper={emailOtpOnly ? 'Usa el código de acceso más reciente de 6 dígitos. Vence en 5 minutos y permite hasta 3 intentos; no uses un código de registro o recuperación ni lo compartas. Para pedir otro, espera a que termine el contador.' : ''}
              autoFocus
              onChange={(value) => {
                setLoginCode(value);
                setError("");
              }}
            />
            <PrimaryButton disabled={isLoading || (emailOtpOnly && confirmationCooldown.active)} loading={loadingAction === "code-confirm"} icon={<ArrowRight size={16} />}>
              {emailOtpOnly && confirmationCooldown.active ? confirmationCooldown.label.replace(/^Reenviar/, 'Validar de nuevo') : 'Entrar con código'}
            </PrimaryButton>

            <p className="text-sm leading-6" style={{ color: 'var(--vp-muted)' }}>Después de leer el correo, vuelve a esta misma pestaña para escribir el código y abrir tu panel.</p>
            <DeliveryHint email={codeRecipient} />

            <div className="grid grid-cols-2 gap-2">
              <SecondaryButton disabled={isLoading} onClick={() => switchMode("code")} icon={<ArrowLeft size={15} />}>
                Cambiar email
              </SecondaryButton>
              <SecondaryButton
                disabled={isLoading || codeCooldown.active}
                onClick={(e) => requestLoginCode(e, { resend: true })}
                icon={<KeyRound size={15} />}
              >
                {codeCooldown.active ? codeCooldown.label : "Reenviar"}
              </SecondaryButton>
            </div>

            {/* La ayuda de acceso nunca cambia el canal de autenticación. */}
            {renderAccessFallback()}
          </form>
        )
      ) : mode === "password" && emailOtpOnly ? (
        <BetterAuthPasswordLogin email={email} setEmail={setEmail} onBusy={busy => setLoadingAction(busy ? 'password' : '')}
          onError={setError} onNotice={setNotice} rememberReferral={rememberReferralForEmail}
          onVerified={showVerifiedLogin}
          onRegistrationRequired={continueToRegistration}
          onUseCode={() => switchMode("code")}
          registrationHref={registrationUrl(email, referralCode, preferredSide, true)} />
      ) : mode === "password" ? (
        <form className="auth-password-form" onSubmit={handlePasswordSubmit}>
          <EmailField email={email} setEmail={setEmail} onClearError={() => setError("")} />
          <PasswordField
            id="password"
            label="Contraseña"
            value={password}
            showPassword={showPassword}
            autoComplete="current-password"
            onChange={(value) => {
              setPassword(value);
              setError("");
            }}
            onToggle={() => setShowPassword((current) => !current)}
          />

          <div className="auth-password-links">
            <button type="button" onClick={() => switchMode("code")}>Entrar con código</button>
            <button type="button" onClick={() => switchMode("reset")}>¿Olvidaste tu contraseña?</button>
          </div>
          <PrimaryButton disabled={isLoading} loading={loadingAction === "password"} icon={<ArrowRight size={16} />}>
            Iniciar sesión
          </PrimaryButton>
        </form>
      ) : resetStep === "request" ? (
        <form className="space-y-4" onSubmit={requestPasswordResetCode}>
          <p className="text-sm leading-6" style={{ color: "var(--vp-muted)" }}>
            Te enviaremos un código por correo para restablecer tu contraseña.
          </p>
          <EmailField email={email} setEmail={setEmail} onClearError={() => setError("")} />

          <PrimaryButton disabled={isLoading || resetCooldown.active} loading={loadingAction === "reset-request"} icon={<KeyRound size={16} />}>
            {resetCooldown.active ? resetCooldown.label : "Enviar código"}
          </PrimaryButton>
          <SecondaryButton disabled={isLoading} onClick={() => switchMode("password")} icon={<ArrowLeft size={15} />}>
            Volver a iniciar sesión
          </SecondaryButton>
        </form>
      ) : (
        <form className="space-y-4" onSubmit={handleResetSubmit}>
          <EmailField email={email} setEmail={setEmail} onClearError={() => setError("")} />
          <CodeField
            id="reset-code"
            label="Código de verificación"
            value={resetCode}
            autoFocus
            onChange={(value) => {
              setResetCode(value.replace(/[\s-]+/g, ""));
              setError("");
            }}
          />
          <DeliveryHint email={email} />
          <PasswordField
            id="new-password"
            label="Nueva contraseña"
            value={password}
            showPassword={showPassword}
            autoComplete="new-password"
            onChange={(value) => {
              setPassword(value);
              setError("");
            }}
            onToggle={() => setShowPassword((current) => !current)}
          />
          <PasswordChecklist password={password} />

          <PrimaryButton disabled={isLoading} loading={loadingAction === "reset-confirm"} icon={<ArrowRight size={16} />}>
            Restablecer contraseña
          </PrimaryButton>

          <div className="grid grid-cols-2 gap-2">
            <SecondaryButton disabled={isLoading} onClick={() => switchMode("password")} icon={<ArrowLeft size={15} />}>
              Volver
            </SecondaryButton>
            <SecondaryButton
              disabled={isLoading || resetCooldown.active}
              onClick={(e) => requestPasswordResetCode(e, { resend: true })}
              icon={<KeyRound size={15} />}
            >
              {resetCooldown.active ? resetCooldown.label : "Reenviar código"}
            </SecondaryButton>
          </div>
        </form>
      )}
      {emailOtpOnly ? <div className="auth-login-guidance space-y-2 border-t pt-4 text-sm leading-6" style={{ borderColor: "var(--vp-border)", color: "var(--vp-muted)" }}>
        <p className="m-0">Si ya pertenecías a la red, solicita un código con tu correo original. Tu cuenta y posición en la red se conservan; si tu vinculación requiere revisión, debe aprobarse antes de entrar. Si todavía no tienes un acceso, utiliza Registro.</p>
        <a className="font-bold no-underline" style={{ color: "var(--vp-text-soft)" }} href={registrationUrl(codeStep === "confirm" ? codeRecipient : email, referralCode, preferredSide)}>Crear acceso en Registro</a>
      </div> : null}
    </div>
  );
}

// Checklist en vivo de la política de contraseña (misma que el registro).
function PasswordChecklist({ password }) {
  if (!password) return null;
  const { results } = checkPassword(password);
  return (
    <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2" aria-label="Requisitos de la contraseña">
      {results.map((rule) => (
        <li
          key={rule.key}
          className="flex items-center gap-1.5 text-xs font-semibold"
          style={{ color: rule.met ? "var(--vp-accent)" : "var(--vp-subtle)" }}
        >
          <span
            className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
            style={{
              background: rule.met ? "var(--vp-accent-muted)" : "transparent",
              border: `1px solid ${rule.met ? "var(--vp-accent-border)" : "var(--vp-border)"}`,
            }}
          >
            {rule.met ? <Check size={11} /> : null}
          </span>
          {rule.label}
        </li>
      ))}
    </ul>
  );
}

function Message({ tone, children }) {
  const isDanger = tone === "danger";

  return (
    <div
      role={isDanger ? 'alert' : 'status'}
      aria-live={isDanger ? 'assertive' : 'polite'}
      aria-atomic="true"
      className="rounded-lg px-4 py-3 text-sm font-semibold"
      style={{
        color: isDanger ? "var(--vp-danger)" : "var(--vp-accent)",
        background: isDanger ? "var(--vp-danger-muted)" : "var(--vp-accent-muted)",
        border: `1px solid ${isDanger ? "var(--vp-danger-border)" : "var(--vp-accent-border)"}`,
      }}
    >
      {children}
    </div>
  );
}

function EmailField({ email, setEmail, onClearError, readOnly = false }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold" htmlFor="email" style={{ color: "var(--vp-text)" }}>
        Email
      </label>
      <div className="relative">
        <Mail
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2"
          size={17}
          style={{ color: "var(--vp-muted)" }}
        />
        <input
          id="email"
          type="email"
          value={email}
          readOnly={readOnly}
          onChange={(event) => {
            setEmail(event.target.value);
            onClearError();
          }}
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          inputMode="email"
          placeholder="tu@email.com"
          className="auth-email-input min-h-12 min-w-0 w-full rounded-lg py-3 pl-11 pr-4 text-base font-semibold outline-none"
          style={{
            color: "var(--vp-text)",
            background: "var(--vp-surface-raised)",
            border: "1px solid var(--vp-border)",
          }}
        />
      </div>
      {!readOnly && suggestEmailFix(email) && (
        <button
          type="button"
          onClick={() => {
            setEmail(suggestEmailFix(email));
            onClearError();
          }}
          className="mt-2 min-h-11 text-left text-sm font-bold transition hover:opacity-80"
          style={{ color: "var(--vp-amber, #d97706)" }}
        >
          ¿Quisiste decir {suggestEmailFix(email)}? Toca aquí para corregirlo.
        </button>
      )}
    </div>
  );
}

function PasswordField({ id, label, value, showPassword, autoComplete, onChange, onToggle }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold" htmlFor={id} style={{ color: "var(--vp-text)" }}>
        {label}
      </label>
      <div className="relative">
        <LockKeyhole
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2"
          size={17}
          style={{ color: "var(--vp-muted)" }}
        />
        <input
          id={id}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          className="min-h-12 min-w-0 w-full rounded-lg py-3 pl-11 pr-14 text-base font-semibold outline-none"
          style={{
            color: "var(--vp-text)",
            background: "var(--vp-surface-raised)",
            border: "1px solid var(--vp-border)",
          }}
        />
        <button
          type="button"
          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          onClick={onToggle}
          className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md"
          style={{ color: "var(--vp-muted)" }}
        >
          {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </div>
  );
}

function CodeField({ id, label, value, onChange, autoFocus = false, codeLength = 12, helper = '' }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold" htmlFor={id} style={{ color: "var(--vp-text)" }}>
        {label}
      </label>
      <input
        id={id}
        name={id}
        inputMode="numeric"
        autoComplete="one-time-code"
        autoCapitalize="none"
        spellCheck={false}
        aria-describedby={helper ? `${id}-helper` : undefined}
        autoFocus={autoFocus}
        maxLength={codeLength}
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/[\s-]+/g, "").slice(0, codeLength))}
        placeholder={codeLength === 6 ? "······" : "········"}
        className="min-h-12 w-full rounded-lg px-4 text-base font-semibold outline-none"
        style={{
          color: "var(--vp-text)",
          background: "var(--vp-surface-raised)",
          border: "1px solid var(--vp-border)",
        }}
      />
      {helper ? <p id={`${id}-helper`} className="mt-2 text-xs leading-5" style={{ color: 'var(--vp-muted)' }}>{helper}</p> : null}
    </div>
  );
}

// Pista de entregabilidad bajo el campo de código: recuerda revisar spam y, si
// el correo es de Microsoft (que suele filtrar los envíos de Cognito/SES),
// avisa explícitamente — es la causa #1 de "el código no llega".
function DeliveryHint({ email }) {
  const microsoft = isMicrosoftEmail(email);
  return (
    <p className="text-xs leading-5" style={{ color: microsoft ? "var(--vp-amber, #d97706)" : "var(--vp-subtle)" }}>
      {microsoft
        ? "Tu correo es de Microsoft (Hotmail/Outlook/Live): a veces demora o cae en «Correo no deseado». Revisa esa carpeta y conserva el correo original de tu cuenta. Si no llega, espera antes de reenviar: deja que termine el contador o contacta al soporte. No compartas el código."
        : "¿No llega? Revisa la carpeta de spam / correo no deseado y el correo original que escribiste. Espera a que termine el contador antes de solicitar otro código. No lo compartas."}
    </p>
  );
}

function normalizeAccessHelpPhone(value) {
  return value.replace(/[^\d+().\s-]/g, "").slice(0, 40);
}

function PrimaryButton({ disabled, loading, icon, children }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="auth-primary-button flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60"
      style={{
        color: "var(--vp-on-action)",
        background: "var(--vp-action)",
        border: "1px solid var(--vp-action-border)",
      }}
    >
      {loading ? <Loader2 className="animate-spin" size={16} /> : icon}
      {children}
    </button>
  );
}

function SecondaryButton({ disabled, onClick, icon, children, variant = "default", className = "" }) {
  const accent = variant === "accent";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-center text-xs font-black transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      style={{
        color: accent ? "var(--vp-on-accent)" : "var(--vp-text)",
        background: accent ? "var(--vp-accent)" : "var(--vp-surface-raised)",
        border: accent ? "1px solid var(--vp-accent-strong)" : "1px solid var(--vp-border)",
      }}
    >
      {icon}
      {children}
    </button>
  );
}

function ModeButton({ active, onClick, children, disabled = false }) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active}
      onClick={onClick}
      className="min-h-11 rounded-md px-3 py-2 text-sm font-bold leading-5 transition"
      style={{
        color: active ? "var(--vp-on-selected)" : "var(--vp-link)",
        background: active ? "var(--vp-selected)" : "transparent",
        border: active ? "1px solid var(--vp-accent-border)" : "1px solid transparent",
      }}
    >
      {children}
    </button>
  );
}

function getAuthStateMessage(authState) {
  if (!authState) return null;
  return AUTH_STATE_MESSAGES[authState] || {
    tone: "danger",
    text: `No se pudo completar el acceso: ${authState}.`,
  };
}

function normalizeMode(mode) {
  return mode === "password" || mode === "reset" ? mode : "code";
}

function persistLocalUser(user) {
  if (!user || typeof window === "undefined") return;
  const userId = user.id || `member-${Date.now()}`;

  localStorage.setItem("user_auth", "true");
  localStorage.setItem("user_id", userId);
  localStorage.setItem("user_role", user.role || "user");
  localStorage.setItem("selected_user", userId);
  localStorage.setItem("selected_node", userId);
  localStorage.setItem("user_data", JSON.stringify({ ...user, id: userId }));
}
