import { Check, Lock } from 'lucide-react';

const timeline = [
  { event: 'Activación confirmada', date: 'Hace 2 meses', status: 'completed' },
  { event: 'Validación completada', date: 'Hace 2 meses', status: 'completed' },
  { event: 'Beneficio habilitado', date: 'Hace 1 mes', status: 'completed' },
  { event: 'Progreso actualizado', date: 'Hoy', status: 'completed' },
];

export default function RecentActivity() {
  return (
    <div style={{ background: 'linear-gradient(135deg, #0d1f3c, #0a1628)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: 16, padding: 24 }}>
      <h3 style={{ color: 'white', fontSize: 18, fontWeight: 800, fontFamily: 'Montserrat, sans-serif', marginBottom: 16 }}>
        Actividad reciente
      </h3>

      <div style={{ position: 'relative' }}>
        {timeline.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, marginBottom: i < timeline.length - 1 ? 20 : 0, position: 'relative' }}>
            {/* Timeline line */}
            {i < timeline.length - 1 && (
              <div style={{ position: 'absolute', left: 11, top: 36, width: 2, height: 28, background: 'rgba(59,130,246,0.2)' }} />
            )}

            {/* Timeline dot */}
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: item.status === 'completed' ? '#34d399' : 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', zIndex: 1 }}>
              {item.status === 'completed' && <Check size={14} style={{ color: '#0a1628', fontWeight: 800 }} />}
            </div>

            {/* Content */}
            <div style={{ paddingTop: 2 }}>
              <div style={{ color: 'white', fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{item.event}</div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>{item.date}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}