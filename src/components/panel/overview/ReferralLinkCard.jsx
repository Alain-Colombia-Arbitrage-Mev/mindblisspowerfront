"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Copy, Link2, RefreshCw, Share2 } from "lucide-react";
import { readMemberJson, validMemberReferral } from "@/lib/member-read.mjs";
import { referralLinkFrom } from '@/lib/referral-links.mjs';
import { createClipboardFeedback } from '@/lib/member-view-effects.mjs';
import { useI18n } from '@/i18n/LanguageProvider';

export default function ReferralLinkCard() {
  const { t } = useI18n();
  const [link, setLink] = useState("");
  const [code, setCode] = useState("");
  const [copyFeedback, setCopyFeedback] = useState({ pending: '', copied: '', error: '' });
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const request = useRef(null);
  const clipboard = useRef(null);

  const load = useCallback(() => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setStatus("loading"); setError(null); setLink(""); setCode("");
    return readMemberJson("/api/member/referral", { signal: controller.signal, validate: validMemberReferral })
      .then((data) => {
        if (controller.signal.aborted) return;
        if (!data.positioned) {
          setStatus("pending");
          setLink("");
          setCode("");
          return;
        }
        const nextLink = referralLinkFrom(data);
        setLink(nextLink);
        setCode(data.code || "");
        setStatus(nextLink ? "ready" : "pending");
      })
      .catch((failure) => {
        if (!controller.signal.aborted) { setStatus("error"); setError(failure); }
      });
  }, []);
  useEffect(() => { load(); return () => request.current?.abort(); }, [load]);
  useEffect(() => {
    const active = createClipboardFeedback(setCopyFeedback);
    clipboard.current = active;
    return () => { active.dispose(); if (clipboard.current === active) clipboard.current = null; };
  }, []);

  async function copy() {
    if (!link) return;
    await clipboard.current?.copy(link, "link");
  }

  return (
    <div className="vp-overview-referral">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Share2 size={18} style={{ color: "var(--vp-accent)" }} />
        <h2 className="text-sm font-bold" style={{ color: "var(--vp-text)" }}>{t("referralCard.title")}</h2>
        {code ? <span className="ml-auto text-xs font-semibold" style={{ color: "var(--vp-muted)" }}>{t("referralCard.code", { code })}</span> : null}
      </div>
      <p className="mb-4 text-xs leading-5" style={{ color: "var(--vp-muted)" }}>
        {status === "error" ? t("referralCard.unavailable") : status === "loading" ? t("referralCard.loading") : status === "ready"
          ? t("referralCard.ready") : t("referralCard.pending")}
      </p>
      {status === "error" ? <div role="alert" className="mb-3">{error?.status === 401
        ? <Link href="/login" className="executive-button">{t("referralCard.signIn")}</Link>
        : <button type="button" onClick={load} className="executive-button"><RefreshCw size={15} />{t("referralCard.retry")}</button>}</div> : null}

      <div>
        <SideLink label={t("referralCard.automatic")} hint={t("referralCard.automaticHint")} Icon={Link2} link={link} status={status} copied={copyFeedback.copied === "link"} onCopy={copy} t={t} />
      </div>
      {copyFeedback.error ? <p role="alert" className="mt-2 text-xs" style={{ color: 'var(--vp-danger)' }}>{copyFeedback.error}</p> : null}
    </div>
  );
}

function SideLink({ label, hint, Icon, link, status, copied, onCopy, t }) {
  return (
    <section className="min-w-0 rounded-xl border p-3" style={{ background: "var(--vp-surface)", borderColor: "var(--vp-border)" }}>
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "var(--vp-accent-muted)", color: "var(--vp-accent)" }}>
          <Icon size={16} />
        </span>
        <div>
          <p className="m-0 text-xs font-bold" style={{ color: "var(--vp-text)" }}>{label}</p>
          <p className="m-0 text-[10px] font-semibold" style={{ color: "var(--vp-subtle)" }}>{hint}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <input readOnly value={displayValue(status, link, t)} onFocus={(event) => event.target.select()} aria-label={t("referralCard.inputLabel", { label })} className="min-h-11 w-full min-w-0 rounded-lg px-3 text-xs font-semibold outline-none" style={{ background: "var(--vp-bg)", border: "1px solid var(--vp-border)", color: "var(--vp-text)" }} />
        <button type="button" onClick={onCopy} disabled={!link} aria-label={t("referralCard.copyLabel", { label })} className="executive-button primary flex min-h-11 w-11 shrink-0 items-center justify-center p-0 disabled:opacity-60">
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>
    </section>
  );
}

function displayValue(status, link, t) {
  if (link) return link;
  if (status === "loading") return t("referralCard.loadingValue");
  if (status === "error") return t("referralCard.unavailable");
  return t("referralCard.pendingValue");
}
