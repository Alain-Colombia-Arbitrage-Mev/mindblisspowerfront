"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useMemberSession } from "@/lib/member-session-context";

import { formatPaymentMoney as money } from "@/lib/payment-display.mjs";

import { requestProfile } from "../../profile/profile-model.mjs";

import { Copy, CreditCard, KeyRound, Loader2, Send, Shield, ShieldCheck, User } from "lucide-react";

import { PageHeader, StatusPill, Field } from './executive-ui';

import { member } from './member-defaults.mjs';

const PLAN_LABEL = { passive_investor: "Inversionista pasivo", network: "Red" };

function normalizeProfilePhone(value) {
  if (typeof value !== 'string' || value.length > 40 || !/^[+\d ()-]+$/.test(value)) return '';
  const phone = value.trim().replace(/[ ()-]/g, '');
  return /^\+[1-9]\d{7,14}$/.test(phone) ? phone : '';
}

export function ProfileDashboardPage({ authMode = 'cognito' }) {
  const modernAuth = authMode === 'better-auth';
  const session = useMemberSession();
  const me = { name: session?.name || "", email: session?.email || "", referralCode: session?.referralCode || "" };
  const [summary, setSummary] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", country: "", payout_wallet_usdc: "" });
  const [phoneVerify, setPhoneVerify] = useState({ sending: false, confirming: false, pending: false, code: "", type: "", text: "" });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState({ type: "", text: "" });
  const [profileState, setProfileState] = useState('loading');
  const editedRef = useRef(false);
  const savingRef = useRef(false);
  const profileController = useRef(null);
  const savingController = useRef(null);
  const profileMounted = useRef(false);

  const loadProfile = useCallback(async () => {
    profileController.current?.abort();
    const controller = new AbortController();
    profileController.current = controller;
    setProfileState('loading');
    try {
      const current = await requestProfile('GET', undefined, { signal: controller.signal });
      if (controller.signal.aborted || !profileMounted.current) return;
      setForm(current);
      editedRef.current = false;
      setProfileState('ready');
    } catch {
      if (!controller.signal.aborted && profileMounted.current) setProfileState('error');
    }
  }, []);

  useEffect(() => {
    profileMounted.current = true;
    let cancelled = false;
    const controller = new AbortController();
    fetch("/api/payments/me", { cache: "no-store", credentials: 'same-origin', redirect: 'error', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(12000)]) })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d && !d.error) setSummary(d); })
      .catch(() => {});
    void loadProfile();
    return () => { cancelled = true; profileMounted.current = false; controller.abort(); profileController.current?.abort(); savingController.current?.abort(); };
  }, [loadProfile]);

  const setField = (k) => (e) => { if (profileState !== 'ready' || savingRef.current) return; editedRef.current = true; setForm((f) => ({ ...f, [k]: e.target.value })); };

  async function saveProfile() {
    if (savingRef.current || profileState !== 'ready') return;
    savingRef.current = true;
    setSaving(true);
    setSaveMsg({ type: "", text: "" });
    const wallet = (form.payout_wallet_usdc || "").trim();
    const phone = normalizeProfilePhone(form.phone);
    if (wallet && !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      savingRef.current = false;
      setSaving(false);
      setSaveMsg({ type: "err", text: "La dirección USDC debe ser una address ERC-20 válida (0x + 40 hex)." });
      return;
    }
    if ((form.phone || "").trim() && !phone) {
      savingRef.current = false;
      setSaving(false);
      setSaveMsg({ type: "err", text: "Ingresa el teléfono en formato internacional, por ejemplo +573001234567." });
      return;
    }
    const controller = new AbortController();
    savingController.current = controller;
    try {
      const current = await requestProfile('POST', {
          name: (form.name || "").trim(),
          phone,
          country: (form.country || "").trim(),
          payout_wallet_usdc: wallet,
        }, { signal: controller.signal });
      if (controller.signal.aborted || !profileMounted.current) return;
      setForm(current);
      editedRef.current = false;
      setSaveMsg({ type: "ok", text: "Cambios guardados y confirmados por el servidor." });
      try { window.dispatchEvent(new CustomEvent("vp:profile-updated", { detail: { name: current.name } })); } catch { /* ignore */ }
    } catch {
      if (!controller.signal.aborted && profileMounted.current) setSaveMsg({ type: "err", text: "No pudimos confirmar el guardado. Conservamos tus datos en pantalla; no se reenviarán automáticamente." });
    } finally {
      savingRef.current = false;
      if (profileMounted.current) setSaving(false);
    }
  }

  async function requestPhoneVerification() {
    if (modernAuth) return;
    const phone = normalizeProfilePhone(form.phone);
    if (!phone) {
      setPhoneVerify({ sending: false, confirming: false, pending: false, code: "", type: "err", text: "Usa formato internacional: +573001234567." });
      return;
    }
    setPhoneVerify((current) => ({ ...current, sending: true, type: "", text: "" }));
    try {
      const r = await fetch("/api/auth/cognito/phone/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) {
        setPhoneVerify((current) => ({ ...current, sending: false, type: "err", text: d.error || "No se pudo enviar el SMS de verificación." }));
        return;
      }
      setForm((current) => ({ ...current, phone: d.phone || phone }));
      setPhoneVerify({ sending: false, confirming: false, pending: true, code: "", type: "ok", text: "Código SMS enviado. Escríbelo para validar tu teléfono." });
    } catch {
      setPhoneVerify((current) => ({ ...current, sending: false, type: "err", text: "Sin conexión. Intenta de nuevo." }));
    }
  }

  async function confirmPhoneVerification() {
    if (modernAuth) return;
    const code = phoneVerify.code.replace(/[\s-]+/g, "");
    if (!/^\d{4,8}$/.test(code)) {
      setPhoneVerify((current) => ({ ...current, type: "err", text: "Ingresa el código SMS recibido." }));
      return;
    }
    setPhoneVerify((current) => ({ ...current, confirming: true, type: "", text: "" }));
    try {
      const r = await fetch("/api/auth/cognito/phone/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) {
        setPhoneVerify((current) => ({ ...current, confirming: false, type: "err", text: d.error || "No se pudo validar el teléfono." }));
        return;
      }
      setPhoneVerify({ sending: false, confirming: false, pending: false, code: "", type: "ok", text: d.message || "Teléfono validado." });
    } catch {
      setPhoneVerify((current) => ({ ...current, confirming: false, type: "err", text: "Sin conexión. Intenta de nuevo." }));
    }
  }

  const displayName = me.name || "Mi cuenta";
  const displayEmail = me.email || member.email;
  const displayReferral = me.referralCode || member.referralCode;
  const displayInitial = (displayName || "M").trim().charAt(0).toUpperCase();
  const displayRank = summary?.rank && summary.rank !== "—" ? summary.rank : member.rank;
  const displayJoined = summary?.joined_at || member.joined;
  const displayPlan = summary?.plan ? (PLAN_LABEL[summary.plan] || summary.plan) : member.plan;
  const displayBalance = money(summary?.wallet_balance_usd);

  return (
    <section className="executive-page">
      <div className="executive-container">
        <PageHeader
          eyebrow="Perfil"
          title="Mi perfil"
          subtitle="Gestiona datos personales, seguridad, billetera de retiro y preferencias de notificacion."
          action={
            <div className="flex flex-col items-end gap-1">
              <button className="executive-button primary" type="button" onClick={saveProfile} disabled={saving || profileState !== 'ready'}>
                {saving ? "Guardando…" : "Guardar cambios"}
              </button>
              {saveMsg.text && (
                <span role={saveMsg.type === 'ok' ? 'status' : 'alert'} className="text-xs font-semibold" style={{ color: saveMsg.type === "ok" ? "var(--vp-accent)" : "#f87171" }}>
                  {saveMsg.text}
                </span>
              )}
            </div>
          }
        />

        {profileState === 'loading' ? <p role="status" className="executive-panel">Cargando los datos guardados de tu perfil…</p> : null}
        {profileState === 'error' ? <div role="alert" className="executive-panel"><p>No pudimos cargar tu perfil. La edición y el guardado están bloqueados para proteger los datos existentes.</p><button className="executive-button mt-3" type="button" onClick={() => { void loadProfile(); }}>Volver a cargar mi perfil</button></div> : null}

        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="space-y-6">
            <div className="executive-panel text-center">
              <div
                className="mx-auto mb-5 flex h-28 w-28 items-center justify-center rounded-full text-4xl font-bold"
                style={{ background: "var(--vp-bg)", border: "4px solid var(--vp-surface-raised)", color: "var(--vp-accent)" }}
              >
                {displayInitial}
              </div>
              <h2 className="m-0 text-2xl font-bold" style={{ color: "var(--vp-text)" }}>
                {displayName}
              </h2>
              <p className="mt-2 text-sm" style={{ color: "var(--vp-muted)" }}>
                {displayEmail}
              </p>
              <div className="mt-5 flex justify-center">
                <StatusPill tone="warning">{displayRank}</StatusPill>
              </div>
              <div className="mt-7 grid grid-cols-2 gap-4 border-t pt-5 text-left" style={{ borderColor: "var(--vp-border)" }}>
                <div>
                  <p className="executive-card-label mb-1">Registro</p>
                  <p className="m-0 text-sm font-semibold" style={{ color: "var(--vp-text)" }}>
                    {displayJoined}
                  </p>
                </div>
                <div>
                  <p className="executive-card-label mb-1">Plan</p>
                  <p className="m-0 text-sm font-semibold" style={{ color: "var(--vp-text)" }}>
                    {displayPlan}
                  </p>
                </div>
                {displayBalance != null && (
                  <div className="col-span-2">
                    <p className="executive-card-label mb-1">Balance billetera</p>
                    <p className="m-0 text-lg font-semibold" style={{ color: "var(--vp-accent)" }}>
                      {displayBalance}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="executive-panel">
              <h2 className="executive-section-title">
                <Copy size={18} style={{ color: "var(--vp-accent)" }} />
                Referido
              </h2>
              <div className="rounded-2xl p-4" style={{ background: "var(--vp-bg)", border: "1px solid var(--vp-border)" }}>
                <p className="executive-card-label">Codigo unico</p>
                {displayReferral ? (
                  <p className="m-0 text-4xl font-light" style={{ color: "var(--vp-text)" }}>
                    {displayReferral}
                  </p>
                ) : (
                  <p className="m-0 mt-1 text-sm leading-6" style={{ color: "var(--vp-muted)" }}>
                    Tu código estará disponible cuando actives tu membresía y quedes colocado en la red.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="executive-panel">
              <h2 className="executive-section-title">
                <User size={18} style={{ color: "var(--vp-accent)" }} />
                Informacion personal
              </h2>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Nombre completo">
                  <input className="executive-input" value={form.name} onChange={setField("name")} disabled={saving || profileState !== 'ready'} maxLength={240} placeholder="Tu nombre y apellido" />
                </Field>
                <Field label="Usuario">
                  <input className="executive-input" key={displayEmail} defaultValue={displayEmail ? displayEmail.split("@")[0] : member.username} readOnly />
                </Field>
                <Field label="Correo electronico">
                  <input className="executive-input" key={displayEmail} defaultValue={displayEmail} readOnly type="email" />
                </Field>
                <Field label="Telefono">
                  <input className="executive-input" value={form.phone} onChange={setField("phone")} disabled={saving || profileState !== 'ready'} maxLength={32} type="tel" placeholder="+57 300 000 0000" />
                </Field>
                <div className="md:col-span-2 border-t pt-4" style={{ borderColor: "var(--vp-border)" }}>
                  {modernAuth ? <p className="text-sm leading-6" style={{ color: 'var(--vp-muted)' }}>El teléfono se guarda únicamente como dato de contacto. La autenticación de tu cuenta se realiza por correo electrónico.</p> : <>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                    <div className="min-w-0 flex-1">
                      <p className="m-0 text-sm font-bold" style={{ color: "var(--vp-text)" }}>Validación del teléfono</p>
                      <p className="m-0 mt-1 text-xs leading-5" style={{ color: "var(--vp-muted)" }}>
                        Valida este número en Cognito para poder recibir códigos de acceso por SMS si el correo falla.
                      </p>
                    </div>
                    <button className="executive-button" type="button" onClick={requestPhoneVerification} disabled={saving || phoneVerify.sending || phoneVerify.confirming}>
                      {phoneVerify.sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                      {phoneVerify.sending ? "Enviando…" : "Enviar SMS"}
                    </button>
                  </div>
                  {phoneVerify.pending && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                      <input
                        className="executive-input"
                        value={phoneVerify.code}
                        onChange={(event) => setPhoneVerify((current) => ({ ...current, code: event.target.value.replace(/[\s-]+/g, "") }))}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={8}
                        placeholder="Código SMS"
                      />
                      <button className="executive-button primary" type="button" onClick={confirmPhoneVerification} disabled={phoneVerify.confirming}>
                        {phoneVerify.confirming ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
                        Validar
                      </button>
                    </div>
                  )}
                  {phoneVerify.text && (
                    <p className="m-0 mt-3 text-xs font-semibold" style={{ color: phoneVerify.type === "ok" ? "var(--vp-accent)" : "#f87171" }}>
                      {phoneVerify.text}
                    </p>
                  )}
                  </>}
                </div>
                <Field label="Pais">
                  <input className="executive-input" value={form.country} onChange={setField("country")} disabled={saving || profileState !== 'ready'} maxLength={120} placeholder="País" />
                </Field>
                <Field label="Patrocinador">
                  <input className="executive-input" defaultValue={member.sponsor} readOnly />
                </Field>
              </div>
            </div>

            <div className="executive-grid two">
              <div className="executive-panel">
                <h2 className="executive-section-title">
                  <CreditCard size={18} style={{ color: "var(--vp-accent)" }} />
                  Billetera retiros
                </h2>
                <p className="mb-5 text-sm leading-6" style={{ color: "var(--vp-muted)" }}>
                  Configura una direccion USDC (red Ethereum · ERC-20) antes de solicitar retiros.
                </p>
                <Field label="Direccion USDC (ERC-20)">
                  <input className="executive-input" value={form.payout_wallet_usdc} onChange={setField("payout_wallet_usdc")} disabled={saving || profileState !== 'ready'} maxLength={42} placeholder="0x..." />
                </Field>
                <button className="executive-button mt-4 w-full" type="button" onClick={saveProfile} disabled={saving || profileState !== 'ready'}>
                  {saving ? "Guardando…" : "Actualizar billetera"}
                </button>
              </div>

              <div className="executive-panel">
                <h2 className="executive-section-title">
                  <Shield size={18} style={{ color: "var(--vp-accent)" }} />
                  Seguridad
                </h2>
                <p className="text-sm leading-6" style={{ color: 'var(--vp-muted)' }}>La autenticación usa tu correo electrónico. No hay un segundo factor (2FA) habilitado desde este panel. Las preferencias de resumen por email y el cambio de contraseña aún no están disponibles aquí.</p>
                <button className="executive-button mt-4 w-full" type="button" disabled aria-describedby="profile-password-unavailable">
                  <KeyRound size={16} />
                  Cambiar contrasena
                </button>
                <p id="profile-password-unavailable" className="mt-2 text-sm" style={{ color: 'var(--vp-muted)' }}>Función pendiente de integración; no se ha modificado tu contraseña.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
