import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Zap, ListChecks, AlertTriangle } from 'lucide-react';

export default function WarRoomScreen5AI({ sim, presentationMode }) {
  // Sample AI decisions and actions
  const aiInsights = [
    { type: 'decision', title: 'Optimize Activation Flow', detail: 'Increase CTA visibility → +7% predicted conversion', priority: 'high', color: '#10b981' },
    { type: 'alert', title: 'Leader Compliance Warning', detail: '3 leaders exceeding communication guidelines', priority: 'critical', color: '#ef4444' },
    { type: 'opportunity', title: 'Growth Unlock Detected', detail: 'APAC region ready for expansion tier', priority: 'high', color: '#06b6d4' },
  ];

  const queuedActions = [
    { id: 1, action: 'Auto-approve payment', user: 'M. García', amount: '$850', status: 'pending', risk: 'low' },
    { id: 2, action: 'Flag for manual review', user: 'R. Martínez', amount: '$2,100', status: 'pending', risk: 'medium' },
    { id: 3, action: 'Escalate support case', case: '#4821', reason: 'SLA breach approaching', status: 'pending', risk: 'high' },
    { id: 4, action: 'Trigger leader training', leader: 'C. López', reason: 'Compliance gap detected', status: 'pending', risk: 'medium' },
  ];

  return (
    <div className="h-full w-full flex flex-col p-12" style={{ background: 'linear-gradient(135deg, #050c1a 0%, #0a1628 50%, #030408 100%)' }}>
      {/* Title */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 style={{ color: 'white', fontSize: 48, fontWeight: 900, margin: 0, letterSpacing: -1 }}>AI Brain & Action Queue</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, margin: '8px 0 0' }}>Real-time AI decisions, insights, and pending actions</p>
      </motion.div>

      <div className="flex-1 flex gap-12">
        {/* Left: AI Insights */}
        <div className="flex-1 flex flex-col gap-4">
          <h2 style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 700, margin: '0 0 8px', letterSpacing: 1 }}>AI INSIGHTS</h2>
          <AnimatePresence initial={false}>
            {aiInsights.map((insight, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl p-6 flex gap-4 premium-card transition-all"
                style={{
                  background: `linear-gradient(135deg, ${insight.color}08 0%, ${insight.color}04 100%)`,
                  border: `1.5px solid ${insight.color}30`,
                  boxShadow: `inset 0 1px 2px rgba(255,255,255,0.08), 0 8px 24px ${insight.color}20`
                }}
                whileHover={{ y: -2, boxShadow: `inset 0 1px 2px rgba(255,255,255,0.12), 0 12px 32px ${insight.color}30` }}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${insight.color}18` }}>
                  {insight.type === 'decision' ? <Brain size={20} style={{ color: insight.color }} /> : insight.type === 'alert' ? <AlertTriangle size={20} style={{ color: insight.color }} /> : <Zap size={20} style={{ color: insight.color }} />}
                </div>
                <div className="flex-1">
                  <p style={{ color: 'white', fontSize: 15, fontWeight: 700, margin: 0 }}>{insight.title}</p>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: '6px 0 0' }}>{insight.detail}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Right: Action Queue */}
        <div className="flex-1 flex flex-col gap-4">
          <h2 style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 700, margin: '0 0 8px', letterSpacing: 1 }}>ACTION QUEUE ({queuedActions.length})</h2>
          <div className="flex-1 overflow-hidden flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {queuedActions.map((action, i) => {
                const riskColor = { low: '#10b981', medium: '#fb923c', high: '#ef4444' }[action.risk];
                return (
                  <motion.div
                    key={action.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    className="rounded-xl p-5 flex items-start gap-4 premium-card transition-all"
                    style={{
                      background: `linear-gradient(135deg, ${riskColor}06 0%, ${riskColor}02 100%)`,
                      border: `1.5px solid ${riskColor}25`,
                      boxShadow: `inset 0 1px 2px rgba(255,255,255,0.06), 0 6px 20px ${riskColor}15`
                    }}
                    whileHover={{ y: -2, boxShadow: `inset 0 1px 2px rgba(255,255,255,0.1), 0 10px 28px ${riskColor}25` }}
                  >
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: riskColor }} />
                    <div className="flex-1 min-w-0">
                      <p style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: 0 }}>{action.action}</p>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '4px 0 0' }}>
                        {action.user || action.case || action.leader} {action.amount && `· ${action.amount}`}
                      </p>
                      {action.reason && <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: '2px 0 0' }}>{action.reason}</p>}
                    </div>
                    <span className="px-2 py-1 rounded text-xs font-bold flex-shrink-0" style={{ background: `${riskColor}18`, color: riskColor }}>
                      {action.risk.toUpperCase()}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}