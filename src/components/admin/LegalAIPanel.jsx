import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, Zap, TrendingUp, FileText, Signature } from 'lucide-react';
import LegalAI from '@/lib/LegalAI';
import { motion } from 'framer-motion';

export default function LegalAIPanel() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const legalAI = LegalAI.getInstance();

  useEffect(() => {
    performAnalysis();
    const interval = setInterval(performAnalysis, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const performAnalysis = () => {
    setLoading(true);
    try {
      const result = legalAI.analyzeCompleteStatus();
      setAnalysis(result);
    } finally {
      setLoading(false);
    }
  };

  if (!analysis) {
    return (
      <div className="p-6 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Analyzing legal status...</p>
      </div>
    );
  }

  const summary = legalAI.generateSummary();

  return (
    <div className="space-y-6">
      {/* Header & Summary */}
      <div className="p-6 rounded-xl" style={{
        background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.1))',
        border: '1px solid rgba(139,92,246,0.2)'
      }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 style={{ color: 'white', fontSize: 16, fontWeight: 900, margin: 0 }}>Legal AI Assistant</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '4px 0 0 0' }}>
              Automated legal status analysis and recommendations
            </p>
          </div>
          <button
            onClick={performAnalysis}
            disabled={loading}
            className="px-3 py-1.5 rounded text-xs font-semibold transition-all"
            style={{ background: '#8b5cf620', color: '#8b5cf6', border: '1px solid #8b5cf640' }}
          >
            {loading ? 'Analyzing...' : 'Refresh Analysis'}
          </button>
        </div>

        <p style={{ color: summary.summary.includes('HIGH') ? '#ef4444' : summary.summary.includes('MODERATE') ? '#fb923c' : '#10b981', fontSize: 12, fontWeight: 600, margin: 0 }}>
          {summary.summary}
        </p>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-2 gap-4">
        <ScoreCard
          label="Risk Score"
          value={summary.riskScore}
          color={summary.riskScore > 70 ? '#ef4444' : summary.riskScore > 40 ? '#fb923c' : '#10b981'}
          icon={AlertTriangle}
        />
        <ScoreCard
          label="Compliance Score"
          value={summary.complianceScore}
          color={summary.complianceScore > 80 ? '#10b981' : summary.complianceScore > 50 ? '#fb923c' : '#ef4444'}
          icon={CheckCircle}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        {[
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'recommendations', label: `Recommendations (${summary.recommendationCount})`, icon: '⚡' },
          { id: 'risks', label: `Risks (${summary.riskCount})`, icon: '⚠️' },
          { id: 'insights', label: `Insights (${analysis.insights.length})`, icon: '💡' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-4 py-2.5 text-sm font-semibold transition-all border-b-2"
            style={{
              color: activeTab === tab.id ? '#3b82f6' : 'rgba(255,255,255,0.5)',
              borderColor: activeTab === tab.id ? '#3b82f6' : 'transparent',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab analysis={analysis} />}
      {activeTab === 'recommendations' && <RecommendationsTab recommendations={analysis.recommendations} />}
      {activeTab === 'risks' && <RisksTab risks={analysis.risks} />}
      {activeTab === 'insights' && <InsightsTab insights={analysis.insights} />}
    </div>
  );
}

function OverviewTab({ analysis }) {
  const actions = analysis.actionItems;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-3">
        <MetricCard label="Total Recommendations" value={analysis.totalRecommendations} color="#3b82f6" />
        <MetricCard label="Open Risks" value={analysis.totalRisks} color="#ef4444" />
        <MetricCard label="Insights" value={analysis.totalInsights} color="#8b5cf6" />
        <MetricCard label="Analysis Time" value="Live" color="#10b981" />
      </div>

      {/* Priority Actions */}
      <div className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h3 style={{ color: 'white', fontSize: 12, fontWeight: 700, margin: '0 0 12px 0' }}>Recommended Actions</h3>
        <div className="space-y-2">
          {actions.slice(0, 5).map((action, idx) => (
            <motion.div
              key={action.action}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-3 rounded-lg flex items-center justify-between"
              style={{
                background: getActionColor(action.priority) + '15',
                border: `1px solid ${getActionColor(action.priority)}30`,
              }}
            >
              <div>
                <p style={{ color: 'white', fontWeight: 600, fontSize: 11, margin: 0 }}>
                  {action.action.replace(/_/g, ' ').toUpperCase()}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '2px 0 0 0' }}>
                  {action.estimate}
                </p>
              </div>
              <span style={{
                fontSize: 9,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 4,
                background: `${getActionColor(action.priority)}20`,
                color: getActionColor(action.priority),
              }}>
                {action.priority.toUpperCase()}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Status Distribution */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <h3 style={{ color: 'white', fontSize: 11, fontWeight: 700, margin: '0 0 8px 0' }}>Risks by Severity</h3>
          <div className="space-y-2 text-xs">
            {[
              { label: 'Critical', count: analysis.risks.filter(r => r.severity === 'critical').length, color: '#ef4444' },
              { label: 'High', count: analysis.risks.filter(r => r.severity === 'high').length, color: '#fb923c' },
              { label: 'Medium', count: analysis.risks.filter(r => r.severity === 'medium').length, color: '#f59e0b' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>{item.label}</span>
                <span style={{ color: item.color, fontWeight: 700 }}>{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <h3 style={{ color: 'white', fontSize: 11, fontWeight: 700, margin: '0 0 8px 0' }}>Recommendation Types</h3>
          <div className="space-y-2 text-xs">
            {[
              { label: 'Signatures', count: analysis.recommendations.filter(r => r.action === 'request_signature').length },
              { label: 'Documents', count: analysis.recommendations.filter(r => r.action === 'generate_contract').length },
              { label: 'Reviews', count: analysis.recommendations.filter(r => r.action === 'review_agreement').length },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>{item.label}</span>
                <span style={{ color: '#3b82f6', fontWeight: 700 }}>{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RecommendationsTab({ recommendations }) {
  const grouped = {};
  recommendations.forEach(rec => {
    if (!grouped[rec.action]) grouped[rec.action] = [];
    grouped[rec.action].push(rec);
  });

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([action, recs], idx) => (
        <motion.div
          key={action}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="p-4 rounded-lg"
          style={{
            background: '#3b82f620',
            border: '1px solid rgba(59,130,246,0.3)',
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 style={{ color: 'white', fontWeight: 700, fontSize: 12, margin: 0 }}>
                🔧 {action.replace(/_/g, ' ').toUpperCase()}
              </h4>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '2px 0 0 0' }}>
                {recs.length} item(s)
              </p>
            </div>
            <span style={{
              fontSize: 20,
              fontWeight: 900,
              color: '#3b82f6',
            }}>
              {recs.length}
            </span>
          </div>

          <div className="space-y-2">
            {recs.slice(0, 3).map((rec, i) => (
              <div key={i} className="text-xs p-2 rounded" style={{ background: 'rgba(0,0,0,0.2)' }}>
                <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>
                  {rec.title}
                </p>
                {rec.documents && rec.documents.length > 0 && (
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, margin: '2px 0 0 0' }}>
                    • {rec.documents.map(d => d.title || d.id).join(', ')}
                  </p>
                )}
              </div>
            ))}
            {recs.length > 3 && (
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, margin: 0 }}>
                +{recs.length - 3} more
              </p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function RisksTab({ risks }) {
  if (risks.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.4)' }}>
        ✅ No risks detected
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {risks.map((risk, idx) => (
        <motion.div
          key={risk.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="p-4 rounded-lg"
          style={{
            background: `${getRiskColor(risk.severity)}15`,
            border: `1px solid ${getRiskColor(risk.severity)}30`,
          }}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle size={16} style={{ color: getRiskColor(risk.severity), flexShrink: 0, marginTop: 2 }} />
            <div className="flex-1">
              <h4 style={{ color: 'white', fontWeight: 700, fontSize: 11, margin: 0 }}>
                {risk.title}
              </h4>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, margin: '2px 0 0 0' }}>
                {risk.description}
              </p>
            </div>
            <span style={{
              fontSize: 9,
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 4,
              background: `${getRiskColor(risk.severity)}20`,
              color: getRiskColor(risk.severity),
              whiteSpace: 'nowrap',
            }}>
              {risk.severity.toUpperCase()}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function InsightsTab({ insights }) {
  if (insights.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.4)' }}>
        No additional insights
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {insights.map((insight, idx) => (
        <motion.div
          key={insight.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="p-4 rounded-lg"
          style={{
            background: '#8b5cf620',
            border: '1px solid rgba(139,92,246,0.3)',
          }}
        >
          <div className="flex items-start gap-3">
            <span style={{ fontSize: 16 }}>💡</span>
            <div className="flex-1">
              <h4 style={{ color: 'white', fontWeight: 700, fontSize: 11, margin: 0 }}>
                {insight.title}
              </h4>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, margin: '2px 0 0 0' }}>
                {insight.description}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function ScoreCard({ label, value, color, icon: Icon }) {
  return (
    <div className="p-4 rounded-lg" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
      <div className="flex items-start justify-between">
        <div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, margin: 0 }}>
            {label}
          </p>
          <p style={{ color, fontSize: 24, fontWeight: 900, margin: '4px 0 0 0' }}>
            {value}%
          </p>
        </div>
        <Icon size={20} style={{ color, opacity: 0.6 }} />
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }) {
  return (
    <div className="p-3 rounded-lg" style={{ background: `${color}12`, border: `1px solid ${color}30` }}>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 700, margin: 0 }}>
        {label}
      </p>
      <p style={{ color, fontSize: 16, fontWeight: 900, margin: '4px 0 0 0' }}>
        {value}
      </p>
    </div>
  );
}

function getActionColor(priority) {
  const colors = { urgent: '#ef4444', high: '#fb923c', medium: '#3b82f6', low: '#10b981' };
  return colors[priority] || '#3b82f6';
}

function getRiskColor(severity) {
  const colors = { critical: '#ef4444', high: '#fb923c', medium: '#f59e0b', low: '#10b981' };
  return colors[severity] || '#9ca3af';
}