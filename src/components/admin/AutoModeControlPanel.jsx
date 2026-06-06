import { useState } from 'react';
import { motion } from 'framer-motion';
import { Power, AlertTriangle, Zap, Shield } from 'lucide-react';

/**
 * Auto Mode Control Panel
 * Master switch, execution modes, safety levels
 */

export default function AutoModeControlPanel({
  autoModeEnabled,
  onToggleAutoMode,
  executionMode,
  onExecutionModeChange,
  safetyLevel,
  onSafetyLevelChange,
  onPauseAll,
}) {
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);

  const executionModes = [
    { id: 'conservative', label: 'Conservative', desc: 'Execute only safe tasks, escalate medium/high risk' },
    { id: 'balanced', label: 'Balanced', desc: 'Execute low/medium tasks, escalate high risk' },
    { id: 'aggressive', label: 'Aggressive', desc: 'Execute all approved tasks, escalate critical risk only' },
  ];

  const safetyLevels = [
    { id: 'strict', label: 'Strict', desc: 'Maximum oversight, all actions require confirmation' },
    { id: 'standard', label: 'Standard', desc: 'Moderate oversight, low-risk only auto-execute' },
  ];

  const modeColors = {
    conservative: '#10b981',
    balanced: '#fb923c',
    aggressive: '#ef4444',
  };

  const handlePauseAll = () => {
    onPauseAll();
    setShowPauseConfirm(false);
  };

  return (
    <div className="space-y-6">
      {/* Master Switch */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-xl"
        style={{
          background: autoModeEnabled ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
          border: autoModeEnabled ? '2px solid rgba(16,185,129,0.3)' : '2px solid rgba(239,68,68,0.3)',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p style={{ color: 'white', fontSize: 18, fontWeight: 900, margin: '0 0 4px 0' }}>AUTO MODE</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>
              {autoModeEnabled ? 'System is autonomous — monitor actions closely' : 'System in manual mode — AI suggests only'}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleAutoMode}
            className="flex items-center gap-2.5 px-6 py-3 rounded-lg font-bold transition-all"
            style={{
              background: autoModeEnabled ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
              color: autoModeEnabled ? '#10b981' : '#ef4444',
              border: autoModeEnabled ? '1.5px solid rgba(16,185,129,0.5)' : '1.5px solid rgba(239,68,68,0.5)',
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            <Power size={16} />
            {autoModeEnabled ? 'ENABLED' : 'DISABLED'}
          </motion.button>
        </div>
      </motion.div>

      {autoModeEnabled && (
        <>
          {/* Execution Mode Selection */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, margin: '0 0 12px 0' }}>
              EXECUTION MODE
            </p>
            <div className="space-y-2">
              {executionModes.map(mode => (
                <motion.button
                  key={mode.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onExecutionModeChange(mode.id)}
                  className="w-full p-4 rounded-lg text-left transition-all"
                  style={{
                    background: executionMode === mode.id ? `${modeColors[mode.id]}15` : 'rgba(255,255,255,0.04)',
                    border: executionMode === mode.id ? `1.5px solid ${modeColors[mode.id]}` : '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p style={{ color: executionMode === mode.id ? modeColors[mode.id] : 'white', fontWeight: 700, fontSize: 13, margin: '0 0 3px 0' }}>
                        {mode.label}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>{mode.desc}</p>
                    </div>
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: executionMode === mode.id ? modeColors[mode.id] : 'rgba(255,255,255,0.2)' }}
                    />
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Safety Level Selection */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, margin: '0 0 12px 0' }}>
              SAFETY LEVEL
            </p>
            <div className="space-y-2">
              {safetyLevels.map(level => (
                <motion.button
                  key={level.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSafetyLevelChange(level.id)}
                  className="w-full p-4 rounded-lg text-left transition-all"
                  style={{
                    background: safetyLevel === level.id ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.04)',
                    border: safetyLevel === level.id ? '1.5px solid rgba(168,85,247,0.6)' : '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p style={{ color: safetyLevel === level.id ? '#a855f7' : 'white', fontWeight: 700, fontSize: 13, margin: '0 0 3px 0' }}>
                        {level.label}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>{level.desc}</p>
                    </div>
                    <Shield size={16} style={{ color: safetyLevel === level.id ? '#a855f7' : 'rgba(255,255,255,0.3)' }} />
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Emergency Pause Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {!showPauseConfirm ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowPauseConfirm(true)}
                className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-lg font-bold transition-all"
                style={{
                  background: 'rgba(239,68,68,0.12)',
                  color: '#ef4444',
                  border: '1.5px solid rgba(239,68,68,0.4)',
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                <AlertTriangle size={16} />
                PAUSE ALL AUTOMATION
              </motion.button>
            ) : (
              <div className="p-4 rounded-lg" style={{ background: 'rgba(239,68,68,0.15)', border: '1.5px solid rgba(239,68,68,0.4)' }}>
                <p style={{ color: '#ef4444', fontSize: 12, fontWeight: 700, margin: '0 0 12px 0' }}>Are you sure? This will immediately halt all ongoing automations.</p>
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePauseAll}
                    className="flex-1 px-4 py-2 rounded-lg font-bold text-sm"
                    style={{ background: '#ef4444', color: 'white' }}
                  >
                    Confirm Pause
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowPauseConfirm(false)}
                    className="flex-1 px-4 py-2 rounded-lg font-bold text-sm"
                    style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
}