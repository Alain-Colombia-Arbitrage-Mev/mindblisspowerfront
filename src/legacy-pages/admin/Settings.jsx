import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon } from 'lucide-react';
import SimulationPanel from '@/components/admin/SimulationPanel';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('plans');

  const sections = [
    { id: 'plans', label: 'Plan Rules' },
    { id: 'assignment', label: 'Assignment Rules' },
    { id: 'approval', label: 'Approval Workflows' },
    { id: 'support', label: 'Support Workflows' },
    { id: 'classification', label: 'Classification Rules' },
    { id: 'simulation', label: '⚡ Simulation Engine' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 style={{ color: 'white', fontSize: 28, fontWeight: 900, margin: '0 0 8px 0' }}>Configuration & Rules Engine</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>Manage platform rules and settings</p>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 border-b border-white/8"
      >
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveTab(section.id)}
            className="px-4 py-3 text-sm font-medium transition-all border-b-2"
            style={{
              borderColor: activeTab === section.id ? '#3b82f6' : 'transparent',
              color: activeTab === section.id ? '#3b82f6' : 'rgba(255,255,255,0.5)'
            }}
          >
            {section.label}
          </button>
        ))}
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-6"
      >
        {activeTab === 'plans' && (
          <div className="space-y-4">
            <SettingItem label="Minimum Plan Amount" value="$50" />
            <SettingItem label="Maximum Plan Amount" value="$5,000" />
            <SettingItem label="Plan Activation Delay" value="24 hours" />
            <SettingItem label="Allow Plan Changes" value="Yes" />
          </div>
        )}

        {activeTab === 'assignment' && (
          <div className="space-y-4">
            <SettingItem label="Auto-assign Leader" value="On" />
            <SettingItem label="Reassignment Grace Period" value="30 days" />
            <SettingItem label="Network Line Assignment" value="Auto" />
            <SettingItem label="Require Manual Verification" value="On" />
          </div>
        )}

        {activeTab === 'approval' && (
          <div className="space-y-4">
            <SettingItem label="Auto-approve Plans Under" value="$500" />
            <SettingItem label="Require Admin Review" value="$500+" />
            <SettingItem label="Average Approval Time" value="4-6 hours" />
            <SettingItem label="Rejection Notification" value="On" />
          </div>
        )}

        {activeTab === 'support' && (
          <div className="space-y-4">
            <SettingItem label="Support Ticket SLA" value="24 hours" />
            <SettingItem label="Auto-escalate After" value="72 hours" />
            <SettingItem label="Priority Cases First" value="On" />
            <SettingItem label="Enable Email Notifications" value="On" />
          </div>
        )}

        {activeTab === 'classification' && (
          <div className="space-y-4">
            <SettingItem label="Default User Type" value="Participant" />
            <SettingItem label="VIP Threshold" value="$10,000+" />
            <SettingItem label="High Risk Threshold" value="Multiple Flags" />
            <SettingItem label="Auto-classify Users" value="On" />
          </div>
        )}

        {activeTab === 'simulation' && <SimulationPanel />}
      </motion.div>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <button
          className="px-6 py-2.5 rounded-lg font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #1d6ef5, #3b82f6)' }}
        >
          Save Configuration
        </button>
      </motion.div>
    </div>
  );
}

function SettingItem({ label, value }) {
  return (
    <div className="p-4 rounded-lg" style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center justify-between">
        <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>{label}</p>
        <input
          type="text"
          value={value}
          className="px-3 py-1.5 rounded bg-white/5 border border-white/10 text-white text-sm"
          style={{ width: 200 }}
        />
      </div>
    </div>
  );
}