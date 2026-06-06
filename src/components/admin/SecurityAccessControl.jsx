import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, AlertTriangle, Lock, Unlock } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

const ADMIN_ACCOUNTS = [
  { id: 'admin-001', name: 'Admin', email: 'admin@vicionpower.local', status: 'active', accessLevel: 'full' },
  { id: 'super-admin-001', name: 'Super Admin', email: 'superadmin@vicionpower.local', status: 'active', accessLevel: 'full' },
  { id: 'collab-001', name: 'Support Team', email: 'support@vicionpower.local', status: 'suspended', accessLevel: 'read-only' },
];

export default function SecurityAccessControl() {
  const [accounts, setAccounts] = useState(ADMIN_ACCOUNTS);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [action, setAction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [history, setHistory] = useState([]);

  const handleAction = (accountId, actionType) => {
    setSelectedAccount(accounts.find(a => a.id === accountId));
    setAction(actionType);
  };

  const executeAction = () => {
    if (!selectedAccount || !action) return;
    
    setLoading(true);
    
    setTimeout(() => {
      setAccounts(prev => prev.map(a => {
        if (a.id === selectedAccount.id) {
          if (action === 'activate') return { ...a, status: 'active' };
          if (action === 'suspend') return { ...a, status: 'suspended' };
          if (action === 'ban') return { ...a, status: 'banned' };
          if (action === 'restore') return { ...a, status: 'active' };
        }
        return a;
      }));

      const actionText = 
        action === 'activate' ? 'Access activated' :
        action === 'suspend' ? 'Temporary suspension applied' :
        action === 'ban' ? 'Permanent ban applied' :
        'Access restored';

      const entry = {
        id: Math.random().toString(36).slice(-8),
        account: selectedAccount.name,
        action: actionText,
        timestamp: new Date().toLocaleString()
      };
      
      setHistory(prev => [entry, ...prev]);
      setMessage({ type: 'success', text: `${actionText} for ${selectedAccount.name}` });
      setAction(null);
      setSelectedAccount(null);
      
      setTimeout(() => setMessage(null), 3500);
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Access Control Table */}
      <motion.div initial="hidden" animate="visible" transition={{ duration: 0.5 }} variants={fadeUp}
        className="rounded-xl p-6 overflow-hidden" style={{ background: 'rgba(8,18,40,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <h3 style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: '0 0 16px 0' }}>Access Control Management</h3>
        
        <table className="w-full text-sm">
          <thead style={{ background: 'rgba(0,0,0,0.35)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <tr>
              {['Name', 'Email', 'Status', 'Access Level', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {accounts.map(account => (
              <tr key={account.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td className="px-4 py-3"><p style={{ color: 'white', fontWeight: 600, margin: 0 }}>{account.name}</p></td>
                <td className="px-4 py-3"><p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: 11 }}>{account.email}</p></td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 rounded text-xs font-semibold" style={{
                    background: account.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    color: account.status === 'active' ? '#10b981' : '#ef4444'
                  }}>
                    {account.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 rounded text-xs" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>
                    {account.accessLevel}
                  </span>
                </td>
                <td className="px-4 py-3 flex items-center gap-2">
                  {account.status !== 'active' && (
                    <button onClick={() => handleAction(account.id, 'activate')}
                      className="px-3 py-1.5 rounded text-xs font-semibold transition-all hover:bg-white/10"
                      style={{ color: '#10b981', background: 'rgba(16,185,129,0.15)' }}>
                      Activate
                    </button>
                  )}
                  {account.status === 'active' && (
                    <button onClick={() => handleAction(account.id, 'suspend')}
                      className="px-3 py-1.5 rounded text-xs font-semibold transition-all hover:bg-white/10"
                      style={{ color: '#fb923c', background: 'rgba(251,146,60,0.15)' }}>
                      Suspend
                    </button>
                  )}
                  {account.status !== 'banned' && (
                    <button onClick={() => handleAction(account.id, 'ban')}
                      className="px-3 py-1.5 rounded text-xs font-semibold transition-all hover:bg-white/10"
                      style={{ color: '#ef4444', background: 'rgba(239,68,68,0.15)' }}>
                      Ban
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Confirmation Modal */}
      {action && selectedAccount && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} variants={fadeUp}
          className="rounded-xl p-6" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <div className="flex items-start gap-4">
            <Lock size={20} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
            <div className="flex-1">
              <h3 style={{ color: 'white', fontWeight: 700, margin: '0 0 8px 0' }}>
                {action === 'activate' ? 'Activate Access' : action === 'suspend' ? 'Suspend Access' : 'Permanent Ban'}
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: '0 0 12px 0' }}>
                Confirm action for <strong>{selectedAccount.name}</strong> ({selectedAccount.email})
              </p>
              <div className="flex gap-2">
                <button onClick={executeAction} disabled={loading}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
                  style={{ background: loading ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.2)', color: '#ef4444' }}>
                  {loading ? <Loader2 size={14} className="animate-spin" /> : ''}
                  {loading ? 'Processing...' : 'Confirm & Execute'}
                </button>
                <button onClick={() => { setAction(null); setSelectedAccount(null); }}
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
          <CheckCircle size={18} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
          <p style={{ color: '#10b981', fontSize: 13, margin: 0 }}>{message.text}</p>
        </motion.div>
      )}

      {/* Action History */}
      {history.length > 0 && (
        <motion.div initial="hidden" animate="visible" transition={{ duration: 0.5, delay: 0.2 }} variants={fadeUp}
          className="rounded-xl p-6" style={{ background: 'rgba(8,18,40,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: '0 0 12px 0' }}>Access Control History</h3>
          <div className="space-y-2">
            {history.map(entry => (
              <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <div>
                  <p style={{ color: 'white', fontWeight: 600, margin: '0 0 2px 0', fontSize: 13 }}>{entry.action}</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>{entry.account} • {entry.timestamp}</p>
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