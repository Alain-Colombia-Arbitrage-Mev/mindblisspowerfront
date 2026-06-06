import { useState } from 'react';
import { X, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import KYCManager from '@/lib/KYCManager';
import { motion, AnimatePresence } from 'framer-motion';

const REJECTION_REASONS = [
  'Document unclear or illegible',
  'Document expired',
  'Mismatched information',
  'Failed identity verification',
  'Suspicious activity detected',
  'Incomplete submission',
  'Other',
];

export default function KYCApprovalDialog({ userId, onClose, onStatusChange }) {
  const record = KYCManager.getKYCRecord(userId);
  const [action, setAction] = useState(null); // 'approve', 'reject', 'request_review'
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    const result = KYCManager.approveKYC(userId, 'admin@vicion.app');
    if (result.success) {
      onStatusChange?.();
      setTimeout(() => onClose(), 500);
    }
    setLoading(false);
  };

  const handleReject = async () => {
    if (!rejectionReason) {
      alert('Please select a rejection reason');
      return;
    }
    setLoading(true);
    const result = KYCManager.rejectKYC(userId, 'admin@vicion.app', rejectionReason);
    if (result.success) {
      onStatusChange?.();
      setTimeout(() => onClose(), 500);
    }
    setLoading(false);
  };

  const handleRequestReview = async () => {
    if (!reviewNotes) {
      alert('Please enter review notes');
      return;
    }
    setLoading(true);
    const result = KYCManager.requestReview(userId, 'admin@vicion.app', reviewNotes);
    if (result.success) {
      onStatusChange?.();
      setTimeout(() => onClose(), 500);
    }
    setLoading(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={onClose}
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-vicion-navy rounded-xl max-w-lg w-full p-6 border"
          style={{ borderColor: 'rgba(59,130,246,0.3)' }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 hover:bg-white/10 rounded transition-all"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            <X size={16} />
          </button>

          {!action ? (
            <>
              {/* Header */}
              <h2 style={{ color: 'white', fontSize: 18, fontWeight: 700, margin: '0 0 4px 0' }}>
                Review KYC Submission
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '0 0 20px 0' }}>
                User ID: {userId}
              </p>

              {/* KYC Details */}
              <div className="mb-6 space-y-3 p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="flex justify-between">
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Full Name</span>
                  <span style={{ color: 'white', fontWeight: 600, fontSize: 11 }}>{record.fullName || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Email</span>
                  <span style={{ color: 'white', fontWeight: 600, fontSize: 11 }}>{record.email || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Country</span>
                  <span style={{ color: 'white', fontWeight: 600, fontSize: 11 }}>{record.country || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Document Type</span>
                  <span style={{ color: 'white', fontWeight: 600, fontSize: 11 }}>{record.documentType || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Current Status</span>
                  <span style={{ color: '#3b82f6', fontWeight: 600, fontSize: 11 }}>
                    {record.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setAction('approve')}
                  disabled={record.status === 'verified'}
                  className="p-4 rounded-lg transition-all text-center disabled:opacity-50"
                  style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}
                >
                  <CheckCircle size={18} style={{ color: '#10b981', margin: '0 auto 4px' }} />
                  <p style={{ color: '#10b981', fontWeight: 600, fontSize: 11, margin: 0 }}>Approve</p>
                </button>
                <button
                  onClick={() => setAction('reject')}
                  disabled={record.status === 'rejected'}
                  className="p-4 rounded-lg transition-all text-center disabled:opacity-50"
                  style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}
                >
                  <XCircle size={18} style={{ color: '#ef4444', margin: '0 auto 4px' }} />
                  <p style={{ color: '#ef4444', fontWeight: 600, fontSize: 11, margin: 0 }}>Reject</p>
                </button>
                <button
                  onClick={() => setAction('request_review')}
                  className="p-4 rounded-lg transition-all text-center"
                  style={{ background: 'rgba(251,146,60,0.15)', border: '1px solid rgba(251,146,60,0.3)' }}
                >
                  <AlertCircle size={18} style={{ color: '#fb923c', margin: '0 auto 4px' }} />
                  <p style={{ color: '#fb923c', fontWeight: 600, fontSize: 11, margin: 0 }}>Request</p>
                </button>
              </div>
            </>
          ) : action === 'approve' ? (
            <>
              <h2 style={{ color: 'white', fontSize: 18, fontWeight: 700, margin: '0 0 4px 0' }}>
                Approve KYC?
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '0 0 20px 0' }}>
                This will mark the KYC as verified.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setAction(null)}
                  className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white' }}
                >
                  {loading ? 'Approving...' : 'Approve KYC'}
                </button>
              </div>
            </>
          ) : action === 'reject' ? (
            <>
              <h2 style={{ color: 'white', fontSize: 18, fontWeight: 700, margin: '0 0 4px 0' }}>
                Reject KYC
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '0 0 16px 0' }}>
                Select a rejection reason.
              </p>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-white text-sm mb-4"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                <option value="">Select reason...</option>
                {REJECTION_REASONS.map(reason => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
              <div className="flex gap-3">
                <button
                  onClick={() => setAction(null)}
                  className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={loading || !rejectionReason}
                  className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white' }}
                >
                  {loading ? 'Rejecting...' : 'Reject KYC'}
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 style={{ color: 'white', fontSize: 18, fontWeight: 700, margin: '0 0 4px 0' }}>
                Request Review
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '0 0 16px 0' }}>
                Ask the user to resubmit with corrections.
              </p>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Enter review notes..."
                className="w-full px-3 py-2 rounded-lg text-white text-sm mb-4 resize-none"
                rows="4"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setAction(null)}
                  className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestReview}
                  disabled={loading || !reviewNotes}
                  className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #fb923c, #f97316)', color: 'white' }}
                >
                  {loading ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}