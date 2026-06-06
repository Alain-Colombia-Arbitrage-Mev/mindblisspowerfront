import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, LogOut } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

const INITIAL_SESSIONS = [
  { id: 'sess-001', admin: 'Admin', email: 'admin@vicionpower.local', device: 'Chrome on macOS', ip: '192.168.1.100', startTime: '2 hours ago', status: 'active' },
  { id: 'sess-002', admin: 'Admin', email: 'admin@vicionpower.local', device: 'Safari on iPad', ip: '192.168.1.101', startTime: '30 mins ago', status: 'active' },
  { id: 'sess-003', admin: 'Super Admin', email: 'superadmin@vicionpower.local', device: 'Firefox on Windows', ip: '192.168.1.102', startTime: '1 hour ago', status: 'active' },
  { id: 'sess-004', admin: 'Support Team', email: 'support@vicionpower.local', device: 'Chrome on Linux', ip: '192.168.1.103', startTime: '30 mins ago', status: 'idle' },
];

export default function SecuritySessionControl() {
  const [sessions, setSessions] = useState(INITIAL_SESSIONS);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const handleTerminateSession = (sessionId) => {
    setSelectedSession(sessionId);
    setLoading(true);
    
    setTimeout(() => {
      const session = sessions.find(s => s.id === sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      const entry = {
        id: Math.random().toString(36).slice(-8),
        admin: session.admin,
        action: 'Session terminated',
        device: session.device,
        timestamp: new Date().toLocaleString()
      };
      
      setHistory(prev => [entry, ...prev]);
      setSelectedSession(null);
      setLoading(false);
    }, 1200);
  };

  const handleForceLogout = () => {
    setLoading(true);
    
    setTimeout(() => {
      const activeSessions = sessions.filter(s => s.status === 'active');
      activeSessions.forEach(s => {
        setHistory(prev => [{
          id: Math.random().toString(36).slice(-8),
          admin: s.admin,
          action: 'Force logout',
          device: s.device,
          timestamp: new Date().toLocaleString()
        }, ...prev]);
      });
      
      setSessions(prev => prev.filter(s => s.status !== 'active'));
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Active Sessions Table */}
      <motion.div initial="hidden" animate="visible" transition={{ duration: 0.5 }} variants={fadeUp}
        className="rounded-xl p-6 overflow-hidden" style={{ background: 'rgba(8,18,40,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: 0 }}>Active Sessions</h3>
          {sessions.filter(s => s.status === 'active').length > 0 && (
            <button onClick={handleForceLogout} disabled={loading}
              className="px-3 py-1.5 rounded text-xs font-semibold transition-all flex items-center gap-2"
              style={{ color: '#ef4444', background: 'rgba(239,68,68,0.15)' }}>
              {loading ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}
              Force All Logouts
            </button>
          )}
        </div>
        
        {sessions.length === 0 ? (
          <div className="text-center p-8" style={{ background: 'rgba(16,185,129,0.05)', borderRadius: 8 }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: 13 }}>No active sessions</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead style={{ background: 'rgba(0,0,0,0.35)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <tr>
                {['Admin', 'Device', 'IP Address', 'Started', 'Status', 'Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sessions.map(session => (
                <tr key={session.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td className="px-4 py-3">
                    <div>
                      <p style={{ color: 'white', fontWeight: 600, margin: 0 }}>{session.admin}</p>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '2px 0 0 0' }}>{session.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3"><p style={{ color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: 12 }}>{session.device}</p></td>
                  <td className="px-4 py-3"><p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: 11, fontFamily: 'monospace' }}>{session.ip}</p></td>
                  <td className="px-4 py-3"><p style={{ color: 'rgba(255,255,255,0.4)', margin: 0, fontSize: 11 }}>{session.startTime}</p></td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded text-xs font-semibold" style={{
                      background: session.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(139,92,246,0.15)',
                      color: session.status === 'active' ? '#10b981' : '#a78bfa'
                    }}>
                      {session.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleTerminateSession(session.id)} disabled={loading}
                      className="px-3 py-1.5 rounded text-xs font-semibold transition-all"
                      style={{ color: '#ef4444', background: 'rgba(239,68,68,0.15)' }}>
                      Terminate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>

      {/* Session Statistics */}
      <motion.div initial="hidden" animate="visible" transition={{ duration: 0.5, delay: 0.1 }} variants={fadeUp}
        className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Sessions', value: sessions.length, color: '#3b82f6' },
          { label: 'Active', value: sessions.filter(s => s.status === 'active').length, color: '#10b981' },
          { label: 'Idle', value: sessions.filter(s => s.status === 'idle').length, color: '#a78bfa' },
        ].map(stat => (
          <div key={stat.label} className="p-4 rounded-xl" style={{ background: `${stat.color}12`, border: `1px solid ${stat.color}20` }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, margin: 0 }}>{stat.label}</p>
            <p style={{ color: stat.color, fontSize: 24, fontWeight: 900, margin: '4px 0 0 0' }}>{stat.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Terminated Sessions History */}
      {history.length > 0 && (
        <motion.div initial="hidden" animate="visible" transition={{ duration: 0.5, delay: 0.2 }} variants={fadeUp}
          className="rounded-xl p-6" style={{ background: 'rgba(8,18,40,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: '0 0 12px 0' }}>Session Termination History</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {history.map(entry => (
              <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <div>
                  <p style={{ color: 'white', fontWeight: 600, margin: '0 0 2px 0', fontSize: 12 }}>{entry.action}</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: 0 }}>
                    {entry.admin} • {entry.device} • {entry.timestamp}
                  </p>
                </div>
                <CheckCircle size={16} style={{ color: '#ef4444' }} />
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}