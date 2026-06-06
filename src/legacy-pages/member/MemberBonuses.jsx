import { useMemo } from 'react';
import { TrendingUp, TrendingDown, BarChart3, DollarSign } from 'lucide-react';
import { HISTORICAL_BONUSES } from '@/lib/memberNetworkData';
import { motion } from 'framer-motion';

export default function MemberBonuses() {
  const totalHistorical = useMemo(() => HISTORICAL_BONUSES.reduce((sum, b) => sum + b.amount, 0), []);
  const avgMonthly = useMemo(() => Math.round(totalHistorical / HISTORICAL_BONUSES.length), []);

  const bonusesByType = {
    network: HISTORICAL_BONUSES.filter(b => b.type === 'network'),
    rank: HISTORICAL_BONUSES.filter(b => b.type === 'rank'),
    mixed: HISTORICAL_BONUSES.filter(b => b.type === 'mixed'),
  };

  const typeColors = {
    network: { bg: 'rgba(8,18,40,0.7)', border: '1px solid rgba(59,130,246,0.2)', text: '#93C5FD' },
    rank:    { bg: 'rgba(8,18,40,0.7)', border: '1px solid rgba(124,58,237,0.2)', text: '#A78BFA' },
    mixed:   { bg: 'rgba(8,18,40,0.7)', border: '1px solid rgba(59,130,246,0.12)', text: '#93C5FD' },
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl" style={{ background: '#05070D', minHeight: '100vh' }}>
      {/* HEADER */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <p style={{ color: 'rgba(59,130,246,0.6)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 8px 0' }}>Panel · Finanzas</p>
        <h1 style={{ color: 'white', fontSize: 26, fontWeight: 900, margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>Historial de Bonificaciones</h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: 0 }}>Evolución histórica de tu desempeño de red</p>
      </motion.div>

      {/* SUMMARY KPIs — Level A hero card + Level B sub-cards */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}
        className="relative overflow-hidden rounded-2xl p-8"
        style={{ background: 'linear-gradient(135deg, #0B0F1A 0%, #101826 100%)', border: '1px solid rgba(124,58,237,0.18)', boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)' }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 600px 300px at 80% 50%, rgba(124,58,237,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 20px 0' }}>Resumen de Bonificaciones</p>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total Acumulado', value: `$${totalHistorical.toLocaleString()}`, icon: DollarSign, color: '#A78BFA' },
              { label: 'Promedio Mensual', value: `$${avgMonthly.toLocaleString()}`, icon: BarChart3, color: '#93C5FD' },
              { label: 'Bonif. de Red', value: bonusesByType.network.length, icon: TrendingUp, color: '#93C5FD' },
              { label: 'Bonif. de Rango', value: bonusesByType.rank.length, icon: TrendingUp, color: '#A78BFA' },
            ].map((kpi, i) => {
              const Icon = kpi.icon;
              return (
                <div key={i} className="p-5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon size={13} style={{ color: kpi.color }} />
                    <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{kpi.label}</span>
                  </div>
                  <p style={{ color: 'white', fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: '-0.3px' }}>{kpi.value}</p>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* HISTORICAL TABLE */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="p-6 rounded-lg" style={{ background: 'rgba(8,18,40,0.8)', border: '1px solid rgba(59,130,246,0.1)' }}>
        <h2 style={{ color: 'white', fontSize: 18, fontWeight: 700, margin: '0 0 20px 0' }}>Evolución Mensual</h2>
        <div className="space-y-2">
          {HISTORICAL_BONUSES.map((bonus, i) => {
            const colors = typeColors[bonus.type];
            const previousBonus = HISTORICAL_BONUSES[i - 1];
            const trend = previousBonus ? bonus.amount > previousBonus.amount ? 'up' : bonus.amount < previousBonus.amount ? 'down' : 'stable' : null;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-4 rounded-lg transition-all hover:border-opacity-50"
                style={{
                  background: colors.bg,
                  border: colors.border,
                  cursor: 'pointer',
                }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <p style={{ color: 'white', fontSize: 13, fontWeight: 700, margin: '0 0 4px 0' }}>{bonus.period}</p>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: 0 }}>{bonus.source}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {trend && (
                    <>
                      {trend === 'up' && <TrendingUp size={16} style={{ color: '#93C5FD' }} />}
                      {trend === 'down' && <TrendingDown size={16} style={{ color: 'rgba(255,255,255,0.3)' }} />}
                    </>
                  )}
                  <span style={{ color: colors.text, fontSize: 14, fontWeight: 900, minWidth: 100, textAlign: 'right' }}>
                    ${bonus.amount.toLocaleString()}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* BREAKDOWN BY TYPE */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="grid grid-cols-3 gap-6">
        {Object.entries(bonusesByType).map(([type, bonuses]) => {
          const typeLabel = { network: 'Red Binaria', rank: 'Bonificación de Rango', mixed: 'Combinadas' }[type];
          const colors = typeColors[type];
          const total = bonuses.reduce((sum, b) => sum + b.amount, 0);

          return (
            <div key={type} className="p-6 rounded-lg" style={{ background: colors.bg, border: colors.border }}>
              <h3 style={{ color: colors.text, fontSize: 14, fontWeight: 700, margin: '0 0 12px 0' }}>{typeLabel}</h3>
              <div className="space-y-2">
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '0 0 4px 0' }}>Total</p>
                  <p style={{ color: colors.text, fontSize: 20, fontWeight: 900, margin: 0 }}>${total.toLocaleString()}</p>
                </div>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '0 0 4px 0' }}>Eventos</p>
                  <p style={{ color: colors.text, fontSize: 16, fontWeight: 700, margin: 0 }}>{bonuses.length}</p>
                </div>
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* PROJECTION NOTE */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="p-6 rounded-lg"
        style={{
          background: 'rgba(8,18,40,0.8)',
          border: '1px solid rgba(124,58,237,0.15)',
        }}
      >
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: 0, lineHeight: 1.6 }}>
          <strong style={{ color: '#a78bfa' }}>Proyección Anual:</strong> Basado en tu evolución histórica y desempeño de red actual, 
          se proyecta un crecimiento sostenido en bonificaciones de red para los próximos meses.
        </p>
      </motion.div>
    </div>
  );
}