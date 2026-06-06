/**
 * WithdrawalStepFlow — Trust Cinema
 * Clear current · clear completed · locked states quiet and refined
 */
import { motion } from 'framer-motion';
import { Check, Lock } from 'lucide-react';

const STEPS = [
  { num: 1, label: 'Cuenta BMP',     desc: 'Descarga e instala' },
  { num: 2, label: 'Vincular email', desc: 'Identidad financiera' },
  { num: 3, label: 'Monto',          desc: 'Define la cantidad' },
  { num: 4, label: 'Confirmar',      desc: 'Enviar solicitud' },
];

export default function WithdrawalStepFlow({ currentStep = 1, completedSteps = [] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      style={{
        padding: '24px 28px', borderRadius: 16,
        background: '#0B0F1A',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 24px 0' }}>
        Proceso de Retiro
      </p>

      <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
        {STEPS.map((step, idx) => {
          const isCompleted = completedSteps.includes(step.num);
          const isCurrent   = currentStep === step.num;
          const isLocked    = currentStep < step.num && !isCompleted;

          return (
            <div key={step.num} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              {/* Connector line */}
              {idx < STEPS.length - 1 && (
                <div style={{
                  position: 'absolute',
                  top: 17,
                  left: '50%',
                  width: 'calc(100% - 36px)',
                  height: 1,
                  zIndex: 0,
                  background: isCompleted
                    ? 'rgba(59,130,246,0.35)'
                    : isCurrent
                    ? 'rgba(59,130,246,0.15)'
                    : 'rgba(255,255,255,0.05)',
                  transition: 'background 300ms ease',
                }} />
              )}

              {/* Circle */}
              <div style={{ position: 'relative', zIndex: 1, marginBottom: 12 }}>
                {/* Active glow ring */}
                {isCurrent && (
                  <motion.div
                    animate={{ opacity: [0.3, 0.55, 0.3], scale: [1, 1.08, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                      position: 'absolute', inset: -5, borderRadius: '50%',
                      border: '1px solid rgba(59,130,246,0.4)',
                      boxShadow: '0 0 16px rgba(59,130,246,0.2)',
                    }}
                  />
                )}
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isCompleted
                    ? 'rgba(59,130,246,0.15)'
                    : isCurrent
                    ? 'rgba(59,130,246,0.12)'
                    : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${
                    isCompleted ? 'rgba(59,130,246,0.45)'
                    : isCurrent  ? 'rgba(59,130,246,0.5)'
                    : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: isCurrent ? '0 0 20px rgba(59,130,246,0.15)' : 'none',
                  transition: 'all 250ms ease',
                }}>
                  {isCompleted ? (
                    <Check size={14} style={{ color: '#60A5FA', strokeWidth: 2.5 }} />
                  ) : isLocked ? (
                    <Lock size={12} style={{ color: 'rgba(255,255,255,0.15)', strokeWidth: 1.5 }} />
                  ) : (
                    <span style={{ color: isCurrent ? '#93C5FD' : 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 800 }}>
                      {step.num}
                    </span>
                  )}
                </div>
              </div>

              {/* Label */}
              <p style={{
                color: isCompleted ? '#60A5FA' : isCurrent ? '#93C5FD' : 'rgba(255,255,255,0.25)',
                fontSize: 10, fontWeight: isCurrent ? 700 : 500,
                margin: '0 0 3px 0', textAlign: 'center', letterSpacing: '-0.1px',
                transition: 'color 250ms ease',
              }}>
                {step.label}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.18)', fontSize: 8, margin: 0, textAlign: 'center' }}>
                {step.desc}
              </p>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}