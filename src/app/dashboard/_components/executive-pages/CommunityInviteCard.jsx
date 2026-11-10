"use client";

import { Check, Copy, Loader2, RotateCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useI18n } from "@/i18n/LanguageProvider";
import { readMemberJson, validMemberReferral } from "@/lib/member-read.mjs";
import { createClipboardFeedback, createLatestViewRequest } from "@/lib/member-view-effects.mjs";
import { referralLinkFrom } from "@/lib/referral-links.mjs";

export default function CommunityInviteCard({ editorOpen, onCloseEditor }) {
  const { locale, t } = useI18n();
  const [status, setStatus] = useState("loading");
  const [link, setLink] = useState("");
  const [feedback, setFeedback] = useState({ pending: "", copied: "", error: "" });
  const [message, setMessage] = useState(() => t("community.editorDefault"));
  const request = useRef(null);
  const clipboard = useRef(null);

  useEffect(() => {
    const active = createLatestViewRequest(
      signal => readMemberJson("/api/member/referral", { signal, validate: validMemberReferral }),
      {
        onStart: () => setStatus("loading"),
        onValue: data => {
          const next = referralLinkFrom(data);
          setLink(next);
          setStatus(next ? "ready" : "pending");
        },
        onError: () => { setLink(""); setStatus("error"); },
        onSettled: () => {},
      },
    );
    request.current = active;
    active.run();
    return () => { active.dispose(); if (request.current === active) request.current = null; };
  }, []);

  useEffect(() => {
    const active = createClipboardFeedback(setFeedback);
    clipboard.current = active;
    return () => { active.dispose(); if (clipboard.current === active) clipboard.current = null; };
  }, []);

  useEffect(() => setMessage(t("community.editorDefault")), [locale, t]);

  const linkCopy = async () => {
    if (link) await clipboard.current?.copy(link, "link");
  };
  const messageCopy = async () => clipboard.current?.copy(message, "message");

  return (
    <div className="mb-community-invite-card">
      <h2>{t("community.inviteTitle")}</h2>
      <p>{t("community.inviteCopy")}</p>
      <div className="mb-community-link-row">
        <div className="mb-community-link-field">
          <div className="mb-community-link-label">
            <span>{t("community.yourLink")}</span>
          </div>
          <strong title={link}>{linkText(status, link, t)}</strong>
        </div>
        <button className="executive-button primary mb-community-copy" type="button" disabled={!link || feedback.pending === "link"} onClick={linkCopy}>
          {feedback.pending === "link" ? <Loader2 className="animate-spin" size={16} /> : feedback.copied === "link" ? <Check size={16} /> : <Copy size={16} />}
          {feedback.copied === "link" ? t("community.copied") : t("community.copyLink")}
        </button>
      </div>
      {status === "error" ? <button className="mb-community-refresh" type="button" onClick={() => request.current?.run()}><RotateCw size={14} />{t("common.update")}</button> : null}

      {editorOpen ? <section className="mb-community-editor" aria-labelledby="community-editor-title">
        <div>
          <h3 id="community-editor-title">{t("community.editorTitle")}</h3>
          <p>{t("community.editorCopy")}</p>
        </div>
        <label htmlFor="community-invite-message">{t("community.editorLabel")}</label>
        <textarea id="community-invite-message" value={message} onChange={event => setMessage(event.target.value)} rows={4} />
        <small>{t("community.editorHelp")}</small>
        <div className="mb-community-editor-actions">
          <button className="executive-button" type="button" onClick={onCloseEditor}>{t("community.closeEditor")}</button>
          <button className="executive-button primary" type="button" disabled={!message.trim() || feedback.pending === "message"} onClick={messageCopy}>
            {feedback.copied === "message" ? <Check size={16} /> : <Copy size={16} />}
            {feedback.copied === "message" ? t("community.copied") : t("community.copyMessage")}
          </button>
        </div>
      </section> : null}

      <p className="mb-community-copy-status" role="status" aria-live="polite">
        {feedback.error ? t("community.copyError") : feedback.copied ? t("community.clipboardReady") : ""}
      </p>
    </div>
  );
}

function linkText(status, link, t) {
  if (status === "loading") return t("community.loadingLink");
  if (status === "error") return t("community.errorLink");
  if (status === "pending") return t("community.pendingLink");
  return link;
}
