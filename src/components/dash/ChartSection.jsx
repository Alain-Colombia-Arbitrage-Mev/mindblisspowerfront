import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { month: 'Oct', value: 800 },
  { month: 'Nov', value: 950 },
  { month: 'Dic', value: 900 },
  { month: 'Ene', value: 1100 },
  { month: 'Feb', value: 1050 },
  { month: 'Mar', value: 1200 },
  { month: 'Abr', value: 1000 },
];

export default function ChartSection() {
  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: 20,
      padding: 32,
      boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
      marginBottom: 24,
    }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: '#2F80ED', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
          Evolución
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0A1F44', margin: 0 }}>
          Tu crecimiento en el tiempo
        </h2>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="0" stroke="#E2E8F0" vertical={false} />
          <XAxis dataKey="month" stroke="#94A3B8" style={{ fontSize: 12 }} />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              background: '#0A1F44',
              border: 'none',
              borderRadius: 8,
              color: '#FFFFFF',
            }}
            formatter={(value) => [`USD ${value}`, 'Valor']}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#2F80ED"
            strokeWidth={3}
            dot={{ fill: '#2F80ED', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}