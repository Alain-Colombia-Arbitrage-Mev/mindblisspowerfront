import { useState } from 'react';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';

export default function AutomationLogs() {
  const [logs] = useState([
    { id: 1, flow: 'New Registration Flow', trigger: 'user_register', user: 'user_5420', status: 'success', timestamp: '2026-04-12 14:32:15', duration: 240 },
    { id: 2, flow: 'Purchase Confirmation', trigger: 'purchase_complete', user: 'user_8912', status: 'success', timestamp: '2026-04-12 14:28:42', duration: 156 },
    { id: 3, flow: 'Rank Promotion Alert', trigger: 'rank_achieved', user: 'user_3741', status: 'success', timestamp: '2026-04-12 14:15:08', duration: 89 },
    { id: 4, flow: 'New Registration Flow', trigger: 'user_register', user: 'user_6284', status: 'failed', timestamp: '2026-04-12 14:02:31', duration: 524, error: 'Email service timeout' },
    { id: 5, flow: 'Purchase Confirmation', trigger: 'purchase_complete', user: 'user_4521', status: 'success', timestamp: '2026-04-12 13:58:14', duration: 201 },
    { id: 6, flow: 'New Registration Flow', trigger: 'user_register', user: 'user_9103', status: 'success', timestamp: '2026-04-12 13:45:22', duration: 178 },
  ]);

  const [filter, setFilter] = useState('all');

  const filteredLogs = filter === 'all' ? logs : logs.filter(l => l.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['all', 'success', 'failed'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize"
            style={{
              background: filter === status ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.05)',
              color: filter === status ? '#a855f7' : 'rgba(255,255,255,0.5)',
              border: filter === status ? '1px solid rgba(168,85,247,0.3)' : '1px solid rgba(255,255,255,0.1)'
            }}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredLogs.map(log => (
          <div key={log.id} className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className="text-white text-sm font-medium">{log.flow}</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>
                  User: {log.user} • Trigger: {log.trigger}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {log.status === 'success' ? (
                  <CheckCircle size={16} style={{ color: '#10b981' }} />
                ) : (
                  <AlertCircle size={16} style={{ color: '#ef4444' }} />
                )}
                <span className="text-xs font-medium capitalize" style={{ color: log.status === 'success' ? '#10b981' : '#ef4444' }}>
                  {log.status}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>
                {log.timestamp}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                {log.duration}ms
              </span>
            </div>

            {log.error && (
              <p style={{ color: '#ef4444', fontSize: 10, marginTop: 6 }}>
                Error: {log.error}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}