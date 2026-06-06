import { Shield, CheckCircle, Layers, Lock } from 'lucide-react';

export default function TrustStrip() {
  const items = [
    { icon: Shield, label: 'Seguridad' },
    { icon: CheckCircle, label: 'Verificación' },
    { icon: Layers, label: 'Estructura' },
    { icon: Lock, label: 'Cumplimiento' },
  ];

  return (
    <section className="bg-white border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
          {/* Texto */}
          <p className="text-sm text-gray-600 leading-relaxed max-w-2xl flex-1">
            Estructura internacional en desarrollo con procesos activos de cumplimiento y fortalecimiento regulatorio.
          </p>

          {/* Iconos */}
          <div className="flex items-center gap-8 flex-wrap justify-center sm:justify-end">
            {items.map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-vicion-deep/5">
                  <item.icon size={18} className="text-vicion-blue" />
                </div>
                <span className="text-xs text-gray-500 font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}