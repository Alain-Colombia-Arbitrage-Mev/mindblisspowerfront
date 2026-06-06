import { motion } from 'framer-motion';
import { Zap, Beaker, FileText, Users, Workflow, BarChart3 } from 'lucide-react';

export default function CommandCenterPanels() {
  const panels = [
    {
      title: 'Active Campaigns',
      icon: Zap,
      color: '#fb923c',
      items: [
        { name: 'Spring Growth Push', status: 'active', metric: '142 segments' },
        { name: 'Referral Blitz', status: 'active', metric: '3.2x viral' },
        { name: 'Q2 Expansion', status: 'paused', metric: '18 countries' }
      ]
    },
    {
      title: 'Running Experiments',
      icon: Beaker,
      color: '#a855f7',
      items: [
        { name: 'CTA Button Test', status: 'active', metric: '47% A' },
        { name: 'Landing Copy V2', status: 'active', metric: '52% B' },
        { name: 'Onboarding Flow', status: 'ended', metric: 'B Winner' }
      ]
    },
    {
      title: 'Top Performing Content',
      icon: FileText,
      color: '#10b981',
      items: [
        { name: 'Hero Copy V3', status: 'top', metric: '12.4% CTR' },
        { name: 'Social Proof V2', status: 'top', metric: '8.9% CTR' },
        { name: 'CTA Dynamic', status: 'high', metric: '7.2% CTR' }
      ]
    },
    {
      title: 'Underperforming Content',
      icon: BarChart3,
      color: '#ef4444',
      items: [
        { name: 'Generic Copy V1', status: 'low', metric: '2.1% CTR' },
        { name: 'Old Hero Image', status: 'low', metric: '1.8% CTR' },
        { name: 'Legacy Button', status: 'critical', metric: '0.9% CTR' }
      ]
    },
    {
      title: 'Audience Segments',
      icon: Users,
      color: '#3b82f6',
      items: [
        { name: 'High-Intent', status: 'active', metric: '2,847 users' },
        { name: 'Explorers', status: 'active', metric: '8,234 users' },
        { name: 'At-Risk', status: 'monitoring', metric: '1,203 users' }
      ]
    },
    {
      title: 'Automation Status',
      icon: Workflow,
      color: '#06b6d4',
      items: [
        { name: 'Nurture Sequences', status: 'active', metric: '6 flows' },
        { name: 'Trigger Events', status: 'active', metric: '18 active' },
        { name: 'Scheduled Tasks', status: 'active', metric: '12 queued' }
      ]
    }
  ];

  return (
    <div>
      <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 16 }}>
        LIVE OPERATIONAL PANELS
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {panels.map((panel, i) => {
          const Icon = panel.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-6 rounded-lg"
              style={{ background: 'rgba(13,31,60,0.6)', border: `1px solid ${panel.color}25` }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Icon size={16} style={{ color: panel.color }} />
                <p style={{ color: panel.color, fontSize: 11, fontWeight: 700, margin: 0 }}>
                  {panel.title}
                </p>
              </div>
              <div className="space-y-2">
                {panel.items.map((item, j) => (
                  <div
                    key={j}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <div>
                      <p style={{ color: 'white', fontSize: 12, fontWeight: 600, margin: 0 }}>
                        {item.name}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: '2px 0 0 0' }}>
                        {item.status.toUpperCase()}
                      </p>
                    </div>
                    <p style={{ color: panel.color, fontSize: 11, fontWeight: 700, margin: 0 }}>
                      {item.metric}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}