import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';
import SafetyGuard from '@/lib/SafetyGuard';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConfirmationDialog({
  confirmationId,
  onConfirm,
  onReject,
  actor,
  userRole = 'admin'
}) {
  const [confirmation, setConfirmation] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initialConfirmation = SafetyGuard.getConfirmationStatus(confirmationId);
    setConfirmation(initialConfirmation);

    const unsubscribe = SafetyGuard.subscribe((id, state) => {
      if (id === confirmationId) {
        const updated = SafetyGuard.getConfirmationStatus(confirmationId);
        setConfirmation(updated);
      }
    });

    return unsubscribe;
  }, [confirmationId]);

  if (!confirmation) {
    return null;
  }

  const handleConfirm = async () => {
    setLoading(true);
    setError('');

    try {
      let result;
      if (confirmation.stage === 1) {
        result = SafetyGuard.confirmStage1(confirmationId, actor, userRole);
      } else {
        result = SafetyGuard.confirmStage2(confirmationId, actor, userRole);
      }

      if (!result.success) {
        setError(result.error);
        setLoading(false);
        return;
      }

      if (result.confirmed && onConfirm) {
        onConfirm(confirmationId);
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleReject = async () => {
    setLoading(true);
    SafetyGuard.rejectConfirmation(confirmationId, actor, 'Rejected by user');
    if (onReject) {
      onReject(confirmationId);
    }
    setLoading(false);
  };

  const getOperationLabel = (type) => {
    return type.replace(/_/g, ' ').toLowerCase();
  };

  const getContextLabel = (type, context) => {
    if (type.includes('PAYMENT')) {
      return `${context.amount} - ${context.targetUser}`;
    }
    if (type.includes('ROLE')) {
      return `${context.targetUser} → ${context.newRole}`;
    }
    if (type.includes('PLAN')) {
      return `${context.targetUser} - ${context.newPlan}`;
    }
    if (type.includes('LEADER')) {
      return `${context.targetUser}`;
    }
    return context.targetUser || 'N/A';
  };

  const isStage2 = confirmation.stage === 2;
  const isSingleConfirm = confirmation.stage === 1 && !confirmation.requiresDoubleConfirm;

  return (
    <AnimatePresence>
      {confirmation.status === 'pending' && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.7)' }}
            onClick={handleReject}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-vicion-navy rounded-xl max-w-md w-full p-6 border"
            style={{ borderColor: 'rgba(59,130,246,0.3)' }}
          >
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.15)' }}>
                <AlertTriangle size={24} style={{ color: '#ef4444' }} />
              </div>
            </div>

            {/* Title */}
            <h2 style={{ color: 'white', fontSize: 18, fontWeight: 700, textAlign: 'center', margin: '0 0 8px 0' }}>
              {isStage2 ? 'Final Confirmation Required' : 'Confirm Critical Action'}
            </h2>

            {/* Message */}
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, textAlign: 'center', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              {isStage2
                ? `A second admin must confirm this action. Please have another admin approve this operation.`
                : `You are about to ${getOperationLabel(confirmation.operationType)}.`}
            </p>

            {/* Operation Details */}
            <div className="mb-6 p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Operation Details
              </p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Type:</span>
                  <span style={{ color: 'white', fontWeight: 600, fontSize: 11 }}>
                    {getOperationLabel(confirmation.operationType)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Target:</span>
                  <span style={{ color: 'white', fontWeight: 600, fontSize: 11 }}>
                    {getContextLabel(confirmation.operationType, confirmation.context)}
                  </span>
                </div>
                {confirmation.confirmations.length > 0 && (
                  <div className="flex justify-between">
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Stage 1 By:</span>
                    <span style={{ color: '#10b981', fontWeight: 600, fontSize: 11 }}>
                      {confirmation.confirmations[0].actor}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Warning if double confirmation required */}
            {confirmation.requiresDoubleConfirm && confirmation.confirmations.length === 0 && (
              <div className="mb-6 p-3 rounded-lg" style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)' }}>
                <p style={{ color: '#fb923c', fontSize: 11, margin: 0 }}>
                  ⚠️ <strong>Double Confirmation Required</strong> — A second admin must also approve this action.
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                <p style={{ color: '#ef4444', fontSize: 11, margin: 0 }}>{error}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                <X size={14} className="inline mr-1" />
                Reject
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all disabled:opacity-50"
                style={{ background: isStage2 ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white' }}
              >
                {loading ? (
                  <>
                    <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                    Confirming...
                  </>
                ) : (
                  <>
                    <CheckCircle size={14} className="inline mr-1" />
                    {isStage2 ? 'Final Approve' : isSingleConfirm ? 'Approve' : 'Confirm Stage 1'}
                  </>
                )}
              </button>
            </div>

            {/* Close button */}
            <button
              onClick={handleReject}
              className="absolute top-4 right-4 p-1 hover:bg-white/10 rounded transition-all"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              <X size={16} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}