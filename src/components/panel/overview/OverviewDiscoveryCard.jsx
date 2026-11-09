import Link from "next/link";
import { ArrowRight, BadgeDollarSign, WalletCards } from "lucide-react";

export default function OverviewDiscoveryCard() {
  return (
    <div className="mb-overview-discovery" aria-label="Wallet y membresías">
      <section className="executive-card mb-buy-crypto-card">
        <WalletCards size={26} aria-hidden="true" />
        <div>
          <h2>Compra cripto</h2>
          <p>Primero crea tu wallet; después elige qué cripto comprar.</p>
        </div>
        <Link className="executive-button primary" href="/dashboard/withdrawals">
          Crear wallet y comprar <ArrowRight size={14} />
        </Link>
      </section>

      <section className="executive-card mb-plans-discovery-card">
        <div className="mb-plans-discovery-title">
          <BadgeDollarSign size={22} aria-hidden="true" />
          <h2>Desde $50 USD</h2>
        </div>
        <p>Compara los importes y las condiciones de cada plan antes de elegir.</p>
        <Link className="executive-button" href="/dashboard/packages">
          Comparar membresías <ArrowRight size={14} />
        </Link>
      </section>
    </div>
  );
}
