import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

export default function SecurityCreateCredentials() {
  const [form, setForm] = useState({ name: '', email: '', role: 'collaborator' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [credentials, setCredentials] = useState([]);

  const roles = ['admin', 'collaborator', 'support_operator', 'finance_reviewer', 'leader_supervisor'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return;

    setLoading(true);
    setMessage(null);

    // Simulate backend processing
    setTimeout(() => {
      const tempPassword = Math.random().toString(36).slice(-12).toUpperCase();
      const newCred = {
        id: Math.random().toString(36).slice(-8),
        ...form,
        tempPassword,
        createdAt: new Date().toLocaleString(),
        status: 'created'
      };
      
      setCredentials(prev => [newCred, ...prev]);
      setMessage({ type: 'success', text: `Admin created successfully. Temporary password: ${tempPassword}` });
      setForm({ name: '', email: '', role: 'collaborator' });

      setTimeout(() => setMessage(null), 4000);
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Creation Form */}
      <motion.form onSubmit={handleSubmit} initial="hidden" animate="visible" transition={{ duration: 0.5 }} variants={fadeUp}
        className="rounded-xl p-6" style={{ background: 'rgba(8,18,40,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <h3 style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: '0 0 16px 0' }}>Create New Admin Credentials</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({...form, name: e.target.value})}
              placeholder="John Doe"
              disabled={loading}
              className="w-full px-3 py-2 rounded-lg text-white text-sm"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
            />
          </div>
          <div>
            <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({...form, email: e.target.value})}
              placeholder="user@vicionpower.local"
              disabled={loading}
              className="w-full px-3 py-2 rounded-lg text-white text-sm"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
            />
          </div>
          <div>
            <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({...form, role: e.target.value})}
              disabled={loading}
              className="w-full px-3 py-2 rounded-lg text-white text-sm"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              {roles.map(r => (
                <option key={r} value={r} style={{ background: '#0a1628', color: 'white' }}>
                  {r.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {message && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
            className="mb-4 flex items-start gap-3 p-3 rounded-lg" style={{ background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${message.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
            {message.type === 'success' ? (
              <CheckCircle size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
            ) : (
              <AlertTriangle size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
            )}
            <p style={{ color: message.type === 'success' ? '#10b981' : '#ef4444', fontSize: 12, margin: 0 }}>{message.text}</p>
          </motion.div>
        )}

        <button
          type="submit"
          disabled={loading || !form.name || !form.email}
          className="w-full py-2.5 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2"
          style={{ background: loading ? 'rgba(59,130,246,0.5)' : 'rgba(59,130,246,0.3)', color: 'white', opacity: (loading || !form.name || !form.email) ? 0.5 : 1 }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          {loading ? 'Creating...' : 'Create Admin Account'}
        </button>
      </motion.form>

      {/* Created Credentials List */}
      {credentials.length > 0 && (
        <motion.div initial="hidden" animate="visible" transition={{ duration: 0.5, delay: 0.2 }} variants={fadeUp}
          className="rounded-xl p-6 overflow-hidden" style={{ background: 'rgba(8,18,40,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: '0 0 16px 0' }}>Created Credentials</h3>
          
          <div className="space-y-3">
            {credentials.map(cred => (
              <motion.div key={cred.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                className="p-4 rounded-lg border" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p style={{ color: 'white', fontWeight: 600, margin: '0 0 4px 0' }}>{cred.name}</p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '0 0 6px 0' }}>{cred.email}</p>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded text-xs" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>{cred.role}</span>
                      <span className="px-2 py-0.5 rounded text-xs font-mono" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>Password: {cred.tempPassword}</span>
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>{cred.createdAt}</span>
                    </div>
                  </div>
                  <CheckCircle size={20} style={{ color: '#10b981' }} />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}