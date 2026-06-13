"use client";

import Link from "next/link";
import { ArrowRight, ClipboardCheck, Eye, EyeOff, Loader2, LogIn, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "../_components/AuthShell";

// Registro MÍNIMO: solo lo esencial para crear la cuenta. El resto del perfil
// (país, ciudad, documento, fecha, preferencias) se completa en el onboarding.
const initialForm = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  dialCode: "+57",
  phone: "",
  acceptsPrivacy: false,
};

// Códigos de país comunes (LatAm + US/ES). value = prefijo E.164.
const dialCodes = [
  ["+57", "🇨🇴 Colombia (+57)"],
  ["+52", "🇲🇽 México (+52)"],
  ["+1", "🇺🇸 EE.UU./Canadá (+1)"],
  ["+51", "🇵🇪 Perú (+51)"],
  ["+593", "🇪🇨 Ecuador (+593)"],
  ["+58", "🇻🇪 Venezuela (+58)"],
  ["+54", "🇦🇷 Argentina (+54)"],
  ["+56", "🇨🇱 Chile (+56)"],
  ["+591", "🇧🇴 Bolivia (+591)"],
  ["+507", "🇵🇦 Panamá (+507)"],
  ["+502", "🇬🇹 Guatemala (+502)"],
  ["+34", "🇪🇸 España (+34)"],
];

// Combina código de país + número local en E.164 (lo que acepta Cognito).
function composePhone(dialCode, local) {
  const digits = String(local || "").replace(/\D/g, "").replace(/^0+/, "");
  return `${dialCode}${digits}`;
}

const sideKpis = [
  { value: "1 min", label: "registro" },
  { value: "1", label: "perfil" },
  { value: "100%", label: "personal" },
];

function isValidE164(phone) {
  return /^\+[1-9]\d{7,14}$/.test(phone);
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmStep, setConfirmStep] = useState(false);
  const [confirmCode, setConfirmCode] = useState("");
  const [cognitoUsername, setCognitoUsername] = useState("");

  useEffect(() => {
    const stored = readStoredJson("mp_registration_draft");
    const legacyStored = readStoredJson("vp_registration_draft");
    setForm((current) => ({ ...current, ...legacyStored, ...stored }));
  }, []);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function validateForm() {
    const nextErrors = {};

    if (!form.fullName.trim()) nextErrors.fullName = "El nombre es requerido.";
    if (!form.email.trim()) {
      nextErrors.email = "El email es requerido.";
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      nextErrors.email = "Ingresa un email válido.";
    }
    if (form.password.length < 8) {
      nextErrors.password = "La contraseña debe tener mínimo 8 caracteres.";
    }
    if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = "Las contraseñas no coinciden.";
    }
    if (!form.phone.trim()) {
      nextErrors.phone = "El teléfono es requerido.";
    } else if (!isValidE164(composePhone(form.dialCode, form.phone))) {
      nextErrors.phone = "Número inválido. Ingresa solo el número (sin el código de país).";
    }
    if (!form.acceptsPrivacy) nextErrors.acceptsPrivacy = "Debes autorizar el tratamiento de datos.";

    return nextErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSuccess("");
    const nextErrors = validateForm();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    const draft = {
      fullName: form.fullName.trim(),
      email: form.email.trim().toLowerCase(),
      phone: composePhone(form.dialCode, form.phone),
      acceptsPrivacy: form.acceptsPrivacy,
      company: "Mindbliss Power",
      createdAt: new Date().toISOString(),
    };

    try {
      const response = await fetch("/api/auth/cognito/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          password: form.password,
        }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.ok) {
        setErrors({ form: payload.error || "No se pudo crear la cuenta." });
        setLoading(false);
        return;
      }

      localStorage.setItem("mp_registration_draft", JSON.stringify(draft));
      localStorage.setItem("vp_registration_draft", JSON.stringify(draft));

      if (payload.userConfirmed === false) {
        setCognitoUsername(payload.username || "");
        setConfirmStep(true);
        setSuccess("Cuenta creada. Te enviamos un código por correo — ingrésalo abajo para activar tu cuenta.");
        setLoading(false);
        return;
      }

      router.push("/onboarding?source=register");
    } catch {
      setErrors({ form: "No se pudo conectar con el servicio de registro." });
      setLoading(false);
    }
  }

  async function handleConfirm(event) {
    event.preventDefault();
    setErrors({});
    setSuccess("");

    if (!confirmCode.trim()) {
      setErrors({ form: "Ingresa el código que recibiste por correo." });
      return;
    }

    setLoading(true);
    const email = form.email.trim().toLowerCase();

    try {
      const response = await fetch("/api/auth/cognito/confirm-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username: cognitoUsername, code: confirmCode.trim() }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.ok) {
        setErrors({ form: payload.error || "No se pudo confirmar la cuenta." });
        setLoading(false);
        return;
      }

      // Cuenta confirmada → login automático con la contraseña del formulario.
      const loginResponse = await fetch("/api/auth/cognito/password-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: form.password }),
      });
      const loginPayload = await loginResponse.json().catch(() => ({}));

      if (loginResponse.ok && loginPayload.ok) {
        router.push("/onboarding?source=register");
        return;
      }

      router.push(`/login?email=${encodeURIComponent(email)}`);
    } catch {
      setErrors({ form: "No se pudo conectar con el servicio de registro." });
      setLoading(false);
    }
  }

  async function handleResendCode() {
    setErrors({});
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/cognito/confirm-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email.trim().toLowerCase(), username: cognitoUsername, resend: true }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.ok) {
        setErrors({ form: payload.error || "No se pudo reenviar el código." });
      } else {
        setSuccess("Código reenviado. Revisa tu correo.");
      }
    } catch {
      setErrors({ form: "No se pudo conectar con el servicio de registro." });
    }
    setLoading(false);
  }

  return (
    <AuthShell
      activePath="/register"
      eyebrow="Nuevo miembro"
      title="Bienvenido a Mindbliss Power."
      description="Crea tu perfil personal para que el equipo pueda identificarte, contactarte y preparar tu primera experiencia dentro de la empresa."
      sideKpis={sideKpis}
      visualSrc="/mindbliss/mindbliss-01.avif"
      visualAlt="Equipo Mindbliss creando una cuenta"
    >
      <section
        className="w-full rounded-xl p-6 sm:p-8"
        style={{
          background: "var(--vp-surface)",
          border: "1px solid var(--vp-border)",
          boxShadow: "var(--vp-shadow)",
        }}
      >
        <div className="mb-7 flex items-start gap-4">
          <div
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
            style={{
              background: "var(--vp-accent-muted)",
              border: "1px solid var(--vp-accent-border)",
              color: "var(--vp-accent)",
            }}
          >
            <UserPlus size={22} />
          </div>
          <div>
            <h2 className="auth-display text-2xl" style={{ color: "var(--vp-text)" }}>
              Crear cuenta
            </h2>
            <p className="mt-2 text-sm leading-6" style={{ color: "var(--vp-muted)" }}>
              Crea tu acceso y completa la información base para la bienvenida.
            </p>
          </div>
        </div>

        {confirmStep ? (
          <form className="space-y-5" onSubmit={handleConfirm}>
            {success && (
              <div
                className="rounded-lg px-4 py-3 text-sm font-semibold"
                style={{
                  color: "var(--vp-accent)",
                  background: "var(--vp-accent-muted)",
                  border: "1px solid var(--vp-accent-border)",
                }}
              >
                {success}
              </div>
            )}

            {errors.form && (
              <div
                className="rounded-lg px-4 py-3 text-sm font-semibold"
                style={{
                  color: "var(--vp-danger)",
                  background: "var(--vp-danger-muted)",
                  border: "1px solid var(--vp-danger-border)",
                }}
              >
                {errors.form}
              </div>
            )}

            <Field
              id="confirmCode"
              label={`Código enviado a ${form.email}`}
              value={confirmCode}
              onChange={(event) => setConfirmCode(event.target.value)}
              placeholder="123456"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
            />

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
              Confirmar cuenta
            </button>

            <button
              type="button"
              onClick={handleResendCode}
              disabled={loading}
              className="block w-full text-center text-sm font-bold transition hover:opacity-80 disabled:opacity-50"
              style={{ color: "var(--vp-muted)" }}
            >
              Reenviar código
            </button>
          </form>
        ) : (
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="fullName"
              label="Nombre completo"
              value={form.fullName}
              onChange={(event) => updateField("fullName", event.target.value)}
              error={errors.fullName}
              autoComplete="name"
              required
            />
            <Field
              id="email"
              label="Email"
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              error={errors.email}
              autoComplete="email"
              required
            />
            <PasswordField
              id="password"
              label="Contraseña"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              error={errors.password}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword((current) => !current)}
              autoComplete="new-password"
              required
            />
            <PasswordField
              id="confirmPassword"
              label="Confirmar contraseña"
              value={form.confirmPassword}
              onChange={(event) => updateField("confirmPassword", event.target.value)}
              error={errors.confirmPassword}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword((current) => !current)}
              autoComplete="new-password"
              required
            />
            <div>
              <label className="mb-2 block text-xs font-bold" htmlFor="phone" style={{ color: "var(--vp-muted)" }}>
                Teléfono
              </label>
              <div className="flex gap-2">
                <select
                  aria-label="Código de país"
                  value={form.dialCode}
                  onChange={(event) => updateField("dialCode", event.target.value)}
                  className="min-h-12 rounded-lg px-2 text-sm font-semibold outline-none"
                  style={{ color: "var(--vp-text)", background: "var(--vp-surface-raised)", border: "1px solid var(--vp-border)", maxWidth: 150 }}
                >
                  {dialCodes.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="300 123 4567"
                  className="min-h-12 w-full rounded-lg px-3 text-sm font-semibold outline-none"
                  style={{
                    color: "var(--vp-text)",
                    background: "var(--vp-surface-raised)",
                    border: errors.phone ? "1px solid var(--vp-danger)" : "1px solid var(--vp-border)",
                  }}
                />
              </div>
              {errors.phone ? (
                <p className="mt-2 text-xs font-semibold" style={{ color: "var(--vp-danger)" }}>{errors.phone}</p>
              ) : (
                <p className="mt-2 text-xs leading-5" style={{ color: "var(--vp-subtle)" }}>Solo el número, sin el código de país.</p>
              )}
            </div>
          </div>

          <CheckRow
            checked={form.acceptsPrivacy}
            onChange={(checked) => updateField("acceptsPrivacy", checked)}
            label="Autorizo a Mindbliss Power a usar estos datos para crear y gestionar mi perfil de miembro."
            error={errors.acceptsPrivacy}
          />

          {errors.form && (
            <div
              className="rounded-lg px-4 py-3 text-sm font-semibold"
              style={{
                color: "var(--vp-danger)",
                background: "var(--vp-danger-muted)",
                border: "1px solid var(--vp-danger-border)",
              }}
            >
              {errors.form}
            </div>
          )}

          {success && (
            <div
              className="rounded-lg px-4 py-3 text-sm font-semibold"
              style={{
                color: "var(--vp-accent)",
                background: "var(--vp-accent-muted)",
                border: "1px solid var(--vp-accent-border)",
              }}
            >
              {success}
            </div>
          )}

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
            Crear cuenta
          </button>
        </form>
        )}

        <div className="mt-6 grid gap-3 border-t pt-5 sm:grid-cols-2" style={{ borderColor: "var(--vp-border)" }}>
          <Link
            href="/login"
            className="flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition"
            style={{
              color: "var(--vp-text)",
              background: "var(--vp-surface-raised)",
              border: "1px solid var(--vp-border)",
            }}
          >
            <LogIn size={16} />
            Ya tengo cuenta
          </Link>
          <Link
            href="/onboarding"
            className="flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition"
            style={{
              color: "var(--vp-accent)",
              background: "var(--vp-accent-muted)",
              border: "1px solid var(--vp-accent-border)",
            }}
          >
            <ClipboardCheck size={16} />
            Completar perfil
          </Link>
        </div>
      </section>
    </AuthShell>
  );
}

function Field({ id, label, error, helper, ...props }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold" htmlFor={id} style={{ color: "var(--vp-muted)" }}>
        {label}
      </label>
      <input
        id={id}
        className="min-h-12 w-full rounded-lg px-3 text-sm font-semibold outline-none"
        style={{
          color: "var(--vp-text)",
          background: "var(--vp-surface-raised)",
          border: error ? "1px solid var(--vp-danger)" : "1px solid var(--vp-border)",
        }}
        {...props}
      />
      {error ? (
        <p className="mt-2 text-xs font-semibold" style={{ color: "var(--vp-danger)" }}>
          {error}
        </p>
      ) : helper ? (
        <p className="mt-2 text-xs leading-5" style={{ color: "var(--vp-subtle)" }}>
          {helper}
        </p>
      ) : null}
    </div>
  );
}

function PasswordField({
  id,
  label,
  error,
  showPassword,
  onTogglePassword,
  ...props
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold" htmlFor={id} style={{ color: "var(--vp-muted)" }}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={showPassword ? "text" : "password"}
          className="min-h-12 w-full rounded-lg px-3 pr-12 text-sm font-semibold outline-none"
          style={{
            color: "var(--vp-text)",
            background: "var(--vp-surface-raised)",
            border: error ? "1px solid var(--vp-danger)" : "1px solid var(--vp-border)",
          }}
          {...props}
        />
        <button
          type="button"
          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          onClick={onTogglePassword}
          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md"
          style={{ color: "var(--vp-muted)" }}
        >
          {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-xs font-semibold" style={{ color: "var(--vp-danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

function SelectField({ id, label, options, ...props }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold" htmlFor={id} style={{ color: "var(--vp-muted)" }}>
        {label}
      </label>
      <select
        id={id}
        className="min-h-12 w-full rounded-lg px-3 text-sm font-semibold outline-none"
        style={{
          color: "var(--vp-text)",
          background: "var(--vp-surface-raised)",
          border: "1px solid var(--vp-border)",
        }}
        {...props}
      >
        {options.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}

function CheckRow({ checked, onChange, label, error }) {
  return (
    <div>
      <label
        className="flex cursor-pointer items-start gap-3 rounded-lg p-4 text-sm font-semibold leading-6"
        style={{
          color: "var(--vp-text-soft)",
          background: checked ? "var(--vp-accent-muted)" : "var(--vp-surface-raised)",
          border: checked ? "1px solid var(--vp-accent-border)" : "1px solid var(--vp-border)",
        }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-1 h-4 w-4"
          style={{ accentColor: "var(--vp-accent)" }}
        />
        <span>{label}</span>
      </label>
      {error && (
        <p className="mt-2 text-xs font-semibold" style={{ color: "var(--vp-danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

function readStoredJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "{}");
  } catch {
    return {};
  }
}
