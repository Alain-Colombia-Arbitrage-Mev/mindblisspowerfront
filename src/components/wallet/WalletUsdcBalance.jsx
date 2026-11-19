'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n/LanguageProvider';
import { readArbitrumUsdcBalance, readEthereumUsdcBalance, readPolygonUsdcBalance } from '@/lib/wallet-polygon-usdc.mjs';

const balances = {
  polygon: { read: readPolygonUsdcBalance, label: 'walletProduction.usdcBalance' },
  arbitrum: { read: readArbitrumUsdcBalance, label: 'walletProduction.usdcArbitrumBalance' },
  ethereum: { read: readEthereumUsdcBalance, label: 'walletProduction.usdcEthereumBalance' },
};

/** @param {{address: string, refreshKey: number, className?: string, network?: 'polygon' | 'arbitrum' | 'ethereum'}} props */
export default function WalletUsdcBalance({ address, refreshKey, className, network = 'polygon' }) {
  const { t } = useI18n();
  const [balance, setBalance] = useState(/** @type {{address: string, network: 'polygon' | 'arbitrum' | 'ethereum', refreshKey: number, amount: string | null} | null} */ (null));

  useEffect(() => {
    const controller = new AbortController();
    const finish = (amount) => {
      if (!controller.signal.aborted) setBalance({ address, network, refreshKey, amount });
    };
    balances[network].read(address, { signal: controller.signal }).then(finish, () => finish(null));
    return () => controller.abort();
  }, [address, network, refreshKey]);

  const current = balance?.address === address && balance.network === network && balance.refreshKey === refreshKey ? balance : null;
  return <p className={className} role="status">
    {t(balances[network].label)}{' '}
    {current?.amount != null ? <bdi><strong>{current.amount} USDC</strong></bdi>
      : t(current ? 'walletProduction.usdcBalanceUnavailable' : 'walletProduction.loading')}
  </p>;
}
