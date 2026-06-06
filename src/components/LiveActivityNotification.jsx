import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const activities = [
  'Carlos M. – Colombia activó su participación',
  'Laura G. – México accedió al sistema',
  'Andrés R. – Perú inició proceso',
  'Sofia T. – Argentina se registró',
  'Juan P. – Chile completó verificación',
  'María C. – Venezuela activó nivel',
  'Diego L. – Ecuador inició sesión',
  'Paula R. – Bolivia accedió a beneficios',
];

export default function LiveActivityNotification() {
  const [current, setCurrent] = useState(null);

  useEffect(() => {
    const showNotification = () => {
      const randomActivity = activities[Math.floor(Math.random() * activities.length)];
      setCurrent(randomActivity);
      
      const hideTimer = setTimeout(() => {
        setCurrent(null);
      }, 4000);

      return hideTimer;
    };

    const interval = setInterval(showNotification, Math.random() * 4000 + 6000);
    const initialTimer = setTimeout(showNotification, 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(initialTimer);
    };
  }, []);

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={current}
          initial={{ x: -400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -400, opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="fixed bottom-6 left-6 z-50"
        >
          <div
            className="px-5 py-3 rounded-xl flex items-center gap-3 shadow-lg"
            style={{
              background: 'rgba(13, 31, 60, 0.95)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
            }}
          >
            <div className="w-2 h-2 rounded-full bg-vicion-blue animate-pulse flex-shrink-0" />
            <span className="text-white text-sm font-medium">{current}</span>
            <button
              onClick={() => setCurrent(null)}
              className="ml-2 text-white/50 hover:text-white/80 transition-colors flex-shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}