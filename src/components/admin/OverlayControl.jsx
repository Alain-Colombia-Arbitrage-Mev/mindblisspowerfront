import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Zap, Settings } from 'lucide-react';

/**
 * Overlay Control Panel
 * Admin controls for visual overlay system
 */

export default function OverlayControl({ enabled, onToggle, intensity, onIntensityChange, onMinimalMode }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      animate={{ width: expanded ? 320 : 60 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-24 right-8 rounded-2xl p-4 z-50 premium-card"
      style={{
        background: 'rgba(8,18,40,0.9)',
        border: '1.5px solid rgba(59,130,246,0.3)',
        boxShadow: '0 12px 48px rgba(59,130,246,0.2)',
      }}
    >
      <motion.button
        onClick={() => setExpanded(!expanded)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ background: enabled ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)', color: enabled ? '#3b82f6' : 'rgba(255,255,255,0.4)' }}
      >
        {enabled ? <Eye size={24} /> : <EyeOff size={24} />}
      </motion.button>

      {expanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mt-4 space-y-4"
        >
          <div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700, margin: '0 0 8px', letterSpacing: 1 }}>OVERLAY STATUS</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onToggle}
              className="w-full px-4 py-2.5 rounded-lg font-bold text-sm transition-all"
              style={{
                background: enabled ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                color: enabled ? '#10b981' : '#ef4444',
                border: enabled ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(239,68,68,0.3)',
              }}
            >
              {enabled ? '✓ Active' : '○ Disabled'}
            </motion.button>
          </div>

          <div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700, margin: '0 0 8px', letterSpacing: 1 }}>INTENSITY</p>
            <div className="space-y-2">
              {['low', 'medium', 'high'].map(level => (
                <motion.button
                  key={level}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onIntensityChange(level)}
                  className="w-full px-3 py-2 rounded-lg font-bold text-xs transition-all capitalize"
                  style={{
                    background: intensity === level ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.03)',
                    color: intensity === level ? '#3b82f6' : 'rgba(255,255,255,0.4)',
                    border: intensity === level ? '1px solid rgba(59,130,246,0.4)' : '1px solid transparent',
                  }}
                >
                  {level}
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700, margin: '0 0 8px', letterSpacing: 1 }}>MODES</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onMinimalMode}
              className="w-full px-3 py-2 rounded-lg font-bold text-xs text-white transition-all flex items-center justify-center gap-2"
              style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)' }}
            >
              <Zap size={14} /> Minimal Mode
            </motion.button>
          </div>

          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, margin: '8px 0 0', lineHeight: 1.4 }}>
            AI attention guidance layer. Non-blocking, real-time event visualization.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}