'use client';

import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Mail, UserPlus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import AuthShell from '../_components/AuthShell';
import { useResendCooldown, suggestEmailFix } from '@/lib/useResendCooldown';
import { bindReferralCodeToEmail } from '@/lib/referral-attribution';
import { RegistrationButton, RegistrationField } from './RegistrationFields';
import { beginVerifiedReferralSync } from '@/lib/referral-sync.mjs';
import { browserRequestDeadline } from '@/lib/browser-request-deadline.mjs';
import { rememberWalletSetupAfterAuth } from '@/lib/wallet-setup-handoff.mjs';
import { recoverRegistrationSession, registrationSessionRecoveryEligible, registrationVerifiedWithoutSession } from '@/lib/registration-session-recovery.mjs';
import ContactPhoneField from './ContactPhoneField';
import { initialContactPhone, registrationContactValues } from './contact-phone-model.mjs';
import { REGISTRATION_RESEND_SECONDS, consumeRegistrationPrefill, registrationEmail, registrationErrors, registrationCodeFailure, registrationFailure, registrationHints, registrationLoginUrl, registrationUrl, registrationRetrySeconds, registrationAcknowledged, registrationPendingDelivery, registrationTimeoutMs } from './registration-model.mjs';

const initialForm = { fullName: '', email: '', acceptsPrivacy: false,
  contactPhone: initialContactPhone(), contactWhatsapp: initialContactPhone(), whatsappSameAsPhone: false };

// Registration verifies email ownership only; optional phone contacts remain
// unverified. It never claims a legacy balance, placement, rank or permissions.
export default function BetterAuthRegisterForm({ initialSearch = '' }) {
  const [hints] = useState(() => registrationHints(initialSearch));
  const [form, setForm] = useState(() => ({ ...initialForm, email: hints.email }));
  const [step, setStep] = useState(() => hints.resume && hints.email ? 'confirm' : 'details');
  const [errors, setErrors] = useState(/** @type {Record<string, string>} */ ({}));
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState('');
  const [code, setCode] = useState('');
  const submitting = useRef(false);
  const mounted = useRef(false);
  const activeRequest = useRef(null);
  const requestGeneration = useRef(0);
  const dashboardNavigation = useRef(false);
  const feedback = useRef(null);
  const codeInput = useRef(null);
  const title = useRef(null);
  const contactDetails = useRef(null);
  const email = registrationEmail(form.email);
  const latestEmail = useRef(email); latestEmail.current = email;
  const completed = step === 'verified' || step === 'recovered';
  const awaitingAccess = step === 'verified-login';
  const cooldown = useResendCooldown(REGISTRATION_RESEND_SECONDS, email);
  const isLoading = Boolean(loading);
  const loginUrl = registrationLoginUrl(email, hints.referralCode, hints.preferredSide);
  const emailSuggestion = suggestEmailFix(form.email);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      requestGeneration.current++;
      // Cancellation prevents stale UI updates, not a provider delivery that
      // may already have been accepted. It never schedules another send.
      activeRequest.current?.controller.abort();
      activeRequest.current = null;
      submitting.current = false;
    };
  }, []);

  useEffect(() => {
    if (new URLSearchParams(initialSearch).get('reason') !== 'registration-required' || hints.resume) return;
    const prefill = consumeRegistrationPrefill(typeof window === 'undefined' ? undefined : window);
    if (prefill) setForm(current => current.email ? current : { ...current, email: prefill });
    setNotice('Completa tu registro y verifica tu correo para continuar. No se enviará ningún código hasta que solicites crear tu cuenta.');
  }, [initialSearch, hints.resume]);

  useEffect(() => {
    if (step === 'confirm') codeInput.current?.focus();
    if (step === 'verified' || step === 'recovered' || step === 'verified-login') title.current?.focus();
  }, [step]);

  useEffect(() => {
    if (errors.form) feedback.current?.focus();
  }, [errors.form]);

  useEffect(() => {
    if (errors.code && !isLoading) codeInput.current?.focus();
  }, [errors.code, isLoading]);

  function update(field, value) {
    setForm(current => ({ ...current, [field]: value }));
    setErrors(current => {
      const next = { ...current };
      delete next[field];
      if (field === 'whatsappSameAsPhone') { delete next.contactPhone; delete next.contactWhatsapp; }
      delete next.form;
      return next;
    });
  }

  function beginRequest() {
    const operation = { generation: ++requestGeneration.current, controller: new AbortController(),
      email: latestEmail.current, recoveryAttempted: false };
    activeRequest.current = operation;
    return operation;
  }

  function currentRequest(operation) {
    return mounted.current && activeRequest.current === operation
      && requestGeneration.current === operation.generation && operation.email === latestEmail.current
      && !operation.controller.signal.aborted;
  }

  function finishRequest(operation) {
    if (!mounted.current || activeRequest.current !== operation || requestGeneration.current !== operation.generation) return;
    activeRequest.current = null;
    submitting.current = false;
    setLoading('');
  }

  function enterVerifiedDashboard(operation, recovered = false) {
    if (!currentRequest(operation) || dashboardNavigation.current) return;
    // The BFF proved a new native session, or the recovery GET independently
    // proved this browser's existing same-owner session. Neither is an email
    // lookup or an access grant; the dashboard still enforces permissions.
    // Optional attribution cannot delay the navigation or grant permissions.
    try {
      if (hints.referralCode) bindReferralCodeToEmail(email, hints.referralCode, undefined, undefined, 'registration', hints.preferredSide);
      if (hints.referralCode) void beginVerifiedReferralSync(email, hints.referralCode, hints.preferredSide);
    } catch { /* Server referral persistence independently verifies ownership. */ }
    // Recovered registration may also offer the manual wallet activation UI.
    // This hint has no authentication, ownership or automatic-signing power.
    rememberWalletSetupAfterAuth(operation.email, window);
    dashboardNavigation.current = true;
    try {
      window.location.replace('/dashboard');
    } catch {
      setErrors({ form: recovered ? 'Tu sesión está recuperada. Abre el panel con el enlace de abajo para continuar.'
        : 'Tu correo está verificado. Abre el panel con el enlace de abajo para continuar.' });
    }
  }

  async function recoverCurrentSession(operation) {
    if (!currentRequest(operation) || operation.recoveryAttempted) return false;
    operation.recoveryAttempted = true;
    const identity = await recoverRegistrationSession(operation.email, { signal: operation.controller.signal });
    if (!currentRequest(operation) || !identity || identity.email !== operation.email) return false;
    setCode(''); setErrors({}); setNotice(''); setStep('recovered');
    enterVerifiedDashboard(operation, true);
    return true;
  }

  async function post(path, body, action, operation) {
    const deadline = browserRequestDeadline(operation.controller.signal, registrationTimeoutMs(action));
    try {
      const response = await fetch(path, {
        method: 'POST', credentials: 'same-origin', cache: 'no-store', redirect: 'error',
        signal: deadline.signal,
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      return { response, payload: await response.json().catch(() => ({})) };
    } finally { deadline.dispose(); }
  }

  async function register(event) {
    event.preventDefault();
    if (submitting.current || !mounted.current) return;
    setNotice('');
    const contacts = registrationContactValues(form);
    const nextErrors = { ...registrationErrors(form), ...contacts.errors };
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      if ((nextErrors.contactPhone || nextErrors.contactWhatsapp) && contactDetails.current) contactDetails.current.open = true;
      document.getElementById(Object.keys(nextErrors)[0])?.focus();
      return;
    }
    submitting.current = true;
    const operation = beginRequest();
    setLoading('register');
    try {
      const { response, payload } = await post('/api/auth/register', {
        fullName: form.fullName.trim(), email, acceptsPrivacy: true,
        referralCode: hints.referralCode, preferredSide: hints.preferredSide,
        ...contacts.values,
      }, 'send', operation);
      if (!currentRequest(operation)) return;
      if (registrationPendingDelivery(response.status, payload, email)) {
        if (hints.referralCode) bindReferralCodeToEmail(email, hints.referralCode, undefined, undefined, 'registration', hints.preferredSide);
        setForm(current => ({ ...current, email }));
        setCode('');
        setStep('confirm');
        cooldown.start(registrationRetrySeconds(response, payload));
        setErrors({ form: 'Tu registro quedó pendiente de verificar el correo, pero no pudimos confirmar el envío. Revisa tu bandeja y spam; si recibes un código vigente, introdúcelo aquí. No crees otra cuenta. Espera a que termine el contador y usa «Solicitar otro código». El reenvío es manual.' });
        return;
      }
      if (!response.ok || !registrationAcknowledged('register', payload, email)) {
        if (response.status === 429 || response.status >= 500 || response.ok) cooldown.start(registrationRetrySeconds(response, payload || {}));
        setErrors({ form: registrationFailure(response.ok ? 502 : response.status, 'register', payload?.code) });
        return;
      }
      if (hints.referralCode) bindReferralCodeToEmail(email, hints.referralCode, undefined, undefined, 'registration', hints.preferredSide);
      setForm(current => ({ ...current, email }));
      setCode('');
      setStep('confirm');
      cooldown.start(registrationRetrySeconds(response, payload));
      setNotice('Solicitud recibida. Revisa tu correo y spam. Si recibes el código de registro, úsalo para verificar tu correo; solicitarlo no completa la verificación.');
    } catch {
      if (!currentRequest(operation)) return;
      cooldown.start();
      setErrors({ form: 'No pudimos confirmar el resultado. No enviaremos otro correo automáticamente. Si recibes el código, usa «Ya solicité mi registro»; de lo contrario espera antes de reintentar.' });
    } finally {
      finishRequest(operation);
    }
  }

  async function confirm(event) {
    event.preventDefault();
    if (submitting.current || !mounted.current || dashboardNavigation.current) return;
    setErrors({});
    setNotice('');
    if (!/^\d{6}$/.test(code)) {
      setErrors({ code: 'Ingresa los 6 dígitos del correo, sin espacios.' });
      return;
    }
    submitting.current = true;
    const operation = beginRequest();
    setLoading('confirm');
    try {
      const { response, payload } = await post('/api/auth/register/confirm', { email, code }, 'confirm', operation);
      if (!currentRequest(operation)) return;
      if (!response.ok || !registrationAcknowledged('confirm', payload)) {
        if (registrationSessionRecoveryEligible(response.status, payload?.code) && await recoverCurrentSession(operation)) return;
        if (!currentRequest(operation)) return;
        if (registrationVerifiedWithoutSession(response.status, payload)) {
          setCode(''); setErrors({}); setNotice(''); setStep('verified-login'); return;
        }
        if (response.status === 429) cooldown.start(registrationRetrySeconds(response, payload));
        const status = response.ok ? 502 : response.status;
        const message = registrationFailure(status, 'confirm', payload?.code);
        if (registrationCodeFailure(status, payload?.code)) {
          setErrors({ code: message });
        } else setErrors({ form: message });
        return;
      }
      setCode('');
      setStep('verified');
      enterVerifiedDashboard(operation);
    } catch {
      if (!currentRequest(operation)) return;
      if (await recoverCurrentSession(operation)) return;
      if (!currentRequest(operation)) return;
      setErrors({ form: registrationFailure(503, 'confirm') });
    } finally {
      finishRequest(operation);
    }
  }

  async function resend() {
    if (submitting.current || cooldown.active || !mounted.current) return;
    submitting.current = true;
    const operation = beginRequest();
    setLoading('resend');
    setErrors({});
    setNotice('');
    cooldown.start();
    try {
      const { response, payload } = await post('/api/auth/register/confirm', { email, resend: true }, 'send', operation);
      if (!currentRequest(operation)) return;
      if (!response.ok || !registrationAcknowledged('resend', payload)) {
        if (response.status === 429) cooldown.start(registrationRetrySeconds(response, payload));
        setErrors({ form: registrationFailure(response.ok ? 502 : response.status, 'resend', payload?.code) });
        return;
      }
      setCode('');
      cooldown.start(registrationRetrySeconds(response, payload));
      setNotice('Solicitud recibida. Si recibes un nuevo código de registro, usa sólo el más reciente. Revisa también spam; no se enviará otro automáticamente.');
    } catch {
      if (!currentRequest(operation)) return;
      cooldown.start();
      setErrors({ form: 'No pudimos solicitar el código. Revisa tu conexión e inténtalo otra vez.' });
    } finally {
      finishRequest(operation);
    }
  }

  return (
    <AuthShell activePath="/register" loginHref={loginUrl} registrationHref={registrationUrl(email, hints.referralCode, hints.preferredSide)} eyebrow="Nuevo miembro" title="Tu cuenta, con acceso seguro." layout="long" supportEmail={email}
      description="Crea tu acceso y verifica tu correo. Si ya perteneces a la red, tus posiciones y datos anteriores se conservan; si tu vinculación requiere revisión, deberás completarla antes de entrar."
      visualSrc="/mindbliss/mindbliss-auth-background.png" visualAlt="Arquitectura urbana de Mindbliss">
      <section className="auth-registration-card min-w-0" aria-labelledby="registration-title" aria-busy={isLoading}>
        <div className="mb-6 flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--vp-accent-muted)] text-[var(--vp-accent)]" aria-hidden="true">
            {completed || awaitingAccess ? <CheckCircle2 size={22} /> : step === 'confirm' ? <Mail size={22} /> : <UserPlus size={22} />}
          </span>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--vp-muted)]">{step === 'details' ? 'Paso 1 de 2' : step === 'confirm' ? 'Paso 2 de 2' : awaitingAccess ? 'Acceso pendiente' : step === 'recovered' ? 'Sesión recuperada' : 'Correo verificado'}</p>
            <h2 ref={title} tabIndex={-1} id="registration-title" className="auth-display text-2xl text-[var(--vp-text)]">{step === 'details' ? 'Crear cuenta' : step === 'confirm' ? 'Verifica tu correo' : completed ? (step === 'recovered' ? 'Tu cuenta ya estaba verificada' : 'Correo verificado correctamente') : 'Tu correo ya está verificado'}</h2>
          </div>
        </div>

        {errors.form ? <p ref={feedback} tabIndex={-1} role="alert" className="mb-5 rounded-lg border border-[var(--vp-danger)] p-3 text-sm leading-6 text-[var(--vp-danger)]">{errors.form}</p> : null}
        {notice ? <p role="status" className="mb-5 rounded-lg border border-[var(--vp-accent-border)] p-3 text-sm leading-6 text-[var(--vp-text)]">{notice}</p> : null}

        {step === 'details' ? (
          <form onSubmit={register} noValidate className="space-y-5">
            <RegistrationField id="fullName" name="name" label="Nombre completo" autoComplete="name" required minLength={2} maxLength={120}
              value={form.fullName} onChange={event => update('fullName', event.target.value)} error={errors.fullName} disabled={isLoading} />
            <RegistrationField id="email" name="email" label="Correo electrónico" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required maxLength={254}
              value={form.email} onChange={event => update('email', event.target.value)} error={errors.email} disabled={isLoading}
              helper="Completa tus datos y solicita el código por correo. Verifica tu correo con ese código; no necesitas contraseña para este paso. Si ya tienes cuenta, usa tu correo de siempre para iniciar sesión." />
            {emailSuggestion ? <button type="button" onClick={() => update('email', emailSuggestion)} disabled={isLoading} className="min-h-10 text-left text-sm underline text-[var(--vp-text)]">¿Quisiste escribir {emailSuggestion}?</button> : null}
            <details ref={contactDetails} className="min-w-0 rounded-lg border border-[var(--vp-border)] p-4">
              <summary className="min-h-11 cursor-pointer text-sm font-semibold leading-6 text-[var(--vp-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--vp-accent)]">Agregar teléfono o WhatsApp (opcional)</summary>
              <fieldset className="mt-4 min-w-0 space-y-4">
                <legend className="px-1 text-sm font-semibold text-[var(--vp-text)]">Contacto opcional</legend>
                <p id="contact-purpose" className="text-sm leading-6 text-[var(--vp-muted)]">Estos datos se guardan en tu perfil, sin validar el teléfono ni enviar mensajes. Sólo verificaremos tu correo; añadir un número no autoriza publicidad.</p>
                <ContactPhoneField id="contactPhone" label="Teléfono" value={form.contactPhone} onChange={value => update('contactPhone', value)} error={errors.contactPhone} disabled={isLoading} />
                <label htmlFor="whatsappSameAsPhone" className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-[var(--vp-text)]">
                  <input id="whatsappSameAsPhone" name="whatsappSameAsPhone" type="checkbox" checked={form.whatsappSameAsPhone} disabled={isLoading}
                    onChange={event => update('whatsappSameAsPhone', event.target.checked)} aria-describedby="contact-purpose" className="mt-1 h-5 w-5 shrink-0 accent-[var(--vp-accent)]" />
                  Mi WhatsApp usa el mismo número de teléfono.
                </label>
                {form.whatsappSameAsPhone ? <p role="status" className="text-sm leading-6 text-[var(--vp-muted)]">Guardaremos el teléfono indicado también como tu contacto de WhatsApp.</p>
                  : <ContactPhoneField id="contactWhatsapp" label="WhatsApp" value={form.contactWhatsapp} onChange={value => update('contactWhatsapp', value)} error={errors.contactWhatsapp} disabled={isLoading} />}
              </fieldset>
            </details>
            {hints.referralCode ? <p className="rounded-lg border border-[var(--vp-border)] p-3 text-sm leading-6 text-[var(--vp-muted)]">Referencia recibida: <span className="break-all text-[var(--vp-text)]">{hints.referralCode}</span>. Se revisará al vincular tu cuenta; no asigna automáticamente una posición en la red.</p> : null}
            <div>
              <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-[var(--vp-text)]" htmlFor="acceptsPrivacy">
                <input id="acceptsPrivacy" name="acceptsPrivacy" type="checkbox" required checked={form.acceptsPrivacy} disabled={isLoading}
                  onChange={event => update('acceptsPrivacy', event.target.checked)} aria-invalid={Boolean(errors.acceptsPrivacy)} aria-describedby={errors.acceptsPrivacy ? 'acceptsPrivacy-error' : undefined}
                  className="mt-1 h-5 w-5 shrink-0 accent-[var(--vp-accent)]" />
                Autorizo el tratamiento de mis datos para gestionar mi cuenta y verificar mi identidad.
              </label>
              {errors.acceptsPrivacy ? <p id="acceptsPrivacy-error" className="mt-2 text-sm text-[var(--vp-danger)]">{errors.acceptsPrivacy}</p> : null}
            </div>
            <RegistrationButton type="submit" disabled={isLoading || cooldown.active} loading={loading === 'register'}>{loading === 'register' ? 'Creando cuenta…' : cooldown.active ? cooldown.label : 'Crear cuenta y verificar correo'}</RegistrationButton>
            <button type="button" disabled={isLoading} onClick={() => {
              if (!email) { setErrors({ email: 'Ingresa el correo con el que solicitaste el registro.' }); document.getElementById('email')?.focus(); return; }
              setErrors({}); setStep('confirm'); setNotice('Introduce el código de tu registro o solicítalo con el botón de abajo. No se enviará ningún correo automáticamente.');
            }} className="min-h-11 w-full text-sm text-[var(--vp-text)] underline">Ya solicité mi registro: verificar correo</button>
          </form>
        ) : step === 'confirm' ? (
          <form onSubmit={confirm} noValidate className="space-y-5">
            <p className="break-words text-sm leading-6 text-[var(--vp-muted)]">Ingresa el código de verificación de <strong className="text-[var(--vp-text)]">{email}</strong> cuando lo recibas. No compartas este código con nadie.</p>
            <RegistrationField id="code" name="one-time-code" label="Código de 6 dígitos" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required maxLength={6}
              value={code} onChange={event => { setCode(event.target.value.replace(/\D/g, '').slice(0, 6)); setErrors({}); }} error={errors.code} disabled={isLoading}
              helper="Usa los 6 dígitos del código más reciente de este registro: vence en 5 minutos y permite hasta 3 intentos por código. No uses un código de inicio de sesión o de recuperación."
              inputRef={codeInput} />
            <RegistrationButton type="submit" disabled={isLoading || code.length !== 6} loading={loading === 'confirm'}>{loading === 'confirm' ? 'Verificando…' : 'Verificar correo'}</RegistrationButton>
            <button type="button" onClick={resend} disabled={isLoading || cooldown.active} className="min-h-12 w-full rounded-lg border border-[var(--vp-border)] px-3 text-sm font-semibold text-[var(--vp-text)] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--vp-accent)]">
              {loading === 'resend' ? 'Solicitando código…' : cooldown.active ? cooldown.label : 'Solicitar otro código'}
            </button>
            <p className="text-sm leading-6 text-[var(--vp-muted)]">Si no lo ves, revisa spam o correo no deseado. El reenvío es manual: espera a que termine el contador; entre solicitudes deben pasar al menos 5 minutos y la espera puede ser mayor. Cambiar de pantalla no envía correos ni evita los límites.</p>
            <button type="button" disabled={isLoading} onClick={() => { setStep('details'); setCode(''); setErrors({}); setNotice('Corrige tus datos y vuelve a solicitar el registro. Si la cuenta ya existe, utiliza el acceso.'); }}
              className="inline-flex min-h-11 items-center gap-2 text-sm text-[var(--vp-text)] underline"><ArrowLeft size={15} aria-hidden="true" />Corregir mis datos</button>
          </form>
        ) : awaitingAccess ? (
          <div className="space-y-5" role="status" aria-live="polite" aria-atomic="true">
            <p className="text-sm leading-7 text-[var(--vp-text)]">El registro ya verificó tu correo, pero falta completar el acceso. No vuelvas a usar ese código ni te registres otra vez.</p>
            <Link href={loginUrl} className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-[var(--vp-accent)] px-4 font-bold text-[var(--vp-shell)]">Entrar de forma segura</Link>
            <p className="text-sm leading-7 text-[var(--vp-muted)]">Solicita un código de acceso en la siguiente pantalla. Es diferente del código de registro. No enviaremos correos automáticamente; respeta el contador si aparece.</p>
          </div>
        ) : (
          <div className="space-y-5" role="status" aria-live="polite" aria-atomic="true">
            <p className="text-sm leading-7 text-[var(--vp-text)]">{step === 'recovered'
              ? 'Tu cuenta ya estaba verificada. Recuperamos tu sesión activa sin volver a usar el código ni enviar otro correo.'
              : 'El correo está verificado. No necesitas solicitar otro código para continuar.'}</p>
            {errors.form ? <p role="alert" className="text-sm leading-6 text-[var(--vp-danger)]">{errors.form}</p> : null}
            <p className="text-sm leading-7 text-[var(--vp-muted)]">Abriendo tu panel… El servidor comprobará tu sesión y tu acceso a la red. Si no se abre automáticamente, usa «Continuar al panel».</p>
            <p className="text-sm leading-7 text-[var(--vp-muted)]">Verificar tu correo no concede por sí solo acceso a saldos ni a cuentas antiguas de la red. Si tu vinculación requiere revisión, debe aprobarse antes de entrar.</p>
            <a href="/dashboard" className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-[var(--vp-accent)] px-4 font-bold text-[var(--vp-shell)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--vp-accent)]">Continuar al panel</a>
            <p className="text-sm leading-7 text-[var(--vp-muted)]">Puedes seguir entrando con códigos por correo, sin contraseña. Para crear tu primera contraseña o cambiarla, abre recuperación y verifica un nuevo código de recuperación; el código de registro no sirve para ese proceso.</p>
            <Link href="/forgot-password" className="inline-flex min-h-12 w-full items-center justify-center rounded-lg border border-[var(--vp-border)] px-4 font-semibold text-[var(--vp-text)]">Crear o cambiar contraseña (opcional)</Link>
          </div>
        )}

        {!completed && !awaitingAccess ? <p className="mt-6 border-t border-[var(--vp-border)] pt-5 text-sm leading-6 text-[var(--vp-muted)]">¿Ya tienes cuenta? <Link href={loginUrl} className="font-bold text-[var(--vp-text)] underline">Entrar de forma segura</Link>. No cambies tu correo ni vuelvas a registrarte para crear o cambiar tu contraseña.</p> : null}
      </section>
    </AuthShell>
  );
}
