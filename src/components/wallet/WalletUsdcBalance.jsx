'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n/LanguageProvider';
import { readPolygonUsdcBalance } from '@/lib/wallet-polygon-usdc.mjs';

export default function WalletUsdcBalance({ address, refreshKey, className }) {
  const { t } = useI18n();
  const [balance, setBalance] = useState(/** @type {{refreshKey: number, amount: string | null} | null} */ (null));

  useEffect(() => {
    const controller = new AbortController();
    readPolygonUsdcBalance(address, { signal: controller.signal }).then(amount => {
      if (!controller.signal.aborted) setBalance({ refreshKey, amount });
    }, () => {
      if (!controller.signal.aborted) setBalance({ refreshKey, amount: null });
    });
    return () => controller.abort();
  }, [address, refreshKey]);

  const current = balance?.refreshKey === refreshKey ? balance : null;
  return <p className={className} role="status">
    {t('walletProduction.usdcBalance')}{' '}
    {current?.amount != null ? <bdi><strong>{current.amount} USDC</strong></bdi>
      : t(current ? 'walletProduction.usdcBalanceUnavailable' : 'walletProduction.loading')}
  </p>;
}
