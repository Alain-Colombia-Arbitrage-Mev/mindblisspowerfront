/**
 * Withdrawal Success State
 * Confirmation and next steps
 */
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight } from 'lucide-react';

export default function WithdrawalSuccess({ amount, email, onReset }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl p-8 text-center"
      style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))', border: '1px solid rgba(16,185,129,0.3)' }}>
      
      {/* SUCCESS ICON */}
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring', stiffness: 100 }}
        style={{
          width: 60, height: 60, borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))',
          border: '2px solid rgba(16,185,129,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
          margin: '0 auto 16px',
        }}>
        <CheckCircle size={32} style={{ color: '#10b981' }} />
      </motion.div>

      {/* TITLE */}
      <motion.h2 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        style={{ color: '#10b981', fontSize: 24, fontWeight: 900, margin: '0 0 8px 0' }}>
        ¡Retiro exitoso!
      </motion.h2>

      {/* SUBTITLE */}
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: '0 0 24px 0', lineHeight: 1.6 }}>
        Tu solicitud ha sido enviada correctamente
      </motion.p>

      {/* SUMMARY */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="space-y-3 mb-8 p-4 rounded-lg"
        style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
        <div className="flex items-center justify-between">
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>Monto</span>
          <span style={{ color: '#10b981', fontWeight: 700, fontSize: 12 }}>${amount?.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>Email BMP</span>
          <span style={{ color: '#10b981', fontWeight: 700, fontSize: 11 }}>{email}</span>
        </div>
        <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid rgba(16,185,129,0.2)' }}>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>Recibirás (neto)</span>
          <span style={{ color: '#10b981', fontWeight: 900, fontSize: 13 }}>${(amount * 0.98).toLocaleString('es-ES', { maximumFractionDigits: 2 })}</span>
        </div>
      </motion.div>

      {/* NEXT STEPS */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="p-4 rounded-lg mb-8"
        style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, margin: '0 0 8px 0', fontWeight: 600 }}>
          ¿Qué sucede ahora?
        </p>
        <ol style={{ margin: 0, paddingLeft: 16, color: 'rgba(255,255,255,0.5)', fontSize: 10, lineHeight: 1.8 }}>
          <li>Tu solicitud se procesa en 24-48 horas</li>
          <li>Recibirás confirmación en tu email</li>
          <li>El dinero llegará a tu cuenta BMP</li>
        </ol>
      </motion.div>

      {/* ACTION BUTTONS */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        className="space-y-2">
        <motion.button onClick={onReset}
          whileHover={{ scale: 1.02, boxShadow: '0 8px 24px rgba(16,185,129,0.3)' }}
          whileTap={{ scale: 0.97 }}
          style={{
            width: '100%', padding: '12px 16px', borderRadius: 8,
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white', fontWeight: 700, fontSize: 12,
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'all 0.2s ease',
          }}>
          <ArrowRight size={14} /> Hacer otro retiro
        </motion.button>
        <motion.button
          whileHover={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
          whileTap={{ scale: 0.98 }}
          style={{
            width: '100%', padding: '10px 16px', borderRadius: 8,
            background: 'rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: 12,
            border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}>
          Ver historial completo
        </motion.button>
      </motion.div>
    </motion.div>
  );
}