import { useState } from 'react';
import { Zap, Loader, CheckCircle } from 'lucide-react';
import simulatedApi from '@/api/simulatedApi';

const options = [
  {
    id: 'member',
    label: 'Solo miembro',
    desc: 'Acceso a beneficios sin desarrollar estructura',
    icon: '👤',
  },
  {
    id: 'growth',
    label: 'Quiero crecer',
    desc: 'Desarrolla comunidad y estructura progresiva',
    icon: '📈',
  },
  {
    id: 'strategic',
    label: 'Participación estratégica',
    desc: 'Máxima participación y liderazgo',
    icon: '🎯',
  },
];

export default function State3Activation({ userId, onComplete }) {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSelect = async (optionId) => {
    setSelected(optionId);
    setLoading(true);

    try {
      const result = await simulatedApi.selectParticipationType(userId, optionId);
      setSuccess(true);
      setTimeout(() => {
        onComplete({ participationType: optionId });
      }, 1500);
    } catch (err) {
      setSelected(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="mb-10 text-center">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(59,130,246,0.15)' }}>
          <Zap size={24} style={{ color: '#3b82f6' }} />
        </div>
        <h1 className="font-montserrat font-black text-3xl text-white mb-3">Activa tu participación</h1>
        <p className="text-white/50 text-base max-w-xl mx-auto">Selecciona cómo deseas comenzar dentro del ecosistema Vicion Power</p>
      </div>

      {success ? (
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            <CheckCircle size={56} style={{ color: '#10b981' }} />
          </div>
          <p className="text-white font-semibold text-lg mb-2">Tipo de participación registrado</p>
          <p className="text-white/50">Redirigiendo a planes...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              disabled={loading}
              className="p-6 rounded-2xl transition-all duration-300 relative overflow-hidden text-left"
              style={{
                background: selected === opt.id ? 'rgba(29,110,245,0.25)' : 'rgba(13,31,60,0.6)',
                border: selected === opt.id ? '2px solid #3b82f6' : '1px solid rgba(59,130,246,0.2)',
                opacity: loading && selected !== opt.id ? 0.5 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading && selected === opt.id && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
                  <Loader size={24} className="animate-spin text-white" />
                </div>
              )}

              <div className="text-3xl mb-3">{opt.icon}</div>
              <h3 className="font-montserrat font-bold text-white text-lg mb-2">{opt.label}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{opt.desc}</p>

              {selected === opt.id && !loading && (
                <div className="mt-4 flex items-center gap-2 text-vicion-electric text-sm font-medium">
                  <CheckCircle size={16} />
                  Seleccionado
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}