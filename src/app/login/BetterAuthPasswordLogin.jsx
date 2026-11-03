'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { RegistrationButton, RegistrationField, RegistrationPassword } from '../register/RegistrationFields';
import { betterAuthPasswordRequest, betterAuthPasswordFailure, verifiedEmailSignIn } from './better-auth-login.mjs';
import { registrationRequired, registrationRedirect, registrationUrl } from '../register/registration-model.mjs';
import { browserRequestDeadline } from '@/lib/browser-request-deadline.mjs';

export default function BetterAuthPasswordLogin({ email, setEmail, onBusy, onError, onNotice, onVerified, onRegistrationRequired = undefined, rememberReferral, registrationHref = '' }) {
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [fieldErrors, setFieldErrors] = useState(/** @type {Record<string, string>} */ ({}));
  const submitting = useRef(false);
  const pending = useRef(null);
  const emailInput = useRef(null);
  const passwordInput = useRef(null);

  useEffect(() => () => {
    // A browser cancellation is not proof that an upstream sign-in was undone.
    // It only stops this disposed form from continuing or changing its parent.
    pending.current?.abort();
    pending.current = null;
  }, []);

  async function submit(event) {
    event.preventDefault();
    if (submitting.current) return;
    onError('');
    onNotice('');
    setRequiresVerification(false);
    setFieldErrors({});
    let contract;
    try { contract = betterAuthPasswordRequest(email, password); } catch (error) {
      if (error.message === 'invalid_email') {
        setFieldErrors({ email: 'Ingresa un correo electrónico válido.' });
        emailInput.current?.focus();
      } else {
        setFieldErrors({ password: 'Ingresa tu contraseña de hasta 128 caracteres.' });
        passwordInput.current?.focus();
      }
      onError('Ingresa un correo válido y tu contraseña para continuar.');
      return;
    }
    submitting.current = true;
    const controller = new AbortController();
    pending.current = controller;
    setLoading(true);
    onBusy(true);
    const deadline = browserRequestDeadline(controller.signal, 12000);
    try {
      const response = await fetch(contract.path, {
        method: 'POST', credentials: 'same-origin', cache: 'no-store', redirect: 'error',
        signal: deadline.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(contract.body),
      });
      if (controller.signal.aborted || pending.current !== controller) return;
      const payload = await response.json().catch(() => ({}));
      if (controller.signal.aborted || pending.current !== controller) return;
      if (registrationRequired(response.status, payload)) {
        setPassword('');
        rememberReferral(contract.body.email);
        if (onRegistrationRequired) onRegistrationRequired(contract.body.email);
        else window.location.assign(registrationRedirect(contract.body.email, '', '', window));
        return;
      }
      if (!response.ok || !verifiedEmailSignIn(payload, contract.body.email)) {
        setRequiresVerification(payload.code === 'EMAIL_NOT_VERIFIED');
        onError(betterAuthPasswordFailure(response.status, payload.code));
        return;
      }
      setPassword('');
      // Native-session proof is complete; authorization belongs to the server
      // dashboard gate, not another client preflight that can strand sign-in.
      try { rememberReferral(contract.body.email); } catch { /* Optional hint. */ }
      onVerified(contract.body.email);
    } catch {
      if (controller.signal.aborted || pending.current !== controller) return;
      onError('No pudimos conectar con el servicio de acceso. Intenta otra vez.');
    } finally {
      deadline.dispose();
      if (pending.current === controller) {
        pending.current = null;
        submitting.current = false;
        setLoading(false);
        onBusy(false);
      }
    }
  }

  return (
    <form onSubmit={submit} noValidate aria-busy={loading} className="space-y-4">
      <p className="text-sm leading-6 text-[var(--vp-muted)]">Si ya creaste una contraseña de acceso, úsala aquí con el correo original de tu cuenta. También puedes entrar con un código al correo, aunque nunca hayas creado una contraseña. No compartas tu contraseña ni tus códigos.</p>
      <RegistrationField id="password-login-email" inputRef={emailInput} error={fieldErrors.email} name="email" label="Correo electrónico" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required maxLength={254}
        value={email} disabled={loading} onChange={event => { setEmail(event.target.value); setFieldErrors({}); setRequiresVerification(false); onError(''); }} />
      <RegistrationPassword id="password-login-password" inputRef={passwordInput} error={fieldErrors.password} name="password" label="Contraseña" autoComplete="current-password" required maxLength={128}
        value={password} disabled={loading} onChange={event => { setPassword(event.target.value); setFieldErrors({}); onError(''); }} visible={visible} onToggle={() => setVisible(current => !current)} />
      <RegistrationButton type="submit" disabled={loading} loading={loading}>{loading ? 'Comprobando acceso…' : 'Entrar con mi contraseña'}</RegistrationButton>
      <div className="space-y-1 rounded-lg border border-[var(--vp-border)] p-3 text-sm leading-6">
        <p className="m-0 font-bold text-[var(--vp-text)]">¿No tienes contraseña o la olvidaste?</p>
        <Link href="/forgot-password" className="inline-flex min-h-11 items-center font-bold text-[var(--vp-accent)] underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--vp-accent)]">Crear o cambiar contraseña con un código al correo</Link>
        <p className="m-0 text-[var(--vp-muted)]">Usa el correo original de tu cuenta. No necesitas cambiarlo ni crear otra cuenta. En «Crear o cambiar contraseña», solicita el código de recuperación, escríbelo y repite tu nueva contraseña para confirmarla. Los pasos y límites de recuperación se muestran allí; ese código no es el de inicio de sesión.</p>
      </div>
      {requiresVerification ? <Link href={registrationHref || registrationUrl(email, '', '', true)}
        className="inline-flex min-h-11 items-center text-sm text-[var(--vp-text)] underline">Verificar mi correo de registro</Link> : null}
    </form>
  );
}
