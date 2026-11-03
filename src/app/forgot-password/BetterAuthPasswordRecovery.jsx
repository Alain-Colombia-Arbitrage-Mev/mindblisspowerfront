'use client';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useResendCooldown } from '@/lib/useResendCooldown';
import { RegistrationButton, RegistrationField, RegistrationPassword } from '../register/RegistrationFields';
import {
  PASSWORD_RECOVERY_RESEND_SECONDS, PASSWORD_RECOVERY_NOTICE, PASSWORD_RECOVERY_UNCONFIRMED, PASSWORD_RECOVERY_LIMIT_NOTICE,
  passwordRecoveryEmail, passwordRecoveryErrors, passwordRecoveryRequest, passwordRecoveryAcknowledged,
  passwordRecoveryRetrySeconds, passwordRecoveryConfirmationRetrySeconds, passwordRecoveryWaitLabel, passwordRecoveryFailure,
} from './password-recovery-model.mjs';

// Recovery is the same flow with or without an existing password. The browser
// never probes credential/account existence and never installs a session here.
export default function BetterAuthPasswordRecovery({ initialEmail = '' }) {
  const [email, setEmail] = useState(() => passwordRecoveryEmail(initialEmail));
  const [recipient, setRecipient] = useState('');
  const [step, setStep] = useState('request');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [visiblePassword, setVisiblePassword] = useState(false);
  const [visibleConfirmation, setVisibleConfirmation] = useState(false);
  const [errors, setErrors] = useState(/** @type {Record<string, string>} */ ({}));
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState('');
  const submitting = useRef(false);
  const pending = useRef(null);
  const feedback = useRef(null);
  const emailInput = useRef(null);
  const codeInput = useRef(null);
  const passwordInput = useRef(null);
  const confirmationInput = useRef(null);
  const title = useRef(null);
  const cooldownScope = passwordRecoveryEmail(recipient || email);
  const cooldown = useResendCooldown(PASSWORD_RECOVERY_RESEND_SECONDS, `better-auth:password-recovery:send:${cooldownScope}`);
  const confirmationCooldown = useResendCooldown(60, `better-auth:password-recovery:confirm:${cooldownScope}`);
  const resendLabel = passwordRecoveryWaitLabel(cooldown.remaining) || cooldown.label;
  const confirmationLabel = passwordRecoveryWaitLabel(confirmationCooldown.remaining, 'confirm')
    || confirmationCooldown.label.replace(/^Reenviar/, 'Validar de nuevo');
  const busy = Boolean(loading);

  useEffect(() => () => {
    pending.current?.abort();
    pending.current = null;
  }, []);

  useEffect(() => {
    if (step === 'confirm') codeInput.current?.focus();
    if (step === 'done') title.current?.focus();
  }, [step]);

  useEffect(() => {
    if (errors.form) feedback.current?.focus();
  }, [errors.form]);

  function clearSecrets() {
    setOtp(''); setPassword(''); setConfirmPassword('');
    setVisiblePassword(false); setVisibleConfirmation(false);
  }

  function focusInvalid(validation) {
    const fields = { email: emailInput, otp: codeInput, password: passwordInput, confirmPassword: confirmationInput };
    fields[Object.keys(validation)[0]]?.current?.focus();
  }

  function update(field, value) {
    if (busy || submitting.current) return;
    if (field === 'email') setEmail(value);
    if (field === 'otp') setOtp(value);
    if (field === 'password') setPassword(value);
    if (field === 'confirmPassword') setConfirmPassword(value);
    setErrors(current => {
      const next = { ...current }; delete next[field]; delete next.form; return next;
    });
  }

  async function post(contract, controller, action) {
    const response = await fetch(contract.path, {
      method: 'POST', credentials: 'omit', cache: 'no-store', redirect: 'error',
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(action === 'request' ? 30000 : 12000)]),
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(contract.body),
    });
    return { response, payload: await response.json().catch(() => ({})) };
  }

  async function requestCode(event, resend = false) {
    event?.preventDefault();
    if (submitting.current || busy || cooldown.active || (resend && step !== 'confirm')) return;
    const selectedEmail = resend ? recipient : passwordRecoveryEmail(email);
    const validation = passwordRecoveryErrors({ email: selectedEmail }, 'request');
    setErrors(validation); setNotice('');
    if (Object.keys(validation).length) { focusInvalid(validation); return; }
    const contract = passwordRecoveryRequest('request', { email: selectedEmail });
    const controller = new AbortController();
    submitting.current = true; pending.current = controller; setLoading('request');
    try {
      const { response, payload } = await post(contract, controller, 'request');
      if (controller.signal.aborted || pending.current !== controller) return;
      if (response.status === 200 && passwordRecoveryAcknowledged(payload)) {
        setEmail(selectedEmail); setRecipient(selectedEmail); clearSecrets(); setStep('confirm');
        cooldown.start(passwordRecoveryRetrySeconds(response, payload));
        setNotice(PASSWORD_RECOVERY_NOTICE);
      } else if (response.status === 429 || response.status >= 500 || response.ok) {
        // A deadline or rejected send may follow a delivered code. Keep its
        // original recipient and entry available without an automatic retry.
        setEmail(selectedEmail); setRecipient(selectedEmail); clearSecrets(); setStep('confirm');
        cooldown.start(passwordRecoveryRetrySeconds(response, payload));
        setErrors({ form: response.status === 429
          ? `${passwordRecoveryFailure(429, 'request')} ${PASSWORD_RECOVERY_UNCONFIRMED}`
          : PASSWORD_RECOVERY_UNCONFIRMED });
      } else setErrors({ form: passwordRecoveryFailure(response.status, 'request') });
    } catch {
      if (controller.signal.aborted || pending.current !== controller) return;
      setEmail(selectedEmail); setRecipient(selectedEmail); clearSecrets(); setStep('confirm');
      cooldown.start(); setErrors({ form: PASSWORD_RECOVERY_UNCONFIRMED });
    } finally {
      if (pending.current === controller) {
        pending.current = null; submitting.current = false; setLoading('');
      }
    }
  }

  async function confirm(event) {
    event.preventDefault();
    if (submitting.current || busy || confirmationCooldown.active || step !== 'confirm') return;
    const input = { email: recipient, otp, password, confirmPassword };
    const validation = passwordRecoveryErrors(input);
    setErrors(validation); setNotice('');
    if (Object.keys(validation).length) { focusInvalid(validation); return; }
    const contract = passwordRecoveryRequest('confirm', input);
    const controller = new AbortController();
    submitting.current = true; pending.current = controller; setLoading('confirm');
    try {
      const { response, payload } = await post(contract, controller, 'confirm');
      if (controller.signal.aborted || pending.current !== controller) return;
      if (response.status !== 200 || !passwordRecoveryAcknowledged(payload)) {
        if (response.status === 429) confirmationCooldown.start(passwordRecoveryConfirmationRetrySeconds(response, payload));
        setErrors({ form: passwordRecoveryFailure(response.ok ? 502 : response.status) });
        return;
      }
      clearSecrets(); setStep('done');
    } catch {
      if (controller.signal.aborted || pending.current !== controller) return;
      setErrors({ form: passwordRecoveryFailure(503) });
    } finally {
      if (pending.current === controller) {
        pending.current = null; submitting.current = false; setLoading('');
      }
    }
  }

  function correctEmail() {
    if (busy || submitting.current) return;
    clearSecrets(); setRecipient(''); setStep('request'); setErrors({}); setNotice('');
  }

  if (step === 'done') return (
    <section role="status" aria-live="polite" aria-atomic="true" className="space-y-4">
      <CheckCircle2 size={28} aria-hidden="true" className="text-[var(--vp-accent)]" />
      <h3 ref={title} tabIndex={-1} className="text-xl font-bold text-[var(--vp-text)]">Contraseña actualizada</h3>
      <p className="text-sm leading-6 text-[var(--vp-muted)]">Ya puedes iniciar sesión con tu correo y la nueva contraseña. Por seguridad, las sesiones anteriores se cerraron.</p>
      <p className="text-sm leading-6 text-[var(--vp-muted)]">Este cambio no modifica tu correo, tu posición en la red ni los permisos de tu cuenta.</p>
      <Link href="/login?mode=password" className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-[var(--vp-accent)] px-4 py-3 text-base font-bold text-[var(--vp-shell)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--vp-accent)]">Ir a iniciar sesión</Link>
    </section>
  );

  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-[var(--vp-muted)]">Si ya tienes una cuenta, puedes crear tu primera contraseña de acceso o reemplazar la anterior. Debes comprobar el correo original con un código de recuperación de 6 dígitos que vence en 5 minutos; tu contraseña antigua no es necesaria.</p>
      <ol aria-label="Pasos para crear o cambiar la contraseña" className="list-inside list-decimal space-y-1 rounded-lg border border-[var(--vp-border)] p-3 text-sm leading-6 text-[var(--vp-muted)]">
        <li>Solicita el código al correo que ya está registrado en tu cuenta y revisa esa bandeja, incluido spam.</li>
        <li>Escribe el código de recuperación más reciente, elige tu nueva contraseña y repítela para confirmarla.</li>
        <li>Guarda los cambios e inicia sesión con ese mismo correo.</li>
      </ol>
      <p className="text-sm leading-6 font-bold text-[var(--vp-text)]">No necesitas cambiar tu correo ni volver a registrarte.</p>
      <p className="text-xs leading-5 text-[var(--vp-muted)]">{PASSWORD_RECOVERY_LIMIT_NOTICE}</p>
      {errors.form ? <p ref={feedback} tabIndex={-1} role="alert" aria-live="assertive" className="rounded-lg border border-[var(--vp-danger-border)] bg-[var(--vp-danger-muted)] p-3 text-sm text-[var(--vp-danger)]">{errors.form}</p> : null}
      {notice ? <p role="status" aria-live="polite" aria-atomic="true" className="rounded-lg border border-[var(--vp-accent-border)] bg-[var(--vp-accent-muted)] p-3 text-sm text-[var(--vp-text)]">{notice}</p> : null}
      <form onSubmit={step === 'request' ? requestCode : confirm} noValidate aria-busy={busy} className="space-y-4">
        <RegistrationField id="recovery-email" name="email" label="Correo original de la cuenta" inputRef={emailInput} type="email" autoComplete="email" autoCapitalize="none" spellCheck={false}
          required maxLength={254} value={step === 'confirm' ? recipient : email} disabled={busy} readOnly={step === 'confirm'}
          error={errors.email} onChange={event => update('email', event.target.value)} />
        {step === 'confirm' ? <>
          <RegistrationField id="recovery-otp" name="otp" label="Código de recuperación" inputRef={codeInput} autoComplete="one-time-code" inputMode="numeric"
            required minLength={6} maxLength={6} pattern="[0-9]{6}" value={otp} disabled={busy} error={errors.otp}
            onChange={event => update('otp', event.target.value)} helper="Usa los 6 dígitos del código de recuperación más reciente. Vence en 5 minutos y permite hasta 3 intentos; no uses un código de inicio de sesión o registro ni lo compartas." />
          <RegistrationPassword id="recovery-password" name="password" label="Nueva contraseña" inputRef={passwordInput} autoComplete="new-password" required minLength={12} maxLength={128}
            value={password} disabled={busy} error={errors.password} helper="Entre 12 y 128 caracteres. Puedes usar una frase larga."
            visible={visiblePassword} onToggle={() => setVisiblePassword(current => !current)} onChange={event => update('password', event.target.value)} />
          <RegistrationPassword id="recovery-confirm-password" name="confirmPassword" label="Repite la nueva contraseña" inputRef={confirmationInput} autoComplete="new-password" required minLength={12} maxLength={128}
            value={confirmPassword} disabled={busy} error={errors.confirmPassword} visible={visibleConfirmation}
            onToggle={() => setVisibleConfirmation(current => !current)} onChange={event => update('confirmPassword', event.target.value)} />
        </> : null}
        <RegistrationButton type="submit" disabled={busy || (step === 'request' ? cooldown.active : confirmationCooldown.active)} loading={busy}>
          {busy ? loading === 'confirm' ? 'Guardando contraseña…' : 'Solicitando código…'
            : step === 'confirm' ? confirmationCooldown.active ? confirmationLabel : 'Guardar nueva contraseña'
              : cooldown.active ? resendLabel : 'Solicitar código por correo'}
        </RegistrationButton>
      </form>
      {step === 'confirm' ? <div className="grid gap-2 sm:grid-cols-2">
        <button type="button" disabled={busy} onClick={correctEmail} className="min-h-11 rounded-lg border border-[var(--vp-border)] px-3 text-sm font-semibold text-[var(--vp-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--vp-accent)] disabled:opacity-60">Volver al paso del correo</button>
        <button type="button" disabled={busy || cooldown.active} onClick={event => requestCode(event, true)} className="min-h-11 rounded-lg border border-[var(--vp-border)] px-3 text-sm font-semibold text-[var(--vp-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--vp-accent)] disabled:opacity-60">
          {cooldown.active ? resendLabel : 'Solicitar otro código'}
        </button>
      </div> : null}
      <p className="text-xs leading-5 text-[var(--vp-muted)]">Corregir el correo en este formulario no cambia el correo registrado de tu cuenta. Si ya no tienes acceso a esa bandeja, contacta al soporte. No compartas contraseñas ni códigos.</p>
    </div>
  );
}
