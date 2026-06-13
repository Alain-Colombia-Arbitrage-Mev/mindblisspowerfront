import Link from "next/link";
import { LockKeyhole, ShieldAlert } from "lucide-react";

export default function WarRoomPage() {
  return (
    <section className="executive-page">
      <div className="executive-container">
        <div className="executive-panel max-w-3xl">
          <div className="mb-6 flex items-center gap-4">
            <span className="executive-icon-badge">
              <ShieldAlert size={20} />
            </span>
            <div>
              <p className="executive-eyebrow">Modulo desactivado</p>
              <h1 className="executive-title">War Room no esta disponible</h1>
            </div>
          </div>

          <p className="executive-subtitle">
            Este modulo fue desactivado temporalmente. Las operaciones principales siguen disponibles desde Dashboard,
            Red, Equipo Pro, Comunicacion, Finanzas y Perfil.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="executive-button primary" href="/dashboard">
              <LockKeyhole size={16} />
              Volver al dashboard
            </Link>
            <Link className="executive-button" href="/dashboard/network">
              Ir a Red
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
