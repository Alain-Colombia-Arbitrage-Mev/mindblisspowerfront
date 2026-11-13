'use client';

import { Check, Copy, Loader2 } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { useI18n } from '@/i18n/LanguageProvider';
import { useMemberSession } from '@/lib/member-session-context';
import { memberSessionOwnerKey } from '@/lib/member-session-boundary.mjs';
import { subscribeMemberLogout } from '@/lib/member-logout-sync.mjs';
import { subscribeMemberSessionReplacement } from '@/lib/member-session-sync.mjs';
import { createWalletAddressClipboard, isCopyableWalletAddress } from '@/lib/wallet-address-clipboard.mjs';

/** Copy only the address displayed beside this control in the current private view. */
export default function WalletAddressCopyButton({ address, size = 15 }) {
  const { t } = useI18n(), ownerKey = memberSessionOwnerKey(useMemberSession()), feedbackId = useId();
  const [feedback, setFeedback] = useState({ scope: '', status: '' });
  const [retired, setRetired] = useState(false);
  const controller = useRef(null), live = useRef(null);
  const scope = ownerKey && isCopyableWalletAddress(address) ? JSON.stringify([ownerKey, address]) : '';
  live.current = scope;
  useEffect(() => {
    setRetired(false); setFeedback({ scope, status: '' });
    const active = createWalletAddressClipboard({ address, ownerKey, isCurrent: () => live.current === scope,
      onChange: status => setFeedback({ scope, status }) });
    controller.current = active;
    const retire = () => { active.dispose(); live.current = ''; setRetired(true); setFeedback({ scope: '', status: '' }); };
    const logout = subscribeMemberLogout(retire), replacement = subscribeMemberSessionReplacement(retire);
    return () => { active.dispose(); logout(); replacement(); if (controller.current === active) controller.current = null; };
  }, [address, ownerKey, scope]);
  const status = !retired && feedback.scope === scope ? feedback.status : '';
  const message = status ? t(`walletPage.${status === 'pending' ? 'addressCopying' : status === 'copied' ? 'addressCopied' : 'addressCopyFailed'}`) : '';
  const Icon = status === 'pending' ? Loader2 : status === 'copied' ? Check : Copy;
  return <>
    <button type="button" onClick={() => { if (!retired && live.current === scope) return controller.current?.copy(); }}
      disabled={!scope || retired || status === 'pending'} aria-label={t('walletPage.copyAddress')} aria-describedby={feedbackId}
      aria-busy={status === 'pending'} title={message || t('walletPage.copyAddress')}
      style={{ minWidth: 44, minHeight: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={size} aria-hidden="true" className={status === 'pending' ? 'animate-spin' : undefined} />
    </button>
    <span id={feedbackId} role="status" aria-live="polite" aria-atomic="true"
      style={{ display: message ? 'block' : 'none', gridColumn: '1 / -1', flexBasis: '100%', fontSize: 12, lineHeight: 1.4,
        color: status === 'error' ? 'var(--vp-danger)' : 'var(--vp-muted)' }}>{message}</span>
    {status === 'error' ? <input type="text" readOnly value={address} aria-label={t('walletPage.copyAddress')} spellCheck={false}
      onFocus={event => event.currentTarget.select()} onClick={event => event.currentTarget.select()}
      style={{ gridColumn: '1 / -1', flexBasis: '100%', width: '100%', minWidth: 0, padding: 8, borderRadius: 6,
        border: '1px solid var(--vp-border-strong)', background: 'var(--vp-field)', color: 'var(--vp-text)', fontSize: 12, fontFamily: 'var(--font-mono)' }} /> : null}
  </>;
}
