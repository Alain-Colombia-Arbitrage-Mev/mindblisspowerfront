import { useState, useEffect } from 'react';
import { Search, Filter, CheckCircle, AlertCircle, Clock, BarChart3, Download } from 'lucide-react';
import LegalAuditSystem from '@/lib/LegalAuditSystem';
import { motion } from 'framer-motion';

export default function LegalAuditDashboard() {
  const [logs, setLogs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    action_type: '',
    severity: '',
    approval_status: '',
  });
  const [selectedLog, setSelectedLog] = useState(null);

  const auditSystem = LegalAuditSystem.getInstance();

  useEffect(() => {
    loadLogs();
    const unsubscribe = auditSystem.subscribe(() => loadLogs());
    return unsubscribe;
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, searchQuery, filters]);

  const loadLogs = () => {
    const allLogs = auditSystem.getAllLogs();
    setLogs(allLogs);
    setStats(auditSystem.getStatistics());
  };

  const applyFilters = () => {
    let results = logs;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        log =>
          log.user_email?.toLowerCase().includes(query) ||
          log.action_description?.toLowerCase().includes(query) ||
          log.document_id?.includes(query) ||
          log.document_title?.toLowerCase().includes(query)
      );
    }

    const activeFilters = Object.entries(filters).reduce((acc, [key, val]) => {
      if (val) acc[key] = val;
      return acc;
    }, {});

    if (Object.keys(activeFilters).length > 0) {
      results = auditSystem.filterLogs(activeFilters);
    }

    setFiltered(results);
  };

  const handleApproveAction = (logId) => {
    auditSystem.approveAction(logId, 'admin@example.com');
    loadLogs();
  };

  const handleRejectAction = (logId, reason) => {
    auditSystem.rejectAction(logId, 'admin@example.com', reason);
    loadLogs();
  };

  const handleExport = (format) => {
    const data = auditSystem.exportLogs(format);
    const element = document.createElement('a');
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(data)}`);
    element.setAttribute('download', `audit-logs.${format}`);
    element.click();
  };

  if (!stats) {
    return <div style={{ color: 'rgba(255,255,255,0.4)' }}>Loading audit logs...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 style={{ color: 'white', fontSize: 20, fontWeight: 900, margin: 0 }}>Legal Audit Trail</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '4px 0 0 0' }}>
          Complete traceability of all legal actions, contracts, documents, and signatures
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard label="Total Actions" value={stats.total} color="#3b82f6" icon={BarChart3} />
        <StatCard label="Critical Actions" value={stats.criticalActions} color="#ef4444" icon={AlertCircle} />
        <StatCard label="Pending Approval" value={stats.pendingApprovals} color="#fb923c" icon={Clock} />
        <StatCard label="Approved" value={stats.byApprovalStatus?.approved || 0} color="#10b981" icon={CheckCircle} />
        <StatCard label="This Hour" value={logs.filter(l => {
          const now = new Date();
          const logTime = new Date(l.timestamp);
          return (now - logTime) < 3600000;
        }).length} color="#8b5cf6" icon={Clock} />
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
          <input
            type="text"
            placeholder="Search by user, action, document, or contract..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }}
          />
        </div>

        <div className="grid grid-cols-4 gap-3">
          <FilterSelect
            label="Action Type"
            value={filters.action_type}
            onChange={(val) => setFilters(prev => ({ ...prev, action_type: val }))}
            options={['contract_created', 'contract_updated', 'document_generated', 'signature_completed', 'status_changed']}
          />
          <FilterSelect
            label="Severity"
            value={filters.severity}
            onChange={(val) => setFilters(prev => ({ ...prev, severity: val }))}
            options={['critical', 'high', 'medium', 'low']}
          />
          <FilterSelect
            label="Approval Status"
            value={filters.approval_status}
            onChange={(val) => setFilters(prev => ({ ...prev, approval_status: val }))}
            options={['pending', 'approved', 'rejected']}
          />
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('json')}
              className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{ background: 'rgba(59,130,246,0.2)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}
            >
              <Download size={12} className="inline mr-1" />
              Export JSON
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{ background: 'rgba(59,130,246,0.2)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Timeline View */}
      <div className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h2 style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: '0 0 16px 0' }}>Audit Timeline</h2>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.4)' }}>
            No audit logs found
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((log, idx) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => setSelectedLog(log)}
                className="p-4 rounded-lg cursor-pointer transition-all hover:bg-white/5"
                style={{
                  background: `${getSeverityColor(log.severity)}12`,
                  border: `1px solid ${getSeverityColor(log.severity)}30`,
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <SeverityIcon severity={log.severity} />
                      <span style={{ color: 'white', fontWeight: 600, fontSize: 12 }}>
                        {log.action_description}
                      </span>
                      {log.requires_approval && (
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: `${getApprovalColor(log.approval_status)}20`,
                            color: getApprovalColor(log.approval_status),
                          }}
                        >
                          {log.approval_status?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      <span>👤 {log.user_email}</span>
                      {log.document_title && <span>📄 {log.document_title}</span>}
                      <span>🕐 {new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '4px 8px',
                        borderRadius: 4,
                        background: `${getSeverityColor(log.severity)}20`,
                        color: getSeverityColor(log.severity),
                      }}
                    >
                      {log.severity?.toUpperCase()}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Approvals */}
      {stats.pendingApprovals > 0 && (
        <div className="p-4 rounded-lg" style={{ background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.2)' }}>
          <h2 style={{ color: '#fb923c', fontSize: 14, fontWeight: 700, margin: '0 0 12px 0' }}>
            ⚠️ Pending Approvals ({stats.pendingApprovals})
          </h2>
          <div className="space-y-2">
            {auditSystem.getPendingApprovals().slice(0, 5).map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(251,146,60,0.2)' }}
              >
                <div>
                  <p style={{ color: 'white', fontWeight: 600, fontSize: 11, margin: 0 }}>
                    {log.action_description}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '2px 0 0 0' }}>
                    by {log.user_email}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproveAction(log.id)}
                    className="px-2 py-1 rounded text-xs font-semibold transition-all"
                    style={{ background: '#10b98120', color: '#10b981', border: '1px solid #10b98140' }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleRejectAction(log.id, 'Admin rejection')}
                    className="px-2 py-1 rounded text-xs font-semibold transition-all"
                    style={{ background: '#ef444420', color: '#ef4444', border: '1px solid #ef444440' }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 style={{ color: 'white', fontSize: 12, fontWeight: 700, margin: '0 0 12px 0' }}>By Action Type</h3>
          <div className="space-y-2">
            {Object.entries(stats.byActionType)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([type, count]) => (
                <div key={type} className="flex items-center justify-between text-xs">
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>{type.replace(/_/g, ' ')}</span>
                  <span style={{ color: 'white', fontWeight: 600 }}>{count}</span>
                </div>
              ))}
          </div>
        </div>

        <div className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 style={{ color: 'white', fontSize: 12, fontWeight: 700, margin: '0 0 12px 0' }}>By Severity</h3>
          <div className="space-y-2">
            {Object.entries(stats.bySeverity)
              .sort(([a], [b]) => ['critical', 'high', 'medium', 'low'].indexOf(a) - ['critical', 'high', 'medium', 'low'].indexOf(b))
              .map(([severity, count]) => (
                <div key={severity} className="flex items-center justify-between text-xs">
                  <span style={{ color: getSeverityColor(severity) }}>{severity.toUpperCase()}</span>
                  <span style={{ color: 'white', fontWeight: 600 }}>{count}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setSelectedLog(null)}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <h2 style={{ color: 'white', fontSize: 16, fontWeight: 900, margin: '0 0 16px 0' }}>
              Audit Log Details
            </h2>

            <div className="space-y-3 text-xs">
              <DetailRow label="ID" value={selectedLog.id} />
              <DetailRow label="Action" value={selectedLog.action_description} />
              <DetailRow label="User" value={selectedLog.user_email} />
              <DetailRow label="Role" value={selectedLog.user_role} />
              <DetailRow label="Timestamp" value={new Date(selectedLog.timestamp).toLocaleString()} />
              <DetailRow label="Severity" value={<SeverityBadge severity={selectedLog.severity} />} />
              {selectedLog.document_id && <DetailRow label="Document ID" value={selectedLog.document_id} />}
              {selectedLog.document_title && <DetailRow label="Document" value={selectedLog.document_title} />}
              {selectedLog.contract_id && <DetailRow label="Contract ID" value={selectedLog.contract_id} />}
              {selectedLog.signature_id && <DetailRow label="Signature ID" value={selectedLog.signature_id} />}
              {selectedLog.previous_status && <DetailRow label="Previous Status" value={selectedLog.previous_status} />}
              {selectedLog.new_status && <DetailRow label="New Status" value={selectedLog.new_status} />}
              <DetailRow label="IP Address" value={selectedLog.ip_address} />
              {selectedLog.requires_approval && (
                <DetailRow label="Approval Status" value={<ApprovalBadge status={selectedLog.approval_status} />} />
              )}
            </div>

            <button
              onClick={() => setSelectedLog(null)}
              className="w-full mt-6 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{ background: 'rgba(59,130,246,0.2)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

function StatCard({ label, value, color, icon: Icon }) {
  return (
    <div className="p-4 rounded-lg" style={{ background: `${color}12`, border: `1px solid ${color}30` }}>
      <div className="flex items-start justify-between">
        <div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, margin: 0 }}>
            {label}
          </p>
          <p style={{ color, fontSize: 18, fontWeight: 900, margin: '4px 0 0 0' }}>{value}</p>
        </div>
        <Icon size={18} style={{ color, opacity: 0.6 }} />
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div>
      <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 600, display: 'block', marginBottom: 4 }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded text-xs"
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }}
      >
        <option value="">All</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>
        ))}
      </select>
    </div>
  );
}

function SeverityIcon({ severity }) {
  const colors = {
    critical: '#ef4444',
    high: '#fb923c',
    medium: '#f59e0b',
    low: '#10b981',
  };
  return (
    <div
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: colors[severity],
        flexShrink: 0,
      }}
    />
  );
}

function SeverityBadge({ severity }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        padding: '2px 6px',
        borderRadius: 4,
        background: `${getSeverityColor(severity)}20`,
        color: getSeverityColor(severity),
      }}
    >
      {severity?.toUpperCase()}
    </span>
  );
}

function ApprovalBadge({ status }) {
  const color = getApprovalColor(status);
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        padding: '2px 6px',
        borderRadius: 4,
        background: `${color}20`,
        color,
      }}
    >
      {status?.toUpperCase()}
    </span>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between">
      <span style={{ color: 'rgba(255,255,255,0.4)' }}>{label}:</span>
      <span style={{ color: 'white', fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function getSeverityColor(severity) {
  const colors = {
    critical: '#ef4444',
    high: '#fb923c',
    medium: '#f59e0b',
    low: '#10b981',
  };
  return colors[severity] || '#9ca3af';
}

function getApprovalColor(status) {
  const colors = {
    pending: '#fb923c',
    approved: '#10b981',
    rejected: '#ef4444',
  };
  return colors[status] || '#9ca3af';
}