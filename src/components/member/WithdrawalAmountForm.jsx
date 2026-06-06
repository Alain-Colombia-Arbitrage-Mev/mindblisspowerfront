/**
 * Withdrawal Amount Input Form
 * Amount validation and feedback
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, AlertCircle, CheckCircle } from 'lucide-react';

export default function WithdrawalAmountForm({ availableBalance = 5000, onAmountChange, initialAmount = null }) {
  const [amount, setAmount] = useState(initialAmount || '');
  const [validationState, setValidationState] = useState(null); // null, 'valid', 'error'
  const [error, setError] = useState('');

  useEffect(() => {
    if (!amount) {
      setValidationState(null);
      setError('');
      return;
    }

    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount)) {
      setValidationState('error');
      setError('Ingresa un número válido');
      return;
    }

    if (numAmount <= 0) {
      setValidationState('error');
      setError('El monto debe ser mayor a 0');
      return;
    }

    if (numAmount > availableBalance) {
      setValidationState('error');
      setError(`Excede tu saldo disponible (máximo: $${availableBalance.toLocaleString()})`);
      return;
    }

    setValidationState('valid');
    setError('');
    onAmountChange?.(numAmount);
  }, [amount, availableBalance, onAmountChange]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="rounded-2xl p-6"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(59, 130, 246, 0.08)' }}
    >
      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', margin: '0 0 16px 0' }}>
        Monto de Retiro
      </p>

      {/* AVAILABLE BALANCE */}
      <div className="mb-6 p-4 rounded-xl" style={{ background: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.12)' }}>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, margin: '0 0 6px 0', fontWeight: 500 }}>Saldo disponible</p>
        <p style={{ color: '#10b981', fontSize: 22, fontWeight: 900, margin: 0 }}>
          ${availableBalance.toLocaleString()}
        </p>
      </div>

      {/* AMOUNT INPUT */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <DollarSign size={16} style={{ position: 'absolute', left: 12, top: 12, color: validationState === 'valid' ? '#10b981' : '#6B7280' }} />
        <input
          type="number"
          placeholder="Ingresa el monto"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{
            width: '100%',
            paddingLeft: 40,
            paddingRight: 12,
            paddingTop: 10,
            paddingBottom: 10,
            borderRadius: 10,
            background: 'rgba(255,255,255,0.04)',
            border: validationState === 'error' ? '1px solid #ef4444' : validationState === 'valid' ? '1px solid #10b981' : '1px solid rgba(59, 130, 246, 0.1)',
            color: 'white',
            fontSize: 13,
            fontFamily: 'inherit',
            transition: 'all 0.2s ease',
            outline: 'none',
          }}
          onFocus={(e) => {
            if (validationState !== 'error') {
              e.target.style.border = validationState === 'valid' ? '1px solid #10b981' : '1px solid rgba(59,130,246,0.5)';
            }
          }}
          onBlur={(e) => {
            if (validationState !== 'error') {
              e.target.style.border = validationState === 'valid' ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.12)';
            }
          }}
        />
        {validationState && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            style={{ position: 'absolute', right: 12, top: 12 }}>
            {validationState === 'valid' ? (
              <CheckCircle size={18} style={{ color: '#10b981' }} />
            ) : (
              <AlertCircle size={18} style={{ color: '#ef4444' }} />
            )}
          </motion.div>
        )}
      </div>

      {/* VALIDATION FEEDBACK */}
      <motion.div layout>
        {validationState === 'valid' && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            style={{ color: '#10b981', fontSize: 10, margin: '0 0 0 0', fontWeight: 600 }}>
            ✓ Cantidad válida
          </motion.p>
        )}
        {validationState === 'error' && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            style={{ color: '#ef4444', fontSize: 10, margin: '0 0 0 0', fontWeight: 600 }}>
            ✕ {error}
          </motion.p>
        )}
      </motion.div>

      {/* NET AMOUNT NOTE */}
      <motion.div layout>
        {amount && validationState === 'valid' && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-4 p-4 rounded-xl" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <p style={{ color: 'rgba(16,185,129,0.8)', fontSize: 11, margin: 0, fontWeight: 500 }}>Comisión (2%): ${Math.round(parseFloat(amount) * 0.02)}</p>
            <p style={{ color: '#10b981', fontSize: 13, margin: '6px 0 0 0', fontWeight: 700 }}>Recibirás: ${(parseFloat(amount) * 0.98).toLocaleString('es-ES', { maximumFractionDigits: 2 })}</p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}