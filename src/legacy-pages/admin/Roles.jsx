import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Shield, Check, X, ChevronDown, ChevronUp, Eye, Lock } from 'lucide-react';

const PERMISSION_GROUPS = {
  'Users & CRM': ['view_users', 'edit_users', 'block_users', 'delete_users', 'export_users', 'view_kyc', 'edit_kyc'],
  'Participants': ['view_participants', 'edit_participants', 'block_participants', 'reassign_participants', 'annotate_participants'],
  'Investments': ['view_investments', 'approve_investments', 'reject_investments', 'reverse_investments', 'compliance_hold'],
  'Payments': ['view_payments', 'verify_payments', 'reject_payments', 'flag_payments', 'reverse_payments', 'aml_review'],
  'Leaders': ['view_leaders', 'certify_leaders', 'suspend_leaders', 'supervise_leaders', 'edit_leader_notes'],
  'Support': ['view_cases', 'manage_cases', 'close_cases', 'escalate_cases', 'assign_cases'],
  'Audit': ['view_audit_logs', 'export_audit_logs', 'view_sensitive_logs'],
  'Growth & Marketing': ['view_growth_lab', 'manage_campaigns', 'manage_experiments', 'access_command_center'],
  'System': ['view_settings', 'edit_settings', 'manage_roles', 'access_platform_control', 'system_override'],
};

const INITIAL_ROLES = [
  { id: 1, name: 'Super Admin', description: 'Full platform access — all permissions, no restrictions.', color: '#ef4444', users: 2, active: true,
    permissions: Object.values(PERMISSION_GROUPS).flat() },
  { id: 2, name: 'Operations Admin', description: 'Full operational access — users, payments, leaders, investments.', color: '#3b82f6', users: 4, active: true,
    permissions: ['view_users','edit_users','block_users','view_kyc','edit_kyc','view_participants','edit_participants','block_participants','reassign_participants','annotate_participants','view_investments','approve_investments','reject_investments','reverse_investments','compliance_hold','view_payments','verify_payments','reject_payments','flag_payments','reverse_payments','aml_review','view_leaders','certify_leaders','suspend_leaders','supervise_leaders','view_cases','manage_cases','close_cases','escalate_cases','assign_cases','view_audit_logs','view_growth_lab','view_settings'] },
  { id: 3, name: 'Finance Reviewer', description: 'Payment and investment oversight with AML review capabilities.', color: '#10b981', users: 3, active: true,
    permissions: ['view_payments','verify_payments','reject_payments','flag_payments','aml_review','view_investments','approve_investments','reject_investments','compliance_hold','view_participants','view_users','view_audit_logs'] },
  { id: 4, name: 'Leader Supervisor', description: 'Oversees leader network, compliance, and certifications.', color: '#8b5cf6', users: 5, active: true,
    permissions: ['view_leaders','certify_leaders','suspend_leaders','supervise_leaders','edit_leader_notes','view_participants','annotate_participants','view_users','view_audit_logs'] },
  { id: 5, name: 'Support Agent', description: 'Customer support case management. Read-only CRM access.', color: '#06b6d4', users: 9, active: true,
    permissions: ['view_cases','manage_cases','close_cases','assign_cases','view_participants','view_users','view_payments','view_investments'] },
  { id: 6, name: 'Compliance Officer', description: 'AML, KYC, and audit access. No write access to financials.', color: '#fb923c', users: 2, active: true,
    permissions: ['view_kyc','edit_kyc','view_payments','flag_payments','aml_review','view_audit_logs','export_audit_logs','view_sensitive_logs','view_users','view_participants','view_investments','view_leaders'] },
  { id: 7, name: 'Marketing Operator', description: 'Growth lab and campaign access. No financial data.', color: '#a855f7', users: 6, active: true,
    permissions: ['view_growth_lab','manage_campaigns','manage_experiments','access_command_center','view_users'] },
  { id: 8, name: 'Read-Only Auditor', description: 'Read-only access to all modules for auditing purposes.', color: '#6b7280', users: 1, active: true,
    permissions: ['view_users','view_participants','view_investments','view_payments','view_leaders','view_cases','view_audit_logs','export_audit_logs','view_settings','view_growth_lab'] },
];

const PermToggle = ({ checked, onChange, disabled }) => (
  <button onClick={onChange} disabled={disabled}
    className="w-5 h-5 rounded flex items-center justify-center transition-all"
    style={{ background: checked ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${checked ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.1)'}`, cursor: disabled ? 'not-allowed' : 'pointer' }}>
    {checked && <Check size={11} style={{ color: '#10b981' }} />}
  </button>
);

export default function Roles() {
  const [roles, setRoles] = useState(INITIAL_ROLES);
  const [selected, setSelected] = useState(null);
  const [editPerms, setEditPerms] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [expandedGroups, setExpandedGroups] = useState({});

  const togglePerm = (roleId, perm) => {
    setRoles(r => r.map(role => {
      if (role.id !== roleId) return role;
      const has = role.permissions.includes(perm);
      return { ...role, permissions: has ? role.permissions.filter(p => p !== perm) : [...role.permissions, perm] };
    }));
    if (selected?.id === roleId) {
      setSelected(prev => {
        const has = prev.permissions.includes(perm);
        return { ...prev, permissions: has ? prev.permissions.filter(p => p !== perm) : [...prev.permissions, perm] };
      });
    }
  };

  const toggleGroup = (roleId, group) => {
    const allPerms = PERMISSION_GROUPS[group];
    const role = roles.find(r => r.id === roleId);
    const allHas = allPerms.every(p => role.permissions.includes(p));
    setRoles(r => r.map(ro => {
      if (ro.id !== roleId) return ro;
      const newPerms = allHas
        ? ro.permissions.filter(p => !allPerms.includes(p))
        : [...new Set([...ro.permissions, ...allPerms])];
      return { ...ro, permissions: newPerms };
    }));
    if (selected?.id === roleId) {
      const newPerms = allHas
        ? selected.permissions.filter(p => !allPerms.includes(p))
        : [...new Set([...selected.permissions, ...allPerms])];
      setSelected(prev => ({ ...prev, permissions: newPerms }));
    }
  };

  const createRole = () => {
    if (!newName.trim()) return;
    const newRole = { id: Date.now(), name: newName, description: newDesc, color: '#3b82f6', users: 0, active: true, permissions: [] };
    setRoles(r => [...r, newRole]);
    setNewName(''); setNewDesc(''); setShowNew(false);
  };

  const deleteRole = (id) => {
    if (id === 1) return; // Protect Super Admin
    setRoles(r => r.filter(ro => ro.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between">
        <div>
          <p style={{ color: '#ef4444', fontSize: 10, fontWeight: 700, letterSpacing: 3, margin: '0 0 6px 0' }}>ROLES · ACCESS CONTROL</p>
          <h1 style={{ color: 'white', fontSize: 28, fontWeight: 900, margin: '0 0 4px 0' }}>Role & Permission Management</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>Create · Edit · Assign · Audit granular permissions across all operational modules</p>
        </div>
        <button onClick={() => setShowNew(!showNew)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm text-white"
          style={{ background: 'linear-gradient(135deg, #1d6ef5, #3b82f6)', boxShadow: '0 4px 16px rgba(59,130,246,0.3)' }}>
          <Plus size={15} /> New Role
        </button>
      </motion.div>

      {/* New Role Form */}
      <AnimatePresence>
        {showNew && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="p-5 rounded-xl" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}>
            <p style={{ color: '#3b82f6', fontSize: 11, fontWeight: 700, letterSpacing: 2, margin: '0 0 12px 0' }}>CREATE NEW ROLE</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Role name..."
                className="px-3 py-2.5 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }} />
              <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Role description..."
                className="px-3 py-2.5 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }} />
            </div>
            <div className="flex gap-2">
              <button onClick={createRole} className="px-4 py-2 rounded-lg text-xs font-bold" style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>Create Role</button>
              <button onClick={() => setShowNew(false)} className="px-4 py-2 rounded-lg text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-5">
        {/* Roles List */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex-1 min-w-0 space-y-3">
          {roles.map((role, i) => {
            const isSelected = selected?.id === role.id;
            return (
              <div key={i} onClick={() => { setSelected(role); setEditPerms(false); }}
                className="p-4 rounded-xl cursor-pointer transition-all"
                style={{ background: isSelected ? `${role.color}10` : 'rgba(13,31,60,0.5)', border: `1px solid ${isSelected ? role.color + '35' : 'rgba(255,255,255,0.07)'}` }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${role.color}20`, border: `1px solid ${role.color}35` }}>
                      <Shield size={15} style={{ color: role.color }} />
                    </div>
                    <div className="min-w-0">
                      <p style={{ color: 'white', fontWeight: 700, margin: '0 0 2px 0' }}>{role.name}</p>
                      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, margin: 0 }}>{role.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <div className="text-right">
                      <p style={{ color: role.color, fontSize: 14, fontWeight: 800, margin: 0 }}>{role.permissions.length}</p>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, margin: 0 }}>permissions</p>
                    </div>
                    <div className="text-right">
                      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 700, margin: 0 }}>{role.users}</p>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, margin: 0 }}>users</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={e => { e.stopPropagation(); setSelected(role); setEditPerms(true); }} className="p-1.5 rounded hover:bg-white/10 transition-all" style={{ color: '#3b82f6' }}><Edit2 size={13} /></button>
                      {role.id !== 1 && (
                        <button onClick={e => { e.stopPropagation(); deleteRole(role.id); }} className="p-1.5 rounded hover:bg-white/10 transition-all" style={{ color: '#ef4444' }}><Trash2 size={13} /></button>
                      )}
                      {role.id === 1 && <div className="p-1.5" style={{ color: 'rgba(255,255,255,0.2)' }}><Lock size={13} /></div>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Permission Editor */}
        <AnimatePresence>
          {selected && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="w-80 flex-shrink-0 rounded-xl overflow-y-auto"
              style={{ border: `1px solid ${selected.color}35`, background: 'rgba(9,21,42,0.95)', maxHeight: 680 }}>
              <div className="p-4 border-b border-white/8 sticky top-0 flex items-center justify-between" style={{ background: 'rgba(9,21,42,0.98)' }}>
                <div>
                  <p style={{ color: selected.color, fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: 0 }}>ROLE PERMISSIONS</p>
                  <p style={{ color: 'white', fontSize: 13, fontWeight: 700, margin: '2px 0 0 0' }}>{selected.name}</p>
                </div>
                <div className="flex gap-2 items-center">
                  <button onClick={() => setEditPerms(!editPerms)} className="px-2.5 py-1.5 rounded text-xs font-bold transition-all"
                    style={{ background: editPerms ? `${selected.color}25` : 'rgba(255,255,255,0.06)', color: editPerms ? selected.color : 'rgba(255,255,255,0.5)', border: `1px solid ${editPerms ? selected.color + '40' : 'rgba(255,255,255,0.1)'}` }}>
                    {editPerms ? 'Editing' : 'Edit'}
                  </button>
                  <button onClick={() => setSelected(null)} style={{ color: 'rgba(255,255,255,0.4)' }}><X size={15} /></button>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: 0 }}>{selected.permissions.length} of {Object.values(PERMISSION_GROUPS).flat().length} permissions active</p>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: 0 }}>{selected.users} users assigned</p>
                </div>
                {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => {
                  const activeCount = perms.filter(p => selected.permissions.includes(p)).length;
                  const allActive = activeCount === perms.length;
                  const expanded = expandedGroups[group];
                  return (
                    <div key={group} className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div className="px-3 py-2.5 flex items-center justify-between cursor-pointer hover:bg-white/5"
                        style={{ background: 'rgba(0,0,0,0.25)' }}
                        onClick={() => setExpandedGroups(g => ({ ...g, [group]: !g[group] }))}>
                        <div className="flex items-center gap-2">
                          {editPerms && selected.id !== 1 && (
                            <button onClick={e => { e.stopPropagation(); toggleGroup(selected.id, group); }}
                              className="w-4 h-4 rounded flex items-center justify-center"
                              style={{ background: allActive ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)', border: `1px solid ${allActive ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.15)'}` }}>
                              {allActive && <Check size={9} style={{ color: '#10b981' }} />}
                            </button>
                          )}
                          <span style={{ color: 'white', fontSize: 12, fontWeight: 600 }}>{group}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span style={{ color: activeCount > 0 ? selected.color : 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700 }}>{activeCount}/{perms.length}</span>
                          {expanded ? <ChevronUp size={12} style={{ color: 'rgba(255,255,255,0.4)' }} /> : <ChevronDown size={12} style={{ color: 'rgba(255,255,255,0.4)' }} />}
                        </div>
                      </div>
                      {expanded && (
                        <div className="p-2 space-y-1">
                          {perms.map(perm => {
                            const has = selected.permissions.includes(perm);
                            return (
                              <div key={perm} className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-white/5">
                                <span style={{ color: has ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.35)', fontSize: 11 }}>
                                  {perm.replace(/_/g, ' ')}
                                </span>
                                <PermToggle checked={has} onChange={() => editPerms && selected.id !== 1 && togglePerm(selected.id, perm)} disabled={!editPerms || selected.id === 1} />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}