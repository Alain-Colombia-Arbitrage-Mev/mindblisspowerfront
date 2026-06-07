import { useState } from 'react';
import { Zap, CheckCircle, Loader } from 'lucide-react';

const modules = [
  { id: 'overview', name: 'Overview', icon: '📊' },
  { id: 'structure', name: 'Mi Estructura', icon: '🏗️' },
  { id: 'referrals', name: 'Referidos', icon: '👥' },
  { id: 'progression', name: 'Progreso', icon: '📈' },
  { id: 'incentives', name: 'Beneficios', icon: '🎁' },
  { id: 'simulation', name: 'Simulación', icon: '🎯' },
];

export default function State9Layer3Full({ userId, onDashboardReady }) {
  const [activating, setActivating] = useState(false);
  const [activated, setActivated] = useState(false);

  const handleFullActivation = async () => {
    setActivating(true);
    try {
      // Simulate final activation
      await new Promise(r => setTimeout(r, 1500));
      setActivated(true);
      setTimeout(() => {
        onDashboardReady({ layer: 3, fullAccess: true });
      }, 1500);
    } finally {
      setActivating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-12 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(59,130,246,0.15)' }}>
          <Zap size={40} style={{ color: '#3b82f6' }} className="animate-pulse" />
        </div>
        <h1 className="font-montserrat font-black text-4xl text-white mb-4 leading-tight">
          Sistema completo<br />
          <span style={{ background: 'linear-gradient(90deg,#3b82f6,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            activo
          </span>
        </h1>
        <p className="text-white/50 text-base max-w-xl mx-auto">
          Tu cuenta está lista. Accede a todos los módulos y comienza tu construcción dentro de Mindbliss Power.
        </p>
      </div>

      {/* Available Modules Grid */}
      <div className="mb-12">
        <h2 className="text-white/70 text-sm font-semibold mb-6 uppercase tracking-widest">Módulos disponibles</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {modules.map((mod) => (
            <div
              key={mod.id}
              className="p-6 rounded-2xl text-center transition-all duration-300 hover:shadow-lg hover:border-vicion-electric/50"
              style={{
                background: 'rgba(13,31,60,0.6)',
                border: '1px solid rgba(59,130,246,0.2)',
              }}
            >
              <div className="text-4xl mb-3">{mod.icon}</div>
              <h3 className="font-semibold text-white text-sm">{mod.name}</h3>
            </div>
          ))}
        </div>
      </div>

      {/* Activation Block */}
      <div className="p-10 rounded-2xl text-center" style={{ background: 'rgba(29,110,245,0.12)', border: '2px solid rgba(59,130,246,0.3)' }}>
        {activated ? (
          <>
            <div className="flex justify-center mb-6">
              <CheckCircle size={56} style={{ color: '#10b981' }} className="animate-bounce" />
            </div>
            <h2 className="font-montserrat font-black text-2xl text-white mb-3">¡Bienvenido constructor!</h2>
            <p className="text-white/50 text-base mb-6">Tu acceso completo está activo. Entrando al panel privado...</p>
            <div className="flex justify-center gap-2">
              <Loader size={20} className="animate-spin text-vicion-electric" />
            </div>
          </>
        ) : (
          <>
            <h2 className="font-montserrat font-bold text-xl text-white mb-3">¿Listo para comenzar?</h2>
            <p className="text-white/60 text-base mb-8">
              Activa tu acceso completo para comenzar a construir tu estructura, invitar referidos y acceder a todos los beneficios.
            </p>
            <button
              onClick={handleFullActivation}
              disabled={activating}
              className="inline-flex items-center gap-2 px-10 py-4 rounded-xl font-bold font-montserrat transition-all duration-200 text-white text-base"
              style={{
                background: activating ? 'rgba(59,130,246,0.5)' : 'linear-gradient(135deg, #1d6ef5, #3b82f6)',
                boxShadow: '0 0 30px rgba(59,130,246,0.3)',
              }}
            >
              {activating ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  Activando acceso…
                </>
              ) : (
                <>
                  <Zap size={20} />
                  Acceder al panel privado
                </>
              )}
            </button>
          </>
        )}
      </div>

      {/* Info Footer */}
      <p className="text-white/30 text-xs text-center mt-8">
        Plataforma basada en participación. No se garantizan retornos financieros.
      </p>
    </div>
  );
}