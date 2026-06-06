import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Shield, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import dataConsistency from '@/lib/DataConsistencyHelper';

export default function InterventionPanel({ node, onClose, onApply }) {
  const [advisor, setAdvisor] = useState('');
  const [priority, setPriority] = useState('normal');
  const [isExecuting, setIsExecuting] = useState(false);

  const handleApply = async () => {
    setIsExecuting(true);
    await new Promise(r => setTimeout(r, 1200));
    // Update unified data
    if (node?.id) {
      dataConsistency.applyIntervention(node.id, advisor, priority);
    }
    onApply({ advisor, priority });
    setIsExecuting(false);
  };

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className="w-80 flex-shrink-0 rounded-xl overflow-hidden flex flex-col"
      style={{ background: 'rgba(8,18,40,0.8)', border: '1px solid rgba(239,68,68,0.25)', backdropFilter: 'blur(10px)' }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
        <p style={{ color: '#ef4444', fontSize: 9, fontWeight: 900, letterSpacing: 1, margin: 0, textTransform: 'uppercase' }}>
          Intervención Manual
        </p>
        <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded transition-all">
          <X size={14} style={{ color: 'rgba(255,255,255,0.5)' }} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {/* Node Info */}
        <div className="p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <p style={{ color: 'white', fontSize: 12, fontWeight: 700, margin: 0 }}>{node.name}</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '2px 0 0' }}>{node.country} · {node.members} miembros</p>
        </div>

        {/* Assign Advisor */}
        <div>
          <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 600, display: 'block', marginBottom: 6 }}>
            Asignar Asesor
          </label>
          <select
            value={advisor}
            onChange={e => setAdvisor(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-xs text-white"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <option value="">Seleccionar asesor...</option>
            <option value="carlos">Carlos López</option>
            <option value="maria">María García</option>
            <option value="juan">Juan Rodríguez</option>
          </select>
        </div>

        {/* Priority */}
        <div>
          <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 600, display: 'block', marginBottom: 6 }}>
            Prioridad
          </label>
          <div className="flex gap-2">
            {['normal', 'high', 'critical'].map(p => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className="flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all"
                style={{
                  background: priority === p ? (p === 'critical' ? 'rgba(239,68,68,0.3)' : p === 'high' ? 'rgba(251,146,60,0.3)' : 'rgba(59,130,246,0.3)') : 'rgba(255,255,255,0.06)',
                  color: priority === p ? (p === 'critical' ? '#ef4444' : p === 'high' ? '#fb923c' : '#3b82f6') : 'rgba(255,255,255,0.5)',
                  border: `1px solid ${priority === p ? (p === 'critical' ? 'rgba(239,68,68,0.4)' : p === 'high' ? 'rgba(251,146,60,0.4)' : 'rgba(59,130,246,0.4)') : 'rgba(255,255,255,0.12)'}`
                }}
              >
                {p === 'normal' ? 'Normal' : p === 'high' ? 'Alta' : 'Crítica'}
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="p-3 rounded-lg" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: 700, margin: '0 0 6px' }}>RESUMEN DE ACCIÓN</p>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, lineHeight: 1.6 }}>
            <p style={{ margin: '0 0 3px' }}>📋 Asesor: <strong style={{ color: 'white' }}>{advisor || 'Sin asignar'}</strong></p>
            <p style={{ margin: '0 0 3px' }}>⚡ Prioridad: <strong style={{ color: 'white' }}>{priority === 'normal' ? 'Normal' : priority === 'high' ? 'Alta' : 'Crítica'}</strong></p>
            <p style={{ margin: 0 }}>🎯 Nodo: <strong style={{ color: 'white' }}>{node.name}</strong></p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex gap-2 p-4 border-t" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
        <button
          onClick={onClose}
          className="flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
        >
          Cancelar
        </button>
        <button
          onClick={handleApply}
          disabled={!advisor || isExecuting}
          className="flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
          style={{
            background: isExecuting ? 'rgba(239,68,68,0.4)' : 'rgba(239,68,68,0.2)',
            color: '#ef4444',
            opacity: (!advisor || isExecuting) ? 0.6 : 1,
          }}
        >
          {isExecuting ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />}
          {isExecuting ? 'Ejecutando...' : 'Aplicar'}
        </button>
      </div>
    </motion.div>
  );
}