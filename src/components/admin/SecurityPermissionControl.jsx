import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

const MODULES = [
  'Dashboard', 'CRM', 'Participants', 'Investments', 'Payments', 'Leaders', 
  'Analytics', 'Audit Log', 'Settings', 'Security', 'Reports', 'Marketing'
];

const PERMISSION_LEVELS = ['No Access', 'Read Only', 'Limited', 'Full Access'];

const INITIAL_PERMISSIONS = [
  { admin: 'Admin', email: 'admin@vicionpower.local', permissions: Object.fromEntries(MODULES.map(m => [m, 'Full Access'])) },
  { admin: 'Super Admin', email: 'superadmin@vicionpower.local', permissions: Object.fromEntries(MODULES.map(m => [m, 'Full Access'])) },
  { admin: 'Support Team', email: 'support@vicionpower.local', permissions: Object.fromEntries(MODULES.map(m => [m, m === 'Dashboard' || m === 'CRM' ? 'Limited' : 'No Access'])) },
];

export default function SecurityPermissionControl() {
  const [admins, setAdmins] = useState(INITIAL_PERMISSIONS);
  const [selectedAdmin, setSelectedAdmin] = useState(0);
  const [changes, setChanges] = useState({});
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const handlePermissionChange = (module, newLevel) => {
    setChanges(prev => ({
      ...prev,
      [module]: newLevel
    }));
  };

  const applyChanges = () => {
    if (Object.keys(changes).length === 0) return;
    
    setLoading(true);
    
    setTimeout(() => {
      setAdmins(prev => {
        const updated = [...prev];
        updated[selectedAdmin] = {
          ...updated[selectedAdmin],
          permissions: {
            ...updated[selectedAdmin].permissions,
            ...changes
          }
        };
        return updated;
      });

      Object.entries(changes).forEach(([module, level]) => {
        setHistory(prev => [{
          id: Math.random().toString(36).slice(-8),
          admin: admins[selectedAdmin].admin,
          module: module,
          newLevel: level,
          timestamp: new Date().toLocaleString()
        }, ...prev]);
      });

      setChanges({});
      setLoading(false);
    }, 1200);
  };

  const currentAdmin = admins[selectedAdmin];
  const currentPermissions = currentAdmin.permissions;

  return (
    <div className="space-y-6">
      {/* Admin Selector */}
      <motion.div initial="hidden" animate="visible" transition={{ duration: 0.5 }} variants={fadeUp}
        className="rounded-xl p-4" style={{ background: 'rgba(8,18,40,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex gap-2 flex-wrap">
          {admins.map((admin, idx) => (
            <button key={idx} onClick={() => { setSelectedAdmin(idx); setChanges({}); }}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: selectedAdmin === idx ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.08)',
                color: selectedAdmin === idx ? '#3b82f6' : 'rgba(255,255,255,0.6)',
                border: selectedAdmin === idx ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(255,255,255,0.1)'
              }}>
              {admin.admin}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Permissions Grid */}
      <motion.div initial="hidden" animate="visible" transition={{ duration: 0.5, delay: 0.1 }} variants={fadeUp}
        className="rounded-xl p-6" style={{ background: 'rgba(8,18,40,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <h3 style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: '0 0 16px 0' }}>
          Module Access Permissions - {currentAdmin.admin}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {MODULES.map(module => {
            const currentLevel = changes[module] || currentPermissions[module];
            const levelColor = 
              currentLevel === 'Full Access' ? '#10b981' :
              currentLevel === 'Limited' ? '#fb923c' :
              currentLevel === 'Read Only' ? '#3b82f6' :
              '#6b7280';
            
            return (
              <div key={module} className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p style={{ color: 'white', fontWeight: 600, margin: '0 0 8px 0', fontSize: 13 }}>{module}</p>
                <select
                  value={currentLevel}
                  onChange={(e) => handlePermissionChange(module, e.target.value)}
                  className="w-full px-2 py-1.5 rounded text-xs"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }}
                >
                  {PERMISSION_LEVELS.map(level => (
                    <option key={level} value={level} style={{ background: '#0a1628', color: 'white' }}>
                      {level}
                    </option>
                  ))}
                </select>
                <p style={{ color: levelColor, fontSize: 10, margin: '4px 0 0 0', fontWeight: 600 }}>{currentLevel}</p>
              </div>
            );
          })}
        </div>

        {Object.keys(changes).length > 0 && (
          <div className="flex gap-2">
            <button onClick={applyChanges} disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
              style={{ background: loading ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.2)', color: '#3b82f6' }}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              {loading ? 'Applying...' : `Apply ${Object.keys(changes).length} Change${Object.keys(changes).length > 1 ? 's' : ''}`}
            </button>
            <button onClick={() => setChanges({})}
              className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
              Discard
            </button>
          </div>
        )}
      </motion.div>

      {/* Permission Summary */}
      <motion.div initial="hidden" animate="visible" transition={{ duration: 0.5, delay: 0.2 }} variants={fadeUp}
        className="grid grid-cols-4 gap-4">
        {[
          { label: 'Full Access', count: Object.values(currentPermissions).filter(p => p === 'Full Access').length, color: '#10b981' },
          { label: 'Limited', count: Object.values(currentPermissions).filter(p => p === 'Limited').length, color: '#fb923c' },
          { label: 'Read Only', count: Object.values(currentPermissions).filter(p => p === 'Read Only').length, color: '#3b82f6' },
          { label: 'No Access', count: Object.values(currentPermissions).filter(p => p === 'No Access').length, color: '#6b7280' },
        ].map(stat => (
          <div key={stat.label} className="p-3 rounded-lg" style={{ background: `${stat.color}12`, border: `1px solid ${stat.color}20` }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 600, margin: 0 }}>{stat.label}</p>
            <p style={{ color: stat.color, fontSize: 20, fontWeight: 900, margin: '4px 0 0 0' }}>{stat.count}</p>
          </div>
        ))}
      </motion.div>

      {/* Change History */}
      {history.length > 0 && (
        <motion.div initial="hidden" animate="visible" transition={{ duration: 0.5, delay: 0.3 }} variants={fadeUp}
          className="rounded-xl p-6" style={{ background: 'rgba(8,18,40,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: '0 0 12px 0' }}>Permission Change History</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {history.slice(0, 10).map(entry => (
              <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)' }}>
                <div>
                  <p style={{ color: 'white', fontWeight: 600, margin: '0 0 2px 0', fontSize: 12 }}>{entry.module}</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: 0 }}>{entry.admin} • {entry.timestamp}</p>
                </div>
                <span style={{ color: '#3b82f6', fontSize: 10, fontWeight: 600 }}>{entry.newLevel}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}