import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Radar, AlertTriangle, TrendingDown, Users } from 'lucide-react';

export default function NetworkAuditScan({ node, onClose }) {
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setScanning(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const risks = [
    { label: 'Desbalance de línea', value: '67%', severity: 'high' },
    { label: 'Miembros inactivos', value: '34%', severity: 'medium' },
    { label: 'Falta de actividad', value: '12 días', severity: 'high' },
  ];

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className="w-80 flex-shrink-0 rounded-xl overflow-hidden flex flex-col"
      style={{ background: 'rgba(8,18,40,0.8)', border: '1px solid rgba(251,146,60,0.25)', backdropFilter: 'blur(10px)' }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(251,146,60,0.2)' }}>
        <p style={{ color: '#fb923c', fontSize: 9, fontWeight: 900, letterSpacing: 1, margin: 0, textTransform: 'uppercase' }}>
          Auditoría de Red
        </p>
        <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded transition-all">
          <X size={14} style={{ color: 'rgba(255,255,255,0.5)' }} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Scanning */}
        {scanning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-8"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
              style={{ border: '2px solid rgba(251,146,60,0.3)', borderTop: '2px solid #fb923c' }}
            />
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600 }}>Escaneando red...</p>
          </motion.div>
        )}

        {/* Results */}
        {!scanning && (
          <>
            {/* Risk Summary */}
            <div className="p-3 rounded-lg" style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.15)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Radar size={14} style={{ color: '#fb923c' }} />
                <p style={{ color: '#fb923c', fontSize: 11, fontWeight: 700, margin: 0 }}>RIESGOS DETECTADOS</p>
              </div>
              <div className="space-y-2">
                {risks.map((risk, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center justify-between p-2 rounded"
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                  >
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>{risk.label}</span>
                    <span className="px-2 py-0.5 rounded text-xs font-bold" style={{
                      background: risk.severity === 'high' ? 'rgba(239,68,68,0.2)' : 'rgba(251,146,60,0.2)',
                      color: risk.severity === 'high' ? '#ef4444' : '#fb923c'
                    }}>
                      {risk.value}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Network Stats */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Users, label: 'Activos', value: '24/34', color: '#10b981' },
                { icon: TrendingDown, label: 'Inactivos', value: '10/34', color: '#ef4444' },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="p-3 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${stat.color}30` }}
                  >
                    <Icon size={13} style={{ color: stat.color, marginBottom: 4 }} />
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, margin: '0 0 2px' }}>{stat.label}</p>
                    <p style={{ color: 'white', fontSize: 13, fontWeight: 700, margin: 0 }}>{stat.value}</p>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <div className="flex-shrink-0 p-4 border-t" style={{ borderColor: 'rgba(251,146,60,0.2)' }}>
        <button
          onClick={onClose}
          className="w-full px-3 py-2 rounded-lg text-xs font-bold transition-all"
          style={{ background: 'rgba(251,146,60,0.15)', color: '#fb923c' }}
        >
          Cerrar Auditoría
        </button>
      </div>
    </motion.div>
  );
}