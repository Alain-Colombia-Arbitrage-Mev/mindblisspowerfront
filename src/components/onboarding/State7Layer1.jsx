import { useState, useEffect } from 'react';
import { CheckCircle, Loader, ArrowRight } from 'lucide-react';
import simulatedApi from '@/api/simulatedApi';

const timeline = [
  { label: 'Cuenta creada', completed: true },
  { label: 'Correo verificado', completed: true },
  { label: 'Pago confirmado', completed: true },
  { label: 'Acceso activo', completed: true },
];

export default function State7Layer1({ userId, onComplete }) {
  const [activating, setActivating] = useState(false);
  const [activated, setActivated] = useState(false);

  const handleGrowth = async () => {
    setActivating(true);
    try {
      await simulatedApi.activateLayer1(userId);
      setActivated(true);
      setTimeout(() => {
        onComplete({ layer: 1, ready: true });
      }, 1500);
    } finally {
      setActivating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="mb-10 text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(59,130,246,0.15)' }}>
          <CheckCircle size={32} style={{ color: '#10b981' }} />
        </div>
        <h1 className="font-montserrat font-black text-3xl text-white mb-3">Tu participación está activa</h1>
        <p className="text-white/50 text-base">Bienvenido a Mindbliss Power</p>
      </div>

      {/* Timeline */}
      <div className="mb-10 p-6 rounded-2xl" style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.2)' }}>
        <h2 className="text-white/70 text-sm font-semibold mb-4 uppercase tracking-widest">Tu progreso</h2>
        <div className="space-y-3">
          {timeline.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(59,130,246,0.2)' }}>
                <CheckCircle size={16} style={{ color: '#10b981' }} />
              </div>
              <span className="text-white/70 text-sm">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Available Modules */}
      <div className="mb-10">
        <h2 className="text-white/70 text-sm font-semibold mb-4 uppercase tracking-widest">Módulos disponibles</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['Overview', 'Beneficios', 'Estado'].map((mod, i) => (
            <div key={i} className="p-4 rounded-xl" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: 'rgba(59,130,246,0.2)' }}>
                <CheckCircle size={16} style={{ color: '#3b82f6' }} />
              </div>
              <p className="text-white/80 font-medium text-sm">{mod}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Block */}
      <div className="p-8 rounded-2xl text-center" style={{ background: 'rgba(29,110,245,0.12)', border: '1px solid rgba(59,130,246,0.3)' }}>
        <h3 className="font-montserrat font-black text-xl text-white mb-3">¿Quieres avanzar?</h3>
        <p className="text-white/50 text-sm mb-6">Accede al modo crecimiento para desarrollar tu estructura.</p>

        {activated ? (
          <div className="flex items-center justify-center gap-2 text-white/70 text-sm">
            <Loader size={16} className="animate-spin" />
            Redirigiendo...
          </div>
        ) : (
          <button
            onClick={handleGrowth}
            disabled={activating}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold font-montserrat transition-all duration-200 text-white"
            style={{
              background: activating ? 'rgba(59,130,246,0.5)' : 'linear-gradient(135deg, #1d6ef5, #3b82f6)',
            }}
          >
            {activating ? (
              <>
                <Loader size={18} className="animate-spin" />
                Activando…
              </>
            ) : (
              <>
                Quiero crecer <ArrowRight size={16} />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}