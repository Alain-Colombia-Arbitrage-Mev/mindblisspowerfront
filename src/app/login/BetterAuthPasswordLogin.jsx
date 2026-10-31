'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { RegistrationButton, RegistrationField, RegistrationPassword } from '../register/RegistrationFields';
import { betterAuthPasswordRequest, betterAuthPasswordFailure, betterAuthAccess, verifiedEmailSignIn } from './better-auth-login.mjs';
import { registrationRequired, registrationRedirect, registrationUrl } from '../register/registration-model.mjs';

export default function BetterAuthPasswordLogin({ email, setEmail, onBusy, onError, onNotice, onVerified, onRegistrationRequired = undefined, rememberReferral, registrationHref = '' }) {
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const submitting = useRef(false);

  async function submit(event) {
    event.preventDefault();
    if (submitting.current) return;
    onError('');
    onNotice('');
    setRequiresVerification(false);
    let contract;
    try { contract = betterAuthPasswordRequest(email, password); } catch {
      onError('Ingresa un correo válido y tu contraseña para continuar.');
      return;
    }
    submitting.current = true;
    setLoading(true);
    onBusy(true);
    try {
      const response = await fetch(contract.path, {
        method: 'POST', credentials: 'same-origin', cache: 'no-store', redirect: 'error',
        signal: AbortSignal.timeout(12000), headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(contract.body),
      });
      const payload = await response.json().catch(() => ({}));
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
      rememberReferral(contract.body.email);
      onVerified(contract.body.email, { ready: false, checking: true });
      const access = await betterAuthAccess(fetch, contract.body.email);
      onVerified(contract.body.email, access);
    } catch {
      onError('No pudimos conectar con el servicio de acceso. Intenta otra vez.');
    } finally {
      submitting.current = false;
      setLoading(false);
      onBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate aria-busy={loading} className="space-y-4">
      <p className="text-sm leading-6 text-[var(--vp-muted)]">Usa la contraseña que creaste al registrarte. Esta opción no envía otro correo ni requiere esperar para solicitar un código.</p>
      <RegistrationField id="password-login-email" name="email" label="Correo electrónico" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required maxLength={254}
        value={email} disabled={loading} onChange={event => { setEmail(event.target.value); onError(''); }} />
      <RegistrationPassword id="password-login-password" name="password" label="Contraseña" autoComplete="current-password" required maxLength={128}
        value={password} disabled={loading} onChange={event => { setPassword(event.target.value); onError(''); }} visible={visible} onToggle={() => setVisible(current => !current)} />
      <RegistrationButton type="submit" disabled={loading} loading={loading}>{loading ? 'Comprobando acceso…' : 'Entrar con mi contraseña'}</RegistrationButton>
      {requiresVerification ? <Link href={registrationHref || registrationUrl(email, '', '', true)}
        className="inline-flex min-h-11 items-center text-sm text-[var(--vp-text)] underline">Verificar mi correo de registro</Link> : null}
    </form>
  );
}
