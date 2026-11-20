'use client';

import { CheckCircle2, CreditCard, Info, Landmark, Loader2, RefreshCw, Wallet } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useMemberSession } from '@/lib/member-session-context';
import { useWalletReown } from '@/components/reown/WalletReownContext';
import { useSandboxWalletBinding } from '@/components/reown/SandboxWalletBindingProvider';
import { walletReownOwnerKey } from '@/lib/wallet-reown-connection.mjs';
import { readProductionDiscovery, readProductionOptions, createProductionFunding, readProductionHistory, readProductionStatus } from '@/lib/wallet-production-funding-client.mjs';
import useProductionFundingQuote from '@/components/wallet/useProductionFundingQuote';
import ProductionCountrySelect from '@/components/wallet/ProductionCountrySelect';
import WalletUsdcBalance from '@/components/wallet/WalletUsdcBalance';
import { MEXICO_FUNDING_METHODS, mexicoFundingOption, productionFundingCurrencies, productionFundingDestinationChoices, productionFundingLimits, productionFundingValue, productionFundingProviderSupported, PRODUCTION_QUOTE_TTL_MS } from '@/lib/production-funding-selection.mjs';
import { walletProductionAsset, walletProductionDestinationCode, walletProductionFailureLog } from '@/lib/wallet-production-funding-contract.mjs';
import { readSandboxWalletFundingHistory } from '@/lib/sandbox-wallet-client.mjs';
import { FUNDING_UUID } from '@/lib/wallet-funding-contract.mjs';
import { useI18n } from '@/i18n/LanguageProvider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { WalletAddress } from './WalletFundingUI';
import WalletDepositQr from './WalletDepositQr';
import WalletFundingHistory from './WalletFundingHistory';
import styles from './wallet-funding.module.css';
import local from './production-wallet.module.css';

const names = { CREDIT_DEBIT_CARD: 'onramp.cardPayment', LOCAL_BANK_TRANSFER: 'onramp.bankTransfer', OPEN_BANKING: 'walletProduction.openBanking', MOBILE_MONEY: 'walletProduction.mobileMoney' };
const providerName = value => ({ ONRAMPMONEY: 'Onramp Money', ALCHEMYPAY: 'Alchemy Pay', BANXA: 'Banxa', ONMETA: 'Onmeta',
  YELLOWCARD: 'Yellow Card', RAMPNOW: 'RampNow', TRANSAK: 'Transak', TOPPER: 'Topper' })[value] || value;
const methodName = value => ({ APPLE_PAY: 'Apple Pay', GOOGLE_PAY: 'Google Pay', SPEI: 'SPEI', PSE: 'PSE', SEPA: 'SEPA', ACH: 'ACH' })[value] || value.replaceAll('_', ' ');
const destinationLabel = destination => {
  const asset = walletProductionAsset(walletProductionDestinationCode(destination));
  return asset ? asset.asset + ' · ' + asset.networkName : '';
};
const availableMethods = (routes, currency, decimals) => [...new Set(routes.flatMap(route => route.paymentMethods.map(item => item.method)))]
  .filter(method => productionFundingLimits(routes, currency, method, decimals));
export default function ProductionWalletFundingPage() {
  const session = useMemberSession(), owner = walletReownOwnerKey(session);
  return owner ? <ProductionWalletView key={owner} ownerSubject={session.subject} /> : null;
}
export function ProductionWalletView({ ownerSubject }) {
  const { t, locale } = useI18n(), binding = useSandboxWalletBinding(), reown = useWalletReown();
  const tr = (key, variables = undefined) => t(`walletProduction.${key}`, variables);
  const [countries, setCountries] = useState([]), [currencies, setCurrencies] = useState([]);
  const [country, setCountry] = useState(''), [currency, setCurrency] = useState(''), [amount, setAmount] = useState(''), [method, setMethod] = useState('');
  const [amountMode, setAmountMode] = useState('unset'), [selectedProvider, setSelectedProvider] = useState('');
  const [catalogRoutes, setRoutes] = useState([]), [loading, setLoading] = useState('countries'), [busy, setBusy] = useState(''), [error, setError] = useState('');
  const [catalogDestinationCode, setCatalogDestinationCode] = useState('');
  const [preferredDestinationCode, setPreferredDestinationCode] = useState('');
  const [mexicoOptions, setMexicoOptions] = useState({ choices: [], incomplete: false });
  const isMexico = country === 'MX';
  const mexicoChoice = isMexico ? mexicoOptions.choices.find(choice => choice.currency === currency) : null;
  const routes = isMexico ? mexicoChoice?.routes ?? [] : catalogRoutes;
  const destinationChoices = productionFundingDestinationChoices(routes, currency, method);
  const fundingDestinationCode = isMexico ? mexicoChoice?.destinationCurrencyCode ?? ''
    : destinationChoices.includes(preferredDestinationCode) ? preferredDestinationCode : catalogDestinationCode;
  const fundingAsset = walletProductionAsset(fundingDestinationCode);
  const explicitDestinationCode = destinationChoices.includes(fundingDestinationCode) ? fundingDestinationCode : '';
  const [revision, setRevision] = useState(0), [countryRevision, setCountryRevision] = useState(0), [history, setHistory] = useState([]), [selected, setSelected] = useState(null);
  const [legacyOpen, setLegacyOpen] = useState(false), [historyError, setHistoryError] = useState(false);
  const [currencyRevision, setCurrencyRevision] = useState(0), [methodRevision, setMethodRevision] = useState(0);
  const [activationRequested, setActivationRequested] = useState(false);
  const mounted = useRef(false), operation = useRef(null), generation = useRef(0), live = useRef(null);
  const catalogVersion = useRef(0), currencyChosen = useRef(false);
  const methodChosen = useRef(false), providerChosen = useRef(false);
  live.current = { binding, country, currency, amount, method, quote: null, routes, fundingDestinationCode, explicitDestinationCode, loading };
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
  const reset = () => { cancel(); live.current.quote = null; quoteState.invalidate(); setError(''); };
  const changeCountry = value => {
    if (value === live.current.country) return;
    catalogVersion.current++; currencyChosen.current = false; methodChosen.current = false; providerChosen.current = false;
    reset(); setLoading(''); setSelected(null); setCountry(value); setCurrencies([]); setCurrency('');
    setMethod(''); setRoutes([]); setCatalogDestinationCode(''); setAmount(''); setAmountMode('unset'); setSelectedProvider(''); setPreferredDestinationCode('');
    setMexicoOptions({ choices: [], incomplete: false });
  };
  const chooseMexicoMethod = choice => {
    const current = live.current;
    if (current.country !== 'MX' || current.loading || current.currency === choice.currency) return;
    reset(); setCurrency(choice.currency); setMethod(choice.method);
    setAmount(''); setAmountMode('unset'); setSelectedProvider('');
  };
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; cancel(); }; }, [cancel]);
  useEffect(() => {
    const controller = new AbortController(), version = catalogVersion.current; setLoading('countries');
    const current = () => !controller.signal.aborted && catalogVersion.current === version;
    readProductionDiscovery('', { ownerSubject, signal: controller.signal }).then(value => { if (current()) {
      setCountries(value.countries); setError('');
      if (live.current.country && !value.countries.some(item => item.code === live.current.country)) changeCountry('');
    } })
      .catch(failure => { if (current()) setError(fail(failure)); }).finally(() => { if (current()) setLoading(''); });
    return () => controller.abort();
  }, [ownerSubject, countryRevision, fail]);
  useEffect(() => {
    if (!country) return undefined;
    const controller = new AbortController(), version = catalogVersion.current; setLoading('currencies');
    const current = () => !controller.signal.aborted && catalogVersion.current === version && live.current.country === country;
    readProductionDiscovery(country, { ownerSubject, signal: controller.signal }).then(async value => {
      if (!current()) return;
      const offered = productionFundingCurrencies(value); setCurrencies(offered.currencies);
      if (country === 'MX') {
        const reads = await Promise.allSettled(MEXICO_FUNDING_METHODS.map(async choice => {
          const fiat = offered.currencies.find(item => item.code === choice.currency);
          if (!fiat) return null;
          const options = await readProductionOptions(country, choice.currency, { ownerSubject, signal: controller.signal });
          return mexicoFundingOption(choice, options, fiat.decimalPlaces);
        }));
        if (!current()) return;
        const choices = reads.flatMap(result => result.status === 'fulfilled' && result.value ? [result.value] : []);
        const failures = reads.filter(result => result.status === 'rejected');
        for (const failure of failures) fail(failure.reason);
        setMexicoOptions({ choices, incomplete: failures.length > 0 });
        if (live.current.currency && !choices.some(choice => choice.currency === live.current.currency)) {
          reset(); setCurrency(''); setMethod(''); setAmount(''); setAmountMode('unset'); setSelectedProvider('');
        }
        return;
      }
      if (live.current.currency && !offered.currencies.some(item => item.code === live.current.currency)) {
        reset(); setCurrency(''); setRoutes([]); setMethod(''); setAmount(''); setAmountMode('unset'); setSelectedProvider(''); setPreferredDestinationCode('');
      } else if (!live.current.currency && !currencyChosen.current) setCurrency(offered.currencies.length === 1 ? offered.currencies[0].code : offered.defaultCurrencyCode);
    }).catch(failure => { if (current()) setError(fail(failure)); }).finally(() => { if (current()) setLoading(''); });
    return () => controller.abort();
  }, [country, ownerSubject, currencyRevision, fail]);
  useEffect(() => {
    if (country === 'MX') return undefined;
    setRoutes([]); setCatalogDestinationCode('');
    if (!country || !currency) return undefined;
    const controller = new AbortController(); setLoading('methods');
    readProductionOptions(country, currency, { ownerSubject, signal: controller.signal }).then(value => {
      if (controller.signal.aborted) return; setRoutes(value.routes);
      if (value.routes.length) setCatalogDestinationCode(value.destinationCurrencyCode ?? 'USDT_POLYGON');
      const methods = availableMethods(value.routes, currency, currencies.find(item => item.code === currency)?.decimalPlaces ?? 2);
      if (live.current.method && !methods.includes(live.current.method)) { methodChosen.current = true; reset(); setMethod(''); }
      else if (!live.current.method && !methodChosen.current && methods.length === 1) { methodChosen.current = true; setMethod(methods[0]); }
    }).catch(failure => { if (!controller.signal.aborted) setError(fail(failure)); }).finally(() => { if (!controller.signal.aborted) setLoading(''); });
    return () => controller.abort();
  }, [country, currency, ownerSubject, methodRevision, fail]);
  useEffect(() => { cancel(); setSelected(null); }, [binding.linkedAddress, cancel]);
  useEffect(() => {
    const controller = new AbortController(); setHistoryError(false);
    readProductionHistory({ ownerSubject, signal: controller.signal }).then(value => { if (!controller.signal.aborted) setHistory(value.records); })
      .catch(failure => { if (!controller.signal.aborted) { setHistoryError(true); fail(failure); } });
    return () => controller.abort();
  }, [ownerSubject, revision, fail]);
  const number = value => new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
  const decimals = currencies.find(item => item.code === currency)?.decimalPlaces ?? 2;
  const methods = availableMethods(routes, currency, decimals);
  const amountRoutes = explicitDestinationCode ? routes.filter(route => route.serviceProvider === 'RAMPNOW') : routes;
  const limits = productionFundingLimits(amountRoutes, currency, method, decimals), minimum = limits?.minimum, maximum = limits?.maximum;
  const eligible = productionFundingValue(amount, limits, decimals) !== null;
  useEffect(() => {
    if (minimum !== undefined && amountMode !== 'manual') { setAmount(String(minimum)); setAmountMode('automatic'); }
  }, [minimum, amountMode]);
  const canQuote = useCallback(() => mounted.current && live.current.binding.canReceive(), []);
  const quotedInput = { country, sourceCurrencyCode: currency, amount: Number(amount), paymentMethodType: method,
    ...(explicitDestinationCode ? { destinationCurrencyCode: explicitDestinationCode } : {}) };
  const quoteState = useProductionFundingQuote({ ownerSubject, address: binding.linkedAddress, destinationCurrencyCode: fundingDestinationCode, ready, valid: eligible && Boolean(fundingAsset) && !loading,
    blocked: Boolean(busy), canRun: canQuote, failureKey: fail,
    input: quotedInput });
  const quotedDestinationCode = walletProductionDestinationCode(quoteState.quote?.destination);
  const quoteCompatible = quoteState.quote && quotedDestinationCode && quotedDestinationCode === fundingDestinationCode &&
    quoteState.quote.quotes.every(item => productionFundingProviderSupported(routes, item.serviceProvider, quotedInput, decimals));
  const quote = quoteCompatible ? quoteState.quote : null; live.current.quote = quote;
  useEffect(() => { if (quoteState.quote && !loading && !quoteCompatible) quoteState.expire(); }, [quoteState.quote, quoteCompatible, loading, quoteState.expire]);
  const checkoutProvider = isMexico ? mexicoChoice?.serviceProvider : selectedProvider;
  const checkoutQuote = quote?.quotes.find(item => item.serviceProvider === checkoutProvider);
  const providerAvailable = Boolean(checkoutQuote);
  useEffect(() => {
    if (isMexico || !quote || quote.quotes.some(item => item.serviceProvider === selectedProvider)) return;
    if (!providerChosen.current && quote.quotes.length === 1) { providerChosen.current = true; setSelectedProvider(quote.quotes[0].serviceProvider); }
    else if (selectedProvider) setSelectedProvider('');
  }, [isMexico, quote, selectedProvider]);
  const requestInput = () => {
    const current = live.current;
    return { country: current.country, sourceCurrencyCode: current.currency, amount: Number(current.amount), paymentMethodType: current.method,
      ...(current.explicitDestinationCode ? { destinationCurrencyCode: current.explicitDestinationCode } : {}) };
  };
  const open = async provider => {
    const current = live.current;
    if (!mounted.current || current.loading || !current.binding.canReceive() || operation.current || !quote || current.quote !== quote || quote.destination.address !== current.binding.linkedAddress
      || quote.country !== current.country || quote.sourceCurrencyCode !== current.currency || quote.requestedAmount !== Number(current.amount)
      || quote.paymentMethodType !== current.method || quotedDestinationCode !== current.fundingDestinationCode || !quote.quotes.some(item => item.serviceProvider === provider)
      || !productionFundingProviderSupported(current.routes, provider, requestInput(), decimals)) return;
    if (Date.now() - quote.receivedAt >= PRODUCTION_QUOTE_TTL_MS) { quoteState.retry(); return; }
    let popup; try { popup = window.open('about:blank', '_blank'); if (popup) popup.opener = null; } catch { /* handled below */ }
    if (!popup) { setError('popup'); return; }
    const controller = new AbortController(), epoch = ++generation.current, address = binding.linkedAddress;
    operation.current = { controller, popup }; setBusy(provider); setError('');
    try { const result = await createProductionFunding({ ...requestInput(), serviceProvider: provider, requestId: crypto.randomUUID() }, address, { ownerSubject, signal: controller.signal });
      if (!mounted.current || controller.signal.aborted || generation.current !== epoch || !live.current.binding.canReceive() || live.current.binding.linkedAddress !== address) { popup.close(); return; }
      if (walletProductionDestinationCode(result.destination) !== quotedDestinationCode || live.current.fundingDestinationCode !== quotedDestinationCode) {
        popup.close(); quoteState.expire(); setError('quoteExpired'); return;
      }
      if (popup.closed) { setError('popup'); return; } popup.location.replace(result.checkoutUrl); quoteState.expire(); setRevision(item => item + 1);
    } catch (failure) { try { popup.close(); } catch { /* cleanup */ } if (mounted.current && !controller.signal.aborted && generation.current === epoch) { console.warn('wallet_production_checkout_failed', walletProductionFailureLog(failure)); quoteState.expire(); setError(fail(failure)); setRevision(item => item + 1); } }
    finally { if (generation.current === epoch) { operation.current = null; if (mounted.current) setBusy(''); } }
  };
  const checkStatus = useCallback(async reference => {
    if (!mounted.current || operation.current || !FUNDING_UUID.test(reference)) return;
    const controller = new AbortController(), epoch = ++generation.current; operation.current = { controller }; setBusy('status'); setError(''); setSelected(null);
    try {
      const result = await readProductionStatus(reference, { ownerSubject, signal: controller.signal });
      if (mounted.current && generation.current === epoch && !controller.signal.aborted && result.destination.address === live.current.binding.linkedAddress) {
        setSelected(result);
        if (result.confirmation.state === 'confirmed') setRevision(item => item + 1);
      }
    }
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
  const displayError = error || quoteState.error;
  const selectedDestination = destinationLabel(selected?.confirmedDestination ?? selected?.destination);
  const canRequestQuote = eligible && ready && !quote && Boolean(quoteState.error || error === 'quoteExpired');
  const readSandbox = useCallback((_kind, options) => readSandboxWalletFundingHistory({ ...options, ownerSubject }), [ownerSubject]);
  return <section className="executive-page"><div className={`executive-container ${styles.screen}`}>
    <header className={styles.pageHeading}><div><h1>{tr('title')}</h1><span>{tr('copy')}</span></div><p className={styles.providerBadge}>USDC</p></header>
    <section className={`executive-panel ${local.panel}`} aria-busy={binding.loading || binding.busy}>
      <div className={styles.sectionHeading}>{ready ? <CheckCircle2 size={22} aria-hidden="true" /> : <Wallet size={22} aria-hidden="true" />}<div><h2>{tr('connection')}</h2><p>{tr(ready ? 'active' : binding.loading ? 'loading' : 'activationCopy')}</p></div></div>
      <WalletAddress address={binding.linkedAddress || binding.address} label={t('sandboxWallet.address')} loading={binding.loading} emptyLabel={t('sandboxWallet.noWallet')} />
      {ready && binding.linkedAddress ? <div className={local.walletTools}>
        <WalletUsdcBalance key={binding.linkedAddress + '-polygon'} address={binding.linkedAddress} refreshKey={revision} className={styles.hint} />
        <WalletUsdcBalance key={binding.linkedAddress + '-arbitrum'} address={binding.linkedAddress} network="arbitrum" refreshKey={revision} className={styles.hint} />
        <WalletUsdcBalance key={binding.linkedAddress + '-ethereum'} address={binding.linkedAddress} network="ethereum" refreshKey={revision} className={styles.hint} />
        <WalletDepositQr key={binding.linkedAddress} address={binding.linkedAddress} />
      </div> : null}
      {ready ? <p className={styles.hint}>{tr('receivingCopy')}</p> : <div className={local.actions}><button type="button" className="executive-button primary" disabled={binding.loading || binding.busy || reown.isRestoring || !reown.configured || binding.mismatch || binding.status === 'retired'} onClick={() => void activate()}>{binding.busy ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : null}{tr(binding.busy ? 'activating' : reown.isConnected ? 'activate' : 'connect')}</button><button type="button" className="executive-button" disabled={binding.loading || binding.busy || binding.status === 'retired'} onClick={() => void binding.refresh()}><RefreshCw size={16} aria-hidden="true" />{tr('refresh')}</button></div>}
      {binding.mismatch || binding.error ? <p role="alert" className={local.error}>{binding.mismatch ? tr('mismatch') : t(`sandboxWallet.${binding.error}`)}</p> : null}
      {binding.mismatch ? <button type="button" className="executive-button" disabled={binding.busy || Boolean(busy)} onClick={() => { setActivationRequested(false); void reown.disconnectWallet().catch(() => { if (mounted.current) setError('unavailable'); }); }}>{t('sandboxWallet.choose')}</button> : null}
    </section>
    <section id="administrative-wallet" className={`executive-panel ${local.panel}`} aria-labelledby="production-funding-title">
      <div className={styles.sectionHeading}><CreditCard size={22} aria-hidden="true" /><div><h2 id="production-funding-title">{tr('addFunds')}</h2><p>{tr('production')}{fundingAsset ? <> · {fundingAsset.asset} · {fundingAsset.networkName}</> : null}</p></div></div>
      {!ready ? <p className={styles.hint}>{tr('activationRequired')}</p> : <form onSubmit={event => {
        event.preventDefault();
        if (canRequestQuote && !loading && !busy && !quoteState.loading) { setError(''); quoteState.retry(); return; }
        if (checkoutProvider) void open(checkoutProvider);
      }} className={local.form}>
        <div className={local.fields} data-method-first={isMexico}><div className={local.field}><div className={local.label}><label htmlFor="production-country">{tr('country')}</label><Popover><PopoverTrigger asChild><button type="button" className={local.info} aria-label={tr('residence')}><Info size={18} aria-hidden="true" /></button></PopoverTrigger><PopoverContent className={local.residence}>{tr('residence')}</PopoverContent></Popover></div>
          <ProductionCountrySelect id="production-country" value={country} countries={countries} disabled={Boolean(busy) || loading === 'countries'} onChange={changeCountry}
            locale={locale} label={tr('country')} placeholder={tr(loading === 'countries' ? 'loading' : 'chooseCountry')} searchLabel={tr('searchCountry')} emptyLabel={tr('emptyCountries')} /></div>
          {isMexico ? <fieldset className={`${local.providers} ${local.mexicoMethods}`} aria-busy={Boolean(loading)}>
            <legend>{tr('method')}</legend>
            {loading ? <p role="status" className={local.quoteLoading}><Loader2 size={17} className="animate-spin" aria-hidden="true" />{tr('loading')}</p> : null}
            {mexicoOptions.choices.length ? <div className={local.methodChoices}>{mexicoOptions.choices.map(choice => {
              const card = choice.method === 'CREDIT_DEBIT_CARD', Icon = card ? CreditCard : Landmark;
              return <label key={choice.currency} className={local.methodChoice} data-selected={currency === choice.currency}>
                <input type="radio" id={`production-mexico-${choice.currency}`} name="production-mexico-method" value={choice.currency} checked={currency === choice.currency}
                  disabled={Boolean(busy) || Boolean(loading)} onChange={() => chooseMexicoMethod(choice)} />
                <Icon size={20} aria-hidden="true" />
                <span><strong>{tr(card ? 'mexicoCard' : 'mexicoBank')}</strong><small>{tr(card ? 'mexicoCardCurrency' : 'mexicoBankCurrency')}</small></span>
              </label>;
            })}</div> : null}
            {!loading && !error && !mexicoOptions.choices.length && !mexicoOptions.incomplete ? <p className={styles.hint} role="status">{tr('mexicoNoMethod')}</p> : null}
            {!loading && mexicoOptions.incomplete ? <div className={local.methodRetry}>
              <p className={styles.hint} role="status">{tr('mexicoAvailability')}</p>
              <button type="button" className="executive-button" disabled={Boolean(busy)} onClick={() => { setError(''); setCurrencyRevision(item => item + 1); }}>{tr('retry')}</button>
            </div> : null}
          </fieldset> : <><div className={local.field}><label htmlFor="production-currency">{tr('currency')}</label>{currencies.length === 1 && currency === currencies[0].code
            ? <output id="production-currency" className={local.fixedValue}><bdi>{currency} · {currencies[0].name}</bdi></output>
            : <select id="production-currency" value={currency} disabled={Boolean(busy) || !currencies.length || Boolean(loading)} required onChange={event => { catalogVersion.current++; currencyChosen.current = true; methodChosen.current = false; providerChosen.current = false; reset(); setCurrency(event.target.value); setMethod(''); setRoutes([]); setAmount(''); setAmountMode('unset'); setSelectedProvider(''); setPreferredDestinationCode(''); }}><option value="">{tr('selectCurrency')}</option>{currencies.map(item => <option key={item.code} value={item.code}>{item.code} · {item.name}</option>)}</select>}</div>
          <div className={local.field}><label htmlFor="production-method">{tr('method')}</label>{methods.length === 1 && method === methods[0]
            ? <input id="production-method" value={names[method] ? t(names[method]) : methodName(method)} readOnly className={local.fixedValue} />
            : <select id="production-method" value={method} disabled={Boolean(busy) || Boolean(loading) || !methods.length} required onChange={event => { methodChosen.current = true; reset(); setMethod(event.target.value); setPreferredDestinationCode(''); }}><option value="">{tr(loading === 'methods' ? 'loading' : 'selectMethod')}</option>{methods.map(item => <option key={item} value={item}>{names[item] ? t(names[item]) : methodName(item)}</option>)}</select>}</div></>}
          {destinationChoices.length > 1 ? <div className={local.field}><label htmlFor="production-network">{tr('receiveNetwork')}</label>
            <select id="production-network" value={fundingDestinationCode} disabled={Boolean(busy) || Boolean(loading)} aria-describedby="production-network-hint" onChange={event => {
              const code = event.target.value;
              if (code === live.current.fundingDestinationCode || !destinationChoices.includes(code)) return;
              reset(); setPreferredDestinationCode(code);
            }}>
              {destinationChoices.map(code => <option key={code} value={code}>{walletProductionAsset(code).networkName}</option>)}
            </select><span id="production-network-hint" className={styles.hint}>{tr('rampNowNetworkHint')}</span></div> : null}
          {!isMexico || mexicoChoice ? <div className={local.field}><label htmlFor="production-amount">{tr('amount')} {currency ? `(${currency})` : ''}</label><input id="production-amount" type="number" inputMode={decimals ? 'decimal' : 'numeric'} min={minimum} max={maximum} step={decimals ? '0.01' : '1'} value={amount} disabled={Boolean(busy) || !method || !limits} required placeholder={currency ? tr('amountPlaceholder', { currency }) : ''}
            aria-describedby="production-amount-hint" aria-invalid={Boolean(amountMode === 'manual' && amount && !eligible)} onChange={event => { const next = event.target.value; if (!next || Number(next) !== Number(amount)) reset(); setAmount(next); setAmountMode('manual'); }} />
            <span id="production-amount-hint" className={styles.hint}>{limits ? tr('limits', { min: number(minimum), max: number(maximum), currency }) : tr('chooseMethod')}</span>
            {limits && amountMode === 'manual' && amount && !eligible ? <><span className={local.fieldError} role="alert">{tr('invalidAmount', { min: number(minimum), max: number(maximum), currency })}</span><button className={local.minimum} type="button" onClick={() => { reset(); setAmount(String(minimum)); setAmountMode('manual'); }}>{tr('useMinimum', { amount: number(minimum), currency })}</button></> : null}</div> : null}
        </div>
        {explicitDestinationCode && destinationChoices.length === 1 ? <p className={styles.hint}>{tr('rampNowNetworkHint')}</p> : null}
        {country && currency && !loading && !methods.length ? <p role="status" className={styles.hint}>{tr('noRoute')}</p> : null}
        {quoteState.loading ? <p role="status" className={local.quoteLoading}><Loader2 size={17} className="animate-spin" aria-hidden="true" />{tr('quoteLoading')}</p> : null}
        {isMexico && checkoutQuote ? <div className={local.paymentSummary} aria-live="polite">
          <strong>{tr('quoteReady', { amount: number(quote.requestedAmount), currency })}</strong>
          <span>{tr('receive')} <bdi>{number(checkoutQuote.destinationAmount)} {fundingAsset.asset}</bdi> · {fundingAsset.networkName}</span>
          <span>{tr('fees', { amount: number(checkoutQuote.totalFee), currency })}</span>
        </div> : null}
        {!isMexico && quote ? <fieldset className={local.providers}><legend>{tr('provider')}</legend><p className={styles.hint}>{tr('quoteReady', { amount: number(quote.requestedAmount), currency: quote.sourceCurrencyCode })}</p><div className={local.quotes}>{quote.quotes.map(item => <label key={item.serviceProvider} className={local.quote} data-selected={selectedProvider === item.serviceProvider}>
          <input type="radio" name="production-provider" value={item.serviceProvider} checked={selectedProvider === item.serviceProvider} disabled={Boolean(busy)} aria-label={tr('quoteSelection', { provider: providerName(item.serviceProvider) })} onChange={() => { if (mounted.current && live.current.quote === quote && live.current.binding.canReceive()) { providerChosen.current = true; setSelectedProvider(item.serviceProvider); } }} />
          <strong>{providerName(item.serviceProvider)}</strong><span>{tr('receive')}</span><bdi className={local.received}>{number(item.destinationAmount)} {quote.destination.asset}</bdi><span>{explicitDestinationCode ? tr('quotedNetwork', { network: fundingAsset.networkName }) : fundingAsset.networkName}</span><span>{tr('fees', { amount: number(item.totalFee), currency: quote.sourceCurrencyCode })}</span></label>)}</div>
          {!providerAvailable ? <p className={styles.hint}>{tr('chooseProvider')}</p> : null}</fieldset> : null}
        {!isMexico || mexicoChoice ? <button type="submit" className={`executive-button primary ${local.fund}`} disabled={!eligible || !ready || (!providerAvailable && !canRequestQuote) || quoteState.loading || Boolean(loading) || Boolean(busy)}>
          {busy && busy !== 'status' ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : null}
          {busy && busy !== 'status' ? tr('opening') : isMexico && providerAvailable ? tr('continue', { provider: providerName(checkoutProvider) }) : tr('addFunds')}
        </button> : null}
      </form>}
      {displayError ? <p role="alert" className={local.error}>{tr(displayError)}</p> : null}
      {error === 'activationRequired' ? <button type="button" className="executive-button" disabled={binding.loading || binding.busy || Boolean(busy)} onClick={() => void binding.refresh()}>{tr('refresh')}</button> : null}
      {error && !countries.length ? <button type="button" className="executive-button" disabled={Boolean(loading)} onClick={() => setCountryRevision(item => item + 1)}>{tr('retry')}</button> : null}
      {error && country && (!currencies.length || (!isMexico && !methods.length) || (isMexico && !mexicoOptions.choices.length && !mexicoOptions.incomplete)) ? <button type="button" className="executive-button" disabled={Boolean(loading) || Boolean(busy)} onClick={() => { setError(''); if (isMexico || !currencies.length) setCurrencyRevision(item => item + 1); else setMethodRevision(item => item + 1); }}>{tr('retry')}</button> : null}
      <p className={styles.hint}>{tr('finalPrice')}</p>
    </section>
    <section className={`executive-panel ${local.panel}`}><div className={local.historyHeading}><h2>{tr('history')}</h2><button type="button" className="executive-button" disabled={Boolean(busy)} onClick={() => setRevision(item => item + 1)}><RefreshCw size={16} aria-hidden="true" />{tr('refresh')}</button></div><p className={styles.hint}>{tr('confirmationCopy')}</p>
      {historyError ? <p className={local.error} role="alert">{tr('unavailable')}</p> : !history.length ? <p className={styles.hint}>{tr('empty')}</p> : <ul className={local.history}>
        {history.filter(item => item.destination.address === binding.linkedAddress).map(item => <li key={item.checkoutReference}>
          <div><strong><bdi>{number(item.requestedAmount)} {item.sourceCurrencyCode}</bdi></strong>
            <span>{providerName(item.serviceProvider)} · {stateLabel(item.status === 'unavailable' ? 'failed' : item.confirmation?.state)}</span>
            {item.confirmedDestination ? <span>{tr('receivedNetwork', { network: destinationLabel(item.confirmedDestination) })}</span> : null}
            {(!item.confirmedDestination || item.confirmedDestination.chainId !== item.destination.chainId) ? <span>{item.serviceProvider === 'RAMPNOW'
              ? tr('quotedNetwork', { network: destinationLabel(item.destination) }) : destinationLabel(item.destination)}</span> : null}
          </div>
          <button type="button" className="executive-button" disabled={Boolean(busy)} onClick={() => void checkStatus(item.checkoutReference)}>{tr('review')}</button>
        </li>)}
      </ul>}
      {selected && selected.destination.address === binding.linkedAddress ? <div className={local.status} role="status">
        <strong>{stateLabel(selected.confirmation.state)}</strong>
        {selected.confirmation.state === 'confirmed' ? <>
          <bdi>{number(selected.confirmation.receivedAmount)} {selectedDestination}</bdi>
          {selected.confirmedDestination && selected.confirmedDestination.chainId !== selected.destination.chainId
            ? <p>{tr('quotedNetwork', { network: destinationLabel(selected.destination) })}</p> : null}
        </> : <><p>{selected.serviceProvider === 'RAMPNOW' ? tr('quotedNetwork', { network: selectedDestination }) : selectedDestination}</p><p>{tr('confirmationCopy')}</p></>}
      </div> : null}
    </section>
    <details id="administrative-send" className={`executive-panel ${local.panel}`}><summary>{t('administrativeSigning.sendAction')}</summary><p className={styles.hint}>{tr('operationsUnavailable')}</p></details>
    <details id="administrative-offramp" className={`executive-panel ${local.panel}`}><summary>{t('administrativeSigning.withdrawAction')}</summary><p className={styles.hint}>{tr('operationsUnavailable')}</p></details>
    <details className={`executive-panel ${local.panel}`} onToggle={event => setLegacyOpen(event.currentTarget.open)}><summary>{tr('legacy')}</summary><p className={styles.hint}>{tr('legacyCopy')}</p>{legacyOpen ? <><WalletFundingHistory walletKind="administrative" refreshKey={0} readHistory={readSandbox} /><WalletFundingHistory walletKind="administrative" refreshKey={0} /></> : null}</details>
  </div></section>;
}
