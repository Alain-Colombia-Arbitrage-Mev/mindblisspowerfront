import { Receipt } from "lucide-react";

import MyPaymentsPanel from "../packages/MyPaymentsPanel";

export const dynamic = "force-dynamic";

/**
 * Mis pagos — pagos realizados, comisiones disponibles y solicitudes de retiro.
 */
export default function PaymentsPage() {
  return (
    <section className="executive-page">
      <div className="executive-container">
        <div className="executive-page-header">
          <div>
            <p className="executive-eyebrow">Finanzas</p>
            <h1 className="executive-title">Mis pagos</h1>
            <p className="executive-subtitle">
              Tus pagos realizados, comisiones disponibles para retiro y solicitudes en curso.
            </p>
          </div>
          <span className="executive-icon-badge">
            <Receipt size={20} />
          </span>
        </div>

        <MyPaymentsPanel />
      </div>
    </section>
  );
}
