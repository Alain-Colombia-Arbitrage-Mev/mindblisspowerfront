'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n/LanguageProvider';
import { readArbitrumUsdcBalance, readPolygonUsdcBalance } from '@/lib/wallet-polygon-usdc.mjs';

/** @param {{address: string, refreshKey: number, className?: string, network?: 'polygon' | 'arbitrum'}} props */
export default function WalletUsdcBalance({ address, refreshKey, className, network = 'polygon' }) {
  const { t } = useI18n();
  const [balance, setBalance] = useState(/** @type {{address: string, network: 'polygon' | 'arbitrum', refreshKey: number, amount: string | null} | null} */ (null));

  useEffect(() => {
    const controller = new AbortController();
    const readBalance = network === 'arbitrum' ? readArbitrumUsdcBalance : readPolygonUsdcBalance;
    const finish = (amount) => {
      if (!controller.signal.aborted) setBalance({ address, network, refreshKey, amount });
    };
    readBalance(address, { signal: controller.signal }).then(finish, () => finish(null));
    return () => controller.abort();
  }, [address, network, refreshKey]);

  const current = balance?.address === address && balance.network === network && balance.refreshKey === refreshKey ? balance : null;
  return <p className={className} role="status">
    {t(network === 'arbitrum' ? 'walletProduction.usdcArbitrumBalance' : 'walletProduction.usdcBalance')}{' '}
    {current?.amount != null ? <bdi><strong>{current.amount} USDC</strong></bdi>
      : t(current ? 'walletProduction.usdcBalanceUnavailable' : 'walletProduction.loading')}
  </p>;
}
