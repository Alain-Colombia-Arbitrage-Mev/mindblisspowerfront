import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AutoModeControlPanel from '@/components/admin/AutoModeControlPanel';
import AutoModeStatusDisplay from '@/components/admin/AutoModeStatusDisplay';
import AutoModeRules from '@/components/admin/AutoModeRules';

/**
 * Auto Mode Page
 * Controlled autonomous operational mode
 */

export default function AutoMode() {
  const [autoModeEnabled, setAutoModeEnabled] = useState(false);
  const [executionMode, setExecutionMode] = useState('balanced');
  const [safetyLevel, setSafetyLevel] = useState('standard');
  const [isPaused, setIsPaused] = useState(false);
  const [stats, setStats] = useState({
    executedToday: 24,
    pendingApprovals: 3,
    escalations: 1,
    successRate: 98,
  });

  // Simulate stats updates when auto mode is active
  useEffect(() => {
    if (!autoModeEnabled || isPaused) return;

    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        executedToday: prev.executedToday + Math.floor(Math.random() * 2),
        successRate: Math.max(95, Math.min(100, prev.successRate + (Math.random() - 0.5) * 0.5)),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [autoModeEnabled, isPaused]);

  const handleToggleAutoMode = () => {
    setAutoModeEnabled(!autoModeEnabled);
    setIsPaused(false);
  };

  const handlePauseAll = () => {
    setIsPaused(true);
    setAutoModeEnabled(false);
  };

  return (
    <div className="space-y-8 max-w-[1200px]">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 800, letterSpacing: '0.25em', margin: '0 0 8px' }}>
          AUTONOMOUS OPERATIONS
        </p>
        <h1 style={{ color: 'white', fontSize: 28, fontWeight: 900, margin: '0 0 6px', letterSpacing: -0.5 }}>
          Auto Mode Control Center
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: 0 }}>
          Manage autonomous task execution with safety controls and real-time monitoring
        </p>
      </motion.div>

      {/* Emergency Banner if paused */}
      {isPaused && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 rounded-xl flex items-center justify-between"
          style={{
            background: 'rgba(239,68,68,0.15)',
            border: '1.5px solid rgba(239,68,68,0.4)',
          }}
        >
          <div>
            <p style={{ color: '#ef4444', fontWeight: 700, fontSize: 14, margin: '0 0 2px 0' }}>AUTOMATION PAUSED</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>All automations have been halted. Review and restart when ready.</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsPaused(false)}
            className="px-6 py-2 rounded-lg font-bold transition-all"
            style={{ background: '#ef4444', color: 'white', fontSize: 12, fontWeight: 700 }}
          >
            Resume
          </motion.button>
        </motion.div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Control Panel - wider */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 p-6 rounded-xl"
          style={{ background: 'rgba(8,18,40,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <AutoModeControlPanel
            autoModeEnabled={autoModeEnabled && !isPaused}
            onToggleAutoMode={handleToggleAutoMode}
            executionMode={executionMode}
            onExecutionModeChange={setExecutionMode}
            safetyLevel={safetyLevel}
            onSafetyLevelChange={setSafetyLevel}
            onPauseAll={handlePauseAll}
          />
        </motion.div>

        {/* Status at side */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-xl"
          style={{ background: 'rgba(8,18,40,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, margin: '0 0 12px 0' }}>
            QUICK STATUS
          </p>
          <div className="space-y-3">
            <div className="p-3 rounded-lg" style={{ background: 'rgba(16,185,129,0.1)' }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, margin: '0 0 4px 0' }}>Mode</p>
              <p style={{ color: '#10b981', fontSize: 14, fontWeight: 700, margin: 0 }}>
                {autoModeEnabled && !isPaused ? executionMode.toUpperCase() : 'OFFLINE'}
              </p>
            </div>
            <div className="p-3 rounded-lg" style={{ background: 'rgba(168,85,247,0.1)' }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, margin: '0 0 4px 0' }}>Safety</p>
              <p style={{ color: '#a855f7', fontSize: 14, fontWeight: 700, margin: 0 }}>
                {safetyLevel.toUpperCase()}
              </p>
            </div>
            <div className="p-3 rounded-lg" style={{ background: autoModeEnabled && !isPaused ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, margin: '0 0 4px 0' }}>Status</p>
              <p style={{ color: autoModeEnabled && !isPaused ? '#10b981' : '#ef4444', fontSize: 14, fontWeight: 700, margin: 0 }}>
                {autoModeEnabled && !isPaused ? 'ACTIVE' : 'INACTIVE'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Status Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-6 rounded-xl"
        style={{ background: 'rgba(8,18,40,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <AutoModeStatusDisplay enabled={autoModeEnabled && !isPaused} stats={stats} />
      </motion.div>

      {/* Rules & Safety */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-6 rounded-xl"
        style={{ background: 'rgba(8,18,40,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, margin: '0 0 18px 0' }}>
          OPERATIONAL CONSTRAINTS
        </p>
        <AutoModeRules />
      </motion.div>
    </div>
  );
}