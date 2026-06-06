import { Banknote, Calendar, AlertCircle } from 'lucide-react';

export default function ContinuityPlan() {
  const simulatedAccess = 125;
  const period = 'Mensual';

  return (
    <div style={{ background: 'linear-gradient(135deg, #0d1f3c, #0a1628)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: 16, padding: 24 }}>
      <div style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, fontFamily: 'Montserrat, sans-serif', marginBottom: 4, textTransform: 'uppercase' }}>
        Simulación
      </div>
      <h3 style={{ color: 'white', fontSize: 18, fontWeight: 800, fontFamily: 'Montserrat, sans-serif', marginBottom: 2 }}>
        Simulación de plan de continuidad
      </h3>
      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginBottom: 20 }}>
        Visualización referencial basada en tu nivel actual
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{ padding: 16, borderRadius: 12, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Banknote size={16} style={{ color: '#34d399' }} />
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700 }}>POSIBLE ACCESO PERIÓDICO</span>
          </div>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 28, color: 'white' }}>
            ${simulatedAccess}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, marginTop: 2 }}>(simulado)</p>
        </div>

        <div style={{ padding: 16, borderRadius: 12, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Calendar size={16} style={{ color: '#60a5fa' }} />
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700 }}>PERIODO</span>
          </div>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 24, color: 'white' }}>
            {period}
          </div>
        </div>
      </div>

      <div style={{ padding: 12, borderRadius: 10, background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', display: 'flex', gap: 10 }}>
        <AlertCircle size={16} style={{ color: '#ffd700', marginTop: 2, flexShrink: 0 }} />
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, lineHeight: 1.6 }}>
          Esta simulación representa escenarios dentro del sistema y depende de tu permanencia y condiciones del programa.
        </p>
      </div>
    </div>
  );
}