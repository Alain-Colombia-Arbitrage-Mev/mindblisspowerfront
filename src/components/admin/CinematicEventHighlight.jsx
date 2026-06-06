import { motion } from 'framer-motion';

/**
 * Cinematic Event Highlight
 * Slow zoom on event area, smart fade-in highlights, AI label animation
 */

export default function CinematicEventHighlight({ event, onComplete }) {
  if (!event) return null;

  const { position, severity, label, eventId } = event;
  const colorMap = {
    critical: '#ef4444',
    warning: '#fb923c',
    opportunity: '#10b981',
    info: '#3b82f6',
  };
  const color = colorMap[severity] || '#3b82f6';

  return (
    <>
      {/* Slow zoom highlight box */}
      <motion.div
        key={`zoom-${eventId}`}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 1.2, opacity: 0 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        onAnimationComplete={() => {
          // Remove after highlight sequence completes
          setTimeout(onComplete, 2000);
        }}
        style={{
          position: 'fixed',
          left: position?.x || '50%',
          top: position?.y || '50%',
          transform: 'translate(-50%, -50%)',
          width: position?.width || 200,
          height: position?.height || 150,
          border: `2.5px solid ${color}`,
          borderRadius: 20,
          pointerEvents: 'none',
          zIndex: 47,
          background: `${color}08`,
          boxShadow: `0 0 60px ${color}40, inset 0 0 40px ${color}20`,
        }}
      />

      {/* Expanding glow ring */}
      <motion.div
        key={`glow-${eventId}`}
        initial={{ scale: 0.6, opacity: 1 }}
        animate={{ scale: 2.5, opacity: 0 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        style={{
          position: 'fixed',
          left: position?.x || '50%',
          top: position?.y || '50%',
          transform: 'translate(-50%, -50%)',
          width: position?.width || 200,
          height: position?.height || 150,
          border: `2px solid ${color}`,
          borderRadius: 20,
          pointerEvents: 'none',
          zIndex: 46,
        }}
      />

      {/* AI Label fade-in */}
      <motion.div
        key={`label-${eventId}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
        style={{
          position: 'fixed',
          left: (position?.x || 0) + (position?.width || 0) / 2,
          top: (position?.y || 0) - 50,
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 18px',
          borderRadius: 10,
          background: `${color}20`,
          border: `1.5px solid ${color}`,
          pointerEvents: 'none',
          zIndex: 48,
        }}
      >
        <div style={{ width: 6, height: 6, borderRadius: 3, background: color, animation: 'pulse 1.5s ease-in-out infinite' }} />
        <span style={{ color, fontSize: 13, fontWeight: 700, letterSpacing: 0.5 }}>{label}</span>
      </motion.div>
    </>
  );
}