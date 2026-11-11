"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { useMemberSession } from "@/lib/member-session-context";
import { personalWalletBalanceSessionKey } from "@/lib/personal-wallet-balance-store.mjs";
import { clearWalletSetupAfterAuth, consumeWalletSetupAfterAuth, resumeWalletSetupAfterAuth } from "@/lib/wallet-setup-handoff.mjs";
import { readWalletBinding } from "@/lib/wallet-binding.mjs";
import { useI18n } from "@/i18n/LanguageProvider";
import { useReownWallet } from "./ReownContext";

/** A UI handoff never authenticates or proves ownership. Only a confirmed
 * absent binding after a verified login may start initial wallet preparation. */
export function usePostAuthWalletSetup(member) {
  const owner = personalWalletBalanceSessionKey(member);
  const [request, setRequest] = useState(null);
  const attempt = useRef(null);
  useEffect(() => {
    if (!owner) { attempt.current = null; return undefined; }
    if (attempt.current?.owner !== owner) attempt.current = {
      owner, hint: consumeWalletSetupAfterAuth(member) || resumeWalletSetupAfterAuth(member), finished: false, controller: null,
    };
    const current = attempt.current;
    if (!current.hint || current.finished) return undefined;
    const controller = new AbortController();
    current.controller = controller;
    readWalletBinding({ signal: controller.signal }).then(binding => {
      if (controller.signal.aborted || attempt.current !== current) return;
      current.finished = true;
      if (binding.linked === false) setRequest(current.hint);
      else if (binding.linked === true) clearWalletSetupAfterAuth(current.hint);
    }).catch(() => {
      if (!controller.signal.aborted && attempt.current === current) current.finished = true;
      // Failure is not evidence of an absent wallet. Manual preparation remains
      // available; do not start a second login from a failed status query.
    });
    return () => controller.abort();
  }, [owner]);
  const finish = useCallback((ownerKey, createdAt) => {
    const current = attempt.current;
    if (current?.owner !== ownerKey || current.hint?.createdAt !== createdAt) return;
    current.finished = true; current.controller?.abort();
    clearWalletSetupAfterAuth(current.hint);
    setRequest(value => value?.ownerKey === ownerKey && value.createdAt === createdAt ? null : value);
  }, []);
  return { request: request?.ownerKey === owner && attempt.current?.owner === owner && attempt.current?.hint === request ? request : null, finish };
}

/** Initial Reown authentication may open once after Mindbliss OTP. Creating an
 * ownership proof remains explicit; this component never prepares a payment. */
export default function PostAuthWalletSetup({ request, onFinish }) {
  const { t } = useI18n();
  const owner = personalWalletBalanceSessionKey(useMemberSession());
  const reown = useReownWallet();
  const latest = useRef({ reown, owner, createdAt: request.createdAt }); latest.current = { reown, owner, createdAt: request.createdAt };
  const [stage, setStage] = useState("opening");
  const [failure, setFailure] = useState("funding.personalLinkFailed");
  const active = useRef(false), action = useRef(false);
  const ready = reown.linkStatus !== "loading";
  const live = () => active.current && latest.current.owner === request.ownerKey && latest.current.createdAt === request.createdAt;
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  useEffect(() => {
    if (!ready || owner !== request.ownerKey) return undefined;
    let stopped = false;
    const wallet = latest.current.reown;
    if (wallet.linkStatus === "linked") { onFinish(request.ownerKey, request.createdAt); return undefined; }
    if (!wallet.configured || wallet.linkStatus !== "unlinked") { setStage("error"); return undefined; }
    if (wallet.isConnected && !wallet.walletIdentityMismatch) { setStage("verify"); return undefined; }
    setStage("opening");
    // Shared connection requests coalesce callers and wait for SDK restoration.
    void wallet.connectWallet().then(() => {
      if (!stopped && latest.current.owner === request.ownerKey) setStage("verify");
    }).catch(() => {
      if (!stopped && latest.current.owner === request.ownerKey) setStage("error");
    });
    return () => { stopped = true; };
  }, [ready, owner, request.ownerKey, request.createdAt, onFinish]);

  async function proceed() {
    if (!live() || action.current) return;
    action.current = true; setStage("working"); setFailure("funding.personalLinkFailed");
    try {
      let wallet = latest.current.reown;
      if (wallet.linkStatus === "linked") { onFinish(request.ownerKey, request.createdAt); return; }
      if (wallet.linkStatus === "error") {
        await wallet.refreshLink();
        if (live()) setStage("verify"); return;
      }
      if (wallet.walletIdentityMismatch) {
        await wallet.chooseWallet();
        if (live()) setStage("verify"); return;
      }
      if (!wallet.isConnected) {
        await wallet.connectWallet();
        if (live()) setStage("verify"); return;
      }
      wallet = latest.current.reown;
      if (wallet.linkStatus !== "unlinked") throw new Error("wallet_setup_unavailable");
      await wallet.linkWallet();
      if (live()) onFinish(request.ownerKey, request.createdAt);
    } catch (error) { if (live()) { setFailure(error?.code === "wallet_address_in_use" ? "funding.walletAlreadyUsed" : "funding.personalLinkFailed"); setStage("error"); } }
    finally { action.current = false; }
  }
  async function chooseWallet() {
    if (!live() || action.current) return;
    action.current = true; setStage("working"); setFailure("funding.personalLinkFailed");
    try {
      await latest.current.reown.chooseWallet();
      if (live()) setStage("verify");
    } catch { if (live()) setStage("error"); }
    finally { action.current = false; }
  }
  if (owner !== request.ownerKey) return null;
  const busy = ["opening", "working"].includes(stage);
  return <section className="executive-panel mb-5 grid gap-3" aria-label={t("funding.prepareWallet")} aria-busy={busy}>
    <h2 className="flex items-center gap-2 text-base font-bold"><ShieldCheck size={18} aria-hidden="true" />{t("funding.prepareWallet")}</h2>
    <p className="text-sm leading-relaxed text-[var(--vp-muted)]">{t(reown.walletIdentityMismatch ? "funding.walletAccountMismatch" : stage === "verify" ? "walletPage.connectedPendingCopy" : "funding.prepareWalletCopy", { email: request.email })}</p>
    {stage === "error" ? <p role="alert" className="text-sm text-[var(--vp-danger)]">{t(failure)}</p> : null}
    {stage === "verify" && reown.address && !reown.walletIdentityMismatch ? <code dir="ltr" className="break-all text-sm">{reown.address}</code> : null}
    <div className="flex flex-wrap gap-3">
      {busy ? <p role="status" className="flex items-center gap-2 text-sm"><Loader2 className="animate-spin" size={16} aria-hidden="true" />{t("recharge.connecting")}</p>
        : <><button type="button" className="executive-button primary" onClick={() => void proceed()}>{t(reown.walletIdentityMismatch ? "funding.chooseWallet" : stage === "verify" ? "funding.verifyWallet" : "walletPage.retryCheck")}</button>
          {!reown.walletIdentityMismatch && (stage === "verify" || reown.isConnected) ? <button type="button" className="executive-button" onClick={() => void chooseWallet()}>{t("funding.chooseWallet")}</button> : null}
          <button type="button" className="executive-button" onClick={() => onFinish(request.ownerKey, request.createdAt)}>{t("recharge.notNow")}</button></>}
    </div>
  </section>;
}
