'use client';

import Link from 'next/link';
import { CheckCircle2, ShieldCheck, Smartphone } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import AuthShell from '../../_components/AuthShell';
import { useResendCooldown } from '@/lib/useResendCooldown';
import { RegistrationButton, RegistrationField } from '../../register/RegistrationFields';
import { SMS_CONSENT_VERSION, SMS_RESEND_SECONDS, optInPhone, phoneOptInStatus, phoneOptInAcknowledged, phoneOptInFailure, phoneOptInRetrySeconds, requestPhoneOptIn } from './phone-opt-in-model.mjs';

const secondary = 'inline-flex min-h-12 w-full items-center justify-center rounded-lg border border-[var(--vp-border)] px-4 text-sm font-semibold text-[var(--vp-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--vp-accent)] disabled:cursor-not-allowed disabled:opacity-60';

export default function PhoneOptIn() {
  const [status, setStatus] = useState(null);
  const [checking, setChecking] = useState(true);
  const [requiresLogin, setRequiresLogin] = useState(false);
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [pendingPhone, setPendingPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const submitting = useRef(false);
  const mounted = useRef(false);
  const readController = useRef(null);
  const mutationController = useRef(null);
  const codeInput = useRef(null);
  const feedback = useRef(null);
  const cooldown = useResendCooldown(SMS_RESEND_SECONDS);
  const busy = Boolean(loading);

  const refresh = useCallback(async () => {
    readController.current?.abort();
    const controller = new AbortController();
    readController.current = controller;
    setChecking(true);
    setError('');
    try {
      const { response, payload } = await requestPhoneOptIn('status', {}, { signal: controller.signal });
      if (controller.signal.aborted || !mounted.current) return;
      if (!response.ok) {
        setStatus(null);
        setRequiresLogin(response.status === 401);
        setError(phoneOptInFailure(response.status));
        return;
      }
      const current = phoneOptInStatus(payload);
      setStatus(current);
      setRequiresLogin(false);
    } catch {
      if (controller.signal.aborted || !mounted.current) return;
      setStatus(null);
      setError(phoneOptInFailure(503));
    } finally {
      if (!controller.signal.aborted && mounted.current) setChecking(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    return () => { mounted.current = false; readController.current?.abort(); mutationController.current?.abort(); };
  }, [refresh]);

  useEffect(() => { if (pendingPhone) codeInput.current?.focus(); }, [pendingPhone]);
  useEffect(() => { if (error && !checking) feedback.current?.focus(); }, [error, checking]);

  async function mutate(action, input) {
    if (submitting.current) return;
    submitting.current = true;
    readController.current?.abort();
    setChecking(false);
    const controller = new AbortController();
    mutationController.current = controller;
    setLoading(action);
    setError('');
    setNotice('');
    // An uncertain network outcome must not cause an immediate duplicate SMS.
    if (action === 'send') cooldown.start();
    try {
      const { response, payload } = await requestPhoneOptIn(action, input, { signal: controller.signal });
      if (!mounted.current || controller.signal.aborted) return;
      if (!response.ok || !phoneOptInAcknowledged(action, payload)) {
        if (response.status === 429) cooldown.start(phoneOptInRetrySeconds(response, payload));
        if (response.status === 401) { setRequiresLogin(true); setStatus(null); setPendingPhone(''); setCode(''); }
        setError(phoneOptInFailure(response.ok ? 502 : response.status, action));
        return;
      }
      if (action === 'send') {
        setPendingPhone(input.phoneNumber);
        setCode('');
        cooldown.start(phoneOptInRetrySeconds(response, payload));
        setNotice('Solicitud SMS aceptada. Ingresa el código de seis dígitos recibido en ese número. Vence en cinco minutos. No lo compartas.');
      } else {
        setPendingPhone('');
        setCode('');
        setPhone('');
        setConsent(false);
        setConfirmRevoke(false);
        setStatus(null);
        setNotice(action === 'verify' ? 'Teléfono validado y consentimiento SMS registrado. Esto no activa el acceso por SMS ni modifica tu cuenta de la red.' : 'Consentimiento SMS revocado. El acceso por correo se conserva.');
        await refresh();
      }
    } catch {
      if (!mounted.current || controller.signal.aborted) return;
      setError('No pudimos confirmar el resultado. No reenviaremos nada automáticamente. Revisa el estado antes de repetir la operación.');
    } finally {
      submitting.current = false;
      if (mounted.current) setLoading('');
    }
  }

  function send(event) {
    event.preventDefault();
    if (submitting.current || checking || !status?.available || cooldown.active) return;
    const phoneNumber = optInPhone(phone);
    if (!phoneNumber || consent !== true) {
      setError(!phoneNumber ? 'Ingresa un número internacional válido, por ejemplo +573001234567.' : 'Marca la autorización SMS únicamente si deseas validar este número. Es opcional.');
      document.getElementById(!phoneNumber ? 'sms-phone' : 'sms-consent')?.focus();
      return;
    }
    void mutate('send', { phoneNumber, consent: true, consentVersion: SMS_CONSENT_VERSION });
  }

  function verify(event) {
    event.preventDefault();
    if (submitting.current || !status?.available || !pendingPhone) return;
    if (!/^\d{6}$/.test(code)) { setError('Ingresa los seis dígitos del SMS.'); codeInput.current?.focus(); return; }
    void mutate('verify', { phoneNumber: pendingPhone, code });
  }

  return (
    <AuthShell activePath="/account/security" eyebrow="Seguridad opcional" title="Tu teléfono, bajo tu control."
      description="Verifica un número propio sólo si quieres. Los códigos por correo siguen disponibles y esta autorización no incluye publicidad."
      visualSrc="/mindbliss/mindbliss-02.avif" visualAlt="Comunidad Mindbliss Power">
      <section aria-labelledby="phone-opt-in-title" aria-busy={busy || checking} className="rounded-xl border border-[var(--vp-border)] bg-[var(--vp-surface)] p-6 shadow-[var(--vp-shadow)] sm:p-8">
        <div className="mb-5 flex items-start gap-3">
          <Smartphone size={24} className="mt-1 shrink-0 text-[var(--vp-accent)]" aria-hidden="true" />
          <div><h2 id="phone-opt-in-title" className="auth-display text-2xl text-[var(--vp-text)]">Validación SMS opcional</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--vp-muted)]">No es un requisito para registrarte. No vincula saldos, posiciones ni rangos y no habilita un inicio de sesión por SMS.</p></div>
        </div>

        {error ? <p ref={feedback} tabIndex={-1} role="alert" className="mb-5 rounded-lg border border-[var(--vp-danger)] p-3 text-sm leading-6 text-[var(--vp-danger)]">{error}</p> : null}
        {notice ? <p role="status" className="mb-5 rounded-lg border border-[var(--vp-accent-border)] p-3 text-sm leading-6 text-[var(--vp-text)]">{notice}</p> : null}

        {checking ? <p role="status" className="py-4 text-sm text-[var(--vp-muted)]">Comprobando tu sesión y la disponibilidad de SMS…</p>
          : requiresLogin ? <div className="space-y-4"><p className="text-sm leading-6 text-[var(--vp-muted)]">Primero entra con tu correo verificado. Puedes volver a esta página después de iniciar sesión, aunque tu vinculación con la red siga en revisión.</p><Link className={secondary} href="/login?mode=password">Iniciar sesión por correo</Link></div>
          : !status ? <button type="button" className={secondary} disabled={busy} onClick={() => { void refresh(); }}>Consultar estado de nuevo</button>
          : <div className="space-y-5">
            <div className="rounded-lg border border-[var(--vp-border)] p-4 text-sm leading-6 text-[var(--vp-text)]">
              <p className="flex items-start gap-2"><ShieldCheck size={18} className="mt-1 shrink-0" aria-hidden="true" />{status.optedIn ? 'Autorización SMS registrada.' : 'No has autorizado mensajes de validación SMS.'}</p>
              <p className="mt-2">{status.phoneNumberVerified ? <><CheckCircle2 size={16} className="mr-1 inline" aria-hidden="true" />Número verificado: <span className="break-all">{status.phoneNumber}</span>.</> : 'No hay un número verificado para esta cuenta de autenticación.'}</p>
            </div>

            {!status.available ? <p role="status" className="rounded-lg border border-[var(--vp-border)] p-4 text-sm leading-6 text-[var(--vp-muted)]">La validación SMS todavía no está habilitada. No enviaremos mensajes ni activaremos este canal automáticamente. Puedes continuar usando tu correo.</p>
              : pendingPhone ? <form onSubmit={verify} noValidate className="space-y-4">
                <p className="break-words text-sm leading-6 text-[var(--vp-text)]">Código para <strong>{pendingPhone}</strong>. Sólo se verificará este número.</p>
                <RegistrationField id="sms-code" label="Código SMS de seis dígitos" name="one-time-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required maxLength={6} inputRef={codeInput}
                  value={code} onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} disabled={busy} />
                <RegistrationButton type="submit" disabled={busy || code.length !== 6} loading={loading === 'verify'}>{loading === 'verify' ? 'Validando teléfono…' : 'Validar mi teléfono'}</RegistrationButton>
                <button type="button" className={secondary} disabled={busy || cooldown.active} onClick={() => { if (consent) void mutate('send', { phoneNumber: pendingPhone, consent: true, consentVersion: SMS_CONSENT_VERSION }); }}>{cooldown.active ? cooldown.label : 'Solicitar otro SMS'}</button>
                <button type="button" className={secondary} disabled={busy} onClick={() => { setPendingPhone(''); setCode(''); setConsent(false); setError(''); setNotice('Cambiar el número no envía mensajes. Debes autorizar el nuevo número antes de solicitar un código.'); }}>Cambiar número o cancelar</button>
              </form> : <form onSubmit={send} noValidate className="space-y-4">
                <RegistrationField id="sms-phone" label="Número de teléfono internacional" type="tel" name="tel" inputMode="tel" autoComplete="tel" maxLength={40} placeholder="+57 300 123 4567" helper="Incluye + y el código del país. Debes tener acceso a los SMS de este número."
                  value={phone} onChange={event => { setPhone(event.target.value); setConsent(false); }} disabled={busy} />
                <label htmlFor="sms-consent" className="flex min-h-12 cursor-pointer items-start gap-3 rounded-lg border border-[var(--vp-border)] p-3 text-sm leading-6 text-[var(--vp-text)]">
                  <input id="sms-consent" type="checkbox" name="smsConsent" checked={consent} onChange={event => setConsent(event.target.checked)} disabled={busy}
                    className="mt-1 h-5 w-5 shrink-0 accent-[var(--vp-accent)]" />
                  <span>Autorizo recibir un SMS con un código para validar este número y mensajes de autenticación que solicite. Es opcional y puedo revocarlo aquí. No autorizo publicidad ni mensajes por WhatsApp.</span>
                </label>
                <RegistrationButton type="submit" disabled={busy || cooldown.active || !consent || !optInPhone(phone)} loading={loading === 'send'}>{loading === 'send' ? 'Solicitando SMS…' : cooldown.active ? cooldown.label : 'Autorizar y solicitar código SMS'}</RegistrationButton>
              </form>}

            {status.optedIn ? confirmRevoke ? <div className="space-y-3 rounded-lg border border-[var(--vp-border)] p-4">
              <p className="text-sm leading-6 text-[var(--vp-text)]">¿Revocar la autorización SMS? Tu correo y el acceso a tu cuenta no se eliminarán.</p>
              <button type="button" className={secondary} disabled={busy} onClick={() => { void mutate('revoke', {}); }}>{loading === 'revoke' ? 'Revocando…' : 'Sí, revocar autorización SMS'}</button>
              <button type="button" className={secondary} disabled={busy} onClick={() => setConfirmRevoke(false)}>Cancelar</button>
            </div> : <button type="button" className={secondary} disabled={busy} onClick={() => setConfirmRevoke(true)}>Revocar mi autorización SMS</button> : null}
            <button type="button" className={secondary} disabled={busy} onClick={() => { void refresh(); }}>Actualizar estado sin enviar mensajes</button>
          </div>}
        <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-[var(--vp-border)] pt-4 text-sm text-[var(--vp-text)]">
          <Link className="inline-flex min-h-11 items-center underline" href="/login">Continuar sin SMS</Link>
          <Link className="inline-flex min-h-11 items-center underline" href="/dashboard/profile">Volver a mi perfil</Link>
        </div>
      </section>
    </AuthShell>
  );
}
