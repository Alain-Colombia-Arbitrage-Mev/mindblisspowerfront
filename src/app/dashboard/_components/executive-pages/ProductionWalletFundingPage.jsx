'use client';

import { CheckCircle2, CreditCard, Info, Loader2, RefreshCw, Wallet } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useMemberSession } from '@/lib/member-session-context';
import { useWalletReown } from '@/components/reown/WalletReownContext';
import { useSandboxWalletBinding } from '@/components/reown/SandboxWalletBindingProvider';
import { walletReownOwnerKey } from '@/lib/wallet-reown-connection.mjs';
import { readProductionDiscovery, readProductionOptions, quoteProductionFunding, createProductionFunding, readProductionHistory, readProductionStatus } from '@/lib/wallet-production-funding-client.mjs';
import { readSandboxWalletFundingHistory } from '@/lib/sandbox-wallet-client.mjs';
import { FUNDING_UUID } from '@/lib/wallet-funding-contract.mjs';
import { useI18n } from '@/i18n/LanguageProvider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { WalletAddress } from './WalletFundingUI';
import WalletFundingHistory from './WalletFundingHistory';
import styles from './wallet-funding.module.css';
import local from './production-wallet.module.css';

const names = { CREDIT_DEBIT_CARD: 'cardPayment', LOCAL_BANK_TRANSFER: 'bankTransfer' };
const providerName = value => ({ ONRAMPMONEY: 'Onramp Money', ALCHEMYPAY: 'Alchemy Pay', BANXA: 'Banxa', TRANSAK: 'Transak', TOPPER: 'Topper' })[value] || value;
export default function ProductionWalletFundingPage() {
  const session = useMemberSession(), owner = walletReownOwnerKey(session);
  return owner ? <ProductionWalletView key={owner} ownerSubject={session.subject} /> : null;
}
export function ProductionWalletView({ ownerSubject }) {
  const { t, locale } = useI18n(), binding = useSandboxWalletBinding(), reown = useWalletReown();
  const tr = (key, variables = undefined) => t(`walletProduction.${key}`, variables);
  const [countries, setCountries] = useState([]), [currencies, setCurrencies] = useState([]);
  const [country, setCountry] = useState(''), [currency, setCurrency] = useState(''), [amount, setAmount] = useState('50'), [method, setMethod] = useState('');
  const [routes, setRoutes] = useState([]), [loading, setLoading] = useState('countries'), [busy, setBusy] = useState(''), [error, setError] = useState('');
  const [quote, setQuote] = useState(null), [revision, setRevision] = useState(0), [countryRevision, setCountryRevision] = useState(0), [history, setHistory] = useState([]), [selected, setSelected] = useState(null);
  const [legacyOpen, setLegacyOpen] = useState(false), [historyError, setHistoryError] = useState(false);
  const [currencyRevision, setCurrencyRevision] = useState(0), [methodRevision, setMethodRevision] = useState(0);
  const [activationRequested, setActivationRequested] = useState(false);
  const mounted = useRef(false), operation = useRef(null), generation = useRef(0), live = useRef(null);
  live.current = { binding, country, currency, amount, method, quote, routes };
  const ready = binding.canReceive();
  const fail = useCallback(failure => {
    if (failure?.status === 401 || failure?.status === 403) live.current.binding.retire();
    return failure?.message === 'wallet_production_quote_unavailable' ? 'noQuote'
      : ['wallet_production_binding_required', 'wallet_production_verification_required'].includes(failure?.message) ? 'activationRequired' : 'unavailable';
  }, []);
  const cancel = useCallback(() => {
    generation.current++; operation.current?.controller.abort(); try { operation.current?.popup?.close(); } catch { /* cleanup */ }
    operation.current = null; if (mounted.current) setBusy('');
  }, []);
  const reset = () => { cancel(); live.current.quote = null; setQuote(null); setError(''); };
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; cancel(); }; }, [cancel]);
  useEffect(() => {
    const controller = new AbortController(); setLoading('countries');
    readProductionDiscovery('', { ownerSubject, signal: controller.signal }).then(value => { if (!controller.signal.aborted) { setCountries(value.countries); setError(''); } })
      .catch(failure => { if (!controller.signal.aborted) setError(fail(failure)); }).finally(() => { if (!controller.signal.aborted) setLoading(''); });
    return () => controller.abort();
  }, [ownerSubject, countryRevision, fail]);
  useEffect(() => {
    setCurrencies([]); setCurrency(''); setRoutes([]); setMethod(''); setQuote(null);
    if (!country) return undefined;
    const controller = new AbortController(); setLoading('currencies');
    readProductionDiscovery(country, { ownerSubject, signal: controller.signal }).then(value => {
      if (controller.signal.aborted) return; setCurrencies(value.currencies);
      const preferred = value.defaultCurrencyCode || (value.currencies.some(item => item.code === 'USD') ? 'USD' : value.currencies[0]?.code || ''); setCurrency(preferred);
    }).catch(failure => { if (!controller.signal.aborted) setError(fail(failure)); }).finally(() => { if (!controller.signal.aborted) setLoading(''); });
    return () => controller.abort();
  }, [country, ownerSubject, currencyRevision, fail]);
  useEffect(() => {
    setRoutes([]); setMethod(''); setQuote(null); if (!country || !currency) return undefined;
    const controller = new AbortController(); setLoading('methods');
    readProductionOptions(country, currency, { ownerSubject, signal: controller.signal }).then(value => {
      if (controller.signal.aborted) return; setRoutes(value.routes);
    }).catch(failure => { if (!controller.signal.aborted) setError(fail(failure)); }).finally(() => { if (!controller.signal.aborted) setLoading(''); });
    return () => controller.abort();
  }, [country, currency, ownerSubject, methodRevision, fail]);
  useEffect(() => { cancel(); setQuote(null); setSelected(null); }, [binding.linkedAddress, cancel]);
  useEffect(() => {
    const controller = new AbortController(); setHistoryError(false);
    readProductionHistory({ ownerSubject, signal: controller.signal }).then(value => { if (!controller.signal.aborted) setHistory(value.records); })
      .catch(failure => { if (!controller.signal.aborted) { setHistoryError(true); fail(failure); } });
    return () => controller.abort();
  }, [ownerSubject, revision, fail]);
  const number = value => new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
  const methods = [...new Set(routes.flatMap(route => route.paymentMethods.map(item => item.method)))];
  const limits = routes.flatMap(route => route.paymentMethods).filter(item => item.method === method)
    .map(item => ({ ...item, minimumAmount: Math.max(item.minimumAmount, currency === 'USD' ? 50 : 0.01), maximumAmount: Math.min(item.maximumAmount, currency === 'USD' ? 25000 : 1e9) }))
    .filter(item => item.minimumAmount <= item.maximumAmount);
  const minimum = limits.length ? Math.min(...limits.map(item => item.minimumAmount)) : currency === 'USD' ? 50 : 0.01;
  const maximum = limits.length ? Math.max(...limits.map(item => item.maximumAmount)) : currency === 'USD' ? 25000 : 1e9;
  const value = Number(amount), decimals = currencies.find(item => item.code === currency)?.decimalPlaces ?? 2;
  const eligible = limits.some(item => value >= item.minimumAmount && value <= item.maximumAmount) && Number.isFinite(value) && value > 0 && Math.abs(value * 10 ** Math.min(decimals, 2) - Math.round(value * 10 ** Math.min(decimals, 2))) < 0.000001;
  const requestInput = () => ({ country: live.current.country, sourceCurrencyCode: live.current.currency, amount: Number(live.current.amount), paymentMethodType: live.current.method });
  const consult = async event => {
    event.preventDefault(); if (!mounted.current || !live.current.binding.canReceive() || !eligible || live.current.routes !== routes || operation.current || loading) return;
    const controller = new AbortController(), epoch = ++generation.current, address = binding.linkedAddress;
    operation.current = { controller }; setBusy('quote'); setError(''); setQuote(null);
    try { const result = await quoteProductionFunding(requestInput(), address, { ownerSubject, signal: controller.signal });
      if (mounted.current && !controller.signal.aborted && generation.current === epoch && live.current.binding.canReceive() && live.current.binding.linkedAddress === address) setQuote({ ...result, receivedAt: Date.now() });
    } catch (failure) { if (mounted.current && !controller.signal.aborted && generation.current === epoch) setError(fail(failure)); }
    finally { if (generation.current === epoch) { operation.current = null; if (mounted.current) setBusy(''); } }
  };
  const open = async provider => {
    const current = live.current;
    if (!mounted.current || !current.binding.canReceive() || operation.current || !quote || current.quote !== quote || quote.destination.address !== current.binding.linkedAddress
      || quote.country !== current.country || quote.sourceCurrencyCode !== current.currency || quote.requestedAmount !== Number(current.amount)
      || quote.paymentMethodType !== current.method || !quote.quotes.some(item => item.serviceProvider === provider)) return;
    if (Date.now() - quote.receivedAt > 120000) { setQuote(null); setError('quoteExpired'); return; }
    let popup; try { popup = window.open('about:blank', '_blank'); if (popup) popup.opener = null; } catch { /* handled below */ }
    if (!popup) { setError('popup'); return; }
    const controller = new AbortController(), epoch = ++generation.current, address = binding.linkedAddress;
    operation.current = { controller, popup }; setBusy(provider); setError('');
    try { const result = await createProductionFunding({ ...requestInput(), serviceProvider: provider, requestId: crypto.randomUUID() }, address, { ownerSubject, signal: controller.signal });
      if (!mounted.current || controller.signal.aborted || generation.current !== epoch || !live.current.binding.canReceive() || live.current.binding.linkedAddress !== address) { popup.close(); return; }
      if (popup.closed) { setError('popup'); return; } popup.location.replace(result.checkoutUrl); setQuote(null); setRevision(item => item + 1);
    } catch (failure) { try { popup.close(); } catch { /* cleanup */ } if (mounted.current && !controller.signal.aborted && generation.current === epoch) { setQuote(null); setError(fail(failure)); } }
    finally { if (generation.current === epoch) { operation.current = null; if (mounted.current) setBusy(''); } }
  };
  const checkStatus = useCallback(async reference => {
    if (!mounted.current || operation.current || !FUNDING_UUID.test(reference)) return;
    const controller = new AbortController(), epoch = ++generation.current; operation.current = { controller }; setBusy('status'); setError(''); setSelected(null);
    try { const result = await readProductionStatus(reference, { ownerSubject, signal: controller.signal }); if (mounted.current && generation.current === epoch && !controller.signal.aborted && result.destination.address === live.current.binding.linkedAddress) setSelected(result); }
    catch (failure) { if (mounted.current && generation.current === epoch && !controller.signal.aborted) setError(fail(failure)); }
    finally { if (generation.current === epoch) { operation.current = null; if (mounted.current) setBusy(''); } }
  }, [ownerSubject, fail]);
  useEffect(() => {
    if (binding.loading || !binding.linkedAddress) return;
    const query = new URLSearchParams(window.location.search), value = query.get('walletCheckoutReference');
    if (query.getAll('walletCheckoutReference').length === 1 && !['sandboxCheckoutReference', 'administrativeCheckoutReference', 'checkoutReference'].some(key => query.has(key))
      && value && FUNDING_UUID.test(value)) void checkStatus(value);
  }, [checkStatus, binding.loading, binding.linkedAddress]);
  useEffect(() => {
    if (!activationRequested) return undefined;
    const timer = setTimeout(() => { if (mounted.current) setActivationRequested(false); }, 60000);
    return () => clearTimeout(timer);
  }, [activationRequested]);
  useEffect(() => {
    if (!activationRequested || binding.loading || binding.busy) return;
    if (binding.canReceive() || binding.mismatch || binding.status === 'retired') { setActivationRequested(false); return; }
    if (reown.isConnected && binding.configured) {
      // Continue only the activation the user just requested. This is an
      // ownership signature, never a transaction, payment or background login.
      setActivationRequested(false); void binding.activate();
    }
  }, [activationRequested, binding, reown.isConnected]);
  const activate = async () => {
    if (!mounted.current || live.current.binding.canReceive() || binding.loading || binding.busy) return;
    setError(''); try { if (!reown.isConnected) { setActivationRequested(true); await reown.connectWallet(); } else await binding.activate(); }
    catch { if (mounted.current) { setActivationRequested(false); setError('unavailable'); } }
  };
  const stateLabel = state => tr(({ confirmed: 'confirmed', failed: 'failed', pending: 'processing' })[state] || 'pending');
  const readSandbox = useCallback((_kind, options) => readSandboxWalletFundingHistory({ ...options, ownerSubject }), [ownerSubject]);
  return <section className="executive-page"><div className={`executive-container ${styles.screen}`}>
    <header className={styles.pageHeading}><div><h1>{tr('title')}</h1><span>{tr('copy')}</span></div><p className={styles.providerBadge}>USDT · Polygon</p></header>
    <section className={`executive-panel ${local.panel}`} aria-busy={binding.loading || binding.busy}>
      <div className={styles.sectionHeading}>{ready ? <CheckCircle2 size={22} aria-hidden="true" /> : <Wallet size={22} aria-hidden="true" />}<div><h2>{tr('connection')}</h2><p>{tr(ready ? 'active' : binding.loading ? 'loading' : 'activationCopy')}</p></div></div>
      <WalletAddress address={binding.linkedAddress || binding.address} label={t('sandboxWallet.address')} loading={binding.loading} emptyLabel={t('sandboxWallet.noWallet')} />
      {ready ? <p className={styles.hint}>{tr('receivingCopy')}</p> : <div className={local.actions}><button type="button" className="executive-button primary" disabled={binding.loading || binding.busy || reown.isRestoring || !reown.configured || binding.mismatch || binding.status === 'retired'} onClick={() => void activate()}>{binding.busy ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : null}{tr(binding.busy ? 'activating' : reown.isConnected ? 'activate' : 'connect')}</button><button type="button" className="executive-button" disabled={binding.loading || binding.busy || binding.status === 'retired'} onClick={() => void binding.refresh()}><RefreshCw size={16} aria-hidden="true" />{tr('refresh')}</button></div>}
      {binding.mismatch || binding.error ? <p role="alert" className={local.error}>{binding.mismatch ? tr('mismatch') : t(`sandboxWallet.${binding.error}`)}</p> : null}
      {binding.mismatch ? <button type="button" className="executive-button" disabled={binding.busy || Boolean(busy)} onClick={() => { setActivationRequested(false); void reown.disconnectWallet().catch(() => { if (mounted.current) setError('unavailable'); }); }}>{t('sandboxWallet.choose')}</button> : null}
    </section>
    <section id="administrative-wallet" className={`executive-panel ${local.panel}`} aria-labelledby="production-funding-title">
      <div className={styles.sectionHeading}><CreditCard size={22} aria-hidden="true" /><div><h2 id="production-funding-title">{t('walletPage.addFundsAction')}</h2><p>{tr('production')} · USDT · Polygon</p></div></div>
      {!ready ? <p className={styles.hint}>{tr('activationRequired')}</p> : <form onSubmit={event => void consult(event)} className={local.form}>
        <div className={local.fields}><div className={local.field}><div className={local.label}><label htmlFor="production-country">{tr('country')}</label><Popover><PopoverTrigger asChild><button type="button" className={local.info} aria-label={tr('residence')}><Info size={18} aria-hidden="true" /></button></PopoverTrigger><PopoverContent className={local.residence}>{tr('residence')}</PopoverContent></Popover></div>
          <select id="production-country" value={country} disabled={Boolean(busy) || loading === 'countries'} required onChange={event => { reset(); setCountry(event.target.value); }}><option value="">{tr(loading === 'countries' ? 'loading' : 'chooseCountry')}</option>{countries.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}</select></div>
          <div className={local.field}><label htmlFor="production-currency">{tr('currency')}</label><select id="production-currency" value={currency} disabled={Boolean(busy) || !currencies.length || Boolean(loading)} required onChange={event => { reset(); setCurrency(event.target.value); }}><option value="">—</option>{currencies.map(item => <option key={item.code} value={item.code}>{item.code} · {item.name}</option>)}</select></div>
          <div className={local.field}><label htmlFor="production-amount">{tr('amount')} {currency ? `(${currency})` : ''}</label><input id="production-amount" type="number" inputMode={decimals ? 'decimal' : 'numeric'} min={minimum} max={maximum} step={decimals ? '0.01' : '1'} value={amount} disabled={Boolean(busy) || !currency} required onChange={event => { reset(); setAmount(event.target.value); }} />{method ? <span className={styles.hint}>{tr('limits', { min: number(minimum), max: number(maximum), currency })}</span> : null}</div>
          <div className={local.field}><label htmlFor="production-method">{tr('method')}</label><select id="production-method" value={method} disabled={Boolean(busy) || Boolean(loading) || !methods.length} required onChange={event => { reset(); setMethod(event.target.value); }}><option value="">{tr(loading === 'methods' ? 'loading' : 'selectMethod')}</option>{methods.map(item => <option key={item} value={item}>{names[item] ? t(`onramp.${names[item]}`) : item.replaceAll('_', ' ')}</option>)}</select></div>
        </div>
        {country && currency && !loading && !methods.length ? <p role="status" className={styles.hint}>{tr('noRoute')}</p> : null}
        <button type="submit" className="executive-button primary" disabled={!eligible || !ready || Boolean(loading) || Boolean(busy)}>{busy === 'quote' ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : null}{tr(busy === 'quote' ? 'quoting' : 'quote')}</button>
      </form>}
      {quote && ready ? <div className={local.quotes} aria-live="polite">{quote.quotes.map(item => <article key={item.serviceProvider} className={local.quote}><strong>{providerName(item.serviceProvider)}</strong><span>{tr('receive')}</span><bdi className={local.received}>{number(item.destinationAmount)} USDT</bdi><span>{tr('fees', { amount: number(item.totalFee), currency })}</span><button type="button" className="executive-button primary" disabled={Boolean(busy)} onClick={() => void open(item.serviceProvider)}>{tr(busy === item.serviceProvider ? 'opening' : 'continue', { provider: providerName(item.serviceProvider) })}</button></article>)}</div> : null}
      {error ? <p role="alert" className={local.error}>{tr(error)}</p> : null}
      {error === 'activationRequired' ? <button type="button" className="executive-button" disabled={binding.loading || binding.busy || Boolean(busy)} onClick={() => void binding.refresh()}>{tr('refresh')}</button> : null}
      {error && !countries.length ? <button type="button" className="executive-button" disabled={Boolean(loading)} onClick={() => setCountryRevision(item => item + 1)}>{tr('retry')}</button> : null}
      {error && country && (!currencies.length || !methods.length) ? <button type="button" className="executive-button" disabled={Boolean(loading) || Boolean(busy)} onClick={() => { setError(''); if (!currencies.length) setCurrencyRevision(item => item + 1); else setMethodRevision(item => item + 1); }}>{tr('retry')}</button> : null}
      <p className={styles.hint}>{tr('finalPrice')}</p>
    </section>
    <section className={`executive-panel ${local.panel}`}><div className={local.historyHeading}><h2>{tr('history')}</h2><button type="button" className="executive-button" disabled={Boolean(busy)} onClick={() => setRevision(item => item + 1)}><RefreshCw size={16} aria-hidden="true" />{tr('refresh')}</button></div><p className={styles.hint}>{tr('confirmationCopy')}</p>
      {historyError ? <p className={local.error} role="alert">{tr('unavailable')}</p> : !history.length ? <p className={styles.hint}>{tr('empty')}</p> : <ul className={local.history}>{history.filter(item => item.destination.address === binding.linkedAddress).map(item => <li key={item.checkoutReference}><div><strong><bdi>{number(item.requestedAmount)} {item.sourceCurrencyCode}</bdi></strong><span>{providerName(item.serviceProvider)} · {stateLabel(item.confirmation?.state)}</span></div><button type="button" className="executive-button" disabled={Boolean(busy)} onClick={() => void checkStatus(item.checkoutReference)}>{tr('review')}</button></li>)}</ul>}
      {selected?.destination.address === binding.linkedAddress ? <div className={local.status} role="status"><strong>{stateLabel(selected.confirmation.state)}</strong>{selected.confirmation.state === 'confirmed' ? <bdi>{number(selected.confirmation.receivedAmount)} USDT</bdi> : <p>{tr('confirmationCopy')}</p>}</div> : null}
    </section>
    <details id="administrative-send" className={`executive-panel ${local.panel}`}><summary>{t('administrativeSigning.sendAction')}</summary><p className={styles.hint}>{tr('operationsUnavailable')}</p></details>
    <details id="administrative-offramp" className={`executive-panel ${local.panel}`}><summary>{t('administrativeSigning.withdrawAction')}</summary><p className={styles.hint}>{tr('operationsUnavailable')}</p></details>
    <details className={`executive-panel ${local.panel}`} onToggle={event => setLegacyOpen(event.currentTarget.open)}><summary>{tr('legacy')}</summary><p className={styles.hint}>{tr('legacyCopy')}</p>{legacyOpen ? <><WalletFundingHistory walletKind="administrative" refreshKey={0} readHistory={readSandbox} /><WalletFundingHistory walletKind="administrative" refreshKey={0} /></> : null}</details>
  </div></section>;
}
