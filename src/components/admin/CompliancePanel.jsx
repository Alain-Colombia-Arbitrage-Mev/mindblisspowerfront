import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, TrendingUp, Users, DollarSign, FileText, ChevronRight } from 'lucide-react';
import ComplianceFramework from '@/lib/ComplianceFramework';
import { motion } from 'framer-motion';

export default function CompliancePanel({ compact = false }) {
  const [dashboard, setDashboard] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userReport, setUserReport] = useState(null);

  useEffect(() => {
    const initial = ComplianceFramework.getComplianceDashboard();
    setDashboard(initial);

    const unsubscribe = ComplianceFramework.subscribe((event) => {
      if (event.type === 'compliance_logged' || event.type === 'kyc_updated' || event.type === 'aml_updated') {
        const updated = ComplianceFramework.getComplianceDashboard();
        setDashboard(updated);
      }
    });

    return unsubscribe;
  }, []);

  const handleSelectUser = (userId) => {
    setSelectedUser(userId);
    const report = ComplianceFramework.getComplianceReport(userId);
    setUserReport(report);
  };

  const getStatusColor = (status) => {
    const colors = {
      incomplete: '#fb923c',
      pending_verification: '#3b82f6',
      compliant: '#10b981',
      high_risk: '#ef4444',
      elevated_risk: '#fb923c',
    };
    return colors[status] || '#9ca3af';
  };

  const getStatusLabel = (status) => {
    const labels = {
      incomplete: 'Incomplete',
      pending_verification: 'Pending',
      compliant: 'Compliant',
      high_risk: 'High Risk',
      elevated_risk: 'Elevated Risk',
    };
    return labels[status] || status;
  };

  if (!dashboard) return null;

  if (compact) {
    return (
      <div className="space-y-3">
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 700, margin: '0 0 8px 0' }}>COMPLIANCE STATUS</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, margin: '0 0 3px 0' }}>KYC Verified</p>
            <p style={{ color: '#3b82f6', fontSize: 18, fontWeight: 700, margin: 0 }}>{dashboard.summary.verifiedProfiles}/{dashboard.summary.totalProfiles}</p>
          </div>
          <div className="p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, margin: '0 0 3px 0' }}>High Risk Users</p>
            <p style={{ color: '#ef4444', fontSize: 18, fontWeight: 700, margin: 0 }}>{dashboard.summary.highRiskUsers}</p>
          </div>
          <div className="p-3 rounded-lg" style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.15)' }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, margin: '0 0 3px 0' }}>Flagged Txns</p>
            <p style={{ color: '#fb923c', fontSize: 18, fontWeight: 700, margin: 0 }}>{dashboard.summary.flaggedTransactions}</p>
          </div>
          <div className="p-3 rounded-lg" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, margin: '0 0 3px 0' }}>Total Monitored</p>
            <p style={{ color: '#10b981', fontSize: 18, fontWeight: 700, margin: 0 }}>{dashboard.summary.totalTransactionsMonitored}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <p style={{ color: '#10b981', fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: '0 0 6px 0' }}>COMPLIANCE OPERATIONS</p>
        <h3 style={{ color: 'white', fontSize: 24, fontWeight: 900, margin: '0 0 4px 0' }}>Compliance Dashboard</h3>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>KYC, AML, transaction monitoring, and audit logs</p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'KYC Verified', value: dashboard.summary.verifiedProfiles, color: '#10b981', icon: CheckCircle },
          { label: 'Pending KYC', value: dashboard.summary.pendingKYC, color: '#3b82f6', icon: Clock },
          { label: 'High Risk', value: dashboard.summary.highRiskUsers, color: '#ef4444', icon: AlertTriangle },
          { label: 'Flagged Txns', value: dashboard.summary.flaggedTransactions, color: '#fb923c', icon: FileText },
          { label: 'Monitored', value: dashboard.summary.totalTransactionsMonitored, color: '#06b6d4', icon: TrendingUp },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="p-4 rounded-xl" style={{ background: `${card.color}12`, border: `1px solid ${card.color}20` }}>
              <div className="flex items-start justify-between mb-2">
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, margin: 0 }}>{card.label}</p>
                <Icon size={14} style={{ color: card.color }} />
              </div>
              <p style={{ color: card.color, fontSize: 24, fontWeight: 900, margin: 0 }}>{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        {['overview', 'transactions', 'logs'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-3 text-sm font-medium transition-all border-b-2"
            style={{
              borderColor: activeTab === tab ? '#10b981' : 'transparent',
              color: activeTab === tab ? '#10b981' : 'rgba(255,255,255,0.45)',
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="p-4 rounded-xl" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, margin: 0 }}>Overall Compliance Status</p>
                <p style={{ color: '#10b981', fontSize: 18, fontWeight: 700, margin: '3px 0 0 0' }}>Operational</p>
              </div>
              <CheckCircle size={32} style={{ color: '#10b981' }} />
            </div>
          </div>

          <div className="space-y-2">
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 700, margin: 0 }}>KEY METRICS</p>
            {[
              { label: 'KYC Completion Rate', value: `${Math.round((dashboard.summary.verifiedProfiles / dashboard.summary.totalProfiles) * 100)}%`, color: '#10b981' },
              { label: 'Risk-Monitored Users', value: `${dashboard.summary.highRiskUsers} accounts`, color: '#fb923c' },
              { label: 'Transaction Coverage', value: `${dashboard.summary.totalTransactionsMonitored} monitored`, color: '#3b82f6' },
              { label: 'Pending Reviews', value: `${dashboard.summary.flaggedTransactions} transactions`, color: '#ef4444' },
            ].map((metric, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{metric.label}</span>
                <span style={{ color: metric.color, fontWeight: 700, fontSize: 13 }}>{metric.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 700, margin: '0 0 8px 0' }}>RECENT TRANSACTIONS</p>
          <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
            <table className="w-full text-xs">
              <thead style={{ background: 'rgba(0,0,0,0.35)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <tr>
                  {['Transaction', 'Amount', 'User', 'Status', 'Flags'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left" style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ComplianceFramework.transactionLogs.slice(-5).reverse().map((txn, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td className="px-3 py-2.5"><span style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace' }}>{txn.transactionId.slice(0, 12)}...</span></td>
                    <td className="px-3 py-2.5"><span style={{ color: 'rgba(255,255,255,0.7)' }}>${txn.amount.toLocaleString()}</span></td>
                    <td className="px-3 py-2.5"><span style={{ color: 'rgba(255,255,255,0.6)' }}>{txn.userId.slice(0, 8)}...</span></td>
                    <td className="px-3 py-2.5">
                      <span className="px-2 py-1 rounded text-xs font-semibold" style={{ background: txn.status === 'flagged' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: txn.status === 'flagged' ? '#ef4444' : '#10b981' }}>
                        {txn.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5"><span style={{ color: 'rgba(255,255,255,0.5)' }}>{txn.flags.length}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 700, margin: '0 0 8px 0' }}>AUDIT LOG (RECENT 20)</p>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {dashboard.recentLogs.map((log, i) => (
              <div key={i} className="p-3 rounded-lg text-xs" style={{ background: 'rgba(255,255,255,0.03)', borderLeft: `3px solid ${log.severity === 'critical' ? '#ef4444' : log.severity === 'warning' ? '#fb923c' : '#3b82f6'}` }}>
                <div className="flex items-center justify-between mb-1">
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{log.eventType}</span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px' }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0 }}>{log.description}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}