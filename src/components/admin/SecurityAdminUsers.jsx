import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

const ADMIN_ACCOUNTS = [
  { id: 'admin-001', name: 'Admin', email: 'admin@vicionpower.local', role: 'admin', status: 'active', lastAccess: '2 mins ago', activeSessions: 2, credentialStatus: 'valid' },
  { id: 'super-admin-001', name: 'Super Admin', email: 'superadmin@vicionpower.local', role: 'admin', status: 'active', lastAccess: '5 mins ago', activeSessions: 1, credentialStatus: 'valid' },
  { id: 'collab-001', name: 'Support Team', email: 'support@vicionpower.local', role: 'support_operator', status: 'suspended', lastAccess: '1 day ago', activeSessions: 0, credentialStatus: 'expired' },
  { id: 'finance-001', name: 'Finance Reviewer', email: 'finance@vicionpower.local', role: 'finance_reviewer', status: 'active', lastAccess: '1 hour ago', activeSessions: 1, credentialStatus: 'valid' },
];

export default function SecurityAdminUsers() {
  const [accounts] = useState(ADMIN_ACCOUNTS);

  return (
    <motion.div initial="hidden" animate="visible" transition={{ duration: 0.5 }} variants={fadeUp}
      className="rounded-xl overflow-hidden" style={{ background: 'rgba(8,18,40,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="p-6">
        <h3 style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: '0 0 16px 0' }}>Admin Accounts Overview</h3>
        
        <table className="w-full text-sm">
          <thead style={{ background: 'rgba(0,0,0,0.35)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <tr>
              {['Name', 'Email', 'Role', 'Status', 'Last Access', 'Sessions', 'Credential Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {accounts.map((account, idx) => (
              <motion.tr key={account.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.05 }}
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td className="px-4 py-3"><p style={{ color: 'white', fontWeight: 600, margin: 0 }}>{account.name}</p></td>
                <td className="px-4 py-3"><p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: 11 }}>{account.email}</p></td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 rounded text-xs font-semibold" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>
                    {account.role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: account.status === 'active' ? '#10b981' : '#ef4444' }} />
                    <span style={{ color: account.status === 'active' ? '#10b981' : '#ef4444', fontSize: 11, fontWeight: 600 }}>
                      {account.status}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3"><p style={{ color: 'rgba(255,255,255,0.4)', margin: 0, fontSize: 11 }}>{account.lastAccess}</p></td>
                <td className="px-4 py-3">
                  <p style={{ color: account.activeSessions > 0 ? '#10b981' : 'rgba(255,255,255,0.4)', fontWeight: 600, margin: 0, fontSize: 12 }}>
                    {account.activeSessions}
                  </p>
                </td>
                <td className="px-4 py-3 flex items-center gap-1.5">
                  {account.credentialStatus === 'valid' ? (
                    <>
                      <CheckCircle size={14} style={{ color: '#10b981' }} />
                      <span style={{ color: '#10b981', fontSize: 11, fontWeight: 600 }}>Valid</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={14} style={{ color: '#ef4444' }} />
                      <span style={{ color: '#ef4444', fontSize: 11, fontWeight: 600 }}>Expired</span>
                    </>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-0" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        {[
          { label: 'Total Admins', value: accounts.length, color: '#3b82f6' },
          { label: 'Active', value: accounts.filter(a => a.status === 'active').length, color: '#10b981' },
          { label: 'Sessions', value: accounts.reduce((sum, a) => sum + a.activeSessions, 0), color: '#a78bfa' },
          { label: 'Expired Creds', value: accounts.filter(a => a.credentialStatus === 'expired').length, color: '#ef4444' },
        ].map((stat, i) => (
          <div key={i} className="p-4 flex flex-col items-center justify-center" style={{
            background: 'rgba(0,0,0,0.1)',
            borderRight: i < 3 ? '1px solid rgba(255,255,255,0.07)' : 'none'
          }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 600, margin: 0 }}>{stat.label}</p>
            <p style={{ color: stat.color, fontSize: 18, fontWeight: 900, margin: '4px 0 0 0' }}>{stat.value}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}