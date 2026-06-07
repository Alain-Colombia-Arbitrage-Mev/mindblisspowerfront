import { useState, useEffect } from 'react';
import { FileText, CheckCircle, Clock, AlertCircle, Download, Eye, Zap } from 'lucide-react';
import LegalFramework from '@/lib/LegalFramework';
import { motion } from 'framer-motion';

export default function LegalDocumentManager() {
  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // list, view, audit
  const legal = LegalFramework.getInstance();

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = () => {
    setContracts(legal.contracts);
  };

  const handleSignContract = (contractId) => {
    const contract = legal.getContract(contractId);
    if (!contract) return;

    const signature = legal.simulateSignature(contractId, {
      id: 'ADMIN-001',
      name: 'Admin User',
      email: 'admin@mindblisspower.com',
    }, 'administrator');

    loadContracts();
    alert(`Contract signed successfully.\nSignature ID: ${signature.id}`);
  };

  const getStatusColor = (status) => {
    const colors = {
      signed: '#10b981',
      pending_signature: '#fb923c',
      draft: '#6b7280',
      expired: '#ef4444',
    };
    return colors[status] || '#3b82f6';
  };

  const getStatusIcon = (status) => {
    if (status === 'signed') return <CheckCircle size={14} />;
    if (status === 'pending_signature') return <Clock size={14} />;
    return <AlertCircle size={14} />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ color: 'white', fontSize: 16, fontWeight: 900, margin: 0 }}>Legal Document Manager</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '4px 0 0 0' }}>
            Contract generation, tracking, and signature management
          </p>
        </div>
        <div className="text-right">
          <p style={{ color: '#10b981', fontSize: 12, fontWeight: 700, margin: 0 }}>
            {contracts.filter(c => c.status === 'signed').length} Signed
          </p>
          <p style={{ color: '#fb923c', fontSize: 12, fontWeight: 700, margin: '2px 0 0 0' }}>
            {contracts.filter(c => c.status === 'pending_signature').length} Pending
          </p>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        {[
          { id: 'list', label: 'Contracts', icon: FileText },
          { id: 'audit', label: 'Audit Trail', icon: Zap },
        ].map(mode => {
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: viewMode === mode.id ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
                color: viewMode === mode.id ? '#3b82f6' : 'rgba(255,255,255,0.5)',
                border: `1px solid ${viewMode === mode.id ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.1)'}`,
              }}
            >
              <Icon size={12} />
              {mode.label}
            </button>
          );
        })}
      </div>

      {/* Contract List View */}
      {viewMode === 'list' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {contracts.length === 0 ? (
            <div className="p-8 text-center rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <FileText size={32} style={{ color: 'rgba(255,255,255,0.2)', margin: '0 auto 8px' }} />
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>No contracts yet</p>
            </div>
          ) : (
            contracts.map((contract, idx) => (
              <motion.div
                key={contract.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 rounded-lg cursor-pointer transition-all hover:bg-white/5"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}
                onClick={() => setSelectedContract(contract)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FileText size={14} style={{ color: '#3b82f6' }} />
                      <h3 style={{ color: 'white', fontWeight: 600, fontSize: 12, margin: 0 }}>
                        {contract.type.replace(/_/g, ' ').toUpperCase()}
                      </h3>
                      <span
                        className="px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1"
                        style={{ background: `${getStatusColor(contract.status)}20`, color: getStatusColor(contract.status) }}
                      >
                        {getStatusIcon(contract.status)}
                        {contract.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, margin: '4px 0 0 0' }}>
                      {contract.id} • {contract.generatedDate.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {contract.status === 'pending_signature' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSignContract(contract.id);
                        }}
                        className="px-3 py-1.5 rounded text-xs font-semibold transition-all"
                        style={{
                          background: 'rgba(16,185,129,0.2)',
                          color: '#10b981',
                          border: '1px solid rgba(16,185,129,0.3)',
                        }}
                      >
                        Sign
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedContract(contract);
                      }}
                      className="p-1.5 rounded transition-all hover:bg-white/10"
                      style={{ color: 'rgba(255,255,255,0.4)' }}
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      )}

      {/* Audit Trail View */}
      {viewMode === 'audit' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
          {legal.getAuditTrail().length === 0 ? (
            <div className="p-8 text-center rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>No audit events</p>
            </div>
          ) : (
            legal.getAuditTrail().slice(0, 50).map((entry, idx) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.02 }}
                className="p-3 rounded-lg flex items-start gap-3"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: '#3b82f6' }} />
                <div className="flex-1 min-w-0">
                  <p style={{ color: 'white', fontWeight: 600, fontSize: 10, margin: 0 }}>
                    {entry.eventType.replace(/_/g, ' ').toUpperCase()}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, margin: '2px 0 0 0', wordBreak: 'break-word' }}>
                    {entry.description}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, margin: '2px 0 0 0' }}>
                    {entry.timestamp.toISOString()}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      )}

      {/* Contract Detail View */}
      {selectedContract && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedContract(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] overflow-y-auto rounded-xl w-full max-w-2xl p-8"
            style={{ background: '#0a1628', border: '1px solid rgba(59,130,246,0.3)' }}
          >
            <div className="flex items-start justify-between mb-6">
              <h2 style={{ color: 'white', fontSize: 16, fontWeight: 900, margin: 0 }}>
                {selectedContract.type.replace(/_/g, ' ').toUpperCase()}
              </h2>
              <button
                onClick={() => setSelectedContract(null)}
                className="text-xl"
                style={{ color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Contract Info */}
            <div className="space-y-3 mb-6">
              <InfoRow label="Contract ID" value={selectedContract.id} />
              <InfoRow label="Status" value={selectedContract.status.replace(/_/g, ' ')} />
              <InfoRow label="Generated" value={selectedContract.generatedDate.toLocaleDateString()} />
              <InfoRow label="Version" value={selectedContract.version} />
            </div>

            {/* Contract Content Preview */}
            <div
              className="p-4 rounded-lg mb-6 font-mono text-xs whitespace-pre-wrap"
              style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
            >
              {selectedContract.content.slice(0, 500)}...
            </div>

            {/* Terms */}
            {Object.keys(selectedContract.terms).length > 0 && (
              <div className="mb-6">
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700, margin: '0 0 8px 0' }}>TERMS</p>
                {Object.entries(selectedContract.terms).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between py-1.5 text-xs" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>{key.replace(/_/g, ' ')}</span>
                    <span style={{ color: value ? '#10b981' : '#fb923c', fontWeight: 600 }}>
                      {value ? 'ACCEPTED' : 'PENDING'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            {selectedContract.status === 'pending_signature' && (
              <button
                onClick={() => {
                  handleSignContract(selectedContract.id);
                  setSelectedContract(null);
                }}
                className="w-full px-4 py-3 rounded-lg font-semibold text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
              >
                Sign Contract
              </button>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-xs" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</span>
      <span style={{ color: 'white', fontWeight: 600 }}>{value}</span>
    </div>
  );
}