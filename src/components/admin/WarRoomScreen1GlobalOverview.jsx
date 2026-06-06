import { motion } from 'framer-motion';
import AnimatedNumber from '@/components/admin/AnimatedNumber';
import { Users, Shield, Activity, Clock, CreditCard, TrendingUp } from 'lucide-react';

export default function WarRoomScreen1GlobalOverview({ sim, presentationMode }) {
  const kpis = sim.kpis;

  const metrics = [
    { icon: Users, label: 'Total Participants', value: kpis.totalParticipants, color: '#3b82f6' },
    { icon: Shield, label: 'Active Leaders', value: kpis.activeLeaders, color: '#8b5cf6' },
    { icon: Activity, label: 'Active Plans', value: kpis.activePlans, color: '#10b981' },
    { icon: Clock, label: 'Pending Verifications', value: kpis.pendingVerifications, color: '#ef4444' },
    { icon: CreditCard, label: 'Payment Volume', value: `$${kpis.paymentVolume}K`, color: '#06b6d4' },
    { icon: TrendingUp, label: 'Conversion Rate', value: `${kpis.conversionRate}%`, color: '#fb923c' },
  ];

  return (
    <div className="h-full w-full flex flex-col p-12" style={{ background: 'linear-gradient(135deg, #050c1a 0%, #0a1628 50%, #030408 100%)' }}>
      {/* Title */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 style={{ color: 'white', fontSize: 48, fontWeight: 900, margin: 0, letterSpacing: -1 }}>Global Overview</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, margin: '8px 0 0' }}>Real-time platform metrics and operational state</p>
      </motion.div>

      {/* KPI Grid */}
      <div className="grid grid-cols-3 gap-8 flex-1 premium-float">
        {metrics.map((metric, i) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl p-10 flex flex-col justify-between premium-card data-glow cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${metric.color}08 0%, ${metric.color}04 100%)`,
                border: `1.5px solid ${metric.color}30`,
                boxShadow: `inset 0 1px 2px rgba(255,255,255,0.08), 0 12px 48px ${metric.color}20`
              }}
              whileHover={{ y: -6, boxShadow: `inset 0 1px 2px rgba(255,255,255,0.12), 0 20px 60px ${metric.color}35` }}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 700, margin: 0, letterSpacing: 1 }}>
                    {metric.label.toUpperCase()}
                  </p>
                </div>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: `${metric.color}18` }}>
                  <Icon size={28} style={{ color: metric.color }} />
                </div>
              </div>
              <AnimatedNumber
                value={typeof metric.value === 'string' ? metric.value : metric.value.toLocaleString()}
                style={{ color: metric.color, fontSize: 56, fontWeight: 900, letterSpacing: -1, display: 'block', margin: 0 }}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Footer Status */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-8 flex items-center justify-between p-6 rounded-xl premium-card"
        style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" style={{ boxShadow: '0 0 8px #10b981' }} />
          <span style={{ color: '#10b981', fontSize: 13, fontWeight: 700, letterSpacing: 0.5 }}>ALL SYSTEMS OPERATIONAL</span>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Live sync • Multi-screen enabled</span>
      </motion.div>
    </div>
  );
}