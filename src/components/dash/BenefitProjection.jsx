import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const projectionData = [
  { mes: 'Mes 1', acceso: 20 },
  { mes: 'Mes 3', acceso: 35 },
  { mes: 'Mes 6', acceso: 55 },
  { mes: 'Mes 12', acceso: 80 },
  { mes: 'Mes 24', acceso: 95 },
];

const stages = [
  { num: 1, label: 'Acceso básico', desc: 'Participación inicial confirmada' },
  { num: 2, label: 'Beneficios activos', desc: 'Primeros beneficios habilitados' },
  { num: 3, label: 'Beneficios ampliados', desc: 'Acceso a beneficios progresivos' },
  { num: 4, label: 'Acceso continuo', desc: 'Máxima participación en el sistema' },
];

export default function BenefitProjection() {
  return (
    <div style={{ background: 'linear-gradient(135deg, #0d1f3c, #0a1628)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: 16, padding: 24 }}>
      <div style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, fontFamily: 'Montserrat, sans-serif', marginBottom: 4, textTransform: 'uppercase' }}>
        Proyección
      </div>
      <h3 style={{ color: 'white', fontSize: 18, fontWeight: 800, fontFamily: 'Montserrat, sans-serif', marginBottom: 4 }}>
        Proyección de acceso a beneficios
      </h3>
      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginBottom: 20 }}>
        Tu participación te permite acceder a beneficios progresivos dentro del sistema en función de tu continuidad.
      </p>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={projectionData}>
          <defs>
            <linearGradient id="gradLine" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis dataKey="mes" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11 }} />
          <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11 }} />
          <Tooltip 
            contentStyle={{ background: '#0a1628', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, color: 'white' }}
            formatter={(v) => [`${v}%`, 'Acceso']}
          />
          <Line type="monotone" dataKey="acceso" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 4 }} />
        </LineChart>
      </ResponsiveContainer>

      <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        {stages.map((stage) => (
          <div key={stage.num} style={{ padding: 12, borderRadius: 10, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#3b82f6', color: 'white', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              {stage.num}
            </div>
            <div style={{ color: 'white', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{stage.label}</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>{stage.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}