import { Gift, Calendar, Shield, Crown } from 'lucide-react';

const benefits = [
  { icon: Gift, label: 'Ingreso de continuidad', status: 'Activo', since: 'Desde hace 2 meses', use: 'Acceso directo en tu cuenta' },
  { icon: Calendar, label: 'Beneficio de permanencia', status: 'En progreso', since: 'Desde hace 45 días', use: 'Se incrementa mensualmente' },
  { icon: Shield, label: 'Protección del valor', status: 'Activo', since: 'Desde tu activación', use: 'Tu participación está protegida' },
  { icon: Crown, label: 'Acceso a condiciones preferentes', status: 'Disponible', since: 'Nivel Growth +', use: 'Acceso a beneficios exclusivos' },
];

const statusColor = (status) => {
  if (status === 'Activo') return '#34d399';
  if (status === 'En progreso') return '#fbbf24';
  return '#3b82f6';
};

export default function ActiveBenefits() {
  return (
    <div style={{ background: 'linear-gradient(135deg, #0d1f3c, #0a1628)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: 16, padding: 24 }}>
      <div style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, fontFamily: 'Montserrat, sans-serif', marginBottom: 4, textTransform: 'uppercase' }}>
        Beneficios
      </div>
      <h3 style={{ color: 'white', fontSize: 18, fontWeight: 800, fontFamily: 'Montserrat, sans-serif', marginBottom: 16 }}>
        Tus beneficios actuales
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {benefits.map((benefit, i) => (
          <div key={i} style={{ padding: 14, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,130,246,0.12)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <benefit.icon size={18} style={{ color: '#3b82f6' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>{benefit.label}</div>
                  <span style={{ background: `${statusColor(benefit.status)}20`, color: statusColor(benefit.status), fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>
                    {benefit.status}
                  </span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, lineHeight: 1.4 }}>
                  <div>{benefit.since}</div>
                  <div style={{ marginTop: 3 }}>{benefit.use}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}