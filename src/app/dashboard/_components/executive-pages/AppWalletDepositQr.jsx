"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { QrCode, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useI18n } from "@/i18n/LanguageProvider";
import { APP_WALLET_DEPOSIT_CODES, appWalletDepositUri } from "@/lib/app-wallet-deposit-qr.mjs";
import { appMeldDestinationFor } from "@/lib/app-meld-funding-contract.mjs";
import { WalletAddress } from "./WalletFundingUI";
import styles from "./wallet-funding.module.css";
import popup from "./wallet-funding-tutorial.module.css";

function DepositCanvas({ uri, label, loading, fallback }) {
  const canvas = useRef(/** @type {HTMLCanvasElement | null} */ (null));
  const [status, setStatus] = useState("loading");
  useEffect(() => {
    let active = true;
    import("qrcode").then(async ({ default: qr }) => {
      if (!active || !canvas.current) return;
      await qr.toCanvas(canvas.current, uri, { width: 320, margin: 4, errorCorrectionLevel: "M" });
      if (active) setStatus("ready");
    }).catch(() => { if (active) setStatus("unavailable"); });
    return () => { active = false; };
  }, [uri]);

  return <div className={styles.depositQrImage} aria-busy={status === "loading"}>
    {status !== "ready" ? <p role="status">{status === "loading" ? loading : fallback}</p> : null}
    <canvas ref={canvas} width={320} height={320} hidden={status !== "ready"} role="img" aria-label={label} />
  </div>;
}

export default function AppWalletDepositQr({ address, preferredDestinationCode = "USDC_POLYGON", disabled = false }) {
  const { t } = useI18n();
  const id = useId();
  const [code, setCode] = useState("USDC_POLYGON");
  const uri = appWalletDepositUri(address, code);
  if (!uri) return null;
  const { asset, name: network } = appMeldDestinationFor(code);
  return <Dialog.Root onOpenChange={open => {
    if (open) setCode(APP_WALLET_DEPOSIT_CODES.includes(preferredDestinationCode) ? preferredDestinationCode : "USDC_POLYGON");
  }}>
    <Dialog.Trigger asChild>
      <button type="button" className="executive-button" disabled={disabled}>
        <QrCode size={19} aria-hidden="true" />{t("funding.depositQr")}
      </button>
    </Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className={popup.overlay} />
      <Dialog.Content className={styles.depositQrDialog}>
        <header className={popup.dialogHeader}>
          <div>
            <Dialog.Title>{t("funding.depositQrTitle", { asset, network })}</Dialog.Title>
            <Dialog.Description>{t("funding.depositQrInstructions")}</Dialog.Description>
          </div>
          <Dialog.Close asChild>
            <button type="button" className={popup.closeButton} aria-label={t("common.close")}>
              <X size={20} aria-hidden="true" />
            </button>
          </Dialog.Close>
        </header>
        <label htmlFor={id} className={`mb-onramp-country-picker ${styles.depositQrNetwork}`}>
          <span>{t("funding.depositQrAsset")}</span>
          <select id={id} value={code} onChange={event => {
            const selected = event.target.value;
            if (APP_WALLET_DEPOSIT_CODES.includes(selected)) setCode(selected);
          }}>
            {APP_WALLET_DEPOSIT_CODES.map(code => {
              const target = appMeldDestinationFor(code);
              return <option key={code} value={code}>{target.asset} · {target.name}</option>;
            })}
          </select>
        </label>
        <DepositCanvas key={uri} uri={uri} label={t("funding.depositQrImage", { asset, network })}
          loading={t("funding.depositQrLoading")} fallback={t("funding.depositQrFallback")} />
        <WalletAddress address={address} label={t("walletPage.personalWalletLabel")} emptyLabel="" />
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
