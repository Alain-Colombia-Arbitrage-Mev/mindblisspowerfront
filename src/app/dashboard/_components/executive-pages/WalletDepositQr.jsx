'use client';

import { QrCode } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/i18n/LanguageProvider';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { walletReownAddress } from '@/lib/wallet-reown-connection.mjs';
import { WalletAddress } from './WalletFundingUI';
import styles from './production-wallet.module.css';

function DepositQrCanvas({ address, label, fallback }) {
  const canvas = useRef(/** @type {HTMLCanvasElement | null} */ (null));
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    import('qrcode').then(({ default: qr }) => {
      if (!active || !canvas.current) return;
      return qr.toCanvas(canvas.current, address, { width: 208, margin: 4, errorCorrectionLevel: 'M' });
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [address]);
  return failed ? <p role="status">{fallback}</p>
    : <canvas ref={canvas} className={styles.depositQrCanvas} width={208} height={208} role="img" aria-label={label} />;
}

export default function WalletDepositQr({ address }) {
  const { t } = useI18n();
  const destination = walletReownAddress(address);
  if (!destination) return null;
  return <Dialog>
    <DialogTrigger asChild>
      <button type="button" className="executive-button"><QrCode size={17} aria-hidden="true" />{t('walletProduction.depositQr')}</button>
    </DialogTrigger>
    <DialogContent className={styles.depositQrDialog}>
      <DialogTitle>{t('walletProduction.depositTitle')}</DialogTitle>
      <DialogDescription>{t('walletProduction.depositInstructions')}</DialogDescription>
      <DepositQrCanvas key={destination} address={destination} label={t('walletProduction.depositQrLabel')} fallback={t('walletProduction.depositQrFallback')} />
      <WalletAddress address={destination} label={t('sandboxWallet.address')} emptyLabel="" />
    </DialogContent>
  </Dialog>;
}
