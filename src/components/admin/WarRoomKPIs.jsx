import { motion } from 'framer-motion';
import AnimatedNumber from './AnimatedNumber';
import { Users, TrendingUp, CreditCard, Shield, Headphones, Zap, Activity } from 'lucide-react';

export default function WarRoomKPIs({ kpis }) {
  const kpiItems = [
    { icon: Users, label: 'Active Participants', value: kpis.totalParticipants, color: '#3b82f6', trend: 12 },
    { icon: Activity, label: 'New Users (Today)', value: kpis.newUsersToday || 47, color: '#10b981', trend: 8 },
    { icon: TrendingUp, label: 'Conversion Rate', value: `${kpis.conversionRate}%`, color: '#fb923c', trend: 7 },
    { icon: Shield, label: 'Active Leaders', value: kpis.activeLeaders, color: '#8b5cf6', trend: 3 },
    { icon: CreditCard, label: 'Pending Payments', value: kpis.pendingPayments || 8, color: '#06b6d4', trend: -2 },
    { icon: Headphones, label: 'Open Support', value: kpis.supportIncidents, color: '#fb923c', trend: 1 },
    { icon: Zap, label: 'Growth Velocity', value: `+${kpis.growthSignal}%`, color: '#a855f7', trend: kpis.growthSignal },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
      {kpiItems.map((item, i) => {
        const Icon = item.icon;
        const isTrendUp = item.trend >= 0;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="p-3 rounded-xl transition-all hover:scale-105"
            style={{ background: `${item.color}0d`, border: `1px solid ${item.color}22` }}>
            <div className="flex items-center justify-between mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${item.color}1a` }}>
                <Icon size={13} style={{ color: item.color }} />
              </div>
              <span style={{ color: isTrendUp ? '#10b981' : '#ef4444', fontSize: 9, fontWeight: 700 }}>
                {isTrendUp ? '+' : ''}{item.trend}%
              </span>
            </div>
            <AnimatedNumber value={typeof item.value === 'number' ? item.value : item.value.split('%')[0]} 
              style={{ color: item.color, fontSize: 18, fontWeight: 900, display: 'block', margin: '0 0 2px' }} />
            {typeof item.value === 'string' && item.value.includes('%') && (
              <span style={{ color: item.color, fontSize: 18, fontWeight: 900, display: 'block', margin: '0 0 2px' }}>
                {item.value}
              </span>
            )}
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, margin: 0, fontWeight: 500 }}>{item.label}</p>
          </motion.div>
        );
      })}
    </div>
  );
}