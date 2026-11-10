"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, MessageCircleQuestion, MessageSquareText, Network } from "lucide-react";
import { useState } from "react";

import { useI18n } from "@/i18n/LanguageProvider";

import { PageHeader } from "./executive-ui";
import CommunityInviteCard from "./CommunityInviteCard";

export function ReferralsDashboardPage() {
  const { t } = useI18n();
  const [editorOpen, setEditorOpen] = useState(false);
  const tools = [
    { icon: BookOpen, title: t("community.guideTitle"), copy: t("community.guideCopy"), label: t("community.guideAction"), href: "/dashboard/support" },
    { icon: MessageSquareText, title: t("community.messageTitle"), copy: t("community.messageCopy"), label: t("community.messageAction"), action: () => setEditorOpen(true) },
    { icon: MessageCircleQuestion, title: t("community.faqTitle"), copy: t("community.faqCopy"), label: t("community.faqAction"), href: "/dashboard/support" },
  ];
  return (
    <section className="executive-page mb-community-page">
      <div className="executive-container">
        <PageHeader
          eyebrow={t("community.eyebrow")}
          title={t("community.title")}
          subtitle={t("community.subtitle")}
          action={<Link className="executive-button" href="/dashboard">{t("community.back")}</Link>}
        />

        <section className="mb-community-intro">
          <CommunityInviteCard editorOpen={editorOpen} onCloseEditor={() => setEditorOpen(false)} />
          <div className="mb-community-value">
            <h2>{t("community.connectionTitle")}</h2>
            <p>{t("community.connectionCopy")}</p>
            <strong>{t("community.motto")}</strong>
          </div>
        </section>

        <section className="mb-community-tools" aria-labelledby="community-tools-title">
          <h2 id="community-tools-title">{t("community.toolsTitle")}</h2>
          <div>
            {tools.map(({ icon: Icon, title, copy, label, href, action }) => (
              <article key={title}>
                <span><Icon size={18} /></span>
                <div><h3>{title}</h3><p>{copy}</p></div>
                {href ? <Link href={href}>{label} <ArrowRight size={14} /></Link>
                  : <button type="button" onClick={action}>{label} <ArrowRight size={14} /></button>}
              </article>
            ))}
          </div>
        </section>

        <section className="mb-community-network">
          <Network size={30} aria-hidden="true" />
          <div><h2>{t("community.networkTitle")}</h2><p>{t("community.networkCopy")}</p></div>
          <Link className="executive-button" href="/dashboard/network">{t("community.networkAction")} <ArrowRight size={14} /></Link>
        </section>
      </div>
    </section>
  );
}
