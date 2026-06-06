import { useState, useEffect } from 'react';
import { Search, Filter, Download, Trash2, Calendar } from 'lucide-react';
import AdminAuditLogger from '@/lib/AdminAuditLogger';

export default function ForensicAudit() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [actorFilter, setActorFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [stats, setStats] = useState({ actions: {}, actors: {}, results: {} });
  const [expandedLog, setExpandedLog] = useState(null);

  const ACTION_TYPES = [
    'LOGIN_ATTEMPT',
    'ROLE_CHANGE',
    'PAYMENT_CHANGE',
    'PLAN_CHANGE',
    'USER_EDIT',
    'PERMISSION_UPDATE',
    'AUTO_MODE_ACTION',
    'AI_COPILOT_ACTION',
  ];

  const ACTION_ICONS = {
    LOGIN_ATTEMPT: '🔐',
    ROLE_CHANGE: '👥',
    PAYMENT_CHANGE: '💳',
    PLAN_CHANGE: '📋',
    USER_EDIT: '✏️',
    PERMISSION_UPDATE: '🔑',
    AUTO_MODE_ACTION: '⚙️',
    AI_COPILOT_ACTION: '🤖',
  };

  const RESULT_COLORS = {
    success: '#10b981',
    failed: '#ef4444',
    ignored: '#fb923c',
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, actionTypeFilter, resultFilter, actorFilter, dateFromFilter, dateToFilter, logs]);

  const loadData = () => {
    const allLogs = AdminAuditLogger.getAllLogs();
    setLogs(allLogs);
    setStats({
      actions: AdminAuditLogger.getActionStats(),
      actors: AdminAuditLogger.getActorStats(),
      results: AdminAuditLogger.getResultStats(),
    });
  };

  const applyFilters = () => {
    let filtered = logs;

    if (searchQuery) {
      filtered = AdminAuditLogger.search(searchQuery);
    } else if (actionTypeFilter || resultFilter || actorFilter || dateFromFilter || dateToFilter) {
      filtered = AdminAuditLogger.filterLogs({
        actionType: actionTypeFilter || null,
        result: resultFilter || null,
        actor: actorFilter || null,
        dateFrom: dateFromFilter || null,
        dateTo: dateToFilter || null,
      });
    }

    setFilteredLogs(filtered);
  };

  const handleExport = () => {
    const dataStr = AdminAuditLogger.exportLogs();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${Date.now()}.json`;
    a.click();
  };

  const handleClearLogs = () => {
    if (confirm('Are you sure? This cannot be undone.')) {
      AdminAuditLogger.clearLogs();
      loadData();
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span style={{ fontSize: 24 }}>🔍</span>
          <h1 className="text-white font-montserrat font-black text-2xl">Forensic Audit Log</h1>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Complete traceability of all critical admin actions</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-lg" style={{ background: 'rgba(13,31,60,0.35)', border: '1px solid rgba(59,130,246,0.18)' }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, margin: 0 }}>TOTAL LOGS</p>
          <p style={{ color: '#3b82f6', fontSize: 24, fontWeight: 700, margin: '8px 0 0' }}>{logs.length}</p>
        </div>
        <div className="p-4 rounded-lg" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, margin: 0 }}>SUCCESS</p>
          <p style={{ color: '#10b981', fontSize: 24, fontWeight: 700, margin: '8px 0 0' }}>{stats.results.success}</p>
        </div>
        <div className="p-4 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, margin: 0 }}>FAILED</p>
          <p style={{ color: '#ef4444', fontSize: 24, fontWeight: 700, margin: '8px 0 0' }}>{stats.results.failed}</p>
        </div>
        <div className="p-4 rounded-lg" style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)' }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, margin: 0 }}>IGNORED</p>
          <p style={{ color: '#fb923c', fontSize: 24, fontWeight: 700, margin: '8px 0 0' }}>{stats.results.ignored}</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="mb-6 p-4 rounded-lg" style={{ background: 'rgba(13,31,60,0.35)', border: '1px solid rgba(59,130,246,0.18)' }}>
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Search size={16} style={{ color: '#3b82f6' }} />
            <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 700 }}>Global Search</label>
          </div>
          <input
            type="text"
            placeholder="Search by email, action, IP, details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg text-white placeholder-white/25 focus:outline-none text-sm"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          <div>
            <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6 }}>Action Type</label>
            <select
              value={actionTypeFilter}
              onChange={(e) => setActionTypeFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg text-white text-sm focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }}
            >
              <option value="">All Actions</option>
              {ACTION_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6 }}>Result</label>
            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg text-white text-sm focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }}
            >
              <option value="">All Results</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="ignored">Ignored</option>
            </select>
          </div>

          <div>
            <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6 }}>Actor</label>
            <input
              type="text"
              placeholder="Filter by email..."
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg text-white placeholder-white/25 focus:outline-none text-sm"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6 }}>From</label>
            <input
              type="date"
              value={dateFromFilter}
              onChange={(e) => setDateFromFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg text-white text-sm focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }}
            />
          </div>
          <div>
            <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6 }}>To</label>
            <input
              type="date"
              value={dateToFilter}
              onChange={(e) => setDateToFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg text-white text-sm focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{ color: '#3b82f6', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)' }}
          >
            <Download size={14} /> Export JSON
          </button>
          <button
            onClick={handleClearLogs}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
          >
            <Trash2 size={14} /> Clear Logs
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        {filteredLogs.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, textAlign: 'center', padding: '40px 20px' }}>No audit logs found</p>
        ) : (
          filteredLogs.map((entry, idx) => (
            <div
              key={entry.id}
              className="p-4 rounded-lg cursor-pointer transition-all"
              onClick={() => setExpandedLog(expandedLog === entry.id ? null : entry.id)}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderLeft: `3px solid ${RESULT_COLORS[entry.result]}`,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3 flex-1">
                  <span style={{ fontSize: 18 }}>{ACTION_ICONS[entry.actionType]}</span>
                  <div className="flex-1 min-w-0">
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 700, margin: 0 }}>
                      {entry.actionType.replace(/_/g, ' ')}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '2px 0 0' }}>
                      {entry.actor} • {formatDate(entry.timestamp)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <span
                    style={{
                      color: RESULT_COLORS[entry.result],
                      background: `${RESULT_COLORS[entry.result]}20`,
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    {entry.result}
                  </span>
                </div>
              </div>

              {expandedLog === entry.id && (
                <div className="mt-4 pt-4 border-t border-white/8" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                  <div className="space-y-2">
                    {Object.entries(entry.details).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>{key}:</span>
                        <span style={{ wordBreak: 'break-all', textAlign: 'right', maxWidth: '60%' }}>
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}