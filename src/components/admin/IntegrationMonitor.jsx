import { useState, useEffect } from 'react';
import { Activity, AlertCircle, CheckCircle, Clock, Network } from 'lucide-react';
import APISimulator from '@/lib/APISimulator';
import { motion } from 'framer-motion';

export default function IntegrationMonitor() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('all');

  const simulator = APISimulator.getInstance();

  useEffect(() => {
    updateLogs();
    const interval = setInterval(updateLogs, 2000);
    return () => clearInterval(interval);
  }, []);

  const updateLogs = () => {
    setLogs(simulator.getRequestLog(20));
    setStats(simulator.getStatistics());
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'success') return log.status === 'success';
    if (filter === 'error') return log.status === 'error';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 style={{ color: 'white', fontSize: 18, fontWeight: 900, margin: 0 }}>Integration Monitor</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '4px 0 0 0' }}>
          API simulation and integration readiness tracking
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Total Requests"
            value={stats.total}
            icon={Activity}
            color="#3b82f6"
          />
          <StatCard
            label="Success Rate"
            value={`${stats.successRate}%`}
            icon={CheckCircle}
            color="#10b981"
          />
          <StatCard
            label="Failed"
            value={stats.failed}
            icon={AlertCircle}
            color="#ef4444"
          />
          <StatCard
            label="Avg Duration"
            value={`${stats.avgDuration}ms`}
            icon={Clock}
            color="#fb923c"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        {[
          { id: 'all', label: 'All' },
          { id: 'success', label: 'Success' },
          { id: 'error', label: 'Errors' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className="px-3 py-1.5 rounded text-xs font-semibold transition-all"
            style={{
              background: filter === f.id ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
              color: filter === f.id ? '#3b82f6' : 'rgba(255,255,255,0.5)',
              border: `1px solid ${filter === f.id ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.1)'}`,
            }}
          >
            {f.label}
          </button>
        ))}
        <button
          onClick={() => {
            simulator.clearLogs();
            updateLogs();
          }}
          className="px-3 py-1.5 rounded text-xs font-semibold ml-auto transition-all"
          style={{
            background: 'rgba(255,255,255,0.05)',
            color: 'rgba(255,255,255,0.5)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          Clear Logs
        </button>
      </div>

      {/* Request Log */}
      <div className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h3 style={{ color: 'white', fontSize: 12, fontWeight: 700, margin: '0 0 12px 0' }}>
          Recent Requests
        </h3>

        {filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.3)' }}>
            No requests
          </div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredLogs.map((log, idx) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
                className="p-3 rounded-lg"
                style={{
                  background: log.status === 'success' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                  border: log.status === 'success' ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(239,68,68,0.2)',
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {log.status === 'success' ? (
                        <CheckCircle size={14} style={{ color: '#10b981' }} />
                      ) : (
                        <AlertCircle size={14} style={{ color: '#ef4444' }} />
                      )}
                      <span style={{ color: 'white', fontWeight: 600, fontSize: 11 }}>
                        {log.method} {log.endpoint}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      <span>ID: {log.id}</span>
                      <span>⏱ {log.duration}ms</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 4,
                        background: log.status === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                        color: log.status === 'success' ? '#10b981' : '#ef4444',
                      }}
                    >
                      {log.status?.toUpperCase()}
                    </span>
                  </div>
                </div>

                {log.response?.error && (
                  <div style={{ marginTop: 8, padding: 8, background: 'rgba(0,0,0,0.2)', borderRadius: 4 }}>
                    <p style={{ color: '#ef4444', fontSize: 10, fontWeight: 600, margin: '0 0 2px 0' }}>
                      {log.response.error.code}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, margin: 0 }}>
                      {log.response.error.message}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Integration Status */}
      <div className="p-4 rounded-lg" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))', border: '1px solid rgba(59,130,246,0.2)' }}>
        <div className="flex items-start justify-between">
          <div>
            <h3 style={{ color: 'white', fontSize: 12, fontWeight: 700, margin: 0 }}>Integration Readiness</h3>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '4px 0 0 0' }}>
              System prepared for real API integration
            </p>
          </div>
          <Network size={20} style={{ color: '#3b82f6', opacity: 0.6 }} />
        </div>

        <div className="mt-4 space-y-2">
          {[
            { label: '✓ API Endpoints Defined', status: 'ready' },
            { label: '✓ Error Simulation Active', status: 'ready' },
            { label: '✓ Loading States Implemented', status: 'ready' },
            { label: '✓ Request Logging System', status: 'ready' },
            { label: '✓ Integration Hooks Configured', status: 'ready' },
            { label: '🔄 Real Backend Connection', status: 'pending' },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <span style={{ color: item.status === 'ready' ? '#10b981' : '#fb923c' }}>
                {item.label}
              </span>
              <span
                style={{
                  fontSize: 8,
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: 3,
                  background: item.status === 'ready' ? '#10b98120' : '#fb923c20',
                  color: item.status === 'ready' ? '#10b981' : '#fb923c',
                }}
              >
                {item.status.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="p-4 rounded-lg" style={{ background: `${color}12`, border: `1px solid ${color}30` }}>
      <div className="flex items-start justify-between">
        <div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, margin: 0 }}>
            {label}
          </p>
          <p style={{ color, fontSize: 18, fontWeight: 900, margin: '4px 0 0 0' }}>
            {value}
          </p>
        </div>
        <Icon size={18} style={{ color, opacity: 0.6 }} />
      </div>
    </div>
  );
}