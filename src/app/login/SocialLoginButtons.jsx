'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { browserRequestDeadline } from '@/lib/browser-request-deadline.mjs';
import { AppleIcon, GoogleIcon } from './SocialProviderIcon';

const providers = [
  { id: 'google', label: 'Continuar con Google', Icon: GoogleIcon, origin: 'https://accounts.google.com', path: '/o/oauth2/' },
  { id: 'apple', label: 'Continuar con Apple', Icon: AppleIcon, origin: 'https://appleid.apple.com', path: '/auth/authorize' },
];

function trustedAuthorizationUrl(provider, value) {
  try {
    const url = new URL(value);
    return !url.username && !url.password && !url.hash && url.origin === provider.origin
      && (provider.id === 'apple' ? url.pathname === provider.path : url.pathname.startsWith(provider.path));
  } catch { return false; }
}

export default function SocialLoginButtons({ enabledProviders = [] }) {
  const enabled = new Set(enabledProviders);
  const [loadingProvider, setLoadingProvider] = useState('');
  const [error, setError] = useState('');
  const pending = useRef(false);
  const requestRef = useRef(null);

  useEffect(() => () => {
    requestRef.current?.abort();
    requestRef.current = null;
    pending.current = false;
  }, []);

  async function start(provider) {
    if (!enabled.has(provider.id) || pending.current) return;
    pending.current = true;
    setLoadingProvider(provider.id);
    setError('');
    const controller = new AbortController();
    requestRef.current = controller;
    const deadline = browserRequestDeadline(controller.signal, 12000);
    try {
      const response = await fetch('/api/auth/sign-in/social', {
        method: 'POST', credentials: 'same-origin', cache: 'no-store', redirect: 'error',
        signal: deadline.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider: provider.id }),
      });
      const payload = await response.json().catch(() => ({}));
      if (controller.signal.aborted || requestRef.current !== controller) return;
      if (!response.ok || !trustedAuthorizationUrl(provider, payload.url)) throw new Error('social_sign_in_unavailable');
      window.location.assign(payload.url);
    } catch {
      if (!controller.signal.aborted && requestRef.current === controller) {
        pending.current = false;
        setLoadingProvider('');
        setError('No pudimos abrir este método de acceso. Intenta de nuevo o usa tu correo.');
      }
    } finally {
      deadline.dispose();
      if (requestRef.current === controller) requestRef.current = null;
    }
  }

  return (
    <section className="auth-social-login" aria-label="Acceso con una cuenta externa">
      <div className="auth-social-buttons">
        {providers.map(provider => {
          const available = enabled.has(provider.id);
          const loading = loadingProvider === provider.id;
          const label = available ? provider.label : `${provider.label} (próximamente)`;
          return (
            <button key={provider.id} type="button" className={`auth-social-button auth-social-button--${provider.id}`}
              disabled={!available || Boolean(loadingProvider)} aria-label={label} title={available ? undefined : 'Próximamente disponible'}
              aria-busy={loading || undefined} onClick={() => start(provider)}>
              <span className="auth-social-icon">{loading ? <Loader2 size={20} aria-hidden="true" /> : <provider.Icon />}</span>
              <span>{loading ? 'Abriendo acceso…' : provider.label}</span>
            </button>
          );
        })}
      </div>
      <div className="auth-social-divider"><span>o usa tu email</span></div>
      {error ? <p className="auth-social-error" role="alert" aria-live="polite">{error}</p> : null}
    </section>
  );
}
