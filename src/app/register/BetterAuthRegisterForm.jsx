'use client';

import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Mail, UserPlus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import AuthShell from '../_components/AuthShell';
import { useResendCooldown, suggestEmailFix } from '@/lib/useResendCooldown';
import { bindReferralCodeToEmail } from '@/lib/referral-attribution';
import { RegistrationButton, RegistrationField, RegistrationPassword } from './RegistrationFields';
import ContactPhoneField from './ContactPhoneField';
import { initialContactPhone, registrationContactValues } from './contact-phone-model.mjs';
import { REGISTRATION_RESEND_SECONDS, registrationEmail, registrationErrors, registrationFailure, registrationHints, registrationLoginUrl, registrationRetrySeconds, registrationAcknowledged } from './registration-model.mjs';

const initialForm = { fullName: '', email: '', password: '', confirmPassword: '', acceptsPrivacy: false,
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
  const [visiblePassword, setVisiblePassword] = useState(false);
  const [visibleConfirmation, setVisibleConfirmation] = useState(false);
  const submitting = useRef(false);
  const feedback = useRef(null);
  const codeInput = useRef(null);
  const title = useRef(null);
  const cooldown = useResendCooldown(REGISTRATION_RESEND_SECONDS);
  const isLoading = Boolean(loading);
  const email = registrationEmail(form.email);
  const loginUrl = registrationLoginUrl(email, hints.referralCode, hints.preferredSide);
  const emailSuggestion = suggestEmailFix(form.email);

  useEffect(() => {
    if (step === 'confirm') codeInput.current?.focus();
    if (step === 'verified') title.current?.focus();
  }, [step]);

  useEffect(() => {
    if (errors.form) feedback.current?.focus();
  }, [errors.form]);

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

  async function post(path, body) {
    const response = await fetch(path, {
      method: 'POST', credentials: 'same-origin', cache: 'no-store', redirect: 'error',
      signal: AbortSignal.timeout(12000), headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    return { response, payload: await response.json().catch(() => ({})) };
  }

  async function register(event) {
    event.preventDefault();
    if (submitting.current) return;
    setNotice('');
    const contacts = registrationContactValues(form);
    const nextErrors = { ...registrationErrors(form), ...contacts.errors };
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      document.getElementById(Object.keys(nextErrors)[0])?.focus();
      return;
    }
    submitting.current = true;
    setLoading('register');
    try {
      const { response, payload } = await post('/api/auth/register', {
        fullName: form.fullName.trim(), email, password: form.password, acceptsPrivacy: true,
        referralCode: hints.referralCode, preferredSide: hints.preferredSide,
        ...contacts.values,
      });
      if (!response.ok || !registrationAcknowledged('register', payload, email)) {
        if (response.status === 429 || response.status >= 500 || response.ok) cooldown.start(registrationRetrySeconds(response, payload || {}));
        setErrors({ form: registrationFailure(response.ok ? 502 : response.status, 'register', payload?.code) });
        return;
      }
      if (hints.referralCode) bindReferralCodeToEmail(email, hints.referralCode);
      // Clear credentials from component memory after the server accepts them.
      setForm(current => ({ ...current, email, password: '', confirmPassword: '' }));
      setCode('');
      setStep('confirm');
      cooldown.start(registrationRetrySeconds(response, payload));
      setNotice('Si el registro se puede completar con este correo, recibirás un código. Revisa también spam o correo no deseado.');
    } catch {
      cooldown.start();
      setErrors({ form: 'No pudimos confirmar el resultado. No enviaremos otro correo automáticamente. Si recibes el código, usa «Ya solicité mi registro»; de lo contrario espera antes de reintentar.' });
    } finally {
      submitting.current = false;
      setLoading('');
    }
  }

  async function confirm(event) {
    event.preventDefault();
    if (submitting.current) return;
    setErrors({});
    setNotice('');
    if (!/^\d{6}$/.test(code)) {
      setErrors({ code: 'Ingresa los 6 dígitos del correo, sin espacios.' });
      codeInput.current?.focus();
      return;
    }
    submitting.current = true;
    setLoading('confirm');
    try {
      const { response, payload } = await post('/api/auth/register/confirm', { email, code });
      if (!response.ok || !registrationAcknowledged('confirm', payload)) {
        if (response.status === 429) cooldown.start(registrationRetrySeconds(response, payload));
        setErrors({ form: registrationFailure(response.ok ? 502 : response.status, 'confirm', payload?.code) });
        return;
      }
      setCode('');
      setStep('verified');
    } catch {
      setErrors({ form: 'No pudimos verificar el código. Revisa tu conexión e inténtalo otra vez.' });
    } finally {
      submitting.current = false;
      setLoading('');
    }
  }

  async function resend() {
    if (submitting.current || cooldown.active) return;
    submitting.current = true;
    setLoading('resend');
    setErrors({});
    setNotice('');
    cooldown.start();
    try {
      const { response, payload } = await post('/api/auth/register/confirm', { email, resend: true });
      if (!response.ok || !registrationAcknowledged('resend', payload)) {
        if (response.status === 429) cooldown.start(registrationRetrySeconds(response, payload));
        setErrors({ form: registrationFailure(response.ok ? 502 : response.status, 'resend', payload?.code) });
        return;
      }
      setCode('');
      cooldown.start(registrationRetrySeconds(response, payload));
      setNotice('Solicitud recibida. Si corresponde, recibirás un código en ese correo. Usa el código más reciente.');
    } catch {
      cooldown.start();
      setErrors({ form: 'No pudimos solicitar el código. Revisa tu conexión e inténtalo otra vez.' });
    } finally {
      submitting.current = false;
      setLoading('');
    }
  }

  return (
    <AuthShell activePath="/register" eyebrow="Nuevo miembro" title="Tu cuenta, con acceso seguro."
      description="Crea tu acceso y verifica tu correo. Si ya perteneces a la red, tus posiciones y datos anteriores se conservan y su vinculación requiere revisión."
      visualSrc="/mindbliss/mindbliss-01.avif" visualAlt="Equipo Mindbliss Power">
      <section className="rounded-xl border border-[var(--vp-border)] bg-[var(--vp-surface)] p-6 shadow-[var(--vp-shadow)] sm:p-8" aria-labelledby="registration-title" aria-busy={isLoading}>
        <div className="mb-6 flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--vp-accent-muted)] text-[var(--vp-accent)]" aria-hidden="true">
            {step === 'verified' ? <CheckCircle2 size={22} /> : step === 'confirm' ? <Mail size={22} /> : <UserPlus size={22} />}
          </span>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--vp-muted)]">{step === 'details' ? 'Paso 1 de 2' : step === 'confirm' ? 'Paso 2 de 2' : 'Correo verificado'}</p>
            <h2 ref={title} tabIndex={-1} id="registration-title" className="auth-display text-2xl text-[var(--vp-text)]">{step === 'details' ? 'Crear cuenta' : step === 'confirm' ? 'Verifica tu correo' : 'Continúa al acceso'}</h2>
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
              helper="Usa un correo propio al que tengas acceso. Recibirás allí tu código de verificación." />
            {emailSuggestion ? <button type="button" onClick={() => update('email', emailSuggestion)} disabled={isLoading} className="min-h-10 text-left text-sm underline text-[var(--vp-text)]">¿Quisiste escribir {emailSuggestion}?</button> : null}
            <fieldset className="min-w-0 space-y-4 rounded-lg border border-[var(--vp-border)] p-4">
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
            <RegistrationPassword id="password" name="new-password" label="Contraseña" autoComplete="new-password" required minLength={12} maxLength={128}
              value={form.password} onChange={event => update('password', event.target.value)} error={errors.password} helper="Entre 12 y 128 caracteres. Usa una frase larga que no utilices en otros sitios."
              visible={visiblePassword} onToggle={() => setVisiblePassword(value => !value)} disabled={isLoading} />
            <RegistrationPassword id="confirmPassword" name="confirm-password" label="Confirmar contraseña" autoComplete="new-password" required minLength={12} maxLength={128}
              value={form.confirmPassword} onChange={event => update('confirmPassword', event.target.value)} error={errors.confirmPassword}
              visible={visibleConfirmation} onToggle={() => setVisibleConfirmation(value => !value)} disabled={isLoading} />
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
            <p className="break-words text-sm leading-6 text-[var(--vp-muted)]">Ingresa el código enviado a <strong className="text-[var(--vp-text)]">{email}</strong>. No compartas este código con nadie.</p>
            <RegistrationField id="code" name="one-time-code" label="Código de 6 dígitos" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required maxLength={6}
              value={code} onChange={event => { setCode(event.target.value.replace(/\D/g, '').slice(0, 6)); setErrors({}); }} error={errors.code} disabled={isLoading}
              inputRef={codeInput} />
            <RegistrationButton type="submit" disabled={isLoading || code.length !== 6} loading={loading === 'confirm'}>{loading === 'confirm' ? 'Verificando…' : 'Verificar correo'}</RegistrationButton>
            <button type="button" onClick={resend} disabled={isLoading || cooldown.active} className="min-h-12 w-full rounded-lg border border-[var(--vp-border)] px-3 text-sm font-semibold text-[var(--vp-text)] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--vp-accent)]">
              {loading === 'resend' ? 'Solicitando código…' : cooldown.active ? cooldown.label : 'Solicitar otro código'}
            </button>
            <p className="text-sm leading-6 text-[var(--vp-muted)]">Si no lo ves, revisa spam. Espera antes de reenviar para no invalidar el código anterior. Cambiar de pantalla no envía correos.</p>
            <button type="button" disabled={isLoading} onClick={() => { setStep('details'); setCode(''); setErrors({}); setNotice('Corrige tus datos y vuelve a solicitar el registro. Si la cuenta ya existe, utiliza el acceso.'); }}
              className="inline-flex min-h-11 items-center gap-2 text-sm text-[var(--vp-text)] underline"><ArrowLeft size={15} aria-hidden="true" />Corregir mis datos</button>
          </form>
        ) : (
          <div className="space-y-5" role="status">
            <p className="text-sm leading-7 text-[var(--vp-text)]">El correo está verificado. Entra con la contraseña que creaste al registrarte: no necesitas otro código ni esperar para continuar.</p>
            <p className="text-sm leading-7 text-[var(--vp-muted)]">Verificar tu correo no concede acceso a saldos ni a cuentas antiguas de la red. La vinculación requiere aprobación.</p>
            <Link href={loginUrl} className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-[var(--vp-accent)] px-4 font-bold text-[var(--vp-shell)]">Ir al acceso</Link>
          </div>
        )}

        {step !== 'verified' ? <p className="mt-6 border-t border-[var(--vp-border)] pt-5 text-sm leading-6 text-[var(--vp-muted)]">¿Ya tienes cuenta? <Link href={loginUrl} className="font-bold text-[var(--vp-text)] underline">Entrar de forma segura</Link></p> : null}
      </section>
    </AuthShell>
  );
}
