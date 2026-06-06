import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Key, Lock, Users, Shield, LogOut } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

const INITIAL_LOGS = [
  { id: 'log-001', action: 'login', admin: 'Admin', details: 'Successful login from 192.168.1.100', severity: 'info', timestamp: '2 mins ago' },
  { id: 'log-002', action: 'password_change', admin: 'Super Admin', details: 'Password reset executed', severity: 'warning', timestamp: '15 mins ago' },
  { id: 'log-003', action: 'access_revoked', admin: 'Support Team', details: 'Dashboard access revoked', severity: 'critical', timestamp: '1 hour ago' },
  { id: 'log-004', action: 'role_change', admin: 'Collaborator', details: 'Role changed to support_operator', severity: 'warning', timestamp: '2 hours ago' },
  { id: 'log-005', action: 'permission_grant', admin: 'Finance Team', details: 'Granted access to Payments module', severity: 'info', timestamp: '3 hours ago' },
  { id: 'log-006', action: 'session_terminated', admin: 'Support Team', details: 'Session ended - Force logout', severity: 'warning', timestamp: '4 hours ago' },
];

const getActionIcon = (action) => {
  switch(action) {
    case 'login': return LogOut;
    case 'password_change': return Key;
    case 'access_revoked': return Lock;
    case 'role_change': return Users;
    case 'permission_grant': return Shield;
    case 'session_terminated': return AlertTriangle;
    default: return AlertTriangle;
  }
};

const getSeverityColor = (severity) => {
  switch(severity) {
    case 'info': return '#3b82f6';
    case 'warning': return '#fb923c';
    case 'critical': return '#ef4444';
    default: return '#6b7280';
  }
};

export default function SecurityAuditLog() {
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterAction, setFilterAction] = useState('all');

  const filteredLogs = logs.filter(log => 
    (filterSeverity === 'all' || log.severity === filterSeverity) &&
    (filterAction === 'all' || log.action === filterAction)
  );

  const actions = [...new Set(logs.map(l => l.action))];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <motion.div initial="hidden" animate="visible" transition={{ duration: 0.5 }} variants={fadeUp}
        className="rounded-xl p-4 flex gap-4 flex-wrap" style={{ background: 'rgba(8,18,40,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div>
          <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 4 }}>Severity</label>
          <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-3 py-1.5 rounded text-xs"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }}>
            <option value="all" style={{ background: '#0a1628' }}>All Severities</option>
            <option value="info" style={{ background: '#0a1628' }}>Info</option>
            <option value="warning" style={{ background: '#0a1628' }}>Warning</option>
            <option value="critical" style={{ background: '#0a1628' }}>Critical</option>
          </select>
        </div>

        <div>
          <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 4 }}>Action Type</label>
          <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)}
            className="px-3 py-1.5 rounded text-xs"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }}>
            <option value="all" style={{ background: '#0a1628' }}>All Actions</option>
            {actions.map(action => (
              <option key={action} value={action} style={{ background: '#0a1628' }}>
                {action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </option>
            ))}
          </select>
        </div>

        <div className="ml-auto flex items-end">
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
            Showing {filteredLogs.length} of {logs.length} entries
          </span>
        </div>
      </motion.div>

      {/* Audit Log */}
      <motion.div initial="hidden" animate="visible" transition={{ duration: 0.5, delay: 0.1 }} variants={fadeUp}
        className="rounded-xl p-6 overflow-hidden" style={{ background: 'rgba(8,18,40,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <h3 style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: '0 0 16px 0' }}>Security Audit Log</h3>
        
        {filteredLogs.length === 0 ? (
          <div className="text-center p-8" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0, fontSize: 13 }}>No logs match your filters</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredLogs.map((log, idx) => {
              const Icon = getActionIcon(log.action);
              const severityColor = getSeverityColor(log.severity);
              
              return (
                <motion.div key={log.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="flex items-start gap-4 p-3 rounded-lg" style={{ background: `${severityColor}08`, border: `1px solid ${severityColor}15` }}>
                  <Icon size={16} style={{ color: severityColor, flexShrink: 0, marginTop: 2 }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p style={{ color: 'white', fontWeight: 600, margin: 0, fontSize: 12 }}>
                        {log.action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </p>
                      <span className="px-1.5 py-0.5 rounded text-xs font-semibold" style={{ background: `${severityColor}20`, color: severityColor }}>
                        {log.severity.toUpperCase()}
                      </span>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: '0 0 2px 0' }}>
                      {log.admin}: {log.details}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: 0 }}>{log.timestamp}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Summary Cards */}
      <motion.div initial="hidden" animate="visible" transition={{ duration: 0.5, delay: 0.2 }} variants={fadeUp}
        className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Events', value: logs.length, color: '#3b82f6' },
          { label: 'Critical', value: logs.filter(l => l.severity === 'critical').length, color: '#ef4444' },
          { label: 'Warnings', value: logs.filter(l => l.severity === 'warning').length, color: '#fb923c' },
          { label: 'Info', value: logs.filter(l => l.severity === 'info').length, color: '#3b82f6' },
        ].map(stat => (
          <div key={stat.label} className="p-4 rounded-xl" style={{ background: `${stat.color}12`, border: `1px solid ${stat.color}20` }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, margin: 0 }}>{stat.label}</p>
            <p style={{ color: stat.color, fontSize: 20, fontWeight: 900, margin: '4px 0 0 0' }}>{stat.value}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}