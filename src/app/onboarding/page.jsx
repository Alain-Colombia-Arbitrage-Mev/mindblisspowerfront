"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  HeartHandshake,
  IdCard,
  Languages,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { mergeOnboardingIdentity, toBrowserOnboardingDraft } from "@/lib/onboarding-profile";
import AuthShell from "../_components/AuthShell";

const steps = [
  { id: "welcome", title: "Bienvenida", icon: HeartHandshake },
  { id: "personal", title: "Datos", icon: IdCard },
  { id: "preferences", title: "Preferencias", icon: Languages },
  { id: "confirmation", title: "Confirmación", icon: ClipboardCheck },
];

const initialData = {
  fullName: "",
  email: "",
  phone: "",
  country: "Colombia",
  city: "",
  documentType: "cc",
  documentNumber: "",
  birthDate: "",
  address: "",
  preferredLanguage: "es",
  communicationChannel: "whatsapp",
  memberInterest: "wellbeing",
  supportNeeds: "",
  acceptsPrivacy: false,
  acceptsCommunications: true,
};

const sideKpis = [
  { value: "4", label: "pasos" },
  { value: "1", label: "perfil" },
  { value: "Privado", label: "datos" },
];

const documentTypes = [
  ["cc", "Cédula de ciudadanía"],
  ["ce", "Cédula de extranjería"],
  ["passport", "Pasaporte"],
  ["dni", "Documento nacional"],
];

const languages = [
  ["es", "Español"],
  ["en", "Inglés"],
  ["pt", "Portugués"],
];

const channels = [
  ["whatsapp", "WhatsApp"],
  ["email", "Email"],
  ["phone", "Llamada"],
];

const interests = [
  ["wellbeing", "Bienestar personal"],
  ["products", "Productos Mindbliss"],
  ["community", "Comunidad y eventos"],
  ["education", "Formación"],
];

export default function OnboardingPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [data, setData] = useState(initialData);
  const [errors, setErrors] = useState(/** @type {Record<string, string>} */ ({}));
  const [loaded, setLoaded] = useState(false);
  const [identityStatus, setIdentityStatus] = useState("loading");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function hydrateIdentity() {
      const localUser = readStoredJson("user_data");
      const stored = {
        ...(localUser.email ? {
          fullName: localUser.name,
          email: localUser.email,
          phone: localUser.phone,
          country: localUser.country,
        } : {}),
        ...readStoredJson("vp_registration_draft"),
        ...readStoredJson("mp_registration_draft"),
        ...readStoredJson("vp_onboarding"),
        ...readStoredJson("mp_onboarding"),
        ...readStoredJson("vp_onboarding_draft"),
        ...readStoredJson("mp_onboarding_draft"),
      };

      let session = {};
      let profile = {};
      let onboarding = {};
      let sessionUnavailable = false;

      try {
        const sessionResponse = await fetch("/api/auth/session", { cache: "no-store", signal: controller.signal });
        session = await sessionResponse.json().catch(() => ({}));
        if (!sessionResponse.ok) sessionUnavailable = sessionResponse.status >= 500;

        if (sessionResponse.ok && session.authenticated) {
          const [profileResponse, onboardingResponse] = await Promise.all([
            fetch("/api/member/profile", { cache: "no-store", signal: controller.signal }),
            fetch("/api/member/onboarding", { cache: "no-store", signal: controller.signal }),
          ]);
          if (profileResponse.ok) profile = await profileResponse.json().catch(() => ({}));
          if (onboardingResponse.ok) onboarding = await onboardingResponse.json().catch(() => ({}));
        }
      } catch (error) {
        if (error?.name === "AbortError") return;
        sessionUnavailable = true;
      }

      if (cancelled) return;
      const hydrated = mergeOnboardingIdentity({ stored, session, profile, onboarding });
      setData((current) => ({ ...current, ...hydrated.data }));
      setIdentityStatus(hydrated.authenticated ? "authenticated" : sessionUnavailable ? "unavailable" : "anonymous");
      // Elimina copias completas heredadas; el efecto siguiente reescribe sólo
      // el subconjunto permitido para UX, sin documento/nacimiento/dirección.
      localStorage.removeItem("mp_onboarding");
      localStorage.removeItem("vp_onboarding");
      setLoaded(true);
    }

    hydrateIdentity();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const browserDraft = toBrowserOnboardingDraft(data);
    localStorage.setItem("mp_onboarding_draft", JSON.stringify(browserDraft));
    localStorage.setItem("vp_onboarding_draft", JSON.stringify(browserDraft));
  }, [data, loaded]);

  const progress = useMemo(() => Math.round(((activeStep + 1) / steps.length) * 100), [activeStep]);
  const ActiveIcon = steps[activeStep].icon;

  function updateField(field, value) {
    setSaveError("");
    setData((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function validateStep(stepIndex) {
    /** @type {Record<string, string>} */
    const nextErrors = {};

    if (stepIndex === 0) {
      if (!data.fullName.trim()) nextErrors.fullName = "El nombre es requerido.";
      if (!data.email.trim()) {
        nextErrors.email = "El email es requerido.";
      } else if (!/^\S+@\S+\.\S+$/.test(data.email)) {
        nextErrors.email = "Ingresa un email valido.";
      }
      if (!data.phone.trim()) nextErrors.phone = "El teléfono es requerido.";
    }

    if (stepIndex === 1) {
      if (!data.country.trim()) nextErrors.country = "El país es requerido.";
      if (!data.city.trim()) nextErrors.city = "La ciudad es requerida.";
      if (data.documentNumber && !/^[\p{L}\p{N}][\p{L}\p{N} ./-]{2,39}$/u.test(data.documentNumber.trim())) {
        nextErrors.documentNumber = "Ingresa un número de documento válido.";
      }
      if (data.birthDate) {
        const birthDate = new Date(`${data.birthDate}T00:00:00.000Z`);
        const now = new Date();
        const oldest = new Date(Date.UTC(now.getUTCFullYear() - 120, now.getUTCMonth(), now.getUTCDate()));
        if (Number.isNaN(birthDate.getTime()) || birthDate > now || birthDate < oldest) {
          nextErrors.birthDate = "Ingresa una fecha de nacimiento válida.";
        }
      }
    }

    if (stepIndex === 3 && !data.acceptsPrivacy) {
      nextErrors.acceptsPrivacy = "Debes autorizar el tratamiento de datos.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function goNext() {
    if (identityStatus !== "authenticated") {
      setSaveError("Inicia sesión para continuar. Así podremos guardar tus datos de forma segura.");
      return;
    }
    if (!validateStep(activeStep)) return;
    if (activeStep === steps.length - 1) {
      finishOnboarding();
      return;
    }
    setActiveStep((current) => current + 1);
  }

  function goBack() {
    setErrors({});
    setActiveStep((current) => Math.max(0, current - 1));
  }

  async function finishOnboarding() {
    if (saving) return;
    setSaving(true);
    setSaveError("");
    const userId = localStorage.getItem("user_id") || `member-${Date.now()}`;
    const activatedAt = new Date().toISOString();
    const normalizedName = data.fullName.trim() || "Miembro Mindbliss";
    const normalizedEmail = data.email.trim().toLowerCase();

    try {
      const response = await fetch("/api/member/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: normalizedName,
          phone: data.phone.trim(),
          country: data.country.trim(),
          city: data.city.trim(),
          documentType: data.documentType,
          documentNumber: data.documentNumber.trim(),
          birthDate: data.birthDate,
          address: data.address.trim(),
          preferredLanguage: data.preferredLanguage,
          communicationChannel: data.communicationChannel,
          memberInterest: data.memberInterest,
          supportNeeds: data.supportNeeds.trim(),
          acceptsPrivacy: data.acceptsPrivacy,
          acceptsCommunications: data.acceptsCommunications,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.ok) {
        if (response.status === 401) setIdentityStatus("anonymous");
        setSaveError(
          response.status === 401
            ? "Tu sesión venció. Inicia sesión nuevamente para guardar el perfil."
            : "No pudimos guardar el perfil. Revisa los datos e intenta de nuevo."
        );
        setSaving(false);
        return;
      }
    } catch {
      setSaveError("No pudimos conectar con el servicio. Tus datos no se guardaron; intenta de nuevo.");
      setSaving(false);
      return;
    }

    const userData = {
      id: userId,
      name: normalizedName,
      email: normalizedEmail,
      phone: data.phone.trim(),
      country: data.country.trim() || "Colombia",
      city: data.city.trim(),
      preferred_language: data.preferredLanguage,
      communication_channel: data.communicationChannel,
      member_interest: data.memberInterest,
      company: "Mindbliss Power",
      rank: "Miembro",
      role: "user",
      type: "user",
      user_type: "DIRECT",
      path: "member",
      onboarding_completed_at: activatedAt,
    };

    const completedOnboarding = {
      ...toBrowserOnboardingDraft(data),
      fullName: normalizedName,
      email: normalizedEmail,
      completed: true,
      completedAt: activatedAt,
      company: "Mindbliss Power",
    };

    localStorage.setItem("user_auth", "true");
    localStorage.setItem("user_id", userId);
    localStorage.setItem("user_role", "user");
    localStorage.setItem("selected_user", userId);
    localStorage.setItem("selected_node", userId);
    localStorage.setItem("user_data", JSON.stringify(userData));
    localStorage.setItem("mp_onboarding", JSON.stringify(completedOnboarding));
    localStorage.setItem("vp_onboarding", JSON.stringify(completedOnboarding));
    localStorage.removeItem("mp_onboarding_draft");
    localStorage.removeItem("vp_onboarding_draft");

    router.push("/dashboard/profile");
  }

  return (
    <AuthShell
      activePath="/onboarding"
      eyebrow="Bienvenida"
      title="Tu ingreso a Mindbliss Power empieza aquí."
      description="Completa tu perfil personal para que la empresa pueda darte una bienvenida ordenada, identificar tus preferencias y preparar tu acceso al portal."
      sideKpis={sideKpis}
      visualSrc="/mindbliss/pink-poppy.avif"
      visualAlt="Equipo Mindbliss compartiendo en un sofá"
    >
      <section
        className="w-full rounded-xl p-6 sm:p-8"
        style={{
          background: "var(--vp-surface)",
          border: "1px solid var(--vp-border)",
          boxShadow: "var(--vp-shadow)",
        }}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
              style={{
                background: "var(--vp-accent-muted)",
                border: "1px solid var(--vp-accent-border)",
                color: "var(--vp-accent)",
              }}
            >
              <ActiveIcon size={22} />
            </div>
            <div>
              <h2 className="auth-display text-2xl" style={{ color: "var(--vp-text)" }}>
                {steps[activeStep].title}
              </h2>
              <p className="mt-2 text-sm leading-6" style={{ color: "var(--vp-muted)" }}>
                Paso {activeStep + 1} de {steps.length}
              </p>
            </div>
          </div>
          <div className="text-right text-sm font-black tabular-nums" style={{ color: "var(--vp-accent)" }}>
            {progress}%
          </div>
        </div>

        <div className="mb-7 h-2 rounded-full" style={{ background: "var(--vp-surface-raised)" }}>
          <div
            className="h-2 rounded-full transition-all"
            style={{
              width: `${progress}%`,
              background: "var(--vp-accent)",
            }}
          />
        </div>

        <div className="mb-7 grid grid-cols-4 gap-2">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const active = index === activeStep;
            const complete = index < activeStep;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  if (index <= activeStep || (identityStatus === "authenticated" && validateStep(activeStep))) {
                    setActiveStep(index);
                  }
                }}
                disabled={index > activeStep && identityStatus !== "authenticated"}
                className="min-h-14 rounded-lg p-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  color: active || complete ? "var(--vp-accent)" : "var(--vp-muted)",
                  background: active || complete ? "var(--vp-accent-muted)" : "var(--vp-surface-raised)",
                  border: active || complete ? "1px solid var(--vp-accent-border)" : "1px solid var(--vp-border)",
                }}
                aria-current={active ? "step" : undefined}
              >
                <StepIcon className="mx-auto mb-1" size={16} />
                <span className="hidden sm:block">{step.title}</span>
              </button>
            );
          })}
        </div>

        <div className="min-h-[360px]">
          {activeStep === 0 && (
            <div className="space-y-5">
              <div
                className="rounded-lg p-4"
                style={{ background: "var(--vp-accent-muted)", border: "1px solid var(--vp-accent-border)" }}
              >
                <div className="mb-2 flex items-center gap-2 text-sm font-black" style={{ color: "var(--vp-accent)" }}>
                  <ShieldCheck size={18} />
                  Bienvenido a Mindbliss Power
                </div>
                <p className="text-sm leading-6" style={{ color: "var(--vp-text-soft)" }}>
                  {identityStatus === "loading"
                    ? "Estamos consultando tu cuenta y los datos guardados en Mindbliss."
                    : identityStatus === "authenticated"
                      ? "Recuperamos tu cuenta verificada y los datos guardados en Mindbliss. Solo completa lo que falta."
                      : "Recuperamos el borrador guardado en este navegador. Solo completa lo que falta para activar tu perfil."}
                </p>
              </div>

              {!loaded ? (
                <div className="flex items-center gap-2 rounded-lg p-4 text-sm font-semibold" style={{ color: "var(--vp-text-soft)", background: "var(--vp-surface-raised)", border: "1px solid var(--vp-border)" }}>
                  <Loader2 size={16} className="animate-spin" style={{ color: "var(--vp-accent)" }} />
                  Consultando tu sesión y tu perfil…
                </div>
              ) : !data.email ? (
                <div className="rounded-lg p-4 text-sm font-semibold" style={{ color: "var(--vp-amber)", background: "var(--vp-amber-muted)", border: "1px solid var(--vp-amber-border)" }}>
                  {identityStatus === "unavailable"
                    ? "No pudimos consultar tu cuenta en este momento. Intenta iniciar sesión nuevamente."
                    : "No hay una sesión activa para consultar tu cuenta. Si ya estás registrado, inicia sesión; no necesitas crear otra cuenta."}{" "}
                  <Link href="/login" style={{ color: "var(--vp-accent)", textDecoration: "underline" }}>Iniciar sesión</Link>.
                </div>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field
                      id="fullName"
                      label="Nombre completo"
                      value={data.fullName}
                      onChange={(event) => updateField("fullName", event.target.value)}
                      error={errors.fullName}
                      autoComplete="name"
                      maxLength={120}
                      required
                    />
                    <SummaryItem label={identityStatus === "authenticated" ? "Email verificado" : "Email de registro"} value={data.email} />
                    <Field
                      id="phone"
                      label="Teléfono"
                      type="tel"
                      value={data.phone}
                      onChange={(event) => updateField("phone", event.target.value)}
                      error={errors.phone}
                      autoComplete="tel"
                      maxLength={24}
                      required
                    />
                    <SelectField
                      id="communicationChannel"
                      label="Canal de contacto"
                      value={data.communicationChannel}
                      onChange={(event) => updateField("communicationChannel", event.target.value)}
                      options={channels}
                    />
                  </div>
                  <p className="text-xs" style={{ color: "var(--vp-subtle)" }}>
                    {identityStatus === "authenticated"
                      ? "El email proviene de tu sesión verificada. Puedes corregir aquí tu nombre o teléfono antes de continuar."
                      : "Puedes corregir aquí tu nombre o teléfono antes de continuar."}
                  </p>
                  {identityStatus !== "authenticated" && (
                    <div className="rounded-lg p-4 text-sm font-semibold" style={{ color: "var(--vp-amber)", background: "var(--vp-amber-muted)", border: "1px solid var(--vp-amber-border)" }}>
                      Para proteger tus datos, inicia sesión antes de continuar.{" "}
                      <Link href={`/login?email=${encodeURIComponent(data.email)}`} style={{ color: "var(--vp-accent)", textDecoration: "underline" }}>Iniciar sesión</Link>.
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeStep === 1 && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id="country"
                  label="País"
                  value={data.country}
                  onChange={(event) => updateField("country", event.target.value)}
                  error={errors.country}
                  autoComplete="country-name"
                  maxLength={80}
                  required
                />
                <Field
                  id="city"
                  label="Ciudad"
                  value={data.city}
                  onChange={(event) => updateField("city", event.target.value)}
                  error={errors.city}
                  autoComplete="address-level2"
                  maxLength={120}
                  required
                />
                <SelectField
                  id="documentType"
                  label="Tipo de documento"
                  value={data.documentType}
                  onChange={(event) => updateField("documentType", event.target.value)}
                  options={documentTypes}
                />
                <Field
                  id="documentNumber"
                  label="Número de documento"
                  value={data.documentNumber}
                  onChange={(event) => updateField("documentNumber", event.target.value)}
                  error={errors.documentNumber}
                  autoComplete="off"
                  maxLength={40}
                />
                <Field
                  id="birthDate"
                  label="Fecha de nacimiento"
                  type="date"
                  value={data.birthDate}
                  onChange={(event) => updateField("birthDate", event.target.value)}
                  error={errors.birthDate}
                  autoComplete="bday"
                  max={new Date().toISOString().slice(0, 10)}
                />
                <Field
                  id="address"
                  label="Dirección"
                  value={data.address}
                  onChange={(event) => updateField("address", event.target.value)}
                  autoComplete="street-address"
                  maxLength={240}
                />
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  id="preferredLanguage"
                  label="Idioma preferido"
                  value={data.preferredLanguage}
                  onChange={(event) => updateField("preferredLanguage", event.target.value)}
                  options={languages}
                />
                <SelectField
                  id="memberInterest"
                  label="Interés principal"
                  value={data.memberInterest}
                  onChange={(event) => updateField("memberInterest", event.target.value)}
                  options={interests}
                />
              </div>

              <TextAreaField
                id="supportNeeds"
                label="Notas para el equipo"
                value={data.supportNeeds}
                onChange={(event) => updateField("supportNeeds", event.target.value)}
                placeholder="Comparte alguna preferencia, necesidad de contacto o contexto relevante."
                maxLength={1000}
              />

              <SwitchRow
                checked={data.acceptsCommunications}
                onChange={(checked) => updateField("acceptsCommunications", checked)}
                label="Recibir comunicaciones de bienvenida y servicio."
              />
            </div>
          )}

          {activeStep === 3 && (
            <div className="space-y-5">
              <div
                className="rounded-lg p-4"
                style={{ background: "var(--vp-accent-muted)", border: "1px solid var(--vp-accent-border)" }}
              >
                <div className="mb-2 flex items-center gap-2 text-sm font-black" style={{ color: "var(--vp-accent)" }}>
                  <CheckCircle2 size={18} />
                  Listo para activar tu perfil
                </div>
                <p className="text-sm leading-6" style={{ color: "var(--vp-text-soft)" }}>
                  Revisa la información y confirma la autorización de datos para ingresar al portal de miembros.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <SummaryItem label="Nombre" value={data.fullName || "Pendiente"} />
                <SummaryItem label="Email" value={data.email || "Pendiente"} />
                <SummaryItem label="Ubicación" value={`${data.city || "Ciudad"}, ${data.country || "País"}`} />
                <SummaryItem label="Contacto" value={channelLabel(data.communicationChannel)} />
                <SummaryItem label="Idioma" value={languageLabel(data.preferredLanguage)} />
                <SummaryItem label="Interés" value={interestLabel(data.memberInterest)} />
              </div>

              <CheckRow
                checked={data.acceptsPrivacy}
                onChange={(checked) => updateField("acceptsPrivacy", checked)}
                label="Autorizo a Mindbliss Power a usar mis datos para gestionar mi perfil, contacto y experiencia como miembro."
                error={errors.acceptsPrivacy}
              />
            </div>
          )}
        </div>

        {saveError && (
          <div className="mt-5 rounded-lg p-4 text-sm font-semibold" role="alert" style={{ color: "var(--vp-danger)", background: "var(--vp-danger-muted)", border: "1px solid var(--vp-danger-border)" }}>
            {saveError}{" "}
            {identityStatus !== "authenticated" && (
              <Link href={`/login?email=${encodeURIComponent(data.email)}`} style={{ color: "var(--vp-accent)", textDecoration: "underline" }}>Iniciar sesión</Link>
            )}
          </div>
        )}

        <div className="mt-7 flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--vp-border)" }}>
          <div className="flex gap-3">
            <Link
              href="/register"
              className="flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-sm font-bold transition"
              style={{
                color: "var(--vp-muted)",
                background: "var(--vp-surface-raised)",
                border: "1px solid var(--vp-border)",
              }}
            >
              Registro
            </Link>
            <button
              type="button"
              onClick={goBack}
              disabled={activeStep === 0}
              className="flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                color: "var(--vp-text-soft)",
                background: "var(--vp-surface-raised)",
                border: "1px solid var(--vp-border)",
              }}
            >
              <ArrowLeft size={15} />
              Atrás
            </button>
          </div>

          <button
            type="button"
            onClick={goNext}
            disabled={!loaded || !data.email || identityStatus !== "authenticated" || saving}
            className="flex min-h-12 items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              color: "var(--vp-shell)",
              background: "var(--vp-accent)",
              border: "1px solid var(--vp-accent-strong)",
            }}
          >
            {saving ? "Guardando de forma segura…" : activeStep === steps.length - 1 ? "Guardar y entrar" : "Continuar"}
            {saving ? <Loader2 className="animate-spin" size={16} /> : <ArrowRight size={16} />}
          </button>
        </div>
      </section>
    </AuthShell>
  );
}

function Field({ id, label, error = "", ...props }) {
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

function TextAreaField({ id, label, ...props }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold" htmlFor={id} style={{ color: "var(--vp-muted)" }}>
        {label}
      </label>
      <textarea
        id={id}
        rows={4}
        className="w-full resize-none rounded-lg px-3 py-3 text-sm font-semibold outline-none"
        style={{
          color: "var(--vp-text)",
          background: "var(--vp-surface-raised)",
          border: "1px solid var(--vp-border)",
        }}
        {...props}
      />
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

function SwitchRow({ checked, onChange, label }) {
  return (
    <label
      className="flex cursor-pointer items-center justify-between gap-4 rounded-lg p-4"
      style={{
        background: "var(--vp-surface-raised)",
        border: "1px solid var(--vp-border)",
        color: "var(--vp-text)",
      }}
    >
      <span className="text-sm font-bold">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5"
        style={{ accentColor: "var(--vp-accent)" }}
      />
    </label>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="rounded-lg p-4" style={{ background: "var(--vp-surface-raised)", border: "1px solid var(--vp-border)" }}>
      <div className="text-xs font-bold" style={{ color: "var(--vp-muted)" }}>
        {label}
      </div>
      <div className="mt-1 text-sm font-bold" style={{ color: "var(--vp-text)" }}>
        {value}
      </div>
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

function languageLabel(value) {
  return languages.find(([key]) => key === value)?.[1] || "Español";
}

function channelLabel(value) {
  return channels.find(([key]) => key === value)?.[1] || "WhatsApp";
}

function interestLabel(value) {
  return interests.find(([key]) => key === value)?.[1] || "Bienestar personal";
}
