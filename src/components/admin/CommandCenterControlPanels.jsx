import { motion } from 'framer-motion';
import { Zap, Beaker, BarChart3 } from 'lucide-react';

export default function CommandCenterControlPanels() {
  const panels = [
    {
      title: 'Campaign Overview',
      icon: Zap,
      color: '#fb923c',
      controls: [
        { label: 'Active Campaigns', value: '3', status: 'active' },
        { label: 'Budget Utilization', value: '78%', status: 'tracking' },
        { label: 'Performance vs Target', value: '+12.4%', status: 'exceeding' }
      ]
    },
    {
      title: 'Experiment Tracking',
      icon: Beaker,
      color: '#a855f7',
      controls: [
        { label: 'Running Tests', value: '2', status: 'active' },
        { label: 'Statistical Significance', value: '68%', status: 'progressing' },
        { label: 'Winner Detection', value: 'Variant B', status: 'trending' }
      ]
    },
    {
      title: 'Content Performance',
      icon: BarChart3,
      color: '#10b981',
      controls: [
        { label: 'High Performers', value: '5', status: 'optimal' },
        { label: 'Avg CTR (Top 3)', value: '9.2%', status: 'exceeding' },
        { label: 'Low Performers', value: '2', status: 'needs_optimization' }
      ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}
      >
        <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: '0 0 12px 0', fontFamily: 'Montserrat' }}>
          CONTROL LAYER
        </p>
        <h2 style={{ color: 'white', fontSize: 28, fontWeight: 900, margin: '0 0 8px 0' }}>
          Performance Control Panels
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0 }}>
          Campaign execution, experiment management, and content optimization controls
        </p>
      </motion.div>

      {/* Control Panels Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {panels.map((panel, idx) => {
          const Icon = panel.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.05 }}
              className="p-6 rounded-xl"
              style={{ background: 'rgba(13,31,60,0.6)', border: `1px solid ${panel.color}25` }}
            >
              {/* Title */}
              <div className="flex items-center gap-2 mb-6">
                <Icon size={18} style={{ color: panel.color }} />
                <h3 style={{ color: panel.color, fontSize: 13, fontWeight: 700, margin: 0 }}>
                  {panel.title}
                </h3>
              </div>

              {/* Controls */}
              <div className="space-y-4">
                {panel.controls.map((ctrl, j) => (
                  <div
                    key={j}
                    className="p-4 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: '0 0 4px 0' }}>
                          {ctrl.label}
                        </p>
                        <p style={{ color: 'white', fontSize: 16, fontWeight: 700, margin: 0 }}>
                          {ctrl.value}
                        </p>
                      </div>
                      <span
                        className="px-2 py-1 rounded text-xs font-semibold whitespace-nowrap"
                        style={{
                          background:
                            ctrl.status === 'active' || ctrl.status === 'optimal' || ctrl.status === 'exceeding'
                              ? 'rgba(16,185,129,0.2)'
                              : ctrl.status === 'trending'
                              ? 'rgba(251,146,60,0.2)'
                              : 'rgba(59,130,246,0.2)',
                          color:
                            ctrl.status === 'active' || ctrl.status === 'optimal' || ctrl.status === 'exceeding'
                              ? '#10b981'
                              : ctrl.status === 'trending'
                              ? '#fb923c'
                              : '#3b82f6'
                        }}
                      >
                        {ctrl.status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <button
                className="w-full mt-6 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: `${panel.color}20`,
                  border: `1px solid ${panel.color}30`,
                  color: panel.color,
                  cursor: 'pointer'
                }}
              >
                View Details →
              </button>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Performance Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="p-6 rounded-lg" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 8px 0' }}>
            SYSTEM STATUS
          </p>
          <p style={{ color: '#10b981', fontSize: 18, fontWeight: 900, margin: 0 }}>
            ✓ Optimal
          </p>
        </div>

        <div className="p-6 rounded-lg" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 8px 0' }}>
            EXECUTIONS TODAY
          </p>
          <p style={{ color: '#3b82f6', fontSize: 18, fontWeight: 900, margin: 0 }}>
            24
          </p>
        </div>

        <div className="p-6 rounded-lg" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.25)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 8px 0' }}>
            HEALTH INDEX
          </p>
          <p style={{ color: '#a855f7', fontSize: 18, fontWeight: 900, margin: 0 }}>
            94%
          </p>
        </div>
      </motion.div>
    </div>
  );
}