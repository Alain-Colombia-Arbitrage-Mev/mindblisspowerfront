import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, AlertTriangle, Lock } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

const ADMIN_ACCOUNTS = [
  { id: 'admin-001', name: 'Admin', email: 'admin@vicionpower.local', lastPasswordChange: '30 days ago', status: 'active' },
  { id: 'super-admin-001', name: 'Super Admin', email: 'superadmin@vicionpower.local', lastPasswordChange: '15 days ago', status: 'active' },
  { id: 'collab-001', name: 'Support Team', email: 'support@vicionpower.local', lastPasswordChange: '5 days ago', status: 'active' },
];

export default function SecurityPasswordManagement() {
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [action, setAction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [history, setHistory] = useState([]);

  const handleAction = (adminId, actionType) => {
    setSelectedAdmin(ADMIN_ACCOUNTS.find(a => a.id === adminId));
    setAction(actionType);
    setLoading(false);
  };

  const executeAction = () => {
    if (!selectedAdmin || !action) return;
    
    setLoading(true);
    const tempPassword = Math.random().toString(36).slice(-12).toUpperCase();
    
    setTimeout(() => {
      const actionText = 
        action === 'reset' ? 'Password reset' :
        action === 'temp' ? 'Temporary password assigned' :
        'Force password change scheduled';
      
      const entry = {
        id: Math.random().toString(36).slice(-8),
        admin: selectedAdmin.name,
        email: selectedAdmin.email,
        action: actionText,
        result: action === 'temp' ? `Temp: ${tempPassword}` : 'Scheduled',
        timestamp: new Date().toLocaleString()
      };
      
      setHistory(prev => [entry, ...prev]);
      setMessage({ type: 'success', text: `${actionText} for ${selectedAdmin.name}` });
      setAction(null);
      setSelectedAdmin(null);
      
      setTimeout(() => setMessage(null), 3500);
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Accounts Table */}
      <motion.div initial="hidden" animate="visible" transition={{ duration: 0.5 }} variants={fadeUp}
        className="rounded-xl p-6 overflow-hidden" style={{ background: 'rgba(8,18,40,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <h3 style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: '0 0 16px 0' }}>Admin Password Management</h3>
        
        <table className="w-full text-sm">
          <thead style={{ background: 'rgba(0,0,0,0.35)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <tr>
              {['Name', 'Email', 'Last Changed', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ADMIN_ACCOUNTS.map(admin => (
              <tr key={admin.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td className="px-4 py-3"><p style={{ color: 'white', fontWeight: 600, margin: 0 }}>{admin.name}</p></td>
                <td className="px-4 py-3"><p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: 11 }}>{admin.email}</p></td>
                <td className="px-4 py-3"><p style={{ color: 'rgba(255,255,255,0.4)', margin: 0, fontSize: 11 }}>{admin.lastPasswordChange}</p></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#10b981' }} />
                    <span style={{ color: '#10b981', fontSize: 11, fontWeight: 600 }}>Valid</span>
                  </div>
                </td>
                <td className="px-4 py-3 flex items-center gap-2">
                  <button onClick={() => handleAction(admin.id, 'reset')}
                    className="px-3 py-1.5 rounded text-xs font-semibold transition-all hover:bg-white/10"
                    style={{ color: '#3b82f6', background: 'rgba(59,130,246,0.15)' }}>
                    Reset
                  </button>
                  <button onClick={() => handleAction(admin.id, 'temp')}
                    className="px-3 py-1.5 rounded text-xs font-semibold transition-all hover:bg-white/10"
                    style={{ color: '#fb923c', background: 'rgba(251,146,60,0.15)' }}>
                    Temp Password
                  </button>
                  <button onClick={() => handleAction(admin.id, 'force')}
                    className="px-3 py-1.5 rounded text-xs font-semibold transition-all hover:bg-white/10"
                    style={{ color: '#ef4444', background: 'rgba(239,68,68,0.15)' }}>
                    Force Change
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Action Modal */}
      {action && selectedAdmin && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} variants={fadeUp}
          className="rounded-xl p-6" style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)' }}>
          <div className="flex items-start gap-4">
            <Lock size={20} style={{ color: '#fb923c', flexShrink: 0, marginTop: 2 }} />
            <div className="flex-1">
              <h3 style={{ color: 'white', fontWeight: 700, margin: '0 0 8px 0' }}>
                {action === 'reset' ? 'Reset Password' : action === 'temp' ? 'Assign Temporary Password' : 'Force Password Change'}
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: '0 0 12px 0' }}>
                This action will affect <strong>{selectedAdmin.name}</strong> ({selectedAdmin.email})
              </p>
              <div className="flex gap-2">
                <button onClick={executeAction} disabled={loading}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
                  style={{ background: loading ? 'rgba(251,146,60,0.3)' : 'rgba(251,146,60,0.2)', color: '#fb923c' }}>
                  {loading ? <Loader2 size={14} className="animate-spin" /> : ''}
                  {loading ? 'Processing...' : 'Confirm & Execute'}
                </button>
                <button onClick={() => { setAction(null); setSelectedAdmin(null); }}
                  className="px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Message Alert */}
      {message && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          className="flex items-start gap-3 p-4 rounded-lg" style={{ background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${message.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
          {message.type === 'success' ? (
            <CheckCircle size={18} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
          ) : (
            <AlertTriangle size={18} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
          )}
          <p style={{ color: message.type === 'success' ? '#10b981' : '#ef4444', fontSize: 13, margin: 0 }}>{message.text}</p>
        </motion.div>
      )}

      {/* Action History */}
      {history.length > 0 && (
        <motion.div initial="hidden" animate="visible" transition={{ duration: 0.5, delay: 0.2 }} variants={fadeUp}
          className="rounded-xl p-6" style={{ background: 'rgba(8,18,40,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: '0 0 12px 0' }}>Action History</h3>
          <div className="space-y-2">
            {history.map(entry => (
              <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
                <div>
                  <p style={{ color: 'white', fontWeight: 600, margin: '0 0 2px 0', fontSize: 13 }}>{entry.action}</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>{entry.name} • {entry.timestamp}</p>
                </div>
                <span style={{ color: '#10b981', fontSize: 11, fontWeight: 600 }}>{entry.result}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}