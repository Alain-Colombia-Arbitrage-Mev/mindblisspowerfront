import { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, Users, Brain, Zap } from 'lucide-react';
import ComplianceAI from '@/lib/ComplianceAI';
import { motion } from 'framer-motion';

export default function ComplianceAIPanel() {
  const [intelligence, setIntelligence] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadIntelligence();
    const interval = setInterval(loadIntelligence, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadIntelligence = () => {
    setLoading(true);
    try {
      const intel = ComplianceAI.getIntelligence();
      setIntelligence(intel);
    } finally {
      setLoading(false);
    }
  };

  if (!intelligence) {
    return (
      <div className="p-6 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Running compliance analysis...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Insights Header */}
      <div className="p-6 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.1))', border: '1px solid rgba(139,92,246,0.2)' }}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Brain size={20} style={{ color: '#8b5cf6', flexShrink: 0, marginTop: 2 }} />
            <div>
              <h2 style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: 0 }}>AI Compliance Intelligence</h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '4px 0 0 0' }}>
                Automated pattern detection & risk analysis
              </p>
            </div>
          </div>
          <button
            onClick={loadIntelligence}
            disabled={loading}
            className="px-3 py-1.5 rounded text-xs font-semibold transition-all"
            style={{ background: '#8b5cf620', color: '#8b5cf6', border: '1px solid #8b5cf640' }}
          >
            {loading ? 'Analyzing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={AlertTriangle}
          label="Critical Risk Users"
          value={intelligence.summary.criticalRiskUsers}
          color="#ef4444"
        />
        <StatCard
          icon={Users}
          label="High Risk Users"
          value={intelligence.summary.highRiskUsers}
          color="#fb923c"
        />
        <StatCard
          icon={TrendingUp}
          label="Patterns Detected"
          value={intelligence.summary.patternsDetected}
          color="#3b82f6"
        />
        <StatCard
          icon={Zap}
          label="Critical Actions"
          value={intelligence.summary.recommendedActions}
          color="#8b5cf6"
        />
      </div>

      {/* High Risk Users */}
      {intelligence.highRiskUsers.length > 0 && (
        <div className="p-6 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: '0 0 16px 0' }}>High Risk Users (Top 10)</h2>
          <div className="space-y-2">
            {intelligence.highRiskUsers.slice(0, 10).map((user, idx) => (
              <motion.div
                key={user.userId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 rounded-lg flex items-start justify-between"
                style={{
                  background: user.overallRiskScore >= 80 ? 'rgba(239,68,68,0.08)' : 'rgba(251,146,60,0.08)',
                  border: user.overallRiskScore >= 80 ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(251,146,60,0.2)',
                }}
              >
                <div className="flex-1">
                  <p style={{ color: 'white', fontWeight: 600, fontSize: 11, margin: 0 }}>
                    {user.userName}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '2px 0 0 0' }}>
                    {user.risks.map(r => r.message).join(' • ')}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p style={{ color: user.overallRiskScore >= 80 ? '#ef4444' : '#fb923c', fontWeight: 900, fontSize: 14, margin: 0 }}>
                    {user.overallRiskScore}%
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, margin: '2px 0 0 0' }}>
                    {user.riskLevel.toUpperCase()}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Suspicious Patterns */}
      {intelligence.suspiciousPatterns.length > 0 && (
        <div className="p-6 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: '0 0 16px 0' }}>Detected Suspicious Patterns</h2>
          <div className="space-y-3">
            {intelligence.suspiciousPatterns.map((pattern, idx) => (
              <motion.div
                key={pattern.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 rounded-lg"
                style={{
                  background: pattern.severity === 'critical' ? 'rgba(239,68,68,0.08)' : 'rgba(251,146,60,0.08)',
                  border: pattern.severity === 'critical' ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(251,146,60,0.2)',
                }}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    size={16}
                    style={{ color: pattern.severity === 'critical' ? '#ef4444' : '#fb923c', flexShrink: 0, marginTop: 2 }}
                  />
                  <div className="flex-1">
                    <p style={{ color: 'white', fontWeight: 600, fontSize: 11, margin: 0 }}>
                      {pattern.name}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, margin: '3px 0 0 0' }}>
                      {pattern.description}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, margin: '4px 0 0 0', fontStyle: 'italic' }}>
                      💡 {pattern.recommendation}
                    </p>
                  </div>
                  <span
                    style={{
                      color: pattern.severity === 'critical' ? '#ef4444' : '#fb923c',
                      fontSize: 18,
                      fontWeight: 900,
                      flexShrink: 0,
                      marginLeft: 12,
                    }}
                  >
                    {pattern.count}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      {intelligence.recommendations.length > 0 && (
        <div className="p-6 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: '0 0 16px 0' }}>AI-Powered Recommendations</h2>
          <div className="space-y-2">
            {intelligence.recommendations.slice(0, 15).map((rec, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="flex items-start gap-3 p-3 rounded-lg"
                style={{
                  background: rec.priority === 'critical' ? 'rgba(239,68,68,0.08)' : 'rgba(251,146,60,0.08)',
                  border: rec.priority === 'critical' ? '1px solid rgba(239,68,68,0.15)' : '1px solid rgba(251,146,60,0.15)',
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: rec.priority === 'critical' ? '#ef4444' : '#fb923c' }} />
                <div className="flex-1 min-w-0">
                  <p style={{ color: 'white', fontWeight: 600, fontSize: 10, margin: 0 }}>
                    {rec.action}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, margin: '2px 0 0 0' }}>
                    {rec.message}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="p-4 rounded-lg" style={{ background: `${color}12`, border: `1px solid ${color}30` }}>
      <div className="flex items-center justify-between mb-2">
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, margin: 0 }}>
          {label}
        </p>
        <Icon size={14} style={{ color }} />
      </div>
      <p style={{ color, fontSize: 20, fontWeight: 900, margin: 0 }}>
        {value}
      </p>
    </div>
  );
}