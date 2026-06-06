import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Lock, Key, Shield, UserCheck, Clock, AlertTriangle, Zap, RotateCcw } from 'lucide-react';
import SecurityAdminUsers from '@/components/admin/SecurityAdminUsers';
import SecurityCreateCredentials from '@/components/admin/SecurityCreateCredentials';
import SecurityPasswordManagement from '@/components/admin/SecurityPasswordManagement';
import SecurityAccessControl from '@/components/admin/SecurityAccessControl';
import SecurityRoleControl from '@/components/admin/SecurityRoleControl';
import SecurityPermissionControl from '@/components/admin/SecurityPermissionControl';
import SecuritySessionControl from '@/components/admin/SecuritySessionControl';
import SecurityAuditLog from '@/components/admin/SecurityAuditLog';
import SecurityCredentialRecovery from '@/components/admin/SecurityCredentialRecovery';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

const TABS = [
  { id: 'recovery', label: 'Credential Recovery', icon: RotateCcw, description: 'Access recovery safeguard' },
  { id: 'admins', label: 'Admin Users', icon: Users, description: 'View all admin accounts' },
  { id: 'credentials', label: 'Create Credentials', icon: Key, description: 'Create new admin accounts' },
  { id: 'passwords', label: 'Password Management', icon: Lock, description: 'Reset & manage passwords' },
  { id: 'access', label: 'Access Control', icon: Shield, description: 'Activate/suspend access' },
  { id: 'roles', label: 'Role Management', icon: UserCheck, description: 'Assign & change roles' },
  { id: 'permissions', label: 'Permissions', icon: AlertTriangle, description: 'Grant/revoke permissions' },
  { id: 'sessions', label: 'Sessions', icon: Clock, description: 'Manage active sessions' },
  { id: 'audit', label: 'Audit Log', icon: Zap, description: 'Security event log' },
];

export default function Security() {
  const [activeTab, setActiveTab] = useState('recovery');

  const renderContent = () => {
    const contentMap = {
      recovery: <SecurityCredentialRecovery />,
      admins: <SecurityAdminUsers />,
      credentials: <SecurityCreateCredentials />,
      passwords: <SecurityPasswordManagement />,
      access: <SecurityAccessControl />,
      roles: <SecurityRoleControl />,
      permissions: <SecurityPermissionControl />,
      sessions: <SecuritySessionControl />,
      audit: <SecurityAuditLog />,
    };
    return contentMap[activeTab];
  };

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <motion.div initial="hidden" animate="visible" transition={{ duration: 0.6 }} variants={fadeUp}>
        <h1 style={{ color: 'white', fontSize: 28, fontWeight: 900, margin: 0 }}>Security & Credential Management</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: '8px 0 0 0' }}>
          Manage admin accounts, credentials, permissions, and security controls
        </p>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div initial="hidden" animate="visible" transition={{ duration: 0.6, delay: 0.1 }} variants={fadeUp}
        className="rounded-xl p-4 overflow-x-auto" style={{ background: 'rgba(8,18,40,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex gap-2 min-w-min">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all whitespace-nowrap"
                style={{
                  background: isActive ? 'rgba(59,130,246,0.2)' : 'transparent',
                  color: isActive ? '#3b82f6' : 'rgba(255,255,255,0.4)',
                  borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent'
                }}>
                <Icon size={16} />
                <span className="text-sm font-semibold hidden sm:inline">{tab.label}</span>
                <span className="text-xs font-semibold sm:hidden">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Content */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        key={activeTab}>
        {renderContent()}
      </motion.div>
    </div>
  );
}