import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Users, TrendingUp, Target, Share2 } from 'lucide-react';

export default function GrowthMetricsCards({ timeframe }) {
  const metrics = [
    {
      label: 'User Acquisition',
      value: '2,847',
      change: '+18.5%',
      positive: true,
      icon: Users,
      color: '#3b82f6',
      detail: '892 this week'
    },
    {
      label: 'Conversion Rate',
      value: '12.4%',
      change: '+2.3%',
      positive: true,
      icon: Target,
      color: '#10b981',
      detail: 'Up from 12.1%'
    },
    {
      label: '30-Day Retention',
      value: '67.8%',
      change: '-1.2%',
      positive: false,
      icon: TrendingUp,
      color: '#a855f7',
      detail: 'Slight decline'
    },
    {
      label: 'Referral Rate',
      value: '23.2%',
      change: '+4.8%',
      positive: true,
      icon: Share2,
      color: '#fb923c',
      detail: 'Viral coeff: 1.23'
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, i) => {
        const Icon = metric.icon;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-6 rounded-xl"
            style={{ background: `${metric.color}15`, border: `1px solid ${metric.color}30` }}
          >
            <div className="flex items-start justify-between mb-4">
              <Icon size={18} style={{ color: metric.color }} />
              <div className="flex items-center gap-1">
                {metric.positive ? (
                  <ArrowUpRight size={14} style={{ color: '#10b981' }} />
                ) : (
                  <ArrowDownRight size={14} style={{ color: '#ef4444' }} />
                )}
                <span
                  style={{
                    color: metric.positive ? '#10b981' : '#ef4444',
                    fontSize: 11,
                    fontWeight: 700
                  }}
                >
                  {metric.change}
                </span>
              </div>
            </div>

            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 6px 0' }}>
              {metric.label}
            </p>
            <p style={{ color: metric.color, fontSize: 24, fontWeight: 900, margin: '0 0 8px 0' }}>
              {metric.value}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
              {metric.detail}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}