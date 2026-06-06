import { motion } from 'framer-motion';
import AnimatedNumber from '@/components/admin/AnimatedNumber';
import { CreditCard, TrendingUp, AlertTriangle } from 'lucide-react';

export default function WarRoomScreen3Payments({ sim, presentationMode }) {
  const kpis = sim.kpis;
  
  const paymentMetrics = [
    { label: 'Volume Processed', value: `$${kpis.paymentVolume}K`, icon: TrendingUp, color: '#06b6d4' },
    { label: 'Transactions', value: '247', icon: CreditCard, color: '#10b981' },
    { label: 'Flagged (Review)', value: '8', icon: AlertTriangle, color: '#ef4444' },
  ];

  const transactionTypes = [
    { type: 'Activations', volume: '142', trend: '+12%', color: '#10b981' },
    { type: 'Payouts', volume: '85', trend: '+8%', color: '#8b5cf6' },
    { type: 'Refunds', volume: '12', trend: '-3%', color: '#fb923c' },
    { type: 'Holds/Review', volume: '8', trend: 'critical', color: '#ef4444' },
  ];

  return (
    <div className="h-full w-full flex flex-col p-12" style={{ background: 'linear-gradient(135deg, #050c1a 0%, #0a1628 50%, #030408 100%)' }}>
      {/* Title */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 style={{ color: 'white', fontSize: 48, fontWeight: 900, margin: 0, letterSpacing: -1 }}>Payments & Finance</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, margin: '8px 0 0' }}>Real-time transaction monitoring and financial flow</p>
      </motion.div>

      <div className="flex-1 flex gap-12">
        {/* Left: Key Metrics */}
        <div className="flex-1 flex flex-col gap-6">
          {paymentMetrics.map((metric, i) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl p-8 flex items-start gap-6 premium-card data-glow"
                style={{
                  background: `linear-gradient(135deg, ${metric.color}08 0%, ${metric.color}04 100%)`,
                  border: `1.5px solid ${metric.color}30`,
                  boxShadow: `inset 0 1px 2px rgba(255,255,255,0.08), 0 12px 48px ${metric.color}20`
                }}
                whileHover={{ y: -4, boxShadow: `inset 0 1px 2px rgba(255,255,255,0.12), 0 16px 56px ${metric.color}35` }}
              >
                <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${metric.color}18` }}>
                  <Icon size={32} style={{ color: metric.color }} />
                </div>
                <div className="flex-1">
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700, margin: 0, letterSpacing: 1 }}>
                    {metric.label.toUpperCase()}
                  </p>
                  <AnimatedNumber
                    value={metric.value}
                    style={{ color: metric.color, fontSize: 36, fontWeight: 900, margin: '6px 0 0', display: 'block', letterSpacing: -0.5 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Right: Transaction Breakdown */}
        <div className="flex-1 flex flex-col gap-6">
          <h2 style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 700, margin: 0, letterSpacing: 1 }}>TRANSACTION TYPES</h2>
          {transactionTypes.map((tx, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="rounded-xl p-6 premium-card transition-all"
              style={{
                background: `linear-gradient(135deg, ${tx.color}06 0%, ${tx.color}02 100%)`,
                border: `1.5px solid ${tx.color}25`,
                boxShadow: `inset 0 1px 2px rgba(255,255,255,0.06), 0 8px 24px ${tx.color}15`
              }}
              whileHover={{ y: -3, boxShadow: `inset 0 1px 2px rgba(255,255,255,0.1), 0 12px 32px ${tx.color}25` }}
            >
              <div className="flex items-center justify-between mb-4">
                <p style={{ color: 'white', fontSize: 18, fontWeight: 700, margin: 0 }}>{tx.type}</p>
                <span style={{ color: tx.color, fontSize: 14, fontWeight: 700 }}>{tx.trend}</span>
              </div>
              <div className="w-full h-4 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (parseInt(tx.volume) / 150) * 100)}%`,
                    background: `linear-gradient(90deg, ${tx.color}, ${tx.color}dd)`,
                    boxShadow: `0 0 12px ${tx.color}40`,
                  }}
                />
              </div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '6px 0 0', textAlign: 'right' }}>
                {tx.volume} transactions
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}