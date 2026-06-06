import { useState, useEffect } from 'react';
import { FileText, CheckCircle, Clock, Send, Eye, Plus, Filter } from 'lucide-react';
import ContractGenerator from '@/lib/ContractGenerator';
import { motion } from 'framer-motion';

export default function ContractGenerationDashboard() {
  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const generator = ContractGenerator.getInstance();

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = () => {
    setContracts(generator.getAllContracts());
  };

  const handleStatusChange = (contractId, newStatus) => {
    generator.updateContractStatus(contractId, newStatus);
    loadContracts();
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: '#6b7280',
      generated: '#3b82f6',
      sent: '#f59e0b',
      signed: '#10b981',
    };
    return colors[status] || '#8b5cf6';
  };

  const getStatusIcon = (status) => {
    if (status === 'signed') return <CheckCircle size={14} />;
    if (status === 'sent') return <Send size={14} />;
    if (status === 'generated') return <FileText size={14} />;
    return <Clock size={14} />;
  };

  const filteredContracts = contracts.filter(c => {
    const typeMatch = filterType === 'all' || c.type === filterType;
    const statusMatch = filterStatus === 'all' || c.status === filterStatus;
    return typeMatch && statusMatch;
  });

  const summary = generator.getContractSummary();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ color: 'white', fontSize: 16, fontWeight: 900, margin: 0 }}>
            Contract Generation
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '4px 0 0 0' }}>
            Auto-generate contracts from participant, investment, and leader activities
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p style={{ color: '#3b82f6', fontSize: 12, fontWeight: 700, margin: 0 }}>
              {summary.total} Total
            </p>
            <p style={{ color: '#fb923c', fontSize: 12, fontWeight: 700, margin: '2px 0 0 0' }}>
              {summary.pendingSignatures} Pending
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Total', value: summary.total, color: '#3b82f6' },
          { label: 'Participation', value: summary.byType.participation, color: '#8b5cf6' },
          { label: 'Investment', value: summary.byType.investment, color: '#10b981' },
          { label: 'Leader', value: summary.byType.leader, color: '#f59e0b' },
          { label: 'Service', value: summary.byType.service, color: '#06b6d4' },
        ].map(item => (
          <div key={item.label} className="p-4 rounded-lg" style={{ background: `${item.color}12`, border: `1px solid ${item.color}30` }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 700, margin: 0, textTransform: 'uppercase' }}>
              {item.label}
            </p>
            <p style={{ color: item.color, fontSize: 18, fontWeight: 900, margin: '6px 0 0 0' }}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 rounded-lg text-xs font-semibold"
          style={{
            background: 'rgba(255,255,255,0.06)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <option value="all">All Types</option>
          <option value="participation_agreement">Participation</option>
          <option value="investment_agreement">Investment</option>
          <option value="leader_agreement">Leader</option>
          <option value="service_agreement">Service</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg text-xs font-semibold"
          style={{
            background: 'rgba(255,255,255,0.06)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="generated">Generated</option>
          <option value="sent">Sent</option>
          <option value="signed">Signed</option>
        </select>
      </div>

      {/* Contracts List */}
      <div className="space-y-2">
        {filteredContracts.length === 0 ? (
          <div className="p-12 text-center rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <FileText size={32} style={{ color: 'rgba(255,255,255,0.2)', margin: '0 auto 8px' }} />
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>No contracts match filters</p>
          </div>
        ) : (
          filteredContracts.map((contract, idx) => (
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
                  <div className="flex items-center gap-2 mb-1">
                    <FileText size={14} style={{ color: '#3b82f6' }} />
                    <h3 style={{ color: 'white', fontWeight: 600, fontSize: 12, margin: 0 }}>
                      {contract.title}
                    </h3>
                    <span
                      className="px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1"
                      style={{ background: `${getStatusColor(contract.status)}20`, color: getStatusColor(contract.status) }}
                    >
                      {getStatusIcon(contract.status)}
                      {contract.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs mt-2">
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {contract.parties[0].name}
                    </span>
                    {contract.amount > 0 && (
                      <>
                        <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                          {contract.amount} {contract.currency}
                        </span>
                      </>
                    )}
                    <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {new Date(contract.generatedDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  {contract.status === 'generated' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange(contract.id, 'sent');
                      }}
                      className="px-3 py-1.5 rounded text-xs font-semibold transition-all"
                      style={{
                        background: 'rgba(251,158,60,0.2)',
                        color: '#f59e0b',
                        border: '1px solid rgba(251,158,60,0.3)',
                      }}
                    >
                      Send
                    </button>
                  )}

                  {contract.status === 'sent' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange(contract.id, 'signed');
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
      </div>

      {/* Contract Detail Modal */}
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
                {selectedContract.title}
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
              <InfoRow label="Status" value={selectedContract.status} />
              <InfoRow label="Type" value={selectedContract.type.replace(/_/g, ' ')} />
              <InfoRow label="Generated" value={new Date(selectedContract.generatedDate).toLocaleDateString()} />
              {selectedContract.amount > 0 && (
                <InfoRow label="Amount" value={`${selectedContract.amount} ${selectedContract.currency}`} />
              )}
            </div>

            {/* Parties */}
            <div className="mb-6">
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700, margin: '0 0 8px 0', textTransform: 'uppercase' }}>
                Parties
              </p>
              {selectedContract.parties.map((party, idx) => (
                <div key={idx} className="py-2 px-3 mb-2 rounded" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <p style={{ color: 'white', fontWeight: 600, fontSize: 11, margin: 0 }}>
                    {party.name}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, margin: '2px 0 0 0' }}>
                    {party.email || party.type}
                  </p>
                </div>
              ))}
            </div>

            {/* Terms */}
            {Object.keys(selectedContract.terms).length > 0 && (
              <div className="mb-6">
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700, margin: '0 0 8px 0', textTransform: 'uppercase' }}>
                  Terms
                </p>
                {Object.entries(selectedContract.terms).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between py-1.5 text-xs border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>{key.replace(/_/g, ' ')}</span>
                    <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Conditions */}
            {selectedContract.conditions && (
              <div className="mb-6">
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700, margin: '0 0 8px 0', textTransform: 'uppercase' }}>
                  Conditions
                </p>
                <ul style={{ margin: 0, paddingLeft: 16, color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>
                  {selectedContract.conditions.map((cond, idx) => (
                    <li key={idx} style={{ margin: '4px 0' }}>{cond}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              {selectedContract.status === 'generated' && (
                <button
                  onClick={() => {
                    handleStatusChange(selectedContract.id, 'sent');
                    setSelectedContract(null);
                  }}
                  className="flex-1 px-4 py-2 rounded-lg font-semibold text-white transition-all"
                  style={{ background: 'rgba(251,158,60,0.2)', color: '#f59e0b', border: '1px solid rgba(251,158,60,0.3)' }}
                >
                  Send Contract
                </button>
              )}

              {selectedContract.status === 'sent' && (
                <button
                  onClick={() => {
                    handleStatusChange(selectedContract.id, 'signed');
                    setSelectedContract(null);
                  }}
                  className="flex-1 px-4 py-2 rounded-lg font-semibold text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                >
                  Mark as Signed
                </button>
              )}
            </div>
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