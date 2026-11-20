'use client';

import { QrCode } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { useI18n } from '@/i18n/LanguageProvider';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { walletReownAddress } from '@/lib/wallet-reown-connection.mjs';
import { walletUsdcDepositUri } from '@/lib/wallet-polygon-usdc.mjs';
import { WalletAddress } from './WalletFundingUI';
import styles from './production-wallet.module.css';

function DepositQrCanvas({ uri, label, fallback }) {
  const canvas = useRef(/** @type {HTMLCanvasElement | null} */ (null));
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    import('qrcode').then(({ default: qr }) => {
      if (!active || !canvas.current) return;
      return qr.toCanvas(canvas.current, uri, { width: 208, margin: 4, errorCorrectionLevel: 'M' });
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [uri]);
  return failed ? <p role="status">{fallback}</p>
    : <canvas ref={canvas} className={styles.depositQrCanvas} width={208} height={208} role="img" aria-label={label} />;
}

export default function WalletDepositQr({ address, preferredNetwork = 'polygon' }) {
  const { t } = useI18n();
  const networkId = useId();
  const [network, setNetwork] = useState('polygon');
  const destination = walletReownAddress(address);
  const uri = walletUsdcDepositUri(destination, network);
  if (!uri) return null;
  const networkName = network === 'arbitrum' ? 'Arbitrum' : 'Polygon';
  return <Dialog onOpenChange={open => { if (open) setNetwork(preferredNetwork === 'arbitrum' ? 'arbitrum' : 'polygon'); }}>
    <DialogTrigger asChild>
      <button type="button" className="executive-button"><QrCode size={17} aria-hidden="true" />{t('walletProduction.depositQr')}</button>
    </DialogTrigger>
    <DialogContent className={styles.depositQrDialog}>
      <DialogTitle>{t('walletProduction.depositTitle', { network: networkName })}</DialogTitle>
      <DialogDescription>{t('walletProduction.depositInstructions', { network: networkName })}</DialogDescription>
      <div className={styles.field}><label htmlFor={networkId}>{t('walletProduction.receiveNetwork')}</label>
        <select id={networkId} value={network} onChange={event => {
          const selected = event.currentTarget.value;
          if (selected === 'arbitrum' || selected === 'polygon') setNetwork(selected);
        }}>
          <option value="polygon">Polygon</option>
          <option value="arbitrum">Arbitrum</option>
        </select>
      </div>
      <DepositQrCanvas key={uri} uri={uri} label={t('walletProduction.depositQrLabel', { network: networkName })} fallback={t('walletProduction.depositQrFallback')} />
      <WalletAddress address={destination} label={t('sandboxWallet.address')} emptyLabel="" />
    </DialogContent>
  </Dialog>;
}
