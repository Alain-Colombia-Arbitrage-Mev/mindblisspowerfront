/**
 * Withdrawal Confirmation Summary
 * Final review before submission
 */
import { motion } from 'framer-motion';
import { CheckCircle, Lock } from 'lucide-react';

export default function WithdrawalConfirmation({ 
  email = null, 
  amount = null, 
  availableBalance = 0,
  stepsComplete = false,
  onConfirm,
  isProcessing = false 
}) {
  const isReady = email && amount && stepsComplete && !isProcessing;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="rounded-2xl p-6"
      style={{ background: isReady ? 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(16,185,129,0.02))' : 'rgba(255,255,255,0.02)', border: isReady ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(59, 130, 246, 0.08)' }}
    >
      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', margin: '0 0 16px 0' }}>
        Resumen de Retiro
      </p>

      {/* SUMMARY ITEMS */}
      <div className="space-y-3 mb-6">
        {/* EMAIL */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}
          className="p-4 rounded-xl flex items-center justify-between"
          style={{ background: email ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.04)', border: email ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, margin: 0, fontWeight: 500 }}>Email BMP</p>
            <p style={{ color: email ? '#10b981' : '#9CA3AF', fontSize: 13, fontWeight: 700, margin: '4px 0 0 0' }}>
              {email ? email : 'No registrado'}
            </p>
          </div>
          {email && <CheckCircle size={16} style={{ color: '#10b981' }} />}
        </motion.div>

        {/* AMOUNT */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="p-4 rounded-xl flex items-center justify-between"
          style={{ background: amount ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.04)', border: amount ? '1px solid rgba(59,130,246,0.2)' : '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, margin: 0, fontWeight: 500 }}>Monto a retirar</p>
            <p style={{ color: amount ? '#3b82f6' : '#9CA3AF', fontSize: 13, fontWeight: 700, margin: '4px 0 0 0' }}>
              {amount ? `$${amount.toLocaleString()}` : 'No definido'}
            </p>
          </div>
          {amount && <CheckCircle size={16} style={{ color: '#3b82f6' }} />}
        </motion.div>

        {/* NET AMOUNT */}
        {amount && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
            className="p-4 rounded-xl"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <p style={{ color: 'rgba(16,185,129,0.8)', fontSize: 11, margin: 0, fontWeight: 500 }}>Recibirás en BMP (tras comisión 2%)</p>
            <p style={{ color: '#10b981', fontSize: 15, fontWeight: 900, margin: '4px 0 0 0' }}>
              ${(amount * 0.98).toLocaleString('es-ES', { maximumFractionDigits: 2 })}
            </p>
          </motion.div>
        )}
      </div>

      {/* TRUST TEXT */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="p-4 rounded-xl mb-6"
        style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.18)' }}>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
          ✓ Proceso seguro  •  ✓ Email BMP es lo único que necesitas  •  ✓ Procesamiento directo
        </p>
      </motion.div>

      {/* BUTTON */}
      <motion.button
        onClick={onConfirm}
        disabled={!isReady || isProcessing}
        whileHover={isReady && !isProcessing ? { scale: 1.02 } : {}}
        whileTap={isReady && !isProcessing ? { scale: 0.97 } : {}}
        style={{
          width: '100%',
          padding: '11px 16px',
          borderRadius: 10,
          background: isReady ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.06)',
          color: isReady ? 'white' : '#6B7280',
          fontWeight: 600,
          fontSize: 13,
          border: 'none',
          cursor: isReady ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: isReady ? 1 : 0.5,
          transition: 'all 0.2s ease',
        }}>
        {!isReady && <Lock size={14} />}
        {isProcessing ? 'Procesando...' : 'Confirmar Retiro'}
      </motion.button>

      {!isReady && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, textAlign: 'center', margin: '12px 0 0 0', fontWeight: 500 }}>
          Completa todos los pasos para continuar
        </motion.p>
      )}
    </motion.div>
  );
}