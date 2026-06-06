import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, Activity, Zap } from 'lucide-react';
import { validateAdminAccess } from '@/lib/AdminRouteGuard';
import CommandCenterKPIs from '@/components/admin/CommandCenterKPIs';
import CommandCenterPanels from '@/components/admin/CommandCenterPanels';
import CommandCenterAlerts from '@/components/admin/CommandCenterAlerts';
import GlobalControlDashboard from '@/components/GlobalControlDashboard';
import InternalGrowthHub from '@/components/InternalGrowthHub';
import CommandCenterControlPanels from '@/components/admin/CommandCenterControlPanels';

export default function CommandCenter() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!validateAdminAccess()) {
      navigate('/admin-access');
    }
  }, [navigate]);

  const [activeSection, setActiveSection] = useState('overview');

  return (
    <div className="min-h-screen bg-vicion-deep space-y-8 p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <Activity size={24} style={{ color: '#3b82f6' }} />
          <h1 style={{ color: 'white', fontSize: 32, fontWeight: 900, margin: 0, fontFamily: 'Montserrat' }}>
            Command Center
          </h1>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '4px 0 0 0' }}>
          Real-time operational control room for growth management
        </p>
      </motion.div>

      {/* Global KPIs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <CommandCenterKPIs />
      </motion.div>

      {/* Live Panels */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <CommandCenterPanels />
      </motion.div>

      {/* Alerts & Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <CommandCenterAlerts />
      </motion.div>

      {/* Section Tabs */}
      <div className="flex gap-2 border-b border-white/8 pt-8">
        {[
          { id: 'overview', label: 'Operations' },
          { id: 'control', label: 'Global Control' },
          { id: 'growth', label: 'Growth Execution' },
          { id: 'panels', label: 'Control Panels' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className="px-4 py-3 text-sm font-medium transition-all border-b-2"
            style={{
              borderColor: activeSection === tab.id ? '#3b82f6' : 'transparent',
              color: activeSection === tab.id ? '#3b82f6' : 'rgba(255,255,255,0.5)'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Global Control Integration */}
      {activeSection === 'control' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlobalControlDashboard />
        </motion.div>
      )}

      {/* Growth Execution Integration */}
      {activeSection === 'growth' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <InternalGrowthHub user={{ id: 'admin', full_name: 'Admin' }} />
        </motion.div>
      )}

      {/* Control Panels */}
      {activeSection === 'panels' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <CommandCenterControlPanels />
        </motion.div>
      )}
    </div>
  );
}