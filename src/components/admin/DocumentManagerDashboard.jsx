import { useState, useEffect } from 'react';
import { Search, Filter, Archive, Eye, Download, Trash2, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import DocumentManager from '@/lib/DocumentManager';
import { motion } from 'framer-motion';

export default function DocumentManagerDashboard() {
  const [documents, setDocuments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    category: '',
  });

  const docManager = DocumentManager.getInstance();

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    filterDocuments();
  }, [documents, searchQuery, filters]);

  const loadDocuments = () => {
    const allDocs = docManager.getAllDocuments();
    setDocuments(allDocs);
    setStats(docManager.getStatistics());
  };

  const filterDocuments = () => {
    let results = documents;

    if (searchQuery.trim()) {
      results = docManager.searchDocuments(searchQuery);
    } else {
      const activeFilters = Object.entries(filters).reduce((acc, [key, val]) => {
        if (val) acc[key] = val;
        return acc;
      }, {});

      if (Object.keys(activeFilters).length > 0) {
        results = docManager.filterDocuments(activeFilters);
      }
    }

    setFiltered(results);
  };

  const handleArchive = (docId) => {
    docManager.archiveDocument(docId);
    loadDocuments();
  };

  const handleDelete = (docId) => {
    docManager.deleteDocument(docId);
    loadDocuments();
  };

  const handleStatusUpdate = (docId, newStatus) => {
    docManager.updateDocumentStatus(docId, newStatus);
    loadDocuments();
  };

  if (!stats) {
    return <div style={{ color: 'rgba(255,255,255,0.4)' }}>Loading documents...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 style={{ color: 'white', fontSize: 20, fontWeight: 900, margin: 0 }}>Document Manager</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '4px 0 0 0' }}>
          Manage all contracts, agreements, compliance records, and internal documents
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Documents" value={stats.totalDocuments} color="#3b82f6" />
        <StatCard label="Active" value={stats.activeDocuments} color="#10b981" />
        <StatCard label="Signed" value={stats.signedDocuments} color="#10b981" />
        <StatCard label="Pending" value={stats.pendingSignatures} color="#fb923c" />
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
          <input
            type="text"
            placeholder="Search documents by title, participant, or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <FilterSelect
            label="Type"
            value={filters.type}
            onChange={(val) => setFilters(prev => ({ ...prev, type: val }))}
            options={['contract', 'agreement', 'compliance_record', 'internal_document']}
          />
          <FilterSelect
            label="Status"
            value={filters.status}
            onChange={(val) => setFilters(prev => ({ ...prev, status: val }))}
            options={['draft', 'generated', 'sent', 'signed', 'archived']}
          />
          <FilterSelect
            label="Category"
            value={filters.category}
            onChange={(val) => setFilters(prev => ({ ...prev, category: val }))}
            options={['participation', 'investment', 'service', 'legal', 'compliance', 'audit', 'other']}
          />
        </div>
      </div>

      {/* Documents Table */}
      <div className="rounded-lg overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Title</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Type</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Participant</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Generated</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '32px 16px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                    No documents found
                  </td>
                </tr>
              ) : (
                filtered.map((doc, idx) => (
                  <motion.tr
                    key={doc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                    onClick={() => setSelectedDoc(doc)}
                    className="hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div className="flex items-center gap-2">
                        <FileText size={14} style={{ color: 'rgba(59,130,246,0.6)' }} />
                        <span style={{ fontWeight: 600 }}>{doc.title}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>
                        {doc.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.6)' }}>
                      {doc.participant_email || '—'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <StatusBadge status={doc.status} />
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                      {new Date(doc.generated_date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDoc(doc);
                          }}
                          className="p-1 rounded hover:bg-white/10"
                          title="View"
                        >
                          <Eye size={14} style={{ color: 'rgba(59,130,246,0.6)' }} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchive(doc.id);
                          }}
                          className="p-1 rounded hover:bg-white/10"
                          title="Archive"
                        >
                          <Archive size={14} style={{ color: 'rgba(251,146,60,0.6)' }} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(doc.id);
                          }}
                          className="p-1 rounded hover:bg-white/10"
                          title="Delete"
                        >
                          <Trash2 size={14} style={{ color: 'rgba(239,68,68,0.6)' }} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Detail Modal */}
      {selectedDoc && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setSelectedDoc(null)}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <div className="p-6 space-y-4">
              <h2 style={{ color: 'white', fontSize: 16, fontWeight: 900, margin: 0 }}>
                {selectedDoc.title}
              </h2>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <InfoBlock label="Type" value={selectedDoc.type.replace(/_/g, ' ')} />
                <InfoBlock label="Status" value={<StatusBadge status={selectedDoc.status} />} />
                <InfoBlock label="Category" value={selectedDoc.category} />
                <InfoBlock label="Version" value={selectedDoc.version} />
                <InfoBlock label="Generated" value={new Date(selectedDoc.generated_date).toLocaleString()} />
                {selectedDoc.signed_date && (
                  <InfoBlock label="Signed" value={new Date(selectedDoc.signed_date).toLocaleString()} />
                )}
                {selectedDoc.participant_email && (
                  <InfoBlock label="Participant" value={selectedDoc.participant_email} />
                )}
                {selectedDoc.participant_id && (
                  <InfoBlock label="Participant ID" value={selectedDoc.participant_id} />
                )}
              </div>

              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Content Preview
                </label>
                <div
                  className="p-3 rounded max-h-40 overflow-y-auto text-xs whitespace-pre-wrap font-mono"
                  style={{ background: 'rgba(0,0,0,0.3)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  {selectedDoc.content?.slice(0, 500)}...
                </div>
              </div>

              {selectedDoc.status !== 'signed' && selectedDoc.status !== 'archived' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      handleStatusUpdate(selectedDoc.id, 'signed');
                      setSelectedDoc(null);
                    }}
                    className="flex-1 px-3 py-2 rounded text-xs font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                  >
                    Mark as Signed
                  </button>
                  <button
                    onClick={() => setSelectedDoc(null)}
                    className="px-3 py-2 rounded text-xs font-semibold transition-all"
                    style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Document Type Distribution */}
      <div className="grid grid-cols-2 gap-6">
        <div className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 style={{ color: 'white', fontSize: 12, fontWeight: 700, margin: '0 0 12px 0' }}>By Type</h3>
          <div className="space-y-2">
            {Object.entries(stats.byType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between text-xs">
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>{type.replace(/_/g, ' ')}</span>
                <span style={{ color: 'white', fontWeight: 600 }}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 style={{ color: 'white', fontSize: 12, fontWeight: 700, margin: '0 0 12px 0' }}>By Status</h3>
          <div className="space-y-2">
            {Object.entries(stats.byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between text-xs">
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>{status}</span>
                <span style={{ color: 'white', fontWeight: 600 }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="p-4 rounded-lg" style={{ background: `${color}12`, border: `1px solid ${color}30` }}>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, margin: 0 }}>{label}</p>
      <p style={{ color, fontSize: 18, fontWeight: 900, margin: '4px 0 0 0' }}>{value}</p>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div>
      <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 600, display: 'block', marginBottom: 4 }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded text-xs"
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }}
      >
        <option value="">All {label}</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>
        ))}
      </select>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    draft: '#9ca3af',
    generated: '#3b82f6',
    sent: '#fb923c',
    signed: '#10b981',
    archived: '#6b7280',
  };

  const icons = {
    draft: Clock,
    generated: FileText,
    sent: AlertCircle,
    signed: CheckCircle,
    archived: Archive,
  };

  const Icon = icons[status] || FileText;

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold" style={{ background: `${colors[status]}20`, color: colors[status] }}>
      <Icon size={10} />
      {status}
    </span>
  );
}

function InfoBlock({ label, value }) {
  return (
    <div>
      <p style={{ color: 'rgba(255,255,255,0.4)', margin: '0 0 4px 0' }}>{label}</p>
      <p style={{ color: 'white', fontWeight: 600, margin: 0 }}>{value}</p>
    </div>
  );
}