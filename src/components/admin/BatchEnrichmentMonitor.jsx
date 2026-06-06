import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import platformDataCore from '@/lib/platformDataCore';
import BatchMemberEnricher from '@/lib/BatchMemberEnricher';

export default function BatchEnrichmentMonitor() {
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState(null);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [results, setResults] = useState([]);
  const enricherRef = useRef(null);

  useEffect(() => {
    if (!enricherRef.current) {
      enricherRef.current = new BatchMemberEnricher(platformDataCore);
    }
  }, []);

  const startEnrichment = async () => {
    if (!enricherRef.current) return;
    
    setIsRunning(true);
    const totalBatches = Math.ceil(platformDataCore.users.length / 25);

    for (let i = currentBatch; i < totalBatches && isRunning; i++) {
      const result = enricherRef.current.processBatch(i);
      if (result.success) {
        setResults(prev => [...prev, result]);
        setCurrentBatch(i + 1);
        setStatus(result.overallStats);
      } else {
        break;
      }
      // Safe pause between batches
      await new Promise(r => setTimeout(r, 200));
    }

    setIsRunning(false);
  };

  const pauseEnrichment = () => {
    setIsRunning(false);
  };

  const resetEnrichment = () => {
    enricherRef.current = new BatchMemberEnricher(platformDataCore);
    setCurrentBatch(0);
    setResults([]);
    setStatus(null);
    setIsRunning(false);
  };

  return (
    <div className="p-6 space-y-6" style={{ background: '#0F1419', minHeight: '100vh' }}>
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 style={{ color: 'white', fontSize: 24, fontWeight: 900, margin: '0 0 4px 0' }}>
            Batch Member Enrichment
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>
            Progressive 183-member network enrichment — Safe batching, no render blocking
          </p>
        </div>
        <div className="flex gap-2">
          {!isRunning ? (
            <button
              onClick={startEnrichment}
              className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all"
              style={{ background: 'linear-gradient(135deg, #1d6ef5, #3b82f6)', color: 'white' }}
            >
              <Play size={14} /> Start Enrichment
            </button>
          ) : (
            <button
              onClick={pauseEnrichment}
              className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
              style={{ background: 'rgba(251,146,60,0.2)', color: '#fb923c' }}
            >
              <Pause size={14} /> Pause
            </button>
          )}
          {results.length > 0 && (
            <button
              onClick={resetEnrichment}
              className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}
            >
              Reset
            </button>
          )}
        </div>
      </motion.div>

      {/* OVERALL PROGRESS */}
      {status && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-6 gap-3"
        >
          {[
            { label: 'Enriched', value: status.enrichedCount, color: '#10b981' },
            { label: 'Remaining', value: status.totalMembers - status.enrichedCount, color: '#ef4444' },
            { label: 'With Email', value: status.withEmail, color: '#3b82f6' },
            { label: 'With Phone', value: status.withPhone, color: '#8b5cf6' },
            { label: 'With Upline', value: status.withUpline, color: '#fb923c' },
            { label: 'Avg Investment', value: `$${status.averageInvestment}`, color: '#06b6d4' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.02 }}
              className="p-4 rounded-lg"
              style={{
                background: '#121821',
                border: '1px solid #1F2A37',
              }}
            >
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 600, margin: '0 0 8px 0' }}>
                {stat.label}
              </p>
              <p style={{ color: stat.color, fontSize: 18, fontWeight: 900, margin: 0 }}>
                {stat.value}
              </p>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* BATCH RESULTS */}
      {results.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Zap size={16} style={{ color: '#10b981' }} />
            <h2 style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: 0 }}>
              Batch Progress: {currentBatch} / {Math.ceil(platformDataCore.users.length / 25)}
            </h2>
          </div>

          <div className="space-y-2">
            {results.map((result, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 rounded-lg"
                style={{
                  background: '#121821',
                  border: '1px solid #1F2A37',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} style={{ color: '#10b981' }} />
                    <span style={{ color: 'white', fontWeight: 600 }}>
                      Batch {result.batchNumber} — {result.processed} members
                    </span>
                  </div>
                  <span style={{ color: '#10b981', fontSize: 12, fontWeight: 700 }}>
                    ✓ Complete
                  </span>
                </div>

                <div className="grid grid-cols-6 gap-2 text-xs">
                  {[
                    { label: 'Email', value: result.stats.withEmail },
                    { label: 'Phone', value: result.stats.withPhone },
                    { label: 'Upline', value: result.stats.withUpline },
                    { label: 'Avg Inv', value: `$${result.stats.avgInvestment}` },
                    { label: 'Ranks', value: Object.keys(result.stats.rankDistribution).length },
                    { label: 'Active', value: `${result.processed}/${result.processed}` },
                  ].map((item, i) => (
                    <div key={i} style={{ padding: '6px 8px', background: 'rgba(255,255,255,0.04)', borderRadius: 4 }}>
                      <p style={{ color: 'rgba(255,255,255,0.5)', margin: '0 0 2px 0', fontSize: 9 }}>
                        {item.label}
                      </p>
                      <p style={{ color: 'white', fontWeight: 700, margin: 0 }}>
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Rank distribution */}
                {Object.entries(result.stats.rankDistribution).length > 0 && (
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: 10 }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>
                      Ranks: {Object.entries(result.stats.rankDistribution).map(([rank, count]) => 
                        `${rank}(${count})`
                      ).join(' • ')}
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* NO RESULTS STATE */}
      {results.length === 0 && !isRunning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-12 rounded-lg text-center"
          style={{
            background: 'rgba(59,130,246,0.1)',
            border: '1px solid rgba(59,130,246,0.2)',
          }}
        >
          <AlertCircle size={24} style={{ color: 'rgba(255,255,255,0.3)', margin: '0 auto 12px' }} />
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>
            Ready to enrich {platformDataCore.users.length} members in safe batches of 25.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: '6px 0 0 0' }}>
            Click "Start Enrichment" to begin progressive enrichment.
          </p>
        </motion.div>
      )}

      {/* VALIDATION NOTES */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 rounded-lg text-xs"
        style={{
          background: 'rgba(16,185,129,0.1)',
          border: '1px solid rgba(16,185,129,0.2)',
        }}
      >
        <p style={{ color: '#10b981', fontWeight: 700, margin: '0 0 4px 0' }}>✓ Validation Rules Active:</p>
        <ul style={{ color: 'rgba(255,255,255,0.6)', margin: 0, paddingLeft: 16 }}>
          <li>Investment distribution: 2-3 at $25k, minority at $15k, moderate at $10k, majority at $5k-$7k</li>
          <li>Average investment maintained between $3,500-$7,000</li>
          <li>Rank assignment based on investment + descendants</li>
          <li>All members have upline_id + binary_side + generation_depth</li>
          <li>No orphan members allowed</li>
        </ul>
      </motion.div>
    </div>
  );
}