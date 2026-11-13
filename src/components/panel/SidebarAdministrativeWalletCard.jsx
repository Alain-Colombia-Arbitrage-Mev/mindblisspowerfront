'use client';

import { Copy, CreditCard, Wallet } from 'lucide-react';
import Link from './IntentLink';
import { useI18n } from '@/i18n/LanguageProvider';
import { useSandboxWalletBinding } from '@/components/reown/SandboxWalletBindingProvider';

export default function SidebarAdministrativeWalletCard({ onNavigate }) {
  const { t } = useI18n(), binding = useSandboxWalletBinding(), address = binding.address;
  const copy = async () => { if (address) await navigator.clipboard.writeText(address).catch(() => {}); };
  return <section className="vp-sidebar-wallet administrative-card" aria-label={t('sandboxWallet.title')}>
    <div className="vp-sidebar-wallet-heading"><span><span className="vp-sidebar-wallet-label">{t('sandboxWallet.title')}</span><strong>— USDT · Polygon</strong></span><Wallet size={18} aria-hidden="true" /></div>
    <div className="vp-sidebar-wallet-address"><code title={address || undefined}>{address ? `${address.slice(0, 7)}…${address.slice(-5)}` : t(binding.loading ? 'sandboxWallet.loading' : 'sandboxWallet.noWallet')}</code>
      {address ? <button type="button" onClick={copy} aria-label={t('walletPage.copyAddress')}><Copy size={12} aria-hidden="true" /></button> : null}</div>
    <p className="mb-onramp-disclosure">{t('sandboxWallet.sandbox')}</p>
    <Link href="/dashboard/wallet-administrative" onClick={onNavigate} className="vp-sidebar-wallet-action administrative"><CreditCard size={14} aria-hidden="true" />{t('nav.addFunds')}</Link>
  </section>;
}
