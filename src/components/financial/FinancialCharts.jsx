import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const COLORS = ['var(--vp-accent)', 'var(--vp-amber)', 'var(--vp-text-soft)', 'var(--vp-accent-strong)'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--vp-surface)', border: '1px solid var(--vp-border)', borderRadius: 10, padding: '10px 14px', boxShadow: 'var(--vp-shadow)' }}>
      <p style={{ color: 'var(--vp-muted)', fontSize: 10, margin: '0 0 6px 0', fontWeight: 700 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontSize: 11, margin: '2px 0', fontWeight: 700 }}>
          {p.name}: ${p.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

export default function FinancialCharts({ historicalData, projectionData, selectedScenario, bonusData }) {
  const [activeChart, setActiveChart] = useState('growth');

  const tabs = [
    { key: 'growth', label: 'Crecimiento' },
    { key: 'monthly', label: 'Mensual' },
    { key: 'distribution', label: 'Distribución' },
    { key: 'projection', label: 'Proyección' },
  ];

  const pieData = [
    { name: 'Personal', value: Math.round(bonusData.monthlyBase) },
    { name: 'Binario', value: Math.round(bonusData.binaryBonus) },
    { name: 'Red', value: Math.round(bonusData.networkBonus) },
    { name: 'Directos', value: Math.round(bonusData.directBonus) },
  ].filter(d => d.value > 0);

  return (
    <div style={{
      padding: '24px',
      borderRadius: 14,
      background: 'var(--vp-surface)',
      border: '1px solid var(--vp-border)',
      boxShadow: 'var(--vp-shadow)',
    }}>
      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--vp-surface-raised)', padding: 4, borderRadius: 10, border: '1px solid var(--vp-border)' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveChart(t.key)}
            style={{
              flex: 1, padding: '7px 4px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700,
              background: activeChart === t.key ? 'var(--vp-accent-muted)' : 'transparent',
              color: activeChart === t.key ? 'var(--vp-accent)' : 'var(--vp-muted)',
              transition: 'all 0.2s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <motion.div
        key={activeChart}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ height: 260 }}
      >
        {activeChart === 'growth' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historicalData}>
              <defs>
                <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--vp-accent)" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="var(--vp-accent)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradBinary" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--vp-amber)" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="var(--vp-amber)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--vp-border)" />
              <XAxis dataKey="month" tick={{ fill: 'var(--vp-muted)', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--vp-muted)', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(1)}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="total" name="Total" stroke="var(--vp-accent)" fill="url(#gradTotal)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="binary" name="Binario" stroke="var(--vp-amber)" fill="url(#gradBinary)" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {activeChart === 'monthly' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--vp-border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: 'var(--vp-muted)', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--vp-muted)', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(1)}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="base" name="Personal" stackId="a" fill="var(--vp-text-soft)" radius={[0,0,0,0]} />
              <Bar dataKey="binary" name="Binario" stackId="a" fill="var(--vp-accent)" />
              <Bar dataKey="network" name="Red" stackId="a" fill="var(--vp-amber)" />
              <Bar dataKey="direct" name="Directos" stackId="a" fill="var(--vp-accent-strong)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeChart === 'distribution' && (
          <div style={{ display: 'flex', alignItems: 'center', height: '100%', gap: 24 }}>
            <div style={{ flex: 1, height: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} opacity={0.9} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pieData.map((entry, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                  <div>
                    <p style={{ color: 'var(--vp-muted)', fontSize: 10, margin: 0 }}>{entry.name}</p>
                    <p style={{ color: COLORS[i % COLORS.length], fontSize: 12, fontWeight: 700, margin: 0 }}>
                      ${entry.value.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeChart === 'projection' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={projectionData}>
              <defs>
                <linearGradient id="gradProj" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--vp-amber)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--vp-amber)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradCumul" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--vp-accent)" stopOpacity={0.16} />
                  <stop offset="95%" stopColor="var(--vp-accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--vp-border)" />
              <XAxis dataKey="month" tick={{ fill: 'var(--vp-muted)', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--vp-muted)', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(1)}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="monthly" name="Mensual" stroke="var(--vp-amber)" fill="url(#gradProj)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="cumulative" name="Acumulado" stroke="var(--vp-accent)" fill="url(#gradCumul)" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </motion.div>
    </div>
  );
}
