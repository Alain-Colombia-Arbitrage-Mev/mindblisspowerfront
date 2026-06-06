import { TrendingUp } from 'lucide-react';

export default function ProgressEvolution() {
  const progress = 68;
  const nextLevel = 'Advance';

  return (
    <div style={{ background: 'linear-gradient(135deg, #0d1f3c, #0a1628)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: 16, padding: 24 }}>
      <div style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, fontFamily: 'Montserrat, sans-serif', marginBottom: 4, textTransform: 'uppercase' }}>
        Evolución
      </div>
      <h3 style={{ color: 'white', fontSize: 18, fontWeight: 800, fontFamily: 'Montserrat, sans-serif', marginBottom: 6 }}>
        Tu evolución dentro del sistema
      </h3>
      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginBottom: 20 }}>
        Tu acceso crece con tu continuidad y participación.
      </p>

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600 }}>Progreso hacia {nextLevel}</span>
          <span style={{ color: '#3b82f6', fontSize: 12, fontWeight: 700 }}>{progress}%</span>
        </div>
        <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #3b82f6, #60a5fa)', borderRadius: 4, transition: 'width 0.3s ease' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,130,246,0.1)' }}>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginBottom: 4 }}>NIVEL ACTUAL</div>
          <div style={{ color: 'white', fontSize: 16, fontWeight: 800, fontFamily: 'Montserrat, sans-serif' }}>Growth</div>
        </div>
        <div style={{ padding: 12, borderRadius: 10, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)' }}>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginBottom: 4 }}>PRÓXIMO NIVEL</div>
          <div style={{ color: '#60a5fa', fontSize: 16, fontWeight: 800, fontFamily: 'Montserrat, sans-serif' }}>{nextLevel}</div>
        </div>
      </div>

      <div style={{ padding: 12, borderRadius: 10, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <TrendingUp size={16} style={{ color: '#34d399' }} />
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>Mantén tu participación activa para continuar avanzando</p>
      </div>
    </div>
  );
}