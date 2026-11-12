"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Expand, Play, X } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { useI18n } from "@/i18n/LanguageProvider";
import { claimWalletTutorial } from "@/lib/wallet-funding-tutorial.mjs";
import WalletTutorialVideo from "./WalletTutorialVideo";
import styles from "./wallet-funding-tutorial.module.css";

function preferences() {
  try { return window.localStorage; } catch { return undefined; }
}

export default function WalletFundingTutorial({ ownerId = "" }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const reveal = () => {
      if (document.visibilityState === "hidden") return;
      if (claimWalletTutorial(ownerId, preferences())) setOpen(true);
    };
    reveal();
    document.addEventListener("visibilitychange", reveal);
    return () => document.removeEventListener("visibilitychange", reveal);
  }, [ownerId]);

  function showTutorial() {
    claimWalletTutorial(ownerId, preferences());
    setOpen(true);
  }

  return <>
    <section className={styles.card} aria-labelledby={titleId}>
      <div className={styles.cardHeading}>
        <span className={styles.icon}><Play size={19} aria-hidden="true" /></span>
        <div><h2 id={titleId}>{t("walletTutorial.title")}</h2><span>{t("walletTutorial.duration")}</span></div>
      </div>
      <WalletTutorialVideo paused={open} />
      <button type="button" className={styles.openButton} onClick={showTutorial}>
        <Expand size={16} aria-hidden="true" />{t("walletTutorial.open")}
      </button>
    </section>
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {open ? <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.dialog} aria-describedby={descriptionId}>
          <header className={styles.dialogHeader}>
            <div><Dialog.Title>{t("walletTutorial.title")}</Dialog.Title>
              <Dialog.Description id={descriptionId}>{t("walletTutorial.description")}</Dialog.Description></div>
            <Dialog.Close asChild><button type="button" className={styles.closeButton} aria-label={t("walletTutorial.close")}>
              <X size={20} aria-hidden="true" />
            </button></Dialog.Close>
          </header>
          <div className={styles.dialogBody}>
            <WalletTutorialVideo autoplay />
            <p className={styles.soundHint}>{t("walletTutorial.soundHint")}</p>
          </div>
          <footer className={styles.dialogFooter}>
            <Dialog.Close asChild><button type="button" className="executive-button primary">{t("walletTutorial.close")}</button></Dialog.Close>
          </footer>
        </Dialog.Content>
      </Dialog.Portal> : null}
    </Dialog.Root>
  </>;
}
