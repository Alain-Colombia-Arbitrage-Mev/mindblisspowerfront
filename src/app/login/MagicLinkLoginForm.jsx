"use client";

import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";

const AUTH_STATE_MESSAGES = {
  "invalid-email": {
    tone: "danger",
    text: "Ingresa un email válido para continuar.",
  },
  "use-designed-login": {
    tone: "info",
    text: "Usa esta pantalla para entrar. Cognito queda conectado por API sin abrir ventanas externas.",
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
};

export default function MagicLinkLoginForm({ authState, initialEmail = "", initialMode = "code" }) {
  const [mode, setMode] = useState(() => normalizeMode(initialMode));
  const [codeStep, setCodeStep] = useState("request");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginCode, setLoginCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loadingAction, setLoadingAction] = useState("");
  const [resetStep, setResetStep] = useState("request");
  const [resetCode, setResetCode] = useState("");

  const authMessage = getAuthStateMessage(authState);
  const isLoading = Boolean(loadingAction);

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

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
    setNotice("");

    if (nextMode === "code") {
      setCodeStep("request");
      setLoginCode("");
    }

    if (nextMode === "reset") {
      setResetStep("request");
      setResetCode("");
    }
  }

  async function requestLoginCode(event) {
    event?.preventDefault();
    setError("");
    setNotice("");
    const normalizedEmail = validateEmail();
    if (!normalizedEmail) return;

    setLoadingAction("code-request");
    try {
      const response = await fetch("/api/auth/cognito/code-login/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.ok) {
        setError(payload.error || "No se pudo enviar el código de acceso.");
        return;
      }

      if (payload.user) {
        persistLocalUser(payload.user);
        window.location.assign(payload.redirectTo || "/dashboard");
        return;
      }

      setCodeStep("confirm");
      setLoginCode("");
      setNotice(payload.message || "Te enviamos un código por correo. Escríbelo para entrar.");
    } catch {
      setError("No se pudo conectar con el servicio de acceso.");
    } finally {
      setLoadingAction("");
    }
  }

  async function confirmLoginCode(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    const normalizedEmail = validateEmail();
    if (!normalizedEmail) return;

    const code = loginCode.trim();
    if (!/^[a-zA-Z0-9]{4,12}$/.test(code)) {
      setError("Ingresa el código que recibiste por correo.");
      return;
    }

    setLoadingAction("code-confirm");
    try {
      const response = await fetch("/api/auth/cognito/code-login/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, code }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.ok) {
        setError(payload.error || "No se pudo validar el código.");
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

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    const normalizedEmail = validateEmail();
    if (!normalizedEmail) return;

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

  async function requestPasswordResetCode(event) {
    event?.preventDefault();
    setError("");
    setNotice("");
    const normalizedEmail = validateEmail();
    if (!normalizedEmail) return;

    setLoadingAction("reset-request");
    try {
      const response = await fetch("/api/auth/cognito/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.ok) {
        setError(payload.error || "No se pudo iniciar la recuperación.");
        return;
      }

      setResetStep("confirm");
      setNotice("Te enviamos un código por correo. Ingresa el código y tu nueva contraseña.");
    } catch {
      setError("No se pudo conectar con el servicio de acceso.");
    } finally {
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
    if (password.length < 8) {
      setError("La nueva contraseña debe tener mínimo 8 caracteres.");
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

  return (
    <div className="space-y-4">
      {(authMessage || error) && (
        <Message tone={error ? "danger" : authMessage.tone}>
          {error || authMessage.text}
        </Message>
      )}

      {notice && !error && <Message tone="info">{notice}</Message>}

      {mode !== "reset" && (
        <div
          className="grid grid-cols-2 gap-1 rounded-lg p-1"
          style={{ background: "var(--vp-surface-raised)", border: "1px solid var(--vp-border)" }}
        >
          <ModeButton active={mode === "code"} onClick={() => switchMode("code")}>
            Código al correo
          </ModeButton>
          <ModeButton active={mode === "password"} onClick={() => switchMode("password")}>
            Contraseña
          </ModeButton>
        </div>
      )}

      {mode === "code" ? (
        codeStep === "request" ? (
          <form className="space-y-4" onSubmit={requestLoginCode}>
            <p className="text-sm leading-6" style={{ color: "var(--vp-muted)" }}>
              Recibe un código de acceso en tu correo y entra sin abrir pantallas externas de Cognito.
            </p>
            <EmailField email={email} setEmail={setEmail} onClearError={() => setError("")} />

            <PrimaryButton disabled={isLoading} loading={loadingAction === "code-request"} icon={<ShieldCheck size={16} />}>
              Enviar código
            </PrimaryButton>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={confirmLoginCode}>
            <EmailField email={email} setEmail={setEmail} onClearError={() => setError("")} />
            <CodeField
              id="login-code"
              label="Código de acceso"
              value={loginCode}
              onChange={(value) => {
                setLoginCode(value);
                setError("");
              }}
            />

            <PrimaryButton disabled={isLoading} loading={loadingAction === "code-confirm"} icon={<ArrowRight size={16} />}>
              Entrar con código
            </PrimaryButton>

            <div className="grid grid-cols-2 gap-2">
              <SecondaryButton disabled={isLoading} onClick={() => switchMode("code")} icon={<ArrowLeft size={15} />}>
                Cambiar email
              </SecondaryButton>
              <SecondaryButton disabled={isLoading} onClick={requestLoginCode} icon={<KeyRound size={15} />}>
                Reenviar
              </SecondaryButton>
            </div>
          </form>
        )
      ) : mode === "password" ? (
        <form className="space-y-4" onSubmit={handlePasswordSubmit}>
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

          <PrimaryButton disabled={isLoading} loading={loadingAction === "password"} icon={<ArrowRight size={16} />}>
            Entrar con contraseña
          </PrimaryButton>

          <button
            type="button"
            onClick={() => switchMode("reset")}
            className="block w-full text-center text-sm font-bold transition hover:opacity-80"
            style={{ color: "var(--vp-accent)" }}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </form>
      ) : resetStep === "request" ? (
        <form className="space-y-4" onSubmit={requestPasswordResetCode}>
          <p className="text-sm leading-6" style={{ color: "var(--vp-muted)" }}>
            Te enviaremos un código por correo para restablecer tu contraseña.
          </p>
          <EmailField email={email} setEmail={setEmail} onClearError={() => setError("")} />

          <PrimaryButton disabled={isLoading} loading={loadingAction === "reset-request"} icon={<KeyRound size={16} />}>
            Enviar código
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
            onChange={(value) => {
              setResetCode(value);
              setError("");
            }}
          />
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

          <PrimaryButton disabled={isLoading} loading={loadingAction === "reset-confirm"} icon={<ArrowRight size={16} />}>
            Restablecer contraseña
          </PrimaryButton>

          <div className="grid grid-cols-2 gap-2">
            <SecondaryButton disabled={isLoading} onClick={() => switchMode("password")} icon={<ArrowLeft size={15} />}>
              Volver
            </SecondaryButton>
            <SecondaryButton disabled={isLoading} onClick={requestPasswordResetCode} icon={<KeyRound size={15} />}>
              Reenviar código
            </SecondaryButton>
          </div>
        </form>
      )}
    </div>
  );
}

function Message({ tone, children }) {
  const isDanger = tone === "danger";

  return (
    <div
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

function EmailField({ email, setEmail, onClearError }) {
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
          onChange={(event) => {
            setEmail(event.target.value);
            onClearError();
          }}
          autoComplete="email"
          placeholder="nombre@correo.com"
          className="min-h-12 w-full rounded-lg py-3 pl-11 pr-4 text-sm font-semibold outline-none"
          style={{
            color: "var(--vp-text)",
            background: "var(--vp-surface-raised)",
            border: "1px solid var(--vp-border)",
          }}
        />
      </div>
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
          className="min-h-12 w-full rounded-lg py-3 pl-11 pr-12 text-sm font-semibold outline-none"
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
          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md"
          style={{ color: "var(--vp-muted)" }}
        >
          {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </div>
  );
}

function CodeField({ id, label, value, onChange }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold" htmlFor={id} style={{ color: "var(--vp-text)" }}>
        {label}
      </label>
      <input
        id={id}
        inputMode="numeric"
        autoComplete="one-time-code"
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\s+/g, ""))}
        placeholder="123456"
        className="min-h-12 w-full rounded-lg px-4 text-sm font-semibold tracking-[0.3em] outline-none"
        style={{
          color: "var(--vp-text)",
          background: "var(--vp-surface-raised)",
          border: "1px solid var(--vp-border)",
        }}
      />
    </div>
  );
}

function PrimaryButton({ disabled, loading, icon, children }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60"
      style={{
        color: "var(--vp-shell)",
        background: "var(--vp-accent)",
        border: "1px solid var(--vp-accent-strong)",
      }}
    >
      {loading ? <Loader2 className="animate-spin" size={16} /> : icon}
      {children}
    </button>
  );
}

function SecondaryButton({ disabled, onClick, icon, children }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-xs font-black transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
      style={{
        color: "var(--vp-text-soft)",
        background: "var(--vp-surface-raised)",
        border: "1px solid var(--vp-border)",
      }}
    >
      {icon}
      {children}
    </button>
  );
}

function ModeButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className="min-h-10 rounded-md px-3 text-xs font-black transition"
      style={{
        color: active ? "var(--vp-accent)" : "var(--vp-muted)",
        background: active ? "var(--vp-accent-muted)" : "transparent",
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
