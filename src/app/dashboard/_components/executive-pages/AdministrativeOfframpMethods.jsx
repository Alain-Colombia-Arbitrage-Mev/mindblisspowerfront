"use client";

import { useEffect, useId, useRef, useState } from 'react';
import { ArrowDownToLine, Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n/LanguageProvider';
import { useMemberSession } from '@/lib/member-session-context';
import { walletFundingOwnerKey } from '@/lib/wallet-funding-owner.mjs';
import { readAdministrativeOfframpOptions } from '@/lib/administrative-offramp-client.mjs';
import { administrativeOfframpUnits, administrativeOfframpReturn } from '@/lib/administrative-offramp-session-contract.mjs';
import { prepareAdministrativeOfframpSession, readAdministrativeOfframpSession, readAdministrativeOfframpSessionHistory } from '@/lib/administrative-offramp-session-client.mjs';
import styles from './administrative-offramp.module.css';

/** Discovery is intentionally separate from transaction signing and payout creation. */
export default function AdministrativeOfframpMethods({ disabled = false, expectedAddress = '', signerReady = false, offrampEnabled = false,
  canPrepare = () => signerReady, onSignerRequired = undefined }) {
  const owner = walletFundingOwnerKey(useMemberSession());
  return owner ? <MethodsView key={`${owner}:${expectedAddress}`} disabled={disabled} expectedAddress={expectedAddress} signerReady={signerReady}
    offrampEnabled={offrampEnabled} canPrepare={canPrepare} onSignerRequired={onSignerRequired} /> : null;
}

function MethodsView({ disabled, expectedAddress, signerReady, offrampEnabled, canPrepare, onSignerRequired }) {
  const { t, locale } = useI18n(), id = useId();
  const [country, setCountry] = useState(''), [currency, setCurrency] = useState('USD');
  const [result, setResult] = useState(null), [error, setError] = useState(false), [loading, setLoading] = useState(false);
  const mounted = useRef(false), pending = useRef(null), epoch = useRef(0), blocked = useRef(disabled);
  blocked.current = disabled;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; pending.current?.abort(); }; }, []);
  useEffect(() => { if (disabled) { pending.current?.abort(); pending.current = null; epoch.current++; setResult(null); setLoading(false); } }, [disabled]);
  function clear() { pending.current?.abort(); pending.current = null; epoch.current++; setResult(null); setError(false); setLoading(false); }
  async function check(event) {
    event.preventDefault(); if (!country || blocked.current || pending.current) return;
    const controller = new AbortController(), generation = epoch.current;
    pending.current = controller; setLoading(true); setError(false); setResult(null);
    const active = () => mounted.current && !blocked.current && !controller.signal.aborted && generation === epoch.current;
    try { const next = await readAdministrativeOfframpOptions(country, currency, { signal: controller.signal }); if (active()) setResult(next); }
    catch { if (active()) setError(true); }
    finally { if (pending.current === controller) pending.current = null; if (active()) setLoading(false); }
  }
  const format = value => new Intl.NumberFormat(locale, { maximumFractionDigits: 6 }).format(value);
  return <section id="administrative-offramp" tabIndex={-1} className={`executive-panel ${styles.panel}`} aria-labelledby={`${id}-heading`}>
    <h2 id={`${id}-heading`} className={styles.heading}><ArrowDownToLine size={20} aria-hidden="true" />{t('administrativeOfframp.title')}</h2>
    <div className={styles.body}>
      <p>{t('administrativeOfframp.copy')}</p>
      <form className={styles.form} onSubmit={check}>
        <label htmlFor={`${id}-country`}>{t('administrativeOfframp.country')}
          <select id={`${id}-country`} value={country} disabled={disabled} onChange={event => { clear(); setCountry(event.target.value); setCurrency('USD'); }}>
            <option value="">{t('administrativeOfframp.choose')}</option>
            {['US', 'MX', 'CO'].map(value => <option key={value} value={value}>{t(`administrativeOfframp.${value.toLowerCase()}`)}</option>)}
          </select>
        </label>
        <label htmlFor={`${id}-currency`}>{t('administrativeOfframp.currency')}
          <select id={`${id}-currency`} value={currency} disabled={disabled || !country} onChange={event => { clear(); setCurrency(event.target.value); }}>
            <option value="USD">USD</option>{country === 'MX' ? <option value="MXN">MXN</option> : country === 'CO' ? <option value="COP">COP</option> : null}
          </select>
        </label>
        <button className="executive-button" type="submit" disabled={disabled || !country || loading}>
          {loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}
          {t(loading ? 'administrativeOfframp.loading' : 'administrativeOfframp.check')}
        </button>
      </form>
      <div aria-live="polite" aria-busy={loading}>
        {error ? <p role="alert">{t('administrativeOfframp.error')}</p> : null}
        {result?.routes.length === 0 ? <p>{t('administrativeOfframp.empty')}</p> : null}
        {result?.routes.length ? <ul className={styles.results}>{result.routes.flatMap(route => route.paymentMethods.map(method =>
          <li key={`${route.serviceProvider}:${method.method}`}>
            <strong>{method.method === 'PAYOUT_TO_CARD' ? t('administrativeOfframp.payoutToCard') : method.method.replaceAll('_', ' ')}</strong>
            <span>{route.serviceProvider}</span>
            <small>{t('administrativeOfframp.limits', { minimum: format(method.minimumAmount), maximum: format(method.maximumAmount), currency: method.currencyCode === 'USDT_POLYGON' ? 'USDT' : method.currencyCode })}</small>
          </li>))}</ul> : null}
      </div>
      {!signerReady || !expectedAddress ? <div className={styles.activationPrompt}><p className={styles.notice}>{t('administrativeOfframp.signerPending')}</p>
        <a className="executive-button" href="#administrative-signing">{t('administrativeSigning.activateConnection')}</a></div> : null}
      <OfframpExecution key={`${country}:${currency}`} options={result} expectedAddress={expectedAddress} disabled={disabled}
        signerReady={signerReady} enabled={offrampEnabled} canPrepare={canPrepare} onSignerRequired={onSignerRequired} />
      <small>{t('administrativeOfframp.sandbox')}</small>
    </div>
  </section>;
}

/** Each action is manual. Sandbox never asks the wallet to sign a transaction or fund a deposit. */
export function OfframpExecution({ options, expectedAddress, disabled, signerReady, enabled, canPrepare, onSignerRequired }) {
  const { t, locale } = useI18n(), id = useId();
  const [amount, setAmount] = useState(''), [methodKey, setMethodKey] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [ack, setAck] = useState(null);
  const [reference, setReference] = useState(''), [status, setStatus] = useState(null), [records, setRecords] = useState(null);
  const mounted = useRef(false), pending = useRef(null), popup = useRef(null), generation = useRef(0);
  const context = useRef({ options, expectedAddress, disabled, signerReady, enabled });
  if (context.current.options !== options || context.current.expectedAddress !== expectedAddress || context.current.disabled !== disabled
    || context.current.signerReady !== signerReady || context.current.enabled !== enabled) {
    generation.current++;
    context.current = { options, expectedAddress, disabled, signerReady, enabled };
  }
  const live = useRef(null);
  live.current = { disabled, enabled, signerReady, canPrepare, expectedAddress, onSignerRequired };
  const renderGeneration = generation.current;
  useEffect(() => {
    mounted.current = true;
    setReference(administrativeOfframpReturn(window.location.search) || '');
    return () => { mounted.current = false; generation.current++; pending.current?.abort(); try { popup.current?.close(); } catch { /* best effort */ } };
  }, []);
  useEffect(() => {
    pending.current?.abort(); pending.current = null;
    try { popup.current?.close(); } catch { /* best effort */ } popup.current = null; setBusy(false); setAck(null);
  }, [disabled, enabled, signerReady, options, expectedAddress]);
  const choices = (options?.routes || []).flatMap(route => route.paymentMethods.map(method => ({ key: `${route.serviceProvider}:${method.method}`, serviceProvider: route.serviceProvider, ...method })));
  const selected = choices.find(choice => choice.key === methodKey);
  const ready = enabled && !disabled && signerReady && Boolean(administrativeOfframpUnits(amount)) && Boolean(selected);
  const fiat = (value, currency) => new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
  function edit(setter, value) {
    if (!mounted.current) return;
    generation.current++; pending.current?.abort(); pending.current = null;
    try { popup.current?.close(); } catch { /* best effort */ } popup.current = null;
    setBusy(false); setAck(null); setStatus(null); setError(''); setter(value);
  }
  async function run(action, selectedReference = '') {
    const current = live.current;
    if (!mounted.current || renderGeneration !== generation.current || pending.current || !current?.enabled || current.disabled || !expectedAddress) return;
    if (action === 'prepare' && (!selected || !administrativeOfframpUnits(amount))) return;
    if (action === 'prepare' && (!current.signerReady || !current.canPrepare?.())) {
      setError('signerRequired'); current.onSignerRequired?.(); return;
    }
    let targetWindow = null;
    if (action === 'prepare') {
      targetWindow = window.open('about:blank', '_blank');
      if (!targetWindow) { setError('popupBlocked'); return; }
      targetWindow.opener = null; popup.current = targetWindow;
    }
    const controller = new AbortController(), epoch = generation.current;
    pending.current = controller; setBusy(true); setError('');
    if (action === 'status') setStatus(null);
    if (action === 'history') setRecords(null);
    if (action === 'prepare') { setAck(null); setStatus(null); }
    const active = () => mounted.current && !controller.signal.aborted && generation.current === epoch
      && live.current?.enabled && !live.current.disabled;
    try {
      if (action === 'prepare') {
        const result = await prepareAdministrativeOfframpSession({ requestId: crypto.randomUUID(), country: options.country,
          destinationCurrencyCode: options.destinationCurrencyCode, amount, serviceProvider: selected.serviceProvider, paymentMethodType: selected.method }, expectedAddress, { signal: controller.signal });
        if (!active() || !live.current.signerReady || !live.current.canPrepare?.() || targetWindow.closed) throw new DOMException('Aborted', 'AbortError');
        targetWindow.location.replace(result.checkoutUrl); popup.current = null;
        setAck(result); setStatus(null); setReference(result.reference); setRecords(null);
      } else if (action === 'status') {
        const result = await readAdministrativeOfframpSession(selectedReference || reference, expectedAddress, { signal: controller.signal });
        if (active()) { setStatus(result); setReference(result.reference); }
      } else {
        const result = await readAdministrativeOfframpSessionHistory(expectedAddress, { signal: controller.signal });
        if (active()) setRecords(result.records);
      }
    } catch (failure) {
      try { targetWindow?.close(); } catch { /* best effort */ }
      if (active() && failure?.name !== 'AbortError') {
        const signerFailure = ['administrative_operation_forbidden', 'unauthenticated'].includes(failure?.message);
        setError(signerFailure ? 'signerRequired' : 'prepareError');
        if (signerFailure) live.current.onSignerRequired?.();
      }
    } finally {
      if (popup.current === targetWindow) popup.current = null;
      if (pending.current === controller) pending.current = null;
      if (mounted.current && generation.current === epoch) setBusy(false);
    }
  }
  const label = record => t(`administrativeOfframp.${record.confirmation.source === 'meld_sandbox_api'
    ? ({ confirmed: 'confirmed', pending: 'pending', failed: 'failed' }[record.confirmation.state] || 'unconfirmed') : 'unconfirmed'}`);
  return <section className={styles.body} aria-label={t('administrativeOfframp.prepareTitle')} aria-busy={busy}>
    {choices.length ? <div className={styles.form}>
      <label htmlFor={`${id}-amount`}>{t('administrativeOfframp.sourceAmount')}
        <input id={`${id}-amount`} type="text" inputMode="decimal" autoComplete="off" value={amount} disabled={disabled || busy}
          onChange={event => edit(setAmount, event.target.value)} placeholder="100" />
      </label>
      <label htmlFor={`${id}-method`}>{t('administrativeOfframp.method')}
        <select id={`${id}-method`} value={methodKey} disabled={disabled || busy} onChange={event => edit(setMethodKey, event.target.value)}>
          <option value="">{t('administrativeOfframp.chooseMethod')}</option>
          {choices.map(choice => <option key={choice.key} value={choice.key}>{choice.serviceProvider} · {choice.method === 'PAYOUT_TO_CARD' ? t('administrativeOfframp.payoutToCard') : choice.method.replaceAll('_', ' ')}</option>)}
        </select>
      </label>
      <button type="button" className="executive-button primary" disabled={!ready || busy} onClick={() => void run('prepare')}>
        {busy ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}{t('administrativeOfframp.prepare')}
      </button>
    </div> : null}
    {choices.length && !enabled ? <p className={styles.notice}>{t('administrativeOfframp.integrationPending')}</p> : null}
    <p className={styles.notice}>{t('administrativeOfframp.noRealFunds')}</p>
    {error ? <p role="alert">{t(`administrativeOfframp.${error}`)}</p> : null}
    <div aria-live="polite">
      {busy ? <p role="status">{t('administrativeOfframp.loading')}</p> : null}
      {ack ? <p>{t('administrativeOfframp.prepared')}{typeof ack.quotedDestinationAmount === 'number' ? <><br />{t('administrativeOfframp.estimate', { amount: fiat(ack.quotedDestinationAmount, ack.destinationCurrencyCode) })}</> : null}</p> : null}
      {status ? <div className={styles.result}>
        <strong>{label(status)}</strong><span>{status.sourceAmount} USDT · Polygon · {status.serviceProvider}</span>
        {status.confirmation.state === 'confirmed' ? <span>{t('administrativeOfframp.testPayout', { amount: fiat(Number(status.confirmation.destinationAmount), status.destinationCurrencyCode) })}</span> : null}
        {status.confirmation.updatedAt ? <time dateTime={status.confirmation.updatedAt}>{new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(status.confirmation.updatedAt))}</time> : null}
        <small>{status.reference}</small>
      </div> : null}
    </div>
    {reference ? <button type="button" className="executive-button" disabled={disabled || !enabled || busy} onClick={() => void run('status')}>{t('administrativeOfframp.refresh')}</button> : null}
    <button type="button" className="executive-button" disabled={disabled || !enabled || busy} onClick={() => void run('history')}>{t('administrativeOfframp.history')}</button>
    {records ? records.length ? <ul className={styles.results}>{records.map(record => <li key={record.reference}>
      <strong>{record.sourceAmount} USDT · {record.serviceProvider}</strong><span>{label(record)}</span>
      <button type="button" className="executive-button" disabled={busy} onClick={() => void run('status', record.reference)}>{t('administrativeOfframp.refresh')}</button>
    </li>)}</ul> : <p>{t('administrativeOfframp.historyEmpty')}</p> : null}
  </section>;
}
