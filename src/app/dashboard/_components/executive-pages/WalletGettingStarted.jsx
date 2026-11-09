import { ArrowRight, CreditCard, KeyRound, MapPin, ShieldCheck, WalletCards } from "lucide-react";

const steps = [
  { number: "01", title: "Crea tu wallet", copy: "Elige cómo identificarla y revisa el acceso asociado a tu cuenta.", icon: KeyRound },
  { number: "02", title: "Revisa el destino", copy: "Cada compra muestra el activo, la red y la wallet que recibirá los fondos.", icon: MapPin },
  { number: "03", title: "Compra con fiat", copy: "El proveedor confirma disponibilidad, verificación y pago antes de completar la compra.", icon: CreditCard },
];

export default function WalletGettingStarted() {
  return (
    <div className="mb-wallet-intro">
      <nav className="mb-wallet-progress" aria-label="Progreso de configuración de wallet">
        {[
          ["1", "Inicio"],
          ["2", "Crear wallet"],
          ["3", "Lista"],
        ].map(([number, label], index) => (
          <span key={number} data-active={index === 0 ? "true" : undefined}>
            <b>{number}</b>{label}
          </span>
        ))}
      </nav>

      <section className="mb-wallet-hero">
        <div className="mb-wallet-hero-copy">
          <h2>Tu cripto, en un solo lugar.</h2>
          <p>Empieza creando tu wallet. Después podrás recibir cripto y comprar con dinero de tu moneda.</p>
          <div className="mb-wallet-hero-actions">
            <a className="executive-button primary" href="#wallet-finance">Crear wallet <ArrowRight size={14} /></a>
            <a className="executive-button" href="#wallet-steps">Cómo funciona</a>
          </div>
        </div>
        <div className="mb-wallet-visual" aria-hidden="true">
          <span><WalletCards size={34} /></span>
          <strong>Antes de empezar</strong>
          <ul>
            <li><KeyRound size={15} /><span><b>Acceso</b> Revisa tu recuperación</span></li>
            <li><MapPin size={15} /><span><b>Destino</b> Una dirección para recibir</span></li>
            <li><ShieldCheck size={15} /><span><b>Compra</b> Revisa el total antes de pagar</span></li>
          </ul>
        </div>
      </section>

      <div id="wallet-steps" className="mb-wallet-steps">
        {steps.map(({ number, title, copy, icon: Icon }) => (
          <article key={number}>
            <span><Icon size={18} /></span>
            <h3>{number} · {title}</h3>
            <p>{copy}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
