import { useState } from 'react';
import { CheckCircle, Clock, AlertCircle, Signature, Copy, Download, Eye } from 'lucide-react';
import DigitalSignatureSystem from '@/lib/DigitalSignatureSystem';
import { motion } from 'framer-motion';

export default function DigitalSignatureUI({ document, onSignatureComplete }) {
  const [step, setStep] = useState('review'); // review, accept, sign, completed
  const [signature, setSignature] = useState(null);
  const [signer, setSigner] = useState({
    id: 'USER-001',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'participant',
  });
  const [acceptance, setAcceptance] = useState({
    acceptsTerms: false,
    acceptsRisks: false,
    acceptsConditions: false,
  });
  const [loading, setLoading] = useState(false);
  const signatureSystem = DigitalSignatureSystem.getInstance();

  if (!document) {
    return (
      <div className="p-6 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>No document to sign</p>
      </div>
    );
  }

  const handleSign = async () => {
    setLoading(true);
    try {
      const result = signatureSystem.signDocument(document, signer, acceptance);
      if (result.success) {
        setSignature(result.signature);
        setStep('completed');
        onSignatureComplete?.(result.signature);
      }
    } finally {
      setLoading(false);
    }
  };

  const canSign = acceptance.acceptsTerms && acceptance.acceptsRisks && acceptance.acceptsConditions;

  return (
    <div className="space-y-6">
      {/* Signature Progress */}
      <div className="flex items-center justify-between mb-8">
        {[
          { id: 'review', label: 'Review Document' },
          { id: 'accept', label: 'Accept Terms' },
          { id: 'sign', label: 'Sign' },
          { id: 'completed', label: 'Completed' },
        ].map((s, idx) => (
          <div key={s.id} className="flex items-center flex-1">
            <motion.div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all"
              style={{
                background:
                  step === s.id ? '#3b82f6' :
                  ['review', 'accept', 'sign'].indexOf(step) >= ['review', 'accept', 'sign'].indexOf(s.id) ? '#10b981' : 'rgba(255,255,255,0.1)',
                color: 'white',
                border: step === s.id ? '2px solid #3b82f6' : 'none',
              }}
            >
              {['review', 'accept', 'sign'].indexOf(step) >= ['review', 'accept', 'sign'].indexOf(s.id) && step !== s.id ? (
                <CheckCircle size={16} />
              ) : (
                idx + 1
              )}
            </motion.div>

            {idx < 3 && (
              <div
                className="flex-1 h-0.5 mx-2"
                style={{
                  background: ['review', 'accept', 'sign'].indexOf(step) >= ['review', 'accept', 'sign'].indexOf(s.id) ? '#10b981' : 'rgba(255,255,255,0.1)',
                  transition: 'all 300ms ease',
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Review Document */}
      {step === 'review' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="p-4 rounded-lg" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <h3 style={{ color: '#3b82f6', fontSize: 12, fontWeight: 700, margin: '0 0 8px 0' }}>
              DOCUMENT REVIEW
            </h3>
            <div className="space-y-2">
              <InfoItem label="Title" value={document.title} />
              <InfoItem label="Type" value={document.type?.replace(/_/g, ' ') || 'Unknown'} />
              <InfoItem label="ID" value={document.id} />
              <InfoItem label="Generated" value={new Date(document.generatedDate).toLocaleDateString()} />
              {document.amount > 0 && (
                <InfoItem label="Amount" value={`${document.amount} ${document.currency}`} />
              )}
            </div>
          </div>

          <div
            className="p-4 rounded-lg max-h-40 overflow-y-auto font-mono text-xs whitespace-pre-wrap"
            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
          >
            {document.content?.slice(0, 300)}...
          </div>

          <button
            onClick={() => setStep('accept')}
            className="w-full px-4 py-3 rounded-lg font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
          >
            Continue to Accept Terms
          </button>
        </motion.div>
      )}

      {/* Step 2: Accept Terms */}
      {step === 'accept' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="space-y-3">
            <AcceptanceCheckbox
              label="I accept the terms and conditions of this agreement"
              checked={acceptance.acceptsTerms}
              onChange={(e) => setAcceptance(prev => ({ ...prev, acceptsTerms: e.target.checked }))}
            />
            <AcceptanceCheckbox
              label="I acknowledge and accept all risks associated with this agreement"
              checked={acceptance.acceptsRisks}
              onChange={(e) => setAcceptance(prev => ({ ...prev, acceptsRisks: e.target.checked }))}
            />
            <AcceptanceCheckbox
              label="I confirm that I understand and accept all conditions"
              checked={acceptance.acceptsConditions}
              onChange={(e) => setAcceptance(prev => ({ ...prev, acceptsConditions: e.target.checked }))}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('review')}
              className="flex-1 px-4 py-2 rounded-lg font-semibold transition-all"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              Back
            </button>
            <button
              onClick={() => setStep('sign')}
              disabled={!canSign}
              className="flex-1 px-4 py-2 rounded-lg font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: canSign ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.1)' }}
            >
              Continue to Sign
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 3: Sign Document */}
      {step === 'sign' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="p-4 rounded-lg" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <h3 style={{ color: '#8b5cf6', fontSize: 12, fontWeight: 700, margin: '0 0 8px 0' }}>
              SIGNER INFORMATION
            </h3>
            <div className="space-y-3">
              <FormField
                label="Full Name"
                value={signer.name}
                onChange={(e) => setSigner(prev => ({ ...prev, name: e.target.value }))}
              />
              <FormField
                label="Email"
                value={signer.email}
                onChange={(e) => setSigner(prev => ({ ...prev, email: e.target.value }))}
                type="email"
              />
            </div>
          </div>

          <div className="p-4 rounded-lg" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, margin: '0 0 8px 0' }}>
              By clicking the Sign button below, you are confirming that you have read, understood, and accept all terms and conditions of this agreement.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, margin: '8px 0 0 0' }}>
              ✓ Signature will be timestamped and recorded • ✓ Device information will be captured • ✓ IP address will be logged
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('accept')}
              className="flex-1 px-4 py-2 rounded-lg font-semibold transition-all"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              Back
            </button>
            <button
              onClick={handleSign}
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-lg font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: loading ? 'rgba(139,92,246,0.5)' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}
            >
              <Signature className="inline mr-2" size={14} />
              {loading ? 'Signing...' : 'Sign Document'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 4: Completed */}
      {step === 'completed' && signature && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
          <div
            className="p-6 rounded-lg text-center"
            style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.1))', border: '1px solid rgba(16,185,129,0.3)' }}
          >
            <CheckCircle size={48} style={{ color: '#10b981', margin: '0 auto 16px' }} />
            <h2 style={{ color: '#10b981', fontSize: 16, fontWeight: 900, margin: '0 0 8px 0' }}>
              Document Signed Successfully
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: '0 0 16px 0' }}>
              Your signature has been recorded and timestamped
            </p>

            <div className="space-y-2 text-xs mb-4">
              <SignatureDetail label="Signature ID" value={signature.id} />
              <SignatureDetail label="Signed By" value={signature.signer.name} />
              <SignatureDetail label="Signed At" value={signature.timestamp.toLocaleString()} />
              <SignatureDetail label="Hash" value={signature.signatureHash} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                const proof = DigitalSignatureSystem.getInstance().exportSignatureProof(signature.id);
                navigator.clipboard.writeText(JSON.stringify(proof, null, 2));
              }}
              className="px-4 py-2 rounded-lg font-semibold text-sm transition-all"
              style={{ background: 'rgba(59,130,246,0.2)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}
            >
              <Copy size={12} className="inline mr-1" />
              Copy Proof
            </button>
            <button
              className="px-4 py-2 rounded-lg font-semibold text-sm transition-all"
              style={{ background: 'rgba(59,130,246,0.2)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}
            >
              <Download size={12} className="inline mr-1" />
              Export
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
      <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function AcceptanceCheckbox({ label, checked, onChange }) {
  return (
    <label className="flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-white/5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 mt-1 rounded"
        style={{ accentColor: '#3b82f6' }}
      />
      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{label}</span>
    </label>
  );
}

function FormField({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 600, display: 'block', marginBottom: 4 }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 rounded-lg text-sm"
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }}
      />
    </div>
  );
}

function SignatureDetail({ label, value }) {
  return (
    <div className="flex items-center justify-between text-xs p-2 rounded" style={{ background: 'rgba(0,0,0,0.2)' }}>
      <span style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
      <code style={{ color: 'rgba(255,255,255,0.7)', fontSize: '9px' }}>{value.slice(0, 24)}...</code>
    </div>
  );
}