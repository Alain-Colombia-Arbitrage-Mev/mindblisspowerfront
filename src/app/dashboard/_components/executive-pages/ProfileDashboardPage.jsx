"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

import { useMemberSession } from "@/lib/member-session-context";

import { formatPaymentMoney as money } from "@/lib/payment-display.mjs";

import { requestProfile } from "../../profile/profile-model.mjs";
import { browserRequestDeadline } from '@/lib/browser-request-deadline.mjs';

import { KeyRound, Loader2, Send, Shield, ShieldCheck, User } from "lucide-react";

import { PageHeader, Field } from './executive-ui';

import { member } from './member-defaults.mjs';
import { useI18n } from "@/i18n/LanguageProvider";

function normalizeProfilePhone(value) {
  if (typeof value !== 'string' || value.length > 40 || !/^[+\d ()-]+$/.test(value)) return '';
  const phone = value.trim().replace(/[ ()-]/g, '');
  return /^\+[1-9]\d{7,14}$/.test(phone) ? phone : '';
}

function phoneVerificationFailure(status, action, t) {
  if (status === 401) return t("profilePage.phoneSessionExpired");
  if (status === 403) return t("profilePage.phoneUnavailable");
  if (status === 429) return t("profilePage.phoneWait");
  if (status === 400) return action === "confirm"
    ? t("profilePage.phoneCodeInvalid")
    : t("profilePage.phoneFormatInvalid");
  return t("profilePage.phoneSyncing");
}

export function ProfileDashboardPage({ authMode = 'cognito' }) {
  const { t } = useI18n();
  const modernAuth = authMode === 'better-auth';
  const session = useMemberSession();
  const me = { name: session?.name || "", email: session?.email || "" };
  const [summary, setSummary] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", country: "" });
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
    const deadline = browserRequestDeadline(controller.signal, 12000);
    fetch("/api/payments/me", { cache: "no-store", credentials: 'same-origin', redirect: 'error', signal: deadline.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d && !d.error) setSummary(d); })
      .catch(() => {}).finally(() => deadline.dispose());
    void loadProfile();
    return () => { cancelled = true; profileMounted.current = false; controller.abort(); deadline.dispose(); profileController.current?.abort(); savingController.current?.abort(); };
  }, [loadProfile]);

  const setField = (k) => (e) => { if (profileState !== 'ready' || savingRef.current) return; editedRef.current = true; setForm((f) => ({ ...f, [k]: e.target.value })); };

  async function saveProfile() {
    if (savingRef.current || profileState !== 'ready') return;
    savingRef.current = true;
    setSaving(true);
    setSaveMsg({ type: "", text: "" });
    const phone = normalizeProfilePhone(form.phone);
    if ((form.phone || "").trim() && !phone) {
      savingRef.current = false;
      setSaving(false);
      setSaveMsg({ type: "err", text: t("profilePage.phoneExample") });
      return;
    }
    const controller = new AbortController();
    savingController.current = controller;
    try {
      const current = await requestProfile('POST', {
          name: (form.name || "").trim(),
          phone,
          country: (form.country || "").trim(),
        }, { signal: controller.signal });
      if (controller.signal.aborted || !profileMounted.current) return;
      setForm(current);
      editedRef.current = false;
      setSaveMsg({ type: "ok", text: t("profilePage.saved") });
      try { window.dispatchEvent(new CustomEvent("vp:profile-updated", { detail: { name: current.name } })); } catch { /* ignore */ }
    } catch {
      if (!controller.signal.aborted && profileMounted.current) setSaveMsg({ type: "err", text: t("profilePage.saveFailed") });
    } finally {
      savingRef.current = false;
      if (profileMounted.current) setSaving(false);
    }
  }

  async function requestPhoneVerification() {
    if (modernAuth) return;
    const phone = normalizeProfilePhone(form.phone);
    if (!phone) {
      setPhoneVerify({ sending: false, confirming: false, pending: false, code: "", type: "err", text: t("profilePage.phoneExampleShort") });
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
        setPhoneVerify((current) => ({ ...current, sending: false, type: "err", text: phoneVerificationFailure(r.status, "request", t) }));
        return;
      }
      setForm((current) => ({ ...current, phone: d.phone || phone }));
      setPhoneVerify({ sending: false, confirming: false, pending: true, code: "", type: "ok", text: t("profilePage.smsSent") });
    } catch {
      setPhoneVerify((current) => ({ ...current, sending: false, type: "err", text: t("supportPage.offline") }));
    }
  }

  async function confirmPhoneVerification() {
    if (modernAuth) return;
    const code = phoneVerify.code.replace(/[\s-]+/g, "");
    if (!/^\d{4,8}$/.test(code)) {
      setPhoneVerify((current) => ({ ...current, type: "err", text: t("profilePage.enterSms") }));
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
        setPhoneVerify((current) => ({ ...current, confirming: false, type: "err", text: phoneVerificationFailure(r.status, "confirm", t) }));
        return;
      }
      setPhoneVerify({ sending: false, confirming: false, pending: false, code: "", type: "ok", text: t("profilePage.phoneVerified") });
    } catch {
      setPhoneVerify((current) => ({ ...current, confirming: false, type: "err", text: t("supportPage.offline") }));
    }
  }

  const displayName = me.name || t("pages.account");
  const displayEmail = me.email || member.email;
  const displayInitial = (displayName || "M").trim().charAt(0).toUpperCase();
  const displayJoined = summary?.joined_at || member.joined;
  const planLabel = summary?.plan ? t(`profilePage.plan_${summary.plan}`) : "";
  const displayPlan = summary?.plan ? (planLabel.startsWith("profilePage.") ? summary.plan : planLabel) : member.plan;
  const displayBalance = money(summary?.wallet_balance_usd);

  return (
    <section className="executive-page">
      <div className="executive-container">
        <PageHeader
          eyebrow={t("profilePage.eyebrow")}
          title={t("profilePage.title")}
          subtitle={t("walletPage.profileSubtitle")}
          action={
            <div className="flex flex-col items-end gap-1">
              <button className="executive-button primary" type="button" onClick={saveProfile} disabled={saving || profileState !== 'ready'}>
                {saving ? t("profilePage.saving") : t("profilePage.saveChanges")}
              </button>
              {saveMsg.text && (
                <span role={saveMsg.type === 'ok' ? 'status' : 'alert'} className="text-xs font-semibold" style={{ color: saveMsg.type === "ok" ? "var(--vp-success)" : "var(--vp-danger)" }}>
                  {saveMsg.text}
                </span>
              )}
            </div>
          }
        />

        {profileState === 'loading' ? <p role="status" className="executive-panel">{t("profilePage.loading")}</p> : null}
        {profileState === 'error' ? <div role="status" className="executive-panel" style={{ borderColor: "var(--vp-info-border)" }}><p className="font-semibold" style={{ color: "var(--vp-text)" }}>{t("profilePage.syncing")}</p><p className="mt-2 text-sm" style={{ color: "var(--vp-muted)" }}>{t("profilePage.syncingCopy")}</p><button className="executive-button mt-3" type="button" onClick={() => { void loadProfile(); }}>{t("profilePage.refresh")}</button></div> : null}

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
              <div className="mt-7 grid grid-cols-2 gap-4 border-t pt-5 text-left" style={{ borderColor: "var(--vp-border)" }}>
                <div>
                  <p className="executive-card-label mb-1">{t("profilePage.joined")}</p>
                  <p className="m-0 text-sm font-semibold" style={{ color: "var(--vp-text)" }}>
                    {displayJoined}
                  </p>
                </div>
                <div>
                  <p className="executive-card-label mb-1">{t("profilePage.plan")}</p>
                  <p className="m-0 text-sm font-semibold" style={{ color: "var(--vp-text)" }}>
                    {displayPlan}
                  </p>
                </div>
                {displayBalance != null && (
                  <div className="col-span-2">
                    <p className="executive-card-label mb-1">{t("profilePage.walletBalance")}</p>
                    <p className="m-0 text-lg font-semibold" style={{ color: "var(--vp-accent)" }}>
                      {displayBalance}
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>

          <div className="space-y-6">
            <div className="executive-panel">
              <h2 className="executive-section-title">
                <User size={18} style={{ color: "var(--vp-accent)" }} />
                {t("profilePage.personalInfo")}
              </h2>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label={t("profilePage.fullName")}>
                  <input className="executive-input" value={form.name} onChange={setField("name")} disabled={saving || profileState !== 'ready'} maxLength={240} placeholder={t("profilePage.namePlaceholder")} />
                </Field>
                <Field label={t("profilePage.username")}>
                  <input className="executive-input" key={displayEmail} defaultValue={displayEmail ? displayEmail.split("@")[0] : member.username} readOnly />
                </Field>
                <Field label={t("profilePage.email")}>
                  <input className="executive-input" key={displayEmail} defaultValue={displayEmail} readOnly type="email" />
                </Field>
                <Field label={t("profilePage.phone")}>
                  <input className="executive-input" value={form.phone} onChange={setField("phone")} disabled={saving || profileState !== 'ready'} maxLength={32} type="tel" placeholder="+57 300 000 0000" />
                </Field>
                <div className="md:col-span-2 border-t pt-4" style={{ borderColor: "var(--vp-border)" }}>
                  {modernAuth ? <p className="text-sm leading-6" style={{ color: 'var(--vp-muted)' }}>{t("profilePage.phoneContactOnly")}</p> : <>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                    <div className="min-w-0 flex-1">
                      <p className="m-0 text-sm font-bold" style={{ color: "var(--vp-text)" }}>{t("profilePage.phoneValidation")}</p>
                      <p className="m-0 mt-1 text-xs leading-5" style={{ color: "var(--vp-muted)" }}>
                        {t("profilePage.phoneValidationCopy")}
                      </p>
                    </div>
                    <button className="executive-button" type="button" onClick={requestPhoneVerification} disabled={saving || phoneVerify.sending || phoneVerify.confirming}>
                      {phoneVerify.sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                      {phoneVerify.sending ? t("profilePage.sending") : t("profilePage.sendSms")}
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
                        placeholder={t("profilePage.smsCode")}
                      />
                      <button className="executive-button primary" type="button" onClick={confirmPhoneVerification} disabled={phoneVerify.confirming}>
                        {phoneVerify.confirming ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
                        {t("profilePage.validate")}
                      </button>
                    </div>
                  )}
                  {phoneVerify.text && (
                    <p className="m-0 mt-3 text-xs font-semibold" style={{ color: phoneVerify.type === "ok" ? "var(--vp-success)" : "var(--vp-danger)" }}>
                      {phoneVerify.text}
                    </p>
                  )}
                  </>}
                </div>
                <Field label={t("profilePage.country")}>
                  <input className="executive-input" value={form.country} onChange={setField("country")} disabled={saving || profileState !== 'ready'} maxLength={120} placeholder={t("profilePage.country")} />
                </Field>
              </div>
            </div>

            <div className="executive-grid">
              <div className="executive-panel">
                <h2 className="executive-section-title">
                  <Shield size={18} style={{ color: "var(--vp-accent)" }} />
                  {t("profilePage.security")}
                </h2>
                <div className="rounded-2xl p-4" style={{ background: "var(--vp-bg)", border: "1px solid var(--vp-border)" }}>
                  <p className="executive-card-label mb-1">{t("profilePage.email")}</p>
                  <p className="m-0 break-all text-sm font-semibold" style={{ color: "var(--vp-text)" }}>{displayEmail}</p>
                </div>
                <Link className="executive-button mt-4 w-full" href="/forgot-password">
                  <KeyRound size={16} />
                  {t("auth.changePassword")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
