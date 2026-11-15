'use client';

import { useI18n } from '@/i18n/LanguageProvider';
import { authEntryAllowed } from '@/lib/auth-entry-policy.mjs';

export default function AuthEntryNotice() {
  const { t } = useI18n();
  return authEntryAllowed() ? null : <p role="status" className="rounded-lg border border-[var(--vp-border)] bg-[var(--vp-surface-raised)] px-3 py-3 text-sm leading-6 text-[var(--vp-muted)]">{t('authEntry.unavailable')}</p>;
}
