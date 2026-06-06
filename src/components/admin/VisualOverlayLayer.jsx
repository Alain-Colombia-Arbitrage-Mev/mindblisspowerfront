import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Zap, TrendingUp, Eye } from 'lucide-react';

/**
 * Visual Overlay Layer
 * Renders AI-driven attention guidance without blocking interaction
 */

const OverlayHighlight = ({ effect }) => (
  <motion.div
    key={effect.id}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.4 }}
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      zIndex: 40,
    }}
  >
    {/* Soft focus darkening */}
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle 600px at 50% 50%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.4) 100%)',
      }}
    />
  </motion.div>
);

const OverlayPulse = ({ effect, color }) => (
  <motion.div
    key={effect.id}
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    transition={{ duration: 0.5 }}
    style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'none',
      zIndex: 41,
    }}
  >
    <motion.div
      animate={{ boxShadow: ['0 0 0 0 ' + color + '60', '0 0 0 40px ' + color + '00'] }}
      transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.5 }}
      style={{
        width: 120,
        height: 120,
        borderRadius: 16,
        border: `2px solid ${color}`,
        background: `${color}08`,
      }}
    />
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <AlertTriangle size={48} style={{ color }} />
    </div>
  </motion.div>
);

const OverlayFrame = ({ effect, color }) => (
  <motion.div
    key={effect.id}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.4 }}
    style={{
      position: 'fixed',
      top: '20%',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '80%',
      height: 300,
      border: `2px solid ${color}`,
      borderRadius: 20,
      pointerEvents: 'none',
      zIndex: 40,
      background: `linear-gradient(135deg, ${color}08 0%, ${color}04 100%)`,
    }}
  >
    <motion.div
      animate={{
        boxShadow: [`inset 0 0 20px ${color}20, 0 0 40px ${color}30`, `inset 0 0 30px ${color}40, 0 0 60px ${color}50`],
      }}
      transition={{ duration: 2, repeat: Infinity }}
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 20,
      }}
    />
  </motion.div>
);

const OverlayGlow = ({ effect, color }) => (
  <motion.div
    key={effect.id}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      zIndex: 39,
      background: `radial-gradient(ellipse 800px 400px at 50% 40%, ${color}15 0%, ${color}05 40%, transparent 100%)`,
    }}
  />
);

const OverlayMarker = ({ effect, color, label }) => (
  <motion.div
    key={effect.id}
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 20 }}
    transition={{ duration: 0.4 }}
    style={{
      position: 'fixed',
      top: 100,
      right: 40,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 20px',
      borderRadius: 12,
      background: `${color}20`,
      border: `1.5px solid ${color}50`,
      zIndex: 42,
      pointerEvents: 'none',
    }}
  >
    <div style={{ width: 8, height: 8, borderRadius: 4, background: color }} />
    <span style={{ color, fontSize: 14, fontWeight: 700, letterSpacing: 1 }}>{label}</span>
    <Zap size={16} style={{ color }} />
  </motion.div>
);

const OverlayPath = ({ effect, color }) => (
  <motion.svg
    key={effect.id}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.5 }}
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 40,
    }}
  >
    <defs>
      <linearGradient id={`path-gradient-${effect.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor={color} stopOpacity="0" />
        <stop offset="50%" stopColor={color} stopOpacity="0.8" />
        <stop offset="100%" stopColor={color} stopOpacity="0" />
      </linearGradient>
    </defs>
    <motion.path
      d="M 100 300 Q 400 200 700 100"
      stroke={`url(#path-gradient-${effect.id})`}
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      initial={{ strokeDashoffset: 600 }}
      animate={{ strokeDashoffset: 0 }}
      transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
      strokeDasharray="600"
    />
  </motion.svg>
);

export default function VisualOverlayLayer({ enabled = true, intensity = 'medium', events = [] }) {
  const [overlays, setOverlays] = useState([]);

  const colorMap = {
    critical: '#ef4444',
    warning: '#fb923c',
    opportunity: '#10b981',
    info: '#3b82f6',
  };

  const labelMap = {
    highlight: 'AI Focus',
    pulse: 'Critical Alert',
    glow: 'Important Change',
    frame: 'Requires Review',
    marker: 'Opportunity',
    path: 'Event Impact',
  };

  useEffect(() => {
    if (!enabled || events.length === 0) return;

    const newOverlays = events
      .filter(e => e.effect)
      .map(e => ({
        ...e.effect,
        severity: e.severity,
        color: colorMap[e.severity] || '#3b82f6',
        label: labelMap[e.effect.type] || 'AI Insight',
      }));

    setOverlays(newOverlays);

    // Auto-cleanup based on duration
    const timers = newOverlays.map(o =>
      setTimeout(
        () => setOverlays(prev => prev.filter(x => x.id !== o.id)),
        o.duration
      )
    );

    return () => timers.forEach(t => clearTimeout(t));
  }, [events, enabled]);

  if (!enabled || overlays.length === 0) return null;

  return (
    <div style={{ pointerEvents: 'none', position: 'relative', zIndex: 35 }}>
      <AnimatePresence>
        {overlays.map(overlay => {
          if (overlay.type === 'highlight') return <OverlayHighlight key={overlay.id} effect={overlay} />;
          if (overlay.type === 'pulse') return <OverlayPulse key={overlay.id} effect={overlay} color={overlay.color} />;
          if (overlay.type === 'frame') return <OverlayFrame key={overlay.id} effect={overlay} color={overlay.color} />;
          if (overlay.type === 'glow') return <OverlayGlow key={overlay.id} effect={overlay} color={overlay.color} />;
          if (overlay.type === 'marker') return <OverlayMarker key={overlay.id} effect={overlay} color={overlay.color} label={overlay.label} />;
          if (overlay.type === 'path') return <OverlayPath key={overlay.id} effect={overlay} color={overlay.color} />;
          return null;
        })}
      </AnimatePresence>
    </div>
  );
}