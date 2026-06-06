import { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, CheckCircle, XCircle, Eye, Clock } from 'lucide-react';
import TransactionMonitor from '@/lib/TransactionMonitor';
import { motion, AnimatePresence } from 'framer-motion';

const getRiskColor = (level) => {
  const colors = { low: '#10b981', medium: '#fb923c', high: '#ef4444' };
  return colors[level] || '#9ca3af';
};

export default function TransactionMonitoringDashboard() {
  const [summary, setSummary] = useState(null);
  const [reviewQueue, setReviewQueue] = useState([]);
  const [financeQueue, setFinanceQueue] = useState([]);
  const [aiAlerts, setAIAlerts] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTx, setSelectedTx] = useState(null);

  useEffect(() => {
    setSummary(TransactionMonitor.getDashboardSummary());
    setReviewQueue(TransactionMonitor.getReviewQueue());
    setFinanceQueue(TransactionMonitor.getFinanceQueue());
    setAIAlerts(TransactionMonitor.getAIAlerts());

    const unsubscribe = TransactionMonitor.subscribe((event) => {
      setSummary(TransactionMonitor.getDashboardSummary());
      setReviewQueue(TransactionMonitor.getReviewQueue());
      setFinanceQueue(TransactionMonitor.getFinanceQueue());
      setAIAlerts(TransactionMonitor.getAIAlerts());
    });

    return unsubscribe;
  }, []);

  if (!summary) return null;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 style={{ color: 'white', fontSize: 24, fontWeight: 900, margin: 0 }}>Transaction Monitoring</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: '4px 0 0 0' }}>
          Real-time payment tracking and suspicious activity detection
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <SummaryCard
          label="Total Transactions"
          value={summary.totalTransactions}
          subtext={`${summary.transactionsLast24h} last 24h`}
          icon={TrendingUp}
          color="#3b82f6"
        />
        <SummaryCard
          label="Total Volume"
          value={`$${(summary.totalVolume / 1000).toFixed(0)}K`}
          subtext={`$${(summary.volumeLast24h / 1000).toFixed(0)}K last 24h`}
          icon={TrendingUp}
          color="#10b981"
        />
        <SummaryCard
          label="High Risk"
          value={summary.highRiskCount}
          subtext="Flagged transactions"
          icon={AlertTriangle}
          color="#ef4444"
        />
        <SummaryCard
          label="Pending Review"
          value={summary.pendingReview + summary.financeReview}
          subtext="Action required"
          icon={Clock}
          color="#fb923c"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        {[
          { id: 'overview', label: 'Overview', badge: summary.activeAlerts },
          { id: 'review', label: 'Review Queue', badge: summary.pendingReview },
          { id: 'finance', label: 'Finance Review', badge: summary.financeReview },
          { id: 'alerts', label: 'AI Alerts', badge: summary.activeAlerts },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all relative"
            style={{
              borderColor: activeTab === tab.id ? '#3b82f6' : 'transparent',
              color: activeTab === tab.id ? '#3b82f6' : 'rgba(255,255,255,0.4)',
            }}
          >
            {tab.label}
            {tab.badge > 0 && (
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: '#ef4444', color: 'white' }}
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Risk Distribution */}
            <div className="p-6 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 700, margin: '0 0 12px 0' }}>
                Risk Distribution
              </h3>
              <div className="space-y-3">
                {[
                  { level: 'high', count: summary.highRiskCount, color: '#ef4444' },
                  { level: 'medium', count: summary.flaggedTransactions - summary.highRiskCount, color: '#fb923c' },
                  { level: 'low', count: summary.totalTransactions - summary.flaggedTransactions, color: '#10b981' },
                ].map(item => (
                  <div key={item.level} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                        {item.level.charAt(0).toUpperCase() + item.level.slice(1)}
                      </span>
                    </div>
                    <span style={{ color: item.color, fontWeight: 700, fontSize: 12 }}>
                      {item.count} ({Math.round((item.count / summary.totalTransactions) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Queue Status */}
            <div className="p-6 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 700, margin: '0 0 12px 0' }}>
                Queue Status
              </h3>
              <div className="space-y-3">
                {[
                  { name: 'Review Queue', count: summary.pendingReview, color: '#fb923c' },
                  { name: 'Finance Review', count: summary.financeReview, color: '#ef4444' },
                  { name: 'AI Alerts', count: summary.activeAlerts, color: '#3b82f6' },
                ].map(queue => (
                  <div key={queue.name} className="flex items-center justify-between">
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{queue.name}</span>
                    <span style={{ color: queue.color, fontWeight: 700, fontSize: 13 }}>
                      {queue.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Queue Tab */}
      {activeTab === 'review' && (
        <TransactionQueueView transactions={reviewQueue} queueType="review" />
      )}

      {/* Finance Queue Tab */}
      {activeTab === 'finance' && (
        <TransactionQueueView transactions={financeQueue} queueType="finance" />
      )}

      {/* AI Alerts Tab */}
      {activeTab === 'alerts' && (
        <AIAlertsView alerts={aiAlerts} />
      )}
    </div>
  );
}

function SummaryCard({ label, value, subtext, icon: Icon, color }) {
  return (
    <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, margin: 0 }}>
            {label}
          </p>
          <p style={{ color: 'white', fontSize: 20, fontWeight: 900, margin: '4px 0 0 0' }}>
            {value}
          </p>
        </div>
        <Icon size={20} style={{ color }} />
      </div>
      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: 0 }}>{subtext}</p>
    </div>
  );
}

function TransactionQueueView({ transactions, queueType }) {
  return (
    <div className="space-y-3">
      {transactions.length === 0 ? (
        <div className="p-8 text-center rounded-xl" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <CheckCircle size={32} style={{ color: '#10b981', margin: '0 auto 8px' }} />
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, margin: 0 }}>
            Queue is empty
          </p>
        </div>
      ) : (
        transactions.map(tx => (
          <motion.div
            key={tx.txId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-lg border"
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)' }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontFamily: 'monospace' }}>
                    {tx.txId.slice(0, 8)}...
                  </span>
                  <div
                    className="px-2 py-1 rounded text-xs font-semibold"
                    style={{ background: `${getRiskColor(tx.amlRiskLevel)}20`, color: getRiskColor(tx.amlRiskLevel) }}
                  >
                    {tx.amlRiskLevel.toUpperCase()}
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: 0 }}>Amount</p>
                    <p style={{ color: 'white', fontWeight: 700, margin: '2px 0 0 0' }}>
                      ${tx.amount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: 0 }}>Method</p>
                    <p style={{ color: 'white', fontWeight: 700, margin: '2px 0 0 0' }}>{tx.method}</p>
                  </div>
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: 0 }}>Route</p>
                    <p style={{ color: 'white', fontWeight: 700, margin: '2px 0 0 0' }}>
                      {tx.fromCountry} → {tx.toCountry}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: 0 }}>Flags</p>
                    <p style={{ color: '#ef4444', fontWeight: 700, margin: '2px 0 0 0' }}>
                      {tx.redFlags.length} detected
                    </p>
                  </div>
                </div>
              </div>
              <button
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{ background: 'rgba(59,130,246,0.2)', color: '#3b82f6' }}
              >
                Review
              </button>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
}

function AIAlertsView({ alerts }) {
  return (
    <div className="space-y-3">
      {alerts.length === 0 ? (
        <div className="p-8 text-center rounded-xl" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <CheckCircle size={32} style={{ color: '#10b981', margin: '0 auto 8px' }} />
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, margin: 0 }}>
            No active alerts
          </p>
        </div>
      ) : (
        alerts.map(alert => (
          <motion.div
            key={alert.txId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-lg border"
            style={{ background: `${alert.severity === 'critical' ? '#ef4444' : '#fb923c'}15`, borderColor: `${alert.severity === 'critical' ? '#ef4444' : '#fb923c'}30` }}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle
                size={18}
                style={{ color: alert.severity === 'critical' ? '#ef4444' : '#fb923c', flexShrink: 0, marginTop: 2 }}
              />
              <div className="flex-1">
                <p style={{ color: 'white', fontWeight: 700, fontSize: 12, margin: 0 }}>
                  {alert.txId.slice(0, 8)}... - {alert.severity.toUpperCase()}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, margin: '3px 0 0 0' }}>
                  {alert.reason}
                </p>
                {alert.redFlags.length > 0 && (
                  <div style={{ marginTop: 8 }} className="flex flex-wrap gap-1">
                    {alert.redFlags.map((flag, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded text-xs"
                        style={{ background: 'rgba(0,0,0,0.3)', color: 'rgba(255,255,255,0.7)' }}
                      >
                        {flag.type}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
}