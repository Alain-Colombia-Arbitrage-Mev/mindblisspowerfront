import { ArrowRight, Zap, Gift, TrendingUp } from 'lucide-react';

const actions = [
  { icon: TrendingUp, label: 'Aumentar nivel', desc: 'Accede al siguiente nivel', color: '#3b82f6' },
  { icon: Zap, label: 'Simular escenario', desc: 'Prueba nuevas proyecciones', color: '#60a5fa' },
  { icon: ArrowRight, label: 'Activar crecimiento', desc: 'Amplía tu participación', color: '#34d399' },
  { icon: Gift, label: 'Ver beneficios', desc: 'Conoce tus accesos activos', color: '#fbbf24' },
];

export default function KeyActions() {
  return (
    <div>
      <h3 style={{ color: 'white', fontSize: 16, fontWeight: 800, fontFamily: 'Montserrat, sans-serif', marginBottom: 14 }}>
        Acciones clave
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        {actions.map((action, i) => (
          <button key={i}
            style={{
              padding: 14,
              borderRadius: 12,
              background: 'rgba(59,130,246,0.08)',
              border: '1px solid rgba(59,130,246,0.2)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 8,
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${action.color}15`;
              e.currentTarget.style.borderColor = `${action.color}40`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(59,130,246,0.08)';
              e.currentTarget.style.borderColor = 'rgba(59,130,246,0.2)';
            }}
          >
            <action.icon size={18} style={{ color: action.color }} />
            <div>
              <div style={{ color: 'white', fontSize: 12, fontWeight: 700, textAlign: 'left' }}>{action.label}</div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, textAlign: 'left' }}>{action.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}