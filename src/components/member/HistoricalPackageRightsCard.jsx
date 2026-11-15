'use client';

import { BadgeCheck, Clock3, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useI18n } from '@/i18n/LanguageProvider';
import { historicalPackageRights } from '@/lib/historical-package-rights-contract.mjs';
import styles from './historical-package-rights.module.css';

function utcDate(value, locale) {
  return `${new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(value))} UTC`;
}
function packageLabel(item, t, locale) {
  const [whole, fraction] = item.packageBaseUsd.split('.');
  const amount = new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: fraction === '00' ? 0 : 2, maximumFractionDigits: 2 }).formatToParts(BigInt(whole))
    .map(part => part.type === 'fraction' ? new Intl.NumberFormat(locale, { minimumIntegerDigits: 2, useGrouping: false }).format(Number(fraction)) : part.value).join('');
  return t('historicalPackage.packageLabel', { amount: `${amount} USD` });
}

export default function HistoricalPackageRightsCard({ snapshot, compact = false }) {
  const { t, locale } = useI18n();
  if (!snapshot.visible) return null;
  const data = historicalPackageRights(snapshot.data), active = Boolean(data?.activeCount);
  return <section id={compact ? undefined : 'historical-package-rights'} className={`executive-panel ${styles.card}${compact ? ` ${styles.compact}` : ''}`}
    aria-label={t('historicalPackage.title')} aria-busy={snapshot.loading}>
    <div className={styles.heading}><BadgeCheck size={18} aria-hidden="true" /><h2>{t('historicalPackage.title')}</h2>
      <button className="executive-button" type="button" disabled={!snapshot.canRefresh || snapshot.loading} onClick={() => void snapshot.refresh()}
        aria-label={t('historicalPackage.refresh')} title={t('historicalPackage.refresh')}><RefreshCw size={14} aria-hidden="true" /></button></div>
    {snapshot.loading ? <p role="status">{t('historicalPackage.loading')}</p> : snapshot.error ? <p role="alert">{t('historicalPackage.unavailable')}</p> : data ? <>
      <p className={styles.access}><strong>{t(active ? 'historicalPackage.activeUntilRevoked' : 'historicalPackage.noCurrentAccess')}</strong>
        <span>{t('historicalPackage.activeCount', { count: data.activeCount })}</span></p>
      {compact ? <Link href="/dashboard/profile#historical-package-rights" className={styles.link}>{t('historicalPackage.details')}</Link>
        : data.items.length ? <details className={styles.details}><summary>{t('historicalPackage.details')}</summary><ol className={styles.items}>
          {data.items.map(item => <li key={item.id}><div className={styles.itemHeading}><h3>{packageLabel(item, t, locale)}</h3>
            <span>{t(`historicalPackage.status_${item.status}`)}</span></div><dl>
              <div><dt>{t('historicalPackage.boughtAt')}</dt><dd><time dateTime={item.boughtAt}>{utcDate(item.boughtAt, locale)}</time></dd></div>
              <div><dt>{t('historicalPackage.recognizedAt')}</dt><dd><time dateTime={item.recognizedAt}>{utcDate(item.recognizedAt, locale)}</time></dd></div>
            </dl><p className={styles.source}><Clock3 size={12} aria-hidden="true" />{t('historicalPackage.source')}</p></li>)}
          </ol>{data.items.length < data.totalCount ? <p>{t('historicalPackage.recentCount', { count: data.items.length, total: data.totalCount })}</p> : null}</details>
          : <p>{t('historicalPackage.noItems')}</p>}
    </> : null}
    <p className={styles.disclosure}>{t('historicalPackage.copy')}</p>
  </section>;
}
