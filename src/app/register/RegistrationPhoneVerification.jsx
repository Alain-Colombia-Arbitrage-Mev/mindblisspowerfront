'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useResendCooldown } from '@/lib/useResendCooldown';
import { RegistrationButton, RegistrationField } from './RegistrationFields';
import { REGISTRATION_PHONE_CONSENT, REGISTRATION_PHONE_RESEND_SECONDS, registrationPhoneAcknowledged,
  registrationPhoneFailure, registrationPhoneRetrySeconds, requestRegistrationPhone } from './registration-phone-model.mjs';

export default function RegistrationPhoneVerification({ email, phoneNumber, consent, onVerified, onBack }) {
  const [pending, setPending] = useState(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const cooldown = useResendCooldown(REGISTRATION_PHONE_RESEND_SECONDS);
  const alive = useRef(true);
  const inFlight = useRef(null);
  const sequence = useRef(0);
  const identity = useRef('');
  const codeInput = useRef(null);
  const currentIdentity = `${email}\n${phoneNumber}\n${consent === true}`;
  identity.current = currentIdentity;
  const busy = Boolean(loading);

  useEffect(() => {
    alive.current = true;
    sequence.current += 1;
    inFlight.current?.abort();
    inFlight.current = null;
    setPending(null); setCode(''); setLoading(''); setError(''); setNotice('');
    return () => { alive.current = false; sequence.current += 1; inFlight.current?.abort(); inFlight.current = null; };
  }, [email, phoneNumber, consent]);

  useEffect(() => { if (pending) codeInput.current?.focus(); }, [pending]);

  async function mutate(action) {
    if (inFlight.current || (action === 'send' && cooldown.active) || consent !== true) return;
    if (action === 'verify' && (!pending || !/^\d{6}$/.test(code))) {
      setError('Ingresa los seis dígitos del SMS.'); codeInput.current?.focus(); return;
    }
    if (action === 'verify' && Date.now() >= pending.expiresAt) {
      setPending(null); setCode(''); setError('El código SMS venció. Solicita uno nuevo para validar tu teléfono.'); return;
    }
    const controller = new AbortController();
    inFlight.current = controller;
    const operation = ++sequence.current;
    const contact = currentIdentity;
    const active = () => alive.current && sequence.current === operation && identity.current === contact && !controller.signal.aborted;
    const input = action === 'send' ? { email, phoneNumber, consent: true, consentVersion: REGISTRATION_PHONE_CONSENT }
      : { email, phoneNumber, flowId: pending.flowId, code };
    setLoading(action); setError(''); setNotice('');
    if (action === 'send') { cooldown.start(); setPending(null); setCode(''); }
    try {
      const { response, payload } = await requestRegistrationPhone(action, input, { signal: controller.signal });
      if (!active()) return;
      if (!response.ok || !registrationPhoneAcknowledged(action, payload, input)) {
        if (response.status === 429 || action === 'send') cooldown.start(registrationPhoneRetrySeconds(response, payload));
        setError(registrationPhoneFailure(response.ok ? 502 : response.status, action));
        return;
      }
      if (action === 'send') {
        setPending({ flowId: payload.flowId, expiresAt: Date.now() + payload.expiresIn * 1000 });
        cooldown.start(registrationPhoneRetrySeconds(response, payload));
        setNotice('Solicitud SMS aceptada. Introduce el código de seis dígitos; vence en cinco minutos. No lo compartas.');
      } else {
        setCode(''); setPending(null);
        // This bounded acknowledgement is presentation only. Account creation
        // must validate the fresh registration proof in its HttpOnly cookie.
        onVerified({ email, phoneNumber, verifiedAt: Date.now() });
      }
    } catch {
      if (active()) setError(action === 'send' ? 'No pudimos confirmar el envío. No enviaremos otro SMS automáticamente. Espera antes de reintentar.'
        : 'No pudimos confirmar la validación. Revisa tu conexión e intenta de nuevo.');
    } finally {
      if (active()) { inFlight.current = null; setLoading(''); }
    }
  }

  function back() {
    sequence.current += 1; inFlight.current?.abort(); inFlight.current = null; setCode(''); onBack();
  }

  return <div className="space-y-5" aria-busy={busy}>
    <p className="break-words text-sm leading-6 text-[var(--vp-muted)]">Valida <strong className="text-[var(--vp-text)]">{phoneNumber}</strong> para el registro de <strong className="text-[var(--vp-text)]">{email}</strong>. El inicio de sesión seguirá usando tu correo; no habilita acceso por SMS.</p>
    {error ? <p role="alert" className="rounded-lg border border-[var(--vp-danger)] p-3 text-sm leading-6 text-[var(--vp-danger)]">{error}</p> : null}
    {notice ? <p role="status" className="rounded-lg border border-[var(--vp-accent-border)] p-3 text-sm leading-6 text-[var(--vp-text)]">{notice}</p> : null}
    {pending ? <form onSubmit={event => { event.preventDefault(); void mutate('verify'); }} noValidate className="space-y-5">
      <RegistrationField id="registration-phone-code" name="one-time-code" label="Código SMS de seis dígitos" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required maxLength={6}
        value={code} onChange={event => { setCode(event.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }} disabled={busy} inputRef={codeInput} />
      <RegistrationButton type="submit" disabled={busy || code.length !== 6} loading={loading === 'verify'}>{loading === 'verify' ? 'Validando teléfono…' : 'Validar teléfono para el registro'}</RegistrationButton>
      <button type="button" disabled={busy || cooldown.active} onClick={() => { void mutate('send'); }} className="min-h-12 w-full rounded-lg border border-[var(--vp-border)] px-3 text-sm font-semibold text-[var(--vp-text)] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--vp-accent)]">{cooldown.active ? cooldown.label : 'Solicitar otro código SMS'}</button>
    </form> : <RegistrationButton type="button" disabled={busy || cooldown.active || consent !== true} loading={loading === 'send'} onClick={() => { void mutate('send'); }}>{loading === 'send' ? 'Solicitando SMS…' : cooldown.active ? cooldown.label : 'Enviar código SMS para validar mi teléfono'}</RegistrationButton>}
    <p className="text-sm leading-6 text-[var(--vp-muted)]">Sólo enviaremos el código de registro que solicites. No autorizas publicidad ni WhatsApp. Validar el teléfono no vincula cuentas anteriores, posiciones, rangos ni saldos.</p>
    <button type="button" onClick={back} className="inline-flex min-h-11 items-center gap-2 text-sm text-[var(--vp-text)] underline"><ArrowLeft size={15} aria-hidden="true" />Corregir mis datos</button>
  </div>;
}
