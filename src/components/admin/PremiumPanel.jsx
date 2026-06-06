import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function PremiumPanel({ isOpen, onClose, title, children, width = 'w-96' }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
            style={{ backdropFilter: 'blur(4px)' }}
          />
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed right-0 top-0 bottom-0 ${width} glass z-50 flex flex-col overflow-hidden`}
            style={{ background: 'rgba(8,18,40,0.95)', borderLeft: '1px solid rgba(59,130,246,0.2)' }}>
            {/* Header */}
            <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <div className="flex items-center justify-between">
                <h2 style={{ color: 'white', fontSize: 16, fontWeight: 700, margin: 0 }}>{title}</h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg transition-all hover:bg-white/10"
                  style={{ color: 'rgba(255,255,255,0.5)' }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}