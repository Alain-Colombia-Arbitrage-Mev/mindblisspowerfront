'use client';

import { useEffect, useId, useState } from 'react';
import { BadgeCheck, Clock3 } from 'lucide-react';
import Link from 'next/link';
import { useI18n } from '@/i18n/LanguageProvider';
import { memberSessionOwnerKey } from '@/lib/member-session-boundary.mjs';
import { readRechargePackage } from '@/lib/recharge-package-client.mjs';
import { rechargePackageTier } from '@/lib/recharge-package-contract.mjs';
import { subscribeMemberLogout } from '@/lib/member-logout-sync.mjs';
import { subscribeMemberSessionReplacement } from '@/lib/member-session-sync.mjs';
import styles from './recharge-package.module.css';

export default function RechargePackageCard({ session, compact = false }) {
  const { t, locale } = useI18n();
  const heading = useId(), owner = memberSessionOwnerKey(session), subject = session?.subject;
  const [snapshot, setSnapshot] = useState(null);

  useEffect(() => {
    if (!owner || !subject) return;
    const controller = new AbortController();
    let pending = false;
    const retire = () => { controller.abort(); setSnapshot(null); };
    const refresh = async () => {
      if (pending || controller.signal.aborted) return;
      pending = true;
      try {
        const data = await readRechargePackage(subject, { signal: controller.signal });
        if (!controller.signal.aborted) setSnapshot({ owner, ...data });
      } catch (error) {
        if (controller.signal.aborted) return;
        if ([401, 403, 409].includes(error?.status)) retire();
        else setSnapshot(null);
      } finally { pending = false; }
    };
    const logout = subscribeMemberLogout(retire), replacement = subscribeMemberSessionReplacement(retire);
    globalThis.window?.addEventListener('focus', refresh);
    void refresh();
    return () => {
      controller.abort(); logout(); replacement();
      globalThis.window?.removeEventListener('focus', refresh);
    };
  }, [owner, subject]);

  const item = snapshot?.owner === owner ? snapshot.package : null;
  if (!item) return null;
  const benefits = snapshot?.pagarBenefits;
  const paidGross = benefits?.activeGrossUsdMinor ?? 0;
  const active = rechargePackageTier(paidGross);
  const paymentPending = benefits && item.grossUsdMinor > paidGross;
  const StatusIcon = active ? BadgeCheck : Clock3;
  const usd = new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', currencyDisplay: 'code' });
  const cents = new Intl.NumberFormat(locale, { minimumIntegerDigits: 2, useGrouping: false });
  const formatUsd = minor => usd.formatToParts(BigInt(minor) / 100n)
    .map(part => part.type === 'fraction' ? cents.format(minor % 100) : part.value).join('');
  const numbers = new Intl.NumberFormat(locale);
  return <section className={`executive-panel ${styles.card}${compact ? ` ${styles.compact}` : ''}`} aria-labelledby={heading}>
    <div className={styles.heading}><StatusIcon size={18} aria-hidden="true" /><h2 id={heading}>
      {t(active ? 'rechargePackage.title' : paymentPending ? 'rechargePackage.pendingTitle' : 'rechargePackage.checkingTitle')}
    </h2></div>
    {active && <>
      <p className={styles.package}>{t('rechargePackage.level', { level: numbers.format(active.level) })}</p>
      <dl className={styles.details}>
        <div><dt>{t('rechargePackage.gross')}</dt><dd><bdi>{formatUsd(paidGross)}</bdi></dd></div>
        {!compact && <div><dt>{t('rechargePackage.ceiling')}</dt><dd><bdi>{formatUsd(active.ceilingUsdMinor)}</bdi></dd></div>}
      </dl>
    </>}
    {paymentPending && <>
      <p className={styles.status}>{t(active ? 'rechargePackage.pendingUpgrade' : 'rechargePackage.pendingCopy')}</p>
      <Link href="/dashboard/wallet-personal/pay" prefetch={false} className={`executive-button ${styles.pay}`}>{t('companyPayment.transferAction')}</Link>
    </>}
    {benefits && (active || benefits.bonusCreditedUsdMinor > 0) && <>
      <h3 className={styles.benefitHeading}>{t('rechargePackage.pagar')}</h3>
      <dl className={styles.details}>
        <div><dt>{t('rechargePackage.roi')}</dt><dd><bdi>{formatUsd(benefits.roiAccruedUsdMinor)}</bdi></dd></div>
        <div><dt>{t('rechargePackage.pv')}</dt><dd><bdi>{numbers.format(benefits.ownPv)}</bdi></dd></div>
        <div><dt>{t('rechargePackage.bonus')}</dt><dd><bdi>{formatUsd(benefits.bonusCreditedUsdMinor)}</bdi></dd></div>
      </dl>
    </>}
  </section>;
}
