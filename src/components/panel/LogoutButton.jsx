'use client';

import { useId, useRef, useState } from 'react';
import { logoutMember } from '@/lib/member-logout.mjs';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/LanguageProvider';

export default function LogoutButton({ children, className = '', style = undefined, errorPlacement = 'below' }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const locked = useRef(false), errorId = useId();
  async function leave() {
    if (locked.current) return;
    locked.current = true;setBusy(true);setError('');
    try { await logoutMember(); }
    catch { setError(t('session.closeFailed')); }
    finally { locked.current = false;setBusy(false); }
  }
  return <span className="relative block">
    <button type="button" className={cn(className, busy && 'opacity-60')} style={style}
      aria-label={busy ? t('session.closing') : t('session.close')} title={t('session.close')} disabled={busy}
      aria-busy={busy} aria-describedby={error ? errorId : undefined} onClick={() => void leave()}>
      {children}
    </button>
    {error && <span id={errorId} role="alert" className={cn('absolute z-50 block w-64 rounded-lg border p-3 text-left text-xs leading-5',
      errorPlacement === 'above' ? 'bottom-full left-0 mb-2 max-w-full' : 'right-0 top-full mt-2 max-w-[calc(100vw-2rem)]')}
      style={{ background: 'var(--vp-surface)', borderColor: 'var(--vp-border)', color: 'var(--vp-danger)' }}>{error}</span>}
    {busy && <span className="sr-only" role="status">{t('session.closing')}…</span>}
  </span>;
}
