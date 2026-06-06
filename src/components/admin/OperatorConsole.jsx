import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Eye, AlertCircle } from 'lucide-react';

export default function OperatorConsole() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Activity log data
  const activities = [
    {
      id: 'act_1',
      timestamp: '2026-04-12T14:32:00Z',
      type: 'campaign_change',
      operator: 'Sarah Chen',
      action: 'Modified Campaign',
      details: 'Updated "Spring Referral Push" campaign budget from $5K to $8K',
      status: 'completed',
      impact: 'high'
    },
    {
      id: 'act_2',
      timestamp: '2026-04-12T14:18:00Z',
      type: 'experiment_create',
      operator: 'Marcus Rodriguez',
      action: 'Created Experiment',
      details: 'Launched new A/B test "CTA Color Variant" - Blue vs Green buttons',
      status: 'active',
      impact: 'medium'
    },
    {
      id: 'act_3',
      timestamp: '2026-04-12T13:45:00Z',
      type: 'content_update',
      operator: 'Elena Volkov',
      action: 'Updated Content',
      details: 'Modified hero headline to "Build Your Financial Future Today" (v2)',
      status: 'completed',
      impact: 'medium'
    },
    {
      id: 'act_4',
      timestamp: '2026-04-12T13:22:00Z',
      type: 'automation_trigger',
      operator: 'James Park',
      action: 'Triggered Automation',
      details: 'Ran "Daily Segment Refresh" automation - Processed 2,450 user segments',
      status: 'completed',
      impact: 'high'
    },
    {
      id: 'act_5',
      timestamp: '2026-04-12T12:15:00Z',
      type: 'campaign_change',
      operator: 'Sarah Chen',
      action: 'Paused Campaign',
      details: 'Paused "Summer Flash Sale" campaign for review',
      status: 'paused',
      impact: 'medium'
    },
    {
      id: 'act_6',
      timestamp: '2026-04-12T11:50:00Z',
      type: 'experiment_create',
      operator: 'Marcus Rodriguez',
      action: 'Created Experiment',
      details: 'Setup multivariate test "Landing Page Optimization" - 4 variants',
      status: 'active',
      impact: 'high'
    },
    {
      id: 'act_7',
      timestamp: '2026-04-12T10:30:00Z',
      type: 'content_update',
      operator: 'Elena Volkov',
      action: 'Updated Content',
      details: 'Replaced CTA button text "Sign Up Now" → "Join Today" (all pages)',
      status: 'completed',
      impact: 'low'
    },
    {
      id: 'act_8',
      timestamp: '2026-04-12T09:15:00Z',
      type: 'automation_trigger',
      operator: 'James Park',
      action: 'Triggered Automation',
      details: 'Manual execution of "Compliance Check" - 0 violations detected',
      status: 'completed',
      impact: 'low'
    }
  ];

  const filterOptions = [
    { id: 'all', label: 'All Activity' },
    { id: 'campaign_change', label: 'Campaign Changes' },
    { id: 'experiment_create', label: 'Experiment Creation' },
    { id: 'content_update', label: 'Content Updates' },
    { id: 'automation_trigger', label: 'Automation Triggers' }
  ];

  const getTypeColor = (type) => {
    const colors = {
      campaign_change: { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)', text: '#3b82f6', icon: '📊' },
      experiment_create: { bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.3)', text: '#a855f7', icon: '🧪' },
      content_update: { bg: 'rgba(236,72,153,0.1)', border: 'rgba(236,72,153,0.3)', text: '#ec4899', icon: '✏️' },
      automation_trigger: { bg: 'rgba(251,146,60,0.1)', border: 'rgba(251,146,60,0.3)', text: '#fb923c', icon: '⚙️' }
    };
    return colors[type] || colors.campaign_change;
  };

  const getStatusBadge = (status) => {
    const styles = {
      completed: { bg: 'rgba(16,185,129,0.2)', border: 'rgba(16,185,129,0.3)', color: '#10b981', label: '✓ Completed' },
      active: { bg: 'rgba(59,130,246,0.2)', border: 'rgba(59,130,246,0.3)', color: '#3b82f6', label: '● Active' },
      paused: { bg: 'rgba(251,146,60,0.2)', border: 'rgba(251,146,60,0.3)', color: '#fb923c', label: '⏸ Paused' }
    };
    return styles[status] || styles.completed;
  };

  const getImpactColor = (impact) => {
    const colors = {
      high: { text: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
      medium: { text: '#fb923c', bg: 'rgba(251,146,60,0.1)' },
      low: { text: '#3b82f6', bg: 'rgba(59,130,246,0.1)' }
    };
    return colors[impact] || colors.medium;
  };

  const filtered = activities.filter(a => {
    const matchesFilter = activeFilter === 'all' || a.type === activeFilter;
    const matchesSearch = searchTerm === '' || 
      a.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.operator.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.25)' }}
      >
        <div className="flex items-start gap-3 mb-4">
          <Settings size={24} style={{ color: '#fb923c' }} />
          <div className="flex-1">
            <p style={{ color: '#fb923c', fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: '0 0 8px 0', fontFamily: 'Montserrat' }}>
              OPERATIONS CONTROL
            </p>
            <h2 style={{ color: 'white', fontSize: 28, fontWeight: 900, margin: '0 0 8px 0' }}>
              Operator Console
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0 }}>
              Full audit log of internal team actions and campaign modifications
            </p>
          </div>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search by operator or action details..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'white',
            fontSize: 13
          }}
        />
      </motion.div>

      {/* Filter Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex gap-2 overflow-x-auto pb-2"
      >
        {filterOptions.map(opt => (
          <button
            key={opt.id}
            onClick={() => setActiveFilter(opt.id)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
            style={{
              background: activeFilter === opt.id ? 'rgba(251,146,60,0.2)' : 'rgba(255,255,255,0.05)',
              color: activeFilter === opt.id ? '#fb923c' : 'rgba(255,255,255,0.5)',
              border: activeFilter === opt.id ? '1px solid rgba(251,146,60,0.3)' : '1px solid rgba(255,255,255,0.1)'
            }}
          >
            {opt.label}
          </button>
        ))}
      </motion.div>

      {/* Activity Log */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        {filtered.length === 0 ? (
          <div className="p-12 text-center rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Eye size={32} style={{ color: 'rgba(255,255,255,0.2)', margin: '0 auto 12px' }} />
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>No activities found</p>
          </div>
        ) : (
          filtered.map((activity, idx) => {
            const typeColor = getTypeColor(activity.type);
            const statusBadge = getStatusBadge(activity.status);
            const impactColor = getImpactColor(activity.impact);

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="p-6 rounded-xl"
                style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(251,146,60,0.15)' }}
              >
                <div className="flex items-start gap-4">
                  {/* Type Icon */}
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: typeColor.bg, border: `1px solid ${typeColor.border}` }}
                  >
                    {typeColor.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <p style={{ color: typeColor.text, fontSize: 12, fontWeight: 700, margin: '0 0 4px 0' }}>
                          {activity.action}
                        </p>
                        <p style={{ color: 'white', fontSize: 14, fontWeight: 600, margin: 0 }}>
                          {activity.details}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {activity.impact !== 'low' && (
                          <div
                            className="px-2.5 py-1 rounded text-xs font-semibold"
                            style={{ background: impactColor.bg, color: impactColor.text }}
                          >
                            {activity.impact.toUpperCase()} IMPACT
                          </div>
                        )}
                        <div
                          className="px-2.5 py-1 rounded text-xs font-semibold"
                          style={{ background: statusBadge.bg, border: `1px solid ${statusBadge.border}`, color: statusBadge.color }}
                        >
                          {statusBadge.label}
                        </div>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-4 pt-3 border-t border-white/10">
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: 0 }}>
                        <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Operator:</span> {activity.operator}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>
                        {formatTime(activity.timestamp)}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: 0 }}>
                        ID: {activity.id}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* Operations Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="p-6 rounded-lg" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 8px 0' }}>
            TOTAL OPERATIONS TODAY
          </p>
          <p style={{ color: '#3b82f6', fontSize: 24, fontWeight: 900, margin: 0 }}>
            {activities.length}
          </p>
        </div>

        <div className="p-6 rounded-lg" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.25)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 8px 0' }}>
            EXPERIMENTS ACTIVE
          </p>
          <p style={{ color: '#a855f7', fontSize: 24, fontWeight: 900, margin: 0 }}>
            2
          </p>
        </div>

        <div className="p-6 rounded-lg" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 8px 0' }}>
            COMPLETED ACTIONS
          </p>
          <p style={{ color: '#10b981', fontSize: 24, fontWeight: 900, margin: 0 }}>
            5
          </p>
        </div>

        <div className="p-6 rounded-lg" style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.25)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 8px 0' }}>
            HIGH IMPACT OPS
          </p>
          <p style={{ color: '#fb923c', fontSize: 24, fontWeight: 900, margin: 0 }}>
            3
          </p>
        </div>
      </motion.div>
    </div>
  );
}