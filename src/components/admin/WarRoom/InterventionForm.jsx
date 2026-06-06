import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';

const INTERVENTION_TYPES = ['capacitación', 'auditoría', 'seguimiento', 'cambio_asesor', 'suspensión_temporal', 'otro'];
const PRIORITIES = ['baja', 'media', 'alta', 'crítica'];

export default function InterventionForm({ node, onClose, onExecute }) {
  const [formData, setFormData] = useState({
    priority: 'media',
    type: 'capacitación',
    advisor: '',
    notes: '',
  });
  const [executed, setExecuted] = useState(false);

  const handleExecute = () => {
    // Guard: advisor must be set
    if (!formData.advisor?.trim()) {
      alert('Selecciona un asesor');
      return;
    }
    
    // Execute intervention
    onExecute({
      ...formData,
      user_id: node.id,
      user_name: node.name,
      timestamp: new Date().toISOString(),
      status: 'active',
    });
    
    // Show success state
    setExecuted(true);
    setTimeout(() => onClose(), 2500);
  };

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className="w-80 flex-shrink-0 flex flex-col rounded-xl overflow-hidden"
      style={{
        background: 'rgba(4,10,22,0.8)',
        border: '1px solid rgba(239,68,68,0.25)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
        <p style={{ color: '#ef4444', fontSize: 9, fontWeight: 900, margin: 0, textTransform: 'uppercase' }}>
          Intervención Manual
        </p>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded transition-all">
          <X size={14} style={{ color: 'rgba(255,255,255,0.5)' }} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {/* USER INFO */}
        <div className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, margin: 0, fontWeight: 600 }}>Usuario</p>
          <p style={{ color: 'white', fontSize: 12, fontWeight: 700, margin: '2px 0 0 0' }}>{node.name}</p>
        </div>

        {/* PRIORITY */}
        <div>
          <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: 700, display: 'block', marginBottom: 6 }}>
            Prioridad
          </label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            className="w-full px-2 py-2 rounded-lg text-xs font-bold bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p} style={{ background: '#0a1628', color: 'white' }}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* INTERVENTION TYPE */}
        <div>
          <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: 700, display: 'block', marginBottom: 6 }}>
            Tipo de Intervención
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-2 py-2 rounded-lg text-xs font-bold bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
          >
            {INTERVENTION_TYPES.map((t) => (
              <option key={t} value={t} style={{ background: '#0a1628', color: 'white' }}>
                {t.replace(/_/g, ' ').charAt(0).toUpperCase() + t.replace(/_/g, ' ').slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* ADVISOR */}
        <div>
          <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: 700, display: 'block', marginBottom: 6 }}>
            Asesor Asignado
          </label>
          <select
            value={formData.advisor}
            onChange={(e) => setFormData({ ...formData, advisor: e.target.value })}
            className="w-full px-2 py-2 rounded-lg text-xs font-bold bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="" style={{ background: '#0a1628', color: 'rgba(255,255,255,0.5)' }}>-- Selecciona asesor --</option>
            <option value="Sistema Automático" style={{ background: '#0a1628', color: 'white' }}>Sistema Automático</option>
            <option value="Carlos Mendoza" style={{ background: '#0a1628', color: 'white' }}>Carlos Mendoza</option>
            <option value="María Rodríguez" style={{ background: '#0a1628', color: 'white' }}>María Rodríguez</option>
            <option value="Roberto Díaz" style={{ background: '#0a1628', color: 'white' }}>Roberto Díaz</option>
          </select>
        </div>

        {/* NOTES */}
        <div>
          <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: 700, display: 'block', marginBottom: 6 }}>
            Notas
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Detalles de la intervención..."
            rows="3"
            className="w-full px-2 py-2 rounded-lg text-xs bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>

        {/* EXECUTION STATUS */}
        {executed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3 rounded-lg flex items-start gap-2"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}
          >
            <CheckCircle2 size={14} style={{ color: '#10b981', flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ color: '#10b981', fontSize: 10, fontWeight: 700, margin: 0 }}>Intervención Registrada</p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, margin: '2px 0 0 0' }}>
                Asesor notificado · Seguimiento agendado
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* FOOTER */}
      <div className="flex-shrink-0 flex items-center gap-2 px-4 py-3 border-t" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
        <button
          onClick={onClose}
          className="flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all"
          style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          Cancelar
        </button>
        <button
          onClick={handleExecute}
          disabled={executed}
          className="flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all"
          style={{
            background: executed ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            color: executed ? '#10b981' : '#ef4444',
            border: executed ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(239,68,68,0.3)',
            opacity: executed ? 0.8 : 1,
          }}
        >
          {executed ? 'Completado' : 'Ejecutar'}
        </button>
      </div>
    </motion.div>
  );
}