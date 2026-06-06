import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback } from 'react';

/**
 * Cinematic Focus Layer
 * Zoom-into-module, fade surroundings, smooth transitions
 * Handles module focus interactions
 */

export default function CinematicFocusLayer({ children, onFocusChange }) {
  const [focusedId, setFocusedId] = useState(null);
  const [focusPosition, setFocusPosition] = useState(null);

  const handleModuleClick = useCallback((e, moduleId) => {
    if (focusedId === moduleId) {
      // Unfocus
      setFocusedId(null);
      setFocusPosition(null);
      onFocusChange?.(null);
    } else {
      // Focus on module
      const rect = e.currentTarget.getBoundingClientRect();
      setFocusPosition({
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      });
      setFocusedId(moduleId);
      onFocusChange?.(moduleId);
    }
  }, [focusedId, onFocusChange]);

  return (
    <>
      {/* Backdrop dimming — appears when module focused */}
      <AnimatePresence>
        {focusedId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            onClick={() => {
              setFocusedId(null);
              setFocusPosition(null);
              onFocusChange?.(null);
            }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              pointerEvents: 'auto',
              zIndex: 45,
            }}
          />
        )}
      </AnimatePresence>

      {/* Cinematic frame around focused module */}
      <AnimatePresence>
        {focusedId && focusPosition && (
          <motion.div
            key={focusedId}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
            style={{
              position: 'fixed',
              left: focusPosition.x,
              top: focusPosition.y,
              width: focusPosition.width,
              height: focusPosition.height,
              border: '2px solid rgba(59,130,246,0.6)',
              borderRadius: 16,
              pointerEvents: 'none',
              zIndex: 46,
              boxShadow: '0 0 40px rgba(59,130,246,0.5), inset 0 0 40px rgba(59,130,246,0.1)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Children with focus handlers */}
      <motion.div
        animate={{
          opacity: focusedId ? 0.3 : 1,
        }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        style={{
          position: 'relative',
          zIndex: focusedId ? 0 : 'auto',
        }}
      >
        {children({
          handleModuleClick,
          focusedId,
        })}
      </motion.div>
    </>
  );
}