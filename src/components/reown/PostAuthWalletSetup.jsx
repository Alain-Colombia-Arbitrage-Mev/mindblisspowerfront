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

/** One explicit activation starts authentication and the unique ownership
 * proof. Effects never open a wallet, sign a message or prepare a payment. */
export default function PostAuthWalletSetup({ request, onFinish }) {
  const { t } = useI18n();
  const owner = personalWalletBalanceSessionKey(useMemberSession());
  const reown = useReownWallet();
  const latest = useRef({ reown, owner, createdAt: request.createdAt }); latest.current = { reown, owner, createdAt: request.createdAt };
  const [stage, setStage] = useState("ready");
  const [failure, setFailure] = useState("funding.personalLinkFailed");
  const active = useRef(false), action = useRef(false), completed = useRef("");
  const ready = reown.linkStatus !== "loading";
  const live = () => active.current && latest.current.owner === request.ownerKey && latest.current.createdAt === request.createdAt;
  const finish = useCallback(() => {
    const key = JSON.stringify([request.ownerKey, request.createdAt]);
    if (!active.current || latest.current.owner !== request.ownerKey || latest.current.createdAt !== request.createdAt || completed.current === key) return;
    completed.current = key; onFinish(request.ownerKey, request.createdAt);
  }, [request.ownerKey, request.createdAt, onFinish]);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  useEffect(() => {
    if (!ready || owner !== request.ownerKey) return undefined;
    const wallet = latest.current.reown;
    if (wallet.linkStatus === "linked") { finish(); return undefined; }
    if (!wallet.configured || wallet.linkStatus !== "unlinked") { setStage("error"); return undefined; }
    if (!action.current) setStage("ready");
    return undefined;
  }, [ready, owner, request.ownerKey, request.createdAt, reown.linkStatus, finish]);

  async function proceed() {
    if (!live() || action.current) return;
    action.current = true; setStage("working"); setFailure("funding.personalLinkFailed");
    try {
      const wallet = latest.current.reown;
      if (wallet.linkStatus === "linked") { finish(); return; }
      if (wallet.linkStatus === "error") {
        await wallet.refreshLink();
        if (live()) setStage("ready"); return;
      }
      if (!wallet.configured || wallet.linkStatus !== "unlinked") throw new Error("wallet_setup_unavailable");
      const result = await wallet.prepareWallet();
      if (result?.linked !== true || !/^0x[0-9a-f]{40}$/i.test(result.address || "")) throw new Error("wallet_setup_unavailable");
      if (live()) finish();
    } catch (error) { if (live()) { setFailure(error?.code === "wallet_address_in_use" ? "funding.walletAlreadyUsed" : "funding.personalLinkFailed"); setStage("error"); } }
    finally { action.current = false; }
  }
  async function chooseWallet() {
    if (!live() || action.current) return;
    action.current = true; setStage("working"); setFailure("funding.personalLinkFailed");
    try {
      await latest.current.reown.chooseWallet();
      if (live()) setStage("ready");
    } catch { if (live()) setStage("error"); }
    finally { action.current = false; }
  }
  if (owner !== request.ownerKey) return null;
  const busy = !ready || stage === "working";
  return <section className="executive-panel mb-5 grid gap-3" aria-label={t("funding.activateWallet")} aria-busy={busy}>
    <h2 className="flex items-center gap-2 text-base font-bold"><ShieldCheck size={18} aria-hidden="true" />{t("funding.activateWallet")}</h2>
    <p className="text-sm leading-relaxed text-[var(--vp-muted)]">{t(reown.walletIdentityMismatch ? "funding.walletAccountMismatch" : "funding.activateWalletCopy", { email: request.email })}</p>
    {stage === "error" ? <p role="alert" className="text-sm text-[var(--vp-danger)]">{t(failure)}</p> : null}
    <div className="flex flex-wrap gap-3">
      {busy ? <p role="status" className="flex items-center gap-2 text-sm"><Loader2 className="animate-spin" size={16} aria-hidden="true" />{t(ready ? "funding.activatingWallet" : "walletPage.checking")}</p>
        : <><button type="button" className="executive-button primary" disabled={!reown.configured} onClick={() => void proceed()}>{t(reown.linkStatus === "error" ? "walletPage.retryCheck" : "funding.activateWallet")}</button>
          {reown.isConnected || reown.walletIdentityMismatch ? <button type="button" className="executive-button" onClick={() => void chooseWallet()}>{t("funding.chooseWallet")}</button> : null}
          <button type="button" className="executive-button" onClick={() => onFinish(request.ownerKey, request.createdAt)}>{t("recharge.notNow")}</button></>}
    </div>
  </section>;
}
