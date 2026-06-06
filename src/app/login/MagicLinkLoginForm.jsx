"use client";

import Link from "next/link";
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, Mail, PlayCircle } from "lucide-react";
import { useState } from "react";

export default function MagicLinkLoginForm({ authState, cognitoConfigured, initialEmail = "" }) {
  const [mode, setMode] = useState("link");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  function handleMagicLinkSubmit(event) {
    event.preventDefault();
    const normalizedEmail = validateEmail();
    if (!normalizedEmail) return;

    window.location.assign(`/api/auth/cognito/login?login_hint=${encodeURIComponent(normalizedEmail)}`);
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    setError("");
    const normalizedEmail = validateEmail();
    if (!normalizedEmail) return;

    if (!password) {
      setError("Ingresa tu contraseña.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/cognito/password-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.ok) {
        setError(payload.error || "No se pudo iniciar sesión.");
        setLoading(false);
        return;
      }

      persistLocalUser(payload.user);
      window.location.assign(payload.redirectTo || "/dashboard");
    } catch {
      setError("No se pudo conectar con el servicio de acceso.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {(authState || error) && (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{
            color: "var(--vp-danger)",
            background: "var(--vp-danger-muted)",
            border: "1px solid var(--vp-danger-border)",
          }}
        >
          {error || `No se pudo completar el acceso: ${authState}.`}
        </div>
      )}

      <div
        className="grid grid-cols-2 gap-1 rounded-lg p-1"
        style={{ background: "var(--vp-surface-raised)", border: "1px solid var(--vp-border)" }}
      >
        <ModeButton active={mode === "link"} onClick={() => setMode("link")}>
          Enlace
        </ModeButton>
        <ModeButton active={mode === "password"} onClick={() => setMode("password")}>
          Contraseña
        </ModeButton>
      </div>

      {mode === "link" ? (
        <form className="space-y-4" onSubmit={handleMagicLinkSubmit}>
          <EmailField
            email={email}
            setEmail={setEmail}
            onClearError={() => setError("")}
          />

          <button
            type="submit"
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-black transition"
            style={{
              color: "var(--vp-shell)",
              background: "var(--vp-accent)",
              border: "1px solid var(--vp-accent-strong)",
            }}
          >
            Enviar enlace
            <ArrowRight size={16} />
          </button>
        </form>
      ) : (
        <form className="space-y-4" onSubmit={handlePasswordSubmit}>
          <EmailField
            email={email}
            setEmail={setEmail}
            onClearError={() => setError("")}
          />

          <div>
            <label className="mb-2 block text-sm font-bold" htmlFor="password" style={{ color: "var(--vp-text)" }}>
              Contraseña
            </label>
            <div className="relative">
              <LockKeyhole
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2"
                size={17}
                style={{ color: "var(--vp-muted)" }}
              />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
                autoComplete="current-password"
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
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md"
                style={{ color: "var(--vp-muted)" }}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              color: "var(--vp-shell)",
              background: "var(--vp-accent)",
              border: "1px solid var(--vp-accent-strong)",
            }}
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <ArrowRight size={16} />}
            Entrar con contraseña
          </button>
        </form>
      )}

      {!cognitoConfigured && (
        <Link
          href="/dashboard"
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold transition"
          style={{
            color: "var(--vp-text-soft)",
            background: "var(--vp-surface-raised)",
            border: "1px solid var(--vp-border)",
          }}
        >
          <PlayCircle size={17} />
          Modo demo local
        </Link>
      )}
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

function persistLocalUser(user) {
  if (!user) return;
  const userId = user.id || `member-${Date.now()}`;

  localStorage.setItem("user_auth", "true");
  localStorage.setItem("user_id", userId);
  localStorage.setItem("user_role", user.role || "user");
  localStorage.setItem("selected_user", userId);
  localStorage.setItem("selected_node", userId);
  localStorage.setItem("user_data", JSON.stringify({ ...user, id: userId }));
}
