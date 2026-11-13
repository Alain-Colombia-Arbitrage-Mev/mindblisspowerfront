'use client';

import { CreditCard, Wallet } from 'lucide-react';
import Link from './IntentLink';
import { useI18n } from '@/i18n/LanguageProvider';
import { useSandboxWalletBinding } from '@/components/reown/SandboxWalletBindingProvider';
import WalletAddressCopyButton from '@/components/wallet/WalletAddressCopyButton';

export default function SidebarAdministrativeWalletCard({ onNavigate }) {
  const { t } = useI18n(), binding = useSandboxWalletBinding(), address = binding.address;
  return <section className="vp-sidebar-wallet administrative-card" aria-label={t('sandboxWallet.title')}>
    <div className="vp-sidebar-wallet-heading"><span><span className="vp-sidebar-wallet-label">{t('sandboxWallet.title')}</span><strong>— USDT · Polygon</strong></span><Wallet size={18} aria-hidden="true" /></div>
    <div className="vp-sidebar-wallet-address" style={{ flexWrap: 'wrap' }}><code title={address || undefined}>{address ? `${address.slice(0, 7)}…${address.slice(-5)}` : t(binding.loading ? 'sandboxWallet.loading' : 'sandboxWallet.noWallet')}</code>
      {address ? <WalletAddressCopyButton address={address} size={12} /> : null}</div>
    <p className="mb-onramp-disclosure">{t('sandboxWallet.sandbox')}</p>
    <Link href="/dashboard/wallet-administrative" onClick={onNavigate} className="vp-sidebar-wallet-action administrative"><CreditCard size={14} aria-hidden="true" />{t('nav.addFunds')}</Link>
  </section>;
}
