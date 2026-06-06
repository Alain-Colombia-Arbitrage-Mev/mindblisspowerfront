import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Brain, CheckCircle, Loader2 } from 'lucide-react';

export default function AIReasoningPanel({ node, onClose, onExecute }) {
  const [executing, setExecuting] = useState(false);

  const handleExecute = async () => {
    setExecuting(true);
    await new Promise(r => setTimeout(r, 1500));
    onExecute();
    setExecuting(false);
  };

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className="w-80 flex-shrink-0 rounded-xl overflow-hidden flex flex-col"
      style={{ background: 'rgba(8,18,40,0.8)', border: '1px solid rgba(139,92,246,0.25)', backdropFilter: 'blur(10px)' }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(139,92,246,0.2)' }}>
        <p style={{ color: '#8b5cf6', fontSize: 9, fontWeight: 900, letterSpacing: 1, margin: 0, textTransform: 'uppercase' }}>
          IA Análisis
        </p>
        <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded transition-all">
          <X size={14} style={{ color: 'rgba(255,255,255,0.5)' }} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* AI Reasoning */}
        <div className="p-3 rounded-lg space-y-3" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Brain size={14} style={{ color: '#8b5cf6' }} />
            <p style={{ color: '#8b5cf6', fontSize: 10, fontWeight: 700, margin: 0 }}>RAZONAMIENTO IA</p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-2 rounded"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, lineHeight: 1.5, margin: 0 }}>
              <strong>Análisis detectado:</strong> Red en {node.name} muestra desbalance del 67%. Recomendación: asignar asesor para redistribución de línea izquierda.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-2 rounded"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, lineHeight: 1.5, margin: 0 }}>
              <strong>Confianza:</strong> 89% · Basado en patrones históricos y métricas de red similares.
            </p>
          </motion.div>
        </div>

        {/* Decision */}
        <div className="p-3 rounded-lg" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
          <p style={{ color: '#10b981', fontSize: 10, fontWeight: 700, margin: '0 0 8px' }}>DECISIÓN RECOMENDADA</p>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, lineHeight: 1.5, margin: 0 }}>
            ✓ Asignar María García como mentora
            <br />
            ✓ Marcar como Alta prioridad
            <br />
            ✓ Agendar revisión en 7 días
          </p>
        </div>

        {/* Confidence */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <div className="flex-1">
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, margin: 0 }}>Nivel de confianza</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '89%' }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="h-full rounded-full"
                  style={{ background: '#8b5cf6' }}
                />
              </div>
              <span style={{ color: '#8b5cf6', fontSize: 11, fontWeight: 700 }}>89%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex gap-2 p-4 border-t" style={{ borderColor: 'rgba(139,92,246,0.2)' }}>
        <button
          onClick={onClose}
          className="flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
        >
          Rechazar
        </button>
        <button
          onClick={handleExecute}
          disabled={executing}
          className="flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
          style={{
            background: executing ? 'rgba(139,92,246,0.4)' : 'rgba(139,92,246,0.2)',
            color: '#8b5cf6',
            opacity: executing ? 0.7 : 1,
          }}
        >
          {executing ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />}
          {executing ? 'Ejecutando...' : 'Ejecutar IA'}
        </button>
      </div>
    </motion.div>
  );
}