'use client';

import { Coins } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { useI18n } from '@/i18n/LanguageProvider';
import { subscribeMemberLogout } from '@/lib/member-logout-sync.mjs';
import { memberSessionOwnerKey } from '@/lib/member-session-boundary.mjs';
import { useMemberSession } from '@/lib/member-session-context';
import { subscribeMemberSessionReplacement } from '@/lib/member-session-sync.mjs';
import { readPagarCommissions } from '@/lib/pagar-commissions-client.mjs';
import { PageHeader } from './executive-ui';
import styles from './pagar-commissions.module.css';

export default function PagarCommissionsPage() {
  const { t, locale } = useI18n();
  const session = useMemberSession();
  const owner = memberSessionOwnerKey(session), subject = session?.subject;
  const balanceHeading = useId(), historyHeading = useId();
  const actions = useRef(null);
  const [view, setView] = useState(null);

  useEffect(() => {
    if (!owner || !subject) return;
    const controller = new AbortController();
    let ledger = null, pending = false, expanded = false;
    const show = phase => setView({ owner, ledger, phase });
    const retire = () => {
      if (controller.signal.aborted) return;
      controller.abort();
      ledger = null;
      show('denied');
    };
    const load = async (before = null) => {
      if (pending || controller.signal.aborted) return;
      pending = true;
      show(before ? 'older' : ledger ? 'refreshing' : 'loading');
      try {
        const page = await readPagarCommissions(subject, { before, signal: controller.signal });
        if (controller.signal.aborted) return;
        if (before && ledger) {
          ledger = { ...page, periods: [...ledger.periods, ...page.periods] };
          expanded = true;
        } else ledger = page;
        show('ready');
      } catch (error) {
        if (controller.signal.aborted) return;
        if ([401, 403, 409].includes(error?.status)) retire();
        else show(before ? 'olderError' : 'error');
      } finally { pending = false; }
    };
    actions.current = {
      refresh: () => void load(),
      older: () => { if (ledger?.nextBefore) void load(ledger.nextBefore); },
    };
    const onFocus = () => { if (!expanded) void load(); };
    const logout = subscribeMemberLogout(retire), replacement = subscribeMemberSessionReplacement(retire);
    window.addEventListener('focus', onFocus);
    void load();
    return () => {
      controller.abort();
      actions.current = null;
      logout();
      replacement();
      window.removeEventListener('focus', onFocus);
    };
  }, [owner, subject]);

  const current = view?.owner === owner ? view : null;
  const ledger = current?.ledger, phase = current?.phase ?? 'loading';
  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' });
  const usd = new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', currencyDisplay: 'code' });
  const cents = new Intl.NumberFormat(locale, { minimumIntegerDigits: 2, useGrouping: false });
  const money = minor => usd.formatToParts(BigInt(minor) / 100n)
    .map(part => part.type === 'fraction' ? cents.format(minor % 100) : part.value).join('');

  return <section className="executive-page">
    <div className="executive-container">
      <PageHeader title={t('nav.commissions')} eyebrow={null} subtitle={null} />
      <div className={styles.content} aria-busy={phase === 'refreshing' || phase === 'older'}>
        {phase === 'loading' && <p className={styles.status} role="status">{t('pagarCommissions.loading')}</p>}
        {phase === 'denied' && <p className={styles.status} role="status">{t('pagarCommissions.denied')}</p>}
        {phase === 'error' && <div className={styles.feedback}>
          <p className={styles.status} role="alert">{t('pagarCommissions.unavailable')}</p>
          <button type="button" className={`executive-button ${styles.control}`} onClick={() => actions.current?.refresh()}>{t('pagarCommissions.retry')}</button>
        </div>}
        {ledger && <>
          <section className="executive-panel" aria-labelledby={balanceHeading}>
            <h2 id={balanceHeading} className="executive-section-title"><Coins size={18} aria-hidden="true" />{t('rechargePackage.bonus')}</h2>
            <p className={styles.balance}><bdi>{money(ledger.virtualBalanceUsdMinor)}</bdi></p>
            <p className={styles.status}>{t('pagarCommissions.balanceScope')}</p>
          </section>
          <section className="executive-panel" aria-labelledby={historyHeading}>
            <h2 id={historyHeading} className="executive-section-title">{t('pagarCommissions.history')}</h2>
            {!ledger.periods.length ? <p className={styles.status}>{t('pagarCommissions.empty')}</p>
              : <ul className={styles.periods}>
                {ledger.periods.map(period => <li key={period.weekEnd}>
                  <dl className={styles.period}>
                    <div><dt>{t('pagarCommissions.closeDate')}</dt><dd>
                      <time dateTime={period.weekEnd}>{date.format(new Date(`${period.weekEnd}T00:00:00Z`))}</time>
                    </dd></div>
                    <div><dt>{t('pagarCommissions.binary')}</dt><dd><bdi>{money(period.binaryUsdMinor)}</bdi></dd></div>
                    <div><dt>{t('pagarCommissions.rank')}</dt><dd><bdi>{money(period.rankUsdMinor)}</bdi></dd></div>
                  </dl>
                </li>)}
              </ul>}
            {phase === 'olderError' && <p className={styles.status} role="alert">{t('pagarCommissions.olderUnavailable')}</p>}
            {ledger.nextBefore && <button type="button" className={`executive-button ${styles.control} ${styles.older}`}
              disabled={phase === 'older' || phase === 'refreshing'} onClick={() => actions.current?.older()}>
              {t(phase === 'older' ? 'pagarCommissions.loading' : phase === 'olderError' ? 'pagarCommissions.retry' : 'pagarCommissions.older')}
            </button>}
          </section>
        </>}
      </div>
    </div>
  </section>;
}
