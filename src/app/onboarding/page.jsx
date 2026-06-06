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
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  const [errors, setErrors] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const registrationDraft = readStoredJson("mp_registration_draft");
    const legacyRegistrationDraft = readStoredJson("vp_registration_draft");
    const onboarding = readStoredJson("mp_onboarding");
    const legacyOnboarding = readStoredJson("vp_onboarding");
    const onboardingDraft = readStoredJson("mp_onboarding_draft");
    const legacyOnboardingDraft = readStoredJson("vp_onboarding_draft");

    setData((current) => ({
      ...current,
      ...legacyRegistrationDraft,
      ...registrationDraft,
      ...legacyOnboarding,
      ...onboarding,
      ...legacyOnboardingDraft,
      ...onboardingDraft,
    }));
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("mp_onboarding_draft", JSON.stringify(data));
    localStorage.setItem("vp_onboarding_draft", JSON.stringify(data));
  }, [data, loaded]);

  const progress = useMemo(() => Math.round(((activeStep + 1) / steps.length) * 100), [activeStep]);
  const ActiveIcon = steps[activeStep].icon;

  function updateField(field, value) {
    setData((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function validateStep(stepIndex) {
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
    }

    if (stepIndex === 3 && !data.acceptsPrivacy) {
      nextErrors.acceptsPrivacy = "Debes autorizar el tratamiento de datos.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function goNext() {
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

  function finishOnboarding() {
    const userId = localStorage.getItem("user_id") || `member-${Date.now()}`;
    const activatedAt = new Date().toISOString();
    const normalizedName = data.fullName.trim() || "Miembro Mindbliss";
    const normalizedEmail = data.email.trim().toLowerCase();

    const userData = {
      id: userId,
      name: normalizedName,
      email: normalizedEmail,
      phone: data.phone.trim(),
      country: data.country.trim() || "Colombia",
      city: data.city.trim(),
      document_type: data.documentType,
      document_number: data.documentNumber.trim(),
      birth_date: data.birthDate,
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
      ...data,
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
                  if (index <= activeStep || validateStep(activeStep)) setActiveStep(index);
                }}
                className="min-h-14 rounded-lg p-2 text-xs font-bold transition"
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
                  Esta información crea tu perfil de miembro y permite que el equipo te acompañe desde el primer contacto.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id="fullName"
                  label="Nombre completo"
                  value={data.fullName}
                  onChange={(event) => updateField("fullName", event.target.value)}
                  error={errors.fullName}
                  autoComplete="name"
                  required
                />
                <Field
                  id="email"
                  label="Email"
                  type="email"
                  value={data.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  error={errors.email}
                  autoComplete="email"
                  required
                />
                <Field
                  id="phone"
                  label="Teléfono"
                  type="tel"
                  value={data.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  error={errors.phone}
                  autoComplete="tel"
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
                  required
                />
                <Field
                  id="city"
                  label="Ciudad"
                  value={data.city}
                  onChange={(event) => updateField("city", event.target.value)}
                  error={errors.city}
                  autoComplete="address-level2"
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
                  autoComplete="off"
                />
                <Field
                  id="birthDate"
                  label="Fecha de nacimiento"
                  type="date"
                  value={data.birthDate}
                  onChange={(event) => updateField("birthDate", event.target.value)}
                  autoComplete="bday"
                />
                <Field
                  id="address"
                  label="Dirección"
                  value={data.address}
                  onChange={(event) => updateField("address", event.target.value)}
                  autoComplete="street-address"
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
            className="flex min-h-12 items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-black transition"
            style={{
              color: "var(--vp-shell)",
              background: "var(--vp-accent)",
              border: "1px solid var(--vp-accent-strong)",
            }}
          >
            {activeStep === steps.length - 1 ? "Entrar al portal" : "Continuar"}
            <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </AuthShell>
  );
}

function Field({ id, label, error, ...props }) {
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
