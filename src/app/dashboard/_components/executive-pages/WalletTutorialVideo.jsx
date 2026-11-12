"use client";

import { ExternalLink, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useI18n } from "@/i18n/LanguageProvider";
import { WALLET_TUTORIAL_POSTER, WALLET_TUTORIAL_VIDEO_URL } from "@/lib/wallet-funding-tutorial.mjs";
import styles from "./wallet-funding-tutorial.module.css";

/** Media stays independent of wallet connections, quotes and payment actions. */
export default function WalletTutorialVideo({ autoplay = false, paused = false }) {
  const { t } = useI18n();
  const player = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (paused) player.current?.pause();
  }, [paused]);

  useEffect(() => {
    const video = player.current;
    return () => video?.pause();
  }, []);

  function retry() {
    const video = player.current;
    if (!video) return;
    setFailed(false);
    video.load();
    // Only the popup may start itself. Sidebar retry waits for a press on Play.
    if (autoplay) void video.play()?.catch(() => {});
  }

  return <div className={styles.player}>
    <video ref={player} className={styles.video} src={WALLET_TUTORIAL_VIDEO_URL}
      poster={WALLET_TUTORIAL_POSTER} controls playsInline autoPlay={autoplay} muted={autoplay}
      disablePictureInPicture={autoplay} preload={autoplay ? "auto" : "none"}
      aria-label={t("walletTutorial.title")} onError={() => setFailed(true)} />
    {failed ? <div className={styles.mediaError} role="status">
      <p>{t("walletTutorial.loadError")}</p>
      <div className={styles.recoveryActions}>
        <button type="button" onClick={retry}><RotateCcw size={15} aria-hidden="true" />{t("walletTutorial.retry")}</button>
        <a href={WALLET_TUTORIAL_VIDEO_URL} target="_blank" rel="noopener noreferrer">
          {t("walletTutorial.openVideo")}<ExternalLink size={15} aria-hidden="true" />
        </a>
      </div>
    </div> : null}
  </div>;
}
