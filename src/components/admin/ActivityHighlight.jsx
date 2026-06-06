import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ActivityHighlight
 * Shows animated highlight feedback when actions occur
 * Usage: wrap affected element or call highlight() function
 */

export default function ActivityHighlight({ element, elementId, actionType = 'update' }) {
  const [highlights, setHighlights] = useState([]);

  // Trigger highlight animation
  const highlight = (message = 'Updated', color = '#3b82f6', duration = 2000) => {
    const id = Date.now();
    setHighlights((prev) => [...prev, { id, message, color }]);

    setTimeout(() => {
      setHighlights((prev) => prev.filter((h) => h.id !== id));
    }, duration);
  };

  // Auto-highlight element if provided
  useEffect(() => {
    if (element && elementId) {
      const el = document.getElementById(elementId);
      if (el) {
        const observer = new MutationObserver(() => {
          highlight('Changed', '#10b981');
        });
        observer.observe(el, { subtree: true, childList: true, characterData: true });
        return () => observer.disconnect();
      }
    }
  }, [elementId]);

  return (
    <>
      {/* Animated Pulse Background */}
      <AnimatePresence>
        {highlights.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0.3, scale: 0.95 }}
            animate={{ opacity: 0, scale: 1.05 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="fixed inset-0 pointer-events-none z-40"
            style={{
              background: `radial-gradient(circle, ${item.color}30 0%, transparent 70%)`,
            }}
          />
        ))}
      </AnimatePresence>

      {/* Toast Notifications */}
      <AnimatePresence>
        {highlights.map((item) => (
          <motion.div
            key={`toast-${item.id}`}
            initial={{ opacity: 0, x: 20, y: -20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 20, y: -20 }}
            className="fixed bottom-6 right-6 px-4 py-3 rounded-lg text-sm font-semibold pointer-events-none z-50"
            style={{
              background: `${item.color}20`,
              border: `1px solid ${item.color}40`,
              color: item.color,
            }}
          >
            ✓ {item.message}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Return highlight function for manual triggering */}
      {element && <div data-highlight-fn={highlight} />}
    </>
  );
}

/**
 * Hook to trigger highlights programmatically
 */
export function useActivityHighlight() {
  const [highlights, setHighlights] = useState([]);

  const trigger = (message = 'Action completed', color = '#3b82f6', duration = 2000) => {
    const id = Date.now();
    setHighlights((prev) => [...prev, { id, message, color }]);
    setTimeout(() => {
      setHighlights((prev) => prev.filter((h) => h.id !== id));
    }, duration);
  };

  return { highlights, trigger };
}