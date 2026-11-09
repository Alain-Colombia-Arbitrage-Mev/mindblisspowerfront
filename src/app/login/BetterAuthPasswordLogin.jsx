'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { RegistrationButton, RegistrationField, RegistrationPassword } from '../register/RegistrationFields';
import { betterAuthPasswordRequest, betterAuthPasswordFailure, verifiedEmailSignIn } from './better-auth-login.mjs';
import { registrationRequired, registrationRedirect, registrationUrl } from '../register/registration-model.mjs';
import { browserRequestDeadline } from '@/lib/browser-request-deadline.mjs';

export default function BetterAuthPasswordLogin({ email, setEmail, onBusy, onError, onNotice, onVerified, onRegistrationRequired = undefined, onUseCode = undefined, rememberReferral, registrationHref = '' }) {
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
    <form onSubmit={submit} noValidate aria-busy={loading} className="auth-password-form">
      <RegistrationField id="password-login-email" inputRef={emailInput} error={fieldErrors.email} name="email" label="Correo electrónico" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required maxLength={254}
        value={email} disabled={loading} onChange={event => { setEmail(event.target.value); setFieldErrors({}); setRequiresVerification(false); onError(''); }} />
      <RegistrationPassword id="password-login-password" inputRef={passwordInput} error={fieldErrors.password} name="password" label="Contraseña" autoComplete="current-password" required maxLength={128}
        value={password} disabled={loading} onChange={event => { setPassword(event.target.value); setFieldErrors({}); onError(''); }} visible={visible} onToggle={() => setVisible(current => !current)} />
      <div className="auth-password-links">
        <button type="button" onClick={onUseCode}>Entrar con código</button>
        <Link href="/forgot-password">¿Olvidaste tu contraseña?</Link>
      </div>
      <details className="auth-password-help">
        <summary>¿No tienes contraseña o la olvidaste?</summary>
        <p>Si ya creaste una contraseña, úsala aquí. También puedes crear o cambiar una contraseña aunque nunca hayas creado una contraseña.</p>
        <p>Usa el correo original de tu cuenta. No necesitas cambiarlo ni crear otra cuenta: solicita el código de recuperación, escríbelo y repite tu nueva contraseña para confirmarla.</p>
        <p>Los pasos y límites de recuperación se muestran allí; ese código no es el de inicio de sesión. No compartas tu contraseña ni tus códigos.</p>
        <Link href="/forgot-password">Crear o cambiar contraseña con un código</Link>
      </details>
      <RegistrationButton type="submit" disabled={loading} loading={loading}>{loading ? 'Comprobando acceso…' : 'Iniciar sesión'}</RegistrationButton>
      {requiresVerification ? <Link href={registrationHref || registrationUrl(email, '', '', true)}
        className="inline-flex min-h-11 items-center text-sm text-[var(--vp-text)] underline">Verificar mi correo de registro</Link> : null}
    </form>
  );
}
