import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

const ROLES = ['admin', 'collaborator', 'support_operator', 'finance_reviewer', 'leader_supervisor'];

const ADMIN_ACCOUNTS = [
  { id: 'admin-001', name: 'Admin', email: 'admin@vicionpower.local', role: 'admin' },
  { id: 'super-admin-001', name: 'Super Admin', email: 'superadmin@vicionpower.local', role: 'admin' },
  { id: 'collab-001', name: 'Support Team', email: 'support@vicionpower.local', role: 'support_operator' },
];

export default function SecurityRoleControl() {
  const [accounts, setAccounts] = useState(ADMIN_ACCOUNTS);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [newRole, setNewRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const handleRoleChange = (accountId, roleType) => {
    setSelectedAccount(accounts.find(a => a.id === accountId));
    setNewRole(roleType);
  };

  const executeRoleChange = () => {
    if (!selectedAccount || !newRole) return;
    
    setLoading(true);
    
    setTimeout(() => {
      setAccounts(prev => prev.map(a => 
        a.id === selectedAccount.id ? { ...a, role: newRole } : a
      ));

      const entry = {
        id: Math.random().toString(36).slice(-8),
        account: selectedAccount.name,
        oldRole: selectedAccount.role,
        newRole: newRole,
        timestamp: new Date().toLocaleString()
      };
      
      setHistory(prev => [entry, ...prev]);
      setNewRole(null);
      setSelectedAccount(null);
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Role Assignment Table */}
      <motion.div initial="hidden" animate="visible" transition={{ duration: 0.5 }} variants={fadeUp}
        className="rounded-xl p-6 overflow-hidden" style={{ background: 'rgba(8,18,40,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <h3 style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: '0 0 16px 0' }}>Role Management</h3>
        
        <table className="w-full text-sm">
          <thead style={{ background: 'rgba(0,0,0,0.35)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <tr>
              {['Name', 'Email', 'Current Role', 'Assign New Role', 'Action'].map(h => (
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
                  <span className="px-2 py-1 rounded text-xs font-semibold" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>
                    {account.role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <select
                    onChange={(e) => handleRoleChange(account.id, e.target.value)}
                    className="px-2 py-1 rounded text-xs text-white"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
                  >
                    <option value="">Change to...</option>
                    {ROLES.map(r => (
                      <option key={r} value={r} style={{ background: '#0a1628', color: 'white' }}>
                        {r.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  {selectedAccount?.id === account.id && newRole && (
                    <button onClick={executeRoleChange} disabled={loading}
                      className="px-3 py-1.5 rounded text-xs font-semibold transition-all"
                      style={{ background: loading ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.2)', color: '#3b82f6' }}>
                      {loading ? 'Updating...' : 'Update'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Role Hierarchy Info */}
      <motion.div initial="hidden" animate="visible" transition={{ duration: 0.5, delay: 0.1 }} variants={fadeUp}
        className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { role: 'admin', desc: 'Full access to all modules and settings', perms: 'All permissions' },
          { role: 'collaborator', desc: 'Limited access to dashboard and reports', perms: 'Read & Write' },
          { role: 'support_operator', desc: 'Support ticket and user management', perms: 'Limited' },
          { role: 'finance_reviewer', desc: 'Financial data and transaction access', perms: 'Read Only' },
        ].map(role => (
          <motion.div key={role.role} initial="hidden" animate="visible" transition={{ duration: 0.4 }} variants={fadeUp}
            className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p style={{ color: 'white', fontWeight: 600, margin: '0 0 4px 0' }}>
              {role.role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '0 0 6px 0' }}>{role.desc}</p>
            <p style={{ color: '#3b82f6', fontSize: 11, fontWeight: 600, margin: 0 }}>{role.perms}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Role Change History */}
      {history.length > 0 && (
        <motion.div initial="hidden" animate="visible" transition={{ duration: 0.5, delay: 0.2 }} variants={fadeUp}
          className="rounded-xl p-6" style={{ background: 'rgba(8,18,40,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: '0 0 12px 0' }}>Role Change History</h3>
          <div className="space-y-2">
            {history.map(entry => (
              <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)' }}>
                <div>
                  <p style={{ color: 'white', fontWeight: 600, margin: '0 0 2px 0', fontSize: 13 }}>{entry.account}</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>
                    {entry.oldRole} → {entry.newRole} • {entry.timestamp}
                  </p>
                </div>
                <CheckCircle size={16} style={{ color: '#3b82f6' }} />
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}