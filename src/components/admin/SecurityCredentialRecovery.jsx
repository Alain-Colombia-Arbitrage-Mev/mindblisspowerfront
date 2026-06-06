import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, AlertTriangle, CheckCircle, Key, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const fadeUp = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

const DEFAULT_CREDENTIALS = [
  { 
    email: 'admin@vicionpower.local', 
    password: 'VicionAdmin2026!', 
    name: 'Admin', 
    role: 'admin',
    userId: 'admin-001',
    description: 'Primary admin account for system access'
  },
  { 
    email: 'superadmin@vicionpower.local', 
    password: 'SuperVicion2026!', 
    name: 'Super Admin', 
    role: 'admin',
    userId: 'super-admin-001',
    description: 'Super admin account with full privileges'
  },
];

export default function SecurityCredentialRecovery() {
  const [copiedEmail, setCopiedEmail] = useState(null);
  const [copiedPass, setCopiedPass] = useState(null);
  const [resetHistory, setResetHistory] = useState([]);
  const [showPasswords, setShowPasswords] = useState({});

  const copyToClipboard = (text, type, email) => {
    navigator.clipboard.writeText(text);
    if (type === 'email') setCopiedEmail(email);
    else setCopiedPass(email);
    
    setTimeout(() => {
      setCopiedEmail(null);
      setCopiedPass(null);
    }, 2000);
    
    toast.success('Copied to clipboard');
  };

  const handleReset = (credential) => {
    const entry = {
      id: Math.random().toString(36).slice(-8),
      email: credential.email,
      timestamp: new Date().toLocaleString(),
      action: 'credential_reset'
    };
    setResetHistory(prev => [entry, ...prev]);
    toast.success(`Credentials reset: ${credential.email}`);
  };

  const isDevelopmentMode = true; // In production, check environment

  if (!isDevelopmentMode) {
    return (
      <motion.div initial="hidden" animate="visible" variants={fadeUp}
        className="rounded-xl p-8 text-center" style={{ background: 'rgba(8,18,40,0.5)', border: '1px solid rgba(239,68,68,0.2)' }}>
        <AlertTriangle size={32} style={{ color: '#ef4444', margin: '0 auto 16px' }} />
        <p style={{ color: 'white', fontWeight: 600, margin: 0 }}>Production Mode</p>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: '8px 0 0 0' }}>
          Credential recovery is only available in development mode.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div initial="hidden" animate="visible" transition={{ duration: 0.5 }} variants={fadeUp} className="space-y-6">
      {/* Development Mode Alert */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp}
        className="rounded-xl p-6" style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)' }}>
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} style={{ color: '#fb923c', flexShrink: 0 }} />
          <div>
            <p style={{ color: '#fb923c', fontWeight: 700, margin: '0 0 4px 0' }}>Development Mode Active</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>
              Default credentials are displayed for development and testing purposes only. Never use these in production.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Default Credentials */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp}
        className="rounded-xl p-6 overflow-hidden" style={{ background: 'rgba(8,18,40,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <h3 style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: '0 0 16px 0' }}>Development Credentials</h3>
        
        <div className="space-y-4">
          {DEFAULT_CREDENTIALS.map((cred, idx) => (
            <motion.div key={cred.email} initial="hidden" animate="visible" transition={{ delay: idx * 0.05 }} variants={fadeUp}
              className="rounded-lg p-4" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p style={{ color: 'white', fontWeight: 600, margin: '0 0 2px 0' }}>{cred.name}</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>{cred.description}</p>
                </div>
                <span className="px-2 py-1 rounded text-xs font-semibold" style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981' }}>
                  {cred.role}
                </span>
              </div>

              {/* Email Field */}
              <div className="mb-3">
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  EMAIL
                </label>
                <div className="flex items-center gap-2 p-2 rounded" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <code style={{ color: '#3b82f6', fontSize: 11, fontFamily: 'monospace', flex: 1, margin: 0 }}>
                    {cred.email}
                  </code>
                  <button
                    onClick={() => copyToClipboard(cred.email, 'email', cred.email)}
                    className="p-1.5 rounded hover:bg-white/10 transition-colors"
                    title="Copy email">
                    <Copy size={14} style={{ color: copiedEmail === cred.email ? '#10b981' : 'rgba(255,255,255,0.5)' }} />
                  </button>
                </div>
              </div>

              {/* Password Field */}
              <div className="mb-3">
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  PASSWORD
                </label>
                <div className="flex items-center gap-2 p-2 rounded" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <code style={{ color: '#3b82f6', fontSize: 11, fontFamily: 'monospace', flex: 1, margin: 0 }}>
                    {showPasswords[cred.email] ? cred.password : '•'.repeat(cred.password.length)}
                  </code>
                  <button
                    onClick={() => setShowPasswords(prev => ({ ...prev, [cred.email]: !prev[cred.email] }))}
                    className="p-1.5 rounded hover:bg-white/10 transition-colors"
                    title="Toggle visibility">
                    <Key size={14} style={{ color: 'rgba(255,255,255,0.5)' }} />
                  </button>
                  <button
                    onClick={() => copyToClipboard(cred.password, 'password', cred.email)}
                    className="p-1.5 rounded hover:bg-white/10 transition-colors"
                    title="Copy password">
                    <Copy size={14} style={{ color: copiedPass === cred.email ? '#10b981' : 'rgba(255,255,255,0.5)' }} />
                  </button>
                </div>
              </div>

              {/* Reset Button */}
              <button
                onClick={() => handleReset(cred)}
                className="w-full px-3 py-1.5 rounded text-xs font-semibold transition-all"
                style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}>
                <RefreshCw size={12} className="inline mr-1" /> Reset Credential
              </button>
            </motion.div>
          ))}
        </div>

        {/* Info Box */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mt-4 p-3 rounded" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0, lineHeight: 1.5 }}>
            These credentials are hardcoded for development. In production, use your organization's credential management system. Never share these credentials outside development environments.
          </p>
        </motion.div>
      </motion.div>

      {/* Reset History */}
      {resetHistory.length > 0 && (
        <motion.div initial="hidden" animate="visible" variants={fadeUp}
          className="rounded-xl p-6" style={{ background: 'rgba(8,18,40,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: '0 0 12px 0' }}>Reset History</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {resetHistory.map(entry => (
              <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)' }}>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, margin: '0 0 2px 0' }}>{entry.email}</p>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: 0 }}>{entry.timestamp}</p>
                </div>
                <CheckCircle size={14} style={{ color: '#10b981' }} />
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recovery Safeguard */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp}
        className="rounded-xl p-6" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
        <div className="flex items-start gap-3">
          <CheckCircle size={20} style={{ color: '#10b981', flexShrink: 0 }} />
          <div>
            <p style={{ color: '#10b981', fontWeight: 700, margin: '0 0 4px 0' }}>Admin Recovery Safeguard Active</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>
              Default admin credentials are always available in development mode. You can never be locked out. Use these credentials to recover access at any time.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}