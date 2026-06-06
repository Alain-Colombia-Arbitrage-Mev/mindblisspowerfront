import { CheckCircle2, Shield } from 'lucide-react';

const statusItems = [
  { label: 'Cuenta verificada', status: true, icon: CheckCircle2 },
  { label: 'Participación activa', status: true, icon: CheckCircle2 },
  { label: 'Acceso habilitado', status: true, icon: CheckCircle2 },
  { label: 'Progreso en curso', status: true, icon: CheckCircle2 },
];

export default function SystemStatus() {
  return (
    <div style={{ background: 'linear-gradient(135deg, #0d1f3c, #0a1628)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: 16, padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(52,211,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Shield size={18} style={{ color: '#34d399' }} />
        </div>
        <h3 style={{ color: 'white', fontSize: 18, fontWeight: 800, fontFamily: 'Montserrat, sans-serif', margin: 0 }}>
          Estado del sistema
        </h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        {statusItems.map((item, i) => (
          <div key={i} style={{ padding: 14, borderRadius: 12, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
              <item.icon size={16} style={{ color: '#34d399', marginTop: 1 }} />
              <div style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>{item.label}</div>
            </div>
            <div style={{ color: '#34d399', fontSize: 10, fontWeight: 700 }}>✓ Confirmado</div>
          </div>
        ))}
      </div>
    </div>
  );
}