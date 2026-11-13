"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useI18n } from "@/i18n/LanguageProvider";
import { useMemberSession } from "@/lib/member-session-context";
import { walletFundingOwnerKey } from "@/lib/wallet-funding-owner.mjs";
import { administrativeAddress } from "@/lib/administrative-signing-contract.mjs";
import { readAdministrativeSignerCapabilities, readAdministrativeSignerStatus, createAdministrativeSignerChallenge, verifyAdministrativeSigner } from "@/lib/administrative-signing-client.mjs";
import { discoverAdministrativeProviders, readAdministrativeProvider, switchAdministrativeProviderNetwork, administrativeProviderMatches,
  signAdministrativeOwnership, watchAdministrativeProvider } from "@/lib/administrative-injected-provider.mjs";
import AdministrativeTransferDraft from "./AdministrativeTransferDraft";
import AdministrativeOfframpMethods from "./AdministrativeOfframpMethods";
import styles from "./administrative-operations.module.css";

export default function AdministrativeWalletOperations({ assignedAddress, disabled = false }) {
  const owner = walletFundingOwnerKey(useMemberSession());
  return owner ? <OperationsView key={`${owner}:${assignedAddress}`} assignedAddress={assignedAddress} disabled={disabled} /> : null;
}

export function OperationsView({ assignedAddress, disabled }) {
  const { t } = useI18n(), id = useId();
  const [capability, setCapability] = useState(null), [binding, setBinding] = useState(null), [providers, setProviders] = useState([]);
  const [providerId, setProviderId] = useState(""), [connection, setConnection] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const mounted = useRef(false), request = useRef(null), epoch = useRef(0), blocked = useRef(false), providersRef = useRef([]);
  const manualConnection = useRef(false);
  blocked.current = disabled || !administrativeAddress(assignedAddress); providersRef.current = providers;
  const provider = providers.find(item => item.id === providerId)?.provider;
  const verified = binding?.verified === true && Date.parse(binding.expiresAt) > Date.now();
  const ready = !blocked.current && capability?.configured === true && verified && administrativeProviderMatches(connection, assignedAddress);
  const live = useRef({ ready: false, provider: null, expiresAt: "" }); live.current = { ready, provider, expiresAt: binding?.expiresAt || "" };
  const invalidate = () => { epoch.current++; request.current?.abort(); request.current = null; setConnection(null); setBusy(false); };
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; epoch.current++; request.current?.abort(); }; }, []);
  useEffect(() => {
    if (blocked.current) return undefined;
    return discoverAdministrativeProviders(value => { if (mounted.current && !blocked.current) setProviders(value); });
  }, [disabled, assignedAddress]);
  useEffect(() => {
    if (blocked.current) { invalidate(); setBinding(null); setCapability(null); return undefined; }
    const controller = new AbortController(), generation = epoch.current;
    setError(""); setBinding(null);
    void readAdministrativeSignerCapabilities({ signal: controller.signal }).then(async value => {
      if (!mounted.current || controller.signal.aborted || epoch.current !== generation) return;
      setCapability(value);
      if (value.configured) {
        const next = await readAdministrativeSignerStatus(assignedAddress, { signal: controller.signal });
        if (mounted.current && !controller.signal.aborted && epoch.current === generation) setBinding(next);
      }
    }).catch(() => { if (mounted.current && !controller.signal.aborted && epoch.current === generation) setError("unavailable"); });
    return () => controller.abort();
  }, [disabled, assignedAddress, revision]);
  useEffect(() => {
    if (!verified || !capability?.configured || blocked.current) return undefined;
    const controller = new AbortController(), generation = epoch.current;
    void (async () => {
      for (const item of providers) {
        try {
          const next = await readAdministrativeProvider(item.provider, { signal: controller.signal });
          if (!mounted.current || controller.signal.aborted || epoch.current !== generation) return;
          if (administrativeProviderMatches(next, assignedAddress)) { setProviderId(item.id); setConnection(next); return; }
        } catch { if (controller.signal.aborted) return; }
      }
    })();
    return () => controller.abort();
  }, [verified, capability?.configured, providers, assignedAddress]);
  useEffect(() => {
    if (!provider) return undefined;
    return watchAdministrativeProvider(provider, () => {
      if (!mounted.current) return;
      const restoreManualConnection = manualConnection.current;
      invalidate(); setError("changed");
      // An explicitly requested connect/switch commonly emits its own change
      // event. Retire that old operation, then inspect the new state read-only.
      if (!restoreManualConnection || blocked.current) return;
      const controller = new AbortController(), generation = epoch.current;
      request.current = controller; setBusy(true);
      void readAdministrativeProvider(provider, { signal: controller.signal }).then(next => {
        if (mounted.current && !controller.signal.aborted && epoch.current === generation) {
          setConnection(next); setError(next.address.toLowerCase() === assignedAddress.toLowerCase() ? "" : "mismatch");
        }
      }).catch(() => {}).finally(() => {
        if (request.current === controller) { request.current = null; manualConnection.current = false; }
        if (mounted.current && !controller.signal.aborted && epoch.current === generation) setBusy(false);
      });
    });
  }, [provider]);

  async function perform(action) {
    if (!mounted.current || blocked.current || !capability?.configured || request.current || !provider) return;
    const controller = new AbortController(), generation = epoch.current;
    request.current = controller; manualConnection.current = action === "connect" || action === "switch"; setBusy(true); setError("");
    const active = () => mounted.current && !blocked.current && !controller.signal.aborted && epoch.current === generation;
    try {
      if (action === "verify") {
        const current = await readAdministrativeProvider(provider, { signal: controller.signal });
        if (!active()) return;
        if (!administrativeProviderMatches(current, assignedAddress)) throw Error("administrative_signer_mismatch");
        const challenge = await createAdministrativeSignerChallenge(assignedAddress, { signal: controller.signal });
        if (!active()) return;
        const signature = await signAdministrativeOwnership(provider, challenge.message, assignedAddress, { signal: controller.signal });
        if (!active()) return;
        const next = await verifyAdministrativeSigner({ challengeId: challenge.challengeId, signature }, assignedAddress, { signal: controller.signal });
        if (active()) { setBinding(next); setConnection(current); }
      } else {
        const next = action === "switch" ? await switchAdministrativeProviderNetwork(provider, { signal: controller.signal })
          : await readAdministrativeProvider(provider, { requestAccess: true, signal: controller.signal });
        if (!active()) return;
        setConnection(next);
        if (next.address.toLowerCase() !== assignedAddress.toLowerCase()) setError("mismatch");
      }
    } catch (failure) { if (active()) setError(failure?.code === 4001 ? "rejected" : failure?.message === "administrative_signer_mismatch" ? "mismatch"
      : failure?.message === "administrative_signing_invalid_challenge" ? "verificationExpired" : failure?.message === "administrative_signing_rate_limited" ? "rateLimited" : "unavailable"); }
    finally { if (request.current === controller) { request.current = null; manualConnection.current = false; } if (active()) setBusy(false); }
  }
  async function ensureActive() {
    if (!mounted.current || blocked.current || !live.current.ready || !live.current.provider || Date.parse(live.current.expiresAt) <= Date.now()) throw Error("administrative_transfer_binding_required");
    const next = await readAdministrativeProvider(live.current.provider);
    if (!mounted.current || !live.current.ready || Date.parse(live.current.expiresAt) <= Date.now() || !administrativeProviderMatches(next, assignedAddress)) throw Error("administrative_transfer_binding_required");
  }
  function selectProvider(value) {
    if (!mounted.current || blocked.current || request.current || !providersRef.current.some(item => item.id === value)) return;
    invalidate(); setProviderId(value); setError("");
  }
  return <>
    <section className={`executive-panel ${styles.panel}`} aria-label={t("administrativeSigning.title")}>
      <h2>{t("administrativeSigning.title")}</h2><p>{t("administrativeSigning.copy")}</p>
      <code dir="ltr">{assignedAddress || t("walletPage.destinationUnavailable")}</code>
      {capability?.configured ? <>
        <p role="status">{t(ready ? "administrativeSigning.active" : verified ? "administrativeSigning.verifiedInactive" : "administrativeSigning.verificationNeeded")}</p>
        {providers.length ? <label htmlFor={`${id}-provider`}>{t("administrativeSigning.provider")}<select id={`${id}-provider`} value={providerId} disabled={busy || blocked.current} onChange={event => selectProvider(event.target.value)}>
          <option value="">{t("administrativeSigning.chooseProvider")}</option>{providers.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select></label> : <p>{t("administrativeSigning.noProvider")}</p>}
        <div className={styles.actions}><button type="button" className="executive-button" disabled={busy || !provider || blocked.current} onClick={() => void perform("connect")}>{t("administrativeSigning.connect")}</button>
          {connection?.address?.toLowerCase() === assignedAddress?.toLowerCase() && connection?.chainId !== "0x89" ? <button type="button" className="executive-button" disabled={busy} onClick={() => void perform("switch")}>{t("administrativeSigning.switchNetwork")}</button> : null}
          {!verified && administrativeProviderMatches(connection, assignedAddress) ? <button type="button" className="executive-button executive-button-primary" disabled={busy} onClick={() => void perform("verify")}>{t("administrativeSigning.verify")}</button> : null}</div>
      </> : capability ? <p>{t("administrativeSigning.configuration")}</p> : <p>{t("common.loading")}</p>}
      {error ? <p role="alert">{t(`administrativeSigning.${error}`)}</p> : null}
      <button type="button" className="executive-button" disabled={busy || blocked.current} onClick={() => { if (mounted.current && !request.current) setRevision(value => value + 1); }}>{t("administrativeSigning.refresh")}</button>
    </section>
    <AdministrativeTransferDraft assignedAddress={assignedAddress} signerReady={ready} ensureActive={ensureActive} disabled={blocked.current} onSignerInvalid={() => { if (mounted.current) setBinding(null); }} />
    <AdministrativeOfframpMethods disabled={blocked.current} expectedAddress={assignedAddress} signerReady={ready}
      offrampEnabled={capability?.canPrepareOfframp === true}
      canPrepare={() => mounted.current && !blocked.current && live.current.ready && Date.parse(live.current.expiresAt) > Date.now()}
      onSignerRequired={() => { if (mounted.current) { live.current.ready = false; invalidate(); setBinding(null); } }} />
  </>;
}
