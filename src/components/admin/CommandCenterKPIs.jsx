import { motion } from 'framer-motion';
import { TrendingUp, Users, Target, Repeat2, Share2, DollarSign } from 'lucide-react';

export default function CommandCenterKPIs() {
  const kpis = [
    {
      label: 'Acquisition',
      value: '2,847',
      change: '+12.5%',
      positive: true,
      icon: Users,
      color: '#3b82f6'
    },
    {
      label: 'Activation',
      value: '68%',
      change: '+4.2%',
      positive: true,
      icon: Target,
      color: '#10b981'
    },
    {
      label: 'Conversion',
      value: '8.2%',
      change: '-2.3%',
      positive: false,
      icon: TrendingUp,
      color: '#ef4444'
    },
    {
      label: 'Retention',
      value: '72%',
      change: '+1.8%',
      positive: true,
      icon: Repeat2,
      color: '#a855f7'
    },
    {
      label: 'Referral Rate',
      value: '3.4x',
      change: '+0.6x',
      positive: true,
      icon: Share2,
      color: '#fb923c'
    },
    {
      label: 'Revenue (Proxy)',
      value: '$127K',
      change: '+18.3%',
      positive: true,
      icon: DollarSign,
      color: '#06b6d4'
    }
  ];

  return (
    <div>
      <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 16 }}>
        GLOBAL KPIS
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="p-4 rounded-lg"
              style={{ background: `${kpi.color}15`, border: `1px solid ${kpi.color}30` }}
            >
              <div className="flex items-start justify-between mb-3">
                <Icon size={16} style={{ color: kpi.color }} />
                <span style={{ color: kpi.positive ? '#10b981' : '#ef4444', fontSize: 10, fontWeight: 600 }}>
                  {kpi.positive ? '↑' : '↓'} {kpi.change}
                </span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, margin: '0 0 4px 0' }}>
                {kpi.label}
              </p>
              <p style={{ color: kpi.color, fontSize: 18, fontWeight: 900, margin: 0 }}>
                {kpi.value}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}