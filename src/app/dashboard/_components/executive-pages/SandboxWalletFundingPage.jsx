'use client';

import { ArrowDownToLine, ArrowUpRight, CheckCircle2, Loader2, Plus, RefreshCw, ShieldCheck, Wallet } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useMemberSession } from '@/lib/member-session-context';
import { useWalletReown } from '@/components/reown/WalletReownContext';
import { useSandboxWalletBinding } from '@/components/reown/SandboxWalletBindingProvider';
import { walletReownOwnerKey } from '@/lib/wallet-reown-connection.mjs';
import { createSandboxWalletCheckout, readSandboxWalletOptions, readSandboxWalletFundingHistory, readSandboxWalletFundingStatus } from '@/lib/sandbox-wallet-client.mjs';
import { SANDBOX_WALLET_COUNTRIES } from '@/lib/sandbox-wallet-contract.mjs';
import { walletReownCheckoutReturn } from '@/lib/wallet-reown-checkout-return.mjs';
import { useI18n } from '@/i18n/LanguageProvider';
import { AdministrativeSandboxFundingForm } from './WalletFundingForm';
import WalletFundingHistory from './WalletFundingHistory';
import WalletFundingStatus from './WalletFundingStatus';
import { administrativeFundingError, WalletActionError, WalletAddress } from './WalletFundingUI';
import styles from './wallet-funding.module.css';
import walletStyles from './sandbox-wallet.module.css';

const PROVIDERS = ['TRANSAK'];
export default function SandboxWalletFundingPage() {
  const session = useMemberSession(), owner = walletReownOwnerKey(session);
  return owner ? <SandboxWalletFundingView key={owner} ownerSubject={session.subject} /> : null;
}

export function SandboxWalletFundingView({ ownerSubject }) {
  const { t } = useI18n(), binding = useSandboxWalletBinding(), reown = useWalletReown();
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [reference, setReference] = useState(''), [revision, setRevision] = useState(0);
  const [legacyOpen, setLegacyOpen] = useState(false), [legacyReference, setLegacyReference] = useState('');
  const mounted = useRef(false), request = useRef(null), epoch = useRef(0), live = useRef(null);
  live.current = { binding, reown };
  const cancel = useCallback(() => { epoch.current++; request.current?.controller.abort(); try { request.current?.popup?.close(); } catch { /* best effort */ }
    request.current = null; if (mounted.current) setBusy(false); }, []);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; cancel(); }; }, [cancel]);
  useEffect(() => { cancel(); setReference(''); setError(''); }, [reown.address, reown.provider, reown.chainId, binding.linkedAddress, cancel]);
  useEffect(() => {
    if (!binding.loading && binding.configured && binding.linkedAddress) {
      const callback = walletReownCheckoutReturn(window.location?.search); if (callback) setReference(callback);
    }
  }, [binding.loading, binding.configured, binding.linkedAddress, reown.address, reown.provider, reown.chainId]);
  useEffect(() => {
    const scroll = () => { const id = window.location?.hash?.slice(1); if (!['administrative-wallet', 'administrative-signing', 'administrative-send', 'administrative-offramp'].includes(id)) return;
      const target = document.getElementById(id); if (target && mounted.current) target.scrollIntoView({ block: 'start' }); };
    scroll(); window.addEventListener('hashchange', scroll); return () => window.removeEventListener('hashchange', scroll);
  }, [binding.loading]);
  const readOptions = useCallback((country, provider, options) => {
    if (!live.current.binding.canFund()) return Promise.reject(Error('sandbox_wallet_verification_required'));
    return readSandboxWalletOptions(country, provider, { ...options, ownerSubject });
  }, [ownerSubject]);
  const readHistory = useCallback(async (_kind, options) => {
    try { return await readSandboxWalletFundingHistory({ ...options, ownerSubject }); }
    catch (failure) { if (['unauthenticated', 'sandbox_wallet_forbidden'].includes(failure?.message)) live.current.binding.retire(); throw failure; }
  }, [ownerSubject]);
  const readStatus = useCallback(async (_kind, checkoutReference, options) => {
    try { return await readSandboxWalletFundingStatus(checkoutReference, { ...options, ownerSubject }); }
    catch (failure) { if (['unauthenticated', 'sandbox_wallet_forbidden'].includes(failure?.message)) live.current.binding.retire(); throw failure; }
  }, [ownerSubject]);
  const clearSelection = useCallback(() => { if (mounted.current) { setError(''); setReference(''); } }, []);
  const openCheckout = useCallback(async input => {
    if (!mounted.current || request.current || input.serviceProvider !== 'TRANSAK' || !live.current.binding.canFund()) return;
    let popup;
    try { popup = window.open('about:blank', '_blank'); if (popup) popup.opener = null; } catch { /* Manual popup error below. */ }
    if (!popup) { setError(t('sandboxWallet.popupBlocked')); return; }
    const controller = new AbortController(), generation = ++epoch.current, address = live.current.binding.linkedAddress;
    const operation = { controller, popup }; request.current = operation; setBusy(true); setError(''); setReference('');
    try {
      const session = await createSandboxWalletCheckout({ requestId: input.requestId, country: input.countryCode, sourceCurrencyCode: input.sourceCurrencyCode,
        amount: input.amount, paymentMethodType: input.paymentMethodType }, address, { signal: controller.signal, ownerSubject });
      if (!mounted.current || controller.signal.aborted || epoch.current !== generation || !live.current.binding.canFund() || live.current.binding.linkedAddress !== address) {
        try { popup.close(); } catch { /* best effort */ } return;
      }
      setReference(session.checkoutReference);
      if (popup.closed) setError(t('sandboxWallet.popupClosed')); else popup.location.replace(session.checkoutUrl);
    } catch (failure) {
      try { popup.close(); } catch { /* best effort */ }
      if (mounted.current && !controller.signal.aborted && epoch.current === generation) {
        if (failure?.message === 'sandbox_wallet_verification_required') { live.current.binding.invalidateActivation(); setError(t('sandboxWallet.expired')); }
        else if (['unauthenticated', 'sandbox_wallet_forbidden'].includes(failure?.message)) live.current.binding.retire();
        else setError(administrativeFundingError(failure, t));
      }
    } finally { if (request.current === operation) { request.current = null; if (mounted.current) { setBusy(false); setRevision(value => value + 1); } } }
  }, [ownerSubject, t]);

  return <section className="executive-page"><div className={`executive-container ${styles.screen}`}>
    <header className={styles.pageHeading}><div><h1>{t('sandboxWallet.title')}</h1><span>{t('sandboxWallet.copy')}</span></div><p className={styles.providerBadge}>{t('sandboxWallet.sandbox')}</p></header>
    <div className={styles.sandboxNotice} role="status"><ShieldCheck size={20} aria-hidden="true" /><div><strong>{t('sandboxWallet.sandbox')}</strong><p>{t('sandboxWallet.notice')}</p></div></div>
    <nav className={styles.actionNavigation} aria-label={t('administrativeSigning.actionsLabel')}>
      <a href="#administrative-wallet"><Plus size={20} aria-hidden="true" />{t('administrativeSigning.fundingAction')}</a>
      <a href="#administrative-send"><ArrowUpRight size={20} aria-hidden="true" />{t('administrativeSigning.sendAction')}</a>
      <a href="#administrative-offramp"><ArrowDownToLine size={20} aria-hidden="true" />{t('administrativeSigning.withdrawAction')}</a>
    </nav>
    <SandboxWalletActivation />
    {binding.status !== 'retired' ? <>
      <section id="administrative-wallet" tabIndex={-1} className={`executive-panel ${styles.formPanel} ${walletStyles.section}`} aria-labelledby="sandbox-funding-title">
        <div className={styles.sectionHeading}><Wallet size={20} aria-hidden="true" /><div><h2 id="sandbox-funding-title">{t('walletPage.addFundsAction')}</h2><p>{t('sandboxWallet.sandbox')} · USDT · Polygon</p></div></div>
        {binding.canFund() ? <AdministrativeSandboxFundingForm key={binding.linkedAddress} disabled={busy} busy={busy} onContinue={openCheckout} onSelectionChange={clearSelection}
          destinationAddress={binding.linkedAddress} providersAllowed={PROVIDERS} countriesAllowed={SANDBOX_WALLET_COUNTRIES} readOptions={readOptions} />
          : <p className={styles.hint}>{t(binding.loading ? 'sandboxWallet.loading' : 'sandboxWallet.notActivated')}</p>}
        <WalletActionError message={error} />
      </section>
      <section id="administrative-send" tabIndex={-1} className={`executive-panel ${walletStyles.section}`}><h2>{t('sandboxWallet.send')}</h2><p className={styles.hint}>{t('sandboxWallet.operationsUnavailable')}</p></section>
      <section id="administrative-offramp" tabIndex={-1} className={`executive-panel ${walletStyles.section}`}><h2>{t('sandboxWallet.withdraw')}</h2><p className={styles.hint}>{t('sandboxWallet.operationsUnavailable')}</p></section>
      {binding.configured && binding.linkedAddress ? <section className={`executive-panel ${walletStyles.section}`} aria-labelledby="sandbox-history-title"><h2 id="sandbox-history-title">{t('sandboxWallet.history')}</h2>
        <WalletFundingHistory key={binding.linkedAddress} walletKind="administrative" refreshKey={revision} readHistory={readHistory} expectedAddress={binding.linkedAddress} showHeading={false} onSelectRequest={setReference} />
        {reference ? <WalletFundingStatus walletKind="administrative" checkoutReference={reference} readStatus={readStatus} expectedAddress={binding.linkedAddress} /> : null}
      </section> : null}
      <details className={`executive-panel ${walletStyles.legacy}`} onToggle={event => { if (mounted.current) setLegacyOpen(event.currentTarget.open); }}>
        <summary>{t('sandboxWallet.legacy')}</summary><p className={styles.hint}>{t('sandboxWallet.legacyCopy')}</p>
        {legacyOpen ? <><WalletFundingHistory walletKind="administrative" refreshKey={0} onSelectRequest={setLegacyReference} />{legacyReference ? <WalletFundingStatus walletKind="administrative" checkoutReference={legacyReference} /> : null}</> : null}
      </details>
    </> : null}
  </div></section>;
}

export function SandboxWalletActivation() {
  const { t } = useI18n(), binding = useSandboxWalletBinding(), reown = useWalletReown();
  const [connectionError, setConnectionError] = useState(false), [copyError, setCopyError] = useState(false);
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const connect = async () => { if (!mounted.current) return; setConnectionError(false); try { await reown.connectWallet(); } catch { if (mounted.current) setConnectionError(true); } };
  const disconnect = async () => { if (!mounted.current) return; try { await reown.disconnectWallet(); } catch { if (mounted.current) setConnectionError(true); } };
  const ready = binding.canFund(), locked = binding.loading || binding.busy || binding.status === 'retired';
  return <section id="administrative-signing" tabIndex={-1} className={`executive-panel ${walletStyles.section}`} aria-busy={binding.loading || binding.busy}>
    <div className={styles.sectionHeading}>{ready ? <CheckCircle2 size={22} aria-hidden="true" /> : <Wallet size={22} aria-hidden="true" />}<div><h2>{t('sandboxWallet.connection')}</h2><p>{t(binding.loading ? 'sandboxWallet.loading' : ready ? 'sandboxWallet.active' : 'sandboxWallet.notActivated')}</p></div></div>
    <WalletAddress address={binding.address} label={t('sandboxWallet.address')} loading={binding.loading} emptyLabel={t('sandboxWallet.noWallet')} onCopyError={() => { if (mounted.current) setCopyError(true); }} />
    <div className={walletStyles.actions}>
      {binding.status === 'retired' ? <a className="executive-button primary" href="/dashboard/wallet-administrative">{t('sandboxWallet.reload')}</a>
        : !reown.isConnected ? <button type="button" className="executive-button primary" disabled={locked || reown.isRestoring || !reown.configured} onClick={() => void connect()}>{t('sandboxWallet.connect')}</button>
          : <>{!ready && !binding.mismatch ? <button type="button" className="executive-button primary" disabled={locked || !binding.configured} onClick={() => void binding.activate()}>{binding.busy ? <Loader2 className="animate-spin" size={16} aria-hidden="true" /> : null}{t(binding.busy ? 'sandboxWallet.activating' : reown.chainId !== 137 ? 'sandboxWallet.network' : 'sandboxWallet.activate')}</button> : null}
            <button type="button" className="executive-button" disabled={locked} onClick={() => void disconnect()}>{t('sandboxWallet.choose')}</button></>}
      {binding.status !== 'retired' ? <button className="executive-button" type="button" disabled={locked} onClick={() => void binding.refresh()}><RefreshCw size={15} aria-hidden="true" />{t('sandboxWallet.refresh')}</button> : null}
    </div>
    {binding.error || binding.mismatch || connectionError || copyError ? <p role="alert" className={walletStyles.error}>{t(copyError ? 'walletPage.administrativeCopyFailed' : `sandboxWallet.${binding.mismatch ? 'mismatch' : binding.error || 'unavailable'}`)}</p> : null}
  </section>;
}
