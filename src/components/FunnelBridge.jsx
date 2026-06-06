import { motion } from 'framer-motion';
import { CheckCircle, ChevronRight } from 'lucide-react';

/**
 * FunnelBridge: Smooth transition component between funnel stages
 * Includes emotional/narrative context, progress, next action
 */
export default function FunnelBridge({ 
  currentStage, 
  nextStage, 
  title, 
  narrative, 
  ctaText = 'Continuar',
  onProceed,
  completedItems = [],
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto px-4 py-12"
    >
      {/* Progress indicator */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, letterSpacing: 2, margin: 0 }}>
            PROGRESO
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>
            Paso {['landing', 'qualify', 'onboarding', 'planes', 'contract', 'payment', 'activation'].indexOf(nextStage) + 1} de 7
          </p>
        </div>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
          <motion.div
            animate={{
              width: `${((['landing', 'qualify', 'onboarding', 'planes', 'contract', 'payment', 'activation'].indexOf(nextStage) + 1) / 7) * 100}%`,
            }}
            transition={{ duration: 0.6 }}
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
            }}
          />
        </div>
      </div>

      {/* Hero message */}
      <div className="mb-12 text-center">
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            color: 'white',
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 900,
            fontSize: 32,
            marginBottom: 12,
            margin: 0,
          }}
        >
          {title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            color: 'rgba(255,255,255,0.65)',
            fontSize: 15,
            lineHeight: 1.7,
            maxWidth: 520,
            margin: '0 auto',
          }}
        >
          {narrative}
        </motion.p>
      </div>

      {/* Completed items (if any) */}
      {completedItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12 p-6 rounded-xl"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
        >
          <p style={{ color: '#10b981', fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 12, margin: '0 0 12px 0' }}>
            LO QUE COMPLETASTE
          </p>
          <div className="space-y-2">
            {completedItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="flex items-center gap-3"
              >
                <CheckCircle size={18} style={{ color: '#10b981', flexShrink: 0 }} />
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>{item}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* CTA Button */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        onClick={onProceed}
        className="w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2"
        style={{
          background: 'linear-gradient(135deg, #1d6ef5, #3b82f6)',
          fontSize: 16,
          fontFamily: 'Montserrat, sans-serif',
          border: 'none',
          cursor: 'pointer',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
      >
        {ctaText} <ChevronRight size={18} />
      </motion.button>

      {/* Trust element */}
      <div className="mt-8 text-center">
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: 0 }}>
          🛡️ Tu datos están seguros. Usamos encriptación de nivel empresarial.
        </p>
      </div>
    </motion.div>
  );
}