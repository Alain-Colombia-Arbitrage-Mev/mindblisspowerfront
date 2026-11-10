"use client";

import * as Popover from "@radix-ui/react-popover";
import {
  ArrowUpRight,
  ChevronRight,
  ChevronUp,
  Headphones,
  Inbox,
  Mail,
  MessageCircle,
  MessageSquare,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ChatwootWidget from "@/app/_components/ChatwootWidget";
import { useI18n } from "@/i18n/LanguageProvider";

const supportEmail = "soporte@mindblisspower.com";

export default function SupportWidget() {
  const { t } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  function openPlatformChat(event) {
    if (typeof window !== "undefined" && window.$chatwoot?.toggle) {
      event.preventDefault();
      window.$chatwoot.toggle("open");
      setOpen(false);
    }
  }

  const close = () => setOpen(false);

  return (
    <>
      <ChatwootWidget />
      <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button className="vp-support-launcher" type="button" aria-label={open ? t("support.closeCenter") : t("support.openCenter")}>
          <span className="vp-support-launcher-icon" aria-hidden="true"><Headphones size={22} /></span>
          <span className="vp-support-launcher-copy">
            <strong>{open ? t("support.openHelp") : t("support.needHelp")}</strong>
            <small>{open ? t("support.closeHelp") : t("support.talk")}</small>
          </span>
          <ChevronUp className={open ? "rotate-180" : undefined} size={18} aria-hidden="true" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="vp-support-panel"
          side="top"
          align="end"
          sideOffset={12}
          collisionPadding={12}
          aria-label={t("support.title")}
        >
          <header className="vp-support-panel-header">
            <div className="vp-support-panel-bar">
              <Headphones size={22} aria-hidden="true" />
              <strong>{t("support.title")}</strong>
              <Popover.Close className="vp-support-panel-close" aria-label={t("support.closeCenter")}><X size={18} /></Popover.Close>
            </div>
            <div>
              <h2>{t("support.heading")}</h2>
              <p>{t("support.copy")}</p>
            </div>
          </header>

          <div className="vp-support-channels">
            <SupportChannel href="/dashboard/support" onClick={openPlatformChat} icon={MessageCircle} title={t("support.chat")} description={t("support.chatCopy")} />
            <SupportChannel href="/dashboard/support" onClick={close} icon={MessageSquare} title={t("support.whatsapp")} description={t("support.whatsappCopy")} external />
            <SupportChannel href={`mailto:${supportEmail}`} onClick={close} icon={Mail} title={t("support.email")} description={t("support.emailCopy")} />
            <SupportChannel href="/dashboard/support" onClick={close} icon={Inbox} title={t("support.tickets")} description={t("support.ticketsCopy")} />
          </div>

          <Link className="vp-support-panel-footer" href="/dashboard/support" onClick={close}>{t("support.viewCenter")}</Link>
          <Popover.Arrow className="vp-support-panel-arrow" width={18} height={9} />
        </Popover.Content>
      </Popover.Portal>
      </Popover.Root>
    </>
  );
}

function SupportChannel({ href, onClick, icon: Icon, title, description, external = false }) {
  return (
    <Link className="vp-support-channel" href={href} onClick={onClick}>
      <Icon size={20} aria-hidden="true" />
      <span><strong>{title}</strong><small>{description}</small></span>
      {external ? <ArrowUpRight size={16} aria-hidden="true" /> : <ChevronRight size={16} aria-hidden="true" />}
    </Link>
  );
}
