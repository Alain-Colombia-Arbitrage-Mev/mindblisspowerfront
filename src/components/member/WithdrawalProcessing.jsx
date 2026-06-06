/**
 * Withdrawal Processing State
 * Animated processing feedback
 */
import { motion } from 'framer-motion';

export default function WithdrawalProcessing() {
  const steps = [
    { label: 'Validando datos' },
    { label: 'Procesando retiro' },
    { label: 'Enviando a BMP' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="rounded-xl p-8 text-center"
      style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.05))', border: '1px solid rgba(16,185,129,0.2)' }}>
      
      <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2, repeat: Infinity }}
        style={{
          width: 50, height: 50, borderRadius: 12,
          background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))',
          border: '2px solid rgba(16,185,129,0.4)',
          marginBottom: 16,
          margin: '0 auto 16px',
        }} />

      <h3 style={{ color: '#10b981', fontSize: 16, fontWeight: 900, margin: '0 0 8px 0' }}>
        Procesando tu retiro
      </h3>
      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: '0 0 20px 0' }}>
        Estamos validando y enviando tu solicitud...
      </p>

      <div className="space-y-2">
        {steps.map((step, idx) => (
          <motion.div key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.15 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 8,
              background: 'rgba(255,255,255,0.04)',
            }}>
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity, delay: idx * 0.2 }}
              style={{
                width: 8, height: 8, borderRadius: '50%',
                background: '#10b981',
                flexShrink: 0,
              }} />
            <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: 500 }}>{step.label}</span>
          </motion.div>
        ))}
      </div>

      <motion.div animate={{ scaleX: [0, 1] }} transition={{ duration: 3 }}
        className="mt-6 h-1 rounded-full"
        style={{ background: 'linear-gradient(90deg, #10b981, transparent)', originX: 0 }} />
    </motion.div>
  );
}